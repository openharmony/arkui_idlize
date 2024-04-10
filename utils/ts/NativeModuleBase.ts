/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { KPointer, KStringPtr, KInt, Uint8ArrayPtr } from "./types"

export class NativeModuleBase {
    _GetGroupedLog(index: KInt): KPointer {
        throw new Error("_GetResultString")
    }
    _ClearGroupedLog(index: KInt): void  {
        throw new Error("_ClearResultString")
    }
    _GetStringFinalizer(): KPointer  {
        throw new Error("_GetStringFinalizer")
    }
    _InvokeFinalizer(ptr: KPointer, finalizer: KPointer): void  {
        throw new Error("_InvokeFinalizer")
    }
    _StringLength(ptr: KPointer): KInt  {
        throw new Error("_StringLength")
    }
    _StringData(ptr: KPointer, buffer: Uint8ArrayPtr, length: KInt): void  {
        throw new Error("_StringLength")
    }
    _StringMake(value: KStringPtr): KPointer {
        throw new Error("_StringMake")
    }
}