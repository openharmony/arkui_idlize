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

import { image_PixelMap_serializer, TypeChecker, OHOS_ARKUI_DRAWABLEDESCRIPTORNativeModule } from "./ohos.arkui.drawableDescriptor.INTERNAL"
import { extractors } from "#handwritten"
import { default as image } from "@ohos.multimedia.image"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export class DrawableDescriptorInternal {
    public static fromPtr(ptr: KPointer): DrawableDescriptor {
        return new DrawableDescriptor(ptr)
    }
}
export class DrawableDescriptor implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, DrawableDescriptor.getFinalizer())
    }
    constructor() {
        this(DrawableDescriptor.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_DRAWABLEDESCRIPTORNativeModule._DrawableDescriptor_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_DRAWABLEDESCRIPTORNativeModule._DrawableDescriptor_getFinalizer()
    }
    public getPixelMap(): image.PixelMap | undefined {
        return this.getPixelMap_serialize()
    }
    getPixelMap_serialize(): image.PixelMap | undefined {
        const retval  = OHOS_ARKUI_DRAWABLEDESCRIPTORNativeModule._DrawableDescriptor_getPixelMap(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : image.PixelMap | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (image_PixelMap_serializer.read(retvalDeserializer) as image.PixelMap)
        }
        const returnResult : image.PixelMap | undefined = buffer
        return returnResult
    }
}
