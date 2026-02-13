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

import * as idl from "@idlizer/core/idl"
import { Ts, lw } from "@idlizer/ost"
import { createProducer } from "../../engine/index.js"

function convertType(type: idl.IDLPrimitiveType): lw.LWType {
    switch (type.name) {
        case 'any': return Ts.prim.object
        case 'bigint': return Ts.prim.bigint
        case 'boolean': return Ts.prim.boolean
        case 'buffer': return Ts.prim.buffer
        case 'date': return Ts.prim.u64///?
        case 'f32': return Ts.prim.f32
        case 'f64': return Ts.prim.f64
        case 'i8': return Ts.prim.i8
        case 'i32': return Ts.prim.i32
        case 'i64': return Ts.prim.i64
        case 'number': return Ts.prim.number
        case 'Object': return Ts.prim.object
        case 'pointer': return Ts.prim.pointer
        case 'SerializerBuffer': return Ts.prim.serializerBuffer
        case 'String': return Ts.prim.str
        case 'u8': return Ts.prim.u8
        case 'u32': return Ts.prim.u32
        case 'u64': return Ts.prim.u64
        case 'void': return Ts.prim.void
        default:
            throw new Error(`Can not map ${idl.DebugUtils.debugPrintType(type)}`)
    }
}

export const primitiveProducer = createProducer(
  { is: idl.isPrimitiveType },
  type => ({
    continuation: convertType(type),
    declarations: []
  })
)
