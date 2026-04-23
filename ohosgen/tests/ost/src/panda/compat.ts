/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import {
    checkEvents,
    wrapSystemApiHandlerCallback,
 } from "@koalaui/interop";

import {
    registerUnitOstApiHandler,
    UNIT_OSTNativeModule,
 } from '../../generated/arkts'

export {
    PlainEnum,
    IntEnum,
    LongEnum,
    LegacyEnum,
    StringEnum,
    checkPlainEnum,
    checkIntEnum,
    checkLongEnum,
    checkLegacyEnum,
    checkStringEnum,
    getCallbackBooleanIntString,
} from '../../generated/arkts'

export {
    checkOSTSequence,
    getOSTSequenceBoolean,
    getOSTSequenceInt,
} from '../../generated/arkts'

export {
    getOSTMapIntString,
    checkOSTMapIntInt,
    checkOSTMapBooleanString,
} from '../../generated/arkts'

export {
    getOSTFunctionBooleanIntString
} from '../../generated/arkts'

export {
    getOSTErrorBooleanInt,
    checkOSTErrorIntBoolean,
} from '../../generated/arkts'

export {
    checkCallbackIntVoid,
    getCallbackIntVoid,
    checkCallbackBooleanIntString,
    getCallbackIntInt,
} from '../../generated/arkts'

export {
    getOSTAsyncInt,
    getOSTPromiseVoid,
    getOSTPromiseInt,
    getOSTPromiseBooleanIntString,
} from '../../generated/arkts'

export { DataClass } from '../../generated/arkts'
export { GenericBox, GenericBox2, Unbox, unboxBoolean, unboxString, unboxBox, unboxStringNumber, unboxBoxStringBoxNumber } from '../../generated/arkts'
export { outer } from '../../generated/arkts'
export { TestOptional, sumOptionalAttributes, idOrZero } from '../../generated/arkts'
export { MultiCtor, MultiMethod } from '../../generated/arkts'
export { UnionInterface, checkUnionInterface, checkUnionArg, checkGenericUnion } from '../../generated/arkts'


export type OHBuffer = ArrayBuffer

export function checkEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    if (value1 instanceof Tuple && value2 instanceof Tuple) {
        // TBD: check tuples by their elements
        // For some way the smart cast does not work for Tuple
        arktest.assertEQ(`${value1}`, `${value2}`, comment)
        return;
    }
    if (value1 instanceof Array && value2 instanceof Array) {
        arktest.assertEQ(value1.length, value2.length, "Arrays length differ!")
        for(let i = 0; i < value1.length; i++) {
            checkEQ(value1[i], value2[i], comment)
        }
        return
    }
    arktest.assertEQ(value1, value2, comment)
}

export class UnitTestsuite extends arktest.ArkTestsuite {
    constructor(name: string) {
        super(name)
    }
}

export function pullEvents() {
    checkEvents()
}

export function init() {
    wrapSystemApiHandlerCallback()
    registerUnitOstApiHandler()
}
