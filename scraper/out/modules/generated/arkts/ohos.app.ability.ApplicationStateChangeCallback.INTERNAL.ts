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

import { int32, float32, int64, unsafeCast } from "@koalaui/common"
import { extractors } from "#handwritten"
import { ApplicationStateChangeCallback } from "./ApplicationStateChangeCallback"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr, registerApiEventHandler, ResourceHolder, KInt, KStringPtr, wrapSystemCallback, KLong, KBoolean, KFloat, KDouble, KUInt, KNativePointer, KInt32ArrayPtr, KFloat32ArrayPtr, pointer, KInteropReturnBuffer, loadNativeModuleLibrary } from "@koalaui/interop"
export enum CallbackKind {
    Kind_EMPTY_Callback = -1
}
export class ApplicationStateChangeCallback_serializer {
    public static write(buffer: SerializerBase, value: ApplicationStateChangeCallback): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toApplicationStateChangeCallbackPtr(value))
    }
    public static read(buffer: DeserializerBase): ApplicationStateChangeCallback {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromApplicationStateChangeCallbackPtr(ptr)
    }
}
export function deserializeAndCallCallback(thisDeserializer: DeserializerBase): void {
    const kind : int32 = thisDeserializer.readInt32()
    throw new Error("Unknown callback kind")
}
export function registerOhosAppAbilityApplicationStateChangeCallbackApiHandler(): void {
    registerApiEventHandler(10, deserializeAndCallCallback)
}
export class OHOS_APP_ABILITY_APPLICATIONSTATECHANGECALLBACKNativeModule {
    static {
        loadNativeModuleLibrary("OHOS_APP_ABILITY_APPLICATIONSTATECHANGECALLBACKNativeModule")
    }
    @ani.unsafe.Direct
    native static _ApplicationStateChangeCallback_construct(): KPointer
    @ani.unsafe.Direct
    native static _ApplicationStateChangeCallback_getFinalizer(): KPointer
    @ani.unsafe.Direct
    native static _ApplicationStateChangeCallback_onApplicationForeground(ptr: KPointer): void
    @ani.unsafe.Direct
    native static _ApplicationStateChangeCallback_onApplicationBackground(ptr: KPointer): void
}
export class TypeChecker {
    static typeInstanceOf<T>(value: Object, prop: string): boolean {
        return value instanceof T
    }
    static typeCast<T>(value: Object): T {
        return value as T
    }
    static isNativeBuffer(value: Object): boolean {
        return value instanceof ArrayBuffer
    }
    static isApplicationStateChangeCallback(value: Object | string | number | undefined): boolean {
        return value instanceof ApplicationStateChangeCallback
    }
}
