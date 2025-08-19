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
import { SimpleAnimatorOptions, AnimatorOptions, AnimatorResult } from "./animator"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr, registerApiEventHandler, ResourceHolder, KInt, KStringPtr, wrapSystemCallback, KLong, KBoolean, KFloat, KDouble, KUInt, KNativePointer, KInt32ArrayPtr, KFloat32ArrayPtr, pointer, KInteropReturnBuffer, loadNativeModuleLibrary } from "@koalaui/interop"
export enum CallbackKind {
    Kind_Callback_Number_Void = 36519084,
    Kind_Callback_Void = -1867723152
}
export class SimpleAnimatorOptions_serializer {
    public static write(buffer: SerializerBase, value: SimpleAnimatorOptions): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toSimpleAnimatorOptionsPtr(value))
    }
    public static read(buffer: DeserializerBase): SimpleAnimatorOptions {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromSimpleAnimatorOptionsPtr(ptr)
    }
}
export class AnimatorOptions_serializer {
    public static write(buffer: SerializerBase, value: AnimatorOptions): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForDuration  = value.duration
        valueSerializer.writeNumber(valueHolderForDuration)
        const valueHolderForEasing  = value.easing
        valueSerializer.writeString(valueHolderForEasing)
        const valueHolderForDelay  = value.delay
        valueSerializer.writeNumber(valueHolderForDelay)
        const valueHolderForFill  = value.fill
        valueSerializer.writeString(valueHolderForFill)
        const valueHolderForDirection  = value.direction
        valueSerializer.writeString(valueHolderForDirection)
        const valueHolderForIterations  = value.iterations
        valueSerializer.writeNumber(valueHolderForIterations)
        const valueHolderForBegin  = value.begin
        valueSerializer.writeNumber(valueHolderForBegin)
        const valueHolderForEnd  = value.end
        valueSerializer.writeNumber(valueHolderForEnd)
    }
    public static read(buffer: DeserializerBase): AnimatorOptions {
        let valueDeserializer : DeserializerBase = buffer
        const durationTmpResult : number = (valueDeserializer.readNumber() as number)
        const easingTmpResult : string = (valueDeserializer.readString() as string)
        const delayTmpResult : number = (valueDeserializer.readNumber() as number)
        const fillTmpResult : string = (valueDeserializer.readString() as string)
        const directionTmpResult : string = (valueDeserializer.readString() as string)
        const iterationsTmpResult : number = (valueDeserializer.readNumber() as number)
        const beginTmpResult : number = (valueDeserializer.readNumber() as number)
        const endTmpResult : number = (valueDeserializer.readNumber() as number)
        let value : AnimatorOptions = ({duration: durationTmpResult, easing: easingTmpResult, delay: delayTmpResult, fill: fillTmpResult, direction: directionTmpResult, iterations: iterationsTmpResult, begin: beginTmpResult, end: endTmpResult} as AnimatorOptions)
        return value
    }
}
export class AnimatorResult_serializer {
    public static write(buffer: SerializerBase, value: AnimatorResult): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toAnimatorResultPtr(value))
    }
    public static read(buffer: DeserializerBase): AnimatorResult {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromAnimatorResultPtr(ptr)
    }
}
export function deserializeAndCallCallback_Number_Void(thisDeserializer: DeserializerBase): void {
    const _resourceId : int32 = thisDeserializer.readInt32()
    const _call  = (ResourceHolder.instance().get(_resourceId) as ((progress: number) => void))
    let progress : number = (thisDeserializer.readNumber() as number)
    _call(progress)
}
export function deserializeAndCallCallback_Void(thisDeserializer: DeserializerBase): void {
    const _resourceId : int32 = thisDeserializer.readInt32()
    const _call  = (ResourceHolder.instance().get(_resourceId) as (() => void))
    _call()
}
export function deserializeAndCallCallback(thisDeserializer: DeserializerBase): void {
    const kind : int32 = thisDeserializer.readInt32()
    switch ((kind as CallbackKind)) {
        case CallbackKind.Kind_Callback_Number_Void: return deserializeAndCallCallback_Number_Void(thisDeserializer);
        case CallbackKind.Kind_Callback_Void: return deserializeAndCallCallback_Void(thisDeserializer);
    }
    throw new Error("Unknown callback kind")
}
export function registerOhosAnimatorApiHandler(): void {
    registerApiEventHandler(10, deserializeAndCallCallback)
}
export class OHOS_ANIMATORNativeModule {
    static {
        loadNativeModuleLibrary("OHOS_ANIMATORNativeModule")
    }
    @ani.unsafe.Direct
    native static _AnimatorResult_construct(): KPointer
    @ani.unsafe.Direct
    native static _AnimatorResult_getFinalizer(): KPointer
    @ani.unsafe.Direct
    native static _AnimatorResult_reset(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Direct
    native static _AnimatorResult_play(ptr: KPointer): void
    @ani.unsafe.Direct
    native static _AnimatorResult_finish(ptr: KPointer): void
    @ani.unsafe.Direct
    native static _AnimatorResult_pause(ptr: KPointer): void
    @ani.unsafe.Direct
    native static _AnimatorResult_cancel(ptr: KPointer): void
    @ani.unsafe.Direct
    native static _AnimatorResult_reverse(ptr: KPointer): void
    @ani.unsafe.Direct
    native static _AnimatorResult_setExpectedFrameRateRange(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Direct
    native static _AnimatorResult_getOnFrame(ptr: KPointer): KPointer
    @ani.unsafe.Direct
    native static _AnimatorResult_setOnFrame(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Direct
    native static _AnimatorResult_getOnFinish(ptr: KPointer): KPointer
    @ani.unsafe.Direct
    native static _AnimatorResult_setOnFinish(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Direct
    native static _AnimatorResult_getOnCancel(ptr: KPointer): KPointer
    @ani.unsafe.Direct
    native static _AnimatorResult_setOnCancel(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Direct
    native static _AnimatorResult_getOnRepeat(ptr: KPointer): KPointer
    @ani.unsafe.Direct
    native static _AnimatorResult_setOnRepeat(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Direct
    native static _SimpleAnimatorOptions_construct(begin: number, end: number): KPointer
    @ani.unsafe.Direct
    native static _SimpleAnimatorOptions_getFinalizer(): KPointer
    @ani.unsafe.Direct
    native static _SimpleAnimatorOptions_duration(ptr: KPointer, duration: number): KPointer
    @ani.unsafe.Quick
    native static _SimpleAnimatorOptions_easing(ptr: KPointer, curve: KStringPtr): KPointer
    @ani.unsafe.Direct
    native static _SimpleAnimatorOptions_delay(ptr: KPointer, delay: number): KPointer
    @ani.unsafe.Direct
    native static _SimpleAnimatorOptions_fill(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): KPointer
    @ani.unsafe.Direct
    native static _SimpleAnimatorOptions_direction(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): KPointer
    @ani.unsafe.Direct
    native static _SimpleAnimatorOptions_iterations(ptr: KPointer, iterations: number): KPointer
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
    static isAnimatorOptions(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean, arg4: boolean, arg5: boolean, arg6: boolean, arg7: boolean): boolean {
        return value instanceof AnimatorOptions
    }
    static isAnimatorResult(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean): boolean {
        return value instanceof AnimatorResult
    }
    static isSimpleAnimatorOptions(value: Object | string | number | undefined): boolean {
        return value instanceof SimpleAnimatorOptions
    }
}
