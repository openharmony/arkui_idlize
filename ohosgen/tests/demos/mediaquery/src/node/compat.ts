import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop"
export { mediaquery } from "../../generated/ts"

import { performance as perf } from 'perf_hooks';

export const performance = {
    now(): number {
        return perf.now() * 1000000
    }
}

export type OHBuffer = ArrayBuffer

export function init() {
    loadInteropNativeModule()
    InteropNativeModule._SetCallbackDispatcher(callCallback)
    wrapSystemApiHandlerCallback()
}

export function runEventLoop() {
    let finished = false
    let pull = () => {
        //
        checkEvents()
        if (!finished)
            setTimeout(pull, 0)
    };
    setTimeout(pull, 0);
    setTimeout(() => {
        finished = true
    }, 2000);
}

export function getLong(): bigint {
    return BigInt(2)
}

export function toPaddedString(v: number, leftPad: number = 0): string {
    return Math.round(v).toString().padStart(10, " ")
}