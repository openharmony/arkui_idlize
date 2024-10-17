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
import { IdlPeerLibrary } from './idl/IdlPeerLibrary';
import { IdlPeerClass } from './idl/IdlPeerClass';

const STATUSES = ["Total", "In Progress", "Done", "Blocked"]

class TrackerVisitor {
    out = new IndentedPrinter()

    constructor(
        protected library: PeerLibrary | IdlPeerLibrary,
        protected track: Map<string, StatusRecord>
    ) { }

    tracking(component: string, func: string): string {
        const record = this.track.get(key(component, func))
        if (record) {
            return `${record.owner} | ${record.status} |`
        }
        return '| |'
    }

    printPeerClass(clazz: PeerClass | IdlPeerClass): void {
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
        let allComponents = Array(STATUSES.length).fill(0)
        let allMaterialized = Array(STATUSES.length).fill(0)
        let allFunctions = Array(STATUSES.length).fill(0)

        this.library.files.forEach(file => {
            file.peers.forEach(component => {
                const compKey = key(component.componentName, "Component")
                this.incAllStatus(compKey, allComponents)
                component.methods.forEach(method => {
                    const funcKey = key(component.componentName, method.method.name)
                    this.incAllStatus(funcKey, allFunctions)
                })
            })
        })
        this.library.materializedClasses.forEach(clazz => {
            const classKey = key(clazz.className, "Class")
            this.incAllStatus(classKey, allMaterialized)
            clazz.methods.forEach(method => {
                const funcKey = key(clazz.className, method.method.name)
                this.incAllStatus(funcKey, allFunctions)
            })
        })

        this.out.print(`| Status       | Components | Classes | Functions |`)
        this.out.print(`| -----------  | ---------- | ------- | --------- |`)
        STATUSES.forEach((status, i) => {
            this.out.print(`| ${status.padEnd(12)} | ${allComponents[i]}      | ${allMaterialized[i]}     | ${allFunctions[i]}     |`)
        })
    }

    incAllStatus(key: string, counter: number[]) {
        counter[0]++
        const statusRecord = this.track.get(key)
        if (!statusRecord) return
        const updated = { flag: false }
        STATUSES.slice(1).forEach((status, index) => {
            this.incStatus(statusRecord, status, index + 1, counter, updated)
        })
        if (!updated.flag) {
            console.log(`Unknown status "${statusRecord.status}" for key ${key}`)
        }
    }

    incStatus(record: StatusRecord, status: string, index: number, counter: number[], updated: { flag: boolean }) {
        if (record && startsIgnoreCase(record.status, status)) {
            counter[index]++
            updated.flag = true
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

function optionsFunction(component: string) {
    return `set${component}Options`
}

export function generateTracker(outDir: string, peerLibrary: PeerLibrary | IdlPeerLibrary, trackerStatus: string, verbose: boolean = false): void {
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
    syncDemosStatus(track, verbose)
}

function  startsIgnoreCase(str1: string, str2: string): boolean {
    return str1.trim().toLowerCase().startsWith(str2.trim().toLowerCase())
}

function trimName(key: string): string {
    function trim(v: string, c: string): string {
        return v.startsWith(c) && v.endsWith(c) ? v.substring(1, v.length - 1) : v
    }
    key = trim(key, '*')
    key = trim(key, '`')
    return key
}

class DemosStatusVerboseLogger {
    private static readonly HEADER = "> Updates in DEMOS_STATUS.md:"
    private static headerLogged: boolean = false

    static log(msg: string) {
        if (!this.headerLogged) {
            this.headerLogged = true
            console.log(this.HEADER)
        }
        console.log("> " + msg)
    }
}

function syncDemosStatus(track: Map<string, StatusRecord>, verbose: boolean = false) {
    const file = path.join(__dirname, "../doc/DEMOS_STATUS.md")
    const pattern =
        /^\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|(.*?)\|.*$/

    const componentsAliases = new Map([
        ["Shape", "CommonShapeMethod"],
        ["Common", "CommonMethod"]
    ])

    let component = "unknown"
    let beginRows = false
    const lengths = []
    let verbosePrinted = false
    let newContent = ""
    const content = fs.readFileSync(file) + ""

    for (let row of content.split(/\r?\n/)) {
        if (!beginRows) {
            if (row.includes("----------")) {
                beginRows = true
                let prevPos = 0
                for (let pos = 0; pos < row.length; pos++) {
                    if (pos > 0 && row[pos] === "|") {
                        lengths.push(pos - prevPos - 1)
                        prevPos = pos
                    }
                }
            }
            newContent += row + "\n"
            continue
        }

        const match = row.match(pattern)
        if (match) {
            const groups = match.splice(1)

            const name = groups[0].trim()
            const kind = groups[1].trim()
            const generated = groups[2].trim()
            const demos = groups[3].trim()
            const ownerLibace = groups[4].trim()
            const statusLibace = groups[5].trim().toLowerCase()
            const ownerTs = groups[6].trim()
            const statusTs = groups[7].trim().toLowerCase()
            const priority = groups[8].trim()

            if (kind === "Component" || kind === "Class") {
                component = name

            } else if (kind === "Function" || kind === "Options") {
                const func = name.split("`")[1]

                let record = kind === "Function" ?
                    track.get(key(component, func)) :
                    track.get(key(component, optionsFunction(component)))

                if (!record) {
                    const alias = componentsAliases.get(component)
                    if (alias) {
                        record = track.get(key(alias, func))
                    }
                }
                if (record) {
                    if (needUpdateOwner(ownerLibace, record.owner) || needUpdateStatus(statusLibace, record.status)) {
                        if (verbose) {
                            DemosStatusVerboseLogger.log(kind === "Function" ? `${component}.${func}` : `${component}({${func}})`)
                            DemosStatusVerboseLogger.log(`  old: ${ownerLibace}, ${statusLibace}`)
                            DemosStatusVerboseLogger.log(`  new: ${record.owner}, ${record.status}`)
                        }
                        newContent += rowForDemosStatus([
                            name, kind, generated, demos, record.owner, record.status, ownerTs, statusTs, priority
                        ], lengths) + "\n"
                        continue
                    }
                }
            }
            newContent += row + "\n"
        }
    }
    fs.writeFileSync(file, newContent)
}

function needUpdateOwner(oldOwner: string, newOwner: string) {
    const oldOwnerNames = oldOwner.split(" ")
    if (oldOwnerNames.length > 1) {
        return !(newOwner.includes(oldOwnerNames[0]) && newOwner.includes(oldOwnerNames[1]))
    }
    return oldOwner !== newOwner
}

function needUpdateStatus(oldStatus: string, newStatus: string) {
    oldStatus = oldStatus.toLowerCase()
    newStatus = newStatus.toLowerCase()
    if (oldStatus === newStatus || newStatus.length === 0) {
        return false
    }
    if (oldStatus === "done/no test" && newStatus === "in progress") {
        return false
    }
    return true
}

function rowForDemosStatus(values: Array<string>, lengths: Array<number>) {
    let row = "|"
    for (let i = 0; i < values.length; i++) {
        const spacesNum = lengths[i] - values[i].length
        row += " " + values[i] + " ".repeat(Math.max(0, spacesNum - 1)) + "|"
    }
    return row
}
