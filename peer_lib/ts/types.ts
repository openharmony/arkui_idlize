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

import { int32, float32 } from "@koalaui/common"

export type NodePointer = pointer // todo: move to NativeModule

export type KStringPtr = int32 | string | null
export type KStringPtrArray = int32 | Uint8Array | null
export type KUint8ArrayPtr = int32 | Uint8Array | null
export type KInt32ArrayPtr = int32 | Int32Array | null
export type KFloat32ArrayPtr = int32 | Float32Array | null
export type KInt = int32
export type KBoolean = int32
export type KFloat = float32
export type KPointer = number | bigint
export type pointer = KPointer
export type KNativePointer = KPointer

export type TypedArray = // todo: move to interop-smth
    Uint8Array
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
