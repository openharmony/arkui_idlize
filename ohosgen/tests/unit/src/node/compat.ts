import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { checkArkoalaCallbacks } from "../../generated/ts/unit.INTERNAL";

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
    StringEnum,
    checkOrdinaryEnums,
    checkIntEnums,
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

export type OHBuffer = ArrayBuffer
export type OHAny = any

declare const NATIVE_LIBRARY_NAME: string
export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", NATIVE_LIBRARY_NAME)
    registerNativeModuleLibraryName("UNITNativeModule", NATIVE_LIBRARY_NAME)
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

export function checkEQ(value1: unknown, value2: unknown, comment?: string): void {
    if (value1 !== value2) {
        throw new Error(comment)
    }
}

export function checkNotEQ(value1: unknown, value2: unknown, comment?: string): void {
    if (value1 === value2) {
        throw new Error(comment)
    }
}

class Test {
    constructor(public readonly name, public readonly test: () => void) {
    }
}

export class UnitTestsuite {

    private tests: Test[] = []
    constructor(public name: string) {
    }

    addTest(testName: string, test: () => void): void {
        this.tests.push(new Test(testName, test))
    }

    run(): void {
        for (const t of this.tests) {
            console.log(`Run test: ${t.name}`)
            t.test()
        }
    }
}
