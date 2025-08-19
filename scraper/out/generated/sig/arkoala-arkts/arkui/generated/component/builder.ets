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
import { CustomNodeBuilder } from "./idlize"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./../CallbackTransformer"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
export class WrappedBuilder_Arkui_Component_Builder_CustomBuilderInternal {
    public static fromPtr(ptr: KPointer): WrappedBuilder<CustomBuilder> {
        return new WrappedBuilder<CustomBuilder>(false, ptr)
    }
}
export class WrappedBuilder_Arkui_Component_Builder_CustomBuilder implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get builder(): CustomBuilder {
        return this.getBuilder()
    }
    set builder(builder: CustomBuilder) {
        this.setBuilder(builder)
    }
    constructor(_0: boolean, peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, WrappedBuilder_Arkui_Component_Builder_CustomBuilder.getFinalizer())
    }
    constructor(builder: CustomBuilder) {
        this(false, WrappedBuilder_Arkui_Component_Builder_CustomBuilder.construct(builder))
    }
    static construct(builder: CustomBuilder): KPointer {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(CallbackTransformer.transformFromCustomBuilder(builder))
        const retval  = ArkUIGeneratedNativeModule._WrappedBuilder_Arkui_Component_Builder_CustomBuilder_construct(thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._WrappedBuilder_Arkui_Component_Builder_CustomBuilder_getFinalizer()
    }
    private getBuilder(): CustomBuilder {
        return this.getBuilder_serialize()
    }
    private setBuilder(builder: CustomBuilder): void {
        const builder_casted = builder as (CustomBuilder)
        this.setBuilder_serialize(builder_casted)
        return
    }
    private getBuilder_serialize(): CustomBuilder {
        const retval  = ArkUIGeneratedNativeModule._WrappedBuilder_Arkui_Component_Builder_CustomBuilder_getBuilder(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    private setBuilder_serialize(builder: CustomBuilder): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(CallbackTransformer.transformFromCustomBuilder(builder))
        ArkUIGeneratedNativeModule._WrappedBuilder_Arkui_Component_Builder_CustomBuilder_setBuilder(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export type CustomBuilder = @Builder () => void;
export type CustomBuilderT<T = void> = @Builder (t: T) => void;
export type PageMapBuilder = @Builder (name: string, param: Object | undefined) => void;
export interface WrappedBuilder<T = void> {
    builder: T;
}
export class WrappedBuilder_Arkui_Component_Builder_CustomBuilder_serializer {
    public static write(buffer: SerializerBase, value: WrappedBuilder<CustomBuilder>): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): WrappedBuilder<CustomBuilder> {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return WrappedBuilder_Arkui_Component_Builder_CustomBuilderInternal.fromPtr(ptr)
    }
}
