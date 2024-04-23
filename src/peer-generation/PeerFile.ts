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

import * as path from "path"
import { getOrPut, renameDtsToPeer, renameDtsToComponent } from "../util"
import { PeerClass } from "./PeerClass"
import { Printers } from "./Printers"
import { ImportsCollector } from "./ImportsCollector"

export class PeerFile {
    private readonly peers: Map<string, PeerClass> = new Map()
    constructor(
        public readonly originalFilename: string,
        private readonly printers: Printers,
    ) {}

    getOrPutPeer(componentName: string) {
        return getOrPut(this.peers, componentName, () => new PeerClass(componentName, this.originalFilename, this.printers))
    }

    private printImports(): void {
        const peerImports = new ImportsCollector()
        peerImports.addFilterByBasename(renameDtsToPeer(path.basename(this.originalFilename)))
        const componentImports = new ImportsCollector()
        componentImports.addFilterByBasename(renameDtsToComponent(path.basename(this.originalFilename)))
        this.peers.forEach(peer => {
            peer.collectPeerImports(peerImports)
            peer.collectComponentImports(componentImports)
        })
        peerImports.print(this.printers.TSPeer)
        componentImports.print(this.printers.TSComponent)
    }

    print(): void {
        this.printImports()
        this.peers.forEach(it => it.print())
    }
}