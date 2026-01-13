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

import { D, E, LWType, S, T, Ts } from "@idlizer/libohos"
import { IDLBooleanType, IDLI32Type, IDLPointerType, IDLPrimitiveType, IDLU64Type, IDLU8Type, isPrimitiveType } from "@idlizer/core/idl"
import { InteropProducerTypeDescription, SelectResult } from "../../generator/builder"
import { InputLibrary } from "../../library"
import { KOALAUI_INTEROP_BOOLEAN, KOALAUI_INTEROP_INT32, KOALAUI_INTEROP_NATIVE_POINTER, KOALAUI_INTEROP_UINT64, KOALAUI_INTEROP_UINT8, KOALAUI_KBOOLEAN, KOALAUI_KINT32, KOALAUI_KPOINTER, KOALAUI_KUINT64, KOALAUI_KUINT8 } from "../../generator/names"

interface TypeSpec {
    idlType: IDLPrimitiveType,
    managedType: LWType,
    capiType: [string, LWType],
    interopType: LWType,
    serializerFunctionSuffix: string
}

function addOhosTrivialProducers(
    types: TypeSpec[]
): InteropProducerTypeDescription<TypeSpec> {
    return {
        select(ref) {
            if (!isPrimitiveType(ref)) {
                return SelectResult.reject()
            }
            const found = types.find(record => record.idlType === ref)
            if (!found) {
                return SelectResult.reject()
            }
            return SelectResult.take(found)
        },
        onManagedDeclaration(spec) {
            return {
                continuation: spec.managedType,
                declarations: []
            }
        },
        onNativeDeclaration(spec) {
            const name = 'capi.' + spec.capiType[0]
            return {
                continuation: T.c(name),
                declarations: [
                    D.type(name, spec.capiType[1])
                ]
            }
        },
        fromInteropTransferable: (spec) => {
            return {
                fromInteropReturn(param) {
                    return param
                },
                toInteropReturn(param) {
                    return [param, spec.interopType]
                },
            }
        },
        toInteropTransferable: (spec) => {
            return {
                fromInteropArgument(param) {
                    return param
                },
                toInteropArgument(param) {
                    return [param, spec.interopType]
                },
            }
        },
        interopBufferTransferable: (spec) => {
            return {
                symmetric: true,
                fromInteropBuffer(buffer) {
                    return [[], E.call(E.get(buffer, 'read' + spec.serializerFunctionSuffix), [])]
                },
                toInteropBuffer(arg, buffer) {
                    return [
                        S.e(E.call(E.get(buffer, 'write' + spec.serializerFunctionSuffix), [arg]))
                    ]
                },
            }
        }
    }
}

export const createOhosIntegralTypeProducer = (_: InputLibrary): InteropProducerTypeDescription<TypeSpec> => {
    return addOhosTrivialProducers([
        {
            idlType: IDLBooleanType,
            managedType: Ts.prim.boolean,
            capiType: ['OH_Boolean', T.c(KOALAUI_INTEROP_BOOLEAN)],
            interopType: T.c(KOALAUI_KBOOLEAN),
            serializerFunctionSuffix: 'Boolean'
        },
        {
            idlType: IDLU8Type,
            managedType: Ts.prim.u8,
            capiType: ['OH_Uint8', T.c(KOALAUI_INTEROP_UINT8)],
            interopType: T.c(KOALAUI_KUINT8),
            serializerFunctionSuffix: 'UInt8'
        },
        {
            idlType: IDLI32Type,
            managedType: Ts.prim.i32,
            capiType: ['OH_Int32', T.c(KOALAUI_INTEROP_INT32)],
            interopType: T.c(KOALAUI_KINT32),
            serializerFunctionSuffix: 'Int32'
        },
        {
            idlType: IDLU64Type,
            managedType: Ts.prim.u64,
            capiType: ['OH_UInt64', T.c(KOALAUI_INTEROP_UINT64)],
            interopType: T.c(KOALAUI_KUINT64),
            serializerFunctionSuffix: 'UInt64'
        },
        {
            idlType: IDLPointerType,
            managedType: T.c(KOALAUI_KPOINTER),
            capiType: ['OH_NativePointer', T.c(KOALAUI_INTEROP_NATIVE_POINTER)],
            interopType: T.c(KOALAUI_KPOINTER),
            serializerFunctionSuffix: 'Pointer'
        }
    ])
}

// [IDLBooleanType, Ts.prim.boolean, 'Boolean'],
// [IDLU8Type, Ts.prim.u8, 'UInt8'],
// [IDLI32Type, Ts.prim.i32, 'Int32'],
// [IDLU64Type, Ts.prim.u64, 'UInt64'],
// [IDLPointerType, Ts.prim.pointer, 'Pointer'],
