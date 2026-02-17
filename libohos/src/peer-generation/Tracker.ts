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
import * as idl from '@idlizer/core/idl'

import {
    IndentedPrinter,
    MaterializedClass,
    PeerClass,
    PeerLibrary,
    capitalize,
    createConstructPeerMethod,
    generatorConfiguration,
    isImportAttr,
} from '@idlizer/core'
import { createGlobalScopeLegacy } from './GlobalScopeUtils.js';
import { collectDeclarationTargets } from "./DeclarationTargetCollector.js"
import { collectPeersForFile } from './PeersCollector.js'
import { getHookMethod, peerGeneratorConfiguration } from "../DefaultConfiguration.js"

const STATUSES = ["Total", "In Progress", "Done", "Blocked", "Managed side"]
const TOP_PARENT = 'unnamed'

function getFileName(node: idl.IDLNode | undefined) {
    if (node && idl.isEnumMember(node)) node = node.parent // Fix for enum member not having fileName
    return node?.fileName?.split('/').at(-1)
}

function traceColumns(node: idl.IDLNode | undefined) {
    let trace = node ? idl.getExtAttribute(node, idl.IDLExtendedAttributes.TraceKey) : undefined
    trace ??= `${getFileName(node)}:unknown:unknown:-1`
    return `|${trace.replaceAll(':','|')}`
}

class TrackerVisitor {
    private out = new IndentedPrinter()
    private stats = new IndentedPrinter()

    constructor(
        protected library: PeerLibrary,
        protected track: Map<string, StatusRecord>
    ) { }

    private allComponents = Array(STATUSES.length).fill(0)
    private allMaterialized = Array(STATUSES.length).fill(0)
    private allFunctions = Array(STATUSES.length).fill(0)
    private tracked = new Set<string>()

    tracking(key: string, status?: string): string {
        let record = this.track.get(key)
        if (record === undefined && key.endsWith('0')) record = this.track.get(key.substr(0, key.length - 1))
        if (record) {
            return `${record.owner} | ${record.status} | ${record.testStatus} | ${record.testVersion} | ${record.comment} |`
        }
        return ` | ${status ?? ''} |  |  |  |`
    }

    printEntry(entry: idl.IDLNamedNode, parent: string, type: string, status?: string) {
        let kk = key(parent, entry.name)
        let wrap = (str: string, em: string, flag: boolean = true) => flag ? `${em}${str}${em}` : str
        let isTop = parent == TOP_PARENT
        this.out.print(`${traceColumns(entry)}|${parent}|${wrap(entry.name, isTop ? '*' : '`')}|${wrap(type, '*', isTop)}| ${this.tracking(kk, status)}`)
    }

    printPeerClass(clazz: PeerClass): void {
        let compKey = key(clazz.componentName, `set${clazz.componentName}Options0`)
        if (!this.track.has(compKey)) {
            compKey = key(clazz.componentName, `set${clazz.componentName}Options`)
        }
        this.incAllStatus(compKey, this.allComponents)
        this.out.print(`${traceColumns(clazz.decl)}|unnamed|*${clazz.componentName}*|*Component*| ${this.tracking(compKey)}`)
        {
            let method = createConstructPeerMethod(clazz)
            let mname = method.sig.name
            const funcKey = key(clazz.componentName, mname)
            this.incAllStatus(funcKey, this.allFunctions)
            // Special case, constructor is absent in SDK
            let classTc = traceColumns(clazz.decl).split('|')
            let tc = `|${classTc[1]}|${classTc[3]}|undeclared|-1`
            this.out.print(`${tc}|${clazz.componentName}|\`${mname}\`|Function| ${this.tracking(funcKey)}`)
        }
        clazz.methods.forEach(method => {
            const hookMethod = getHookMethod(method.originalParentName, method.method.name)
            if (hookMethod?.replaceImplementation) return
            let mname = method.sig.name
            const funcKey = key(clazz.componentName, mname)
            this.incAllStatus(funcKey, this.allFunctions)
            this.out.print(`${traceColumns(method.decl)}|${clazz.componentName}|\`${mname}\`|Function| ${this.tracking(funcKey)}`)
        })
    }

    printMaterializedClass(clazz: MaterializedClass) {
        const classKey = key(clazz.className, "Class")
        this.incAllStatus(classKey, this.allMaterialized)
        this.out.print(`${traceColumns(clazz.decl)}|unnamed|*${clazz.className}*|*Class*| ${this.tracking(classKey)}`)
        clazz.ctors.forEach(method => {
            let mname = method.sig.name
            const funcKey = key(clazz.className, mname)
            this.incAllStatus(funcKey, this.allFunctions)
            // Special case, constructor is absent in SDK
            let tc = traceColumns(method.decl)
            if (tc.startsWith('|undefined|')) {
                let classTc = traceColumns(clazz.decl).split('|')
                tc = `|${classTc[1]}|${classTc[3]}|undeclared|-1`
            }
            this.out.print(`${tc}|${clazz.className}|\`${mname}\`|Function| ${this.tracking(funcKey)}`)
        })
        clazz.methods.forEach(method => {
            const hookMethod = getHookMethod(method.originalParentName, method.method.name)
            if (hookMethod?.replaceImplementation) return
            let mname = method.sig.name
            const funcKey = key(clazz.className, mname)
            this.incAllStatus(funcKey, this.allFunctions)
            let origName = method.method.name
            if (origName.startsWith("set") || origName.startsWith("get")) {
                if (clazz.decl.methods.findIndex(it => it.name == origName) == -1) {
                    let noPrefix = origName.substr(3)
                    let idx = clazz.decl.properties.findIndex(it => {
                        let res = capitalize(it.name) == noPrefix
                        if (res) {
                            let accessor = idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor)
                            if (!accessor) return true
                            if (accessor == idl.IDLAccessorAttribute.Getter) return origName.startsWith("get")
                            if (accessor == idl.IDLAccessorAttribute.Setter) return origName.startsWith("set")
                            throw "Shouldn't happen!"
                        }
                    })
                    if (idx != -1) {
                        let prop = clazz.decl.properties[idx]
                        this.out.print(`${traceColumns(prop)}|${clazz.className}|\`${mname}\`|Property| ${this.tracking(funcKey)}`)
                        return
                    }
                }
            }
            this.out.print(`${traceColumns(method.decl)}|${clazz.className}|\`${mname}\`|Function| ${this.tracking(funcKey)}`)
        })
    }

