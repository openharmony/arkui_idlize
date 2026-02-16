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

import { IDLPrimitiveType, isPrimitiveType } from "@idlizer/core/idl"
import { InputLibrary } from "../../library"
import { InteropProducerTypeDescription, makeDeclarationProducer, SelectResult } from "../../generator/builder"
import { D, E, Hs, S, T, Ts } from "@idlizer/ost"
import { makeSeed } from "@idlizer/kit"
import { KOALAUI_INTEROP_STRING } from "../../generator/names"

export const [ohStringProducer, OHStringSeed] = makeDeclarationProducer(
    makeSeed(() => 'capi.OH_String'),
    () => {
        return {
            continuation: T.c('capi.OH_String'),
            declarations: [
                D.type('capi.OH_String', T.c(KOALAUI_INTEROP_STRING))
            ]
        }
    }
)

export const createOHStringProducer = (_: InputLibrary): InteropProducerTypeDescription<IDLPrimitiveType> => {
    return {
        select: (type) => isPrimitiveType(type, 'String') ? SelectResult.take(type as IDLPrimitiveType) : SelectResult.reject(),
        interopBufferTransferable: () => ({
            symmetric: true,
            toInteropBuffer(arg, buffer) {
                return [
                    S.e(E.call(E.get(buffer, 'writeString'), [arg]))
                ]
            },
            fromInteropBuffer(buffer) {
                return [[], E.call(E.get(buffer, 'readString'), [])]
            },
        }),
        onManagedDeclaration() {
            return {
                continuation: Ts.prim.str,
                declarations: []
            }
        },
        onNativeDeclaration() {
            return {
                continuation: OHStringSeed.createType({}),
                declarations: []
            }
        },
        otherProducers: [
            ohStringProducer
        ]
    }
}
