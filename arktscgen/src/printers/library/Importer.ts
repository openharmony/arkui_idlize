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

import { createDefaultTypescriptWriter } from "../../utils/idl"
import { Config } from "../../general/Config"
import { PeersConstructions } from "../../constuctions/PeersConstructions"
import * as path from "node:path"

export class Importer {
    constructor(
        private dir: string,
        self?: string,
    ) {
        if (self !== undefined) {
            this.seen.add(self)
        }
    }

    private writer = createDefaultTypescriptWriter()

    private seen = new Set<string>([
        Config.astNodeCommonAncestor,
        Config.defaultAncestor, // TODO: handwritten
    ])

    withPeerImport(name: string): string {
        const fq = name.split('.')
        // import namespace name for fq names
        this.withPeerImport2(fq.length > 1 ? fq.slice(0, -1).join('.') : name)
        return name;
    }

    private withPeerImport2(it: string): string {
        if (this.seen.has(it)) {
            return it
        }
        // the 'it' parameter can be a modified peer name
        // and therefor cannot be resolved here
        this.seen.add(it)
        this.import(it, it)
        return it
    }

    withEnumImport(it: string): string {
        if (this.seen.has(it)) {
            return it
        }
        this.seen.add(it)
        this.import(it, `../Es2pandaEnums`)
        return it
    }

    withReexportImport(it: string): string {
        if (this.seen.has(it)) {
            return it
        }
        this.seen.add(it)
        this.import(it, "../../src/reexport-for-generated")
        return it
    }

    addSeen(it: string): void {
        this.seen.add(it)
    }

    private import(name: string, from: string): void {
        this.writer.writeExpressionStatement(
            this.writer.makeString(
                PeersConstructions.import(
                    name,
                    path.normalize(
                        path.join(this.dir, from)
                    ).replaceAll("\\", "/")
                )
            )
        )
    }

    getOutput(): string[] {
        return this.writer.getOutput().sort()
    }
}
