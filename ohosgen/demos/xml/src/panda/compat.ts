/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { OHOS_XMLNativeModule, registerOhosXmlApiHandler } from "../../generated/arkts"
import { int32 } from "@koalaui/common"
import { InteropNativeModule, KPointer, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents, registerApiEventHandler, wrapSystemApiHandlerCallback } from "@koalaui/interop";
import { xml } from "../../generated/arkts"

export { xml } from "../../generated/arkts"
export type EventType = xml.EventType
export type OHBuffer = ArrayBuffer

export function pullEvents() {
    checkEvents()
}

export function init() {
    wrapSystemApiHandlerCallback()
    registerOhosXmlApiHandler()
    new OHOS_XMLNativeModule()
}

export function encodeText(text: string): OHBuffer {
    const buffer = new ArrayBuffer((text.length * 4 + 1).toLong())
    InteropNativeModule._ManagedStringWrite(text, InteropNativeModule._GetNativeBufferPointer(buffer), buffer.byteLength.toInt(), 0);
    return buffer;
}

export function eventTypeStr(eventType: xml.EventType) {
    return eventType.getName()
}
