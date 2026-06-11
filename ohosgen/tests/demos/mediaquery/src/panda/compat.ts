import { Chrono } from "std/time"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop";
import { OHOS_MEDIAQUERYNativeModule, registerOhosMediaqueryApiHandler } from "../../generated/arkts";
export { mediaquery } from "../../generated/arkts"

export namespace performance {
    export function now(): number {
        return Chrono.nanoNow()
    }
}

export type OHBuffer = NativeBuffer

export function pullEvents(): void {
    checkEvents()
}

export function init(): void {
    wrapSystemApiHandlerCallback()
    registerOhosMediaqueryApiHandler()
    new OHOS_MEDIAQUERYNativeModule()
}

export function getLong(): long {
    return 2
}

export function toPaddedString(v: number, leftPad: number = 0): string {
    return StringBuilder.toString(v.toLong()).padLeft(c' ', 10)
}
