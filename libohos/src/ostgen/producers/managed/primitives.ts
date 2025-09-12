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

import { lw, Ts } from "../../../ost";
import { createProducer } from "../../engine/context"
import * as idl from "@idlizer/core/idl";

function selectType(type:idl.IDLPrimitiveType): lw.LWType {
    switch (type) {
        case idl.IDLAnyType: return Ts.prim.object///
        case idl.IDLBigintType: return Ts.prim.bigint
        case idl.IDLBooleanType: return Ts.prim.boolean
        case idl.IDLBufferType: return Ts.prim.buffer
        case idl.IDLF32Type: return Ts.prim.f32
        case idl.IDLF64Type: return Ts.prim.f64
        case idl.IDLI8Type: return Ts.prim.i8
        case idl.IDLI32Type: return Ts.prim.i32
        case idl.IDLI64Type: return Ts.prim.i64
        case idl.IDLNumberType: return Ts.prim.number
        case idl.IDLObjectType: return Ts.prim.object
        case idl.IDLPointerType: return Ts.prim.pointer
        case idl.IDLSerializerBuffer: return Ts.prim.serializerBuffer
        case idl.IDLStringType: return Ts.prim.str
        case idl.IDLU8Type: return Ts.prim.u8
        case idl.IDLU32Type: return Ts.prim.u32
        case idl.IDLU64Type: return Ts.prim.u64
        case idl.IDLVoidType: return Ts.prim.void
    }
    throw new Error(`Can not map ${idl.DebugUtils.debugPrintType(type)}`)
}

export const primitiveProducer = createProducer(
  { is: idl.isPrimitiveType },
  node => {
    return {
      artifact: {
        reference: selectType(node),
      }
    }
  }
)
