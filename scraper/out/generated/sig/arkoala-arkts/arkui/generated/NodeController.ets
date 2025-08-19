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

import { FrameNode_serializer, FrameNode, FrameNodeInternal } from "./FrameNode"
import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { Size_serializer, Size } from "./Graphics"
import { extractors } from "#handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { TouchEvent, TouchEventInternal } from "./component/common"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
export class NodeControllerInternal {
    public static fromPtr(ptr: KPointer): NodeController {
        return new NodeController(ptr)
    }
}
export class NodeController implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, NodeController.getFinalizer())
    }
    constructor() {
        this(NodeController.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._NodeController_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._NodeController_getFinalizer()
    }
    public makeNode(uiContext: UIContext): FrameNode | undefined {
        const uiContext_casted = uiContext as (UIContext)
        return this.makeNode_serialize(uiContext_casted)
    }
    public aboutToResize(size: Size): void {
        const size_casted = size as (Size)
        this.aboutToResize_serialize(size_casted)
        return
    }
    public aboutToAppear(): void {
        this.aboutToAppear_serialize()
        return
    }
    public aboutToDisappear(): void {
        this.aboutToDisappear_serialize()
        return
    }
    public rebuild(): void {
        this.rebuild_serialize()
        return
    }
    public onTouchEvent(event: TouchEvent): void {
        const event_casted = event as (TouchEvent)
        this.onTouchEvent_serialize(event_casted)
        return
    }
    public onAttach(): void {
        this.onAttach_serialize()
        return
    }
    public onDetach(): void {
        this.onDetach_serialize()
        return
    }
    public onWillBind(containerId: number): void {
        const containerId_casted = containerId as (number)
        this.onWillBind_serialize(containerId_casted)
        return
    }
    public onWillUnbind(containerId: number): void {
        const containerId_casted = containerId as (number)
        this.onWillUnbind_serialize(containerId_casted)
        return
    }
    public onBind(containerId: number): void {
        const containerId_casted = containerId as (number)
        this.onBind_serialize(containerId_casted)
        return
    }
    public onUnbind(containerId: number): void {
        const containerId_casted = containerId as (number)
        this.onUnbind_serialize(containerId_casted)
        return
    }
    makeNode_serialize(uiContext: UIContext): FrameNode | undefined {
        const retval  = ArkUIGeneratedNativeModule._NodeController_makeNode(this.peer!.ptr, extractors.toUIContextPtr(uiContext))
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : FrameNode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (FrameNode_serializer.read(retvalDeserializer) as FrameNode)
        }
        const returnResult : FrameNode | undefined = buffer
        return returnResult
    }
    aboutToResize_serialize(size: Size): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Size_serializer.write(thisSerializer, size)
        ArkUIGeneratedNativeModule._NodeController_aboutToResize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    aboutToAppear_serialize(): void {
        ArkUIGeneratedNativeModule._NodeController_aboutToAppear(this.peer!.ptr)
    }
    aboutToDisappear_serialize(): void {
        ArkUIGeneratedNativeModule._NodeController_aboutToDisappear(this.peer!.ptr)
    }
    rebuild_serialize(): void {
        ArkUIGeneratedNativeModule._NodeController_rebuild(this.peer!.ptr)
    }
    onTouchEvent_serialize(event: TouchEvent): void {
        ArkUIGeneratedNativeModule._NodeController_onTouchEvent(this.peer!.ptr, toPeerPtr(event))
    }
    onAttach_serialize(): void {
        ArkUIGeneratedNativeModule._NodeController_onAttach(this.peer!.ptr)
    }
    onDetach_serialize(): void {
        ArkUIGeneratedNativeModule._NodeController_onDetach(this.peer!.ptr)
    }
    onWillBind_serialize(containerId: number): void {
        ArkUIGeneratedNativeModule._NodeController_onWillBind(this.peer!.ptr, containerId)
    }
    onWillUnbind_serialize(containerId: number): void {
        ArkUIGeneratedNativeModule._NodeController_onWillUnbind(this.peer!.ptr, containerId)
    }
    onBind_serialize(containerId: number): void {
        ArkUIGeneratedNativeModule._NodeController_onBind(this.peer!.ptr, containerId)
    }
    onUnbind_serialize(containerId: number): void {
        ArkUIGeneratedNativeModule._NodeController_onUnbind(this.peer!.ptr, containerId)
    }
}
export class NodeController_serializer {
    public static write(buffer: SerializerBase, value: NodeController): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): NodeController {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return NodeControllerInternal.fromPtr(ptr)
    }
}
