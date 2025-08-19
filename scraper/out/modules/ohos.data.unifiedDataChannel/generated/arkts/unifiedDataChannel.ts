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
import { TypeChecker, OHOS_DATA_UNIFIEDDATACHANNELNativeModule, unifiedDataChannel_UnifiedRecord_serializer, image_PixelMap_serializer, Want_serializer } from "./ohos.data.unifiedDataChannel.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { extractors } from "#handwritten"
import { default as image } from "@ohos.multimedia.image"
import { Want } from "@ohos.app.ability.Want"
export default unifiedDataChannel
export namespace unifiedDataChannel {
    export class SummaryInternal {
        public static fromPtr(ptr: KPointer): unifiedDataChannel.Summary {
            return new unifiedDataChannel.Summary(ptr)
        }
    }
    export class Summary implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get summary(): Map<string, number> {
            return this.getSummary()
        }
        set summary(summary: Map<string, number>) {
            this.setSummary(summary)
        }
        get totalSize(): number {
            return this.getTotalSize()
        }
        set totalSize(totalSize: number) {
            this.setTotalSize(totalSize)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, Summary.getFinalizer())
        }
        constructor() {
            this(Summary.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_Summary_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_Summary_getFinalizer()
        }
        private getSummary(): Map<string, number> {
            return this.getSummary_serialize()
        }
        private setSummary(summary: Map<string, number>): void {
            const summary_casted = summary as (Map<string, number>)
            this.setSummary_serialize(summary_casted)
            return
        }
        private getTotalSize(): number {
            return this.getTotalSize_serialize()
        }
        private setTotalSize(totalSize: number): void {
            const totalSize_casted = totalSize as (number)
            this.setTotalSize_serialize(totalSize_casted)
            return
        }
        private getSummary_serialize(): Map<string, number> {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_Summary_getSummary(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferSizeVar : int32 = retvalDeserializer.readInt32()
            let buffer : Map<string, number> = new Map<string, number>()
            // TODO: TS map resize
            for (let bufferIVar = 0; bufferIVar < bufferSizeVar; bufferIVar++) {
                const bufferKeyVar : string = (retvalDeserializer.readString() as string)
                const bufferValueVar : number = (retvalDeserializer.readNumber() as number)
                buffer.set(bufferKeyVar, bufferValueVar)
            }
            const returnResult : Map<string, number> = buffer
            return returnResult
        }
        private setSummary_serialize(summary: Map<string, number>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((summary.size).toInt())
            for (const pair of summary) {
                const summaryKeyVar = pair[0]
                const summaryValueVar = pair[1]
                thisSerializer.writeString(summaryKeyVar)
                thisSerializer.writeNumber(summaryValueVar)
            }
            OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_Summary_setSummary(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        private getTotalSize_serialize(): number {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_Summary_getTotalSize(this.peer!.ptr)
            return retval
        }
        private setTotalSize_serialize(totalSize: number): void {
            OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_Summary_setTotalSize(this.peer!.ptr, totalSize)
        }
    }
    export class UnifiedDataInternal {
        public static fromPtr(ptr: KPointer): unifiedDataChannel.UnifiedData {
            return new unifiedDataChannel.UnifiedData(false, ptr)
        }
    }
    export class UnifiedData implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(_0: boolean, peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, UnifiedData.getFinalizer())
        }
        constructor(record_: UnifiedRecord) {
            this(false, UnifiedData.construct0(record_))
        }
        constructor() {
            this(false, UnifiedData.construct1())
        }
        static construct0(record_: UnifiedRecord): KPointer {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedData_construct0(extractors.toUnifiedDataChannelUnifiedRecordPtr(record_))
            return retval
        }
        static construct1(): KPointer {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedData_construct1()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedData_getFinalizer()
        }
        public addRecord(record_: UnifiedRecord): void {
            const record__casted = record_ as (UnifiedRecord)
            this.addRecord_serialize(record__casted)
            return
        }
        public getRecords(): Array<UnifiedRecord> {
            return this.getRecords_serialize()
        }
        addRecord_serialize(record_: UnifiedRecord): void {
            OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedData_addRecord(this.peer!.ptr, extractors.toUnifiedDataChannelUnifiedRecordPtr(record_))
        }
        getRecords_serialize(): Array<UnifiedRecord> {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedData_getRecords(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<UnifiedRecord> = new Array<UnifiedRecord>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (unifiedDataChannel_UnifiedRecord_serializer.read(retvalDeserializer) as unifiedDataChannel.UnifiedRecord)
            }
            const returnResult : Array<UnifiedRecord> = buffer
            return returnResult
        }
    }
    export class UnifiedRecordInternal {
        public static fromPtr(ptr: KPointer): unifiedDataChannel.UnifiedRecord {
            return new unifiedDataChannel.UnifiedRecord(false, false, ptr)
        }
    }
    export class UnifiedRecord implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(_0: boolean, _1: boolean, peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, UnifiedRecord.getFinalizer())
        }
        constructor() {
            this(false, false, UnifiedRecord.construct0())
        }
        constructor(type: string, value: ValueType) {
            this(false, false, UnifiedRecord.construct1(type, value))
        }
        static construct0(): KPointer {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedRecord_construct0()
            return retval
        }
        static construct1(type: string, value: ValueType): KPointer {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (value !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const valueTmpValue  = value!
                if (valueTmpValue instanceof number) {
                    thisSerializer.writeInt8((0).toChar())
                    const valueTmpValueForIdx0  = valueTmpValue as number
                    thisSerializer.writeNumber(valueTmpValueForIdx0)
                } else if (valueTmpValue instanceof string) {
                    thisSerializer.writeInt8((1).toChar())
                    const valueTmpValueForIdx1  = valueTmpValue as string
                    thisSerializer.writeString(valueTmpValueForIdx1)
                } else if (valueTmpValue instanceof boolean) {
                    thisSerializer.writeInt8((2).toChar())
                    const valueTmpValueForIdx2  = valueTmpValue as boolean
                    thisSerializer.writeBoolean(valueTmpValueForIdx2)
                } else if (valueTmpValue instanceof image.PixelMap) {
                    thisSerializer.writeInt8((3).toChar())
                    const valueTmpValueForIdx3  = valueTmpValue as image.PixelMap
                    image_PixelMap_serializer.write(thisSerializer, valueTmpValueForIdx3)
                } else if (valueTmpValue instanceof Want) {
                    thisSerializer.writeInt8((4).toChar())
                    const valueTmpValueForIdx4  = valueTmpValue as Want
                    Want_serializer.write(thisSerializer, valueTmpValueForIdx4)
                } else if (valueTmpValue instanceof ArrayBuffer) {
                    thisSerializer.writeInt8((5).toChar())
                    const valueTmpValueForIdx5  = valueTmpValue as ArrayBuffer
                    thisSerializer.writeBuffer(valueTmpValueForIdx5)
                } else if (valueTmpValue instanceof object) {
                    thisSerializer.writeInt8((6).toChar())
                    const valueTmpValueForIdx6  = valueTmpValue as object
                    thisSerializer.holdAndWriteObject(valueTmpValueForIdx6)
                }
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedRecord_construct1(type, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedRecord_getFinalizer()
        }
        public getType(): string {
            return this.getType_serialize()
        }
        public getValue(): ValueType {
            return this.getValue_serialize()
        }
        getType_serialize(): string {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedRecord_getType(this.peer!.ptr)
            return retval
        }
        getValue_serialize(): ValueType {
            const retval  = OHOS_DATA_UNIFIEDDATACHANNELNativeModule._unifiedDataChannel_UnifiedRecord_getValue(this.peer!.ptr)
            throw new Error("Object deserialization is not implemented.")
        }
    }
    export type ValueType = number | string | boolean | image.PixelMap | Want | ArrayBuffer | Object | undefined;
}
