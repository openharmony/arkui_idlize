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
import { image_PositionArea_serializer, image_ImageInfo_serializer, image_Region_serializer, TypeChecker, OHOS_MULTIMEDIA_IMAGENativeModule } from "./ohos.multimedia.image.INTERNAL"
import { AsyncCallback, BusinessError } from "@ohos.base"
import { extractors } from "#handwritten"
import { default as colorSpaceManager } from "@ohos.graphics.colorSpaceManager"
import { default as rpc } from "@ohos.rpc"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default image
export namespace image {
    export interface PixelMap {
        readonly isEditable: boolean
        readonly isStrideAlignment: boolean
        readPixelsToBuffer(dst: ArrayBuffer): Promise<void>
        readPixelsToBuffer(dst: ArrayBuffer, callback_: AsyncCallback<void>): void
        readPixelsToBufferSync(dst: ArrayBuffer): void
        readPixels(area: PositionArea): Promise<void>
        readPixels(area: PositionArea, callback_: AsyncCallback<void>): void
        readPixelsSync(area: PositionArea): void
        writePixels(area: PositionArea): Promise<void>
        writePixels(area: PositionArea, callback_: AsyncCallback<void>): void
        writePixelsSync(area: PositionArea): void
        writeBufferToPixels(src: ArrayBuffer): Promise<void>
        writeBufferToPixels(src: ArrayBuffer, callback_: AsyncCallback<void>): void
        writeBufferToPixelsSync(src: ArrayBuffer): void
        toSdr(): Promise<void>
        getImageInfo(): Promise<ImageInfo>
        getImageInfo(callback_: AsyncCallback<ImageInfo>): void
        getImageInfoSync(): ImageInfo
        getBytesNumberPerRow(): int32
        getPixelBytesNumber(): int32
        getDensity(): int32
        opacity(rate: double, callback_: AsyncCallback<void>): void
        opacity(rate: double): Promise<void>
        opacitySync(rate: double): void
        createAlphaPixelmap(): Promise<PixelMap>
        createAlphaPixelmap(callback_: AsyncCallback<PixelMap>): void
        createAlphaPixelmapSync(): PixelMap
        scale(x: double, y: double, callback_: AsyncCallback<void>): void
        scale(x: double, y: double): Promise<void>
        scaleSync(x: double, y: double): void
        scale(x: double, y: double, level: AntiAliasingLevel): Promise<void>
        scaleSync(x: double, y: double, level: AntiAliasingLevel): void
        createScaledPixelMap(x: double, y: double, level: AntiAliasingLevel | undefined): Promise<PixelMap>
        createScaledPixelMapSync(x: double, y: double, level: AntiAliasingLevel | undefined): PixelMap
        translate(x: double, y: double, callback_: AsyncCallback<void>): void
        translate(x: double, y: double): Promise<void>
        translateSync(x: double, y: double): void
        rotate(angle: double, callback_: AsyncCallback<void>): void
        rotate(angle: double): Promise<void>
        rotateSync(angle: double): void
        flip(horizontal: boolean, vertical: boolean, callback_: AsyncCallback<void>): void
        flip(horizontal: boolean, vertical: boolean): Promise<void>
        flipSync(horizontal: boolean, vertical: boolean): void
        crop(region: Region, callback_: AsyncCallback<void>): void
        crop(region: Region): Promise<void>
        cropSync(region: Region): void
        getColorSpace(): colorSpaceManager.ColorSpaceManager
        marshalling(sequence_: rpc.MessageSequence): void
        unmarshalling(sequence_: rpc.MessageSequence): Promise<PixelMap>
        setColorSpace(colorSpace: colorSpaceManager.ColorSpaceManager): void
        applyColorSpace(targetColorSpace: colorSpaceManager.ColorSpaceManager, callback_: AsyncCallback<void>): void
        applyColorSpace(targetColorSpace: colorSpaceManager.ColorSpaceManager): Promise<void>
        convertPixelFormat(targetPixelFormat: PixelMapFormat): Promise<void>
        release(callback_: AsyncCallback<void>): void
        release(): Promise<void>
        setMemoryNameSync(name: string): void
    }
    export class PixelMapInternal implements MaterializedBase,PixelMap {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        readonly isEditable: boolean
        readonly isStrideAlignment: boolean
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, PixelMapInternal.getFinalizer())
            this.isEditable = this.getIsEditable()
            this.isStrideAlignment = this.getIsStrideAlignment()
        }
        constructor() {
            this(PixelMapInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): PixelMapInternal {
            return new PixelMapInternal(ptr)
        }
        public readPixelsToBuffer(dst: ArrayBuffer): Promise<void> {
            const dst_casted = dst as (ArrayBuffer)
            return this.readPixelsToBuffer0_serialize(dst_casted)
        }
        public readPixelsToBuffer(dst: ArrayBuffer, callback_: AsyncCallback<void>): void {
            const dst_casted = dst as (ArrayBuffer)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.readPixelsToBuffer1_serialize(dst_casted, callback__casted)
            return
        }
        public readPixelsToBufferSync(dst: ArrayBuffer): void {
            const dst_casted = dst as (ArrayBuffer)
            this.readPixelsToBufferSync_serialize(dst_casted)
            return
        }
        public readPixels(area: PositionArea): Promise<void> {
            const area_casted = area as (PositionArea)
            return this.readPixels0_serialize(area_casted)
        }
        public readPixels(area: PositionArea, callback_: AsyncCallback<void>): void {
            const area_casted = area as (PositionArea)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.readPixels1_serialize(area_casted, callback__casted)
            return
        }
        public readPixelsSync(area: PositionArea): void {
            const area_casted = area as (PositionArea)
            this.readPixelsSync_serialize(area_casted)
            return
        }
        public writePixels(area: PositionArea): Promise<void> {
            const area_casted = area as (PositionArea)
            return this.writePixels0_serialize(area_casted)
        }
        public writePixels(area: PositionArea, callback_: AsyncCallback<void>): void {
            const area_casted = area as (PositionArea)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.writePixels1_serialize(area_casted, callback__casted)
            return
        }
        public writePixelsSync(area: PositionArea): void {
            const area_casted = area as (PositionArea)
            this.writePixelsSync_serialize(area_casted)
            return
        }
        public writeBufferToPixels(src: ArrayBuffer): Promise<void> {
            const src_casted = src as (ArrayBuffer)
            return this.writeBufferToPixels0_serialize(src_casted)
        }
        public writeBufferToPixels(src: ArrayBuffer, callback_: AsyncCallback<void>): void {
            const src_casted = src as (ArrayBuffer)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.writeBufferToPixels1_serialize(src_casted, callback__casted)
            return
        }
        public writeBufferToPixelsSync(src: ArrayBuffer): void {
            const src_casted = src as (ArrayBuffer)
            this.writeBufferToPixelsSync_serialize(src_casted)
            return
        }
        public toSdr(): Promise<void> {
            return this.toSdr_serialize()
        }
        public getImageInfo(): Promise<ImageInfo> {
            return this.getImageInfo0_serialize()
        }
        public getImageInfo(callback_: AsyncCallback<ImageInfo>): void {
            const callback__casted = callback_ as (AsyncCallback<ImageInfo>)
            this.getImageInfo1_serialize(callback__casted)
            return
        }
        public getImageInfoSync(): ImageInfo {
            return this.getImageInfoSync_serialize()
        }
        public getBytesNumberPerRow(): int32 {
            return this.getBytesNumberPerRow_serialize()
        }
        public getPixelBytesNumber(): int32 {
            return this.getPixelBytesNumber_serialize()
        }
        public getDensity(): int32 {
            return this.getDensity_serialize()
        }
        public opacity(rate: double, callback_: AsyncCallback<void>): void {
            const rate_casted = rate as (double)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.opacity0_serialize(rate_casted, callback__casted)
            return
        }
        public opacity(rate: double): Promise<void> {
            const rate_casted = rate as (double)
            return this.opacity1_serialize(rate_casted)
        }
        public opacitySync(rate: double): void {
            const rate_casted = rate as (double)
            this.opacitySync_serialize(rate_casted)
            return
        }
        public createAlphaPixelmap(): Promise<PixelMap> {
            return this.createAlphaPixelmap0_serialize()
        }
        public createAlphaPixelmap(callback_: AsyncCallback<PixelMap>): void {
            const callback__casted = callback_ as (AsyncCallback<PixelMap>)
            this.createAlphaPixelmap1_serialize(callback__casted)
            return
        }
        public createAlphaPixelmapSync(): PixelMap {
            return this.createAlphaPixelmapSync_serialize()
        }
        public scale(x: double, y: double, callback_: AsyncCallback<void>): void {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.scale0_serialize(x_casted, y_casted, callback__casted)
            return
        }
        public scale(x: double, y: double): Promise<void> {
            const x_casted = x as (double)
            const y_casted = y as (double)
            return this.scale1_serialize(x_casted, y_casted)
        }
        public scaleSync(x: double, y: double): void {
            const x_casted = x as (double)
            const y_casted = y as (double)
            this.scaleSync0_serialize(x_casted, y_casted)
            return
        }
        public scale(x: double, y: double, level: AntiAliasingLevel): Promise<void> {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const level_casted = level as (AntiAliasingLevel)
            return this.scale2_serialize(x_casted, y_casted, level_casted)
        }
        public scaleSync(x: double, y: double, level: AntiAliasingLevel): void {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const level_casted = level as (AntiAliasingLevel)
            this.scaleSync1_serialize(x_casted, y_casted, level_casted)
            return
        }
        public createScaledPixelMap(x: double, y: double, level?: AntiAliasingLevel): Promise<PixelMap> {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const level_casted = level as (AntiAliasingLevel | undefined)
            return this.createScaledPixelMap_serialize(x_casted, y_casted, level_casted)
        }
        public createScaledPixelMapSync(x: double, y: double, level?: AntiAliasingLevel): PixelMap {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const level_casted = level as (AntiAliasingLevel | undefined)
            return this.createScaledPixelMapSync_serialize(x_casted, y_casted, level_casted)
        }
        public translate(x: double, y: double, callback_: AsyncCallback<void>): void {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.translate0_serialize(x_casted, y_casted, callback__casted)
            return
        }
        public translate(x: double, y: double): Promise<void> {
            const x_casted = x as (double)
            const y_casted = y as (double)
            return this.translate1_serialize(x_casted, y_casted)
        }
        public translateSync(x: double, y: double): void {
            const x_casted = x as (double)
            const y_casted = y as (double)
            this.translateSync_serialize(x_casted, y_casted)
            return
        }
        public rotate(angle: double, callback_: AsyncCallback<void>): void {
            const angle_casted = angle as (double)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.rotate0_serialize(angle_casted, callback__casted)
            return
        }
        public rotate(angle: double): Promise<void> {
            const angle_casted = angle as (double)
            return this.rotate1_serialize(angle_casted)
        }
        public rotateSync(angle: double): void {
            const angle_casted = angle as (double)
            this.rotateSync_serialize(angle_casted)
            return
        }
        public flip(horizontal: boolean, vertical: boolean, callback_: AsyncCallback<void>): void {
            const horizontal_casted = horizontal as (boolean)
            const vertical_casted = vertical as (boolean)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.flip0_serialize(horizontal_casted, vertical_casted, callback__casted)
            return
        }
        public flip(horizontal: boolean, vertical: boolean): Promise<void> {
            const horizontal_casted = horizontal as (boolean)
            const vertical_casted = vertical as (boolean)
            return this.flip1_serialize(horizontal_casted, vertical_casted)
        }
        public flipSync(horizontal: boolean, vertical: boolean): void {
            const horizontal_casted = horizontal as (boolean)
            const vertical_casted = vertical as (boolean)
            this.flipSync_serialize(horizontal_casted, vertical_casted)
            return
        }
        public crop(region: Region, callback_: AsyncCallback<void>): void {
            const region_casted = region as (Region)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.crop0_serialize(region_casted, callback__casted)
            return
        }
        public crop(region: Region): Promise<void> {
            const region_casted = region as (Region)
            return this.crop1_serialize(region_casted)
        }
        public cropSync(region: Region): void {
            const region_casted = region as (Region)
            this.cropSync_serialize(region_casted)
            return
        }
        public getColorSpace(): colorSpaceManager.ColorSpaceManager {
            return this.getColorSpace_serialize()
        }
        public marshalling(sequence_: rpc.MessageSequence): void {
            const sequence__casted = sequence_ as (rpc.MessageSequence)
            this.marshalling_serialize(sequence__casted)
            return
        }
        public unmarshalling(sequence_: rpc.MessageSequence): Promise<PixelMap> {
            const sequence__casted = sequence_ as (rpc.MessageSequence)
            return this.unmarshalling_serialize(sequence__casted)
        }
        public setColorSpace(colorSpace: colorSpaceManager.ColorSpaceManager): void {
            const colorSpace_casted = colorSpace as (colorSpaceManager.ColorSpaceManager)
            this.setColorSpace_serialize(colorSpace_casted)
            return
        }
        public applyColorSpace(targetColorSpace: colorSpaceManager.ColorSpaceManager, callback_: AsyncCallback<void>): void {
            const targetColorSpace_casted = targetColorSpace as (colorSpaceManager.ColorSpaceManager)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.applyColorSpace0_serialize(targetColorSpace_casted, callback__casted)
            return
        }
        public applyColorSpace(targetColorSpace: colorSpaceManager.ColorSpaceManager): Promise<void> {
            const targetColorSpace_casted = targetColorSpace as (colorSpaceManager.ColorSpaceManager)
            return this.applyColorSpace1_serialize(targetColorSpace_casted)
        }
        public convertPixelFormat(targetPixelFormat: PixelMapFormat): Promise<void> {
            const targetPixelFormat_casted = targetPixelFormat as (PixelMapFormat)
            return this.convertPixelFormat_serialize(targetPixelFormat_casted)
        }
        public release(callback_: AsyncCallback<void>): void {
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.release0_serialize(callback__casted)
            return
        }
        public release(): Promise<void> {
            return this.release1_serialize()
        }
        public setMemoryNameSync(name: string): void {
            const name_casted = name as (string)
            this.setMemoryNameSync_serialize(name_casted)
            return
        }
        private getIsEditable(): boolean {
            return this.getIsEditable_serialize()
        }
        private getIsStrideAlignment(): boolean {
            return this.getIsStrideAlignment_serialize()
        }
        readPixelsToBuffer0_serialize(dst: ArrayBuffer): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(dst)
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_readPixelsToBuffer0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        readPixelsToBuffer1_serialize(dst: ArrayBuffer, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(dst)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_readPixelsToBuffer1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readPixelsToBufferSync_serialize(dst: ArrayBuffer): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(dst)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_readPixelsToBufferSync(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readPixels0_serialize(area: PositionArea): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_PositionArea_serializer.write(thisSerializer, area)
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_readPixels0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        readPixels1_serialize(area: PositionArea, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_PositionArea_serializer.write(thisSerializer, area)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_readPixels1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readPixelsSync_serialize(area: PositionArea): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_PositionArea_serializer.write(thisSerializer, area)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_readPixelsSync(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writePixels0_serialize(area: PositionArea): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_PositionArea_serializer.write(thisSerializer, area)
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_writePixels0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        writePixels1_serialize(area: PositionArea, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_PositionArea_serializer.write(thisSerializer, area)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_writePixels1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writePixelsSync_serialize(area: PositionArea): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_PositionArea_serializer.write(thisSerializer, area)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_writePixelsSync(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeBufferToPixels0_serialize(src: ArrayBuffer): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(src)
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_writeBufferToPixels0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        writeBufferToPixels1_serialize(src: ArrayBuffer, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(src)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_writeBufferToPixels1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeBufferToPixelsSync_serialize(src: ArrayBuffer): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(src)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_writeBufferToPixelsSync(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        toSdr_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_toSdr(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getImageInfo0_serialize(): Promise<ImageInfo> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<ImageInfo>()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getImageInfo0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getImageInfo1_serialize(callback_: AsyncCallback<ImageInfo>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getImageInfo1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getImageInfoSync_serialize(): ImageInfo {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getImageInfoSync(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : ImageInfo = image_ImageInfo_serializer.read(retvalDeserializer)
            return returnResult
        }
        getBytesNumberPerRow_serialize(): int32 {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getBytesNumberPerRow(this.peer!.ptr)
            return retval
        }
        getPixelBytesNumber_serialize(): int32 {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getPixelBytesNumber(this.peer!.ptr)
            return retval
        }
        getDensity_serialize(): int32 {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getDensity(this.peer!.ptr)
            return retval
        }
        opacity0_serialize(rate: double, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_opacity0(this.peer!.ptr, rate, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        opacity1_serialize(rate: double): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_opacity1(this.peer!.ptr, rate, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        opacitySync_serialize(rate: double): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_opacitySync(this.peer!.ptr, rate)
        }
        createAlphaPixelmap0_serialize(): Promise<PixelMap> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<PixelMap>()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_createAlphaPixelmap0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        createAlphaPixelmap1_serialize(callback_: AsyncCallback<PixelMap>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_createAlphaPixelmap1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        createAlphaPixelmapSync_serialize(): PixelMap {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_createAlphaPixelmapSync(this.peer!.ptr)
            const obj : PixelMap = extractors.fromImagePixelMapPtr(retval)
            return obj
        }
        scale0_serialize(x: double, y: double, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_scale0(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        scale1_serialize(x: double, y: double): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_scale1(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        scaleSync0_serialize(x: double, y: double): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_scaleSync0(this.peer!.ptr, x, y)
        }
        scale2_serialize(x: double, y: double, level: AntiAliasingLevel): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_scale2(this.peer!.ptr, x, y, TypeChecker.image_AntiAliasingLevel_ToNumeric(level), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        scaleSync1_serialize(x: double, y: double, level: AntiAliasingLevel): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_scaleSync1(this.peer!.ptr, x, y, TypeChecker.image_AntiAliasingLevel_ToNumeric(level))
        }
        createScaledPixelMap_serialize(x: double, y: double, level?: AntiAliasingLevel): Promise<PixelMap> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (level !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const levelTmpValue  = (level as image.AntiAliasingLevel)
                thisSerializer.writeInt32(TypeChecker.image_AntiAliasingLevel_ToNumeric(levelTmpValue))
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<PixelMap>()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_createScaledPixelMap(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        createScaledPixelMapSync_serialize(x: double, y: double, level?: AntiAliasingLevel): PixelMap {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (level !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const levelTmpValue  = (level as image.AntiAliasingLevel)
                thisSerializer.writeInt32(TypeChecker.image_AntiAliasingLevel_ToNumeric(levelTmpValue))
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_createScaledPixelMapSync(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : PixelMap = extractors.fromImagePixelMapPtr(retval)
            return obj
        }
        translate0_serialize(x: double, y: double, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_translate0(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        translate1_serialize(x: double, y: double): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_translate1(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        translateSync_serialize(x: double, y: double): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_translateSync(this.peer!.ptr, x, y)
        }
        rotate0_serialize(angle: double, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_rotate0(this.peer!.ptr, angle, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        rotate1_serialize(angle: double): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_rotate1(this.peer!.ptr, angle, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        rotateSync_serialize(angle: double): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_rotateSync(this.peer!.ptr, angle)
        }
        flip0_serialize(horizontal: boolean, vertical: boolean, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_flip0(this.peer!.ptr, horizontal ? 1 : 0, vertical ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        flip1_serialize(horizontal: boolean, vertical: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_flip1(this.peer!.ptr, horizontal ? 1 : 0, vertical ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        flipSync_serialize(horizontal: boolean, vertical: boolean): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_flipSync(this.peer!.ptr, horizontal ? 1 : 0, vertical ? 1 : 0)
        }
        crop0_serialize(region: Region, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_Region_serializer.write(thisSerializer, region)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_crop0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        crop1_serialize(region: Region): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_Region_serializer.write(thisSerializer, region)
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_crop1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        cropSync_serialize(region: Region): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            image_Region_serializer.write(thisSerializer, region)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_cropSync(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getColorSpace_serialize(): colorSpaceManager.ColorSpaceManager {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getColorSpace(this.peer!.ptr)
            const obj : colorSpaceManager.ColorSpaceManager = extractors.fromColorSpaceManagerColorSpaceManagerPtr(retval)
            return obj
        }
        marshalling_serialize(sequence_: rpc.MessageSequence): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_marshalling(this.peer!.ptr, extractors.toRpcMessageSequencePtr(sequence_))
        }
        unmarshalling_serialize(sequence_: rpc.MessageSequence): Promise<PixelMap> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<PixelMap>()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_unmarshalling(this.peer!.ptr, extractors.toRpcMessageSequencePtr(sequence_), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setColorSpace_serialize(colorSpace: colorSpaceManager.ColorSpaceManager): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_setColorSpace(this.peer!.ptr, extractors.toColorSpaceManagerColorSpaceManagerPtr(colorSpace))
        }
        applyColorSpace0_serialize(targetColorSpace: colorSpaceManager.ColorSpaceManager, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_applyColorSpace0(this.peer!.ptr, extractors.toColorSpaceManagerColorSpaceManagerPtr(targetColorSpace), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        applyColorSpace1_serialize(targetColorSpace: colorSpaceManager.ColorSpaceManager): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_applyColorSpace1(this.peer!.ptr, extractors.toColorSpaceManagerColorSpaceManagerPtr(targetColorSpace), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        convertPixelFormat_serialize(targetPixelFormat: PixelMapFormat): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_convertPixelFormat(this.peer!.ptr, TypeChecker.image_PixelMapFormat_ToNumeric(targetPixelFormat), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        release0_serialize(callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_release0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        release1_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_release1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setMemoryNameSync_serialize(name: string): void {
            OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_setMemoryNameSync(this.peer!.ptr, name)
        }
        private getIsEditable_serialize(): boolean {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getIsEditable(this.peer!.ptr)
            return retval
        }
        private getIsStrideAlignment_serialize(): boolean {
            const retval  = OHOS_MULTIMEDIA_IMAGENativeModule._image_PixelMap_getIsStrideAlignment(this.peer!.ptr)
            return retval
        }
    }
    export enum PixelMapFormat {
        UNKNOWN = 0,
        ARGB_8888 = 1,
        RGB_565 = 2,
        RGBA_8888 = 3,
        BGRA_8888 = 4,
        RGB_888 = 5,
        ALPHA_8 = 6,
        RGBA_F16 = 7,
        NV21 = 8,
        NV12 = 9,
        RGBA_1010102 = 10,
        YCBCR_P010 = 11,
        YCRCB_P010 = 12,
        ASTC_4X_4 = 102,
        ASTC_4x4 = 102
    }
    export enum ResolutionQuality {
        LOW = 1,
        MEDIUM = 2,
        HIGH = 3
    }
    export interface Size {
        height: int32;
        width: int32;
    }
    export enum AlphaType {
        UNKNOWN = 0,
        OPAQUE = 1,
        PREMUL = 2,
        UNPREMUL = 3
    }
    export enum AntiAliasingLevel {
        NONE = 0,
        LOW = 1,
        MEDIUM = 2,
        HIGH = 3
    }
    export interface Region {
        size: image.Size;
        x: int32;
        y: int32;
    }
    export interface PositionArea {
        pixels: ArrayBuffer;
        offset: int32;
        stride: int32;
        region: image.Region;
    }
    export interface ImageInfo {
        size: image.Size;
        density: int32;
        stride: int32;
        pixelFormat: image.PixelMapFormat;
        alphaType: image.AlphaType;
        mimeType: string;
        isHdr: boolean;
    }
}
