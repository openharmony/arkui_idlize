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
import { default as image } from "@ohos.multimedia.image"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr, registerApiEventHandler, ResourceHolder, KInt, KStringPtr, wrapSystemCallback, KLong, KBoolean, KFloat, KDouble, KUInt, KNativePointer, KInt32ArrayPtr, KFloat32ArrayPtr, pointer, KInteropReturnBuffer, loadNativeModuleLibrary } from "@koalaui/interop"
import { AtomicServiceOptions } from "./AtomicServiceOptions"
import { default as bundleManager } from "@ohos.bundle.bundleManager"
import { default as contextConstant } from "@ohos.app.ability.contextConstant"
import { AsyncCallback, BusinessError } from "@ohos.base"
import { default as colorSpaceManager } from "@ohos.graphics.colorSpaceManager"
import { default as rpc } from "@ohos.rpc"
import { StartOptions } from "@ohos.app.ability.StartOptions"
export enum CallbackKind {
    Kind_EMPTY_Callback = -1
}
export class image_PixelMap_serializer {
    public static write(buffer: SerializerBase, value: image.PixelMap): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toImagePixelMapPtr(value))
    }
    public static read(buffer: DeserializerBase): image.PixelMap {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromImagePixelMapPtr(ptr)
    }
}
export class AtomicServiceOptions_serializer {
    public static write(buffer: SerializerBase, value: AtomicServiceOptions): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toAtomicServiceOptionsPtr(value))
    }
    public static read(buffer: DeserializerBase): AtomicServiceOptions {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromAtomicServiceOptionsPtr(ptr)
    }
}
export function deserializeAndCallCallback(thisDeserializer: DeserializerBase): void {
    const kind : int32 = thisDeserializer.readInt32()
    throw new Error("Unknown callback kind")
}
export function registerOhosAppAbilityAtomicServiceOptionsApiHandler(): void {
    registerApiEventHandler(10, deserializeAndCallCallback)
}
export class OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule {
    static {
        loadNativeModuleLibrary("OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule")
    }
    @ani.unsafe.Direct
    native static _AtomicServiceOptions_construct(): KPointer
    @ani.unsafe.Direct
    native static _AtomicServiceOptions_getFinalizer(): KPointer
    @ani.unsafe.Quick
    native static _AtomicServiceOptions_getFlags(ptr: KPointer): KInteropReturnBuffer
    @ani.unsafe.Direct
    native static _AtomicServiceOptions_setFlags(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Quick
    native static _AtomicServiceOptions_getParameters(ptr: KPointer): KInteropReturnBuffer
    @ani.unsafe.Direct
    native static _AtomicServiceOptions_setParameters(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
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
    static isAtomicServiceOptions(value: Object | string | number | undefined, arg0: boolean, arg1: boolean): boolean {
        return value instanceof AtomicServiceOptions
    }
    static isbundleManager_SupportWindowMode(value: Object | string | number | undefined): boolean {
        return value instanceof bundleManager.SupportWindowMode
    }
    static iscontextConstant_ProcessMode(value: Object | string | number | undefined): boolean {
        return value instanceof contextConstant.ProcessMode
    }
    static iscontextConstant_StartupVisibility(value: Object | string | number | undefined): boolean {
        return value instanceof contextConstant.StartupVisibility
    }
    static isimage_PixelMap(value: Object | string | number | undefined, arg0: boolean, arg1: boolean): boolean {
        return value instanceof image.PixelMap
    }
    static bundleManager_SupportWindowMode_ToNumeric(value: bundleManager.SupportWindowMode): int32 {
        return value.valueOf()
    }
    static bundleManager_SupportWindowMode_FromNumeric(ordinal: int32): bundleManager.SupportWindowMode {
        return bundleManager.SupportWindowMode.fromValue(ordinal)
    }
    static contextConstant_ProcessMode_ToNumeric(value: contextConstant.ProcessMode): int32 {
        return value.valueOf()
    }
    static contextConstant_ProcessMode_FromNumeric(ordinal: int32): contextConstant.ProcessMode {
        return contextConstant.ProcessMode.fromValue(ordinal)
    }
    static contextConstant_StartupVisibility_ToNumeric(value: contextConstant.StartupVisibility): int32 {
        return value.valueOf()
    }
    static contextConstant_StartupVisibility_FromNumeric(ordinal: int32): contextConstant.StartupVisibility {
        return contextConstant.StartupVisibility.fromValue(ordinal)
    }
}
