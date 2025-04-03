import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { checkArkoalaCallbacks } from "../../generated/ts/unit.INTERNAL";
import { stdout } from "node:process";

export {
    // .d.ts
    CONST_BOOLEAN_FALSE,
    CONST_BOOLEAN_TRUE,
    CONST_NUMBER_INT,
    CONST_NUMBER_FLOAT,
    CONST_STRING,
    // .idl
    IDL_CONST_BOOLEAN_FALSE,
    IDL_CONST_BOOLEAN_TRUE,
    IDL_CONST_NUMBER_INT,
    IDL_CONST_NUMBER_FLOAT,
    IDL_CONST_STRING

} from "../../generated/ts"

export { and_values } from "../../generated/ts"
export { sum_numbers } from "../../generated/ts"
// TBD: wait for the interface FQN fix for ArkTS
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
    IDLOrdinaryEnum,
    IDLIntEnum,
    IDLStringEnum,
    idlCheckOrdinaryEnums,
    idlCheckIntEnums,
    idlCheckStringEnums,
    DataClass, DataInterface, IDLDataClass, IDLDataInterface,
    testDataClass, testDataInterface, testIDLDataClass, testIDLDataInterface,
    HandwrittenComponent, IdlHandwrittenComponent,
} from '../../generated/ts'

export { CheckExceptionClass, CheckExceptionInterface } from "../../generated/ts"

export type OHBuffer = ArrayBuffer
export type OHAny = any

export function init() {
    loadInteropNativeModule()
    InteropNativeModule._SetCallbackDispatcher(callCallback)
}

export function runEventLoop() {
    let finished = false
    let pull = () => {
        //
        checkArkoalaCallbacks()
        if (!finished)
            setTimeout(pull, 0)
    };
    setTimeout(pull, 0);
    setTimeout(() => {
        finished = true
    }, 2000);
}

class UnitTestError extends Error {}

export function checkEQ(value1: unknown, value2: unknown, comment?: string): void {
    if (value1 !== value2) {
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
