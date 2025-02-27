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
    createOptionalType,
    createParameter,
    createReferenceType,
    IDLFile,
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
    innerTypeIfContainer,
    isAbstract,
    isDataClass,
    isGetter,
    isReal,
    isSequence,
    nodeNamespace,
    nodeType,
    parent,
    signatureTypes,
    Typechecker
} from "../../utils/idl"
import { PeersConstructions } from "./PeersConstructions"
import { TopLevelTypeConvertor } from "./TopLevelTypeConvertor"
import { mangleIfKeyword, peerMethod } from "../../utils/common"
import { PeerImporter } from "./PeerImporter"

export class PeerPrinter {
    constructor(
        private idl: IDLFile,
        private node: IDLInterface
    ) {}

    private parent = parent(this.node) ?? throwException(`expected peer to have parent: ${this.node.name}`)

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
        if (!isDataClass(this.node)) {
            this.printTypeGuard()
        }
        if (isReal(this.node)) {
            this.printAddToNodeMap()
        }
    }

    private printPeer(): void {
        this.writer.writeClass(
            this.node.name,
            () => this.printBody(),
            this.importer.withPeerImport(this.parent)
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
        if (isReal(this.node)) {
            this.writer.writeExpressionStatement(
                this.writer.makeFunctionCall(
                    PeersConstructions.validatePeer,
                    [
                        this.writer.makeString(PeersConstructions.pointerParameter),
                        this.writer.makeString(
                            nodeType(this.node) ?? throwException(`missing attribute node type: ${this.node.name}`)
                        ),
                    ]
                )
            )
        }
        this.writer.writeExpressionStatements(
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
        )
    }

    private printTypeGuard(): void {
        this.writer.writeFunctionImplementation(
            PeersConstructions.typeGuard.name(this.node.name),
            new MethodSignature(
                createReferenceType(
                    PeersConstructions.typeGuard.returnType(this.node.name)
                ),
                [createReferenceType(Config.astNodeCommonAncestor)],
                undefined,
                undefined,
                [PeersConstructions.typeGuard.parameter]
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

    private optionalIfPeer(type: IDLType): IDLType {
        // TODO: maybe heirs of defaultAncestors aren't nullable
        // TODO: handwritten
        if (isReferenceType(type)) {
            if (this.typechecker.isPeer(type.name) || type.name === Config.astNodeCommonAncestor) {
                return createOptionalType(type)
            }
        }
        return type
    }

    private printMethods(): void {
        this.node.methods.forEach(it => {
            this.makeImports(it)
            if (isGetter(it)) {
                return this.printGetter(it)
            }
            if (Config.isCreateOrUpdate(it.name)) {
                if (isAbstract(this.node)) {
                    return
                }
                return this.printCreateOrUpdate(it)
            }
        })
    }

    private printGetter(it: IDLMethod): void {
        this.writer.writeMethodImplementation(
            new Method(
                peerMethod(it.name),
                new MethodSignature(
                    this.optionalIfPeer(it.returnType),
                    it.parameters
                        .slice(1)
                        .map(it => this.optionalIfPeer(it.type)),
                    undefined,
                    undefined,
                    it.parameters
                        .slice(1)
                        .map(it => it.name)
                ),
                [MethodModifier.GETTER]
            ),
            () => {
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.makeReturnExpression(it)
                    )
                )
            }
        )
    }

    private makeReturnExpression(node: IDLMethod): LanguageExpression {
        const nativeCall = this.writer.makeFunctionCall(
            PeersConstructions.callBinding(this.node.name, node.name, nodeNamespace(this.node)),
            [
                this.writer.makeString(PeersConstructions.context),
                this.writer.makeString(PeersConstructions.pointerUsage)
            ]
                .concat(
                    node.parameters
                        .slice(1)
                        .map(it => {
                            if (isReferenceType(it.type) && this.typechecker.isPeer(it.type.name)) {
                                return this.writer.makeString(
                                    PeersConstructions.passNode(it.name)
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
        throwException(`couldn't deduce return expression for: ${this.node.name}.${node.name}`)
    }

    private makeImports(node: IDLMethod): void {
        signatureTypes(node)
            .map(innerTypeIfContainer)
            .forEach(it => {
                if (isReferenceType(it)) {
                    if (this.typechecker.isPeer(it.name)) {
                        this.importer.withPeerImport(it.name)
                    }
                    if (this.typechecker.isReferenceTo(it, isEnum)) {
                        this.importer.withEnumImport(it.name)
                    }
                }
            })
    }

    private printCreateOrUpdate(create: IDLMethod): void {
        this.writer.writeMethodImplementation(
            new Method(
                PeersConstructions.createOrUpdate(
                    this.node.name,
                    create.name
                ),
                new MethodSignature(
                    create.returnType,
                    create.parameters
                        .slice(1)
                        .map(it => it.type)
                        .map(it => this.optionalIfPeer(it)),
                    undefined,
                    undefined,
                    create.parameters
                        .slice(1)
                        .map(it => it.name)
                        .map(mangleIfKeyword)
                ),
                [MethodModifier.STATIC]
            ),
            () => {
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.writer.makeNewObject(
                            this.node.name,
                            [
                                this.writer.makeFunctionCall(
                                    this.writer.makeString(
                                        PeersConstructions.callCreateOrUpdate(
                                            this.node.name,
                                            create.name,
                                            nodeNamespace(this.node)
                                        )
                                    ),
                                    create.parameters
                                        .map(it =>
                                            createParameter(
                                                mangleIfKeyword(it.name),
                                                it.type
                                            )
                                        )
                                        .flatMap(it => {
                                            if (isReferenceType(it.type)) {
                                                if (it.type.name === Config.contextType) {
                                                    return PeersConstructions.context
                                                }
                                                if (this.typechecker.isReferenceTo(it.type, isEnum)) {
                                                    return it.name
                                                }
                                                return PeersConstructions.passNode(it.name)
                                            }
                                            if (isContainerType(it.type)) {
                                                if (isSequence(it.type)) {
                                                    return [
                                                        PeersConstructions.passNodeArray(it.name),
                                                        PeersConstructions.arrayLength(it.name)
                                                    ]
                                                }
                                            }
                                            return it.name
                                        })
                                        .map(it => this.writer.makeString(it))
                                )
                            ]
                        )
                    )
                )
            }
        )
    }

    private printAddToNodeMap(): void {
        this.writer.writeExpressionStatements(
            this.writer.makeString(`if (!nodeByType.has(${nodeType(this.node)})) {`),
            this.writer.makeString(`    nodeByType.set(${nodeType(this.node)}, ${this.node.name})`),
            this.writer.makeString(`}`)
        )
    }
}