import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks } from "../../generated/arkts/peers/CallbacksChecker";
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
export { test_buffer } from "../../generated/arkts"
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
    StringEnum,
    checkOrdinaryEnums,
    IDLOrdinaryEnum,
    IDLIntEnum,
    IDLStringEnum,
    idlCheckOrdinaryEnums,
    DataClass, DataInterface, IDLDataClass, IDLDataInterface,
    testDataClass, testDataInterface, testIDLDataClass, testIDLDataInterface
} from '../../generated/arkts'

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "UNIT_NativeBridgeArk")
    registerNativeModuleLibraryName("UNITNativeModule", "UNIT_NativeBridgeArk")
    new UNITNativeModule()
}
