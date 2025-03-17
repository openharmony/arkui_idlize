import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { checkArkoalaCallbacks } from "../../generated/ts"
export { mediaquery } from "../../generated/ts"

import { performance as perf } from 'perf_hooks';

export const performance = {
    now(): number {
        return perf.now() * 1000000
    }
}

export type OHBuffer = ArrayBuffer

declare const NATIVE_LIBRARY_NAME: string
export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", NATIVE_LIBRARY_NAME)
    registerNativeModuleLibraryName("OHOS_MEDIAQUERYNativeModule", NATIVE_LIBRARY_NAME)
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

export function getLong(): bigint {
    return 2n
}

export function toPaddedString(v: number, leftPad: number = 0): string {
    return Math.round(v).toString().padStart(10, " ")
}