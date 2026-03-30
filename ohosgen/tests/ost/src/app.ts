
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
    // getOSTPromise,
    getCallbackIntInt,
    getCallbackBooleanIntString,
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
    const cb = getCallbackIntInt()
    assertEQ(9, cb(3))
    assertEQ(15, cb(5))

    const cb2 = getCallbackBooleanIntString()
    assertEQ('8', cb2(false, 3))
    assertEQ('20', cb2(true, 4))
}

/*
function checkPromise() {
    getOSTPromise()
        .then((value: int) => {
            assertEQ(7, value)
        })
}
*/

export function run() {

    const suite = new UnitTestsuite("idlize ut")
    suite.addTest("checkEnum", checkEnum)
    suite.addTest("checkSequence", checkSequence)
    suite.addTest("checkCallback", checkCallback)
    // suite.addTest("checkPromise", checkPromise)
    return suite.run()
}
