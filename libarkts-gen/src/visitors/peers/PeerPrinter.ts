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
    createEmptyReferenceResolver,
    createReferenceType,
    IDLInterface,
    IDLMethod,
    IDLPointerType,
    IDLType,
    IDLVoidType,
    IndentedPrinter,
    isContainerType,
    isEnum,
    isPrimitiveType,
    isReferenceType,
    LanguageExpression,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { Config } from "../../Config"
import {
    IDLFile,
    isAbstract,
    isGetter,
    isSequence,
    nodeType,
    parent,
    signatureTypes,
    Typechecker
} from "../../utils/idl"
import { PeersConstructions } from "./PeersConstructions"
import { TopLevelTypeConvertor } from "./TopLevelTypeConvertor"
import { pascalToCamel } from "../../utils/common"
import { PeerImporter } from "./PeerImporter"

export class PeerPrinter {
    constructor(
        private idl: IDLFile,
        private node: IDLInterface
    ) { }

    private convertor = new TopLevelTypeConvertor(this.idl.entries)

    private typechecker = new Typechecker(this.idl.entries)

    private writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => convertType(this.convertor, node) }
    )

    private importer = new PeerImporter(this.node.name)

    print(): string {
        this.visit()
        return [
            ...this.importer.getOutput(),
            ...this.writer.getOutput()
        ].join(`\n`)
    }

    private visit(): void {
        this.printPeer()
        this.printTypeGuard()
    }

    private printPeer(): void {
        this.writer.writeClass(
            this.node.name,
            () => this.printBody(),
            this.importer.withPeerImport(parent(this.node) ?? throwException(`Peer without parent`)),
            undefined,
            undefined,
            undefined,
            isAbstract(this.node)
        )
    }

    private printBody(): void {
        this.printConstructor()
        this.printMethods()
    }

    private printConstructor(): void {
        this.writer.writeConstructorImplementation(
            this.node.name,
            new MethodSignature(
                IDLVoidType,
                [
                    IDLPointerType
                ],
                undefined,
                undefined,
                [
                    PeersConstructions.pointerParameter
                ]
            ),
            () => this.printConstructorBody()
        )
    }

    private printConstructorBody(): void {
        if (!isAbstract(this.node)) {
            this.writer.writeExpressionStatement(
                this.writer.makeFunctionCall(
                    PeersConstructions.validatePeer,
                    [
                        this.writer.makeString(PeersConstructions.pointerParameter),
                        this.writer.makeString(nodeType(this.node) ?? throwException(`somehow abstract node`))
                    ]
                )
            )
        }
        this.writer.writeExpressionStatements([
            this.writer.makeFunctionCall(
                PeersConstructions.super,
                [
                    this.writer.makeString(PeersConstructions.pointerParameter)
                ]
            ),
            this.writer.makeFunctionCall(
                PeersConstructions.warn,
                [
                    this.writer.makeString(PeersConstructions.stubNodeMessage(this.node.name))
                ]
            )
        ])
    }

    private printTypeGuard(): void {
        this.writer.writeFunctionImplementation(
            PeersConstructions.typeGuard.name(this.node.name),
            new MethodSignature(
                createReferenceType(
                    PeersConstructions.typeGuard.returnType(this.node.name)
                ),
                [
                    createReferenceType(
                        Config.astNodeCommonAncestor
                    )
                ],
                undefined,
                undefined,
                [
                    PeersConstructions.typeGuard.parameter
                ]
            ),
            () => {
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.writer.makeString(
                            PeersConstructions.typeGuard.body(this.node.name)
                        )
                    )
                )
            }
        )
    }

    private printMethods(): void {
        this.node.methods
            .filter(isGetter)
            .forEach(it => {
                signatureTypes(it)
                    .map(_it => {
                        if (isContainerType(_it)) {
                            return _it.elementType[0]
                        }
                        return _it
                    })
                    .filter(isReferenceType)
                    .filter(_it => this.typechecker.isPeer(_it.name))
                    .forEach(_it => this.importer.withPeerImport(_it.name))

                this.writer.writeMethodImplementation(
                    new Method(
                        pascalToCamel(it.name),
                        new MethodSignature(
                            it.returnType,
                            it.parameters
                                .slice(1)
                                .map(it => it.type),
                            undefined,
                            undefined,
                            it.parameters
                                .slice(1)
                                .map(it => it.name)
                        ),
                        this.modifiers(it)
                    ),
                    () => {
                        this.writer.writeStatement(
                            this.writer.makeReturn(
                                this.makeReturnExpression(it)
                            )
                        )
                    }
                )
            })
    }

    private modifiers(node: IDLMethod): MethodModifier[] {
        if (node.parameters.length === 1) {
            return [MethodModifier.GETTER]
        }
        return []
    }

    private makeReturnExpression(node: IDLMethod): LanguageExpression {
        const nativeCall = this.writer.makeFunctionCall(
            PeersConstructions.callBinding(this.node.name, node.name),
            [
                this.writer.makeString(PeersConstructions.context),
                this.writer.makeString(PeersConstructions.pointerUsage)
            ]
                .concat(
                    node.parameters
                        .slice(1)
                        .map(it => {
                            if (isReferenceType(it.type) && this.typechecker.isPeer(it.type.name)) {
                                return this.writer.makeFunctionCall(
                                    `passNode`,
                                    [this.writer.makeString(it.name)]
                                )
                            }
                            return this.writer.makeString(it.name)
                        })
                )
        )
        if (isPrimitiveType(node.returnType)) {
            return nativeCall
        }

        if (isReferenceType(node.returnType)) {
            if (this.typechecker.isReferenceTo(node.returnType, isEnum)) {
                this.importer.withEnumImport(node.returnType.name)
                return nativeCall
            }

            return this.writer.makeFunctionCall(
                PeersConstructions.pointerToPeer,
                [nativeCall]
            )
        }
        if (isSequence(node.returnType)) {
            return this.writer.makeFunctionCall(
                PeersConstructions.arrayOfPointersToArrayOfPeers,
                [nativeCall]
            )
        }
        return this.writer.makeString(``)
    }
}