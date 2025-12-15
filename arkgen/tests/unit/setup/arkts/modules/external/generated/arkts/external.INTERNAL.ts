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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { int32, float32, int64 } from '@koalaui/common'
import { KInt, KLong, KBoolean, KFloat, KDouble, KUInt, KStringPtr, KPointer, KNativePointer, KInt32ArrayPtr, KUint8ArrayPtr, KFloat32ArrayPtr, pointer, KInteropReturnBuffer, KSerializerBuffer, loadNativeModuleLibrary, NativeBuffer, registerApiEventHandler, ResourceHolder, wrapSystemCallback, DeserializerBase, SerializerBase, CallbackResource, InteropNativeModule, RuntimeType } from '@koalaui/interop'
export enum CallbackKind {
    Kind_EMPTY_Callback = -1
}
export class EXTERNALNativeModule {
    static {
        loadNativeModuleLibrary("EXTERNALNativeModule")
    }
}
export function deserializeAndCallCallback(thisDeserializer: DeserializerBase): void {
    const kind: int32 = thisDeserializer.readInt32()
    throw new Error('Unknown callback kind')
}
export function registerExternalApiHandler(): void {
    registerApiEventHandler(0, deserializeAndCallCallback)
}
