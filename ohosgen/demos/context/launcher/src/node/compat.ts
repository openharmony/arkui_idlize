import { BusinessError } from "@ohos.base"
import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { checkArkoalaCallbacks } from "../../generated/ts";

export { BaseContext, Context, ApplicationContext } from "../../generated/ts"

export type OHBuffer = ArrayBuffer

export function init() {
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
