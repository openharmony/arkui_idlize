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
    getOrPut,
    IDLFile,
    IDLInterface,
    IDLKind,
    IDLMethod,
    IDLNamespace,
    IDLNode,
    IDLType,
    IndentedPrinter,
    isInterface,
    isNamespace,
    throwException,
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
import { isImplInterface } from "../../general/common"
import { pascalToCamel } from "../../utils/string"

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

        return [this.printFile(ns.name, [ns.name], (printer: PeerPrinter, writer: TSLanguageWriter, importer: Importer): void => {
            ns.members // Is ns.* a typo or it really needed?
                .filter(isInterface)
                .forEach(iface => importer.addSeen(iface.name)) // Do not import classes from this namespace

            writer.pushNamespace(ns.name, { ident: false })
            this.sortInterfaces(members)
                .forEach(m => printer.printInterface(m, writer))
            writer.popNamespace({ ident: false })
        })]
    }

    printInterface(iface: IDLInterface): MultiFileOutput {
        if (isImplInterface(iface.name)) {
            const ns = 'compiler'
            return this.printFile('public', [ns], (printer: PeerPrinter, writer: TSLanguageWriter) => {
                writer.pushNamespace(ns, { ident: false })
                iface.methods
                    .filter(this.isAllowedMethod.bind(this, iface))
                    .forEach(m => printer.printFunction(iface, m, writer))
                writer.popNamespace({ ident: false })
            })
        }

        return this.printFile(iface.name, ['*'], (printer: PeerPrinter, writer: TSLanguageWriter, importer: Importer) => {
            importer.addSeen(PeersConstructions.peerName(iface.name))
            printer.printInterface(iface, writer)
        })
    }

    private printFile(
        name: string,
        exports: string[],
        cb: (printer: PeerPrinter, writer: TSLanguageWriter, importer: Importer) => void
    ): MultiFileOutput {
        const importer = new Importer('.', name)
        const writer = this.makeWriter(importer)
        const printer = new PeerPrinter(this.config, this.typechecker, importer)

        cb(printer, writer, importer)

        return {
            exports: exports,
            fileName: PeersConstructions.fileName(name),
            output: [...importer.getOutput(), '', ...writer.getOutput()].join(`\n`)
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

    /**
     * Sort interfaces in order of inheritance.
     */
    sortInterfaces(ifaces: readonly IDLInterface[]): IDLInterface[] {
        const sorted = [] as IDLInterface[]
        ifaces.forEach((iface) => {
            const parents = this.typechecker.flatParents(iface)
            parents.reverse().forEach(p => {
                const index = sorted.findIndex(ps => p.name === ps.name)
                if (index === -1) {
                    sorted.push(p)
                }
            })
        })
        return sorted
    }

    private makeWriter(importer: Importer): TSLanguageWriter {
        const converter = {
            convert: (node: IDLType) => convertAndImport(
                importer, new LibraryTypeConvertor(this.typechecker), node, this.config
            )
        }
        return new TSLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), converter)
    }

    private isAllowed(node: IDLInterface): boolean {
        return this.typechecker.isPeer(node) && !this.config.ignore.isIgnoredPeer(fqName(node))
    }

    private isAllowedMethod(iface: IDLInterface, node: IDLMethod): boolean {
        return !this.config.ignore.isIgnoredMethod(fqName(iface), node.name)
    }

    public static printIndexFile(out: MultiFileOutput[], config: Config, idl: IDLFile): string {
        const writer = createDefaultTypescriptWriter()
        const dropExt = (file: string) => file.substring(0, file.lastIndexOf('.'))

        for (const { exports, fileName, output } of out) {
            const specs = exports.length === 1 && exports.at(0) === '*' ?
                exports.at(0)! : `{ ${exports.join(', ')} }`

            writer.writeExpressionStatement(
                writer.makeString(`export ${specs} from "./peers/${dropExt(fileName)}"`)
            )
        }

        const groupByNamespace = (names: string[]) => {
            const grouped = new Map<string, string[]>()
            names.forEach(fqName => {
                const parts = fqName.split('.')
                const [ns, entity] = [parts.slice(0, -1).join('.'), parts.at(-1)!]
                getOrPut(grouped, ns, k => []).push(entity)
            })
            return grouped
        }

        const resolveNames = (fqNames: string[], idl: IDLFile) => {
            const grouped = groupByNamespace(fqNames)
            const result = new Map<string, string[]>()

            for (const [ns, names] of grouped) {
                const entities = new Set<string>()
                if (ns === 'compiler') {
                    const impl = idl.entries.find(e => isInterface(e) && isImplInterface(e.name))
                        ?? throwException("Cannot find es2panda_Impl");
                    (impl as IDLInterface).methods
                        .filter(m => !config.ignore.isIgnoredMethod(impl.name, m.name))
                        .forEach(m => entities.add(m.name))

                } else {
                    const nss = idl.entries.filter(e => isNamespace(e) && e.name === ns) as IDLNamespace[]
                    nss
                        .flatMap(ns => ns.members)
                        .filter(e => isInterface(e) && !config.ignore.isIgnoredInterface(e.name, ns))
                        .forEach(e => entities.add(e.name))
                }

                // Format " * | <char>[*][!] "
                // Order of execution:
                // - Single star *
                // - Star at the end
                // - Whole string matching
                const included = names.includes('*') ? entities : new Set<string>()
                const globNames = names.filter(n => n.includes('*') && n.length > 1)
                const regularNames = names.filter(n => !n.includes('*'))

                globNames.forEach(p => {
                    const exclude = p.at(-1) === '!'
                    const pattern = p.slice(0, exclude ? -2 : -1)

                    if (exclude) {
                        for (const s of included.values()) {
                            if (s.startsWith(pattern)) {
                                included.delete(s)
                            }
                        }
                    } else {
                        for (const s of entities.values()) {
                            if (s.startsWith(pattern)) {
                                included.add(s)
                            }
                        }
                    }
                })

                regularNames.forEach(n => {
                    const exclude = n.at(-1) === '!'
                    const name = exclude ? n.slice(0, -1) : n
                    if (n !== name) {
                        included.delete(name)
                    } else {
                        if (entities.has(name)) {
                            included.add(name)
                        } else {
                            console.log(`WARN: no entity ${name} in scope ${ns}!`);
                        }
                    }
                })

                result.set(ns, [...included.values()])
            }
            return result
        }

        const classes = resolveNames(config.aliases.classes, idl)
        const functions = resolveNames(config.aliases.functions, idl)

        writer.writeLines('\n// Aliases\n');

        [...classes.keys()].concat(...functions.keys()).forEach(ns =>  {
            const file = ns === 'compiler' ? 'public' : ns
            writer.writeImports(`./peers/${file}`, [ns], [''])
       })

        classes.forEach((clss, ns) =>
            clss.forEach(cls =>
                writer.writeLines(
                    `export class ${cls} extends ${ns}.${cls} {}`,
                )
            )
        )

        functions.forEach((funcs, ns) =>
            funcs.forEach(name => {
                const func = pascalToCamel(name)
                writer.writeLines(
                    `export const ${func} = ${ns}.${func}`,
                )
            })
        )

        return writer.getOutput().join('\n')
    }
}
