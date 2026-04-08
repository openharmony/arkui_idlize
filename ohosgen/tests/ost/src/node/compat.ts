import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop"

export {
    OSTIntEnum,
    checkOSTIntEnum,
} from '../../generated/ts'

export {
    checkOSTSequence,
    getOSTSequenceBoolean,
    getOSTSequenceInt,
} from '../../generated/ts'

export {
    checkOSTMapIntInt,
    checkOSTMapBooleanString,
} from '../../generated/ts'

export {
    getOSTFunctionBooleanIntString
} from '../../generated/ts'

export {
    checkCallbackIntVoid,
    getCallbackIntVoid,
    getCallbackIntInt,
    checkCallbackBooleanIntString,
    getCallbackBooleanIntString,
} from '../../generated/ts'

export {
    getOSTAsyncInt,
    getOSTPromiseVoid,
    getOSTPromiseInt,
    getOSTPromiseBooleanIntString,
} from '../../generated/ts'

export type OHBuffer = ArrayBuffer
export type OHAny = any

export function init() {
    loadInteropNativeModule()
    InteropNativeModule._SetCallbackDispatcher(callCallback)
    wrapSystemApiHandlerCallback()
}

export function runEventLoop() {
    let finished = false
    let pull = () => {
        checkEvents()
        if (!finished)
            setTimeout(pull, 0)
    };
    setTimeout(pull, 0);
    setTimeout(() => {
        finished = true
    }, 2000);
}

class UnitTestError extends Error {}

export function toBigInt(value: number): bigint {
    return BigInt(value)
}

export function checkEQ(value1: unknown, value2: unknown, comment?: string): void {
    if (Array.isArray(value1) && Array.isArray(value2)) {
        const arr1 = value1 as object[]
        const arr2 = value2 as object[]
        if (arr1.length != arr2.length) {
            throw new UnitTestError(`Arrays size differ: ${comment}`)
        }
        for(let i = 0; i < arr1.length; i++) {
            checkEQ(arr1[i], arr2[i], comment)
        }
        return;
    }
    if (typeof value1 == "bigint" || typeof value2 == "bigint") {
        if (value1 != value2) {
            console.log(`value ${value1} type ${typeof value1} does not equal to the value ${value2} type ${typeof value2}`)
            throw new UnitTestError(comment)
        }
        return;
    }

    if (value1 !== value2) {
        console.log(`value ${value1} type ${typeof value1} does not equal to the value ${value2} type ${typeof value2}`)
        throw new UnitTestError(comment)
    }
}

export function assertDoubleEQ(value1: number, value2: number, absError: number = 0.001, comment?: string): void {
    if (Math.abs(value2 - value1) > absError) {
        console.log(`value ${value1} does not equal to the value ${value2} with absError: ${[absError]}`)
        throw new UnitTestError(comment)
    }
}

export function checkNotEQ(value1: unknown, value2: unknown, comment?: string): void {
    if (value1 === value2) {
        throw new UnitTestError(comment)
    }
}

class Test {
    constructor(
        public readonly name: string,
        public readonly test: () => Promise<void> | void
    ) {}
}

export class UnitTestsuite {

    private tests: Test[] = []
    constructor(public name: string) {
    }

    addTest(testName: string, test: () => void): void {
        this.tests.push(new Test(testName, test))
    }

    addAsyncTest(testName: string, test: () => Promise<void>): void {
        this.tests.push(new Test(testName, test))
    }

    async run() {
        const failedTests: string[] = []
        for (const t of this.tests) {
            try {
                await t.test()
                console.log('[ \x1b[32m%s\x1b[0m ] %s', 'PASSED', t.name);
            } catch (ex) {
                if (ex instanceof UnitTestError) {
                    failedTests.push(t.name)
                    console.log('[ \x1b[31m%s\x1b[0m ] %s', 'FAILED', t.name);
                    console.error('...', ex.message)
                } else {
                    throw ex
                }
            }
        }
        if (failedTests.length) {
            for (const name of failedTests) {
                console.error('FAILED =>', name)
            }
            throw new Error("Tests failed!")
        }
    }
}

