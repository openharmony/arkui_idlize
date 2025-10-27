import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop";
import { registerUnitApiHandler, UNITNativeModule } from "../../generated/arkts"

export {
    CONST_BOOLEAN_FALSE,
    CONST_BOOLEAN_TRUE,
    CONST_NUMBER_INT,
    CONST_NUMBER_FLOAT,
    CONST_STRING,
} from "../../generated/arkts"

export { and_values } from "../../generated/arkts"
export { sum_numbers } from "../../generated/arkts"
export { test_bigint } from "../../generated/arkts"
export { test_buffer } from "../../generated/arkts"
export { test_materialized_classes, UtilityInterface } from "../../generated/arkts"
export { test_any } from "../../generated/arkts"
export { test_return_types, test_ret_A, test_ret_B } from "../../generated/arkts"
export {
    ForceCallbackListener,
    ForceCallbackClass,
    registerForceCallbackListener,
    callForceCallbackListener,
    ClassWithComplexPropertyType
} from "../../generated/arkts"

export {
    OrdinaryEnum,
    IntEnum,
    DuplicateIntEnum,
    StringEnum,
    checkOrdinaryEnums,
    checkIntEnums,
    checkDuplicateIntEnums,
    checkStringEnums,
    DataClass, DataInterface,
    testDataClass, testDataInterface,
} from '../../generated/arkts'

export { UnionSampleEnum, UnionSampleInterface, checkUnionSample } from "../../generated/arkts"

export { CheckExceptionClass, CheckExceptionInterface } from "../../generated/arkts"

export { testLength } from "../../generated/arkts"

export { IDLCheckConstructor } from "../../generated/arkts"

export { InternalModuleDataInterface } from "./modules/internal_lib"
export { RenamedModuleDataInterface } from "./modules/newname_lib"
export { DTSCheckInternalLib } from "../../generated/arkts"

export { DTSHookClass, DTSHookValue } from "../../generated/arkts"
export { ImportedHookValue } from "./handwritten/external_lib"
export { ExternalType, hookns } from "./handwritten/external_lib"

export { DTSCheckExternalLib, InternalType } from "../../generated/arkts"

export { PromiseTester } from "../../generated/arkts"

export type OHBuffer = NativeBuffer
export type OHAny = object

export function pullEvents() {
    checkEvents()
}

export function init() {
    wrapSystemApiHandlerCallback()
    registerUnitApiHandler()
    new UNITNativeModule()
}

export function toBigInt(value: long): long {
    return value
}

export function checkEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    if (value1 instanceof Array && value2 instanceof Array) {
        arktest.assertEQ(value1.length, value2.length, "Arrays length differ!")
        for(let i = 0; i < value1.length; i++) {
            arktest.assertEQ(value1[i], value2[i], comment)
        }
        return
    }
    arktest.assertEQ(value1, value2, comment)
}

export function assertDoubleEQ(value1: number, value2: number, absError: number = 0.001, comment?: string): void {
    arktest.assertDoubleEQ(value1, value2, absError, comment)
}

export function checkNotEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    arktest.assertNE(value1, value2, comment)
}

export class UnitTestsuite extends arktest.ArkTestsuite {
    constructor(name: string) {
        super(name)
    }
}
