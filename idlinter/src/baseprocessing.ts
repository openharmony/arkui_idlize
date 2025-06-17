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

import { RecursivePattern } from "./servicetypes"

/**
 * Checks that object is provided.
 */
function isObj(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Checks that pattern matches value.
 */
export function checkPartial<T>(value: T, pattern: RecursivePattern<T>): boolean {
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

export type ProcessingFunc<S, T, O> = (o: O, s: S) => void

export interface ProcessingRule<S, T, O> {
    pattern: RecursivePattern<T>
    func: ProcessingFunc<S, T, O>
}

export class ProcessignProxy<S, T, O> {
    reg: ProcessingPassRegistry<S, T, O>
    pattern: RecursivePattern<T>
    constructor(reg: ProcessingPassRegistry<S, T, O>, pattern: RecursivePattern<T>) {
        this.reg = reg
        this.pattern = pattern
    }
    set before(func: ProcessingFunc<S, T, O>) {
        this.reg.add(func, this.pattern, true)
    }
    set after(func: ProcessingFunc<S, T, O>) {
        this.reg.add(func, this.pattern)
    }
}

/**
 * Processing pass, contains registry field `reg` on top registration closure
 * S is a storage to provide/collect additional information while navigating data structures.
 * T is a main value type, O is an optional service type (possibly made by FieldMix) to simplify before/after processing.
 * Reason to separate them is to keep RecursivePartial<T> patterns more restrictive.
 */
export type ProcessingPass<S, T, O> = {reg: ProcessingPassRegistry<S, T, O>} & ((pattern: RecursivePattern<T>) => ProcessignProxy<S, T, O>)

export class ProcessingPassRegistry<S, T, O = T> {
    before: ProcessingRule<S, T, O>[] = []
    after: ProcessingRule<S, T, O>[] = []
    state: S

    constructor(state: S) {
        this.state = state
    }

    makeProxy(pattern: RecursivePattern<T>): ProcessignProxy<S, T, O> {
        return new ProcessignProxy<S, T, O>(this, pattern)
    }

    makePass(): ProcessingPass<S, T, O> {
        let f: ProcessingPass<S, T, O> = ((pattern: RecursivePattern<T>) => this.makeProxy (pattern)) as any
        f.reg = this
        return f
    }

    add(func: ProcessingFunc<S, T, O>, pattern: RecursivePattern<T>, before?: boolean): void {
        (before ? this.before : this.after).push({pattern, func})
    }

    dispatch(value: T, storage: S, before?: boolean): void {
        for (let entry of (before ? this.before : this.after)) {
            if (checkPartial(value, entry.pattern)) {
                entry.func((value as any) as O, storage)
            }
        }
    }
}
