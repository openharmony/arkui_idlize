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

import { extractors } from "#handwritten"
import { TypeChecker, OHOS_RPCNativeModule, rpc_Parcelable_serializer } from "./ohos.rpc.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { AsyncCallback, BusinessError } from "@ohos.base"
export default rpc
export namespace rpc {
    export class AshmemInternal {
        public static fromPtr(ptr: KPointer): rpc.Ashmem {
            return new rpc.Ashmem(ptr)
        }
    }
    export class Ashmem implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, Ashmem.getFinalizer())
        }
        constructor() {
            this(Ashmem.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RPCNativeModule._rpc_Ashmem_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RPCNativeModule._rpc_Ashmem_getFinalizer()
        }
        static create0_serialize(name: string, size: int32): Ashmem {
            const retval  = OHOS_RPCNativeModule._rpc_Ashmem_create0(name, size)
            const obj : Ashmem = extractors.fromRpcAshmemPtr(retval)
            return obj
        }
        static create1_serialize(ashmem: Ashmem): Ashmem {
            const retval  = OHOS_RPCNativeModule._rpc_Ashmem_create1(extractors.toRpcAshmemPtr(ashmem))
            const obj : Ashmem = extractors.fromRpcAshmemPtr(retval)
            return obj
        }
        public static create(name: string, size: int32): Ashmem {
            const name_casted = name as (string)
            const size_casted = size as (int32)
            return Ashmem.create0_serialize(name_casted, size_casted)
        }
        public static create(ashmem: Ashmem): Ashmem {
            const ashmem_casted = ashmem as (Ashmem)
            return Ashmem.create1_serialize(ashmem_casted)
        }
        public getAshmemSize(): int32 {
            return this.getAshmemSize_serialize()
        }
        public mapReadWriteAshmem(): void {
            this.mapReadWriteAshmem_serialize()
            return
        }
        getAshmemSize_serialize(): int32 {
            const retval  = OHOS_RPCNativeModule._rpc_Ashmem_getAshmemSize(this.peer!.ptr)
            return retval
        }
        mapReadWriteAshmem_serialize(): void {
            OHOS_RPCNativeModule._rpc_Ashmem_mapReadWriteAshmem(this.peer!.ptr)
        }
    }
    export interface DeathRecipient {
        onRemoteDied(): void
    }
    export class DeathRecipientInternal implements MaterializedBase,DeathRecipient {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, DeathRecipientInternal.getFinalizer())
        }
        constructor() {
            this(DeathRecipientInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RPCNativeModule._rpc_DeathRecipient_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RPCNativeModule._rpc_DeathRecipient_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): DeathRecipientInternal {
            return new DeathRecipientInternal(ptr)
        }
        public onRemoteDied(): void {
            this.onRemoteDied_serialize()
            return
        }
        onRemoteDied_serialize(): void {
            OHOS_RPCNativeModule._rpc_DeathRecipient_onRemoteDied(this.peer!.ptr)
        }
    }
    export class IRemoteObjectInternal {
        public static fromPtr(ptr: KPointer): rpc.IRemoteObject {
            return new rpc.IRemoteObject(ptr)
        }
    }
    export class IRemoteObject implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, IRemoteObject.getFinalizer())
        }
        constructor() {
            this(IRemoteObject.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RPCNativeModule._rpc_IRemoteObject_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RPCNativeModule._rpc_IRemoteObject_getFinalizer()
        }
        public sendMessageRequest(code: int32, data: MessageSequence, reply: MessageSequence, options: MessageOption): Promise<RequestResult> {
            const code_casted = code as (int32)
            const data_casted = data as (MessageSequence)
            const reply_casted = reply as (MessageSequence)
            const options_casted = options as (MessageOption)
            return this.sendMessageRequest0_serialize(code_casted, data_casted, reply_casted, options_casted)
        }
        public sendMessageRequest(code: int32, data: MessageSequence, reply: MessageSequence, options: MessageOption, callback_: AsyncCallback<RequestResult>): void {
            const code_casted = code as (int32)
            const data_casted = data as (MessageSequence)
            const reply_casted = reply as (MessageSequence)
            const options_casted = options as (MessageOption)
            const callback__casted = callback_ as (AsyncCallback<RequestResult>)
            this.sendMessageRequest1_serialize(code_casted, data_casted, reply_casted, options_casted, callback__casted)
            return
        }
        public registerDeathRecipient(recipient: DeathRecipient, flags: int32): void {
            const recipient_casted = recipient as (DeathRecipient)
            const flags_casted = flags as (int32)
            this.registerDeathRecipient_serialize(recipient_casted, flags_casted)
            return
        }
        public unregisterDeathRecipient(recipient: DeathRecipient, flags: int32): void {
            const recipient_casted = recipient as (DeathRecipient)
            const flags_casted = flags as (int32)
            this.unregisterDeathRecipient_serialize(recipient_casted, flags_casted)
            return
        }
        public getDescriptor(): string {
            return this.getDescriptor_serialize()
        }
        public isObjectDead(): boolean {
            return this.isObjectDead_serialize()
        }
        sendMessageRequest0_serialize(code: int32, data: MessageSequence, reply: MessageSequence, options: MessageOption): Promise<RequestResult> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<RequestResult>()[0]
            OHOS_RPCNativeModule._rpc_IRemoteObject_sendMessageRequest0(this.peer!.ptr, code, extractors.toRpcMessageSequencePtr(data), extractors.toRpcMessageSequencePtr(reply), extractors.toRpcMessageOptionPtr(options), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        sendMessageRequest1_serialize(code: int32, data: MessageSequence, reply: MessageSequence, options: MessageOption, callback_: AsyncCallback<RequestResult>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RPCNativeModule._rpc_IRemoteObject_sendMessageRequest1(this.peer!.ptr, code, extractors.toRpcMessageSequencePtr(data), extractors.toRpcMessageSequencePtr(reply), extractors.toRpcMessageOptionPtr(options), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        registerDeathRecipient_serialize(recipient: DeathRecipient, flags: int32): void {
            OHOS_RPCNativeModule._rpc_IRemoteObject_registerDeathRecipient(this.peer!.ptr, extractors.toRpcDeathRecipientPtr(recipient), flags)
        }
        unregisterDeathRecipient_serialize(recipient: DeathRecipient, flags: int32): void {
            OHOS_RPCNativeModule._rpc_IRemoteObject_unregisterDeathRecipient(this.peer!.ptr, extractors.toRpcDeathRecipientPtr(recipient), flags)
        }
        getDescriptor_serialize(): string {
            const retval  = OHOS_RPCNativeModule._rpc_IRemoteObject_getDescriptor(this.peer!.ptr)
            return retval
        }
        isObjectDead_serialize(): boolean {
            const retval  = OHOS_RPCNativeModule._rpc_IRemoteObject_isObjectDead(this.peer!.ptr)
            return retval
        }
    }
    export class MessageOptionInternal {
        public static fromPtr(ptr: KPointer): rpc.MessageOption {
            return new rpc.MessageOption(false, false, ptr)
        }
    }
    export class MessageOption implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        static get TF_SYNC(): int32 {
            return MessageOption.getTF_SYNC()
        }
        static set TF_SYNC(TF_SYNC: int32) {
            MessageOption.setTF_SYNC(TF_SYNC)
        }
        static get TF_ASYNC(): int32 {
            return MessageOption.getTF_ASYNC()
        }
        static set TF_ASYNC(TF_ASYNC: int32) {
            MessageOption.setTF_ASYNC(TF_ASYNC)
        }
        static get TF_WAIT_TIME(): int32 {
            return MessageOption.getTF_WAIT_TIME()
        }
        static set TF_WAIT_TIME(TF_WAIT_TIME: int32) {
            MessageOption.setTF_WAIT_TIME(TF_WAIT_TIME)
        }
        constructor(_0: boolean, _1: boolean, peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, MessageOption.getFinalizer())
        }
        constructor(syncFlags?: int32, waitTime?: int32) {
            this(false, false, MessageOption.construct0(syncFlags, waitTime))
        }
        constructor(isAsync: boolean) {
            this(false, false, MessageOption.construct1(isAsync))
        }
        static construct0(syncFlags?: int32, waitTime?: int32): KPointer {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (syncFlags !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const syncFlagsTmpValue  = syncFlags!
                thisSerializer.writeInt32(syncFlagsTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (waitTime !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const waitTimeTmpValue  = waitTime!
                thisSerializer.writeInt32(waitTimeTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RPCNativeModule._rpc_MessageOption_construct0(thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        static construct1(isAsync: boolean): KPointer {
            const retval  = OHOS_RPCNativeModule._rpc_MessageOption_construct1(isAsync ? 1 : 0)
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RPCNativeModule._rpc_MessageOption_getFinalizer()
        }
        private static getTF_SYNC_serialize(): int32 {
            const retval  = OHOS_RPCNativeModule._rpc_MessageOption_getTF_SYNC()
            return retval
        }
        private static setTF_SYNC_serialize(TF_SYNC: int32): void {
            OHOS_RPCNativeModule._rpc_MessageOption_setTF_SYNC(TF_SYNC)
        }
        private static getTF_ASYNC_serialize(): int32 {
            const retval  = OHOS_RPCNativeModule._rpc_MessageOption_getTF_ASYNC()
            return retval
        }
        private static setTF_ASYNC_serialize(TF_ASYNC: int32): void {
            OHOS_RPCNativeModule._rpc_MessageOption_setTF_ASYNC(TF_ASYNC)
        }
        private static getTF_WAIT_TIME_serialize(): int32 {
            const retval  = OHOS_RPCNativeModule._rpc_MessageOption_getTF_WAIT_TIME()
            return retval
        }
        private static setTF_WAIT_TIME_serialize(TF_WAIT_TIME: int32): void {
            OHOS_RPCNativeModule._rpc_MessageOption_setTF_WAIT_TIME(TF_WAIT_TIME)
        }
        public isAsync(): boolean {
            return this.isAsync_serialize()
        }
        public setAsync(isAsync: boolean): void {
            const isAsync_casted = isAsync as (boolean)
            this.setAsync_serialize(isAsync_casted)
            return
        }
        private static getTF_SYNC(): int32 {
            return MessageOption.getTF_SYNC_serialize()
        }
        private static setTF_SYNC(TF_SYNC: int32): void {
            const TF_SYNC_casted = TF_SYNC as (int32)
            MessageOption.setTF_SYNC_serialize(TF_SYNC_casted)
            return
        }
        private static getTF_ASYNC(): int32 {
            return MessageOption.getTF_ASYNC_serialize()
        }
        private static setTF_ASYNC(TF_ASYNC: int32): void {
            const TF_ASYNC_casted = TF_ASYNC as (int32)
            MessageOption.setTF_ASYNC_serialize(TF_ASYNC_casted)
            return
        }
        private static getTF_WAIT_TIME(): int32 {
            return MessageOption.getTF_WAIT_TIME_serialize()
        }
        private static setTF_WAIT_TIME(TF_WAIT_TIME: int32): void {
            const TF_WAIT_TIME_casted = TF_WAIT_TIME as (int32)
            MessageOption.setTF_WAIT_TIME_serialize(TF_WAIT_TIME_casted)
            return
        }
        isAsync_serialize(): boolean {
            const retval  = OHOS_RPCNativeModule._rpc_MessageOption_isAsync(this.peer!.ptr)
            return retval
        }
        setAsync_serialize(isAsync: boolean): void {
            OHOS_RPCNativeModule._rpc_MessageOption_setAsync(this.peer!.ptr, isAsync ? 1 : 0)
        }
    }
    export class MessageSequenceInternal {
        public static fromPtr(ptr: KPointer): rpc.MessageSequence {
            return new rpc.MessageSequence(ptr)
        }
    }
    export class MessageSequence implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, MessageSequence.getFinalizer())
        }
        constructor() {
            this(MessageSequence.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RPCNativeModule._rpc_MessageSequence_getFinalizer()
        }
        static create_serialize(): MessageSequence {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_create()
            const obj : MessageSequence = extractors.fromRpcMessageSequencePtr(retval)
            return obj
        }
        static closeFileDescriptor_serialize(fd: int32): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_closeFileDescriptor(fd)
        }
        public static create(): MessageSequence {
            return MessageSequence.create_serialize()
        }
        public reclaim(): void {
            this.reclaim_serialize()
            return
        }
        public writeRemoteObject(obj: IRemoteObject): void {
            const obj_casted = obj as (IRemoteObject)
            this.writeRemoteObject_serialize(obj_casted)
            return
        }
        public readRemoteObject(): IRemoteObject {
            return this.readRemoteObject_serialize()
        }
        public writeInterfaceToken(token: string): void {
            const token_casted = token as (string)
            this.writeInterfaceToken_serialize(token_casted)
            return
        }
        public readInterfaceToken(): string {
            return this.readInterfaceToken_serialize()
        }
        public getCapacity(): int32 {
            return this.getCapacity_serialize()
        }
        public setCapacity(size: int32): void {
            const size_casted = size as (int32)
            this.setCapacity_serialize(size_casted)
            return
        }
        public writeNoException(): void {
            this.writeNoException_serialize()
            return
        }
        public readException(): void {
            this.readException_serialize()
            return
        }
        public writeInt(val: int32): void {
            const val_casted = val as (int32)
            this.writeInt_serialize(val_casted)
            return
        }
        public writeLong(val: int64): void {
            const val_casted = val as (int64)
            this.writeLong_serialize(val_casted)
            return
        }
        public writeBoolean(val: boolean): void {
            const val_casted = val as (boolean)
            this.writeBoolean_serialize(val_casted)
            return
        }
        public writeString(val: string): void {
            const val_casted = val as (string)
            this.writeString_serialize(val_casted)
            return
        }
        public writeParcelable(val: Parcelable): void {
            const val_casted = val as (Parcelable)
            this.writeParcelable_serialize(val_casted)
            return
        }
        public writeByteArray(byteArray: KInt32ArrayPtr): void {
            const byteArray_casted = byteArray as (KInt32ArrayPtr)
            this.writeByteArray_serialize(byteArray_casted)
            return
        }
        public writeIntArray(intArray: KInt32ArrayPtr): void {
            const intArray_casted = intArray as (KInt32ArrayPtr)
            this.writeIntArray_serialize(intArray_casted)
            return
        }
        public writeDoubleArray(doubleArray: Array<double>): void {
            const doubleArray_casted = doubleArray as (Array<double>)
            this.writeDoubleArray_serialize(doubleArray_casted)
            return
        }
        public writeBooleanArray(booleanArray: Array<boolean>): void {
            const booleanArray_casted = booleanArray as (Array<boolean>)
            this.writeBooleanArray_serialize(booleanArray_casted)
            return
        }
        public writeStringArray(stringArray: Array<string>): void {
            const stringArray_casted = stringArray as (Array<string>)
            this.writeStringArray_serialize(stringArray_casted)
            return
        }
        public writeParcelableArray(parcelableArray: Array<Parcelable>): void {
            const parcelableArray_casted = parcelableArray as (Array<Parcelable>)
            this.writeParcelableArray_serialize(parcelableArray_casted)
            return
        }
        public readInt(): int32 {
            return this.readInt_serialize()
        }
        public readLong(): int64 {
            return this.readLong_serialize()
        }
        public readBoolean(): boolean {
            return this.readBoolean_serialize()
        }
        public readString(): string {
            return this.readString_serialize()
        }
        public readParcelable(dataIn: Parcelable): void {
            const dataIn_casted = dataIn as (Parcelable)
            this.readParcelable_serialize(dataIn_casted)
            return
        }
        public readIntArray(dataIn: KInt32ArrayPtr): void {
            const dataIn_casted = dataIn as (KInt32ArrayPtr)
            this.readIntArray0_serialize(dataIn_casted)
            return
        }
        public readIntArray(): KInt32ArrayPtr {
            return this.readIntArray1_serialize()
        }
        public readDoubleArray(dataIn: Array<double>): void {
            const dataIn_casted = dataIn as (Array<double>)
            this.readDoubleArray0_serialize(dataIn_casted)
            return
        }
        public readDoubleArray(): Array<double> {
            return this.readDoubleArray1_serialize()
        }
        public readBooleanArray(dataIn: Array<boolean>): void {
            const dataIn_casted = dataIn as (Array<boolean>)
            this.readBooleanArray0_serialize(dataIn_casted)
            return
        }
        public readBooleanArray(): Array<boolean> {
            return this.readBooleanArray1_serialize()
        }
        public readStringArray(dataIn: Array<string>): void {
            const dataIn_casted = dataIn as (Array<string>)
            this.readStringArray0_serialize(dataIn_casted)
            return
        }
        public readStringArray(): Array<string> {
            return this.readStringArray1_serialize()
        }
        public readParcelableArray(parcelableArray: Array<Parcelable>): void {
            const parcelableArray_casted = parcelableArray as (Array<Parcelable>)
            this.readParcelableArray_serialize(parcelableArray_casted)
            return
        }
        public static closeFileDescriptor(fd: int32): void {
            const fd_casted = fd as (int32)
            MessageSequence.closeFileDescriptor_serialize(fd_casted)
            return
        }
        public writeFileDescriptor(fd: int32): void {
            const fd_casted = fd as (int32)
            this.writeFileDescriptor_serialize(fd_casted)
            return
        }
        public readFileDescriptor(): int32 {
            return this.readFileDescriptor_serialize()
        }
        public writeAshmem(ashmem: Ashmem): void {
            const ashmem_casted = ashmem as (Ashmem)
            this.writeAshmem_serialize(ashmem_casted)
            return
        }
        public readAshmem(): Ashmem {
            return this.readAshmem_serialize()
        }
        public writeRawDataBuffer(rawData: ArrayBuffer, size: int32): void {
            const rawData_casted = rawData as (ArrayBuffer)
            const size_casted = size as (int32)
            this.writeRawDataBuffer_serialize(rawData_casted, size_casted)
            return
        }
        public readRawDataBuffer(size: int32): ArrayBuffer {
            const size_casted = size as (int32)
            return this.readRawDataBuffer_serialize(size_casted)
        }
        reclaim_serialize(): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_reclaim(this.peer!.ptr)
        }
        writeRemoteObject_serialize(obj: IRemoteObject): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeRemoteObject(this.peer!.ptr, extractors.toRpcIRemoteObjectPtr(obj))
        }
        readRemoteObject_serialize(): IRemoteObject {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readRemoteObject(this.peer!.ptr)
            const obj : IRemoteObject = extractors.fromRpcIRemoteObjectPtr(retval)
            return obj
        }
        writeInterfaceToken_serialize(token: string): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeInterfaceToken(this.peer!.ptr, token)
        }
        readInterfaceToken_serialize(): string {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readInterfaceToken(this.peer!.ptr)
            return retval
        }
        getCapacity_serialize(): int32 {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_getCapacity(this.peer!.ptr)
            return retval
        }
        setCapacity_serialize(size: int32): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_setCapacity(this.peer!.ptr, size)
        }
        writeNoException_serialize(): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeNoException(this.peer!.ptr)
        }
        readException_serialize(): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_readException(this.peer!.ptr)
        }
        writeInt_serialize(val: int32): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeInt(this.peer!.ptr, val)
        }
        writeLong_serialize(val: int64): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeLong(this.peer!.ptr, val)
        }
        writeBoolean_serialize(val: boolean): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeBoolean(this.peer!.ptr, val ? 1 : 0)
        }
        writeString_serialize(val: string): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeString(this.peer!.ptr, val)
        }
        writeParcelable_serialize(val: Parcelable): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeParcelable(this.peer!.ptr, extractors.toRpcParcelablePtr(val))
        }
        writeByteArray_serialize(byteArray: KInt32ArrayPtr): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((byteArray.length).toInt())
            for (let byteArrayCounterI = 0; byteArrayCounterI < byteArray.length; byteArrayCounterI++) {
                const byteArrayTmpElement : int32 = byteArray[byteArrayCounterI]
                thisSerializer.writeInt32(byteArrayTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_writeByteArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeIntArray_serialize(intArray: KInt32ArrayPtr): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((intArray.length).toInt())
            for (let intArrayCounterI = 0; intArrayCounterI < intArray.length; intArrayCounterI++) {
                const intArrayTmpElement : int32 = intArray[intArrayCounterI]
                thisSerializer.writeInt32(intArrayTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_writeIntArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeDoubleArray_serialize(doubleArray: Array<double>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((doubleArray.length).toInt())
            for (let doubleArrayCounterI = 0; doubleArrayCounterI < doubleArray.length; doubleArrayCounterI++) {
                const doubleArrayTmpElement : double = doubleArray[doubleArrayCounterI]
                thisSerializer.writeFloat64(doubleArrayTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_writeDoubleArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeBooleanArray_serialize(booleanArray: Array<boolean>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((booleanArray.length).toInt())
            for (let booleanArrayCounterI = 0; booleanArrayCounterI < booleanArray.length; booleanArrayCounterI++) {
                const booleanArrayTmpElement : boolean = booleanArray[booleanArrayCounterI]
                thisSerializer.writeBoolean(booleanArrayTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_writeBooleanArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeStringArray_serialize(stringArray: Array<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((stringArray.length).toInt())
            for (let stringArrayCounterI = 0; stringArrayCounterI < stringArray.length; stringArrayCounterI++) {
                const stringArrayTmpElement : string = stringArray[stringArrayCounterI]
                thisSerializer.writeString(stringArrayTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_writeStringArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeParcelableArray_serialize(parcelableArray: Array<Parcelable>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((parcelableArray.length).toInt())
            for (let parcelableArrayCounterI = 0; parcelableArrayCounterI < parcelableArray.length; parcelableArrayCounterI++) {
                const parcelableArrayTmpElement : Parcelable = parcelableArray[parcelableArrayCounterI]
                rpc_Parcelable_serializer.write(thisSerializer, parcelableArrayTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_writeParcelableArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readInt_serialize(): int32 {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readInt(this.peer!.ptr)
            return retval
        }
        readLong_serialize(): int64 {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readLong(this.peer!.ptr)
            return retval
        }
        readBoolean_serialize(): boolean {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readBoolean(this.peer!.ptr)
            return retval
        }
        readString_serialize(): string {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readString(this.peer!.ptr)
            return retval
        }
        readParcelable_serialize(dataIn: Parcelable): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_readParcelable(this.peer!.ptr, extractors.toRpcParcelablePtr(dataIn))
        }
        readIntArray0_serialize(dataIn: KInt32ArrayPtr): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((dataIn.length).toInt())
            for (let dataInCounterI = 0; dataInCounterI < dataIn.length; dataInCounterI++) {
                const dataInTmpElement : int32 = dataIn[dataInCounterI]
                thisSerializer.writeInt32(dataInTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_readIntArray0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readIntArray1_serialize(): KInt32ArrayPtr {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readIntArray1(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : KInt32ArrayPtr = new Array<int32>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = retvalDeserializer.readInt32()
            }
            const returnResult : KInt32ArrayPtr = buffer
            return returnResult
        }
        readDoubleArray0_serialize(dataIn: Array<double>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((dataIn.length).toInt())
            for (let dataInCounterI = 0; dataInCounterI < dataIn.length; dataInCounterI++) {
                const dataInTmpElement : double = dataIn[dataInCounterI]
                thisSerializer.writeFloat64(dataInTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_readDoubleArray0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readDoubleArray1_serialize(): Array<double> {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readDoubleArray1(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<double> = new Array<double>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = retvalDeserializer.readFloat64()
            }
            const returnResult : Array<double> = buffer
            return returnResult
        }
        readBooleanArray0_serialize(dataIn: Array<boolean>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((dataIn.length).toInt())
            for (let dataInCounterI = 0; dataInCounterI < dataIn.length; dataInCounterI++) {
                const dataInTmpElement : boolean = dataIn[dataInCounterI]
                thisSerializer.writeBoolean(dataInTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_readBooleanArray0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readBooleanArray1_serialize(): Array<boolean> {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readBooleanArray1(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<boolean> = new Array<boolean>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = retvalDeserializer.readBoolean()
            }
            const returnResult : Array<boolean> = buffer
            return returnResult
        }
        readStringArray0_serialize(dataIn: Array<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((dataIn.length).toInt())
            for (let dataInCounterI = 0; dataInCounterI < dataIn.length; dataInCounterI++) {
                const dataInTmpElement : string = dataIn[dataInCounterI]
                thisSerializer.writeString(dataInTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_readStringArray0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        readStringArray1_serialize(): Array<string> {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readStringArray1(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string> = new Array<string>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (retvalDeserializer.readString() as string)
            }
            const returnResult : Array<string> = buffer
            return returnResult
        }
        readParcelableArray_serialize(parcelableArray: Array<Parcelable>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((parcelableArray.length).toInt())
            for (let parcelableArrayCounterI = 0; parcelableArrayCounterI < parcelableArray.length; parcelableArrayCounterI++) {
                const parcelableArrayTmpElement : Parcelable = parcelableArray[parcelableArrayCounterI]
                rpc_Parcelable_serializer.write(thisSerializer, parcelableArrayTmpElement)
            }
            OHOS_RPCNativeModule._rpc_MessageSequence_readParcelableArray(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        writeFileDescriptor_serialize(fd: int32): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeFileDescriptor(this.peer!.ptr, fd)
        }
        readFileDescriptor_serialize(): int32 {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readFileDescriptor(this.peer!.ptr)
            return retval
        }
        writeAshmem_serialize(ashmem: Ashmem): void {
            OHOS_RPCNativeModule._rpc_MessageSequence_writeAshmem(this.peer!.ptr, extractors.toRpcAshmemPtr(ashmem))
        }
        readAshmem_serialize(): Ashmem {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readAshmem(this.peer!.ptr)
            const obj : Ashmem = extractors.fromRpcAshmemPtr(retval)
            return obj
        }
        writeRawDataBuffer_serialize(rawData: ArrayBuffer, size: int32): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeBuffer(rawData)
            OHOS_RPCNativeModule._rpc_MessageSequence_writeRawDataBuffer(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), size)
            thisSerializer.release()
        }
        readRawDataBuffer_serialize(size: int32): ArrayBuffer {
            const retval  = OHOS_RPCNativeModule._rpc_MessageSequence_readRawDataBuffer(this.peer!.ptr, size)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
    }
    export interface Parcelable {
        marshalling(dataOut: MessageSequence): boolean
        unmarshalling(dataIn: MessageSequence): boolean
    }
    export class ParcelableInternal implements MaterializedBase,Parcelable {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, ParcelableInternal.getFinalizer())
        }
        constructor() {
            this(ParcelableInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RPCNativeModule._rpc_Parcelable_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RPCNativeModule._rpc_Parcelable_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): ParcelableInternal {
            return new ParcelableInternal(ptr)
        }
        public marshalling(dataOut: MessageSequence): boolean {
            const dataOut_casted = dataOut as (MessageSequence)
            return this.marshalling_serialize(dataOut_casted)
        }
        public unmarshalling(dataIn: MessageSequence): boolean {
            const dataIn_casted = dataIn as (MessageSequence)
            return this.unmarshalling_serialize(dataIn_casted)
        }
        marshalling_serialize(dataOut: MessageSequence): boolean {
            const retval  = OHOS_RPCNativeModule._rpc_Parcelable_marshalling(this.peer!.ptr, extractors.toRpcMessageSequencePtr(dataOut))
            return retval
        }
        unmarshalling_serialize(dataIn: MessageSequence): boolean {
            const retval  = OHOS_RPCNativeModule._rpc_Parcelable_unmarshalling(this.peer!.ptr, extractors.toRpcMessageSequencePtr(dataIn))
            return retval
        }
    }
    export interface RequestResult {
        errCode: int32;
        code: int32;
        data: rpc.MessageSequence;
        reply: rpc.MessageSequence;
    }
}