    printStruct(struct: idl.IDLInterface) {
        this.printEntry(struct, TOP_PARENT, 'Interface', 'generated')
        if (struct.subkind == idl.IDLInterfaceSubkind.Tuple) return
        struct.properties.forEach(prop => {
            this.printEntry(prop, struct.name, 'Property', 'generated')
        })
        struct.constructors.forEach(it => {
            this.printEntry(it, struct.name, 'Function', 'deleted config')
        })
    }

    printBuilder(struct: idl.IDLInterface) {
        this.printEntry(struct, TOP_PARENT, 'Interface', 'generated')
        struct.methods.forEach(it => {
            this.printEntry(it, struct.name, 'Property', 'generated')
        })
        struct.constructors.forEach(it => {
            this.printEntry(it, struct.name, 'Function', 'deleted config')
        })
    }

    printEnum(enam: idl.IDLEnum) {
        this.printEntry(enam, TOP_PARENT, 'Enum', 'generated')
        enam.elements.forEach(elem => {
            this.printEntry(elem, enam.name, 'Enum', 'generated')
        })
    }

    printTypedef(ref: idl.IDLNamedNode) {
        this.printEntry(ref, TOP_PARENT, 'Typedef', 'generated')
    }

    printFunction(func: idl.IDLNamedNode) {
        this.printEntry(func, TOP_PARENT, 'Function')
    }

    printStats() {
        this.stats.print(`| Status       | Components | Classes | Functions |`)
        this.stats.print(`| -----------  | ---------- | ------- | --------- |`)
        STATUSES.forEach((status, i) => {
            this.stats.print(`| ${status.padEnd(12)} | ${this.allComponents[i]}      | ${this.allMaterialized[i]}     | ${this.allFunctions[i]}     |`)
        })
    }

    incAllStatus(key: string, counter: number[]) {
        // check overloaded methods
        if (this.tracked.has(key)) {
            return
        }
        this.tracked.add(key)
        counter[0]++
        const statusRecord = this.track.get(key)
        if (!statusRecord) return
        const updated = { flag: false }
        STATUSES.slice(1).forEach((status, index) => {
            this.incStatus(statusRecord, status, index + 1, counter, updated)
        })
        if (!updated.flag && statusRecord.status != '') {
            console.log(`Unknown status "${statusRecord.status}" for key ${key}`)
        }
    }

    incStatus(record: StatusRecord, status: string, index: number, counter: number[], updated: { flag: boolean }) {
        if (record && startsIgnoreCase(record.status, status)) {
            counter[index]++
            updated.flag = true
        }
    }

