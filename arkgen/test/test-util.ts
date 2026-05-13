/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import * as path from "path"
import { Language, toIDL, PeerFile } from "@idlizer/core"
import { createReferenceType, IDLEntry } from "@idlizer/core/idl"
import { PeerLibrary } from "../src/peer-generation/PeerLibrary"

export class IDLTestData {
    readonly peerLibrary: PeerLibrary

    constructor(idlFiles: string[]) {
        this.peerLibrary = new PeerLibrary(Language.TS)
        idlFiles.forEach(file =>
            this.peerLibrary.files.push(new PeerFile(file, toIDL(path.join(__dirname, file)))))
    }

    lookup<T extends IDLEntry>(name: string): T {
        return this.peerLibrary.resolveTypeReference(createReferenceType(name)) as T
    }
}

export function withDataFrom(idlFiles: string | string[], testFunc: (data: IDLTestData) => void) {
    testFunc(new IDLTestData(typeof idlFiles === "string" ? [idlFiles] : idlFiles))
}