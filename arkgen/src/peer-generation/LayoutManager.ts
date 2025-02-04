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

import { IDLNode, LanguageWriter } from "@idlizer/core/*";
import { join } from "node:path";
import { writeIntegratedFile } from "./common";
import { PeerLibrary } from "./PeerLibrary";
import { ImportsCollector } from "./ImportsCollector";

export enum LayoutNodeRole {
    PEER,
    INTERFACE,
}

export interface LayoutManagerStrategy {
    resolve(node:IDLNode, role:LayoutNodeRole): string
}

export class LayoutManager {
    constructor(
        private strategy: LayoutManagerStrategy
    ) { }

    resolve(node:IDLNode, role:LayoutNodeRole): string {
        return this.strategy.resolve(node, role)
    }
    ////////////////////////////////////////////////////////////////////

    static Empty(): LayoutManager {
        return new LayoutManager({ resolve: () => '' })
    }
}

export interface PrinterResult {
    over: {
        node: IDLNode
        role: LayoutNodeRole
    }
    collector: ImportsCollector
    content: LanguageWriter
    weight?: number
}

export interface PrinterClass {
    print(library:PeerLibrary): PrinterResult[]
}
export interface PrinterFunction {
    (library:PeerLibrary): PrinterResult[]
}
export type Printer = PrinterClass | PrinterFunction

export function install(outDir:string, library:PeerLibrary, printers:Printer[]): string[] {
    const storage = new Map<string, PrinterResult[]>()

    // groupBy
    printers.flatMap(it => typeof it === 'function' ? it(library) : it.print(library)).forEach(it => {
        const filePath = library.layout.resolve(it.over.node, it.over.role)
        if (!storage.has(filePath)) {
            storage.set(filePath, [])
        }
        storage.get(filePath)?.push(it)
    })

    // print
    Array.from(storage.entries()).forEach(([filePath, results]) => {
        const installPath = join(outDir, filePath) + library.language.extension
        results.sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0))

        const imports = new ImportsCollector()
        let content: string[] = []

        for (const record of results) {
            imports.merge(record.collector)
            content = content.concat(record.content.getOutput())
        }

        const text = imports
            .printToLines(filePath)
            .concat(content)
            .join('\n')

        writeIntegratedFile(installPath, text, 'producing')
    })

    return Array.from(storage.keys())
}
