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
import { int32 } from "@koalaui/common"
import { InteropNativeModule, KPointer, NativeBuffer, DeserializerBase, registerNativeModuleLibraryName, checkEvents } from "@koalaui/interop";
import { OHOS_SECURITY_HUKSNativeModule, registerOhosSecurityHuksApiHandler } from "../../generated/arkts"

export { huks } from "../../generated/arkts"
export type OHBuffer = NativeBuffer

export function pullEvents() {
    checkEvents()
}

export function init() {
    registerNativeModuleLibraryName("InteropNativeModule", "HUKS_NativeBridgeArk")
    registerNativeModuleLibraryName("OHOS_SECURITY_HUKSNativeModule", "HUKS_NativeBridgeArk")
    new OHOS_SECURITY_HUKSNativeModule()
    registerOhosSecurityHuksApiHandler()
}

export function encodeText(text: string): OHBuffer {
    const buffer = new NativeBuffer((text.length * 4 + 1).toLong())
    InteropNativeModule._ManagedStringWrite(text, buffer.data, buffer.length.toInt(), 0);
    return buffer;
}
