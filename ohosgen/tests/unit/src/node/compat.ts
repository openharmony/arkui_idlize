import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop"
import { stdout } from "node:process";
import { registerUnitApiHandler } from "../../generated/ts";

export {
    CONST_BOOLEAN_FALSE,
    CONST_BOOLEAN_TRUE,
    CONST_NUMBER_INT,
    CONST_NUMBER_FLOAT,
    CONST_STRING,
} from "../../generated/ts"

export { and_values } from "../../generated/ts"
export { sum_numbers } from "../../generated/ts"
export { test_bigint } from "../../generated/ts"
export { test_buffer } from "../../generated/ts"
export { test_materialized_classes, UtilityInterface } from "../../generated/ts"
export { test_any } from "../../generated/ts"
export { test_return_types, test_ret_A, test_ret_B } from "../../generated/ts"
export {
    ForceCallbackListener,
    ForceCallbackClass,
    registerForceCallbackListener,
    callForceCallbackListener,
    ClassWithComplexPropertyType,
} from "../../generated/ts"
export {
    OrdinaryEnum,
    IntEnum,
    DuplicateIntEnum,
    StringEnum,
    checkOrdinaryEnums,
    checkIntEnums,
    checkDuplicateIntEnums,
    checkStringEnums,
    checkStringEnumOrdinal,
    DataClass, DataInterface,
    testDataClass, testDataInterface,
} from '../../generated/ts'

export {
    SingleGenericType,
    DoubleGenericType,
    UnionSampleEnum,
    checkUnionEnumSample,
    checkUnionArraySample,
    checkUnionNumberArraySample,
    checkUnionTupleArraySample,
    checkUnionGenericTypeSample,
} from "../../generated/ts"

export { CheckExceptionClass, CheckExceptionInterface } from "../../generated/ts"

export {
    testLength
} from "../../generated/ts"

export { IDLCheckConstructor } from "../../generated/ts"

export { InternalModuleDataInterface } from "./modules/internal_lib"
export { RenamedModuleDataInterface } from "./modules/newname_lib"
export { DTSCheckInternalLib } from "../../generated/ts"

export {
    HookClass,
    HookValue,
    HookInterface,
    getHookInterface,
} from "../../generated/ts"

export { ImportedHookValue } from "./handwritten/external_lib"
export { ExternalType, hookns } from "./handwritten/external_lib"

export { DTSCheckExternalLib, InternalType } from "../../generated/ts"
export { PromiseTester } from "../../generated/ts"

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
        //
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
    if (value1 !== value2) {
        console.log(`value ${value1} does not equal to the value ${value2}`)
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
        public readonly test: () => void
    ) {}
}

export class UnitTestsuite {

    private tests: Test[] = []
    constructor(public name: string) {
    }

    addTest(testName: string, test: () => void): void {
        this.tests.push(new Test(testName, test))
    }

    run(): void {
        const failedTests: string[] = []
        for (const t of this.tests) {
            try {
                t.test()
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
