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
import { DeclarationTable } from "./DeclarationTable"
import { IndentedPrinter } from "../IndentedPrinter"

export class PeerFile {
    readonly peers: Map<string, PeerClass> = new Map()
    constructor(
        public readonly originalFilename: string,
        public readonly declarationTable: DeclarationTable,
    ) {}

    getOrPutPeer(componentName: string) {
        return getOrPut(this.peers, componentName, () => new PeerClass(this, componentName, this.originalFilename, this.declarationTable))
    }

    generateComponent(): string[] {
        const componentImports = new ImportsCollector()
        componentImports.addFilterByBasename(renameDtsToComponent(path.basename(this.originalFilename), this.declarationTable.language))
        this.peers.forEach(peer => peer.collectComponentImports(componentImports))

        const printer = new IndentedPrinter()
        componentImports.print(printer)
        this.peers.forEach(peer => peer.printComponent(printer))
        return printer.getOutput()
    }

    generatePeer(): string[] {
        const peerImports = new ImportsCollector()
        peerImports.addFilterByBasename(renameDtsToPeer(path.basename(this.originalFilename), this.declarationTable.language))
        this.peers.forEach(peer => peer.collectPeerImports(peerImports))

        const printer = new IndentedPrinter()
        peerImports.print(printer)
        PeerFile._defaultPeerImports.forEach(it => printer.print(it))
        this.peers.forEach(peer => peer.printPeer(printer))
        return printer.getOutput()
    }

    printGlobal(printers: Printers): void {
        this.peers.forEach(it => it.printGlobal(printers))
    }

    private static readonly _defaultPeerImports = [
        `import { int32 } from "@koalaui/common"`,
        `import { PeerNode } from "@koalaui/arkoala"`,
        `import { nullptr, KPointer } from "@koalaui/interop"`,
        `import { runtimeType, withLength, withLengthArray, RuntimeType } from "./SerializerBase"`,
        `import { Serializer } from "./Serializer"`,
        `import { nativeModule } from "./NativeModule"`,
        `import { ArkUINodeType } from "./ArkUINodeType"`,
        `import { ArkCommon } from "./ArkCommon"`,
    ]
}