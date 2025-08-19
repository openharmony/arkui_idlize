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

import { cert_EncodingBlob_serializer, cert_DataArray_serializer, cert_DataBlob_serializer, TypeChecker, OHOS_SECURITY_CERTNativeModule, cert_X509CertMatchParameters_serializer } from "./ohos.security.cert.INTERNAL"
import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { extractors } from "#handwritten"
import { default as cryptoFramework } from "@ohos.security.cryptoFramework"
import { AsyncCallback, BusinessError } from "@ohos.base"
export default cert
export namespace cert {
    export interface CertExtension {
        getEncoded(): EncodingBlob
        getOidList(valueType: ExtensionOidType): DataArray
        getEntry(valueType: ExtensionEntryType, oid: DataBlob): DataBlob
        checkCA(): int32
        hasUnsupportedCriticalExtension(): boolean
    }
    export class CertExtensionInternal implements MaterializedBase,CertExtension {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, CertExtensionInternal.getFinalizer())
        }
        constructor() {
            this(CertExtensionInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_CertExtension_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_SECURITY_CERTNativeModule._cert_CertExtension_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): CertExtensionInternal {
            return new CertExtensionInternal(ptr)
        }
        public getEncoded(): EncodingBlob {
            return this.getEncoded_serialize()
        }
        public getOidList(valueType: ExtensionOidType): DataArray {
            const valueType_casted = valueType as (ExtensionOidType)
            return this.getOidList_serialize(valueType_casted)
        }
        public getEntry(valueType: ExtensionEntryType, oid: DataBlob): DataBlob {
            const valueType_casted = valueType as (ExtensionEntryType)
            const oid_casted = oid as (DataBlob)
            return this.getEntry_serialize(valueType_casted, oid_casted)
        }
        public checkCA(): int32 {
            return this.checkCA_serialize()
        }
        public hasUnsupportedCriticalExtension(): boolean {
            return this.hasUnsupportedCriticalExtension_serialize()
        }
        getEncoded_serialize(): EncodingBlob {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_CertExtension_getEncoded(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : EncodingBlob = cert_EncodingBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        getOidList_serialize(valueType: ExtensionOidType): DataArray {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_CertExtension_getOidList(this.peer!.ptr, TypeChecker.cert_ExtensionOidType_ToNumeric(valueType))
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataArray = cert_DataArray_serializer.read(retvalDeserializer)
            return returnResult
        }
        getEntry_serialize(valueType: ExtensionEntryType, oid: DataBlob): DataBlob {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            cert_DataBlob_serializer.write(thisSerializer, oid)
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_CertExtension_getEntry(this.peer!.ptr, TypeChecker.cert_ExtensionEntryType_ToNumeric(valueType), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cert_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        checkCA_serialize(): int32 {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_CertExtension_checkCA(this.peer!.ptr)
            return retval
        }
        hasUnsupportedCriticalExtension_serialize(): boolean {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_CertExtension_hasUnsupportedCriticalExtension(this.peer!.ptr)
            return retval
        }
    }
    export interface X500DistinguishedName {
        getName(): string
        getName(encodingType: EncodingType): string
        getName(type: string): Array<string>
        getEncoded(): EncodingBlob
    }
    export class X500DistinguishedNameInternal implements MaterializedBase,X500DistinguishedName {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, X500DistinguishedNameInternal.getFinalizer())
        }
        constructor() {
            this(X500DistinguishedNameInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X500DistinguishedName_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_SECURITY_CERTNativeModule._cert_X500DistinguishedName_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): X500DistinguishedNameInternal {
            return new X500DistinguishedNameInternal(ptr)
        }
        public getName(): string {
            return this.getName0_serialize()
        }
        public getName(encodingType: EncodingType): string {
            const encodingType_casted = encodingType as (EncodingType)
            return this.getName1_serialize(encodingType_casted)
        }
        public getName(type: string): Array<string> {
            const type_casted = type as (string)
            return this.getName2_serialize(type_casted)
        }
        public getEncoded(): EncodingBlob {
            return this.getEncoded_serialize()
        }
        getName0_serialize(): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X500DistinguishedName_getName0(this.peer!.ptr)
            return retval
        }
        getName1_serialize(encodingType: EncodingType): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X500DistinguishedName_getName1(this.peer!.ptr, TypeChecker.cert_EncodingType_ToNumeric(encodingType))
            return retval
        }
        getName2_serialize(type: string): Array<string> {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X500DistinguishedName_getName2(this.peer!.ptr, type)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string> = new Array<string>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (retvalDeserializer.readString() as string)
            }
            const returnResult : Array<string> = buffer
            return returnResult
        }
        getEncoded_serialize(): EncodingBlob {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X500DistinguishedName_getEncoded(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : EncodingBlob = cert_EncodingBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
    }
    export interface X509Cert {
        verify(key: cryptoFramework.PubKey, callback_: AsyncCallback<void>): void
        verify(key: cryptoFramework.PubKey): Promise<void>
        getEncoded(callback_: AsyncCallback<EncodingBlob>): void
        getEncoded(): Promise<EncodingBlob>
        getPublicKey(): cryptoFramework.PubKey
        checkValidityWithDate(date: string): void
        getVersion(): int32
        getCertSerialNumber(): long
        getIssuerName(): DataBlob
        getIssuerName(encodingType: EncodingType): string
        getSubjectName(encodingType: EncodingType | undefined): DataBlob
        getNotBeforeTime(): string
        getNotAfterTime(): string
        getSignature(): DataBlob
        getSignatureAlgName(): string
        getSignatureAlgOid(): string
        getSignatureAlgParams(): DataBlob
        getKeyUsage(): DataBlob
        getExtKeyUsage(): DataArray
        getBasicConstraints(): int32
        getSubjectAltNames(): DataArray
        getIssuerAltNames(): DataArray
        getItem(itemType: CertItemType): DataBlob
        match(param: X509CertMatchParameters): boolean
        getCRLDistributionPoint(): DataArray
        getIssuerX500DistinguishedName(): X500DistinguishedName
        getSubjectX500DistinguishedName(): X500DistinguishedName
        toString(): string
        toString(encodingType: EncodingType): string
        hashCode(): ArrayBuffer
        getExtensionsObject(): CertExtension
    }
    export class X509CertInternal implements MaterializedBase,X509Cert {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, X509CertInternal.getFinalizer())
        }
        constructor() {
            this(X509CertInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): X509CertInternal {
            return new X509CertInternal(ptr)
        }
        public verify(key: cryptoFramework.PubKey, callback_: AsyncCallback<void>): void {
            const key_casted = key as (cryptoFramework.PubKey)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.verify0_serialize(key_casted, callback__casted)
            return
        }
        public verify(key: cryptoFramework.PubKey): Promise<void> {
            const key_casted = key as (cryptoFramework.PubKey)
            return this.verify1_serialize(key_casted)
        }
        public getEncoded(callback_: AsyncCallback<EncodingBlob>): void {
            const callback__casted = callback_ as (AsyncCallback<EncodingBlob>)
            this.getEncoded0_serialize(callback__casted)
            return
        }
        public getEncoded(): Promise<EncodingBlob> {
            return this.getEncoded1_serialize()
        }
        public getPublicKey(): cryptoFramework.PubKey {
            return this.getPublicKey_serialize()
        }
        public checkValidityWithDate(date: string): void {
            const date_casted = date as (string)
            this.checkValidityWithDate_serialize(date_casted)
            return
        }
        public getVersion(): int32 {
            return this.getVersion_serialize()
        }
        public getCertSerialNumber(): long {
            return this.getCertSerialNumber_serialize()
        }
        public getIssuerName(): DataBlob {
            return this.getIssuerName0_serialize()
        }
        public getIssuerName(encodingType: EncodingType): string {
            const encodingType_casted = encodingType as (EncodingType)
            return this.getIssuerName1_serialize(encodingType_casted)
        }
        public getSubjectName(encodingType?: EncodingType): DataBlob {
            const encodingType_casted = encodingType as (EncodingType | undefined)
            return this.getSubjectName_serialize(encodingType_casted)
        }
        public getNotBeforeTime(): string {
            return this.getNotBeforeTime_serialize()
        }
        public getNotAfterTime(): string {
            return this.getNotAfterTime_serialize()
        }
        public getSignature(): DataBlob {
            return this.getSignature_serialize()
        }
        public getSignatureAlgName(): string {
            return this.getSignatureAlgName_serialize()
        }
        public getSignatureAlgOid(): string {
            return this.getSignatureAlgOid_serialize()
        }
        public getSignatureAlgParams(): DataBlob {
            return this.getSignatureAlgParams_serialize()
        }
        public getKeyUsage(): DataBlob {
            return this.getKeyUsage_serialize()
        }
        public getExtKeyUsage(): DataArray {
            return this.getExtKeyUsage_serialize()
        }
        public getBasicConstraints(): int32 {
            return this.getBasicConstraints_serialize()
        }
        public getSubjectAltNames(): DataArray {
            return this.getSubjectAltNames_serialize()
        }
        public getIssuerAltNames(): DataArray {
            return this.getIssuerAltNames_serialize()
        }
        public getItem(itemType: CertItemType): DataBlob {
            const itemType_casted = itemType as (CertItemType)
            return this.getItem_serialize(itemType_casted)
        }
        public match(param: X509CertMatchParameters): boolean {
            const param_casted = param as (X509CertMatchParameters)
            return this.match_serialize(param_casted)
        }
        public getCRLDistributionPoint(): DataArray {
            return this.getCRLDistributionPoint_serialize()
        }
        public getIssuerX500DistinguishedName(): X500DistinguishedName {
            return this.getIssuerX500DistinguishedName_serialize()
        }
        public getSubjectX500DistinguishedName(): X500DistinguishedName {
            return this.getSubjectX500DistinguishedName_serialize()
        }
        public toString(): string {
            return this.toString0_serialize()
        }
        public toString(encodingType: EncodingType): string {
            const encodingType_casted = encodingType as (EncodingType)
            return this.toString1_serialize(encodingType_casted)
        }
        public hashCode(): ArrayBuffer {
            return this.hashCode_serialize()
        }
        public getExtensionsObject(): CertExtension {
            return this.getExtensionsObject_serialize()
        }
        verify0_serialize(key: cryptoFramework.PubKey, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_SECURITY_CERTNativeModule._cert_X509Cert_verify0(this.peer!.ptr, extractors.toCryptoFrameworkPubKeyPtr(key), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        verify1_serialize(key: cryptoFramework.PubKey): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_SECURITY_CERTNativeModule._cert_X509Cert_verify1(this.peer!.ptr, extractors.toCryptoFrameworkPubKeyPtr(key), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getEncoded0_serialize(callback_: AsyncCallback<EncodingBlob>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getEncoded0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getEncoded1_serialize(): Promise<EncodingBlob> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<EncodingBlob>()[0]
            OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getEncoded1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getPublicKey_serialize(): cryptoFramework.PubKey {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getPublicKey(this.peer!.ptr)
            const obj : cryptoFramework.PubKey = extractors.fromCryptoFrameworkPubKeyPtr(retval)
            return obj
        }
        checkValidityWithDate_serialize(date: string): void {
            OHOS_SECURITY_CERTNativeModule._cert_X509Cert_checkValidityWithDate(this.peer!.ptr, date)
        }
        getVersion_serialize(): int32 {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getVersion(this.peer!.ptr)
            return retval
        }
        getCertSerialNumber_serialize(): long {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getCertSerialNumber(this.peer!.ptr)
            return retval
        }
        getIssuerName0_serialize(): DataBlob {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getIssuerName0(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cert_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        getIssuerName1_serialize(encodingType: EncodingType): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getIssuerName1(this.peer!.ptr, TypeChecker.cert_EncodingType_ToNumeric(encodingType))
            return retval
        }
        getSubjectName_serialize(encodingType?: EncodingType): DataBlob {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (encodingType !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const encodingTypeTmpValue  = (encodingType as cert.EncodingType)
                thisSerializer.writeInt32(TypeChecker.cert_EncodingType_ToNumeric(encodingTypeTmpValue))
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getSubjectName(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cert_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        getNotBeforeTime_serialize(): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getNotBeforeTime(this.peer!.ptr)
            return retval
        }
        getNotAfterTime_serialize(): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getNotAfterTime(this.peer!.ptr)
            return retval
        }
        getSignature_serialize(): DataBlob {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getSignature(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cert_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        getSignatureAlgName_serialize(): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getSignatureAlgName(this.peer!.ptr)
            return retval
        }
        getSignatureAlgOid_serialize(): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getSignatureAlgOid(this.peer!.ptr)
            return retval
        }
        getSignatureAlgParams_serialize(): DataBlob {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getSignatureAlgParams(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cert_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        getKeyUsage_serialize(): DataBlob {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getKeyUsage(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cert_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        getExtKeyUsage_serialize(): DataArray {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getExtKeyUsage(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataArray = cert_DataArray_serializer.read(retvalDeserializer)
            return returnResult
        }
        getBasicConstraints_serialize(): int32 {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getBasicConstraints(this.peer!.ptr)
            return retval
        }
        getSubjectAltNames_serialize(): DataArray {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getSubjectAltNames(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataArray = cert_DataArray_serializer.read(retvalDeserializer)
            return returnResult
        }
        getIssuerAltNames_serialize(): DataArray {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getIssuerAltNames(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataArray = cert_DataArray_serializer.read(retvalDeserializer)
            return returnResult
        }
        getItem_serialize(itemType: CertItemType): DataBlob {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getItem(this.peer!.ptr, TypeChecker.cert_CertItemType_ToNumeric(itemType))
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cert_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        match_serialize(param: X509CertMatchParameters): boolean {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            cert_X509CertMatchParameters_serializer.write(thisSerializer, param)
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_match(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getCRLDistributionPoint_serialize(): DataArray {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getCRLDistributionPoint(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataArray = cert_DataArray_serializer.read(retvalDeserializer)
            return returnResult
        }
        getIssuerX500DistinguishedName_serialize(): X500DistinguishedName {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getIssuerX500DistinguishedName(this.peer!.ptr)
            const obj : X500DistinguishedName = extractors.fromCertX500DistinguishedNamePtr(retval)
            return obj
        }
        getSubjectX500DistinguishedName_serialize(): X500DistinguishedName {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getSubjectX500DistinguishedName(this.peer!.ptr)
            const obj : X500DistinguishedName = extractors.fromCertX500DistinguishedNamePtr(retval)
            return obj
        }
        toString0_serialize(): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_toString0(this.peer!.ptr)
            return retval
        }
        toString1_serialize(encodingType: EncodingType): string {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_toString1(this.peer!.ptr, TypeChecker.cert_EncodingType_ToNumeric(encodingType))
            return retval
        }
        hashCode_serialize(): ArrayBuffer {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_hashCode(this.peer!.ptr)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
        getExtensionsObject_serialize(): CertExtension {
            const retval  = OHOS_SECURITY_CERTNativeModule._cert_X509Cert_getExtensionsObject(this.peer!.ptr)
            const obj : CertExtension = extractors.fromCertCertExtensionPtr(retval)
            return obj
        }
    }
    export interface DataBlob {
        data: ArrayBuffer;
    }
    export interface DataArray {
        data: Array<ArrayBuffer>;
    }
    export enum EncodingFormat {
        FORMAT_DER = 0,
        FORMAT_PEM = 1,
        FORMAT_PKCS7 = 2
    }
    export enum CertItemType {
        CERT_ITEM_TYPE_TBS = 0,
        CERT_ITEM_TYPE_PUBLIC_KEY = 1,
        CERT_ITEM_TYPE_ISSUER_UNIQUE_ID = 2,
        CERT_ITEM_TYPE_SUBJECT_UNIQUE_ID = 3,
        CERT_ITEM_TYPE_EXTENSIONS = 4
    }
    export enum ExtensionOidType {
        EXTENSION_OID_TYPE_ALL = 0,
        EXTENSION_OID_TYPE_CRITICAL = 1,
        EXTENSION_OID_TYPE_UNCRITICAL = 2
    }
    export enum ExtensionEntryType {
        EXTENSION_ENTRY_TYPE_ENTRY = 0,
        EXTENSION_ENTRY_TYPE_ENTRY_CRITICAL = 1,
        EXTENSION_ENTRY_TYPE_ENTRY_VALUE = 2
    }
    export interface EncodingBlob {
        data: ArrayBuffer;
        encodingFormat: cert.EncodingFormat;
    }
    export enum EncodingType {
        ENCODING_UTF8 = 0
    }
    export enum GeneralNameType {
        GENERAL_NAME_TYPE_OTHER_NAME = 0,
        GENERAL_NAME_TYPE_RFC822_NAME = 1,
        GENERAL_NAME_TYPE_DNS_NAME = 2,
        GENERAL_NAME_TYPE_X400_ADDRESS = 3,
        GENERAL_NAME_TYPE_DIRECTORY_NAME = 4,
        GENERAL_NAME_TYPE_EDI_PARTY_NAME = 5,
        GENERAL_NAME_TYPE_UNIFORM_RESOURCE_ID = 6,
        GENERAL_NAME_TYPE_IP_ADDRESS = 7,
        GENERAL_NAME_TYPE_REGISTERED_ID = 8
    }
    export interface GeneralName {
        type: cert.GeneralNameType;
        name?: ArrayBuffer;
    }
    export interface X509CertMatchParameters {
        subjectAlternativeNames?: Array<cert.GeneralName>;
        matchAllSubjectAltNames?: boolean;
        authorityKeyIdentifier?: ArrayBuffer;
        minPathLenConstraint?: int32;
        x509Cert?: cert.X509Cert;
        validDate?: string;
        issuer?: ArrayBuffer;
        extendedKeyUsage?: Array<string>;
        nameConstraints?: ArrayBuffer;
        certPolicy?: Array<string>;
        privateKeyValid?: string;
        keyUsage?: Array<boolean>;
        serialNumber?: long;
        subject?: ArrayBuffer;
        subjectKeyIdentifier?: ArrayBuffer;
        publicKey?: cert.DataBlob;
        publicKeyAlgID?: string;
    }
}
