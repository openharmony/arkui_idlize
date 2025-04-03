import { int32 } from "@koalaui/common"
import { callCallback, KPointer, InteropNativeModule, NativeBuffer, DeserializerBase,
    registerNativeModuleLibraryName, loadInteropNativeModule } from "@koalaui/interop"
import { xml, checkArkoalaCallbacks, OHOS_XMLNativeModule,  } from "../../generated/ts"
export { xml } from "../../generated/ts"

export type EventType = xml.EventType
export type OHBuffer = NativeBuffer
export const EventType = xml.EventType

export function init() {
    loadInteropNativeModule()
    InteropNativeModule._SetCallbackDispatcher(callCallback)
}

function makeBuffer(len: int32, source: KPointer): OHBuffer {
    const result = new Uint8Array(64);
    OHOS_XMLNativeModule._AllocateNativeBuffer(len, source, result);
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

export function eventTypeStr(eventType: EventType): string {
    return EventType[eventType] ?? `UNKNOWN(${eventType})`
}


