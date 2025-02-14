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
    createParameter,
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
    nodeNamespace,
    nodeType,
    parent,
    signatureTypes,
    Typechecker
} from "../../utils/idl"
import { PeersConstructions } from "./PeersConstructions"
import { TopLevelTypeConvertor } from "./TopLevelTypeConvertor"
import { pascalToCamel } from "../../utils/common"
import { PeerImporter } from "./PeerImporter"
import { InteropConstructions } from "../interop/InteropConstructions"

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
        this.printCreate()
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
            PeersConstructions.callBinding(this.node.name, node.name, nodeNamespace(this.node) ?? ""),
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
        throwException(`couldn't emit return expression while generating peer: ${this.node.name}.${node.name}`)
    }

    private printCreate(): void {
        const create = this.node.methods.find(it => it.name.startsWith(Config.createPrefix))
        if (create === undefined) {
            return
        }
        if (isAbstract(this.node)) {
            return
        }
        if (
            create.parameters
                .map(it => it.type)
                .concat(create.returnType)
                .map(it => {
                    if (isContainerType(it)) {
                        if (isSequence(it)) {
                            return it.elementType[0]
                        }
                    }
                    return it
                })
                .filter(isReferenceType)
                .filter(it => !it.name.startsWith(`es2panda_Context`))
                .filter(it => !it.name.startsWith(`es2panda_AstNode`))
                .some(it => this.typechecker.isHollow(it.name))
        ) {
            return
        }

        create.parameters
            .map(it => {
                if (isContainerType(it.type)) {
                    if (isSequence(it.type)) {
                        return it.type.elementType[0]
                    }
                }
                return it.type
            })
            .forEach(it => {
                if (isReferenceType(it)) {
                    if (this.typechecker.isHeir(it.name, Config.astNodeCommonAncestor)) {
                        this.importer.withPeerImport(it.name)
                    }
                    if (this.typechecker.isReferenceTo(it, isEnum)) {
                        this.importer.withEnumImport(it.name)
                    }
                    if (it.name === `es2panda_Context`) {
                        return
                    }
                    if (it.name.startsWith(`es2panda_`)) {
                        this.importer.withPeerImport(it.name.slice(`es2panda_`.length))
                    }
                }
            })

        this.writer.writeMethodImplementation(
            new Method(
                `create${this.node.name}`,
                new MethodSignature(
                    create.returnType,
                    create.parameters
                        .slice(1)
                        .map(it => it.type)
                        .map(it => {
                            if (isReferenceType(it) && it.name === `es2panda_AstNode`) {
                                return createReferenceType(
                                    `AstNode`
                                )
                            }
                            return it
                        }),
                    undefined,
                    undefined,
                    create.parameters
                        .slice(1)
                        .map(it => it.name)
                        .map(it => {
                            if (InteropConstructions.keywords.includes(it)) {
                                return `_${it}`
                            }
                            return it
                        })
                )
            ),
            () => {
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.writer.makeNewObject(
                            this.node.name,
                            [
                                this.writer.makeFunctionCall(
                                    this.writer.makeString(PeersConstructions.callCreateOrUpdate(this.node.name, create.name, nodeNamespace(this.node) ?? "")),
                                    create.parameters
                                        .map(it => {
                                            if (InteropConstructions.keywords.includes(it.name)) {
                                                return createParameter(
                                                    `_${it.name}`,
                                                    it.type
                                                )
                                            }
                                            return it
                                        })
                                        .map(it => {
                                            if (it.name === `context`) {
                                                return `global.${it.name}`
                                            }
                                            if (it.name === `es2panda_AstNode`) {
                                                return `AstNode`
                                            }
                                            if (this.typechecker.isHollow(it.name)) {
                                                return it.name.slice(`es2panda_`.length);
                                            }
                                            if (isReferenceType(it.type)) {
                                                if (this.typechecker.isReferenceTo(it.type, isEnum)) {
                                                    return it.name
                                                }
                                                return `passNode(${it.name})`
                                            }
                                            if (isContainerType(it.type)) {
                                                if (isSequence(it.type)) {
                                                    const inner = it.type.elementType[0]
                                                    if (isReferenceType(inner) && this.typechecker.isHollow(inner.name)) {
                                                        return it.name.slice(`es2panda_`.length);
                                                    }
                                                    return `passNodeArray(${it.name})`
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
}