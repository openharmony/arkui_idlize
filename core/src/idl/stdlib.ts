/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { createContainerType, createPrimitiveType } from "./builders"
import { isPrimitiveType } from "./discriminators"
import { IDLNode, IDLPrimitiveType } from "./node"

export const IDLPointerType = createPrimitiveType('pointer')
export const IDLVoidType = createPrimitiveType('void')
export const IDLBooleanType = createPrimitiveType('boolean')
export const IDLI8Type = createPrimitiveType('i8')
export const IDLU8Type = createPrimitiveType('u8')
export const IDLI16Type = createPrimitiveType('i16')
export const IDLU16Type = createPrimitiveType('u16')
export const IDLI32Type = createPrimitiveType('i32')
export const IDLU32Type = createPrimitiveType('u32')
export const IDLI64Type = createPrimitiveType('i64')
export const IDLU64Type = createPrimitiveType('u64')
export const IDLF16Type = createPrimitiveType('f16')
export const IDLF32Type = createPrimitiveType('f32')
export const IDLF64Type = createPrimitiveType('f64')
export const IDLBigintType = createPrimitiveType("bigint")
export const IDLNumberType = createPrimitiveType('number')
export const IDLStringType = createPrimitiveType('String')
export const IDLAnyType = createPrimitiveType('any')
export const IDLUndefinedType = createPrimitiveType('undefined')
export const IDLUnknownType = createPrimitiveType('unknown')
export const IDLObjectType = createPrimitiveType('Object')
export const IDLThisType = createPrimitiveType('this')
export const IDLDate = createPrimitiveType('date')
export const IDLBufferType = createPrimitiveType('buffer')

export const IDLUint8ArrayType = createContainerType('sequence', [IDLU8Type])
export const IDLSerializerBuffer = createPrimitiveType('SerializerBuffer')

// Stub for IdlPeerLibrary
export const IDLFunctionType = createPrimitiveType('Function')
export const IDLCustomObjectType = createPrimitiveType('CustomObject')
export const IDLInteropReturnBufferType = createPrimitiveType('InteropReturnBuffer')

export const IDLNullTypeName = "idlize.stdlib.Null"

export function isUndefinedType(type: IDLNode): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type.name === IDLUndefinedType.name
}

export function isVoidType(type: IDLNode): type is IDLPrimitiveType {
    return isPrimitiveType(type) && type.name === IDLVoidType.name
}
