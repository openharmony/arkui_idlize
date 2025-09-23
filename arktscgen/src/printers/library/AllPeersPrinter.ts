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

import { MultiFilePrinter, MultiFileOutput } from "../MultiFilePrinter"
import {
    createEmptyReferenceResolver,
    IDLFile,
    IDLInterface,
    IDLKind,
    IDLNamespace,
    IDLNode,
    IDLType,
    IndentedPrinter,
    isInterface,
    TSLanguageWriter
} from "@idlizer/core"
import { Importer } from "./Importer"
import { PeerPrinter } from "./PeerPrinter"
import { Config } from "../../general/Config"
import { createDefaultTypescriptWriter, fqName } from "../../utils/idl"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import { convertAndImport } from "../../type-convertors/top-level/ImporterTypeConvertor"
import { LibraryTypeConvertor } from "../../type-convertors/top-level/LibraryTypeConvertor"
import { Typechecker } from "../../general/Typechecker"

export class AllPeersPrinter extends MultiFilePrinter {
    private static FlattenNamespaces = [Config.irNamespace]
    private typechecker = new Typechecker(this.idl)

    constructor(private config: Config, idl: IDLFile) {
        super(idl)
    }

    protected filterInterface(node: IDLInterface): boolean {
        throw "deprecated!";
        return !this.isAllowed(node)
    }

    printNamespace(ns: IDLNamespace): MultiFileOutput[] {
        const members: IDLInterface[] = ns.members
            .filter(isInterface)
            .filter(this.isAllowed.bind(this))

        if (members.length === 0) {
            return []
        }

        const importer = new Importer(this.typechecker, '.', ns.name)
        const writer = this.makeWriter(importer)
        const printer = new PeerPrinter(this.config, this.typechecker, importer)

        writer.pushNamespace(ns.name, { ident: false });
        members.forEach(m => printer.printInterface(m, writer))
        writer.popNamespace({ ident: false });

        return [{
            exports: [ns.name],
            fileName: `${ns.name}.ts`,
            output: AllPeersPrinter.makeString(importer, writer)
        }]
    }

    printInterface(iface: IDLInterface): MultiFileOutput {
        const importer = new Importer(this.typechecker, '.', iface.name)
        const writer = this.makeWriter(importer)
        const printer = new PeerPrinter(this.config, this.typechecker, importer)

        printer.printInterface(iface, writer)

        return {
            exports: ['*'],
            fileName: PeersConstructions.fileName(iface.name),
            output: AllPeersPrinter.makeString(importer, writer)
        }
    }

    override print(): MultiFileOutput[] {
        const visitInterfaces = (node: IDLNode): MultiFileOutput[] => {
            switch (node.kind) {
                case IDLKind.File:
                    return (node as IDLFile).entries.flatMap((value) => visitInterfaces(value))

                case IDLKind.Namespace: {
                    const ns = (node as IDLNamespace)
                    if (AllPeersPrinter.FlattenNamespaces.includes(ns.name)) {
                        return ns.members.flatMap((value) => visitInterfaces(value))
                    }
                    return this.printNamespace(ns)
                }

                case IDLKind.Interface: {
                    const iface = (node as IDLInterface)
                    return this.isAllowed(iface) ? [this.printInterface(iface)] : []
                }
            }
            return []
        }
        return visitInterfaces(this.idl)
    }

    private makeWriter(importer: Importer): TSLanguageWriter {
        const converter = {
            convert: (node: IDLType) => convertAndImport(
                importer, new LibraryTypeConvertor(this.typechecker), node
            )
        }
        return new TSLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), converter)
    }

    private isAllowed(node: IDLInterface): boolean {
        return this.typechecker.isPeer(node) && !this.config.ignore.isIgnoredPeer(fqName(node))
    }

    private static makeString(importer: Importer, writer: TSLanguageWriter): string {
        return [...importer.getOutput(), '', ...writer.getOutput()] .join(`\n`)
    }

    public static printIndexFile(out: MultiFileOutput[], _: IDLFile): string {
        const writer = createDefaultTypescriptWriter()
        const dropExt = (file: string) => file.substring(0, file.lastIndexOf('.'))

        for (const { exports, fileName, output } of out) {
            const specs = exports.length === 1 && exports.at(0) === '*' ?
                exports.at(0)! : `{ ${exports.join(', ')} }`

            writer.writeExpressionStatement(
                writer.makeString(`export ${specs} from "./peers/${dropExt(fileName)}"`)
            )
        }

        // Aliases for widely used types
        writer.writeExpressionStatements(...[
            'import { parser } from "./peers/parser"',
            'import { es2panda } from "./peers/es2panda"',

            'export class Program extends parser.Program {}',
            'export class ArkTsConfig extends es2panda.ArkTsConfig {}',
            ].map(s => writer.makeString(s))
        )

        return writer.getOutput().join('\n')
    }
}
