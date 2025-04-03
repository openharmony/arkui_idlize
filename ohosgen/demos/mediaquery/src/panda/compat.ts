import { Chrono } from "std/time"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName } from "@koalaui/interop";
import { OHOS_MEDIAQUERYNativeModule, checkArkoalaCallbacks } from "../../generated/arkts";
export { mediaquery } from "../../generated/arkts"

export namespace performance {
    export function now(): number {
        return Chrono.nanoNow()
    }
}

export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkArkoalaCallbacks()
}

export function init() {
    new OHOS_MEDIAQUERYNativeModule()
}

export function getLong(): long {
    return 2
}

export function toPaddedString(v: number, leftPad: number = 0): string {
    return StringBuilder.toString(v as long).padLeft(" ", 10)
}
