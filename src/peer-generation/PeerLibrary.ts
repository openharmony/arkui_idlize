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


import { DeclarationTable } from "./DeclarationTable";
import { MaterializedClass } from "./Materialized";
import { PeerClass } from "./PeerClass";
import { PeerFile } from "./PeerFile";

export type PeerLibraryOutput = {
    outputC: string[]
}

export class PeerLibrary {
    public readonly files: PeerFile[] = []
    public readonly materializedClasses: Map<string, MaterializedClass> = new Map()

    constructor(
        public declarationTable: DeclarationTable
    ) {}

    readonly customComponentMethods: string[] = []
    readonly importTypesStubs: string[] = []

    findPeerByComponentName(componentName: string): PeerClass | undefined {
        for (const file of this.files)
            for (const peer of file.peers.values())
                if (peer.componentName == componentName) 
                    return peer
        return undefined
    }
}