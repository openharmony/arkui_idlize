import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks } from "../../generated/arkts/unit.INTERNAL";
import { UNITNativeModule } from "../../generated/arkts"

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
} from "../../generated/arkts"

export { and_values } from "../../generated/arkts"
export { sum_numbers } from "../../generated/arkts"
export { test_bigint } from "../../generated/arkts"
export { test_buffer, test_buffer_idl } from "../../generated/arkts"
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
    IDLOrdinaryEnum,
    IDLIntEnum,
    IDLStringEnum,
    idlCheckOrdinaryEnums,
    idlCheckIntEnums,
    idlCheckStringEnums,
    DataClass, DataInterface, IDLDataClass, IDLDataInterface,
    testDataClass, testDataInterface, testIDLDataClass, testIDLDataInterface,
} from '../../generated/arkts'

export { CheckExceptionClass, CheckExceptionInterface } from "../../generated/arkts"

export {
    ContentModifier,
    WrappedBuilder,
    wrapBuilder,
    CommonConfiguration,
    CustomComponentConfiguration,
    CustomComponentShape,
    CustomComponentSample,
} from '../../generated/arkts'

export { testLength } from "../../generated/arkts"

export { IDLCheckConstructor } from "../../generated/arkts"

export { InternalModuleDataInterface } from "./modules/internal_lib"
export { DTSCheckInternalLib } from "../../generated/arkts"

export { DTSHookClass, DTSHookValue } from "../../generated/arkts"
export { ImportedHookValue } from "./handwritten/external_lib"
export { ExternalType, hookns } from "./handwritten/external_lib"

export { DTSCheckExternalLib, InternalType } from "../../generated/arkts"

export type OHBuffer = NativeBuffer
export type OHAny = object

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    new UNITNativeModule()
}

export function toBigInt(value: long): long {
    return value
}

export function checkEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    arktest.assertEQ(value1, value2, comment)
}

export function checkNotEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
    arktest.assertNE(value1, value2, comment)
}

export class UnitTestsuite extends arktest.ArkTestsuite {
    constructor(name: string) {
        super(name)
    }
}
