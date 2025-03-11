import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { checkArkoalaCallbacks } from "../../generated/ts/peers/CallbacksChecker";
export { mediaquery } from "../../generated/ts"

export { performance } from 'perf_hooks';

export type OHBuffer = ArrayBuffer

declare const NATIVE_LIBRARY_NAME: string
export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", NATIVE_LIBRARY_NAME)
    registerNativeModuleLibraryName("MEDIAQUERYNativeModule", NATIVE_LIBRARY_NAME)
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
