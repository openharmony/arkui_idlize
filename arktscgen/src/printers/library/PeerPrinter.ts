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
    createEmptyReferenceResolver,
    createParameter,
    createReferenceType,
    IDLFile,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLPointerType,
    IDLType,
    IDLVoidType,
    IndentedPrinter,
    LanguageExpression,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { makeMethod, nodeNamespace, nodeType, parent } from "../../utils/idl"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import {
    isAbstract,
    isCreateOrUpdate,
    isDataClass,
    isGetter,
    isReal,
    isRegular,
    mangleIfKeyword,
    peerMethod
} from "../../general/common"
import { Importer } from "./Importer"
import { InteropConstructions } from "../../constuctions/InteropConstructions"
import { Typechecker } from "../../general/Typechecker"
import { LibraryTypeConvertor } from "../../type-convertors/top-level/LibraryTypeConvertor"
import { ImporterTypeConvertor } from "../../type-convertors/top-level/ImporterTypeConvertor"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { BindingParameterTypeConvertor } from "../../type-convertors/top-level/peers/BindingParameterTypeConvertor"
import { BindingReturnValueTypeConvertor } from "../../type-convertors/top-level/peers/BindingReturnValueTypeConvertor"
import { composedConvertType } from "../../type-convertors/BaseTypeConvertor"
import { Config } from "../../general/Config"

export class PeerPrinter extends SingleFilePrinter {
    constructor(
        idl: IDLFile,
        private node: IDLInterface
    ) {
        super(idl)
    }

    protected typechecker = new Typechecker(this.idl.entries)

    protected importer = new Importer(this.typechecker, `.`, this.node.name)

    private bindingParameterTypeConvertor = new BindingParameterTypeConvertor(this.typechecker)

    private bindingReturnValueTypeConvertor = new BindingReturnValueTypeConvertor(this.typechecker)

    private parent = parent(this.node) ?? throwException(`expected peer to have parent: ${this.node.name}`)

    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => composedConvertType(
                new LibraryTypeConvertor(this.typechecker),
                new ImporterTypeConvertor(this.importer, this.typechecker),
                node
            )
        }
    )

    protected visit(): void {
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
                undefined,
                [
                    PeersConstructions.pointerParameter
                ]
            ),
            () => {
                if (isReal(this.node)) {
                    this.writer.writeExpressionStatement(
                        this.writer.makeFunctionCall(
                            PeersConstructions.validatePeer,
                            [
                                this.writer.makeString(PeersConstructions.pointerParameter),
                                this.writer.makeString(
                                    nodeType(this.node)
                                        ?? throwException(`missing attribute node type: ${this.node.name}`)
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
                    )
                )
            }
        )
    }

    private printTypeGuard(): void {
        this.writer.writeFunctionImplementation(
            PeersConstructions.typeGuard.name(this.node.name),
            new MethodSignature(
                createReferenceType(
                    PeersConstructions.typeGuard.returnType(this.node.name)
                ),
                [createReferenceType(PeersConstructions.typeGuard.parameter.type)],
                undefined,
                undefined,
                undefined,
                [PeersConstructions.typeGuard.parameter.name]
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
        this.node.methods.forEach(it => {
            if (isCreateOrUpdate(it.name)) {
                if (isAbstract(this.node)) {
                    return
                }
                return this.printCreateOrUpdate(it)
            }
            if (isGetter(it)) {
                return this.printGetter(it)
            }
            if (isRegular(it)) {
                return this.printRegular(it)
            }
        })
    }

    private printGetter(node: IDLMethod): void {
        this.writer.writeMethodImplementation(
            new Method(
                peerMethod(node.name),
                new MethodSignature(
                    node.returnType,
                    []
                ),
                [MethodModifier.GETTER]
            ),
            () => {
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.makeReturnBindingCall(node)
                    )
                )
            }
        )
    }

    private printRegular(node: IDLMethod): void {
        this.writer.writeExpressionStatement(
            this.writer.makeString(`/** @deprecated */`)
        )
        this.writer.writeMethodImplementation(
            makeMethod(
                peerMethod(node.name),
                node.parameters,
                PeersConstructions.this.type
            ),
            () => {
                this.writer.writeExpressionStatement(
                    this.makeReturnBindingCall(node)
                )
                this.writer.writeStatement(
                    this.writer.makeReturn(
                        this.writer.makeString(
                            PeersConstructions.this.name
                        )
                    )
                )
            }
        )
    }

    private makeReturnBindingCall(node: IDLMethod): LanguageExpression {
        const nativeCall = this.writer.makeFunctionCall(
            PeersConstructions.callBinding(this.node.name, node.name, nodeNamespace(this.node)),
            this.makeBindingArguments(
                [
                    createParameter(
                        PeersConstructions.pointerUsage,
                        IDLPointerType
                    ),
                    ...node.parameters
                ]
            )
        )
        return this.bindingReturnValueTypeConvertor.convertType(node.returnType)(this.writer, nativeCall)
    }

    private printCreateOrUpdate(node: IDLMethod): void {
        this.writer.writeMethodImplementation(
            makeMethod(
                PeersConstructions.createOrUpdate(
                    this.node.name,
                    node.name
                ),
                node.parameters,
                node.returnType,
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
                                        PeersConstructions.callBinding(
                                            this.node.name,
                                            node.name,
                                            nodeNamespace(this.node)
                                        )
                                    ),
                                    this.makeBindingArguments(node.parameters)
                                )
                            ]
                        )
                    )
                )
            }
        )
    }

    private makeBindingArguments(parameters: IDLParameter[]): LanguageExpression[] {
        return [
            createParameter(
                InteropConstructions.context.name,
                InteropConstructions.context.type
            )
        ]
            .concat(parameters)
            .map(it =>
                createParameter(
                    mangleIfKeyword(it.name),
                    it.type
                )
            )
            .flatMap(it =>
                this.bindingParameterTypeConvertor.convertType(it.type)(it.name)
            )
            .map(it => this.writer.makeString(it))
    }

    private printAddToNodeMap(): void {
        const enumValue = this.typechecker.nodeTypeName(this.node)
        if (enumValue === undefined) {
            return
        }
        const qualified = `${this.importer.withEnumImport(Config.nodeTypeAttribute)}.${enumValue}`
        this.writer.writeExpressionStatements(
            this.writer.makeString(`if (!nodeByType.has(${qualified})) {`),
            this.writer.makeString(`    nodeByType.set(${qualified}, ${this.node.name})`),
            this.writer.makeString(`}`)
        )
    }
}