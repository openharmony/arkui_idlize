import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop";
import { DUMMYNativeModule, registerDummyApiHandler } from "../../generated/arkts"

export { dtsDummy, idlDummy } from "../../generated/arkts"
// export { DTSDummyClass } from "../../generated/arkts"
// export { IDLDummyClass } from "../../generated/arkts"

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkEvents()
}

export function init() {
    wrapSystemApiHandlerCallback()
    registerDummyApiHandler()
    new DUMMYNativeModule()
}
