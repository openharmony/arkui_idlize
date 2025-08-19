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
import { WrappedBuilder_serializer, WrappedBuilder, CustomBuilder, CustomBuilderT } from "./component/builder"
import { BuildOptions_serializer, BuildOptions } from "./BuilderNode"
import { extractors } from "#handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { CustomNodeBuilder } from "./component/idlize"
export class ComponentContentBase_serializer {
    public static write(buffer: SerializerBase, value: ComponentContentBase): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): ComponentContentBase {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return ComponentContentBaseInternal.fromPtr(ptr)
    }
}
export class ComponentContentBaseInternal {
    public static fromPtr(ptr: KPointer): ComponentContentBase {
        return new ComponentContentBase(ptr)
    }
}
export class ComponentContentBase extends Content implements MaterializedBase {
    constructor(peerPtr: KPointer) {
        super(peerPtr)
    }
    constructor() {
        this(ComponentContentBase.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._ComponentContentBase_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._ComponentContentBase_getFinalizer()
    }
}
export class ComponentContentInternal {
    public static fromPtr<T>(ptr: KPointer): ComponentContent<T> {
        return new ComponentContent<T>(false, false, false, false, ptr)
    }
}
export class ComponentContent<T> extends ComponentContentBase implements MaterializedBase {
    constructor(_0: boolean, _1: boolean, _2: boolean, _3: boolean, peerPtr: KPointer) {
        super(peerPtr)
    }
    constructor(uiContext: UIContext, builder: WrappedBuilder<CustomBuilder>) {
        this(false, false, false, false, ComponentContent.construct0(uiContext, builder))
    }
    constructor(uiContext: UIContext, builder: WrappedBuilder<CustomBuilderT<T>>, args: T) {
        this(false, false, false, false, ComponentContent.construct1(uiContext, builder, args))
    }
    constructor(uiContext: UIContext, builder: WrappedBuilder<CustomBuilderT<T>>, args: T, options: BuildOptions) {
        this(false, false, false, false, ComponentContent.construct2(uiContext, builder, args, options))
    }
    static construct0(uiContext: UIContext, builder: WrappedBuilder<CustomBuilder>): KPointer {
        const retval  = ArkUIGeneratedNativeModule._ComponentContent_construct0(extractors.toUIContextPtr(uiContext), toPeerPtr(builder))
        return retval
    }
    static construct1(uiContext: UIContext, builder: WrappedBuilder<CustomBuilderT<T>>, args: T): KPointer {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        WrappedBuilder_serializer.write(thisSerializer, builder)
        thisSerializer.writeCustomObject('T', (args as Object))
        const retval  = ArkUIGeneratedNativeModule._ComponentContent_construct1(extractors.toUIContextPtr(uiContext), thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    static construct2(uiContext: UIContext, builder: WrappedBuilder<CustomBuilderT<T>>, args: T, options: BuildOptions): KPointer {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        WrappedBuilder_serializer.write(thisSerializer, builder)
        thisSerializer.writeCustomObject('T', (args as Object))
        BuildOptions_serializer.write(thisSerializer, options)
        const retval  = ArkUIGeneratedNativeModule._ComponentContent_construct2(extractors.toUIContextPtr(uiContext), thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._ComponentContent_getFinalizer()
    }
    public update(args: T): void {
        const args_casted = args as (T)
        this.update_serialize(args_casted)
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
    public dispose(): void {
        this.dispose_serialize()
        return
    }
    public updateConfiguration(): void {
        this.updateConfiguration_serialize()
        return
    }
    update_serialize(args: T): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('T', (args as Object))
        ArkUIGeneratedNativeModule._ComponentContent_update(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
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
        ArkUIGeneratedNativeModule._ComponentContent_reuse(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    recycle_serialize(): void {
        ArkUIGeneratedNativeModule._ComponentContent_recycle(this.peer!.ptr)
    }
    dispose_serialize(): void {
        ArkUIGeneratedNativeModule._ComponentContent_dispose(this.peer!.ptr)
    }
    updateConfiguration_serialize(): void {
        ArkUIGeneratedNativeModule._ComponentContent_updateConfiguration(this.peer!.ptr)
    }
}
