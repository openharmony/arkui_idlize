/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as idl from "@idlizer/core"
import { IdlNodeAny, IdlNodePattern } from "./idltypes";

/**
 * Checks that object is provided.
 */
function isObj(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Checks that pattern matches value.
 */
export function checkPartial<T>(value: T, pattern: any): boolean {
    if (value == null) {
        return false
    }
    for (let k of Object.keys(pattern)) {
        if (isObj((pattern as any)[k])) {
            if ((value as any)[k] == null || !checkPartial((value as any)[k], (pattern as any)[k])) {
                return false;
            }
        } else {
            if ((pattern as any)[k] != (value as any)[k]) {
                return false
            }
        }
    }
    return true
}

type IdlProcessingFunc<State> = (node: IdlNodeAny, state: State) => void

interface IdlProcessingRule<State> {
    pattern: IdlNodePattern
    func: IdlProcessingFunc<State>
}

class IdlProcessignProxy<State> {
    pass: IdlProcessingPass<State>
    pattern: IdlNodePattern
    constructor(reg: IdlProcessingPass<State>, pattern: IdlNodePattern) {
        this.pass = reg
        this.pattern = pattern
    }
    set before(func: IdlProcessingFunc<State>) {
        this.pass.add(func, this.pattern, true)
    }
    set after(func: IdlProcessingFunc<State>) {
        this.pass.add(func, this.pattern)
    }
}

export class IdlProcessingPass<State> {
    name: string
    dependencies: IdlProcessingPass<any>[]
    order: number
    stateMaker: () => State
    rulesBefore: IdlProcessingRule<State>[] = []
    rulesAfter: IdlProcessingRule<State>[] = []
    rulesBeforeByKind = new Map<idl.IDLKind, IdlProcessingRule<State>[]>()
    rulesAfterByKind = new Map<idl.IDLKind, IdlProcessingRule<State>[]>()
    afterAll?: (s: State) => void
    innerState!: State

    constructor(name: string, dependencies: IdlProcessingPass<any>[], stateMaker: () => State) {
        this.name = name
        this.dependencies = dependencies
        this.order = Math.max(0, ...dependencies.map(x => x.order)) + 1
        this.stateMaker = stateMaker
    }

    on(pattern: IdlNodePattern): IdlProcessignProxy<State> {
        return new IdlProcessignProxy<State>(this, pattern)
    }

    add(func: IdlProcessingFunc<State>, pattern: IdlNodePattern, before?: boolean): void {
        if (pattern.kind) {
            appendTo(before ? this.rulesBeforeByKind : this.rulesAfterByKind, pattern.kind, {pattern, func})
        } else {
            // For patterns without `kind` that are still possible
            (before ? this.rulesBefore : this.rulesAfter).push({pattern, func})
        }
    }

    begin(): void {
        this.innerState = this.stateMaker()
    }

    dispatch(value: idl.IDLNode, before?: boolean): void {
        let byKind = before ? this.rulesBeforeByKind : this.rulesAfterByKind
        if (byKind.has(value.kind)) {
            for (let entry of byKind.get(value.kind)!) {
                if (checkPartial(value, entry.pattern)) {
                    entry.func(value as IdlNodeAny, this.innerState)
                }
            }
        }
        // And for patterns without `kind`
        for (let entry of (before ? this.rulesBefore : this.rulesAfter)) {
            if (checkPartial(value, entry.pattern)) {
                entry.func(value as IdlNodeAny, this.innerState)
            }
        }
    }

    end(): void {
        this.afterAll?.(this.innerState)
    }

    get state(): Readonly<State> {
        return this.innerState
    }
}

function appendTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    if (map.has(key)) {
        map.get(key)!.push(value)
    } else {
        map.set(key, [value])
    }
}

export class IdlProcessingManager {
    entries: idl.IDLFile[] = []
    entriesByPath: Map<string, idl.IDLFile> = new Map()
    entriesToValidate: idl.IDLFile[] = []

    featuresByName: Map<string, string> = new Map()
    _activeFeatures: string[] = []

    passes: IdlProcessingPass<any>[] = []
    passesByName: Map<string, IdlProcessingPass<any>> = new Map()
    activePasses: Set<IdlProcessingPass<any>> = new Set()
    orderedPasses: IdlProcessingPass<any>[][] = []

    peerlibrary: idl.PeerLibrary

