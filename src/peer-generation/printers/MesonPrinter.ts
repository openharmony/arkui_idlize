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

import { IndentedPrinter } from "../../IndentedPrinter"
import { makeFileNameFromClassName } from "../FileGenerators"
import { IdlPeerClass } from "../idl/IdlPeerClass"
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary"
import { MaterializedClass } from "../Materialized"
import { PeerClass } from "../PeerClass"
import { PeerLibrary } from "../PeerLibrary"


export class MesonVisitor {
    printer = new IndentedPrinter()

    constructor(
        protected library: PeerLibrary | IdlPeerLibrary
    ) { }

    printPeerClassSourcePaths(clazz: PeerClass | IdlPeerClass): void {
        const className = makeFileNameFromClassName(clazz.componentName)
        // TODO use names from Libace;
        this.printer.print(`'implementation/${className}_delegate.cpp',`)
        this.printer.print(`'generated/interface/${className}_modifier.cpp',`)
    }

    printMaterializedClassSourcePaths(clazz: MaterializedClass) {
        const className = makeFileNameFromClassName(clazz.className)
        // TODO use names from Libace;
        this.printer.print(`'implementation/${className}_delegate.cpp',`)
        this.printer.print(`'generated/interface/${className}_modifier.cpp',`)
    }

    // TODO: have a proper Peer module visitor
    printMesonBuildContent() {
        this.printer.print("generated_sources = files(")
        this.printer.pushIndent()
        this.printer.print(`'generated/interface/all_modifiers.cpp',`)
        this.library.files.forEach(file => {
            file.peers.forEach(clazz => this.printPeerClassSourcePaths(clazz))
        })
        this.library.materializedClasses.forEach(clazz => {
            this.printMaterializedClassSourcePaths(clazz)
        })
        this.printer.popIndent()
        this.printer.print(")")
        
        this.printer.print("")

        this.printer.print("generated_include_directories = include_directories('generated/interface')")
    }
}

export function printMesonBuild(peerLibrary: PeerLibrary | IdlPeerLibrary): string {
    const visitor = new MesonVisitor(peerLibrary)
    visitor.printMesonBuildContent()
    return visitor.printer.getOutput().join("\n")
}