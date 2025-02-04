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
import { ImportsCollector } from "./ImportsCollector";
import { PeerLibrary } from "./PeerLibrary";
import { createLanguageWriter } from "./LanguageWriters";
import { join } from "node:path";
import { writeIntegratedFile } from "./common";

export enum LayoutNodeRole {
    PEER,
    INTERFACE,
}

interface LayoutManagerAllocated {
    printer: LanguageWriter
    collector: ImportsCollector
}

interface LayoutManagerRecord {
    printer: LanguageWriter
    collector: ImportsCollector
}

export interface LayoutManagerStrategy {
    resolve(node:IDLNode, role:LayoutNodeRole): string
}

export class LayoutManager {

    private storage = new Map<string, LayoutManagerRecord>()

    constructor(
        private strategy: LayoutManagerStrategy,
        private library: PeerLibrary
    ) { }

    allocate(node:IDLNode, role:LayoutNodeRole): LayoutManagerAllocated {
        const place = this.strategy.resolve(node, role)
        if (!this.storage.has(place)) {
            this.storage.set(place, {
                printer: createLanguageWriter(this.library.language, this.library),
                collector: new ImportsCollector()
            })
        }
        return this.storage.get(place)!
    }

    resolve(node:IDLNode, role:LayoutNodeRole): string {
        return this.strategy.resolve(node, role)
    }

    entries(): [string, LayoutManagerRecord][] {
        return Array.from(this.storage.entries())
    }

    ////////////////////////////////////////////////////////////////////

    static Empty(lib:PeerLibrary): LayoutManager {
        return new LayoutManager({ resolve: () => '' }, lib)
    }
}

export function install(outDir:string, manager: LayoutManager, ext:string) {
    manager.entries().forEach(it => {
        const [filePath, record] = it
        const installPath = join(outDir, filePath) + ext
        const content = record
            .collector.printToLines(filePath)
            .concat(record.printer.getOutput())
            .join('\n')

        writeIntegratedFile(installPath, content, 'producing')
    })
}
