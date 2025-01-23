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
    createMethod,
    createParameter,
    createReferenceType,
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
    isTypedef,
    isVoidType,
    MethodSignature,
    throwException
} from "@idlize/core"
import { IDLEntry, IDLInterface, IDLParameter, IDLPrimitiveType, IDLType, isEnum, isInterface, } from "@idlize/core/idl"
import { NativeTypeConvertor } from "../NativeTypeConvertor"
import { IDLFile } from "../Es2PandaTransformer"
import { Config } from "../Config"
import { PrimitiveTypes } from "./PrimitiveTypeList"
import { bridgesConstructions } from "./BridgesConstructions"

function isString(node: IDLType): node is IDLPrimitiveType {
    return isPrimitiveType(node) && node.name === "String"
}

export class BridgesPrinter {
    constructor(
        private idl: IDLFile,
        private config: Config
    ) { }

    private convertor = new NativeTypeConvertor(this.idl.entries)

    private constructions = bridgesConstructions

    private writer = new CppLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert : (node: IDLType) => this.mapType(node) },
        new PrimitiveTypes()
    )

    print(): string {
        this.idl.entries.forEach(it => this.visit(it))
        return this.writer.getOutput().join('\n')
    }

    private visit(node: IDLEntry): void {
        if (isInterface(node)) return this.visitInterface(node)
        if (isEnum(node)) return
        if (isTypedef(node)) return

        throwException(`Unexpected top-level node: ${IDLKind[node.kind]}`)
    }

    private visitInterface(node: IDLInterface): void {
        if (!this.config.shouldEmitInterface(node.name)) return
        node.methods
            .filter(it => this.config.shouldEmitMethod(it.name))
            .forEach(it => this.visitMethod(it, node))
    }

    private printInteropMacro(node: IDLMethod): void {
        const isVoid = isVoidType(node.returnType)
        this.writer.writeExpressionStatement(
            this.writer.makeFunctionCall(
                this.constructions.interopMacro(isVoid, node.parameters.length),
                [node.name]
                    .concat(isVoid ? [] : this.mapType(isString(node.returnType) ? IDLPointerType : node.returnType))
                    .concat(node.parameters.map(it => this.mapType(it.type)))
                    .map(it => this.writer.makeString(it))
            )
        )
    }

    private cast(node: IDLParameter): string {
        if (isPrimitiveType(node.type)) return this.constructions.primitiveTypeCast(this.mapType(node.type)) // TODO: check
        if (isReferenceType(node.type) || isContainerType(node.type)) {
            const castTo = this.castTo(node.type)
            return castTo === undefined
                ? ``
                : this.constructions.referenceTypeCast(castTo)
        }
        throw new Error(`Unsupported type: ${node.type}`)
    }

    private castTo(node: IDLReferenceType | IDLContainerType): string | undefined {
        if (isPrimitiveType(node)) return undefined
        if (isReferenceType(node)) {
            /* Temporary workaround until .idl is fixed */
            if (node.name === `es2panda_Context`) return `${node.name}*`
            if (node.name === `es2panda_AstNode`) return `${node.name}*`
            if (node.name === `es2panda_Impl`) return `${node.name}*`

            return `${this.constructions.referenceType(node.name)}*`
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
                return `${this.constructions.referenceType(typeParam.name)}**`
            }
        }

        throwException(`Unexpected type: ${IDLKind[node.kind]}`)
    }

    private mapType(node: IDLType): string {
        return convertType(this.convertor, node)
    }

    private visitMethod(node: IDLMethod, parent: IDLInterface): void {
        this.printFunction(this.transform(node, parent))
    }

    private printFunction(node: IDLMethod): void {
        this.writer.writeFunctionImplementation(
            this.constructions.implFunction(node.name),
            new MethodSignature(
                isString(node.returnType) ? IDLPointerType : node.returnType,
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

    private transform(node: IDLMethod, parent: IDLInterface): IDLMethod {
        node = this.withInsertedReceiver(node, parent)
        node = this.withSplitSequenceParameter(node)
        node = this.withQualifiedName(node, parent)
        return node
    }

    private withInsertedReceiver(node: IDLMethod, parent: IDLInterface): IDLMethod {
        const copy = createMethod(
            node.name,
            node.parameters,
            node.returnType
        )
        copy.parameters.splice(
            1,
            0,
            createParameter(
                this.constructions.receiverName,
                createReferenceType(parent.name)
            )
        )
        return copy
    }

    private withSplitSequenceParameter(node: IDLMethod): IDLMethod {
        const parameters = node.parameters
            .flatMap(it =>
                IDLContainerUtils.isSequence(it)
                    ? [
                        createParameter(
                            this.constructions.sequenceParameterPointer(it.name),
                            this.config.sequencePointerType
                        ),
                        createParameter(
                            this.constructions.sequenceParameterLength(it.name),
                            this.config.sequenceLengthType
                        )
                    ]
                    : it
            )
        return createMethod(
            node.name,
            parameters,
            node.returnType
        )
    }

    private withQualifiedName(node: IDLMethod, parent: IDLInterface): IDLMethod {
        return createMethod(
            `${this.config.methodFunction(parent.name, node.name)}`,
            node.parameters,
            node.returnType
        )
    }

    private printBody(writer: CppLanguageWriter, node: IDLMethod) {
        node.parameters
            .forEach(it => writer.writeStatement(
                writer.makeAssign(
                    this.constructions.castedParameterName(it.name),
                    undefined,
                    writer.makeFunctionCall(
                        this.cast(it),
                        [writer.makeString(it.name)]
                    )
                )
            ))
        if (IDLContainerUtils.isSequence(node.returnType)) {
            writer.writeExpressionStatement(
                writer.makeString(this.constructions.sequenceLengthDeclaration)
            )
        }
        writer.writeStatement(
            writer.makeAssign(
                this.constructions.resultName,
                undefined,
                writer.makeFunctionCall(
                    this.constructions.callMethod(node.name),
                    node.parameters
                        .map(it => ({
                            asString: () => this.constructions.castedParameterName(it.name),
                        }))
                        .concat(IDLContainerUtils.isSequence(node.returnType) ? writer.makeString(this.constructions.sequenceLengthPass) : [])
                )
            )
        )
        const getReturn = (node: IDLMethod): string => {
            if (IDLContainerUtils.isSequence(node.returnType)) {
                return this.constructions.sequenceConstructor(
                    this.constructions.resultName,
                    this.constructions.sequenceLengthUsage
                )
            }
            if (isString(node.returnType)) {
                return this.constructions.stringConstructor(
                    this.constructions.resultName
                )
            }
            return this.constructions.resultName
        }
        writer.writeStatement(
            writer.makeReturn(
                writer.makeString(
                    getReturn(node)
                )
            )
        )
    }
}
