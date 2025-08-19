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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { WrappedBuilder_serializer, WrappedBuilder, CustomBuilder, CustomBuilderT } from "./component/builder"
import { FrameNode_serializer, FrameNode, FrameNodeInternal } from "./FrameNode"
import { TouchEvent_serializer, MouseEvent_serializer, AxisEvent_serializer, TouchEvent, TouchEventInternal, MouseEvent, MouseEventInternal, AxisEvent, AxisEventInternal } from "./component/common"
import { extractors } from "#handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { CustomNodeBuilder } from "./component/idlize"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { Size, Size_serializer } from "./Graphics"
export class BuilderNodeInternal {
    public static fromPtr<T>(ptr: KPointer): BuilderNode<T> {
        return new BuilderNode<T>(false, false, ptr)
    }
}
export class BuilderNode<T> implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(_0: boolean, _1: boolean, peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, BuilderNode.getFinalizer())
    }
    constructor(uiContext: UIContext, options?: RenderOptions) {
        this(false, false, BuilderNode.construct(uiContext, options))
    }
    static construct(uiContext: UIContext, options?: RenderOptions): KPointer {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            RenderOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = ArkUIGeneratedNativeModule._BuilderNode_construct(extractors.toUIContextPtr(uiContext), thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._BuilderNode_getFinalizer()
    }
    public build(builder: WrappedBuilder<CustomBuilder>): void {
        const builder_casted = builder as (WrappedBuilder<CustomBuilder>)
        this.build0_serialize(builder_casted)
        return
    }
    public build(builder: WrappedBuilder<CustomBuilderT<T>>, arg: T): void {
        const builder_casted = builder as (WrappedBuilder<CustomBuilderT<T>>)
        const arg_casted = arg as (T)
        this.build1_serialize(builder_casted, arg_casted)
        return
    }
    public build(builder: WrappedBuilder<CustomBuilderT<T>>, arg: T, options: BuildOptions): void {
        const builder_casted = builder as (WrappedBuilder<CustomBuilderT<T>>)
        const arg_casted = arg as (T)
        const options_casted = options as (BuildOptions)
        this.build2_serialize(builder_casted, arg_casted, options_casted)
        return
    }
    public update(arg: T): void {
        const arg_casted = arg as (T)
        this.update_serialize(arg_casted)
        return
    }
    public getFrameNode(): FrameNode | undefined {
        return this.getFrameNode_serialize()
    }
    public postTouchEvent(event: TouchEvent): boolean {
        const event_casted = event as (TouchEvent)
        return this.postTouchEvent_serialize(event_casted)
    }
    public dispose(): void {
        this.dispose_serialize()
        return
    }
    public reuse(param?: Object): void {
        const param_casted = param as (Object | undefined)
        this.reuse_serialize(param_casted)
        return
    }
    public recycle(): void {
        this.recycle_serialize()
        return
    }
    public updateConfiguration(): void {
        this.updateConfiguration_serialize()
        return
    }
    public isDisposed(): boolean {
        return this.isDisposed_serialize()
    }
    public postInputEvent(event: InputEventType): boolean {
        const event_casted = event as (InputEventType)
        return this.postInputEvent_serialize(event_casted)
    }
    public inheritFreezeOptions(enabled: boolean): void {
        const enabled_casted = enabled as (boolean)
        this.inheritFreezeOptions_serialize(enabled_casted)
        return
    }
    build0_serialize(builder: WrappedBuilder<CustomBuilder>): void {
        ArkUIGeneratedNativeModule._BuilderNode_build0(this.peer!.ptr, toPeerPtr(builder))
    }
    build1_serialize(builder: WrappedBuilder<CustomBuilderT<T>>, arg: T): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        WrappedBuilder_serializer.write(thisSerializer, builder)
        thisSerializer.writeCustomObject('T', (arg as Object))
        ArkUIGeneratedNativeModule._BuilderNode_build1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    build2_serialize(builder: WrappedBuilder<CustomBuilderT<T>>, arg: T, options: BuildOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        WrappedBuilder_serializer.write(thisSerializer, builder)
        thisSerializer.writeCustomObject('T', (arg as Object))
        BuildOptions_serializer.write(thisSerializer, options)
        ArkUIGeneratedNativeModule._BuilderNode_build2(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    update_serialize(arg: T): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('T', (arg as Object))
        ArkUIGeneratedNativeModule._BuilderNode_update(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    getFrameNode_serialize(): FrameNode | undefined {
        const retval  = ArkUIGeneratedNativeModule._BuilderNode_getFrameNode(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : FrameNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : FrameNode | undefined = buffer
        return returnResult
    }
    postTouchEvent_serialize(event: TouchEvent): boolean {
        const retval  = ArkUIGeneratedNativeModule._BuilderNode_postTouchEvent(this.peer!.ptr, toPeerPtr(event))
        return retval
    }
    dispose_serialize(): void {
        ArkUIGeneratedNativeModule._BuilderNode_dispose(this.peer!.ptr)
    }
    reuse_serialize(param?: Object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (param !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const paramTmpValue  = param!
            thisSerializer.holdAndWriteObject(paramTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        ArkUIGeneratedNativeModule._BuilderNode_reuse(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    recycle_serialize(): void {
        ArkUIGeneratedNativeModule._BuilderNode_recycle(this.peer!.ptr)
    }
    updateConfiguration_serialize(): void {
        ArkUIGeneratedNativeModule._BuilderNode_updateConfiguration(this.peer!.ptr)
    }
    isDisposed_serialize(): boolean {
        const retval  = ArkUIGeneratedNativeModule._BuilderNode_isDisposed(this.peer!.ptr)
        return retval
    }
    postInputEvent_serialize(event: InputEventType): boolean {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (event instanceof TouchEvent) {
            thisSerializer.writeInt8((0).toChar())
            const eventForIdx0  = event as TouchEvent
            TouchEvent_serializer.write(thisSerializer, eventForIdx0)
        } else if (event instanceof MouseEvent) {
            thisSerializer.writeInt8((1).toChar())
            const eventForIdx1  = event as MouseEvent
            MouseEvent_serializer.write(thisSerializer, eventForIdx1)
        } else if (event instanceof AxisEvent) {
            thisSerializer.writeInt8((2).toChar())
            const eventForIdx2  = event as AxisEvent
            AxisEvent_serializer.write(thisSerializer, eventForIdx2)
        }
        const retval  = ArkUIGeneratedNativeModule._BuilderNode_postInputEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    inheritFreezeOptions_serialize(enabled: boolean): void {
        ArkUIGeneratedNativeModule._BuilderNode_inheritFreezeOptions(this.peer!.ptr, enabled ? 1 : 0)
    }
}
export enum NodeRenderType {
    RENDER_TYPE_DISPLAY = 0,
    RENDER_TYPE_TEXTURE = 1
}
export interface RenderOptions {
    selfIdealSize?: Size;
    type?: NodeRenderType;
    surfaceId?: string;
}
export interface BuildOptions {
    useParallel?: boolean;
}
export type InputEventType = TouchEvent | MouseEvent | AxisEvent;
export class BuildOptions_serializer {
    public static write(buffer: SerializerBase, value: BuildOptions): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForUseParallel  = value.useParallel
        if (valueHolderForUseParallel !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForUseParallelTmpValue  = valueHolderForUseParallel!
            valueSerializer.writeBoolean(valueHolderForUseParallelTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): BuildOptions {
        let valueDeserializer : DeserializerBase = buffer
        const useParallelTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let useParallelTmpBuf : boolean | undefined
        if ((useParallelTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            useParallelTmpBuf = valueDeserializer.readBoolean()
        }
        const useParallelTmpResult : boolean | undefined = useParallelTmpBuf
        let value : BuildOptions = ({useParallel: useParallelTmpResult} as BuildOptions)
        return value
    }
}
export class RenderOptions_serializer {
    public static write(buffer: SerializerBase, value: RenderOptions): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForSelfIdealSize  = value.selfIdealSize
        if (valueHolderForSelfIdealSize !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForSelfIdealSizeTmpValue  = valueHolderForSelfIdealSize!
            Size_serializer.write(valueSerializer, valueHolderForSelfIdealSizeTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForType  = value.type
        if (valueHolderForType !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForTypeTmpValue  = (valueHolderForType as NodeRenderType)
            valueSerializer.writeInt32(valueHolderForTypeTmpValue.valueOf())
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForSurfaceId  = value.surfaceId
        if (valueHolderForSurfaceId !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForSurfaceIdTmpValue  = valueHolderForSurfaceId!
            valueSerializer.writeString(valueHolderForSurfaceIdTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): RenderOptions {
        let valueDeserializer : DeserializerBase = buffer
        const selfIdealSizeTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let selfIdealSizeTmpBuf : Size | undefined
        if ((selfIdealSizeTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            selfIdealSizeTmpBuf = Size_serializer.read(valueDeserializer)
        }
        const selfIdealSizeTmpResult : Size | undefined = selfIdealSizeTmpBuf
        const typeTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let typeTmpBuf : NodeRenderType | undefined
        if ((typeTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            typeTmpBuf = NodeRenderType.fromValue(valueDeserializer.readInt32())
        }
        const typeTmpResult : NodeRenderType | undefined = typeTmpBuf
        const surfaceIdTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let surfaceIdTmpBuf : string | undefined
        if ((surfaceIdTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            surfaceIdTmpBuf = (valueDeserializer.readString() as string)
        }
        const surfaceIdTmpResult : string | undefined = surfaceIdTmpBuf
        let value : RenderOptions = ({selfIdealSize: selfIdealSizeTmpResult, type: typeTmpResult, surfaceId: surfaceIdTmpResult} as RenderOptions)
        return value
    }
}
