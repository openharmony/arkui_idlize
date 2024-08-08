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

class TrackerVisitor {
    out = new IndentedPrinter()

    constructor(
        protected library: PeerLibrary,
        protected track: Map<string, StatusRecord>
    ) { }

    tracking(component: string, func: string): string {
        const record = this.track.get(key(component, func))
        if (record) {
            return `${record.owner} | ${record.status} |`
        }
        return '| |'
    }

    printPeerClass(clazz: PeerClass): void {
        let seen = new Set<string>()
        this.out.print(`|*${clazz.componentName}*| *Component* | ${this.tracking(clazz.componentName, "")}`)
        clazz.methods.forEach(method => {
            if (!seen.has(method.method.name)) {
                this.out.print(`|\`${method.method.name}\`| Function | ${this.tracking(clazz.componentName, method.method.name)}`)
                seen.add(method.method.name)
            }
        })
    }

    printMaterializedClass(clazz: MaterializedClass) {
        let seen = new Set<string>()
        this.out.print(`|*${clazz.className}*| *Class* | ${this.tracking(clazz.className, "")}`)
        clazz.methods.forEach(method => {
            if (!seen.has(method.method.name)) {
                this.out.print(`|\`${method.method.name}\`| Function | ${this.tracking(clazz.className, method.method.name)}`)
                seen.add(method.method.name)
            }
        })
    }

    printEnum(enam: EnumEntity) {
        this.out.print(`## Enum ${enam.name}`)
    }

    printStats() {
        let allComponents = [0, 0, 0]
        let allMaterialized = [0, 0, 0]
        let allFunctions = [0, 0, 0]

        this.library.files.forEach(file => {
            file.peers.forEach(component => {
                allComponents[0]++
                component.methods.forEach(method => {
                    allFunctions[0]++
                    let track = this.track.get(key(component.componentName, method.method.name))
                    if (track) {
                        if (track.status == "In Progress") allFunctions[1]++
                        if (track.status == "Done") allFunctions[2]++
                    }
                })
            })
        })
        this.library.materializedClasses.forEach(clazz => {
            allMaterialized[0]++
            clazz.methods.forEach(method => {
                allFunctions[0]++
                let track = this.track.get(key(clazz.className, method.method.name))
                    if (track) {
                        if (track.status == "In Progress") allFunctions[1]++
                        if (track.status == "Done") allFunctions[2]++
                    }
            })
        })

        this.out.print(`| Status       | Components | Classes | Functions |`)
        this.out.print(`| -----------  | ---------- | ------- | --------- |`)
        this.out.print(`| Total        | ${allComponents[0]}      | ${allMaterialized[0]}     | ${allFunctions[0]}     |`)
        this.out.print(`| In Progress  | ${allComponents[1]}      | ${allMaterialized[1]}     | ${allFunctions[1]}     |`)
        this.out.print(`| Done         | ${allComponents[2]}      | ${allMaterialized[2]}     | ${allFunctions[2]}     |`)
    }

    print() {
        this.out.print(`# All components`)

        this.out.print("\n")

        this.printStats()

        this.out.print("\n")

        this.out.print(`| Name | Kind | Owner | Status |`)
        this.out.print(`| ---- | ---- | ----- | ------ |`)

        this.library.files.forEach(file => {
            file.peers.forEach(clazz => this.printPeerClass(clazz))
            //file.enums.forEach(enam => this.printEnum(enam))

        })
        this.library.materializedClasses.forEach(clazz => {
            this.printMaterializedClass(clazz)
        })
    }
}

class StatusRecord {
    constructor(
        public component: string,
        public func: string,
        public owner: string,
        public status: string) { }
}

function key(component: string, func: string): string {
    return `${component}:${func}`
}

export function generateTracker(outDir: string, peerLibrary: PeerLibrary, trackerStatus: string): void {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
    let track = new Map<string, StatusRecord>()
    if (fs.existsSync(trackerStatus)) {
        console.log(`Using status ${trackerStatus}`)
        const content = fs.readFileSync(trackerStatus, 'utf8')
        const lines = content.split('\n')
        lines.forEach(line => {
            const parts = line.split('|')
            if (parts.length > 4) {
                let component = parts[1].trim()
                let func = parts[2].trim()
                let owner = parts[3].trim()
                let status = parts[4].trim()
                track.set(key(component, func), new StatusRecord(component, func, owner, status))
            }
        })
    }

    const visitor = new TrackerVisitor(peerLibrary, track)
    visitor.print()
    visitor.out.printTo(path.join(outDir, "COMPONENTS.md"))
}