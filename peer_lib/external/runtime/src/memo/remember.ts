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

import { __context, __id } from "../internals"
import { scheduleCallback } from "../states/GlobalStateManager"
import { ControlledScope, MutableState } from "../states/State"
import { functionOverValue } from "@koalaui/common"

/**
 * It calculates the value of the given lambda and caches its result.
 * In contrast to the `remember` function, the given lambda can be recalculated
 * if it uses values of states (including parameters of @memo-functions).
 * If the given lambda does not use any state, it will be calculated only once.
 *
 * @param compute - a function to compute cacheable result
 * @returns the last calculated value
 * @see remember
 * @experimental
 * @memo:intrinsic
 */
export function memo<Value>(compute: () => Value): Value {
    const scope = __context().scope<Value>(__id(), undefined, undefined, undefined, undefined, undefined)
    return scope.unchanged ? scope.cached : scope.recache(compute())
}

/**
 * It calculates the value of the given lambda and caches its result.
 * In contrast to the `memo` function, the given lambda is calculated only once
 * even if it uses values of states (including parameters of @memo-functions).
 *
 * @param compute - a function to compute cacheable result
 * @returns the last calculated value
 * @see memo
 * @memo:intrinsic
 */
export function remember<Value>(compute: () => Value): Value {
    const scope = __context().scope<Value>(__id(), 0, undefined, undefined, undefined, true) // do not recalculate if used states were updated
    return scope.unchanged ? scope.cached : scope.recache(compute())
}

/**
 * It calculates the value of the given lambda, caches its result,
 * and notifies, that this method is removed from the composition.
 *
 * @param compute - a function to compute cacheable result
 * @param cleanup - a function to cleanup computed result on dispose
 * @returns the last calculated value
 * @see remember
 * @memo:intrinsic
 */
export function rememberDisposable<Value>(compute: () => Value, cleanup: (value: Value|undefined) => void): Value {
    const scope = __context().scope<Value>(__id(), 0, undefined, undefined, cleanup, true) // do not recalculate if used states were updated
    return scope.unchanged ? scope.cached : scope.recache(compute())
}

/**
 * Creates remembered state which can be updated from anywhere,
 * and if changed - all depending memo functions recache automatically.
 * Note that you can specify the value directly for primitive values,
 * which do not require computations or memory allocation.
 * It is highly recommended to provide a lambda for all others values.
 *
 * @param initial - initial value supplier used on the state creation
 * @returns a state remembered for the current code position
 * @memo:intrinsic
 */
export function rememberMutableState<Value>(initial: (() => Value) | Value): MutableState<Value> {
    const scope = __context().scope<MutableState<Value>>(__id(), 0, undefined, undefined, undefined, true) // do not recalculate if used states were updated
    return scope.unchanged ? scope.cached : scope.recache(__context()
        .mutableState(
            functionOverValue<Value>(initial) ?
                (initial as (() => Value))() :
                (initial as Value),
            undefined, undefined, undefined
        )

    )
}

/**
 * Remember mutable state which is computed in async way and is undefined if promise
 * is not fulfilled.
 *
 * @param compute function returning promise to compute the state
 * @param initial value stored to the state
 * @param onError callback called if promise was rejected
 * @memo
 */
export function rememberMutableAsyncState<Value>(compute: () => Promise<Value | undefined>, initial?: Value, onError?: (e: Error) => void): MutableState<Value | undefined> {
    const result = rememberMutableState<Value | undefined>(initial)
    remember(() => {
        compute()
            .then((value) => result.value = value)
            .catch((error: Error) => {
                result.value = undefined
                onError?.(error)
            })
    })
    return result
}

/**
 * Remember mutable state which is
 * re-computed in async way if key has changed
 * and undefined while promise is not fulfilled.
 *
 * @param key a value to trigger state recomputation
 * @param compute function returning promise to compute the state
 * @param initial value stored to the state
 * @param onError callback called if promise was rejected
 * @memo
 */
export function rememberComputableState<Key, Value>(
    key: Key,
    /** @skip:memo */
    compute: (key: Key) => Promise<Value | undefined>,
    initial?: Value,
    onError?: (e: Error) => void
): MutableState<Value | undefined> {
    const result = rememberMutableState<Value | undefined>(initial)
    const keyLocal: Key = key // subscribe to a key changes
    scheduleCallback(() => ((key: Key) => {
        compute(key)
            .then((value: Value | undefined): Value | undefined => result.value = value)
            .catch((error: Error) => {
                result.value = undefined
                onError?.(error)
            })
    })(keyLocal))
    return result
}

/**
 * Remember a value which is
 * re-computed in async way if key has changed
 * and undefined while promise is not fulfilled.
 *
 * @param key a value to trigger state recomputation
 * @param compute function returning promise to compute the state
 * @param initial value stored to the state
 * @param onError callback called if promise was rejected
 * @memo
 */
export function rememberComputableValue<Key, Value>(
    key: Key,
    /** @skip:memo */
    compute: (key: Key) => Promise<Value | undefined>,
    initial?: Value,
    onError?: (e: Error) => void
): Value | undefined {
    return rememberComputableState(key, compute, initial, onError).value
}

/**
 * @param invalidate - callback that will be notified when any state is modified within the scope
 * @return a user-controlled scope which can be used outside of the incremental update
 * @memo:intrinsic
 */
export function rememberControlledScope(invalidate: () => void): ControlledScope {
    return __context().controlledScope(__id(), invalidate)
}
