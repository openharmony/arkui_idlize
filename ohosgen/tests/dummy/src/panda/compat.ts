import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { checkArkoalaCallbacks } from "../../generated/arkts";
import { DUMMYNativeModule } from "../../generated/arkts"

export { dtsDummy, idlDummy } from "../../generated/arkts"
export { DTSDummyClass } from "../../generated/arkts"
// export { IDLDummyClass } from "../../generated/arkts"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "DUMMY_NativeModule")
    registerNativeModuleLibraryName("DUMMYNativeModule", "DUMMY_NativeModule")
    new DUMMYNativeModule()
}
