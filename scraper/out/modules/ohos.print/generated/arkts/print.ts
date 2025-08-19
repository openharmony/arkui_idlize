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
import { print_PrintAttributes_serializer, TypeChecker, OHOS_PRINTNativeModule } from "./ohos.print.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default print
export namespace print {
    export interface PrintDocumentAdapter {
        onStartLayoutWrite(jobId: string, oldAttrs: PrintAttributes, newAttrs: PrintAttributes, fd: number, writeResultCallback: ((jobId: string,writeResult: PrintFileCreationState) => void)): void
        onJobStateChanged(jobId: string, state: PrintDocumentAdapterState): void
    }
    export class PrintDocumentAdapterInternal implements MaterializedBase,PrintDocumentAdapter {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, PrintDocumentAdapterInternal.getFinalizer())
        }
        constructor() {
            this(PrintDocumentAdapterInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_PRINTNativeModule._print_PrintDocumentAdapter_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_PRINTNativeModule._print_PrintDocumentAdapter_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): PrintDocumentAdapterInternal {
            return new PrintDocumentAdapterInternal(ptr)
        }
        public onStartLayoutWrite(jobId: string, oldAttrs: PrintAttributes, newAttrs: PrintAttributes, fd: number, writeResultCallback: ((jobId: string,writeResult: PrintFileCreationState) => void)): void {
            const jobId_casted = jobId as (string)
            const oldAttrs_casted = oldAttrs as (PrintAttributes)
            const newAttrs_casted = newAttrs as (PrintAttributes)
            const fd_casted = fd as (number)
            const writeResultCallback_casted = writeResultCallback as (((jobId: string,writeResult: PrintFileCreationState) => void))
            this.onStartLayoutWrite_serialize(jobId_casted, oldAttrs_casted, newAttrs_casted, fd_casted, writeResultCallback_casted)
            return
        }
        public onJobStateChanged(jobId: string, state: PrintDocumentAdapterState): void {
            const jobId_casted = jobId as (string)
            const state_casted = state as (PrintDocumentAdapterState)
            this.onJobStateChanged_serialize(jobId_casted, state_casted)
            return
        }
        onStartLayoutWrite_serialize(jobId: string, oldAttrs: PrintAttributes, newAttrs: PrintAttributes, fd: number, writeResultCallback: ((jobId: string,writeResult: PrintFileCreationState) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            print_PrintAttributes_serializer.write(thisSerializer, oldAttrs)
            print_PrintAttributes_serializer.write(thisSerializer, newAttrs)
            thisSerializer.holdAndWriteCallback(writeResultCallback)
            OHOS_PRINTNativeModule._print_PrintDocumentAdapter_onStartLayoutWrite(this.peer!.ptr, jobId, thisSerializer.asBuffer(), thisSerializer.length(), fd)
            thisSerializer.release()
        }
        onJobStateChanged_serialize(jobId: string, state: PrintDocumentAdapterState): void {
            OHOS_PRINTNativeModule._print_PrintDocumentAdapter_onJobStateChanged(this.peer!.ptr, jobId, TypeChecker.print_PrintDocumentAdapterState_ToNumeric(state))
        }
    }
    export interface PrintAttributes {
        copyNumber?: number;
        pageRange?: print.PrintPageRange;
        pageSize?: print.PrintPageSize | print.PrintPageType;
        directionMode?: print.PrintDirectionMode;
        colorMode?: print.PrintColorMode;
        duplexMode?: print.PrintDuplexMode;
    }
    export interface PrintPageRange {
        startPage?: number;
        endPage?: number;
        pages?: Array<number>;
    }
    export interface PrintPageSize {
        id: string;
        name: string;
        width: number;
        height: number;
    }
    export enum PrintDirectionMode {
        DIRECTION_MODE_AUTO = 0,
        DIRECTION_MODE_PORTRAIT = 1,
        DIRECTION_MODE_LANDSCAPE = 2
    }
    export enum PrintColorMode {
        COLOR_MODE_MONOCHROME = 0,
        COLOR_MODE_COLOR = 1
    }
    export enum PrintDuplexMode {
        DUPLEX_MODE_NONE = 0,
        DUPLEX_MODE_LONG_EDGE = 1,
        DUPLEX_MODE_SHORT_EDGE = 2
    }
    export enum PrintPageType {
        PAGE_ISO_A3 = 0,
        PAGE_ISO_A4 = 1,
        PAGE_ISO_A5 = 2,
        PAGE_JIS_B5 = 3,
        PAGE_ISO_C5 = 4,
        PAGE_ISO_DL = 5,
        PAGE_LETTER = 6,
        PAGE_LEGAL = 7,
        PAGE_PHOTO_4X6 = 8,
        PAGE_PHOTO_5X7 = 9,
        PAGE_INT_DL_ENVELOPE = 10,
        PAGE_B_TABLOID = 11
    }
    export enum PrintDocumentAdapterState {
        PREVIEW_DESTROY = 0,
        PRINT_TASK_SUCCEED = 1,
        PRINT_TASK_FAIL = 2,
        PRINT_TASK_CANCEL = 3,
        PRINT_TASK_BLOCK = 4
    }
    export enum PrintFileCreationState {
        PRINT_FILE_CREATED = 0,
        PRINT_FILE_CREATION_FAILED = 1,
        PRINT_FILE_CREATED_UNRENDERED = 2
    }
}
