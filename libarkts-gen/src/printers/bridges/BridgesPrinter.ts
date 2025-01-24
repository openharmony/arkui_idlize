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
    convertType,
    CppLanguageWriter,
    createEmptyReferenceResolver,
    IDLContainerType,
    IDLContainerUtils,
    IDLKind,
    IDLMethod,
    IDLReferenceType,
    IDLPointerType,
    IndentedPrinter,
    isContainerType,
    isPrimitiveType,
    isReferenceType,
    isVoidType,
    MethodSignature,
    PrimitiveType,
    PrimitiveTypeList,
    throwException,
    LanguageExpression
} from "@idlize/core"
import { IDLParameter, IDLPrimitiveType, IDLType, } from "@idlize/core/idl"
import { NativeTypeConvertor } from "./NativeTypeConvertor"
import { BridgesConstructions } from "./BridgesConstructions"
import { InteropPrinter } from "../InteropPrinter"
import { IDLFile } from "../../IdlFile"
import { Config } from "../../Config"

function isString(node: IDLType): node is IDLPrimitiveType {
    return isPrimitiveType(node) && node.name === "String"
}

export class BridgesPrinter extends InteropPrinter {
    constructor(idl: IDLFile, config: Config) {
        super(idl, config)
    }

    private convertor = new NativeTypeConvertor(this.idl.entries)

    private writer = new CppLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => this.mapType(node) },
        new class extends PrimitiveTypeList {
            Undefined = new PrimitiveType(`undefined`)
            Void: PrimitiveType = new PrimitiveType(`void`)
        }()
    )

    private printInteropMacro(node: IDLMethod): void {
        const isVoid = isVoidType(node.returnType)
        this.writer.writeExpressionStatement(
            this.writer.makeFunctionCall(
                BridgesConstructions.interopMacro(isVoid, node.parameters.length),
                [node.name]
                    .concat(isVoid ? [] : this.mapType(isString(node.returnType) ? IDLPointerType : node.returnType))
                    .concat(node.parameters.map(it => this.mapType(it.type)))
                    .map(it => this.writer.makeString(it))
            )
        )
    }

    private cast(node: IDLParameter): string {
        if (isPrimitiveType(node.type)) {
            return BridgesConstructions.primitiveTypeCast(this.mapType(node.type)) // TODO: check
        }
        if (isReferenceType(node.type) || isContainerType(node.type)) {
            const castTo = this.castTo(node.type)
            if (castTo === undefined) {
                return ``
            }
            return BridgesConstructions.referenceTypeCast(castTo)
        }
        throw new Error(`Unsupported type: ${node.type}`)
    }

    private castTo(node: IDLReferenceType | IDLContainerType): string | undefined {
        if (isPrimitiveType(node)) {
            return undefined
        }
        if (isReferenceType(node)) {
            /* Temporary workaround until .idl is fixed */
            if (node.name === `es2panda_Context`) return `${node.name}*`
            if (node.name === `es2panda_AstNode`) return `${node.name}*`
            if (node.name === `es2panda_Impl`) return `${node.name}*`

            return `${BridgesConstructions.referenceType(node.name)}*`
        }
        if (isContainerType(node)) {
            if (IDLContainerUtils.isSequence(node)) {
                const typeParam = node.elementType[0]
                if (isContainerType(typeParam)) {
                    console.warn(`Warning: doing nothing for sequence<container>`)
                    return undefined
                }
                if (!isReferenceType(typeParam)) {
                    console.warn(`Warning: doing nothing for sequence<${JSON.stringify(typeParam)}>`)
                    return undefined
                }
                return `${BridgesConstructions.referenceType(typeParam.name)}**`
            }
        }

        throwException(`Unexpected type: ${IDLKind[node.kind]}`)
    }

    private mapType(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    override printMethod(node: IDLMethod): void {
        const transformReturnType = (type: IDLType) => {
            if (isString(type)) {
                return IDLPointerType
            }
            return type
        }
        this.writer.writeFunctionImplementation(
            BridgesConstructions.implFunction(node.name),
            new MethodSignature(
                transformReturnType(node.returnType),
                node.parameters.map(it => it.type),
                undefined,
                undefined,
                node.parameters.map(it => it.name)
            ),
            (writer) => this.printBody(writer, node)
        )
        this.printInteropMacro(node)
        this.writer.writeLines(``)
    }

    private makeFunctionCall(writer: CppLanguageWriter, node: IDLMethod): LanguageExpression {
        return writer.makeFunctionCall(
            BridgesConstructions.callMethod(node.name),
            node.parameters
                .map(it => ({
                    asString: () => BridgesConstructions.castedParameter(it.name),
                }))
                .concat(
                    IDLContainerUtils.isSequence(node.returnType)
                        ? writer.makeString(BridgesConstructions.sequenceLengthPass)
                        : []
                )
        )
    }

    private printBody(writer: CppLanguageWriter, node: IDLMethod): void {
        node.parameters
            .forEach(it => writer.writeStatement(
                writer.makeAssign(
                    BridgesConstructions.castedParameter(it.name),
                    undefined,
                    writer.makeFunctionCall(
                        this.cast(it),
                        [writer.makeString(it.name)]
                    )
                )
            ))
        if (IDLContainerUtils.isSequence(node.returnType)) {
            writer.writeExpressionStatement(
                writer.makeString(BridgesConstructions.sequenceLengthDeclaration)
            )
        }
        if (isVoidType(node.returnType)) {
            writer.writeExpressionStatement(
                this.makeFunctionCall(writer, node)
            )
            return
        }
        writer.writeStatement(
            writer.makeAssign(
                BridgesConstructions.result,
                undefined,
                this.makeFunctionCall(writer, node)
            )
        )
        writer.writeStatement(
            writer.makeReturn(
                writer.makeString(
                    this.wrapResultInConstructor(node.returnType)
                )
            )
        )
    }

    private wrapResultInConstructor(returnType: IDLType): string {
        if (IDLContainerUtils.isSequence(returnType)) return BridgesConstructions.sequenceConstructor(
            BridgesConstructions.result,
            BridgesConstructions.sequenceLengthUsage
        )
        if (isString(returnType)) return BridgesConstructions.stringConstructor(BridgesConstructions.result)

        return BridgesConstructions.result
    }

    override getOutput(): string[] {
        return this.writer.getOutput()
    }
}
