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

import { RecursivePartial } from "./servicetypes"

/**
 * Checks that object is provided.
 */
function isObj(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Checks that pattern matches value.
 */
function checkPartial<T>(value: T, pattern: RecursivePartial<T>): boolean {
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

/**
 * Registry without indexes that matches values against patterns and guards, calling watchers.
 * S is a storage to provide/collect additional information while navigating data structures.
 * T is a main value type, O is an optional service type (possibly made by UN) to simplify guards/watchers.
 * Reason to separate them is to keep RecursivePartial<T> patterns more restrictive.
 */
export class ProcessingRegistry<S, T, O = T> {
    // Can be optimized by indexes for a bigger number of entries

    entries: RegistryEntry<S, T, O>[] = []

    makeCase(pattern: RecursivePartial<T>, guard?: RegistryGuard<S, T, O>): RegistryProxy<S, T, O> {
        return new RegistryProxy<S, T, O>(this, pattern, guard)
    }

    maker(): (pattern: RecursivePartial<T>, guard?: RegistryGuard<S, T, O>) => RegistryProxy<S, T, O> {
        return (pattern: RecursivePartial<T>, guard?: RegistryGuard<S, T, O>) => this.makeCase (pattern, guard)
    }

    addWatcher(func: RegistryFunc<S, T, O>, pattern: RecursivePartial<T>, guard?: RegistryGuard<S, T, O>): void {
        this.entries.push({pattern, guard, func})
    }

    dispatchData(value: T, storage: S): void {
        for (let entry of this.entries) {
            if (checkPartial(value, entry.pattern) && (entry.guard?.((value as any) as O, storage) ?? true)) {
                entry.func((value as any) as O, storage)
            }
        }
    }
}

type RegistryFunc<S, T, O> = (o: O, s: S) => void

type RegistryGuard<S, T, O> = (o: O, s: S) => boolean

interface RegistryEntry<S, T, O> {
    pattern: RecursivePartial<T>
    guard?: RegistryGuard<S, T, O>
    func: RegistryFunc<S, T, O>
}

class RegistryProxy<S, T, O> {
    reg: ProcessingRegistry<S, T, O>
    pattern: RecursivePartial<T>
    guard?: RegistryGuard<S, T, O>
    constructor(reg: ProcessingRegistry<S, T, O>, pattern: RecursivePartial<T>, guard?: RegistryGuard<S, T, O>) {
        this.reg = reg
        this.pattern = pattern
        this.guard = guard
    }
    // set handler(func: F) {
    //     this.reg.addHandler(func, this.pattern, this.guard)
    // }
    // set value(v: ReturnType<F>) {
    //     this.reg.addHandler((()=>v) as F, this.pattern, this.guard)
    // }
    set watcher(func: RegistryFunc<S, T, O>) {
        this.reg.addWatcher(func, this.pattern, this.guard)
    }
}
