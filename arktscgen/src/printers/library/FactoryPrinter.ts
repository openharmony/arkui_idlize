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
    createOptionalType,
    createParameter,
    createReferenceType,
    IDLFile,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLType,
    IndentedPrinter,
    isDefined,
    isOptionalType,
    isReferenceType,
    isParameter,
    Method,
    TSLanguageWriter
} from "@idlizer/core"
import { SingleFilePrinter } from "../SingleFilePrinter"
import { makeSignature } from "../../utils/idl"
import { isCreate, mangleIfKeyword, peerMethod } from "../../general/common"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import { convertAndImport } from "../../type-convertors/top-level/ImporterTypeConvertor"
import { Importer } from "./Importer"
import { LibraryTypeConvertor } from "../../type-convertors/top-level/LibraryTypeConvertor"
import { id } from "../../utils/types"
import { FactoryConstructions } from "../../constuctions/FactoryConstructions"
import { PeerPrinter } from "./PeerPrinter"
import { Config } from "../../general/Config"

export class FactoryPrinter extends SingleFilePrinter {
    protected importer = new Importer(this.typechecker, `peers`)
    protected converter = new LibraryTypeConvertor(this.typechecker)

    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        {
            convert: (node: IDLType) => convertAndImport(
                this.importer, this.converter, node, this.config
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
        return !this.typechecker.isPeer(node)
    }

    printInterface(node: IDLInterface) {
        const filtered = PeerPrinter.filterMoreSpecific(
            node.methods.filter(m => isCreate(m.name))
        )
        const universal = filtered.at(0)
        if (!universal || filtered.length > 1) {
            //console.log(`${node.name}: more methods`);
            return
        }

        const params = PeerPrinter.filterParameters(universal.parameters)
        const methods = PeerPrinter.filterMethods(node.methods)
        const getters = this.gettersForParams(params, methods)
        if (!getters) {
            return
        }

        // Compatibility: using getter name for create/update parameters instead original
        const parameters = params.map((p,i) =>
            createParameter(peerMethod(getters[i].name), p.type, p.isOptional))

        this.printCreate(node, universal.name, parameters)
        this.writer.print(',')
        this.printUpdate(node, universal.name, parameters, getters)
        this.writer.print(',')
    }

    private printCreate(node: IDLInterface, universalName: string, parameters: IDLParameter[]): void {
        const isNullable = (type: IDLType|IDLParameter) =>
            PeerPrinter.isNullableType(isParameter(type) ? type.type : type, this.typechecker)
        const extraParameters = PeerPrinter.makeExtraParameters(node, this.config, this.typechecker)
        const signature = makeSignature(
            parameters
                .concat(extraParameters)
                .map(p => ({
                    name: p.name,
                    type: PeerPrinter.makeOptionalType(p.type, isNullable),
                    isOptional: p.isOptional
                })),
            createReferenceType(node.name)
        )

        this.writer.writeMethodImplementation(
            new Method(
                PeersConstructions.universalCreate(node.name),
                signature
            ),
            () => this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeFunctionCall(
                        this.callUniversalCreate(node, universalName),
                        signature.argNames!
                            .map(mangleIfKeyword)
                            .map(it => this.writer.makeString(it))
                    )
                )
            )
        )
    }

    private printUpdate(node: IDLInterface, universalName: string, parameters: IDLParameter[], getters: IDLMethod[]): void {
        const isNullable = (type: IDLType) => PeerPrinter.isNullableType(type, this.typechecker)
        const extraParameters = this.config.parameters.getParameters(node.name)
        const signature = makeSignature([{
                name: FactoryConstructions.original,
                type: id<IDLType>(createReferenceType(node.name)),
                isOptional: false
            }]
                .concat(parameters)
                .concat(extraParameters
                    .map(p => PeerPrinter.makeExtraParameter(p, node, this.typechecker))
                )
                .map((p,i) => ({
                    name: p.name,
                    type: i && isNullable(p.type) ? createOptionalType(p.type) : p.type,
                    isOptional: p.isOptional
                })),
            createReferenceType(node.name),
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
                                const [get, _] = PeerPrinter.resolveProperty(param, node, this.typechecker)
                                return same(param.name, peerMethod(get.name))
                            }
                        )
                    )
                )

                if (parameters.length) {
                    writer.writeStatement(
                        writer.makeCondition(
                            expr(isSameAll),
                            writer.makeReturn(expr(FactoryConstructions.original))
                        )
                    )
                }

                const createCall = writer.makeFunctionCall(
                    this.callUniversalCreate(node, universalName),
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

    private callUniversalCreate(node: IDLInterface, name: string) {
        return PeersConstructions.callPeerMethod(
            node.name,
            PeersConstructions.createOrUpdate(
                node.name,
                name
            )
        )
    }

    private gettersForParams(params: IDLParameter[], methods: IDLMethod[]): IDLMethod[]|undefined {
        const toTypeName = (type: IDLType) => {
            const rawType = isOptionalType(type) ? type.type : type
            return `${this.converter.convertType(rawType)}`
        }

        const mappedMethods: [string, IDLMethod][] = methods
            .map((m) => [toTypeName(m.returnType), m])


        const getters = params
            .map(param => {
                const paramTypeName = toTypeName(param.type)
                const sameTypeMethods = mappedMethods
                    .filter(tuple => tuple[0] === paramTypeName)
                    .map(tuple => tuple[1])

                // FIXME: For now, we compare names only if there is an ambiguity.
                // This is for backward compatibility, for algorithm that searches
                // in parents too it should compare names always.
                const sameNameMethods = sameTypeMethods.length > 1 ?
                    sameTypeMethods.filter(m => peerMethod(m.name) === param.name) :
                    sameTypeMethods

                if (sameNameMethods.length === 1) {
                    mappedMethods.splice(
                        mappedMethods.findIndex(([_, m]) => m === sameNameMethods[0]),
                        1
                    )
                    return sameNameMethods[0]
                }

                return undefined
            })

        const defined = getters.filter(isDefined)
        return defined.length === getters.length ? defined : undefined
    }
}
