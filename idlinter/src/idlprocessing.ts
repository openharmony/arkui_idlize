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
import { checkPartial } from "./baseprocessing";
import { IdlNodeAny, IdlRecursivePattern } from "./idltypes";
import { Parsed } from "./parser";
import { DiagnosticResults } from "./diagnostictypes";
import { ProcessingError, UnknownError } from "./messages";
import { NativeModuleType } from "@idlizer/core";

// Instead of extending generic versions from `baseprocessing.ts` necessary code is inlined here.
// This way "Type instantiation is excessively deep and possibly infinite" situation is avoided.

type IdlProcessingFunc<State> = (node: IdlNodeAny, state: State) => void

interface IdlProcessingRule<State> {
    pattern: IdlRecursivePattern
    func: IdlProcessingFunc<State>
}

class IdlProcessignProxy<State> {
    pass: IdlProcessingPass<State>
    pattern: IdlRecursivePattern
    constructor(reg: IdlProcessingPass<State>, pattern: IdlRecursivePattern) {
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

/**
 * Heavily rewritten of earlier ProcessingPassRegistry that is:
 * 1. Specialized for tree of `IDLNode` nodes.
 * 2. Specialized for `IDLKind` indexes.
 * 3. Integrated with ProcessingPass
 * 4. Supports pass joining and keeping unique state.
 * 5. Supports initial/terminal processings for the whole pass.
 * ...
 */
export class IdlProcessingPass<State> {
    name: string
    dependencies: IdlProcessingPass<any>[]
    mode?: string
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

    on(pattern: IdlRecursivePattern): IdlProcessignProxy<State> {
        return new IdlProcessignProxy<State>(this, pattern)
    }

    set final (func: (s: State) => void) {
        this.afterAll = func
    }

    add(func: IdlProcessingFunc<State>, pattern: IdlRecursivePattern, before?: boolean): void {
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

    get state(): State {
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

class IdlProcessingManager {
    mode: string = ""
    entries: Parsed[] = []
    entriesByPath: Map<string, Parsed> = new Map()
    entriesToValidate: Parsed[] = []
    results: DiagnosticResults = new DiagnosticResults()
    
    passes: IdlProcessingPass<any>[] = []
    orderedPasses: IdlProcessingPass<any>[][] = []

    peerlibrary: idl.PeerLibrary

    constructor() {
        // Only resolution is used for now, so choosing idl.Language.TS does not have language-specific effects
        this.peerlibrary = new idl.PeerLibrary(idl.Language.TS, new NativeModuleType("_UNUSED__"))
        this.peerlibrary.disableFallback()
    }

    addFile(fileName: string, parseOnly?: boolean): void {
        try {
            let parsed = new Parsed(fileName)
            this.entries.push(parsed)
            this.entriesByPath.set(fileName, parsed)
            parsed.load()
            if (parseOnly) {
                this.peerlibrary.auxFiles.push(parsed.idlFile)
            } else {
                this.entriesToValidate.push(parsed)
                this.peerlibrary.files.push(parsed.idlFile)
            }
        } catch (e: any) {
            if (e.diagnosticMessage != null) {
                this.results.push(e.diagnosticMessage)
            } else {
                UnknownError.reportDiagnosticMessage([{documentPath: fileName}], e.message ?? "")
            }
        }
    }

    addPass(pass: IdlProcessingPass<any>): void {
        this.passes.push(pass)
    }

    runPasses(): void {
        let maxOrder = Math.max(0, ...this.passes.map(x => x.order))
        for (let i = 0; i < maxOrder; ++i) {
            this.orderedPasses.push(this.passes.filter(x => (!x.mode || x.mode == this.mode) && x.order == i + 1))
        }

        for (let passes of this.orderedPasses) {
            for (let pass of passes) {
                pass.begin()
            }

            for (let entry of this.entries) {
                idl.forEachChild(entry.idlFile,
                    n => passes.forEach(p => {
                        try { p.dispatch(n, true) }
                        catch (e: any) { ProcessingError.reportDiagnosticMessage([{documentPath: entry.idlFile.fileName!}], `Pass "${p.name}": ${e.message}`) }
                    }),
                    n => passes.forEach(p => {
                        try { p.dispatch(n) }
                        catch (e: any) { ProcessingError.reportDiagnosticMessage([{documentPath: entry.idlFile.fileName!}], `Pass "${p.name}": ${e.message}`) }
                    })
                )
            }

            for (let pass of passes) {
                pass.end()
            }
        }
    }
}

export let idlManager = new IdlProcessingManager()

export function startingPass<State>(name: string, stateMaker: () => State): IdlProcessingPass<State> {
    let pass = new IdlProcessingPass<State>(name, [], stateMaker)
    idlManager.addPass(pass)
    return pass
}


export function dependentPass<State>(name: string, dependencies: IdlProcessingPass<any>[], stateMaker: () => State): IdlProcessingPass<State> {
    let pass = new IdlProcessingPass<State>(name, dependencies, stateMaker)
    idlManager.addPass(pass)
    return pass
}
