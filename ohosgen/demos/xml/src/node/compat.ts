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


