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
    IDLNode,
    IDLParameter,
    IDLProperty,
    IDLType,
    IndentedPrinter,
    isInterface,
    isOptionalType,
    Method,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { flattenType, makeMethod, makeSignature } from "../../utils/idl"
import { isCreate, mangleIfKeyword, peerMethod } from "../../general/common"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import { ImporterTypeConvertor } from "../../type-convertors/top-level/ImporterTypeConvertor"
import { Importer } from "./Importer"
import { LibraryTypeConvertor } from "../../type-convertors/top-level/LibraryTypeConvertor"
import { composedConvertType } from "../../type-convertors/BaseTypeConvertor"
import { id } from "../../utils/types"
import { FactoryConstructions } from "../../constuctions/FactoryConstructions"
import { PeerPrinter } from "./PeerPrinter"
import { Config } from "../../general/Config"
import { ExtraParameter } from "../../options/ExtraParameters"

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

    constructor(
        private config: Config,
        idl: IDLFile
    ) {
        super(idl)
    }

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
        const extraParameters = PeerPrinter.makeExtraParameters(node, this.config, this.idl)
        const signature = makeSignature(
            this.makeParameters(node.properties).concat(extraParameters),
            flattenType(createReferenceType(node.name))
        )

        this.writer.writeMethodImplementation(
            new Method(
                PeersConstructions.universalCreate(node.name),
                signature
            ),
            () => this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeFunctionCall(
                        FactoryPrinter.callUniversalCreate(node),
                        signature.argNames!
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
        const parameters = this.makeParameters(node.properties)
        const extraParameters = this.config.parameters.getParameters(node.name)
        const signature = makeSignature([{
                name: FactoryConstructions.original,
                type: id<IDLType>(flattenType(createReferenceType(node.name))),
                isOptional: false
            }]
                .concat(parameters)
                .concat(extraParameters
                    .map(p => PeerPrinter.makeExtraParameter(p, node, this.idl))
                ),
            flattenType(createReferenceType(node.name)),
        )

        this.writer.writeMethodImplementation(
            new Method(
                PeersConstructions.universalUpdate(node.name),
                signature
            ),
            (writer: TSLanguageWriter) => {
                const expr = (value: string) => writer.makeString(value)
                const same = (lhs: string, rhs: string) =>
                    FactoryConstructions.isSame(mangleIfKeyword(lhs), rhs)

                const isSameAll = FactoryConstructions.all(
                    parameters
                        .map(param => same(param.name, param.name))
                        .concat(
                            extraParameters.map(param => {
                                const [get, _] = PeerPrinter.resolveProperty(param, node, this.idl)
                                return same(param.name, peerMethod(get.name))
                            }
                        )
                    )
                )

                if (node.properties.length !== 0) {
                    writer.writeStatement(
                        writer.makeCondition(
                            expr(isSameAll),
                            writer.makeReturn(expr(FactoryConstructions.original))
                        )
                    )
                }

                const createCall = writer.makeFunctionCall(
                    FactoryPrinter.callUniversalCreate(node),
                    (parameters as { name: string }[])
                        .concat(extraParameters)
                        .map(p => expr(mangleIfKeyword(p.name)))
                )

                writer.writeStatement(writer.makeReturn(
                    writer.makeFunctionCall(FactoryConstructions.updateNodeByNode, [
                        createCall, writer.makeString(FactoryConstructions.original)
                    ])
                ))
            }
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
