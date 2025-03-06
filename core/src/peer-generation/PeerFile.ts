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

import * as idl from '../idl'
import { PeerClass } from "./PeerClass"
import { LibraryFileInterface } from '../LibraryInterface'

export class PeerFile implements LibraryFileInterface {
    readonly peers: Map<string, PeerClass> = new Map()

    constructor(
        public readonly file: idl.IDLFile,
    ) {}

    public packageName(): string {
        return this.packageClause().join(".")
    }

    public packageClause(): string[] {
        return this.file.packageClause
    }

    get peersToGenerate(): PeerClass[] {
        const peers = Array.from(this.peers.values())
        return peers
    }

    // TODO just to not refactor too much in one PR
    get entries(): idl.IDLEntry[] {
        return this.file.entries
    }

    // TODO just to not refactor too much in one PR
    get originalFilename(): string {
        return this.file.fileName!
    }
}
