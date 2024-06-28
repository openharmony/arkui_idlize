/*
 * Copyright (c) 2022-2024 Huawei Device Co., Ltd.
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

import { getObservableTarget } from "@koalaui/compat"

/**
 * @internal
 */
export interface Observable {
    onAccess(): void
    onModify(): void
}

/**
 * @internal
 */
export class ObservableHandler implements Observable {
    private static handlers: WeakMap<Object, ObservableHandler> | undefined = undefined

    private observables = new Set<Observable>()
    private _modified = false

    onAccess(): void {
        if (this.observables.size > 0) {
            const it = this.observables.keys()
            while (true) {
                const result = it.next()
                if (result.done) break
                result.value?.onAccess()
            }
        }
    }

    onModify(): void {
        this._modified = true
        if (this.observables.size > 0) {
            const it = this.observables.keys()
            while (true) {
                const result = it.next()
                if (result.done) break
                result.value?.onModify()
            }
        }
    }

    static dropModified<Value>(value: Value): boolean {
        const handler = ObservableHandler.findIfObject(value)
        if (handler === undefined) return false
        const result = handler._modified
        handler._modified = false
        return result
    }

    /** Adds the specified `observable` to the handler corresponding to the given `value`. */
    static attach<Value>(value: Value, observable: Observable): void {
        const handler = ObservableHandler.findIfObject(value)
        if (handler !== undefined) handler.observables.add(observable)
    }

    /** Deletes the specified `observable` from the handler corresponding to the given `value`. */
    static detach<Value>(value: Value, observable: Observable): void {
        const handler = ObservableHandler.findIfObject(value)
        if (handler !== undefined) handler.observables.delete(observable)
    }

    /** @returns the handler corresponding to the given `value` if it was installed */
    private static findIfObject<Value>(value: Value): ObservableHandler | undefined {
        const handlers = ObservableHandler.handlers
        return handlers !== undefined && value instanceof Object ? getObservableHandler(handlers, value as Object) : undefined
    }

    /**
     * @param value - any non-null object including arrays
     * @returns an observable handler or `undefined` if it is not installed
     */
    static find(value: Object): ObservableHandler | undefined {
        const handlers = ObservableHandler.handlers
        return handlers !== undefined ? getObservableHandler(handlers, value) : undefined
    }

    /**
     * @param value - any non-null object including arrays
     * @param observable - a handler to install on this object
     * @throws an error if observable handler cannot be installed
     */
    static installOn(value: Object, observable?: ObservableHandler): void {
        let handlers = ObservableHandler.handlers
        if (handlers === undefined) {
            handlers = new WeakMap<Object, ObservableHandler>()
            ObservableHandler.handlers = handlers
        }
        observable
            ? handlers.set(getObservableTarget(value), observable)
            : handlers.delete(getObservableTarget(value))
    }
}

function getObservableHandler(handlers: WeakMap<Object, ObservableHandler>, value: Object): ObservableHandler | undefined {
    const handler = handlers.get(getObservableTarget(value))
    return handler === null ? undefined : handler
    // because in the WeakMap stub in escompat library
    // get mistakenly returns V|null instead of V|undefined
}
