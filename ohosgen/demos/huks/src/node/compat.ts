import { int32 } from "@koalaui/common"
import { callCallback, KPointer, InteropNativeModule, NativeBuffer, DeserializerBase,
    registerNativeModuleLibraryName, loadInteropNativeModule, 
    wrapSystemApiHandlerCallback,
    checkEvents} from "@koalaui/interop"
export { huks } from "../../generated/ts"

export type OHBuffer = NativeBuffer

declare const NATIVE_LIBRARY_NAME: string
export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", NATIVE_LIBRARY_NAME)
    registerNativeModuleLibraryName("OHOS_SECURITY_HUKSNativeModule", NATIVE_LIBRARY_NAME)
    loadInteropNativeModule()
    InteropNativeModule._SetCallbackDispatcher(callCallback)
    wrapSystemApiHandlerCallback()
}

export function encodeText(text:string): OHBuffer {
    const encodedString = Buffer.from(text)
    const buffer = new NativeBuffer(encodedString.length + 1)
    InteropNativeModule._CopyArray(buffer.data, encodedString.length + 1, encodedString)
    return buffer;
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


