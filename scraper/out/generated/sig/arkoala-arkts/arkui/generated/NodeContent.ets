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

import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr, Finalizable } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { CallbackTransformer } from "./CallbackTransformer"
import { Content, ContentInternal } from "./Content"
import { FrameNode, FrameNodeInternal } from "./FrameNode"
export class NodeContent_serializer {
    public static write(buffer: SerializerBase, value: NodeContent): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): NodeContent {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return NodeContentInternal.fromPtr(ptr)
    }
}
export class NodeContentInternal {
    public static fromPtr(ptr: KPointer): NodeContent {
        return new NodeContent(ptr)
    }
}
export class NodeContent extends Content implements MaterializedBase {
    constructor(peerPtr: KPointer) {
        super(peerPtr)
    }
    constructor() {
        this(NodeContent.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._NodeContent_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._NodeContent_getFinalizer()
    }
    public addFrameNode(node: FrameNode): void {
        const node_casted = node as (FrameNode)
        this.addFrameNode_serialize(node_casted)
        return
    }
    public removeFrameNode(node: FrameNode): void {
        const node_casted = node as (FrameNode)
        this.removeFrameNode_serialize(node_casted)
        return
    }
    addFrameNode_serialize(node: FrameNode): void {
        ArkUIGeneratedNativeModule._NodeContent_addFrameNode(this.peer!.ptr, toPeerPtr(node))
    }
    removeFrameNode_serialize(node: FrameNode): void {
        ArkUIGeneratedNativeModule._NodeContent_removeFrameNode(this.peer!.ptr, toPeerPtr(node))
    }
}
