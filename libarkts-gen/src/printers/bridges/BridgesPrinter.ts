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
    IDLKind,
    IDLMethod,
    IDLPointerType,
    IDLReferenceType,
    IndentedPrinter,
    isContainerType,
    isPrimitiveType,
    isReferenceType,
    isVoidType,
    LanguageExpression,
    MethodSignature,
    PrimitiveType,
    PrimitiveTypeList,
    throwException
} from "@idlizer/core"
import { IDLParameter, IDLType } from "@idlizer/core/idl"
import { NativeTypeConvertor } from "./NativeTypeConvertor"
import { BridgesConstructions } from "./BridgesConstructions"
import { InteropPrinter } from "../InteropPrinter"
import { IDLFile } from "../../IdlFile"
import { Config } from "../../Config"
import { isSequence, isString } from "../../idl-utils"

export class BridgesPrinter extends InteropPrinter {
    constructor(idl: IDLFile, config: Config) {
        super(idl, config)
    }

    private convertor = new NativeTypeConvertor(this.idl.entries)

    override writer = new CppLanguageWriter(
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
                    .concat(isVoid
                        ? []
                        : this.mapType(
                            isString(node.returnType)
                                ? IDLPointerType
                                : node.returnType
                        )
                    )
                    .concat(node.parameters.map(it => this.mapType(it.type)))
                    .map(it => this.writer.makeString(it))
            )
        )
    }

    private cast(node: IDLParameter): string {
        if (isPrimitiveType(node.type)) {
            return BridgesConstructions.primitiveTypeCast(this.mapType(node.type))
        }
        if (this.convertor.isEnumReference(node.type)) {
            return BridgesConstructions.enumCast(node.type.name)
        }
        if (isReferenceType(node.type)) {
            return BridgesConstructions.referenceTypeCast(this.castToReference(node.type))
        }
        if (isContainerType(node.type)) {
            return BridgesConstructions.referenceTypeCast(this.castToContainer(node.type))
        }
        throwException(`Unsupported type: ${node.type}`)
    }

    private castToReference(node: IDLReferenceType): string {
        /* Temporary workaround until .idl is fixed */
        if (node.name === `es2panda_Context`) return `${node.name}*`
        if (node.name === `es2panda_AstNode`) return `${node.name}*`
        if (node.name === `es2panda_Impl`) return `${node.name}*`

        if (this.convertor.isHeir(node, Config.astNodeCommonAncestor)) {
            return BridgesConstructions.referenceType(Config.astNodeCommonAncestor)
        }
        return BridgesConstructions.referenceType(node.name)
    }

    private castToContainer(node: IDLContainerType): string {
        if (!isSequence(node)) {
            throwException(`Unexpected container type: ${IDLKind[node.kind]}`)
        }
        const typeParam = node.elementType[0]
        console.warn(`Warning: doing nothing for sequence<T>`)
        return ``
    }

    private mapType(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    override printMethod(node: IDLMethod): void {
        const mapReturnType = (type: IDLType) => {
            if (isString(type)) return IDLPointerType
            return type
        }
        this.writer.writeFunctionImplementation(
            BridgesConstructions.implFunction(node.name),
            new MethodSignature(
                mapReturnType(node.returnType),
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
                    isSequence(node.returnType)
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
        if (isSequence(node.returnType)) {
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
        writer.writeStatements(
            writer.makeAssign(
                BridgesConstructions.result,
                undefined,
                this.makeFunctionCall(writer, node)
            ),
            writer.makeReturn(
                writer.makeString(
                    this.wrapResultInConstructor(node.returnType)
                )
            )
        )
    }

    private wrapResultInConstructor(returnType: IDLType): string {
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
}
