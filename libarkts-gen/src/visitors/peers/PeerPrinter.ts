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
    IDLPointerType,
    IDLType,
    IDLVoidType,
    IndentedPrinter,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { Config } from "../../Config"
import { IDLFile } from "../../idl-utils"
import { PeersConstructions } from "./PeersConstructions"
import { TopLevelTypeConvertor } from "./TopLevelTypeConvertor"

export class PeerPrinter {
    constructor(
        private idl: IDLFile,
        private node: IDLInterface
    ) { }

    private convertor = new TopLevelTypeConvertor(this.idl.entries)

    private writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => convertType(this.convertor, node) }
    )

    print(): string | undefined {
        this.write()
        if (this.writer.getOutput().length === 0) {
            return undefined
        }
        return this.writer.getOutput().join(`\n`)
    }

    private write(): void {
        if (this.parent() === undefined) {
            return
        }
        this.printPeer()
        this.printTypeGuard()
    }

    private nodeType(): string | undefined {
        return this.node.extendedAttributes
            ?.find(it => it.name === Config.nodeTypeAttribute)
            ?.value
    }

    private parent(): string | undefined {
        return this.node.inheritance[0]?.name
    }

    private isAbstract(): boolean {
        return this.nodeType() === undefined
    }

    private printPeer(): void {
        this.writer.writeClass(
            this.node.name,
            () => this.printBody(),
            Config.astNodeCommonAncestor,
            undefined,
            undefined,
            undefined,
            this.isAbstract()
        )
    }

    private printBody(): void {
        this.printConstructor()
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
                    PeersConstructions.peer
                ]
            ),
            () => this.printConstructorBody()
        )
    }

    private printConstructorBody(): void {
        if (!this.isAbstract()) {
            this.writer.writeExpressionStatement(
                this.writer.makeFunctionCall(
                    PeersConstructions.validatePeer,
                    [
                        this.writer.makeString(PeersConstructions.peer),
                        this.writer.makeString(this.nodeType() ?? throwException(`somehow abstract node`))
                    ]
                )
            )
        }
        this.writer.writeExpressionStatement(
            this.writer.makeFunctionCall(
                PeersConstructions.super,
                [
                    this.writer.makeString(PeersConstructions.peer)
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
}