    printTo(fileName: string) {
        this.out.print(`| Package | SDK Parent | SDK Name | Ovr | C API Parent | C API Name | Type | Owner | Status | Test status | Test version | Comments |`)
        this.out.print(`| ------- | ---------- | -------- | --- | ------------ | ---------- | ---- | ----- | ------ | ----------- | ------------ | -------- |`)

        let printEntry = (target: idl.IDLNode) => {
                if (!idl.isNamedNode(target) || peerGeneratorConfiguration().serializer.ignore.includes(target.name)) return
                if (isImportAttr(target)) return
                if (idl.hasExtAttribute(target, idl.IDLExtendedAttributes.ComponentInterface)) return
                if (idl.isSyntheticEntry(target)) {
                    return
                }
                let cfg = generatorConfiguration()
                if (idl.isInterface(target) && !idl.hasExtAttribute(target, idl.IDLExtendedAttributes.Component) &&
                    (target.methods.length == 0 || target.subkind == idl.IDLInterfaceSubkind.Interface) &&
                    (target.constructors.length == 0 || cfg.ignoreMaterialized.includes(target.name)) &&
                    target.properties.length != 0) {
                    this.printStruct(target)
                    return
                }
                if (idl.isInterface(target) && cfg.builderClasses.includes(target.name)) {
                    this.printBuilder(target)
                    return
                }
                if (idl.isEnum(target)) {
                    this.printEnum(target)
                    return
                }
                if (idl.isTypedef(target) && !idl.hasExtAttribute(target, idl.IDLExtendedAttributes.Import)) {
                    this.printTypedef(target)
                    return
                }
                if (idl.isCallback(target)) {
                    this.printTypedef(target)
                    return
                }
                if (idl.isMethod(target)) {
                    this.printFunction(target)
                    return
                }
                if (idl.isNamespace(target)) {
                    target.members.forEach(target => printEntry(target))
                    return
                }
                if (idl.isUnionType(target)) {
                    // Most probably synthetic union type
                    if (!idl.hasExtAttribute(target, idl.IDLExtendedAttributes.TraceKey)) return
                    this.printTypedef(target)
                    return
                }
        }

        this.library.files.forEach(file => {
            collectPeersForFile(this.library, file).forEach(clazz => this.printPeerClass(clazz))
            //file.entries.forEach(target => printEntry(target))
        })
        this.library.orderedMaterialized.forEach(clazz => {
            this.printMaterializedClass(clazz)
        })
        const globals = createGlobalScopeLegacy(this.library)
        this.printMaterializedClass(globals)

        collectDeclarationTargets(this.library, true).forEach(it => printEntry(it))
        this.out.print('')

        this.stats.print(`# All components`)
        this.stats.print('')
        this.printStats()
        this.stats.print('')

        this.stats.append(this.out)
        this.stats.printTo(fileName)
    }
}

class StatusRecord {
    constructor(
        public component: string,
        public func: string,
        public owner: string,
        public status: string,
        public testStatus: string,
        public testVersion: string,
        public comment: string,
    ) { }
}

function key(component: string, func: string): string {
    return `${component}:${func}`
}

function optionsFunction(component: string) {
    return `set${component}Options`
}

export function generateTracker(outDir: string, peerLibrary: PeerLibrary, trackerStatus: string, verbose: boolean = false): void {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
    let track = new Map<string, StatusRecord>()
    if (fs.existsSync(trackerStatus)) {
        console.log(`Using status ${trackerStatus}`)
        const content = fs.readFileSync(trackerStatus, 'utf8')
        const lines = content.split('\n')
        let parent = ""
        lines.forEach(line => {
            const parts = line.split('|')
            if (parts.length > 8) {
                // New format
                let parent = trimName(parts[1].trim())
                let name = trimName(parts[2].trim())
                let kind = trimName(parts[3].trim())
                let owner = parts[4].trim()
                let status = parts[5].trim()
                let testStatus = parts[6].trim()
                let testVersion = parts[7].trim()
                let comment = parts[8].trim()
                const k = kind === "Class" ? key(name, kind) : key(parent, name)
                track.set(k, new StatusRecord(name, kind, owner, status, testStatus, testVersion, comment))
            } else if (parts.length > 4) {
                let name = trimName(parts[1].trim())
                let kind = trimName(parts[2].trim())
                let owner = parts[3].trim()
                let status = parts[4].trim()
                if (kind === "Component" || kind === "Class") {
                    parent = name
                }
                const k = kind === "Function" ? key(parent, name) : key(name, kind)
                track.set(k, new StatusRecord(name, kind, owner, status, '', '', ''))
            }
        })
    }

    const visitor = new TrackerVisitor(peerLibrary, track)
    visitor.printTo(path.join(outDir, "COMPONENTS.md"))
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
