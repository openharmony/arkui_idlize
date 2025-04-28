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
    IDLInterface,
    IDLMethod,
    IDLNode,
    IDLParameter,
    IDLProperty,
    IDLType,
    IndentedPrinter,
    isInterface,
    isOptionalType,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { flattenType, makeMethod } from "../../utils/idl"
import { isCreate, mangleIfKeyword } from "../../general/common"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import { ImporterTypeConvertor } from "../../type-convertors/top-level/ImporterTypeConvertor"
import { Importer } from "./Importer"
import { LibraryTypeConvertor } from "../../type-convertors/top-level/LibraryTypeConvertor"
import { composedConvertType } from "../../type-convertors/BaseTypeConvertor"
import { id } from "../../utils/types"
import { FactoryConstructions } from "../../constuctions/FactoryConstructions"

export class FactoryPrinter extends SingleFilePrinter {
    protected importer = new Importer(this.typechecker, `peers`)

    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) =>
            composedConvertType(
                new LibraryTypeConvertor(this.typechecker),
                new ImporterTypeConvertor(
                    this.importer,
                    this.typechecker
                ),
                node
            )
        }
    )

    prologue() {
        this.writer.writeExpressionStatements(
            this.writer.makeString(FactoryConstructions.prologue)
        )
        this.writer.pushIndent()
    }

    epilogue() {
        this.writer.popIndent()
        this.writer.writeExpressionStatements(
            this.writer.makeString(FactoryConstructions.epilogue)
        )
    }

    protected filterInterface(node: IDLInterface): boolean {
        return !this.typechecker.isPeer(node.name) || FactoryPrinter.getUniversalCreate(node) == undefined
    }

    printInterface(node: IDLInterface) {
        this.printCreate(node)
        this.writer.print(',')
        this.printUpdate(node)
        this.writer.print(',')
    }

    private printCreate(node: IDLInterface): void {
        this.writer.writeMethodImplementation(
            makeMethod(
                PeersConstructions.universalCreate(node.name),
                this.makeParameters(node.properties),
                flattenType(createReferenceType(node.name))
            ),
            () => this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeFunctionCall(
                        FactoryPrinter.callUniversalCreate(node),
                        node.properties
                            .map(it => it.name)
                            .map(mangleIfKeyword)
                            .map(it => this.writer.makeString(it))
                    )
                )
            )
        )
    }

    private makeParameters(properties: IDLProperty[]): IDLParameter[] {
        // We may need to ensure optional parameters are at the end
        return properties
            .map(it => createParameter(it.name, flattenType(it.type), it.isOptional))
    }

    private printUpdate(node: IDLInterface): void {
        this.writer.writeMethodImplementation(
            makeMethod(
                PeersConstructions.universalUpdate(node.name),
                [{
                    name: FactoryConstructions.original,
                    type: id<IDLType>(flattenType(createReferenceType(node.name))),
                    isOptional: false
                }]
                    .concat(this.makeParameters(node.properties)),
                flattenType(createReferenceType(node.name)),

            ),
            () => {
                this.printUnchangedBranch(node)
                this.printChangedBranch(node)
            }
        )
    }

    private printUnchangedBranch(node: IDLInterface): void {
        if (node.properties.length === 0) {
            return
        }
        this.writer.writeStatement(
            this.writer.makeCondition(
                this.writer.makeString(
                    FactoryConstructions.all(
                        node.properties
                            .map(it => it.name)
                            .map(it => FactoryConstructions.isSame(mangleIfKeyword(it), it))
                    )
                ),
                this.writer.makeReturn(
                    this.writer.makeString(FactoryConstructions.original)
                )
            )
        )
    }

    private printChangedBranch(node: IDLInterface): void {
        this.writer.writeStatement(
            this.writer.makeReturn(
                this.writer.makeFunctionCall(
                    FactoryConstructions.updateNodeByNode,
                    [
                        this.writer.makeFunctionCall(
                            FactoryPrinter.callUniversalCreate(node),
                            node.properties
                                .map(it => it.name)
                                .map(mangleIfKeyword)
                                .map(it => this.writer.makeString(it))
                        ),
                        this.writer.makeString(FactoryConstructions.original)
                    ]
                )
            )
        )
    }

    private static callUniversalCreate(node: IDLInterface) {
        return PeersConstructions.callPeerMethod(
            node.name,
            PeersConstructions.createOrUpdate(
                node.name,
                FactoryPrinter.getUniversalCreate(node)?.name
                    ?? throwException(`unexpected node with no universal create`)
            )
        )
    }

    private static getUniversalCreate(node: IDLInterface): IDLMethod | undefined {
        const creates = node.methods.filter(it => isCreate(it.name))
        if (creates.length !== 1) {
            return undefined
        }
        if (node.properties.length !== creates[0].parameters.length) {
            return undefined
        }
        return creates[0]
    }
}
