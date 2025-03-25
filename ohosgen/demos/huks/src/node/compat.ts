import { int32 } from "@koalaui/common"
import { callCallback, KPointer, InteropNativeModule, NativeBuffer, DeserializerBase,
    registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { checkArkoalaCallbacks, OHOS_SECURITY_HUKSNativeModule,  } from "../../generated/ts"
export { huks } from "../../generated/ts"

export type OHBuffer = NativeBuffer

declare const NATIVE_LIBRARY_NAME: string
export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", NATIVE_LIBRARY_NAME)
    registerNativeModuleLibraryName("OHOS_SECURITY_HUKSNativeModule", NATIVE_LIBRARY_NAME)
    loadInteropNativeModule()
    InteropNativeModule._SetCallbackDispatcher(callCallback)
}

function makeBuffer(len: int32, source: KPointer): OHBuffer {
    const result = new Uint8Array(64);
    OHOS_SECURITY_HUKSNativeModule._AllocateNativeBuffer(len, source, result);
    const deserializer = new DeserializerBase(result, 64);
    return deserializer.readBuffer()
}

export function encodeText(text:string): OHBuffer {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const ptr = InteropNativeModule._GetNativeBufferPointer(data.buffer as ArrayBuffer)
    return makeBuffer(data.byteLength, ptr)
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


