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

import { TypeChecker, OHOS_GRAPHICS_COLORSPACEMANAGERNativeModule } from "./ohos.graphics.colorSpaceManager.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default colorSpaceManager
export namespace colorSpaceManager {
    export interface ColorSpaceManager {
        getColorSpaceName(): ColorSpace
        getWhitePoint(): Array<double>
        getGamma(): double
    }
    export class ColorSpaceManagerInternal implements MaterializedBase,ColorSpaceManager {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, ColorSpaceManagerInternal.getFinalizer())
        }
        constructor() {
            this(ColorSpaceManagerInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_GRAPHICS_COLORSPACEMANAGERNativeModule._colorSpaceManager_ColorSpaceManager_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_COLORSPACEMANAGERNativeModule._colorSpaceManager_ColorSpaceManager_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): ColorSpaceManagerInternal {
            return new ColorSpaceManagerInternal(ptr)
        }
        public getColorSpaceName(): ColorSpace {
            return this.getColorSpaceName_serialize()
        }
        public getWhitePoint(): Array<double> {
            return this.getWhitePoint_serialize()
        }
        public getGamma(): double {
            return this.getGamma_serialize()
        }
        getColorSpaceName_serialize(): ColorSpace {
            const retval  = OHOS_GRAPHICS_COLORSPACEMANAGERNativeModule._colorSpaceManager_ColorSpaceManager_getColorSpaceName(this.peer!.ptr)
            return TypeChecker.colorSpaceManager_ColorSpace_FromNumeric(retval)
        }
        getWhitePoint_serialize(): Array<double> {
            const retval  = OHOS_GRAPHICS_COLORSPACEMANAGERNativeModule._colorSpaceManager_ColorSpaceManager_getWhitePoint(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<double> = new Array<double>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = retvalDeserializer.readFloat64()
            }
            const returnResult : Array<double> = buffer
            return returnResult
        }
        getGamma_serialize(): double {
            const retval  = OHOS_GRAPHICS_COLORSPACEMANAGERNativeModule._colorSpaceManager_ColorSpaceManager_getGamma(this.peer!.ptr)
            return retval
        }
    }
    export enum ColorSpace {
        UNKNOWN = 0,
        ADOBE_RGB_1998 = 1,
        DCI_P3 = 2,
        DISPLAY_P3 = 3,
        SRGB = 4,
        BT709 = 6,
        BT601_EBU = 7,
        BT601_SMPTE_C = 8,
        BT2020_HLG = 9,
        BT2020_PQ = 10,
        P3_HLG = 11,
        P3_PQ = 12,
        ADOBE_RGB_1998_LIMIT = 13,
        DISPLAY_P3_LIMIT = 14,
        SRGB_LIMIT = 15,
        BT709_LIMIT = 16,
        BT601_EBU_LIMIT = 17,
        BT601_SMPTE_C_LIMIT = 18,
        BT2020_HLG_LIMIT = 19,
        BT2020_PQ_LIMIT = 20,
        P3_HLG_LIMIT = 21,
        P3_PQ_LIMIT = 22,
        LINEAR_P3 = 23,
        LINEAR_SRGB = 24,
        LINEAR_BT709 = 25,
        LINEAR_BT2020 = 25,
        DISPLAY_SRGB = 26,
        DISPLAY_P3_SRGB = 27,
        DISPLAY_P3_HLG = 28,
        DISPLAY_P3_PQ = 29,
        H_LOG = 26,
        CUSTOM = 5
    }
}
