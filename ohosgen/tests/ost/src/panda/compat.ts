import {
    checkEvents,
    wrapSystemApiHandlerCallback,
 } from "@koalaui/interop";

import {
    registerUnitOstApiHandler,
    UNIT_OSTNativeModule,
 } from '../../generated/arkts'

export {
    OSTIntEnum,
    checkOSTIntEnum,
} from '../../generated/arkts'

export {
    checkOSTSequence,
    getOSTSequenceBoolean,
    getOSTSequenceInt,
} from '../../generated/arkts'

export {
    // getOSTPromise,
    getCallbackInt,
} from '../../generated/arkts'

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
