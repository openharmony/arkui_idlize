import { int32 } from "@koalaui/common"
import { callCallback, KPointer, InteropNativeModule, NativeBuffer, DeserializerBase,
    registerNativeModuleLibraryName, loadInteropNativeModule, 
    wrapSystemApiHandlerCallback,
    checkEvents} from "@koalaui/interop"
import { xml, OHOS_XMLNativeModule, registerOhosXmlApiHandler,  } from "../../generated/ts"
export { xml } from "../../generated/ts"

export type EventType = xml.EventType
export type OHBuffer = ArrayBuffer
export const EventType = xml.EventType

export function init() {
    loadInteropNativeModule()
    InteropNativeModule._SetCallbackDispatcher(callCallback)
    wrapSystemApiHandlerCallback()
}

export function encodeText(text:string): ArrayBuffer {
    return Buffer.from(text).buffer;
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

export function eventTypeStr(eventType: EventType): string {
    return EventType[eventType] ?? `UNKNOWN(${eventType})`
}


