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
import * as fs from 'fs'
import * as path from 'path'

import { PeerLibrary } from "./PeerLibrary";
import { IndentedPrinter } from "../IndentedPrinter";
import { PeerClass } from "./PeerClass";
import { MaterializedClass } from "./Materialized";
import { EnumEntity } from './PeerFile';

export class TrackerVisitor {
    out = new IndentedPrinter()

    constructor(
        protected library: PeerLibrary
    ) { }

    printPeerClass(clazz: PeerClass): void {
        this.out.print(`|*${clazz.componentName}*| *Component* | |`)
        clazz.methods.forEach(method => {
            this.out.print(`|\`${method.method.name}\`| Function | |`)
        })
    }

    printMaterializedClass(clazz: MaterializedClass) {
        this.out.print(`|*${clazz.className}*| *Class* | |`)
        clazz.methods.forEach(method => {
            this.out.print(`|\`${method.method.name}\`| Function | |`)
        })
    }

    printEnum(enam: EnumEntity) {
        this.out.print(`## Enum ${enam.name}`)
    }

    print() {
        this.out.print(`# All components`)

        this.out.print(`Name | Kind | Owner`)
        this.out.print(`---- | ---- | -----`)

        this.library.files.forEach(file => {
            file.peers.forEach(clazz => this.printPeerClass(clazz))
            //file.enums.forEach(enam => this.printEnum(enam))

        })
        this.library.materializedClasses.forEach(clazz => {
            this.printMaterializedClass(clazz)
        })
    }
}

export function generateTracker(outDir: string, peerLibrary: PeerLibrary): void {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
    const visitor = new TrackerVisitor(peerLibrary)
    visitor.print()
    visitor.out.printTo(path.join(outDir, "COMPONENTS.md"))
}