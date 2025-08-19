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

import { TypeChecker, OHOS_WEB_WEBVIEWNativeModule, webview_HistoryItem_serializer, webview_RectEvent_serializer, webview_WebHeader_serializer, webview_WebHttpBodyStream_serializer, webview_WebCustomScheme_serializer, webview_RequestInfo_serializer, webview_BackForwardCacheSupportedFeatures_serializer, webview_WebMessagePort_serializer, webview_PdfConfiguration_serializer, webview_SnapshotInfo_serializer, webview_CacheOptions_serializer, webview_OfflineResourceMap_serializer, webview_BackForwardCacheOptions_serializer, webview_ScrollOffset_serializer, webview_HitTestValue_serializer } from "./ohos.web.webview.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { extractors } from "#handwritten"
import { WebNetErrorList } from "@ohos.web.netErrorList"
import { AsyncCallback, BusinessError } from "@ohos.base"
import { default as image } from "@ohos.multimedia.image"
import { default as cert } from "@ohos.security.cert"
import { default as print } from "@ohos.print"
export default webview
export namespace webview {
    export class BackForwardCacheOptionsInternal {
        public static fromPtr(ptr: KPointer): webview.BackForwardCacheOptions {
            return new webview.BackForwardCacheOptions(ptr)
        }
    }
    export class BackForwardCacheOptions implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get size(): number {
            return this.getSize()
        }
        set size(size: number) {
            this.setSize(size)
        }
        get timeToLive(): number {
            return this.getTimeToLive()
        }
        set timeToLive(timeToLive: number) {
            this.setTimeToLive(timeToLive)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, BackForwardCacheOptions.getFinalizer())
        }
        constructor() {
            this(BackForwardCacheOptions.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheOptions_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheOptions_getFinalizer()
        }
        private getSize(): number {
            return this.getSize_serialize()
        }
        private setSize(size: number): void {
            const size_casted = size as (number)
            this.setSize_serialize(size_casted)
            return
        }
        private getTimeToLive(): number {
            return this.getTimeToLive_serialize()
        }
        private setTimeToLive(timeToLive: number): void {
            const timeToLive_casted = timeToLive as (number)
            this.setTimeToLive_serialize(timeToLive_casted)
            return
        }
        private getSize_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheOptions_getSize(this.peer!.ptr)
            return retval
        }
        private setSize_serialize(size: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheOptions_setSize(this.peer!.ptr, size)
        }
        private getTimeToLive_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheOptions_getTimeToLive(this.peer!.ptr)
            return retval
        }
        private setTimeToLive_serialize(timeToLive: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheOptions_setTimeToLive(this.peer!.ptr, timeToLive)
        }
    }
    export class BackForwardCacheSupportedFeaturesInternal {
        public static fromPtr(ptr: KPointer): webview.BackForwardCacheSupportedFeatures {
            return new webview.BackForwardCacheSupportedFeatures(ptr)
        }
    }
    export class BackForwardCacheSupportedFeatures implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get nativeEmbed(): boolean {
            return this.getNativeEmbed()
        }
        set nativeEmbed(nativeEmbed: boolean) {
            this.setNativeEmbed(nativeEmbed)
        }
        get mediaTakeOver(): boolean {
            return this.getMediaTakeOver()
        }
        set mediaTakeOver(mediaTakeOver: boolean) {
            this.setMediaTakeOver(mediaTakeOver)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, BackForwardCacheSupportedFeatures.getFinalizer())
        }
        constructor() {
            this(BackForwardCacheSupportedFeatures.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheSupportedFeatures_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheSupportedFeatures_getFinalizer()
        }
        private getNativeEmbed(): boolean {
            return this.getNativeEmbed_serialize()
        }
        private setNativeEmbed(nativeEmbed: boolean): void {
            const nativeEmbed_casted = nativeEmbed as (boolean)
            this.setNativeEmbed_serialize(nativeEmbed_casted)
            return
        }
        private getMediaTakeOver(): boolean {
            return this.getMediaTakeOver_serialize()
        }
        private setMediaTakeOver(mediaTakeOver: boolean): void {
            const mediaTakeOver_casted = mediaTakeOver as (boolean)
            this.setMediaTakeOver_serialize(mediaTakeOver_casted)
            return
        }
        private getNativeEmbed_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheSupportedFeatures_getNativeEmbed(this.peer!.ptr)
            return retval
        }
        private setNativeEmbed_serialize(nativeEmbed: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheSupportedFeatures_setNativeEmbed(this.peer!.ptr, nativeEmbed ? 1 : 0)
        }
        private getMediaTakeOver_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheSupportedFeatures_getMediaTakeOver(this.peer!.ptr)
            return retval
        }
        private setMediaTakeOver_serialize(mediaTakeOver: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardCacheSupportedFeatures_setMediaTakeOver(this.peer!.ptr, mediaTakeOver ? 1 : 0)
        }
    }
    export interface BackForwardList {
        currentIndex: int32
        size: int32
        getItemAtIndex(index: int32): HistoryItem
    }
    export class BackForwardListInternal implements MaterializedBase,BackForwardList {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get currentIndex(): int32 {
            return this.getCurrentIndex()
        }
        set currentIndex(currentIndex: int32) {
            this.setCurrentIndex(currentIndex)
        }
        get size(): int32 {
            return this.getSize()
        }
        set size(size: int32) {
            this.setSize(size)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, BackForwardListInternal.getFinalizer())
        }
        constructor() {
            this(BackForwardListInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardList_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardList_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): BackForwardListInternal {
            return new BackForwardListInternal(ptr)
        }
        public getItemAtIndex(index: int32): HistoryItem {
            const index_casted = index as (int32)
            return this.getItemAtIndex_serialize(index_casted)
        }
        private getCurrentIndex(): int32 {
            return this.getCurrentIndex_serialize()
        }
        private setCurrentIndex(currentIndex: int32): void {
            const currentIndex_casted = currentIndex as (int32)
            this.setCurrentIndex_serialize(currentIndex_casted)
            return
        }
        private getSize(): int32 {
            return this.getSize_serialize()
        }
        private setSize(size: int32): void {
            const size_casted = size as (int32)
            this.setSize_serialize(size_casted)
            return
        }
        getItemAtIndex_serialize(index: int32): HistoryItem {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardList_getItemAtIndex(this.peer!.ptr, index)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : HistoryItem = webview_HistoryItem_serializer.read(retvalDeserializer)
            return returnResult
        }
        private getCurrentIndex_serialize(): int32 {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardList_getCurrentIndex(this.peer!.ptr)
            return retval
        }
        private setCurrentIndex_serialize(currentIndex: int32): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardList_setCurrentIndex(this.peer!.ptr, currentIndex)
        }
        private getSize_serialize(): int32 {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardList_getSize(this.peer!.ptr)
            return retval
        }
        private setSize_serialize(size: int32): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_BackForwardList_setSize(this.peer!.ptr, size)
        }
    }
    export class JsMessageExtInternal {
        public static fromPtr(ptr: KPointer): webview.JsMessageExt {
            return new webview.JsMessageExt(ptr)
        }
    }
    export class JsMessageExt implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, JsMessageExt.getFinalizer())
        }
        constructor() {
            this(JsMessageExt.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_getFinalizer()
        }
        public getType(): JsMessageType {
            return this.getType_serialize()
        }
        public getString(): string {
            return this.getString_serialize()
        }
        public getNumber(): number {
            return this.getNumber_serialize()
        }
        public getBoolean(): boolean {
            return this.getBoolean_serialize()
        }
        public getArrayBuffer(): ArrayBuffer {
            return this.getArrayBuffer_serialize()
        }
        public getArray(): Array<string | number | boolean> {
            return this.getArray_serialize()
        }
        getType_serialize(): JsMessageType {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_getType(this.peer!.ptr)
            return TypeChecker.webview_JsMessageType_FromNumeric(retval)
        }
        getString_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_getString(this.peer!.ptr)
            return retval
        }
        getNumber_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_getNumber(this.peer!.ptr)
            return retval
        }
        getBoolean_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_getBoolean(this.peer!.ptr)
            return retval
        }
        getArrayBuffer_serialize(): ArrayBuffer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_getArrayBuffer(this.peer!.ptr)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
        getArray_serialize(): Array<string | number | boolean> {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_JsMessageExt_getArray(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string | number | boolean> = new Array<string | number | boolean>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                const bufferTempBufUnionSelector : int32 = retvalDeserializer.readInt8()
                let bufferTempBuf : string | number | boolean | undefined
                if (bufferTempBufUnionSelector == (0).toChar()) {
                    bufferTempBuf = (retvalDeserializer.readString() as string)
                } else if (bufferTempBufUnionSelector == (1).toChar()) {
                    bufferTempBuf = (retvalDeserializer.readNumber() as number)
                } else if (bufferTempBufUnionSelector == (2).toChar()) {
                    bufferTempBuf = retvalDeserializer.readBoolean()
                } else {
                    throw new Error("One of the branches for bufferTempBuf has to be chosen through deserialisation.")
                }
                buffer[bufferBufCounterI] = (bufferTempBuf as string | number | boolean)
            }
            const returnResult : Array<string | number | boolean> = buffer
            return returnResult
        }
    }
    export class MediaSourceInfoInternal {
        public static fromPtr(ptr: KPointer): webview.MediaSourceInfo {
            return new webview.MediaSourceInfo(ptr)
        }
    }
    export class MediaSourceInfo implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get type(): SourceType {
            return this.getType()
        }
        set type(type: SourceType) {
            this.setType(type)
        }
        get source(): string {
            return this.getSource()
        }
        set source(source: string) {
            this.setSource(source)
        }
        get format(): string {
            return this.getFormat()
        }
        set format(format: string) {
            this.setFormat(format)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, MediaSourceInfo.getFinalizer())
        }
        constructor() {
            this(MediaSourceInfo.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_getFinalizer()
        }
        private getType(): SourceType {
            return this.getType_serialize()
        }
        private setType(type: SourceType): void {
            const type_casted = type as (SourceType)
            this.setType_serialize(type_casted)
            return
        }
        private getSource(): string {
            return this.getSource_serialize()
        }
        private setSource(source: string): void {
            const source_casted = source as (string)
            this.setSource_serialize(source_casted)
            return
        }
        private getFormat(): string {
            return this.getFormat_serialize()
        }
        private setFormat(format: string): void {
            const format_casted = format as (string)
            this.setFormat_serialize(format_casted)
            return
        }
        private getType_serialize(): SourceType {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_getType(this.peer!.ptr)
            return TypeChecker.webview_SourceType_FromNumeric(retval)
        }
        private setType_serialize(type: SourceType): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_setType(this.peer!.ptr, TypeChecker.webview_SourceType_ToNumeric(type))
        }
        private getSource_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_getSource(this.peer!.ptr)
            return retval
        }
        private setSource_serialize(source: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_setSource(this.peer!.ptr, source)
        }
        private getFormat_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_getFormat(this.peer!.ptr)
            return retval
        }
        private setFormat_serialize(format: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_MediaSourceInfo_setFormat(this.peer!.ptr, format)
        }
    }
    export interface NativeMediaPlayerBridge {
        resumePlayer?: ResumePlayerFn | undefined
        suspendPlayer?: SuspendPlayerFn | undefined
        updateRect(x: double, y: double, width: double, height: double): void
        play(): void
        pause(): void
        seek(targetTime: double): void
        setVolume(volume: double): void
        setMuted(muted: boolean): void
        setPlaybackRate(playbackRate: double): void
        release(): void
        enterFullscreen(): void
        exitFullscreen(): void
    }
    export class NativeMediaPlayerBridgeInternal implements MaterializedBase,NativeMediaPlayerBridge {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get resumePlayer(): ResumePlayerFn | undefined {
            return this.getResumePlayer()
        }
        set resumePlayer(resumePlayer: ResumePlayerFn | undefined) {
            const resumePlayer_NonNull  = (resumePlayer as ResumePlayerFn)
            this.setResumePlayer(resumePlayer_NonNull)
        }
        get suspendPlayer(): SuspendPlayerFn | undefined {
            return this.getSuspendPlayer()
        }
        set suspendPlayer(suspendPlayer: SuspendPlayerFn | undefined) {
            const suspendPlayer_NonNull  = (suspendPlayer as SuspendPlayerFn)
            this.setSuspendPlayer(suspendPlayer_NonNull)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, NativeMediaPlayerBridgeInternal.getFinalizer())
        }
        constructor() {
            this(NativeMediaPlayerBridgeInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): NativeMediaPlayerBridgeInternal {
            return new NativeMediaPlayerBridgeInternal(ptr)
        }
        public updateRect(x: double, y: double, width: double, height: double): void {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const width_casted = width as (double)
            const height_casted = height as (double)
            this.updateRect_serialize(x_casted, y_casted, width_casted, height_casted)
            return
        }
        public play(): void {
            this.play_serialize()
            return
        }
        public pause(): void {
            this.pause_serialize()
            return
        }
        public seek(targetTime: double): void {
            const targetTime_casted = targetTime as (double)
            this.seek_serialize(targetTime_casted)
            return
        }
        public setVolume(volume: double): void {
            const volume_casted = volume as (double)
            this.setVolume_serialize(volume_casted)
            return
        }
        public setMuted(muted: boolean): void {
            const muted_casted = muted as (boolean)
            this.setMuted_serialize(muted_casted)
            return
        }
        public setPlaybackRate(playbackRate: double): void {
            const playbackRate_casted = playbackRate as (double)
            this.setPlaybackRate_serialize(playbackRate_casted)
            return
        }
        public release(): void {
            this.release_serialize()
            return
        }
        public enterFullscreen(): void {
            this.enterFullscreen_serialize()
            return
        }
        public exitFullscreen(): void {
            this.exitFullscreen_serialize()
            return
        }
        private getResumePlayer(): ResumePlayerFn | undefined {
            return this.getResumePlayer_serialize()
        }
        private setResumePlayer(resumePlayer: ResumePlayerFn | undefined): void {
            const resumePlayer_casted = resumePlayer as (ResumePlayerFn | undefined)
            this.setResumePlayer_serialize(resumePlayer_casted)
            return
        }
        private getSuspendPlayer(): SuspendPlayerFn | undefined {
            return this.getSuspendPlayer_serialize()
        }
        private setSuspendPlayer(suspendPlayer: SuspendPlayerFn | undefined): void {
            const suspendPlayer_casted = suspendPlayer as (SuspendPlayerFn | undefined)
            this.setSuspendPlayer_serialize(suspendPlayer_casted)
            return
        }
        updateRect_serialize(x: double, y: double, width: double, height: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_updateRect(this.peer!.ptr, x, y, width, height)
        }
        play_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_play(this.peer!.ptr)
        }
        pause_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_pause(this.peer!.ptr)
        }
        seek_serialize(targetTime: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_seek(this.peer!.ptr, targetTime)
        }
        setVolume_serialize(volume: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_setVolume(this.peer!.ptr, volume)
        }
        setMuted_serialize(muted: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_setMuted(this.peer!.ptr, muted ? 1 : 0)
        }
        setPlaybackRate_serialize(playbackRate: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_setPlaybackRate(this.peer!.ptr, playbackRate)
        }
        release_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_release(this.peer!.ptr)
        }
        enterFullscreen_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_enterFullscreen(this.peer!.ptr)
        }
        exitFullscreen_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_exitFullscreen(this.peer!.ptr)
        }
        private getResumePlayer_serialize(): ResumePlayerFn | undefined {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_getResumePlayer(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
            let buffer : ResumePlayerFn | undefined
            if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
                const buffer_BufResource : CallbackResource = retvalDeserializer.readCallbackResource()
                const buffer_BufCall : KPointer = retvalDeserializer.readPointer()
                const buffer_BufCallSync : KPointer = retvalDeserializer.readPointer()
                buffer = ():void => {
                const buffer_BufArgsSerializer : SerializerBase = SerializerBase.hold();
                buffer_BufArgsSerializer.writeInt32(buffer_BufResource.resourceId);
                buffer_BufArgsSerializer.writePointer(buffer_BufCall);
                buffer_BufArgsSerializer.writePointer(buffer_BufCallSync);
                InteropNativeModule._CallCallbackSync(10, -1804515632, buffer_BufArgsSerializer.asBuffer(), buffer_BufArgsSerializer.length());
                buffer_BufArgsSerializer.release();
                return;
            }
            }
            const returnResult : ResumePlayerFn | undefined = buffer
            return returnResult
        }
        private setResumePlayer_serialize(resumePlayer: ResumePlayerFn | undefined): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (resumePlayer !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const resumePlayerTmpValue  = resumePlayer!
                thisSerializer.holdAndWriteCallback(resumePlayerTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_setResumePlayer(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        private getSuspendPlayer_serialize(): SuspendPlayerFn | undefined {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_getSuspendPlayer(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
            let buffer : SuspendPlayerFn | undefined
            if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
                const buffer_BufResource : CallbackResource = retvalDeserializer.readCallbackResource()
                const buffer_BufCall : KPointer = retvalDeserializer.readPointer()
                const buffer_BufCallSync : KPointer = retvalDeserializer.readPointer()
                buffer = (type: SuspendType):void => {
                const buffer_BufArgsSerializer : SerializerBase = SerializerBase.hold();
                buffer_BufArgsSerializer.writeInt32(buffer_BufResource.resourceId);
                buffer_BufArgsSerializer.writePointer(buffer_BufCall);
                buffer_BufArgsSerializer.writePointer(buffer_BufCallSync);
                buffer_BufArgsSerializer.writeInt32(TypeChecker.webview_SuspendType_ToNumeric(type));
                InteropNativeModule._CallCallbackSync(10, -2006452349, buffer_BufArgsSerializer.asBuffer(), buffer_BufArgsSerializer.length());
                buffer_BufArgsSerializer.release();
                return;
            }
            }
            const returnResult : SuspendPlayerFn | undefined = buffer
            return returnResult
        }
        private setSuspendPlayer_serialize(suspendPlayer: SuspendPlayerFn | undefined): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (suspendPlayer !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const suspendPlayerTmpValue  = suspendPlayer!
                thisSerializer.holdAndWriteCallback(suspendPlayerTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerBridge_setSuspendPlayer(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export interface NativeMediaPlayerHandler {
        handleStatusChanged(status: PlaybackStatus): void
        handleVolumeChanged(volume: double): void
        handleMutedChanged(muted: boolean): void
        handlePlaybackRateChanged(playbackRate: double): void
        handleDurationChanged(duration: double): void
        handleTimeUpdate(currentPlayTime: double): void
        handleBufferedEndTimeChanged(bufferedEndTime: double): void
        handleEnded(): void
        handleNetworkStateChanged(state: NetworkState): void
        handleReadyStateChanged(state: ReadyState): void
        handleFullscreenChanged(fullscreen: boolean): void
        handleSeeking(): void
        handleSeekFinished(): void
        handleError(error: MediaError, errorMessage: string): void
        handleVideoSizeChanged(width: double, height: double): void
    }
    export class NativeMediaPlayerHandlerInternal implements MaterializedBase,NativeMediaPlayerHandler {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, NativeMediaPlayerHandlerInternal.getFinalizer())
        }
        constructor() {
            this(NativeMediaPlayerHandlerInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): NativeMediaPlayerHandlerInternal {
            return new NativeMediaPlayerHandlerInternal(ptr)
        }
        public handleStatusChanged(status: PlaybackStatus): void {
            const status_casted = status as (PlaybackStatus)
            this.handleStatusChanged_serialize(status_casted)
            return
        }
        public handleVolumeChanged(volume: double): void {
            const volume_casted = volume as (double)
            this.handleVolumeChanged_serialize(volume_casted)
            return
        }
        public handleMutedChanged(muted: boolean): void {
            const muted_casted = muted as (boolean)
            this.handleMutedChanged_serialize(muted_casted)
            return
        }
        public handlePlaybackRateChanged(playbackRate: double): void {
            const playbackRate_casted = playbackRate as (double)
            this.handlePlaybackRateChanged_serialize(playbackRate_casted)
            return
        }
        public handleDurationChanged(duration: double): void {
            const duration_casted = duration as (double)
            this.handleDurationChanged_serialize(duration_casted)
            return
        }
        public handleTimeUpdate(currentPlayTime: double): void {
            const currentPlayTime_casted = currentPlayTime as (double)
            this.handleTimeUpdate_serialize(currentPlayTime_casted)
            return
        }
        public handleBufferedEndTimeChanged(bufferedEndTime: double): void {
            const bufferedEndTime_casted = bufferedEndTime as (double)
            this.handleBufferedEndTimeChanged_serialize(bufferedEndTime_casted)
            return
        }
        public handleEnded(): void {
            this.handleEnded_serialize()
            return
        }
        public handleNetworkStateChanged(state: NetworkState): void {
            const state_casted = state as (NetworkState)
            this.handleNetworkStateChanged_serialize(state_casted)
            return
        }
        public handleReadyStateChanged(state: ReadyState): void {
            const state_casted = state as (ReadyState)
            this.handleReadyStateChanged_serialize(state_casted)
            return
        }
        public handleFullscreenChanged(fullscreen: boolean): void {
            const fullscreen_casted = fullscreen as (boolean)
            this.handleFullscreenChanged_serialize(fullscreen_casted)
            return
        }
        public handleSeeking(): void {
            this.handleSeeking_serialize()
            return
        }
        public handleSeekFinished(): void {
            this.handleSeekFinished_serialize()
            return
        }
        public handleError(error: MediaError, errorMessage: string): void {
            const error_casted = error as (MediaError)
            const errorMessage_casted = errorMessage as (string)
            this.handleError_serialize(error_casted, errorMessage_casted)
            return
        }
        public handleVideoSizeChanged(width: double, height: double): void {
            const width_casted = width as (double)
            const height_casted = height as (double)
            this.handleVideoSizeChanged_serialize(width_casted, height_casted)
            return
        }
        handleStatusChanged_serialize(status: PlaybackStatus): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleStatusChanged(this.peer!.ptr, TypeChecker.webview_PlaybackStatus_ToNumeric(status))
        }
        handleVolumeChanged_serialize(volume: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleVolumeChanged(this.peer!.ptr, volume)
        }
        handleMutedChanged_serialize(muted: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleMutedChanged(this.peer!.ptr, muted ? 1 : 0)
        }
        handlePlaybackRateChanged_serialize(playbackRate: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handlePlaybackRateChanged(this.peer!.ptr, playbackRate)
        }
        handleDurationChanged_serialize(duration: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleDurationChanged(this.peer!.ptr, duration)
        }
        handleTimeUpdate_serialize(currentPlayTime: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleTimeUpdate(this.peer!.ptr, currentPlayTime)
        }
        handleBufferedEndTimeChanged_serialize(bufferedEndTime: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleBufferedEndTimeChanged(this.peer!.ptr, bufferedEndTime)
        }
        handleEnded_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleEnded(this.peer!.ptr)
        }
        handleNetworkStateChanged_serialize(state: NetworkState): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleNetworkStateChanged(this.peer!.ptr, TypeChecker.webview_NetworkState_ToNumeric(state))
        }
        handleReadyStateChanged_serialize(state: ReadyState): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleReadyStateChanged(this.peer!.ptr, TypeChecker.webview_ReadyState_ToNumeric(state))
        }
        handleFullscreenChanged_serialize(fullscreen: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleFullscreenChanged(this.peer!.ptr, fullscreen ? 1 : 0)
        }
        handleSeeking_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleSeeking(this.peer!.ptr)
        }
        handleSeekFinished_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleSeekFinished(this.peer!.ptr)
        }
        handleError_serialize(error: MediaError, errorMessage: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleError(this.peer!.ptr, TypeChecker.webview_MediaError_ToNumeric(error), errorMessage)
        }
        handleVideoSizeChanged_serialize(width: double, height: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerHandler_handleVideoSizeChanged(this.peer!.ptr, width, height)
        }
    }
    export class NativeMediaPlayerSurfaceInfoInternal {
        public static fromPtr(ptr: KPointer): webview.NativeMediaPlayerSurfaceInfo {
            return new webview.NativeMediaPlayerSurfaceInfo(ptr)
        }
    }
    export class NativeMediaPlayerSurfaceInfo implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get id(): string {
            return this.getId()
        }
        set id(id: string) {
            this.setId(id)
        }
        get rect(): RectEvent {
            return this.getRect()
        }
        set rect(rect: RectEvent) {
            this.setRect(rect)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, NativeMediaPlayerSurfaceInfo.getFinalizer())
        }
        constructor() {
            this(NativeMediaPlayerSurfaceInfo.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerSurfaceInfo_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerSurfaceInfo_getFinalizer()
        }
        private getId(): string {
            return this.getId_serialize()
        }
        private setId(id: string): void {
            const id_casted = id as (string)
            this.setId_serialize(id_casted)
            return
        }
        private getRect(): RectEvent {
            return this.getRect_serialize()
        }
        private setRect(rect: RectEvent): void {
            const rect_casted = rect as (RectEvent)
            this.setRect_serialize(rect_casted)
            return
        }
        private getId_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerSurfaceInfo_getId(this.peer!.ptr)
            return retval
        }
        private setId_serialize(id: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerSurfaceInfo_setId(this.peer!.ptr, id)
        }
        private getRect_serialize(): RectEvent {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerSurfaceInfo_getRect(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : RectEvent = webview_RectEvent_serializer.read(retvalDeserializer)
            return returnResult
        }
        private setRect_serialize(rect: RectEvent): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            webview_RectEvent_serializer.write(thisSerializer, rect)
            OHOS_WEB_WEBVIEWNativeModule._webview_NativeMediaPlayerSurfaceInfo_setRect(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export class PdfDataInternal {
        public static fromPtr(ptr: KPointer): webview.PdfData {
            return new webview.PdfData(ptr)
        }
    }
    export class PdfData implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, PdfData.getFinalizer())
        }
        constructor() {
            this(PdfData.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_PdfData_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_PdfData_getFinalizer()
        }
        public pdfArrayBuffer(): ArrayBuffer {
            return this.pdfArrayBuffer_serialize()
        }
        pdfArrayBuffer_serialize(): ArrayBuffer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_PdfData_pdfArrayBuffer(this.peer!.ptr)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
    }
    export class WebDownloadDelegateInternal {
        public static fromPtr(ptr: KPointer): webview.WebDownloadDelegate {
            return new webview.WebDownloadDelegate(ptr)
        }
    }
    export class WebDownloadDelegate implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebDownloadDelegate.getFinalizer())
        }
        constructor() {
            this(WebDownloadDelegate.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadDelegate_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadDelegate_getFinalizer()
        }
        public onBeforeDownload(callback_: ((value0: WebDownloadItem) => void)): void {
            const callback__casted = callback_ as (((value0: WebDownloadItem) => void))
            this.onBeforeDownload_serialize(callback__casted)
            return
        }
        public onDownloadUpdated(callback_: ((value0: WebDownloadItem) => void)): void {
            const callback__casted = callback_ as (((value0: WebDownloadItem) => void))
            this.onDownloadUpdated_serialize(callback__casted)
            return
        }
        public onDownloadFinish(callback_: ((value0: WebDownloadItem) => void)): void {
            const callback__casted = callback_ as (((value0: WebDownloadItem) => void))
            this.onDownloadFinish_serialize(callback__casted)
            return
        }
        public onDownloadFailed(callback_: ((value0: WebDownloadItem) => void)): void {
            const callback__casted = callback_ as (((value0: WebDownloadItem) => void))
            this.onDownloadFailed_serialize(callback__casted)
            return
        }
        onBeforeDownload_serialize(callback_: ((value0: WebDownloadItem) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadDelegate_onBeforeDownload(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onDownloadUpdated_serialize(callback_: ((value0: WebDownloadItem) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadDelegate_onDownloadUpdated(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onDownloadFinish_serialize(callback_: ((value0: WebDownloadItem) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadDelegate_onDownloadFinish(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onDownloadFailed_serialize(callback_: ((value0: WebDownloadItem) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadDelegate_onDownloadFailed(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export class WebDownloadItemInternal {
        public static fromPtr(ptr: KPointer): webview.WebDownloadItem {
            return new webview.WebDownloadItem(ptr)
        }
    }
    export class WebDownloadItem implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebDownloadItem.getFinalizer())
        }
        constructor() {
            this(WebDownloadItem.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getFinalizer()
        }
        static deserialize_serialize(serializedData: ArrayBuffer): WebDownloadItem {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(serializedData)
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_deserialize(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : WebDownloadItem = extractors.fromWebviewWebDownloadItemPtr(retval)
            return obj
        }
        public getGuid(): string {
            return this.getGuid_serialize()
        }
        public getCurrentSpeed(): number {
            return this.getCurrentSpeed_serialize()
        }
        public getPercentComplete(): number {
            return this.getPercentComplete_serialize()
        }
        public getTotalBytes(): number {
            return this.getTotalBytes_serialize()
        }
        public getState(): WebDownloadState {
            return this.getState_serialize()
        }
        public getLastErrorCode(): WebDownloadErrorCode {
            return this.getLastErrorCode_serialize()
        }
        public getMethod(): string {
            return this.getMethod_serialize()
        }
        public getMimeType(): string {
            return this.getMimeType_serialize()
        }
        public getUrl(): string {
            return this.getUrl_serialize()
        }
        public getSuggestedFileName(): string {
            return this.getSuggestedFileName_serialize()
        }
        public start(downloadPath: string): void {
            const downloadPath_casted = downloadPath as (string)
            this.start_serialize(downloadPath_casted)
            return
        }
        public cancel(): void {
            this.cancel_serialize()
            return
        }
        public pause(): void {
            this.pause_serialize()
            return
        }
        public resume(): void {
            this.resume_serialize()
            return
        }
        public getReceivedBytes(): number {
            return this.getReceivedBytes_serialize()
        }
        public getFullPath(): string {
            return this.getFullPath_serialize()
        }
        public serialize(): ArrayBuffer {
            return this.serialize_serialize()
        }
        public static deserialize(serializedData: ArrayBuffer): WebDownloadItem {
            const serializedData_casted = serializedData as (ArrayBuffer)
            return WebDownloadItem.deserialize_serialize(serializedData_casted)
        }
        getGuid_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getGuid(this.peer!.ptr)
            return retval
        }
        getCurrentSpeed_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getCurrentSpeed(this.peer!.ptr)
            return retval
        }
        getPercentComplete_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getPercentComplete(this.peer!.ptr)
            return retval
        }
        getTotalBytes_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getTotalBytes(this.peer!.ptr)
            return retval
        }
        getState_serialize(): WebDownloadState {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getState(this.peer!.ptr)
            return TypeChecker.webview_WebDownloadState_FromNumeric(retval)
        }
        getLastErrorCode_serialize(): WebDownloadErrorCode {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getLastErrorCode(this.peer!.ptr)
            return TypeChecker.webview_WebDownloadErrorCode_FromNumeric(retval)
        }
        getMethod_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getMethod(this.peer!.ptr)
            return retval
        }
        getMimeType_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getMimeType(this.peer!.ptr)
            return retval
        }
        getUrl_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getUrl(this.peer!.ptr)
            return retval
        }
        getSuggestedFileName_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getSuggestedFileName(this.peer!.ptr)
            return retval
        }
        start_serialize(downloadPath: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_start(this.peer!.ptr, downloadPath)
        }
        cancel_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_cancel(this.peer!.ptr)
        }
        pause_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_pause(this.peer!.ptr)
        }
        resume_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_resume(this.peer!.ptr)
        }
        getReceivedBytes_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getReceivedBytes(this.peer!.ptr)
            return retval
        }
        getFullPath_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_getFullPath(this.peer!.ptr)
            return retval
        }
        serialize_serialize(): ArrayBuffer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebDownloadItem_serialize(this.peer!.ptr)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
    }
    export class WebHttpBodyStreamInternal {
        public static fromPtr(ptr: KPointer): webview.WebHttpBodyStream {
            return new webview.WebHttpBodyStream(ptr)
        }
    }
    export class WebHttpBodyStream implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebHttpBodyStream.getFinalizer())
        }
        constructor() {
            this(WebHttpBodyStream.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_getFinalizer()
        }
        public initialize(): Promise<void> {
            return this.initialize_serialize()
        }
        public read(size: number): Promise<ArrayBuffer> {
            const size_casted = size as (number)
            return this.read_serialize(size_casted)
        }
        public getSize(): number {
            return this.getSize_serialize()
        }
        public getPosition(): number {
            return this.getPosition_serialize()
        }
        public isChunked(): boolean {
            return this.isChunked_serialize()
        }
        public isEof(): boolean {
            return this.isEof_serialize()
        }
        public isInMemory(): boolean {
            return this.isInMemory_serialize()
        }
        initialize_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_initialize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        read_serialize(size: number): Promise<ArrayBuffer> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<ArrayBuffer>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_read(this.peer!.ptr, size, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getSize_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_getSize(this.peer!.ptr)
            return retval
        }
        getPosition_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_getPosition(this.peer!.ptr)
            return retval
        }
        isChunked_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_isChunked(this.peer!.ptr)
            return retval
        }
        isEof_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_isEof(this.peer!.ptr)
            return retval
        }
        isInMemory_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebHttpBodyStream_isInMemory(this.peer!.ptr)
            return retval
        }
    }
    export class WebMessageExtInternal {
        public static fromPtr(ptr: KPointer): webview.WebMessageExt {
            return new webview.WebMessageExt(ptr)
        }
    }
    export class WebMessageExt implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebMessageExt.getFinalizer())
        }
        constructor() {
            this(WebMessageExt.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getFinalizer()
        }
        public getType(): WebMessageType {
            return this.getType_serialize()
        }
        public getString(): string {
            return this.getString_serialize()
        }
        public getNumber(): number {
            return this.getNumber_serialize()
        }
        public getBoolean(): boolean {
            return this.getBoolean_serialize()
        }
        public getArrayBuffer(): ArrayBuffer {
            return this.getArrayBuffer_serialize()
        }
        public getArray(): Array<string | number | boolean> {
            return this.getArray_serialize()
        }
        public getError(): object {
            return this.getError_serialize()
        }
        public setType(type: WebMessageType): void {
            const type_casted = type as (WebMessageType)
            this.setType_serialize(type_casted)
            return
        }
        public setString(message: string): void {
            const message_casted = message as (string)
            this.setString_serialize(message_casted)
            return
        }
        public setNumber(message: number): void {
            const message_casted = message as (number)
            this.setNumber_serialize(message_casted)
            return
        }
        public setBoolean(message: boolean): void {
            const message_casted = message as (boolean)
            this.setBoolean_serialize(message_casted)
            return
        }
        public setArrayBuffer(message: ArrayBuffer): void {
            const message_casted = message as (ArrayBuffer)
            this.setArrayBuffer_serialize(message_casted)
            return
        }
        public setArray(message: Array<string | number | boolean>): void {
            const message_casted = message as (Array<string | number | boolean>)
            this.setArray_serialize(message_casted)
            return
        }
        public setError(message: object): void {
            const message_casted = message as (object)
            this.setError_serialize(message_casted)
            return
        }
        getType_serialize(): WebMessageType {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getType(this.peer!.ptr)
            return TypeChecker.webview_WebMessageType_FromNumeric(retval)
        }
        getString_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getString(this.peer!.ptr)
            return retval
        }
        getNumber_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getNumber(this.peer!.ptr)
            return retval
        }
        getBoolean_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getBoolean(this.peer!.ptr)
            return retval
        }
        getArrayBuffer_serialize(): ArrayBuffer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getArrayBuffer(this.peer!.ptr)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
        getArray_serialize(): Array<string | number | boolean> {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getArray(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string | number | boolean> = new Array<string | number | boolean>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                const bufferTempBufUnionSelector : int32 = retvalDeserializer.readInt8()
                let bufferTempBuf : string | number | boolean | undefined
                if (bufferTempBufUnionSelector == (0).toChar()) {
                    bufferTempBuf = (retvalDeserializer.readString() as string)
                } else if (bufferTempBufUnionSelector == (1).toChar()) {
                    bufferTempBuf = (retvalDeserializer.readNumber() as number)
                } else if (bufferTempBufUnionSelector == (2).toChar()) {
                    bufferTempBuf = retvalDeserializer.readBoolean()
                } else {
                    throw new Error("One of the branches for bufferTempBuf has to be chosen through deserialisation.")
                }
                buffer[bufferBufCounterI] = (bufferTempBuf as string | number | boolean)
            }
            const returnResult : Array<string | number | boolean> = buffer
            return returnResult
        }
        getError_serialize(): object {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_getError(this.peer!.ptr)
            throw new Error("Object deserialization is not implemented.")
        }
        setType_serialize(type: WebMessageType): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_setType(this.peer!.ptr, TypeChecker.webview_WebMessageType_ToNumeric(type))
        }
        setString_serialize(message: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_setString(this.peer!.ptr, message)
        }
        setNumber_serialize(message: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_setNumber(this.peer!.ptr, message)
        }
        setBoolean_serialize(message: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_setBoolean(this.peer!.ptr, message ? 1 : 0)
        }
        setArrayBuffer_serialize(message: ArrayBuffer): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(message)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_setArrayBuffer(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setArray_serialize(message: Array<string | number | boolean>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((message.length).toInt())
            for (let messageCounterI = 0; messageCounterI < message.length; messageCounterI++) {
                const messageTmpElement : string | number | boolean = message[messageCounterI]
                if (messageTmpElement instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const messageTmpElementForIdx0  = messageTmpElement as string
                    thisSerializer.writeString(messageTmpElementForIdx0)
                } else if (messageTmpElement instanceof number) {
                    thisSerializer.writeInt8((1).toChar())
                    const messageTmpElementForIdx1  = messageTmpElement as number
                    thisSerializer.writeNumber(messageTmpElementForIdx1)
                } else if (messageTmpElement instanceof boolean) {
                    thisSerializer.writeInt8((2).toChar())
                    const messageTmpElementForIdx2  = messageTmpElement as boolean
                    thisSerializer.writeBoolean(messageTmpElementForIdx2)
                }
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_setArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setError_serialize(message: object): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeCustomObject('object', message)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessageExt_setError(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export interface WebMessagePort {
        isExtentionType?: boolean | undefined
        close(): void
        postMessageEvent(message: WebMessage): void
        onMessageEvent(callback_: ((result: WebMessage) => void)): void
        postMessageEventExt(message: WebMessageExt): void
        onMessageEventExt(callback_: ((result: WebMessageExt) => void)): void
    }
    export class WebMessagePortInternal implements MaterializedBase,WebMessagePort {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get isExtentionType(): boolean | undefined {
            return this.getIsExtentionType()
        }
        set isExtentionType(isExtentionType: boolean | undefined) {
            const isExtentionType_NonNull  = (isExtentionType as boolean)
            this.setIsExtentionType(isExtentionType_NonNull)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebMessagePortInternal.getFinalizer())
        }
        constructor() {
            this(WebMessagePortInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): WebMessagePortInternal {
            return new WebMessagePortInternal(ptr)
        }
        public close(): void {
            this.close_serialize()
            return
        }
        public postMessageEvent(message: WebMessage): void {
            const message_casted = message as (WebMessage)
            this.postMessageEvent_serialize(message_casted)
            return
        }
        public onMessageEvent(callback_: ((result: WebMessage) => void)): void {
            const callback__casted = callback_ as (((result: WebMessage) => void))
            this.onMessageEvent_serialize(callback__casted)
            return
        }
        public postMessageEventExt(message: WebMessageExt): void {
            const message_casted = message as (WebMessageExt)
            this.postMessageEventExt_serialize(message_casted)
            return
        }
        public onMessageEventExt(callback_: ((result: WebMessageExt) => void)): void {
            const callback__casted = callback_ as (((result: WebMessageExt) => void))
            this.onMessageEventExt_serialize(callback__casted)
            return
        }
        private getIsExtentionType(): boolean | undefined {
            return this.getIsExtentionType_serialize()
        }
        private setIsExtentionType(isExtentionType: boolean | undefined): void {
            const isExtentionType_casted = isExtentionType as (boolean | undefined)
            this.setIsExtentionType_serialize(isExtentionType_casted)
            return
        }
        close_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_close(this.peer!.ptr)
        }
        postMessageEvent_serialize(message: WebMessage): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (message instanceof ArrayBuffer) {
                thisSerializer.writeInt8((0).toChar())
                const messageForIdx0  = message as ArrayBuffer
                thisSerializer.writeBuffer(messageForIdx0)
            } else if (message instanceof string) {
                thisSerializer.writeInt8((1).toChar())
                const messageForIdx1  = message as string
                thisSerializer.writeString(messageForIdx1)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_postMessageEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onMessageEvent_serialize(callback_: ((result: WebMessage) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_onMessageEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        postMessageEventExt_serialize(message: WebMessageExt): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_postMessageEventExt(this.peer!.ptr, extractors.toWebviewWebMessageExtPtr(message))
        }
        onMessageEventExt_serialize(callback_: ((result: WebMessageExt) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_onMessageEventExt(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        private getIsExtentionType_serialize(): boolean | undefined {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_getIsExtentionType(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
            let buffer : boolean | undefined
            if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
                buffer = retvalDeserializer.readBoolean()
            }
            const returnResult : boolean | undefined = buffer
            return returnResult
        }
        private setIsExtentionType_serialize(isExtentionType: boolean | undefined): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (isExtentionType !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const isExtentionTypeTmpValue  = isExtentionType!
                thisSerializer.writeBoolean(isExtentionTypeTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebMessagePort_setIsExtentionType(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export class WebResourceHandlerInternal {
        public static fromPtr(ptr: KPointer): webview.WebResourceHandler {
            return new webview.WebResourceHandler(ptr)
        }
    }
    export class WebResourceHandler implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebResourceHandler.getFinalizer())
        }
        constructor() {
            this(WebResourceHandler.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebResourceHandler_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebResourceHandler_getFinalizer()
        }
        public didReceiveResponse(response: WebSchemeHandlerResponse): void {
            const response_casted = response as (WebSchemeHandlerResponse)
            this.didReceiveResponse_serialize(response_casted)
            return
        }
        public didReceiveResponseBody(data: ArrayBuffer): void {
            const data_casted = data as (ArrayBuffer)
            this.didReceiveResponseBody_serialize(data_casted)
            return
        }
        public didFinish(): void {
            this.didFinish_serialize()
            return
        }
        public didFail(code: WebNetErrorList): void {
            const code_casted = code as (WebNetErrorList)
            this.didFail_serialize(code_casted)
            return
        }
        didReceiveResponse_serialize(response: WebSchemeHandlerResponse): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebResourceHandler_didReceiveResponse(this.peer!.ptr, extractors.toWebviewWebSchemeHandlerResponsePtr(response))
        }
        didReceiveResponseBody_serialize(data: ArrayBuffer): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(data)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebResourceHandler_didReceiveResponseBody(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        didFinish_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebResourceHandler_didFinish(this.peer!.ptr)
        }
        didFail_serialize(code: WebNetErrorList): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebResourceHandler_didFail(this.peer!.ptr, TypeChecker.WebNetErrorList_ToNumeric(code))
        }
    }
    export class WebSchemeHandlerInternal {
        public static fromPtr(ptr: KPointer): webview.WebSchemeHandler {
            return new webview.WebSchemeHandler(ptr)
        }
    }
    export class WebSchemeHandler implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebSchemeHandler.getFinalizer())
        }
        constructor() {
            this(WebSchemeHandler.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandler_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandler_getFinalizer()
        }
        public onRequestStart(callback_: ((request: WebSchemeHandlerRequest,handler: WebResourceHandler) => boolean)): void {
            const callback__casted = callback_ as (((request: WebSchemeHandlerRequest,handler: WebResourceHandler) => boolean))
            this.onRequestStart_serialize(callback__casted)
            return
        }
        public onRequestStop(callback_: ((value0: WebSchemeHandlerRequest) => void)): void {
            const callback__casted = callback_ as (((value0: WebSchemeHandlerRequest) => void))
            this.onRequestStop_serialize(callback__casted)
            return
        }
        onRequestStart_serialize(callback_: ((request: WebSchemeHandlerRequest,handler: WebResourceHandler) => boolean)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandler_onRequestStart(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onRequestStop_serialize(callback_: ((value0: WebSchemeHandlerRequest) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandler_onRequestStop(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export class WebSchemeHandlerRequestInternal {
        public static fromPtr(ptr: KPointer): webview.WebSchemeHandlerRequest {
            return new webview.WebSchemeHandlerRequest(ptr)
        }
    }
    export class WebSchemeHandlerRequest implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebSchemeHandlerRequest.getFinalizer())
        }
        constructor() {
            this(WebSchemeHandlerRequest.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getFinalizer()
        }
        public getHeader(): Array<WebHeader> {
            return this.getHeader_serialize()
        }
        public getRequestUrl(): string {
            return this.getRequestUrl_serialize()
        }
        public getRequestMethod(): string {
            return this.getRequestMethod_serialize()
        }
        public getReferrer(): string {
            return this.getReferrer_serialize()
        }
        public isMainFrame(): boolean {
            return this.isMainFrame_serialize()
        }
        public hasGesture(): boolean {
            return this.hasGesture_serialize()
        }
        public getHttpBodyStream(): WebHttpBodyStream | undefined {
            return this.getHttpBodyStream_serialize()
        }
        public getRequestResourceType(): WebResourceType {
            return this.getRequestResourceType_serialize()
        }
        public getFrameUrl(): string {
            return this.getFrameUrl_serialize()
        }
        getHeader_serialize(): Array<WebHeader> {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getHeader(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<WebHeader> = new Array<WebHeader>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = webview_WebHeader_serializer.read(retvalDeserializer)
            }
            const returnResult : Array<WebHeader> = buffer
            return returnResult
        }
        getRequestUrl_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getRequestUrl(this.peer!.ptr)
            return retval
        }
        getRequestMethod_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getRequestMethod(this.peer!.ptr)
            return retval
        }
        getReferrer_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getReferrer(this.peer!.ptr)
            return retval
        }
        isMainFrame_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_isMainFrame(this.peer!.ptr)
            return retval
        }
        hasGesture_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_hasGesture(this.peer!.ptr)
            return retval
        }
        getHttpBodyStream_serialize(): WebHttpBodyStream | undefined {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getHttpBodyStream(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
            let buffer : WebHttpBodyStream | undefined
            if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
                buffer = (webview_WebHttpBodyStream_serializer.read(retvalDeserializer) as webview.WebHttpBodyStream)
            }
            const returnResult : WebHttpBodyStream | undefined = buffer
            return returnResult
        }
        getRequestResourceType_serialize(): WebResourceType {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getRequestResourceType(this.peer!.ptr)
            return TypeChecker.webview_WebResourceType_FromNumeric(retval)
        }
        getFrameUrl_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerRequest_getFrameUrl(this.peer!.ptr)
            return retval
        }
    }
    export class WebSchemeHandlerResponseInternal {
        public static fromPtr(ptr: KPointer): webview.WebSchemeHandlerResponse {
            return new webview.WebSchemeHandlerResponse(ptr)
        }
    }
    export class WebSchemeHandlerResponse implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebSchemeHandlerResponse.getFinalizer())
        }
        constructor() {
            this(WebSchemeHandlerResponse.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getFinalizer()
        }
        public setUrl(url: string): void {
            const url_casted = url as (string)
            this.setUrl_serialize(url_casted)
            return
        }
        public getUrl(): string {
            return this.getUrl_serialize()
        }
        public setNetErrorCode(code: WebNetErrorList): void {
            const code_casted = code as (WebNetErrorList)
            this.setNetErrorCode_serialize(code_casted)
            return
        }
        public getNetErrorCode(): WebNetErrorList {
            return this.getNetErrorCode_serialize()
        }
        public setStatus(code: number): void {
            const code_casted = code as (number)
            this.setStatus_serialize(code_casted)
            return
        }
        public getStatus(): number {
            return this.getStatus_serialize()
        }
        public setStatusText(text: string): void {
            const text_casted = text as (string)
            this.setStatusText_serialize(text_casted)
            return
        }
        public getStatusText(): string {
            return this.getStatusText_serialize()
        }
        public setMimeType(type: string): void {
            const type_casted = type as (string)
            this.setMimeType_serialize(type_casted)
            return
        }
        public getMimeType(): string {
            return this.getMimeType_serialize()
        }
        public setEncoding(encoding: string): void {
            const encoding_casted = encoding as (string)
            this.setEncoding_serialize(encoding_casted)
            return
        }
        public getEncoding(): string {
            return this.getEncoding_serialize()
        }
        public setHeaderByName(name: string, value: string, overwrite: boolean): void {
            const name_casted = name as (string)
            const value_casted = value as (string)
            const overwrite_casted = overwrite as (boolean)
            this.setHeaderByName_serialize(name_casted, value_casted, overwrite_casted)
            return
        }
        public getHeaderByName(name: string): string {
            const name_casted = name as (string)
            return this.getHeaderByName_serialize(name_casted)
        }
        setUrl_serialize(url: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_setUrl(this.peer!.ptr, url)
        }
        getUrl_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getUrl(this.peer!.ptr)
            return retval
        }
        setNetErrorCode_serialize(code: WebNetErrorList): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_setNetErrorCode(this.peer!.ptr, TypeChecker.WebNetErrorList_ToNumeric(code))
        }
        getNetErrorCode_serialize(): WebNetErrorList {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getNetErrorCode(this.peer!.ptr)
            return TypeChecker.WebNetErrorList_FromNumeric(retval)
        }
        setStatus_serialize(code: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_setStatus(this.peer!.ptr, code)
        }
        getStatus_serialize(): number {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getStatus(this.peer!.ptr)
            return retval
        }
        setStatusText_serialize(text: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_setStatusText(this.peer!.ptr, text)
        }
        getStatusText_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getStatusText(this.peer!.ptr)
            return retval
        }
        setMimeType_serialize(type: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_setMimeType(this.peer!.ptr, type)
        }
        getMimeType_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getMimeType(this.peer!.ptr)
            return retval
        }
        setEncoding_serialize(encoding: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_setEncoding(this.peer!.ptr, encoding)
        }
        getEncoding_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getEncoding(this.peer!.ptr)
            return retval
        }
        setHeaderByName_serialize(name: string, value: string, overwrite: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_setHeaderByName(this.peer!.ptr, name, value, overwrite ? 1 : 0)
        }
        getHeaderByName_serialize(name: string): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebSchemeHandlerResponse_getHeaderByName(this.peer!.ptr, name)
            return retval
        }
    }
    export class WebviewControllerInternal {
        public static fromPtr(ptr: KPointer): webview.WebviewController {
            return new webview.WebviewController(false, ptr)
        }
    }
    export class WebviewController implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(_0: boolean, peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WebviewController.getFinalizer())
        }
        constructor(webTag?: string) {
            this(false, WebviewController.construct(webTag))
        }
        static construct(webTag?: string): KPointer {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (webTag !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const webTagTmpValue  = webTag!
                thisSerializer.writeString(webTagTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_construct(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getFinalizer()
        }
        static initializeWebEngine_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_initializeWebEngine()
        }
        static setHttpDns_serialize(secureDnsMode: SecureDnsMode, secureDnsConfig: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setHttpDns(TypeChecker.webview_SecureDnsMode_ToNumeric(secureDnsMode), secureDnsConfig)
        }
        static setWebDebuggingAccess0_serialize(webDebuggingAccess: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setWebDebuggingAccess0(webDebuggingAccess ? 1 : 0)
        }
        static removeAllCache_serialize(clearRom: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_removeAllCache(clearRom ? 1 : 0)
        }
        static customizeSchemes_serialize(schemes: Array<WebCustomScheme>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((schemes.length).toInt())
            for (let schemesCounterI = 0; schemesCounterI < schemes.length; schemesCounterI++) {
                const schemesTmpElement : WebCustomScheme = schemes[schemesCounterI]
                webview_WebCustomScheme_serializer.write(thisSerializer, schemesTmpElement)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_customizeSchemes(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        static prepareForPageLoad_serialize(url: string, preconnectable: boolean, numSockets: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_prepareForPageLoad(url, preconnectable ? 1 : 0, numSockets)
        }
        static setConnectionTimeout_serialize(timeout: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setConnectionTimeout(timeout)
        }
        static pauseAllTimers_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_pauseAllTimers()
        }
        static resumeAllTimers_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_resumeAllTimers()
        }
        static setServiceWorkerWebSchemeHandler_serialize(scheme: string, handler: WebSchemeHandler): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setServiceWorkerWebSchemeHandler(scheme, extractors.toWebviewWebSchemeHandlerPtr(handler))
        }
        static clearServiceWorkerWebSchemeHandler_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearServiceWorkerWebSchemeHandler()
        }
        static addIntelligentTrackingPreventionBypassingList_serialize(hostList: Array<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((hostList.length).toInt())
            for (let hostListCounterI = 0; hostListCounterI < hostList.length; hostListCounterI++) {
                const hostListTmpElement : string = hostList[hostListCounterI]
                thisSerializer.writeString(hostListTmpElement)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_addIntelligentTrackingPreventionBypassingList(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        static removeIntelligentTrackingPreventionBypassingList_serialize(hostList: Array<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((hostList.length).toInt())
            for (let hostListCounterI = 0; hostListCounterI < hostList.length; hostListCounterI++) {
                const hostListTmpElement : string = hostList[hostListCounterI]
                thisSerializer.writeString(hostListTmpElement)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_removeIntelligentTrackingPreventionBypassingList(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        static clearIntelligentTrackingPreventionBypassingList_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearIntelligentTrackingPreventionBypassingList()
        }
        static getDefaultUserAgent_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getDefaultUserAgent()
            return retval
        }
        static enableWholeWebPageDrawing_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_enableWholeWebPageDrawing()
        }
        static prefetchResource_serialize(request: RequestInfo, additionalHeaders?: Array<WebHeader>, cacheKey?: string, cacheValidTime?: int32): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            webview_RequestInfo_serializer.write(thisSerializer, request)
            if (additionalHeaders !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const additionalHeadersTmpValue  = additionalHeaders!
                thisSerializer.writeInt32((additionalHeadersTmpValue.length).toInt())
                for (let additionalHeadersTmpValueCounterI = 0; additionalHeadersTmpValueCounterI < additionalHeadersTmpValue.length; additionalHeadersTmpValueCounterI++) {
                    const additionalHeadersTmpValueTmpElement : WebHeader = additionalHeadersTmpValue[additionalHeadersTmpValueCounterI]
                    webview_WebHeader_serializer.write(thisSerializer, additionalHeadersTmpValueTmpElement)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (cacheKey !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const cacheKeyTmpValue  = cacheKey!
                thisSerializer.writeString(cacheKeyTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (cacheValidTime !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const cacheValidTimeTmpValue  = cacheValidTime!
                thisSerializer.writeInt32(cacheValidTimeTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_prefetchResource(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        static clearPrefetchedResource_serialize(cacheKeyList: Array<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((cacheKeyList.length).toInt())
            for (let cacheKeyListCounterI = 0; cacheKeyListCounterI < cacheKeyList.length; cacheKeyListCounterI++) {
                const cacheKeyListTmpElement : string = cacheKeyList[cacheKeyListCounterI]
                thisSerializer.writeString(cacheKeyListTmpElement)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearPrefetchedResource(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        static setRenderProcessMode_serialize(mode: RenderProcessMode): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setRenderProcessMode(TypeChecker.webview_RenderProcessMode_ToNumeric(mode))
        }
        static getRenderProcessMode_serialize(): RenderProcessMode {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getRenderProcessMode()
            return TypeChecker.webview_RenderProcessMode_FromNumeric(retval)
        }
        static setHostIP_serialize(hostName: string, address: string, aliveTime: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setHostIP(hostName, address, aliveTime)
        }
        static clearHostIP_serialize(hostName: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearHostIP(hostName)
        }
        static warmupServiceWorker_serialize(url: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_warmupServiceWorker(url)
        }
        static trimMemoryByPressureLevel_serialize(level: PressureLevel): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_trimMemoryByPressureLevel(TypeChecker.webview_PressureLevel_ToNumeric(level))
        }
        static enableBackForwardCache_serialize(features?: BackForwardCacheSupportedFeatures): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (features !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const featuresTmpValue  = features!
                webview_BackForwardCacheSupportedFeatures_serializer.write(thisSerializer, featuresTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_enableBackForwardCache(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        static setWebDebuggingAccess1_serialize(webDebuggingAccess: boolean, port: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setWebDebuggingAccess1(webDebuggingAccess ? 1 : 0, port)
        }
        public static initializeWebEngine(): void {
            WebviewController.initializeWebEngine_serialize()
            return
        }
        public static setHttpDns(secureDnsMode: SecureDnsMode, secureDnsConfig: string): void {
            const secureDnsMode_casted = secureDnsMode as (SecureDnsMode)
            const secureDnsConfig_casted = secureDnsConfig as (string)
            WebviewController.setHttpDns_serialize(secureDnsMode_casted, secureDnsConfig_casted)
            return
        }
        public static setWebDebuggingAccess(webDebuggingAccess: boolean): void {
            const webDebuggingAccess_casted = webDebuggingAccess as (boolean)
            WebviewController.setWebDebuggingAccess0_serialize(webDebuggingAccess_casted)
            return
        }
        public enableSafeBrowsing(enable: boolean): void {
            const enable_casted = enable as (boolean)
            this.enableSafeBrowsing_serialize(enable_casted)
            return
        }
        public isSafeBrowsingEnabled(): boolean {
            return this.isSafeBrowsingEnabled_serialize()
        }
        public accessForward(): boolean {
            return this.accessForward_serialize()
        }
        public accessBackward(): boolean {
            return this.accessBackward_serialize()
        }
        public accessStep(step: number): boolean {
            const step_casted = step as (number)
            return this.accessStep_serialize(step_casted)
        }
        public forward(): void {
            this.forward_serialize()
            return
        }
        public backward(): void {
            this.backward_serialize()
            return
        }
        public clearHistory(): void {
            this.clearHistory_serialize()
            return
        }
        public onActive(): void {
            this.onActive_serialize()
            return
        }
        public onInactive(): void {
            this.onInactive_serialize()
            return
        }
        public refresh(): void {
            this.refresh_serialize()
            return
        }
        public loadData(data: string, mimeType: string, encoding: string, baseUrl?: string, historyUrl?: string): void {
            const data_casted = data as (string)
            const mimeType_casted = mimeType as (string)
            const encoding_casted = encoding as (string)
            const baseUrl_casted = baseUrl as (string | undefined)
            const historyUrl_casted = historyUrl as (string | undefined)
            this.loadData_serialize(data_casted, mimeType_casted, encoding_casted, baseUrl_casted, historyUrl_casted)
            return
        }
        public loadUrl(url: string | object, headers?: Array<WebHeader>): void {
            const url_casted = url as (string | object)
            const headers_casted = headers as (Array<WebHeader> | undefined)
            this.loadUrl_serialize(url_casted, headers_casted)
            return
        }
        public storeWebArchive(baseName: string, autoName: boolean): Promise<string> {
            const baseName_casted = baseName as (string)
            const autoName_casted = autoName as (boolean)
            return this.storeWebArchive0_serialize(baseName_casted, autoName_casted)
        }
        public storeWebArchive(baseName: string, autoName: boolean, callback_: AsyncCallback<string>): void {
            const baseName_casted = baseName as (string)
            const autoName_casted = autoName as (boolean)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.storeWebArchive1_serialize(baseName_casted, autoName_casted, callback__casted)
            return
        }
        public zoom(factor: double): void {
            const factor_casted = factor as (double)
            this.zoom_serialize(factor_casted)
            return
        }
        public zoomIn(): void {
            this.zoomIn_serialize()
            return
        }
        public zoomOut(): void {
            this.zoomOut_serialize()
            return
        }
        public getWebId(): int32 {
            return this.getWebId_serialize()
        }
        public getUserAgent(): string {
            return this.getUserAgent_serialize()
        }
        public getTitle(): string {
            return this.getTitle_serialize()
        }
        public getPageHeight(): int32 {
            return this.getPageHeight_serialize()
        }
        public backOrForward(step: number): void {
            const step_casted = step as (number)
            this.backOrForward_serialize(step_casted)
            return
        }
        public requestFocus(): void {
            this.requestFocus_serialize()
            return
        }
        public createWebMessagePorts(isExtentionType?: boolean): Array<WebMessagePort> {
            const isExtentionType_casted = isExtentionType as (boolean | undefined)
            return this.createWebMessagePorts_serialize(isExtentionType_casted)
        }
        public postMessage(name: string, ports: Array<WebMessagePort>, uri: string): void {
            const name_casted = name as (string)
            const ports_casted = ports as (Array<WebMessagePort>)
            const uri_casted = uri as (string)
            this.postMessage_serialize(name_casted, ports_casted, uri_casted)
            return
        }
        public stop(): void {
            this.stop_serialize()
            return
        }
        public registerJavaScriptProxy(jsObject: Object, name: string, methodList: Array<string>, asyncMethodList?: Array<string>, permission?: string): void {
            const jsObject_casted = jsObject as (Object)
            const name_casted = name as (string)
            const methodList_casted = methodList as (Array<string>)
            const asyncMethodList_casted = asyncMethodList as (Array<string> | undefined)
            const permission_casted = permission as (string | undefined)
            this.registerJavaScriptProxy_serialize(jsObject_casted, name_casted, methodList_casted, asyncMethodList_casted, permission_casted)
            return
        }
        public deleteJavaScriptRegister(name: string): void {
            const name_casted = name as (string)
            this.deleteJavaScriptRegister_serialize(name_casted)
            return
        }
        public searchAllAsync(searchString: string): void {
            const searchString_casted = searchString as (string)
            this.searchAllAsync_serialize(searchString_casted)
            return
        }
        public clearMatches(): void {
            this.clearMatches_serialize()
            return
        }
        public searchNext(forward: boolean): void {
            const forward_casted = forward as (boolean)
            this.searchNext_serialize(forward_casted)
            return
        }
        public clearSslCache(): void {
            this.clearSslCache_serialize()
            return
        }
        public clearClientAuthenticationCache(): void {
            this.clearClientAuthenticationCache_serialize()
            return
        }
        public runJavaScript(script: string): Promise<string> {
            const script_casted = script as (string)
            return this.runJavaScript0_serialize(script_casted)
        }
        public runJavaScript(script: string, callback_: AsyncCallback<string>): void {
            const script_casted = script as (string)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.runJavaScript1_serialize(script_casted, callback__casted)
            return
        }
        public runJavaScriptExt(script: string | ArrayBuffer): Promise<JsMessageExt> {
            const script_casted = script as (string | ArrayBuffer)
            return this.runJavaScriptExt0_serialize(script_casted)
        }
        public runJavaScriptExt(script: string | ArrayBuffer, callback_: AsyncCallback<JsMessageExt>): void {
            const script_casted = script as (string | ArrayBuffer)
            const callback__casted = callback_ as (AsyncCallback<JsMessageExt>)
            this.runJavaScriptExt1_serialize(script_casted, callback__casted)
            return
        }
        public createPdf(configuration: PdfConfiguration, callback_: AsyncCallback<PdfData>): void {
            const configuration_casted = configuration as (PdfConfiguration)
            const callback__casted = callback_ as (AsyncCallback<PdfData>)
            this.createPdf0_serialize(configuration_casted, callback__casted)
            return
        }
        public createPdf(configuration: PdfConfiguration): Promise<PdfData> {
            const configuration_casted = configuration as (PdfConfiguration)
            return this.createPdf1_serialize(configuration_casted)
        }
        public getUrl(): string {
            return this.getUrl_serialize()
        }
        public pageUp(top: boolean): void {
            const top_casted = top as (boolean)
            this.pageUp_serialize(top_casted)
            return
        }
        public pageDown(bottom: boolean): void {
            const bottom_casted = bottom as (boolean)
            this.pageDown_serialize(bottom_casted)
            return
        }
        public getOriginalUrl(): string {
            return this.getOriginalUrl_serialize()
        }
        public getFavicon(): image.PixelMap {
            return this.getFavicon_serialize()
        }
        public setNetworkAvailable(enable: boolean): void {
            const enable_casted = enable as (boolean)
            this.setNetworkAvailable_serialize(enable_casted)
            return
        }
        public hasImage(): Promise<boolean> {
            return this.hasImage0_serialize()
        }
        public hasImage(callback_: AsyncCallback<boolean>): void {
            const callback__casted = callback_ as (AsyncCallback<boolean>)
            this.hasImage1_serialize(callback__casted)
            return
        }
        public getBackForwardEntries(): BackForwardList {
            return this.getBackForwardEntries_serialize()
        }
        public removeCache(clearRom: boolean): void {
            const clearRom_casted = clearRom as (boolean)
            this.removeCache_serialize(clearRom_casted)
            return
        }
        public static removeAllCache(clearRom: boolean): void {
            const clearRom_casted = clearRom as (boolean)
            WebviewController.removeAllCache_serialize(clearRom_casted)
            return
        }
        public scrollTo(x: double, y: double, duration?: int32): void {
            const x_casted = x as (double)
            const y_casted = y as (double)
            const duration_casted = duration as (int32 | undefined)
            this.scrollTo_serialize(x_casted, y_casted, duration_casted)
            return
        }
        public scrollBy(deltaX: double, deltaY: double, duration?: int32): void {
            const deltaX_casted = deltaX as (double)
            const deltaY_casted = deltaY as (double)
            const duration_casted = duration as (int32 | undefined)
            this.scrollBy_serialize(deltaX_casted, deltaY_casted, duration_casted)
            return
        }
        public slideScroll(vx: double, vy: double): void {
            const vx_casted = vx as (double)
            const vy_casted = vy as (double)
            this.slideScroll_serialize(vx_casted, vy_casted)
            return
        }
        public serializeWebState(): ArrayBuffer {
            return this.serializeWebState_serialize()
        }
        public restoreWebState(state: ArrayBuffer): void {
            const state_casted = state as (ArrayBuffer)
            this.restoreWebState_serialize(state_casted)
            return
        }
        public static customizeSchemes(schemes: Array<WebCustomScheme>): void {
            const schemes_casted = schemes as (Array<WebCustomScheme>)
            WebviewController.customizeSchemes_serialize(schemes_casted)
            return
        }
        public getCertificate(): Promise<Array<cert.X509Cert>> {
            return this.getCertificate0_serialize()
        }
        public getCertificate(callback_: AsyncCallback<Array<cert.X509Cert>>): void {
            const callback__casted = callback_ as (AsyncCallback<Array<cert.X509Cert>>)
            this.getCertificate1_serialize(callback__casted)
            return
        }
        public setAudioMuted(mute: boolean): void {
            const mute_casted = mute as (boolean)
            this.setAudioMuted_serialize(mute_casted)
            return
        }
        public prefetchPage(url: string, additionalHeaders?: Array<WebHeader>): void {
            const url_casted = url as (string)
            const additionalHeaders_casted = additionalHeaders as (Array<WebHeader> | undefined)
            this.prefetchPage_serialize(url_casted, additionalHeaders_casted)
            return
        }
        public static prepareForPageLoad(url: string, preconnectable: boolean, numSockets: number): void {
            const url_casted = url as (string)
            const preconnectable_casted = preconnectable as (boolean)
            const numSockets_casted = numSockets as (number)
            WebviewController.prepareForPageLoad_serialize(url_casted, preconnectable_casted, numSockets_casted)
            return
        }
        public setCustomUserAgent(userAgent: string): void {
            const userAgent_casted = userAgent as (string)
            this.setCustomUserAgent_serialize(userAgent_casted)
            return
        }
        public getCustomUserAgent(): string {
            return this.getCustomUserAgent_serialize()
        }
        public static setConnectionTimeout(timeout: number): void {
            const timeout_casted = timeout as (number)
            WebviewController.setConnectionTimeout_serialize(timeout_casted)
            return
        }
        public setDownloadDelegate(delegate: WebDownloadDelegate): void {
            const delegate_casted = delegate as (WebDownloadDelegate)
            this.setDownloadDelegate_serialize(delegate_casted)
            return
        }
        public startDownload(url: string): void {
            const url_casted = url as (string)
            this.startDownload_serialize(url_casted)
            return
        }
        public postUrl(url: string, postData: ArrayBuffer): void {
            const url_casted = url as (string)
            const postData_casted = postData as (ArrayBuffer)
            this.postUrl_serialize(url_casted, postData_casted)
            return
        }
        public createWebPrintDocumentAdapter(jobName: string): print.PrintDocumentAdapter {
            const jobName_casted = jobName as (string)
            return this.createWebPrintDocumentAdapter_serialize(jobName_casted)
        }
        public getSecurityLevel(): SecurityLevel {
            return this.getSecurityLevel_serialize()
        }
        public isIncognitoMode(): boolean {
            return this.isIncognitoMode_serialize()
        }
        public setScrollable(enable: boolean, type?: ScrollType): void {
            const enable_casted = enable as (boolean)
            const type_casted = type as (ScrollType | undefined)
            this.setScrollable_serialize(enable_casted, type_casted)
            return
        }
        public getScrollable(): boolean {
            return this.getScrollable_serialize()
        }
        public setPrintBackground(enable: boolean): void {
            const enable_casted = enable as (boolean)
            this.setPrintBackground_serialize(enable_casted)
            return
        }
        public getPrintBackground(): boolean {
            return this.getPrintBackground_serialize()
        }
        public getLastJavascriptProxyCallingFrameUrl(): string {
            return this.getLastJavascriptProxyCallingFrameUrl_serialize()
        }
        public startCamera(): void {
            this.startCamera_serialize()
            return
        }
        public stopCamera(): void {
            this.stopCamera_serialize()
            return
        }
        public closeCamera(): void {
            this.closeCamera_serialize()
            return
        }
        public static pauseAllTimers(): void {
            WebviewController.pauseAllTimers_serialize()
            return
        }
        public static resumeAllTimers(): void {
            WebviewController.resumeAllTimers_serialize()
            return
        }
        public stopAllMedia(): void {
            this.stopAllMedia_serialize()
            return
        }
        public resumeAllMedia(): void {
            this.resumeAllMedia_serialize()
            return
        }
        public pauseAllMedia(): void {
            this.pauseAllMedia_serialize()
            return
        }
        public closeAllMediaPresentations(): void {
            this.closeAllMediaPresentations_serialize()
            return
        }
        public getMediaPlaybackState(): MediaPlaybackState {
            return this.getMediaPlaybackState_serialize()
        }
        public setWebSchemeHandler(scheme: string, handler: WebSchemeHandler): void {
            const scheme_casted = scheme as (string)
            const handler_casted = handler as (WebSchemeHandler)
            this.setWebSchemeHandler_serialize(scheme_casted, handler_casted)
            return
        }
        public clearWebSchemeHandler(): void {
            this.clearWebSchemeHandler_serialize()
            return
        }
        public static setServiceWorkerWebSchemeHandler(scheme: string, handler: WebSchemeHandler): void {
            const scheme_casted = scheme as (string)
            const handler_casted = handler as (WebSchemeHandler)
            WebviewController.setServiceWorkerWebSchemeHandler_serialize(scheme_casted, handler_casted)
            return
        }
        public static clearServiceWorkerWebSchemeHandler(): void {
            WebviewController.clearServiceWorkerWebSchemeHandler_serialize()
            return
        }
        public enableIntelligentTrackingPrevention(enable: boolean): void {
            const enable_casted = enable as (boolean)
            this.enableIntelligentTrackingPrevention_serialize(enable_casted)
            return
        }
        public isIntelligentTrackingPreventionEnabled(): boolean {
            return this.isIntelligentTrackingPreventionEnabled_serialize()
        }
        public static addIntelligentTrackingPreventionBypassingList(hostList: Array<string>): void {
            const hostList_casted = hostList as (Array<string>)
            WebviewController.addIntelligentTrackingPreventionBypassingList_serialize(hostList_casted)
            return
        }
        public static removeIntelligentTrackingPreventionBypassingList(hostList: Array<string>): void {
            const hostList_casted = hostList as (Array<string>)
            WebviewController.removeIntelligentTrackingPreventionBypassingList_serialize(hostList_casted)
            return
        }
        public static clearIntelligentTrackingPreventionBypassingList(): void {
            WebviewController.clearIntelligentTrackingPreventionBypassingList_serialize()
            return
        }
        public static getDefaultUserAgent(): string {
            return WebviewController.getDefaultUserAgent_serialize()
        }
        public onCreateNativeMediaPlayer(callback_: CreateNativeMediaPlayerCallback): void {
            const callback__casted = callback_ as (CreateNativeMediaPlayerCallback)
            this.onCreateNativeMediaPlayer_serialize(callback__casted)
            return
        }
        public static enableWholeWebPageDrawing(): void {
            WebviewController.enableWholeWebPageDrawing_serialize()
            return
        }
        public webPageSnapshot(info: SnapshotInfo, callback_: AsyncCallback<SnapshotResult>): void {
            const info_casted = info as (SnapshotInfo)
            const callback__casted = callback_ as (AsyncCallback<SnapshotResult>)
            this.webPageSnapshot_serialize(info_casted, callback__casted)
            return
        }
        public static prefetchResource(request: RequestInfo, additionalHeaders?: Array<WebHeader>, cacheKey?: string, cacheValidTime?: int32): void {
            const request_casted = request as (RequestInfo)
            const additionalHeaders_casted = additionalHeaders as (Array<WebHeader> | undefined)
            const cacheKey_casted = cacheKey as (string | undefined)
            const cacheValidTime_casted = cacheValidTime as (int32 | undefined)
            WebviewController.prefetchResource_serialize(request_casted, additionalHeaders_casted, cacheKey_casted, cacheValidTime_casted)
            return
        }
        public static clearPrefetchedResource(cacheKeyList: Array<string>): void {
            const cacheKeyList_casted = cacheKeyList as (Array<string>)
            WebviewController.clearPrefetchedResource_serialize(cacheKeyList_casted)
            return
        }
        public static setRenderProcessMode(mode: RenderProcessMode): void {
            const mode_casted = mode as (RenderProcessMode)
            WebviewController.setRenderProcessMode_serialize(mode_casted)
            return
        }
        public static getRenderProcessMode(): RenderProcessMode {
            return WebviewController.getRenderProcessMode_serialize()
        }
        public terminateRenderProcess(): boolean {
            return this.terminateRenderProcess_serialize()
        }
        public precompileJavaScript(url: string, script: string | ArrayBuffer, cacheOptions: CacheOptions): Promise<int32> {
            const url_casted = url as (string)
            const script_casted = script as (string | ArrayBuffer)
            const cacheOptions_casted = cacheOptions as (CacheOptions)
            return this.precompileJavaScript_serialize(url_casted, script_casted, cacheOptions_casted)
        }
        public static setHostIP(hostName: string, address: string, aliveTime: number): void {
            const hostName_casted = hostName as (string)
            const address_casted = address as (string)
            const aliveTime_casted = aliveTime as (number)
            WebviewController.setHostIP_serialize(hostName_casted, address_casted, aliveTime_casted)
            return
        }
        public static clearHostIP(hostName: string): void {
            const hostName_casted = hostName as (string)
            WebviewController.clearHostIP_serialize(hostName_casted)
            return
        }
        public static warmupServiceWorker(url: string): void {
            const url_casted = url as (string)
            WebviewController.warmupServiceWorker_serialize(url_casted)
            return
        }
        public injectOfflineResources(resourceMaps: Array<OfflineResourceMap>): void {
            const resourceMaps_casted = resourceMaps as (Array<OfflineResourceMap>)
            this.injectOfflineResources_serialize(resourceMaps_casted)
            return
        }
        public enableAdsBlock(enable: boolean): void {
            const enable_casted = enable as (boolean)
            this.enableAdsBlock_serialize(enable_casted)
            return
        }
        public isAdsBlockEnabled(): boolean {
            return this.isAdsBlockEnabled_serialize()
        }
        public isAdsBlockEnabledForCurPage(): boolean {
            return this.isAdsBlockEnabledForCurPage_serialize()
        }
        public getSurfaceId(): string {
            return this.getSurfaceId_serialize()
        }
        public setUrlTrustList(urlTrustList: string): void {
            const urlTrustList_casted = urlTrustList as (string)
            this.setUrlTrustList_serialize(urlTrustList_casted)
            return
        }
        public setPathAllowingUniversalAccess(pathList: Array<string>): void {
            const pathList_casted = pathList as (Array<string>)
            this.setPathAllowingUniversalAccess_serialize(pathList_casted)
            return
        }
        public static trimMemoryByPressureLevel(level: PressureLevel): void {
            const level_casted = level as (PressureLevel)
            WebviewController.trimMemoryByPressureLevel_serialize(level_casted)
            return
        }
        public static enableBackForwardCache(features?: BackForwardCacheSupportedFeatures): void {
            const features_casted = features as (BackForwardCacheSupportedFeatures | undefined)
            WebviewController.enableBackForwardCache_serialize(features_casted)
            return
        }
        public setBackForwardCacheOptions(options?: BackForwardCacheOptions): void {
            const options_casted = options as (BackForwardCacheOptions | undefined)
            this.setBackForwardCacheOptions_serialize(options_casted)
            return
        }
        public getScrollOffset(): ScrollOffset {
            return this.getScrollOffset_serialize()
        }
        public scrollByWithResult(deltaX: double, deltaY: double): boolean {
            const deltaX_casted = deltaX as (double)
            const deltaY_casted = deltaY as (double)
            return this.scrollByWithResult_serialize(deltaX_casted, deltaY_casted)
        }
        public getLastHitTest(): HitTestValue {
            return this.getLastHitTest_serialize()
        }
        public static setWebDebuggingAccess(webDebuggingAccess: boolean, port: number): void {
            const webDebuggingAccess_casted = webDebuggingAccess as (boolean)
            const port_casted = port as (number)
            WebviewController.setWebDebuggingAccess1_serialize(webDebuggingAccess_casted, port_casted)
            return
        }
        enableSafeBrowsing_serialize(enable: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_enableSafeBrowsing(this.peer!.ptr, enable ? 1 : 0)
        }
        isSafeBrowsingEnabled_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_isSafeBrowsingEnabled(this.peer!.ptr)
            return retval
        }
        accessForward_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_accessForward(this.peer!.ptr)
            return retval
        }
        accessBackward_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_accessBackward(this.peer!.ptr)
            return retval
        }
        accessStep_serialize(step: number): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_accessStep(this.peer!.ptr, step)
            return retval
        }
        forward_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_forward(this.peer!.ptr)
        }
        backward_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_backward(this.peer!.ptr)
        }
        clearHistory_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearHistory(this.peer!.ptr)
        }
        onActive_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_onActive(this.peer!.ptr)
        }
        onInactive_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_onInactive(this.peer!.ptr)
        }
        refresh_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_refresh(this.peer!.ptr)
        }
        loadData_serialize(data: string, mimeType: string, encoding: string, baseUrl?: string, historyUrl?: string): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (baseUrl !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const baseUrlTmpValue  = baseUrl!
                thisSerializer.writeString(baseUrlTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (historyUrl !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const historyUrlTmpValue  = historyUrl!
                thisSerializer.writeString(historyUrlTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_loadData(this.peer!.ptr, data, mimeType, encoding, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadUrl_serialize(url: string | object, headers?: Array<WebHeader>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (url instanceof string) {
                thisSerializer.writeInt8((0).toChar())
                const urlForIdx0  = url as string
                thisSerializer.writeString(urlForIdx0)
            } else if (url instanceof object) {
                thisSerializer.writeInt8((1).toChar())
                const urlForIdx1  = url as object
                thisSerializer.writeCustomObject('object', urlForIdx1)
            }
            if (headers !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const headersTmpValue  = headers!
                thisSerializer.writeInt32((headersTmpValue.length).toInt())
                for (let headersTmpValueCounterI = 0; headersTmpValueCounterI < headersTmpValue.length; headersTmpValueCounterI++) {
                    const headersTmpValueTmpElement : WebHeader = headersTmpValue[headersTmpValueCounterI]
                    webview_WebHeader_serializer.write(thisSerializer, headersTmpValueTmpElement)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_loadUrl(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        storeWebArchive0_serialize(baseName: string, autoName: boolean): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_storeWebArchive0(this.peer!.ptr, baseName, autoName ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        storeWebArchive1_serialize(baseName: string, autoName: boolean, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_storeWebArchive1(this.peer!.ptr, baseName, autoName ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        zoom_serialize(factor: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_zoom(this.peer!.ptr, factor)
        }
        zoomIn_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_zoomIn(this.peer!.ptr)
        }
        zoomOut_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_zoomOut(this.peer!.ptr)
        }
        getWebId_serialize(): int32 {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getWebId(this.peer!.ptr)
            return retval
        }
        getUserAgent_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getUserAgent(this.peer!.ptr)
            return retval
        }
        getTitle_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getTitle(this.peer!.ptr)
            return retval
        }
        getPageHeight_serialize(): int32 {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getPageHeight(this.peer!.ptr)
            return retval
        }
        backOrForward_serialize(step: number): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_backOrForward(this.peer!.ptr, step)
        }
        requestFocus_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_requestFocus(this.peer!.ptr)
        }
        createWebMessagePorts_serialize(isExtentionType?: boolean): Array<WebMessagePort> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (isExtentionType !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const isExtentionTypeTmpValue  = isExtentionType!
                thisSerializer.writeBoolean(isExtentionTypeTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_createWebMessagePorts(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<WebMessagePort> = new Array<WebMessagePort>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (webview_WebMessagePort_serializer.read(retvalDeserializer) as webview.WebMessagePort)
            }
            const returnResult : Array<WebMessagePort> = buffer
            return returnResult
        }
        postMessage_serialize(name: string, ports: Array<WebMessagePort>, uri: string): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((ports.length).toInt())
            for (let portsCounterI = 0; portsCounterI < ports.length; portsCounterI++) {
                const portsTmpElement : WebMessagePort = ports[portsCounterI]
                webview_WebMessagePort_serializer.write(thisSerializer, portsTmpElement)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_postMessage(this.peer!.ptr, name, thisSerializer.asBuffer(), thisSerializer.length(), uri)
            thisSerializer.release()
        }
        stop_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_stop(this.peer!.ptr)
        }
        registerJavaScriptProxy_serialize(jsObject: Object, name: string, methodList: Array<string>, asyncMethodList?: Array<string>, permission?: string): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteObject(jsObject)
            thisSerializer.writeInt32((methodList.length).toInt())
            for (let methodListCounterI = 0; methodListCounterI < methodList.length; methodListCounterI++) {
                const methodListTmpElement : string = methodList[methodListCounterI]
                thisSerializer.writeString(methodListTmpElement)
            }
            if (asyncMethodList !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const asyncMethodListTmpValue  = asyncMethodList!
                thisSerializer.writeInt32((asyncMethodListTmpValue.length).toInt())
                for (let asyncMethodListTmpValueCounterI = 0; asyncMethodListTmpValueCounterI < asyncMethodListTmpValue.length; asyncMethodListTmpValueCounterI++) {
                    const asyncMethodListTmpValueTmpElement : string = asyncMethodListTmpValue[asyncMethodListTmpValueCounterI]
                    thisSerializer.writeString(asyncMethodListTmpValueTmpElement)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (permission !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const permissionTmpValue  = permission!
                thisSerializer.writeString(permissionTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_registerJavaScriptProxy(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), name)
            thisSerializer.release()
        }
        deleteJavaScriptRegister_serialize(name: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_deleteJavaScriptRegister(this.peer!.ptr, name)
        }
        searchAllAsync_serialize(searchString: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_searchAllAsync(this.peer!.ptr, searchString)
        }
        clearMatches_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearMatches(this.peer!.ptr)
        }
        searchNext_serialize(forward: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_searchNext(this.peer!.ptr, forward ? 1 : 0)
        }
        clearSslCache_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearSslCache(this.peer!.ptr)
        }
        clearClientAuthenticationCache_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearClientAuthenticationCache(this.peer!.ptr)
        }
        runJavaScript0_serialize(script: string): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_runJavaScript0(this.peer!.ptr, script, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        runJavaScript1_serialize(script: string, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_runJavaScript1(this.peer!.ptr, script, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        runJavaScriptExt0_serialize(script: string | ArrayBuffer): Promise<JsMessageExt> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (script instanceof string) {
                thisSerializer.writeInt8((0).toChar())
                const scriptForIdx0  = script as string
                thisSerializer.writeString(scriptForIdx0)
            } else if (script instanceof ArrayBuffer) {
                thisSerializer.writeInt8((1).toChar())
                const scriptForIdx1  = script as ArrayBuffer
                thisSerializer.writeBuffer(scriptForIdx1)
            }
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<JsMessageExt>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_runJavaScriptExt0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        runJavaScriptExt1_serialize(script: string | ArrayBuffer, callback_: AsyncCallback<JsMessageExt>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (script instanceof string) {
                thisSerializer.writeInt8((0).toChar())
                const scriptForIdx0  = script as string
                thisSerializer.writeString(scriptForIdx0)
            } else if (script instanceof ArrayBuffer) {
                thisSerializer.writeInt8((1).toChar())
                const scriptForIdx1  = script as ArrayBuffer
                thisSerializer.writeBuffer(scriptForIdx1)
            }
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_runJavaScriptExt1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        createPdf0_serialize(configuration: PdfConfiguration, callback_: AsyncCallback<PdfData>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            webview_PdfConfiguration_serializer.write(thisSerializer, configuration)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_createPdf0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        createPdf1_serialize(configuration: PdfConfiguration): Promise<PdfData> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            webview_PdfConfiguration_serializer.write(thisSerializer, configuration)
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<PdfData>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_createPdf1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getUrl_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getUrl(this.peer!.ptr)
            return retval
        }
        pageUp_serialize(top: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_pageUp(this.peer!.ptr, top ? 1 : 0)
        }
        pageDown_serialize(bottom: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_pageDown(this.peer!.ptr, bottom ? 1 : 0)
        }
        getOriginalUrl_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getOriginalUrl(this.peer!.ptr)
            return retval
        }
        getFavicon_serialize(): image.PixelMap {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getFavicon(this.peer!.ptr)
            const obj : image.PixelMap = extractors.fromImagePixelMapPtr(retval)
            return obj
        }
        setNetworkAvailable_serialize(enable: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setNetworkAvailable(this.peer!.ptr, enable ? 1 : 0)
        }
        hasImage0_serialize(): Promise<boolean> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<boolean>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_hasImage0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        hasImage1_serialize(callback_: AsyncCallback<boolean>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_hasImage1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getBackForwardEntries_serialize(): BackForwardList {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getBackForwardEntries(this.peer!.ptr)
            const obj : BackForwardList = extractors.fromWebviewBackForwardListPtr(retval)
            return obj
        }
        removeCache_serialize(clearRom: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_removeCache(this.peer!.ptr, clearRom ? 1 : 0)
        }
        scrollTo_serialize(x: double, y: double, duration?: int32): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (duration !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const durationTmpValue  = duration!
                thisSerializer.writeInt32(durationTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_scrollTo(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        scrollBy_serialize(deltaX: double, deltaY: double, duration?: int32): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (duration !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const durationTmpValue  = duration!
                thisSerializer.writeInt32(durationTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_scrollBy(this.peer!.ptr, deltaX, deltaY, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        slideScroll_serialize(vx: double, vy: double): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_slideScroll(this.peer!.ptr, vx, vy)
        }
        serializeWebState_serialize(): ArrayBuffer {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_serializeWebState(this.peer!.ptr)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
        restoreWebState_serialize(state: ArrayBuffer): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(state)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_restoreWebState(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getCertificate0_serialize(): Promise<Array<cert.X509Cert>> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<Array<cert.X509Cert>>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getCertificate0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getCertificate1_serialize(callback_: AsyncCallback<Array<cert.X509Cert>>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getCertificate1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setAudioMuted_serialize(mute: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setAudioMuted(this.peer!.ptr, mute ? 1 : 0)
        }
        prefetchPage_serialize(url: string, additionalHeaders?: Array<WebHeader>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (additionalHeaders !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const additionalHeadersTmpValue  = additionalHeaders!
                thisSerializer.writeInt32((additionalHeadersTmpValue.length).toInt())
                for (let additionalHeadersTmpValueCounterI = 0; additionalHeadersTmpValueCounterI < additionalHeadersTmpValue.length; additionalHeadersTmpValueCounterI++) {
                    const additionalHeadersTmpValueTmpElement : WebHeader = additionalHeadersTmpValue[additionalHeadersTmpValueCounterI]
                    webview_WebHeader_serializer.write(thisSerializer, additionalHeadersTmpValueTmpElement)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_prefetchPage(this.peer!.ptr, url, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setCustomUserAgent_serialize(userAgent: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setCustomUserAgent(this.peer!.ptr, userAgent)
        }
        getCustomUserAgent_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getCustomUserAgent(this.peer!.ptr)
            return retval
        }
        setDownloadDelegate_serialize(delegate: WebDownloadDelegate): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setDownloadDelegate(this.peer!.ptr, extractors.toWebviewWebDownloadDelegatePtr(delegate))
        }
        startDownload_serialize(url: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_startDownload(this.peer!.ptr, url)
        }
        postUrl_serialize(url: string, postData: ArrayBuffer): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(postData)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_postUrl(this.peer!.ptr, url, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        createWebPrintDocumentAdapter_serialize(jobName: string): print.PrintDocumentAdapter {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_createWebPrintDocumentAdapter(this.peer!.ptr, jobName)
            const obj : print.PrintDocumentAdapter = extractors.fromPrintPrintDocumentAdapterPtr(retval)
            return obj
        }
        getSecurityLevel_serialize(): SecurityLevel {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getSecurityLevel(this.peer!.ptr)
            return TypeChecker.webview_SecurityLevel_FromNumeric(retval)
        }
        isIncognitoMode_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_isIncognitoMode(this.peer!.ptr)
            return retval
        }
        setScrollable_serialize(enable: boolean, type?: ScrollType): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (type !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const typeTmpValue  = (type as webview.ScrollType)
                thisSerializer.writeInt32(TypeChecker.webview_ScrollType_ToNumeric(typeTmpValue))
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setScrollable(this.peer!.ptr, enable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getScrollable_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getScrollable(this.peer!.ptr)
            return retval
        }
        setPrintBackground_serialize(enable: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setPrintBackground(this.peer!.ptr, enable ? 1 : 0)
        }
        getPrintBackground_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getPrintBackground(this.peer!.ptr)
            return retval
        }
        getLastJavascriptProxyCallingFrameUrl_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getLastJavascriptProxyCallingFrameUrl(this.peer!.ptr)
            return retval
        }
        startCamera_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_startCamera(this.peer!.ptr)
        }
        stopCamera_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_stopCamera(this.peer!.ptr)
        }
        closeCamera_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_closeCamera(this.peer!.ptr)
        }
        stopAllMedia_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_stopAllMedia(this.peer!.ptr)
        }
        resumeAllMedia_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_resumeAllMedia(this.peer!.ptr)
        }
        pauseAllMedia_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_pauseAllMedia(this.peer!.ptr)
        }
        closeAllMediaPresentations_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_closeAllMediaPresentations(this.peer!.ptr)
        }
        getMediaPlaybackState_serialize(): MediaPlaybackState {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getMediaPlaybackState(this.peer!.ptr)
            return TypeChecker.webview_MediaPlaybackState_FromNumeric(retval)
        }
        setWebSchemeHandler_serialize(scheme: string, handler: WebSchemeHandler): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setWebSchemeHandler(this.peer!.ptr, scheme, extractors.toWebviewWebSchemeHandlerPtr(handler))
        }
        clearWebSchemeHandler_serialize(): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_clearWebSchemeHandler(this.peer!.ptr)
        }
        enableIntelligentTrackingPrevention_serialize(enable: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_enableIntelligentTrackingPrevention(this.peer!.ptr, enable ? 1 : 0)
        }
        isIntelligentTrackingPreventionEnabled_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_isIntelligentTrackingPreventionEnabled(this.peer!.ptr)
            return retval
        }
        onCreateNativeMediaPlayer_serialize(callback_: CreateNativeMediaPlayerCallback): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_onCreateNativeMediaPlayer(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        webPageSnapshot_serialize(info: SnapshotInfo, callback_: AsyncCallback<SnapshotResult>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            webview_SnapshotInfo_serializer.write(thisSerializer, info)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_webPageSnapshot(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        terminateRenderProcess_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_terminateRenderProcess(this.peer!.ptr)
            return retval
        }
        precompileJavaScript_serialize(url: string, script: string | ArrayBuffer, cacheOptions: CacheOptions): Promise<int32> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (script instanceof string) {
                thisSerializer.writeInt8((0).toChar())
                const scriptForIdx0  = script as string
                thisSerializer.writeString(scriptForIdx0)
            } else if (script instanceof ArrayBuffer) {
                thisSerializer.writeInt8((1).toChar())
                const scriptForIdx1  = script as ArrayBuffer
                thisSerializer.writeBuffer(scriptForIdx1)
            }
            webview_CacheOptions_serializer.write(thisSerializer, cacheOptions)
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<int32>()[0]
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_precompileJavaScript(this.peer!.ptr, url, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        injectOfflineResources_serialize(resourceMaps: Array<OfflineResourceMap>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((resourceMaps.length).toInt())
            for (let resourceMapsCounterI = 0; resourceMapsCounterI < resourceMaps.length; resourceMapsCounterI++) {
                const resourceMapsTmpElement : OfflineResourceMap = resourceMaps[resourceMapsCounterI]
                webview_OfflineResourceMap_serializer.write(thisSerializer, resourceMapsTmpElement)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_injectOfflineResources(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        enableAdsBlock_serialize(enable: boolean): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_enableAdsBlock(this.peer!.ptr, enable ? 1 : 0)
        }
        isAdsBlockEnabled_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_isAdsBlockEnabled(this.peer!.ptr)
            return retval
        }
        isAdsBlockEnabledForCurPage_serialize(): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_isAdsBlockEnabledForCurPage(this.peer!.ptr)
            return retval
        }
        getSurfaceId_serialize(): string {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getSurfaceId(this.peer!.ptr)
            return retval
        }
        setUrlTrustList_serialize(urlTrustList: string): void {
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setUrlTrustList(this.peer!.ptr, urlTrustList)
        }
        setPathAllowingUniversalAccess_serialize(pathList: Array<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((pathList.length).toInt())
            for (let pathListCounterI = 0; pathListCounterI < pathList.length; pathListCounterI++) {
                const pathListTmpElement : string = pathList[pathListCounterI]
                thisSerializer.writeString(pathListTmpElement)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setPathAllowingUniversalAccess(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setBackForwardCacheOptions_serialize(options?: BackForwardCacheOptions): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (options !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const optionsTmpValue  = options!
                webview_BackForwardCacheOptions_serializer.write(thisSerializer, optionsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_setBackForwardCacheOptions(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getScrollOffset_serialize(): ScrollOffset {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getScrollOffset(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : ScrollOffset = webview_ScrollOffset_serializer.read(retvalDeserializer)
            return returnResult
        }
        scrollByWithResult_serialize(deltaX: double, deltaY: double): boolean {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_scrollByWithResult(this.peer!.ptr, deltaX, deltaY)
            return retval
        }
        getLastHitTest_serialize(): HitTestValue {
            const retval  = OHOS_WEB_WEBVIEWNativeModule._webview_WebviewController_getLastHitTest(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : HitTestValue = webview_HitTestValue_serializer.read(retvalDeserializer)
            return returnResult
        }
    }
    export interface WebHeader {
        headerKey: string;
        headerValue: string;
    }
    export enum WebHitTestType {
        EDIT_TEXT = 0,
        EditText = 0,
        EMAIL = 1,
        Email = 1,
        HTTP_ANCHOR = 2,
        HttpAnchor = 2,
        HTTP_ANCHOR_IMG = 3,
        HttpAnchorImg = 3,
        IMG = 4,
        Img = 4,
        MAP = 5,
        Map = 5,
        PHONE = 6,
        Phone = 6,
        UNKNOWN = 7,
        Unknown = 7
    }
    export enum SecureDnsMode {
        OFF = 0,
        AUTO = 1,
        SECURE_ONLY = 2
    }
    export enum SecurityLevel {
        NONE = 0,
        SECURE = 1,
        WARNING = 2,
        DANGEROUS = 3
    }
    export enum MediaPlaybackState {
        NONE = 0,
        PLAYING = 1,
        PAUSED = 2,
        STOPPED = 3
    }
    export enum PressureLevel {
        MEMORY_PRESSURE_LEVEL_MODERATE = 1,
        MEMORY_PRESSURE_LEVEL_CRITICAL = 2
    }
    export interface HitTestValue {
        type: webview.WebHitTestType;
        extra: string;
    }
    export interface WebCustomScheme {
        schemeName: string;
        isSupportCORS: boolean;
        isSupportFetch: boolean;
        isStandard?: boolean;
        isLocal?: boolean;
        isDisplayIsolated?: boolean;
        isSecure?: boolean;
        isCspBypassing?: boolean;
        isCodeCacheSupported?: boolean;
    }
    export interface PdfConfiguration {
        width: double;
        height: double;
        marginTop: double;
        marginBottom: double;
        marginRight: double;
        marginLeft: double;
        scale?: double;
        shouldPrintBackground?: boolean;
    }
    export interface RequestInfo {
        url: string;
        method: string;
        formData: string;
    }
    export interface ScrollOffset {
        x: double;
        y: double;
    }
    export enum WebMessageType {
        NOT_SUPPORT = 0,
        STRING = 1,
        NUMBER = 2,
        BOOLEAN = 3,
        ARRAY_BUFFER = 4,
        ARRAY = 5,
        ERROR = 6
    }
    export type WebMessage = ArrayBuffer | string;
    export interface HistoryItem {
        icon: image.PixelMap;
        historyUrl: string;
        historyRawUrl: string;
        title: string;
    }
    export interface SnapshotInfo {
        id?: string;
    }
    export interface SnapshotResult {
        id?: string;
        status?: boolean;
        imagePixelMap?: image.PixelMap;
    }
    export enum JsMessageType {
        NOT_SUPPORT = 0,
        STRING = 1,
        NUMBER = 2,
        BOOLEAN = 3,
        ARRAY_BUFFER = 4,
        ARRAY = 5
    }
    export enum RenderProcessMode {
        SINGLE = 0,
        MULTIPLE = 1
    }
    export interface CacheOptions {
        responseHeaders: Array<webview.WebHeader>;
    }
    export enum OfflineResourceType {
        IMAGE = 0,
        CSS = 1,
        CLASSIC_JS = 2,
        MODULE_JS = 3
    }
    export interface OfflineResourceMap {
        urlList: Array<string>;
        resource: ArrayBuffer;
        responseHeaders: Array<webview.WebHeader>;
        type: webview.OfflineResourceType;
    }
    export enum ScrollType {
        EVENT = 0
    }
    export enum WebDownloadState {
        IN_PROGRESS = 0,
        COMPLETED = 1,
        CANCELED = 2,
        INTERRUPTED = 3,
        PENDING = 4,
        PAUSED = 5,
        UNKNOWN = 6
    }
    export enum WebDownloadErrorCode {
        ERROR_UNKNOWN = 0,
        FILE_FAILED = 1,
        FILE_ACCESS_DENIED = 2,
        FILE_NO_SPACE = 3,
        FILE_NAME_TOO_LONG = 5,
        FILE_TOO_LARGE = 6,
        FILE_TRANSIENT_ERROR = 10,
        FILE_BLOCKED = 11,
        FILE_TOO_SHORT = 13,
        FILE_HASH_MISMATCH = 14,
        FILE_SAME_AS_SOURCE = 15,
        NETWORK_FAILED = 20,
        NETWORK_TIMEOUT = 21,
        NETWORK_DISCONNECTED = 22,
        NETWORK_SERVER_DOWN = 23,
        NETWORK_INVALID_REQUEST = 24,
        SERVER_FAILED = 30,
        SERVER_NO_RANGE = 31,
        SERVER_BAD_CONTENT = 33,
        SERVER_UNAUTHORIZED = 34,
        SERVER_CERT_PROBLEM = 35,
        SERVER_FORBIDDEN = 36,
        SERVER_UNREACHABLE = 37,
        SERVER_CONTENT_LENGTH_MISMATCH = 38,
        SERVER_CROSS_ORIGIN_REDIRECT = 39,
        USER_CANCELED = 40,
        USER_SHUTDOWN = 41,
        CRASH = 50
    }
    export enum WebResourceType {
        MAIN_FRAME = 0,
        SUB_FRAME = 1,
        STYLE_SHEET = 2,
        SCRIPT = 3,
        IMAGE = 4,
        FONT_RESOURCE = 5,
        SUB_RESOURCE = 6,
        OBJECT = 7,
        MEDIA = 8,
        WORKER = 9,
        SHARED_WORKER = 10,
        PREFETCH = 11,
        FAVICON = 12,
        XHR = 13,
        PING = 14,
        SERVICE_WORKER = 15,
        CSP_REPORT = 16,
        PLUGIN_RESOURCE = 17,
        NAVIGATION_PRELOAD_MAIN_FRAME = 19,
        NAVIGATION_PRELOAD_SUB_FRAME = 20
    }
    export enum PlaybackStatus {
        PAUSED = 0,
        PLAYING = 1
    }
    export enum NetworkState {
        EMPTY = 0,
        IDLE = 1,
        LOADING = 2,
        NETWORK_ERROR = 3
    }
    export enum ReadyState {
        HAVE_NOTHING = 0,
        HAVE_METADATA = 1,
        HAVE_CURRENT_DATA = 2,
        HAVE_FUTURE_DATA = 3,
        HAVE_ENOUGH_DATA = 4
    }
    export enum MediaError {
        NETWORK_ERROR = 1,
        FORMAT_ERROR = 2,
        DECODE_ERROR = 3
    }
    export enum SuspendType {
        ENTER_BACK_FORWARD_CACHE = 0,
        ENTER_BACKGROUND = 1,
        AUTO_CLEANUP = 2
    }
    export type ResumePlayerFn = () => void;
    export type SuspendPlayerFn = (type: webview.SuspendType) => void;
    export enum MediaType {
        VIDEO = 0,
        AUDIO = 1
    }
    export enum SourceType {
        URL = 0,
        MSE = 1
    }
    export interface RectEvent {
        x: double;
        y: double;
        width: double;
        height: double;
    }
    export enum Preload {
        NONE = 0,
        METADATA = 1,
        AUTO = 2
    }
    export interface MediaInfo {
        embedID: string;
        mediaType: webview.MediaType;
        mediaSrcList: Array<webview.MediaSourceInfo>;
        surfaceInfo: webview.NativeMediaPlayerSurfaceInfo;
        controlsShown: boolean;
        controlList: Array<string>;
        muted: boolean;
        posterUrl: string;
        preload: webview.Preload;
        headers: Map<string, string>;
        attributes: Map<string, string>;
    }
    export type CreateNativeMediaPlayerCallback = (handler: webview.NativeMediaPlayerHandler, mediaInfo: webview.MediaInfo) => webview.NativeMediaPlayerBridge;
}
