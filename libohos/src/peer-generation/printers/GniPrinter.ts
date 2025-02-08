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

import { IndentedPrinter, PeerClass, MaterializedClass, PeerLibrary } from '@idlizer/core'
import { makeFileNameFromClassName } from "../FileGenerators"

export class GniVisitor {
    gni = new IndentedPrinter()

    constructor(
        protected library: PeerLibrary
    ) { }

    printGniEntries(clazz: PeerClass): void {
        const className = makeFileNameFromClassName(clazz.componentName)
        this.gni.print(`"implementation/${className}_modifier.cpp",`)
    }

    printMaterializedClassSourcePaths(clazz: MaterializedClass) {
        const className = makeFileNameFromClassName(clazz.className)
        this.gni.print(`"implementation/${className}_accessor.cpp",`)
    }

    // TODO: have a proper Peer module visitor
    printGniSource() {
        this.gni.print("declare_args() {")
        this.gni.pushIndent()
        this.gni.print("include_generated_sources = false")
        this.gni.popIndent()
        this.gni.print("}")

        this.gni.print("generated_sources = [")
        this.gni.pushIndent()
        this.library.files.forEach(file => {
            file.peers.forEach(clazz => this.printGniEntries(clazz))
        })
        this.library.materializedClasses.forEach(clazz => {
            this.printMaterializedClassSourcePaths(clazz)
        })

        this.gni.print(`"utility/converter.cpp",`)
        this.gni.print(`"implementation/view_model_bridge.cpp",`)
        this.gni.print(`"implementation/all_modifiers.cpp",`)
        this.gni.print(`"implementation/all_events.cpp",`)

        this.gni.popIndent()
        this.gni.print("]")
    }
}

export function printGniSources(peerLibrary: PeerLibrary): string {
    const visitor = new GniVisitor(peerLibrary)
    visitor.printGniSource()
    return visitor.gni.getOutput().join("\n")
}
