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
        this.out.print(`|*${clazz.componentName}*| *Component* | ${this.tracking(clazz.componentName, "Component")}`)
        clazz.methods.forEach(method => {
            if (!seen.has(method.method.name)) {
                this.out.print(`|\`${method.method.name}\`| Function | ${this.tracking(clazz.componentName, method.method.name)}`)
                seen.add(method.method.name)
            }
        })
    }

    printMaterializedClass(clazz: MaterializedClass) {
        let seen = new Set<string>()
        this.out.print(`|*${clazz.className}*| *Class* | ${this.tracking(clazz.className, "Class")}`)
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
        let allComponents = [0, 0, 0, 0]
        let allMaterialized = [0, 0, 0, 0]
        let allFunctions = [0, 0, 0, 0]

        this.library.files.forEach(file => {
            file.peers.forEach(component => {
                allComponents[0]++
                const compKey = key(component.componentName, "Component")
                this.incStatus(compKey, "In Progress", 1, allComponents)
                this.incStatus(compKey, "Done", 2, allComponents)
                this.incStatus(compKey, "Blocked", 3, allComponents)
                component.methods.forEach(method => {
                    allFunctions[0]++
                    const funcKey = key(component.componentName, method.method.name)
                    this.incStatus(funcKey, "In Progress", 1, allFunctions)
                    this.incStatus(funcKey, "Done", 2, allFunctions)
                    this.incStatus(funcKey, "Blocked", 3, allFunctions)
                })
            })
        })
        this.library.materializedClasses.forEach(clazz => {
            allMaterialized[0]++
            const classKey = key(clazz.className, "Class")
            this.incStatus(classKey, "In Progress", 1, allMaterialized)
            this.incStatus(classKey, "Done", 2, allMaterialized)
            this.incStatus(classKey, "Blocked", 3, allMaterialized)
            clazz.methods.forEach(method => {
                allFunctions[0]++
                const funcKey = key(clazz.className, method.method.name)
                this.incStatus(funcKey, "In Progress", 1, allFunctions)
                this.incStatus(funcKey, "Done", 2, allFunctions)
                this.incStatus(funcKey, "Blocked", 3, allFunctions)
            })
        })

        this.out.print(`| Status       | Components | Classes | Functions |`)
        this.out.print(`| -----------  | ---------- | ------- | --------- |`)
        this.out.print(`| Total        | ${allComponents[0]}      | ${allMaterialized[0]}     | ${allFunctions[0]}     |`)
        this.out.print(`| In Progress  | ${allComponents[1]}      | ${allMaterialized[1]}     | ${allFunctions[1]}     |`)
        this.out.print(`| Done         | ${allComponents[2]}      | ${allMaterialized[2]}     | ${allFunctions[2]}     |`)
        this.out.print(`| Blocked      | ${allComponents[3]}      | ${allMaterialized[3]}     | ${allFunctions[3]}     |`)
    }

    incStatus(key: string, status: string, index: number, counter: number[]) {
        let track = this.track.get(key)
        if (track && equalsIgnoreCase(track.status, status)) {
            counter[index]++
        }
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
        let parent = ""
        lines.forEach(line => {
            const parts = line.split('|')
            if (parts.length > 4) {
                let name = trimName(parts[1].trim())
                let kind = trimName(parts[2].trim())
                let owner = parts[3].trim()
                let status = parts[4].trim()
                if (kind === "Component" || kind === "Class") {
                    parent = name
                }
                const k = kind === "Function" ? key(parent, name) : key(name, kind)
                track.set(k, new StatusRecord(name, kind, owner, status))
            }
        })
    }

    const visitor = new TrackerVisitor(peerLibrary, track)
    visitor.print()
    visitor.out.printTo(path.join(outDir, "COMPONENTS.md"))
}

function  equalsIgnoreCase(str1: string, str2: string): boolean {
    return str1.toLowerCase() == str2.toLowerCase()
}

function trimName(key: string): string {
    function trim(v: string, c: string): string {
        return v.startsWith(c) && v.endsWith(c) ? v.substring(1, v.length - 1) : v
    }
    key = trim(key, '*')
    key = trim(key, '`')
    return key
}