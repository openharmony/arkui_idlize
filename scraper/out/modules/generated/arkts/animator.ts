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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { AnimatorOptions_serializer, SimpleAnimatorOptions_serializer, TypeChecker, OHOS_ANIMATORNativeModule } from "./ohos.animator.INTERNAL"
import { extractors } from "#handwritten"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export interface AnimatorResult {
    onFrame: ((progress: number) => void)
    onFinish: (() => void)
    onCancel: (() => void)
    onRepeat: (() => void)
    reset(options: AnimatorOptions | SimpleAnimatorOptions): void
    play(): void
    finish(): void
    pause(): void
    cancel(): void
    reverse(): void
    setExpectedFrameRateRange(rateRange: object): void
}
export class AnimatorResultInternal implements MaterializedBase,AnimatorResult {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get onFrame(): ((progress: number) => void) {
        return this.getOnFrame()
    }
    set onFrame(onFrame: ((progress: number) => void)) {
        this.setOnFrame(onFrame)
    }
    get onFinish(): (() => void) {
        return this.getOnFinish()
    }
    set onFinish(onFinish: (() => void)) {
        this.setOnFinish(onFinish)
    }
    get onCancel(): (() => void) {
        return this.getOnCancel()
    }
    set onCancel(onCancel: (() => void)) {
        this.setOnCancel(onCancel)
    }
    get onRepeat(): (() => void) {
        return this.getOnRepeat()
    }
    set onRepeat(onRepeat: (() => void)) {
        this.setOnRepeat(onRepeat)
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, AnimatorResultInternal.getFinalizer())
    }
    constructor() {
        this(AnimatorResultInternal.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ANIMATORNativeModule._AnimatorResult_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ANIMATORNativeModule._AnimatorResult_getFinalizer()
    }
    public static fromPtr(ptr: KPointer): AnimatorResultInternal {
        return new AnimatorResultInternal(ptr)
    }
    public reset(options: AnimatorOptions | SimpleAnimatorOptions): void {
        const options_casted = options as (AnimatorOptions | SimpleAnimatorOptions)
        this.reset_serialize(options_casted)
        return
    }
    public play(): void {
        this.play_serialize()
        return
    }
    public finish(): void {
        this.finish_serialize()
        return
    }
    public pause(): void {
        this.pause_serialize()
        return
    }
    public cancel(): void {
        this.cancel_serialize()
        return
    }
    public reverse(): void {
        this.reverse_serialize()
        return
    }
    public setExpectedFrameRateRange(rateRange: object): void {
        const rateRange_casted = rateRange as (object)
        this.setExpectedFrameRateRange_serialize(rateRange_casted)
        return
    }
    private getOnFrame(): ((progress: number) => void) {
        return this.getOnFrame_serialize()
    }
    private setOnFrame(onFrame: ((progress: number) => void)): void {
        const onFrame_casted = onFrame as (((progress: number) => void))
        this.setOnFrame_serialize(onFrame_casted)
        return
    }
    private getOnFinish(): (() => void) {
        return this.getOnFinish_serialize()
    }
    private setOnFinish(onFinish: (() => void)): void {
        const onFinish_casted = onFinish as ((() => void))
        this.setOnFinish_serialize(onFinish_casted)
        return
    }
    private getOnCancel(): (() => void) {
        return this.getOnCancel_serialize()
    }
    private setOnCancel(onCancel: (() => void)): void {
        const onCancel_casted = onCancel as ((() => void))
        this.setOnCancel_serialize(onCancel_casted)
        return
    }
    private getOnRepeat(): (() => void) {
        return this.getOnRepeat_serialize()
    }
    private setOnRepeat(onRepeat: (() => void)): void {
        const onRepeat_casted = onRepeat as ((() => void))
        this.setOnRepeat_serialize(onRepeat_casted)
        return
    }
    reset_serialize(options: AnimatorOptions | SimpleAnimatorOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options instanceof AnimatorOptions) {
            thisSerializer.writeInt8((0).toChar())
            const optionsForIdx0  = options as AnimatorOptions
            AnimatorOptions_serializer.write(thisSerializer, optionsForIdx0)
        } else if (options instanceof SimpleAnimatorOptions) {
            thisSerializer.writeInt8((1).toChar())
            const optionsForIdx1  = options as SimpleAnimatorOptions
            SimpleAnimatorOptions_serializer.write(thisSerializer, optionsForIdx1)
        }
        OHOS_ANIMATORNativeModule._AnimatorResult_reset(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    play_serialize(): void {
        OHOS_ANIMATORNativeModule._AnimatorResult_play(this.peer!.ptr)
    }
    finish_serialize(): void {
        OHOS_ANIMATORNativeModule._AnimatorResult_finish(this.peer!.ptr)
    }
    pause_serialize(): void {
        OHOS_ANIMATORNativeModule._AnimatorResult_pause(this.peer!.ptr)
    }
    cancel_serialize(): void {
        OHOS_ANIMATORNativeModule._AnimatorResult_cancel(this.peer!.ptr)
    }
    reverse_serialize(): void {
        OHOS_ANIMATORNativeModule._AnimatorResult_reverse(this.peer!.ptr)
    }
    setExpectedFrameRateRange_serialize(rateRange: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', rateRange)
        OHOS_ANIMATORNativeModule._AnimatorResult_setExpectedFrameRateRange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getOnFrame_serialize(): ((progress: number) => void) {
        const retval  = OHOS_ANIMATORNativeModule._AnimatorResult_getOnFrame(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    private setOnFrame_serialize(onFrame: ((progress: number) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(onFrame)
        OHOS_ANIMATORNativeModule._AnimatorResult_setOnFrame(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getOnFinish_serialize(): (() => void) {
        const retval  = OHOS_ANIMATORNativeModule._AnimatorResult_getOnFinish(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    private setOnFinish_serialize(onFinish: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(onFinish)
        OHOS_ANIMATORNativeModule._AnimatorResult_setOnFinish(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getOnCancel_serialize(): (() => void) {
        const retval  = OHOS_ANIMATORNativeModule._AnimatorResult_getOnCancel(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    private setOnCancel_serialize(onCancel: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(onCancel)
        OHOS_ANIMATORNativeModule._AnimatorResult_setOnCancel(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getOnRepeat_serialize(): (() => void) {
        const retval  = OHOS_ANIMATORNativeModule._AnimatorResult_getOnRepeat(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    private setOnRepeat_serialize(onRepeat: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(onRepeat)
        OHOS_ANIMATORNativeModule._AnimatorResult_setOnRepeat(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export class SimpleAnimatorOptionsInternal {
    public static fromPtr(ptr: KPointer): SimpleAnimatorOptions {
        return new SimpleAnimatorOptions(false, false, ptr)
    }
}
export class SimpleAnimatorOptions implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(_0: boolean, _1: boolean, peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, SimpleAnimatorOptions.getFinalizer())
    }
    constructor(begin: number, end: number) {
        this(false, false, SimpleAnimatorOptions.construct(begin, end))
    }
    static construct(begin: number, end: number): KPointer {
        const retval  = OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_construct(begin, end)
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_getFinalizer()
    }
    public duration(duration: number): SimpleAnimatorOptions {
        const duration_casted = duration as (number)
        return this.duration_serialize(duration_casted)
    }
    public easing(curve: string): SimpleAnimatorOptions {
        const curve_casted = curve as (string)
        return this.easing_serialize(curve_casted)
    }
    public delay(delay: number): SimpleAnimatorOptions {
        const delay_casted = delay as (number)
        return this.delay_serialize(delay_casted)
    }
    public fill(fillMode: object): SimpleAnimatorOptions {
        const fillMode_casted = fillMode as (object)
        return this.fill_serialize(fillMode_casted)
    }
    public direction(direction: object): SimpleAnimatorOptions {
        const direction_casted = direction as (object)
        return this.direction_serialize(direction_casted)
    }
    public iterations(iterations: number): SimpleAnimatorOptions {
        const iterations_casted = iterations as (number)
        return this.iterations_serialize(iterations_casted)
    }
    duration_serialize(duration: number): SimpleAnimatorOptions {
        const retval  = OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_duration(this.peer!.ptr, duration)
        const obj : SimpleAnimatorOptions = extractors.fromSimpleAnimatorOptionsPtr(retval)
        return obj
    }
    easing_serialize(curve: string): SimpleAnimatorOptions {
        const retval  = OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_easing(this.peer!.ptr, curve)
        const obj : SimpleAnimatorOptions = extractors.fromSimpleAnimatorOptionsPtr(retval)
        return obj
    }
    delay_serialize(delay: number): SimpleAnimatorOptions {
        const retval  = OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_delay(this.peer!.ptr, delay)
        const obj : SimpleAnimatorOptions = extractors.fromSimpleAnimatorOptionsPtr(retval)
        return obj
    }
    fill_serialize(fillMode: object): SimpleAnimatorOptions {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', fillMode)
        const retval  = OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_fill(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : SimpleAnimatorOptions = extractors.fromSimpleAnimatorOptionsPtr(retval)
        return obj
    }
    direction_serialize(direction: object): SimpleAnimatorOptions {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', direction)
        const retval  = OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_direction(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : SimpleAnimatorOptions = extractors.fromSimpleAnimatorOptionsPtr(retval)
        return obj
    }
    iterations_serialize(iterations: number): SimpleAnimatorOptions {
        const retval  = OHOS_ANIMATORNativeModule._SimpleAnimatorOptions_iterations(this.peer!.ptr, iterations)
        const obj : SimpleAnimatorOptions = extractors.fromSimpleAnimatorOptionsPtr(retval)
        return obj
    }
}
export interface AnimatorOptions {
    duration: number;
    easing: string;
    delay: number;
    fill: string;
    direction: string;
    iterations: number;
    begin: number;
    end: number;
}
