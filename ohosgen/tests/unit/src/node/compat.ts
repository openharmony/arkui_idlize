import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { checkArkoalaCallbacks } from "../../generated/ts/peers/CallbacksChecker";

export { test_buffer } from "../../generated/ts"

export type OHBuffer = ArrayBuffer

declare const NATIVE_LIBRARY_NAME: string
export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", NATIVE_LIBRARY_NAME)
    registerNativeModuleLibraryName("UNITNativeModule", NATIVE_LIBRARY_NAME)
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
