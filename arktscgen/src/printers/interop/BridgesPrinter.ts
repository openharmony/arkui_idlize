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
import { clone, createReferenceType, IDLFile, IDLInterface, IDLType, IDLU32Type, isOptionalType } from "@idlizer/core/idl"
import { BridgesConstructions } from "../../constuctions/BridgesConstructions"
import { InteropPrinter } from "./InteropPrinter"
import { isSequence, isString } from "../../utils/idl"
import { ReturnTypeConvertor } from "../../type-convertors/interop/bridges/ReturnTypeConvertor"
import { InteropMacroTypeConvertor } from "../../type-convertors/interop/bridges/InteropMacroTypeConvertor"
import { NativeTypeConvertor } from "../../type-convertors/interop/bridges/NativeTypeConvertor"
import { CastTypeConvertor } from "../../type-convertors/interop/bridges/CastTypeConvertor"
import { Config } from "../../general/Config"
import { isCreateOrUpdate, mangleIfKeyword } from "../../general/common"
import { InteropConstructions } from "../../constuctions/InteropConstructions"
import { BaseType } from "typescript"
import { BaseTypeConvertor } from "../../type-convertors/BaseTypeConvertor"

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

    private printInteropMacro(methodName: string, signature: MethodSignature): void {
        this.writer.writeExpressionStatement(
            this.writer.makeFunctionCall(
                BridgesConstructions.interopMacro(isVoidType(signature.returnType), signature.args.length),
                [methodName]
                    .concat(
                        (() => {
                            if (isVoidType(signature.returnType)) {
                                return []
                            }
                            return [this.returnTypeConvertor.convertType(signature.returnType)]
                        })()
                            .concat(signature.args)
                            .map(it => this.interopMacroConvertor.convertType(it))
                    )
                    .map(it => this.writer.makeString(it))
            )
        )
    }

    protected printMethod(iface: IDLInterface, node: IDLMethod): void {
        const [methodName, signature] = BridgesPrinter.makeFunctionDeclaration(iface, node, this.returnTypeConvertor)
        this.writer.writeFunctionImplementation(
            BridgesConstructions.implFunction(methodName), signature,
            (_) => this.printBody(iface, node, signature)
        )
        this.printInteropMacro(methodName, signature)
        this.writer.writeLines(``)
    }

    public static makeFunctionDeclaration(iface: IDLInterface, node: IDLMethod, converter: BaseTypeConvertor<IDLType>): [string, MethodSignature] {
        const signature = new MethodSignature(
            converter.convertType(node.returnType),
            node.parameters.map(it => it.type),
            undefined,
            node.parameters.map(it => it.isOptional ? ArgumentModifier.OPTIONAL : undefined),
            undefined,
            node.parameters.map(it => mangleIfKeyword(it.name))
        )


        if (!isCreateOrUpdate(node.name)) {
            signature.args.splice(1, 0, createReferenceType(iface.name))
            signature.argNames!.splice(1, 0, 'receiver')
        }

        const fixArgName = (name: string, prev?: string) =>
            name.endsWith('Len') ? (prev ?? name.slice(0, -3)) + 'SequenceLength' : name === 'ctx' ? 'context' : name
        // Not necessary, just to keep old names
        signature.argNames = signature.argNames
            ?.map((v, i) => fixArgName(v, i === 0 ? undefined : signature.argNames![i - 1]))


        return [InteropConstructions.method(iface.name, node.name), signature]
    }


    private printBody(iface: IDLInterface, node: IDLMethod, signature: MethodSignature): void {
        this.printParameters(signature)
        this.printDeclarations(node)
        this.printEs2pandaCall(iface, node, signature)
        this.printReturn(node)
    }

    private printParameters(signature: MethodSignature): void {
        signature.args.forEach((type, index) => {
            const name = signature.argNames?.at(index) ?? `arg${index}`
             this.writer.writeStatement(
                this.writer.makeAssign(
                    BridgesConstructions.castedParameter(name),
                    undefined,
                    this.writer.makeFunctionCall(
                        this.castTypeConvertor.convertType(type),
                        [this.writer.makeString(name)]
                    )
                )
            )
        })
    }

    private printDeclarations(node: IDLMethod): void {
        if (isSequence(node.returnType)) {
            this.writer.writeExpressionStatement(
                this.writer.makeString(BridgesConstructions.sequenceLengthDeclaration)
            )
        }
    }

    private printEs2pandaCall(iface: IDLInterface, node: IDLMethod, signature: MethodSignature): void {
        if (isVoidType(node.returnType)) {
            this.writer.writeExpressionStatement(
                this.makeEs2pandaMethodCall(iface, node, signature)
            )
            return
        }
        this.writer.writeExpressionStatement(
            this.writer.makeString(
                BridgesConstructions.resultAssignment(
                    this.makeEs2pandaMethodCall(iface, node, signature).asString()
                )
            )
        )
    }

    private makeEs2pandaMethodCall(iface: IDLInterface, node: IDLMethod, signature: MethodSignature): LanguageExpression {
        let suffix = this.config.irHack.isIrHackInterface(iface.name) ? 'Ir' : ''
        let method = BridgesConstructions.callMethod(
            InteropConstructions.method(iface.name, node.name)
        )
        method = method.replace(iface.name, iface.name + suffix)
        return this.writer.makeFunctionCall(
            method,
            signature.argNames!
                .map(it => ({
                    asString: () => BridgesConstructions.castedParameter(it),
                }))
                .concat(
                    isSequence(node.returnType) // XXX: original return type
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
