/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    ArgumentModifier,
    CppLanguageWriter,
    createEmptyReferenceResolver,
    IDLMethod,
    IndentedPrinter,
    isVoidType,
    LanguageExpression,
    MethodSignature,
    PrimitiveType,
    PrimitiveTypeList
} from "@idlizer/core"
import { IDLFile, IDLInterface, IDLType, isOptionalType } from "@idlizer/core/idl"
import { BridgesConstructions } from "../../constuctions/BridgesConstructions"
import { InteropPrinter } from "./InteropPrinter"
import { isSequence, isString } from "../../utils/idl"
import { ReturnTypeConvertor } from "../../type-convertors/interop/bridges/ReturnTypeConvertor"
import { InteropMacroTypeConvertor } from "../../type-convertors/interop/bridges/InteropMacroTypeConvertor"
import { NativeTypeConvertor } from "../../type-convertors/interop/bridges/NativeTypeConvertor"
import { CastTypeConvertor } from "../../type-convertors/interop/bridges/CastTypeConvertor"
import { Config } from "../../general/Config"

export class BridgesPrinter extends InteropPrinter {
    constructor(private config: Config, file: IDLFile) {
        super(file)
    }

    private castTypeConvertor = new CastTypeConvertor(this.typechecker)

    private nativeTypeConvertor = new NativeTypeConvertor(this.typechecker)

    protected writer = new CppLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => this.nativeTypeConvertor.convertType(node) },
        new class extends PrimitiveTypeList {
            Undefined = new PrimitiveType(`undefined`)
            Void: PrimitiveType = new PrimitiveType(`void`)
        }()
    )

    private returnTypeConvertor = new ReturnTypeConvertor(this.typechecker)

    private interopMacroConvertor = new InteropMacroTypeConvertor(this.typechecker)

    private printInteropMacro(node: IDLMethod): void {
        this.writer.writeExpressionStatement(
            this.writer.makeFunctionCall(
                BridgesConstructions.interopMacro(isVoidType(node.returnType), node.parameters.length),
                [node.name]
                    .concat(
                        (() => {
                            if (isVoidType(node.returnType)) {
                                return []
                            }
                            return [this.returnTypeConvertor.convertType(node.returnType)]
                        })()
                            .concat(node.parameters.map(it => it.type))
                            .map(it => this.interopMacroConvertor.convertType(it))
                    )
                    .map(it => this.writer.makeString(it))
            )
        )
    }

    protected printMethod(iface: IDLInterface, node: IDLMethod): void {
        this.writer.writeFunctionImplementation(
            BridgesConstructions.implFunction(node.name),
            new MethodSignature(
                this.returnTypeConvertor.convertType(node.returnType),
                node.parameters.map(it => it.type),
                undefined,
                node.parameters.map(it => it.isOptional ? ArgumentModifier.OPTIONAL : undefined),
                undefined,
                node.parameters.map(it => it.name)
            ),
            (_) => this.printBody(iface, node)
        )
        this.printInteropMacro(node)
        this.writer.writeLines(``)
    }

    private printBody(iface: IDLInterface, node: IDLMethod): void {
        this.printParameters(node)
        this.printDeclarations(node)
        this.printEs2pandaCall(iface, node)
        this.printReturn(node)
    }

    private printParameters(node: IDLMethod): void {
        node.parameters
            .forEach(it => this.writer.writeStatement(
                this.writer.makeAssign(
                    BridgesConstructions.castedParameter(it.name),
                    undefined,
                    this.writer.makeFunctionCall(
                        this.castTypeConvertor.convertType(it.type),
                        [this.writer.makeString(it.name)]
                    )
                )
            ))
    }

    private printDeclarations(node: IDLMethod): void {
        if (isSequence(node.returnType)) {
            this.writer.writeExpressionStatement(
                this.writer.makeString(BridgesConstructions.sequenceLengthDeclaration)
            )
        }
    }

    private printEs2pandaCall(iface: IDLInterface, node: IDLMethod): void {
        if (isVoidType(node.returnType)) {
            this.writer.writeExpressionStatement(
                this.makeEs2pandaMethodCall(iface, node)
            )
            return
        }
        this.writer.writeExpressionStatement(
            this.writer.makeString(
                BridgesConstructions.resultAssignment(
                    this.makeEs2pandaMethodCall(iface, node).asString()
                )
            )
        )
    }

    private makeEs2pandaMethodCall(iface: IDLInterface, node: IDLMethod): LanguageExpression {
        let suffix = this.config.irHack.isIrHackInterface(iface.name) ? 'Ir' : ''
        let method = BridgesConstructions.callMethod(node.name)
        method = method.replace(iface.name, iface.name + suffix)
        return this.writer.makeFunctionCall(
            method,
            node.parameters
                .map(it => ({
                    asString: () => BridgesConstructions.castedParameter(it.name),
                }))
                .concat(
                    isSequence(node.returnType)
                        ? this.writer.makeString(BridgesConstructions.sequenceLengthPass)
                        : []
                )
        )
    }

    private printReturn(node: IDLMethod): void {
        if (isVoidType(node.returnType)) {
            this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeString(``)
                )
            )
            return
        }
        this.writer.writeStatement(
            this.writer.makeReturn(
                this.writer.makeString(
                    this.maybeDropConst(
                        this.makeReturnExpression(node.returnType),
                        node
                    )
                )
            )
        )
    }

    private makeReturnExpression(returnType: IDLType): string {
        if (isSequence(returnType)) {
            return BridgesConstructions.sequenceConstructor(
                BridgesConstructions.result,
                BridgesConstructions.sequenceLengthUsage
            )
        }
        if (isString(returnType)) {
            return BridgesConstructions.stringConstructor(BridgesConstructions.result)
        }

        return BridgesConstructions.result
    }

    private maybeDropConst(value: string, node: IDLMethod): string {
        if (this.typechecker.isConstReturnValue(node)) {
            return BridgesConstructions.dropConstCast(value)
        }
        return value
    }
}