    constructor() {
        // Only resolution is used for now, so choosing idl.Language.TS does not have language-specific effects
        this.peerlibrary = new idl.PeerLibrary(idl.Language.TS, new idl.NativeModuleType("_UNUSED__"))
        this.peerlibrary.disableFallback()
    }

    addFile(fileName: string, parseOnly?: boolean): void {
        try {
            const loaded = idl.toIDLFile(fileName)[0]
            this.entries.push(loaded)
            this.entriesByPath.set(fileName, loaded)
            if (parseOnly) {
                this.peerlibrary.auxFiles.push(loaded)
            } else {
                this.entriesToValidate.push(loaded)
                this.peerlibrary.files.push(loaded)
            }
        } catch (e: any) {
            if (e.diagnosticMessage != null) {
                idl.DiagnosticMessageEntry.reportCatched(e.diagnosticMessage)
            } else {
                idl.UnknownErrorMessage.reportDiagnosticMessage([{documentPath: fileName}], e.message ?? "")
            }
        }
    }

    _markActive(pass: IdlProcessingPass<any>) {
        if (this.activePasses.has(pass)) {
            return
        }
        this.activePasses.add(pass)
        for (const dep of pass.dependencies) {
            this._markActive(dep)
        }
    }

    runPasses(): void {
        for (const pass of this.passes) {
            if (pass.name.indexOf(".") == -1) {
                this._markActive(pass)
                continue
            }
            for (const feature of this._activeFeatures) {
                if (pass.name.startsWith(feature + ".")) {
                    this._markActive(pass)
                }
            }
        }

        let maxOrder = Math.max(0, ...this.passes.map(x => x.order))
        for (let i = 0; i < maxOrder; ++i) {
            this.orderedPasses.push(this.passes.filter(x => (this.activePasses.has(x)) && x.order == i + 1))
        }

        for (let passes of this.orderedPasses) {
            for (let pass of passes) {
                pass.begin()
            }

            for (let entry of this.entries) {
                idl.forEachChild(entry,
                    n => passes.forEach(p => {
                        try { p.dispatch(n, true) }
                        catch (e: any) { idl.ProcessingErrorMessage.reportDiagnosticMessage([{documentPath: entry.fileName!}], `Pass "${p.name}": ${e.message}`) }
                    }),
                    n => passes.forEach(p => {
                        try { p.dispatch(n) }
                        catch (e: any) { idl.ProcessingErrorMessage.reportDiagnosticMessage([{documentPath: entry.fileName!}], `Pass "${p.name}": ${e.message}`) }
                    })
                )
            }

            for (let pass of passes) {
                pass.end()
            }
        }
    }

    newFeature(name: string, description: string): void {
        if (this.featuresByName.has(name)) {
            throw new Error(`Feature "${name}" uses duplicate feature name`)
        }
        let dot = name.lastIndexOf(".")
        if (dot != -1 && !this.featuresByName.has(name.substring(0, dot))) {
            throw new Error(`Feature "${name}" references unexisting parent feature`)
        }
        if (this.passesByName.has(name)) {
            throw new Error(`Feature "${name}" uses duplicate pass name`)
        }
        this.featuresByName.set(name, description);
    }

    newPass<State>(name: string, dependencies: IdlProcessingPass<any>[], stateMaker: () => State): IdlProcessingPass<State> {
        let pass = new IdlProcessingPass<State>(name, dependencies, stateMaker)
        if (this.passesByName.has(pass.name)) {
            throw new Error(`Pass "${pass.name}" uses duplicate pass name`)
        }
        if (this.featuresByName.has(pass.name)) {
            throw new Error(`Pass "${pass.name}" uses duplicate feature name`)
        }
        let dot = pass.name.lastIndexOf(".")
        if (dot != -1 && pass.name[0] != "." && !this.featuresByName.has(pass.name.substring(0, dot))) {
            throw new Error(`Pass "${pass.name}" references unexisting parent feature`)
        }
        this.passes.push(pass)
        return pass
    }

    set activeFeatures(value: string[]) {
        for (const feature of value) {
            if (!this.featuresByName.has(feature)) {
                throw new Error(`Feature "${feature}" does not exist`)
            }
        }
        this._activeFeatures = value
    }

    get activeFeatures(): string[] {
        return this._activeFeatures
    }

    get featuresHelp(): string {
        const lines: string[] = []
        for (const [k, v] of this.featuresByName) {
            lines.push(`${k}  ${v}`)
        }
        return lines.join("\n")
    }
}

export let idlManager = new IdlProcessingManager()
