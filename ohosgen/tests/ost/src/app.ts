
import {
    checkEQ,
    UnitTestsuite,
} from "#compat"

import {
    OSTIntEnum,
    checkOSTIntEnum,
} from "#compat"

/*
import {
    checkOSTSequence,
} from "#compat"

import {
    getOSTPromise,
} from "#compat"
*/

export function assertEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    checkEQ(value1, value2, comment)
}

function checkEnum() {
    assertEQ(1, OSTIntEnum.E1)
    assertEQ(OSTIntEnum.E3, checkOSTIntEnum(OSTIntEnum.E1, 1))
}

/*
function checkSequence() {
    assertEQ(0, checkOSTSequence([]))
    assertEQ(3, checkOSTSequence([3, 2, -7]))
    assertEQ(5, checkOSTSequence([3, -1, 4, 10, -7]))
}

function checkPromise() {
    getOSTPromise()
        .then((value: number) => {
            assertEQ(7, value)
        })
}
*/

export function run() {

    const suite = new UnitTestsuite("idlize ut")
    suite.addTest("checkEnum", checkEnum)
    // suite.addTest("checkSequence", checkSequence)
    // suite.addTest("checkOSTAsync", checkPromise)
    return suite.run()
}
