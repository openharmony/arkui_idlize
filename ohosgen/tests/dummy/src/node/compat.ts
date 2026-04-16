import { callCallback, InteropNativeModule, registerNativeModuleLibraryName, loadInteropNativeModule, checkEvents, wrapSystemApiHandlerCallback } from "@koalaui/interop"

export { dtsDummy, idlDummy } from "../../generated/ts"
// export { DTSDummyClass } from "../../generated/ts"
// export { IDLDummyClass } from "../../generated/ts"

export {
  SampleI,
  SampleC,
  getSampleI,
  getSampleC,
} from "../../generated/ts"

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
