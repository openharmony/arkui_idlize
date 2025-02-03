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
    CppLanguageWriter,
    createEmptyReferenceResolver,
    IDLMethod, IDLPointerType,
    IndentedPrinter, isEnum, isPrimitiveType,
    isVoidType,
    LanguageExpression,
    MethodSignature,
    PrimitiveType,
    PrimitiveTypeList
} from "@idlizer/core"
import { IDLType } from "@idlizer/core/idl"
import { BridgesConstructions } from "./BridgesConstructions"
import { InteropPrinter } from "../InteropPrinter"
import { isSequence, isString } from "../../../idl-utils"
import { TypeMapper } from "./TypeMapper"

export class BridgesPrinter extends InteropPrinter {
    private typeMapper = new TypeMapper(this.idl)

    protected writer = new CppLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => this.typeMapper.toString(node) },
        new class extends PrimitiveTypeList {
            Undefined = new PrimitiveType(`undefined`)
            Void: PrimitiveType = new PrimitiveType(`void`)
        }()
    )

    private printInteropMacro(node: IDLMethod): void {
        this.writer.writeExpressionStatement(
            this.writer.makeFunctionCall(
                BridgesConstructions.interopMacro(isVoidType(node.returnType), node.parameters.length),
                [node.name]
                    .concat(
                        (() => {
                            if (isVoidType(node.returnType)) return []
                            if (isSequence(node.returnType)) return `KNativePointer`
                            if (isString(node.returnType)) return `KNativePointer`
                            return this.typeMapper.toString(node.returnType)
                        })()
                    )
                    .concat(node.parameters.map(it => this.typeMapper.toInteropMacro(it.type)))
                    .map(it => this.writer.makeString(it))
            )
        )
    }

    protected printMethod(node: IDLMethod): void {
        this.writer.writeFunctionImplementation(
            BridgesConstructions.implFunction(node.name),
            new MethodSignature(
                this.typeMapper.toReturn(node.returnType),
                node.parameters.map(it => it.type),
                undefined,
                undefined,
                node.parameters.map(it => it.name)
            ),
            (_) => this.printBody(node)
        )
        this.printInteropMacro(node)
        this.writer.writeLines(``)
    }

    private printBody(node: IDLMethod): void {
        this.printParameters(node)
        this.printDeclarations(node)
        this.printEs2pandaCall(node)
        this.printReturn(node)
    }

    private printParameters(node: IDLMethod): void {
        node.parameters
            .forEach(it => this.writer.writeStatement(
                this.writer.makeAssign(
                    BridgesConstructions.castedParameter(it.name),
                    undefined,
                    this.writer.makeFunctionCall(
                        this.typeMapper.cast(it),
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

    private printEs2pandaCall(node: IDLMethod): void {
        if (isVoidType(node.returnType)) {
            this.writer.writeExpressionStatement(
                this.makeEs2pandaMethodCall(node)
            )
            return
        }
        this.writer.writeExpressionStatement(
            this.writer.makeString(`auto ${BridgesConstructions.result} = ${this.makeEs2pandaMethodCall(node).asString()}`)
        )
    }

    private makeEs2pandaMethodCall(node: IDLMethod): LanguageExpression {
        return this.writer.makeFunctionCall(
            BridgesConstructions.callMethod(node.name),
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
                    this.maybeConstCast(
                        this.makeReturnValue(node.returnType),
                        node
                    )
                )
            )
        )
    }

    private makeReturnValue(returnType: IDLType): string {
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

    private maybeConstCast(x: string, node: IDLMethod): string {
        if (node.name.endsWith(`Const`) && !isPrimitiveType(node.returnType) && !this.typeMapper.typechecker.isReferenceTo(node.returnType, isEnum)) {
            return `(void*)${x}`
        }
        return x
    }

    private signatureNonVoidReturnType(node: IDLType): string {
        if (isSequence(node)) {
            return `KNativePointer`
        }
        if (isString(node)) {
            return `KNativePointer`
        }
        return this.typeMapper.toString(node)
    }
}
