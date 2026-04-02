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
    checkEQ,
    UnitTestsuite,
} from "#compat"

import {
    OSTIntEnum,
    checkOSTIntEnum,
} from "#compat"

import {
    checkOSTSequence,
    getOSTSequenceBoolean,
    getOSTSequenceInt,
} from "#compat"

import {
    checkCallbackIntVoid,
    getCallbackIntVoid,
    getCallbackIntInt,
    checkCallbackBooleanIntString,
    getCallbackBooleanIntString,
} from "#compat"

import {
    getOSTPromiseInt,
    getOSTPromiseBooleanIntString,
} from "#compat"

export function assertEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    checkEQ(value1, value2, comment)
}

function checkEnum() {
    assertEQ(1, OSTIntEnum.E1)
    assertEQ(OSTIntEnum.E3, checkOSTIntEnum(OSTIntEnum.E1, 1))
}

function checkSequence() {
    assertEQ(0, checkOSTSequence([]))
    assertEQ(3, checkOSTSequence([3, 2, -7]))
    assertEQ(5, checkOSTSequence([3, -1, 4, 10, -7]))

    const seqBoolean = getOSTSequenceBoolean()
    assertEQ(2, seqBoolean.length)
    assertEQ(false, seqBoolean[0])
    assertEQ(true, seqBoolean[1])

    const seqInt = getOSTSequenceInt()
    assertEQ(3, seqInt.length)
    assertEQ(3, seqInt[0])
    assertEQ(5, seqInt[1])
    assertEQ(7, seqInt[2])
}

function checkCallback() {

    checkCallbackIntVoid((value: int) => {
        assertEQ(9, value)
    })

    const cbIntVoid = getCallbackIntVoid()
    cbIntVoid(2)

    const cbIntInt = getCallbackIntInt()
    assertEQ(9, cbIntInt(3))
    assertEQ(15, cbIntInt(5))

    checkCallbackBooleanIntString((flag: boolean, x: int): string => {
        assertEQ(true, flag)
        assertEQ(12, x)
        return "abc"
    })

    const cbBooleanIntString = getCallbackBooleanIntString()
    assertEQ('8', cbBooleanIntString(false, 3))
    assertEQ('20', cbBooleanIntString(true, 4))
}

function checkPromise() {
    getOSTPromiseInt()
        .then((value: int) => {
            console.log(`[App] getOSTPromiseInt value: ${value}`)
            assertEQ(7, value)
        })
    getOSTPromiseBooleanIntString(true, 9)
        .then((value: string) => {
            console.log(`[App] getOSTPromiseBooleanIntString value: ${value}`)
            assertEQ("hello", value)
        })
}

export function run() {

    const suite = new UnitTestsuite("idlize ost tests")
    suite.addTest("checkEnum", checkEnum)
    suite.addTest("checkSequence", checkSequence)
    suite.addTest("checkCallback", checkCallback)
    suite.addTest("checkPromise", checkPromise)
    return suite.run()
}
