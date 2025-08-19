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

import { cryptoFramework_DataBlob_serializer, TypeChecker, OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule } from "./ohos.security.cryptoFramework.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { extractors } from "#handwritten"
export default cryptoFramework
export namespace cryptoFramework {
    export interface Key {
        readonly format: string
        readonly algName: string
        getEncoded(): DataBlob
    }
    export class KeyInternal implements MaterializedBase,Key {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        readonly format: string
        readonly algName: string
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, KeyInternal.getFinalizer())
            this.format = this.getFormat()
            this.algName = this.getAlgName()
        }
        constructor() {
            this(KeyInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_Key_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_Key_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): KeyInternal {
            return new KeyInternal(ptr)
        }
        public getEncoded(): DataBlob {
            return this.getEncoded_serialize()
        }
        private getFormat(): string {
            return this.getFormat_serialize()
        }
        private getAlgName(): string {
            return this.getAlgName_serialize()
        }
        getEncoded_serialize(): DataBlob {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_Key_getEncoded(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cryptoFramework_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        private getFormat_serialize(): string {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_Key_getFormat(this.peer!.ptr)
            return retval
        }
        private getAlgName_serialize(): string {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_Key_getAlgName(this.peer!.ptr)
            return retval
        }
    }
    export interface DataBlob {
        data: ArrayBuffer;
    }
    export enum AsyKeySpecItem {
        DSA_P_BN = 101,
        DSA_Q_BN = 102,
        DSA_G_BN = 103,
        DSA_SK_BN = 104,
        DSA_PK_BN = 105,
        ECC_FP_P_BN = 201,
        ECC_A_BN = 202,
        ECC_B_BN = 203,
        ECC_G_X_BN = 204,
        ECC_G_Y_BN = 205,
        ECC_N_BN = 206,
        ECC_H_NUM = 207,
        ECC_SK_BN = 208,
        ECC_PK_X_BN = 209,
        ECC_PK_Y_BN = 210,
        ECC_FIELD_TYPE_STR = 211,
        ECC_FIELD_SIZE_NUM = 212,
        ECC_CURVE_NAME_STR = 213,
        RSA_N_BN = 301,
        RSA_SK_BN = 302,
        RSA_PK_BN = 303,
        DH_P_BN = 401,
        DH_G_BN = 402,
        DH_L_NUM = 403,
        DH_SK_BN = 404,
        DH_PK_BN = 405,
        ED25519_SK_BN = 501,
        ED25519_PK_BN = 502,
        X25519_SK_BN = 601,
        X25519_PK_BN = 602
    }
    export interface PubKey {
        getAsyKeySpec(itemType: AsyKeySpecItem): long | string | int32
        getEncodedDer(format: string): DataBlob
        getEncodedPem(format: string): string
    }
    export class PubKeyInternal extends cryptoFramework.KeyInternal implements MaterializedBase,PubKey {
        constructor(peerPtr: KPointer) {
            super(peerPtr)
        }
        constructor() {
            this(PubKeyInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_PubKey_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_PubKey_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): PubKeyInternal {
            return new PubKeyInternal(ptr)
        }
        public getAsyKeySpec(itemType: AsyKeySpecItem): long | string | int32 {
            const itemType_casted = itemType as (AsyKeySpecItem)
            return this.getAsyKeySpec_serialize(itemType_casted)
        }
        public getEncodedDer(format: string): DataBlob {
            const format_casted = format as (string)
            return this.getEncodedDer_serialize(format_casted)
        }
        public getEncodedPem(format: string): string {
            const format_casted = format as (string)
            return this.getEncodedPem_serialize(format_casted)
        }
        getAsyKeySpec_serialize(itemType: AsyKeySpecItem): long | string | int32 {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_PubKey_getAsyKeySpec(this.peer!.ptr, TypeChecker.cryptoFramework_AsyKeySpecItem_ToNumeric(itemType))
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferUnionSelector : int32 = retvalDeserializer.readInt8()
            let buffer : long | string | int32 | undefined
            if (bufferUnionSelector == (0).toChar()) {
                buffer = (retvalDeserializer.readInt64() as long)
            } else if (bufferUnionSelector == (1).toChar()) {
                buffer = (retvalDeserializer.readString() as string)
            } else if (bufferUnionSelector == (2).toChar()) {
                buffer = retvalDeserializer.readInt32()
            } else {
                throw new Error("One of the branches for buffer has to be chosen through deserialisation.")
            }
            const returnResult : long | string | int32 = (buffer as long | string | int32)
            return returnResult
        }
        getEncodedDer_serialize(format: string): DataBlob {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_PubKey_getEncodedDer(this.peer!.ptr, format)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : DataBlob = cryptoFramework_DataBlob_serializer.read(retvalDeserializer)
            return returnResult
        }
        getEncodedPem_serialize(format: string): string {
            const retval  = OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule._cryptoFramework_PubKey_getEncodedPem(this.peer!.ptr, format)
            return retval
        }
    }
}
