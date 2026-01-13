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

import { InteropProducerTypeDescription, makeSingletonProducer, SelectResult } from "../../generator/builder";
import { IDLBufferType, IDLPrimitiveType, IDLType } from "@idlizer/core/idl";
import { ColoredLibrary } from "../../library";
import { D, E, S, T } from "@idlizer/libohos";
import { KOALAUI_INTEROP_BUFFER } from "../../generator/names";

const [ohosBufferProducer, ohosBufferSeed] = makeSingletonProducer('capi.OH_Buffer', (name) => D.type(name, T.c(KOALAUI_INTEROP_BUFFER)))

export const createOhosBufferProducer = (_: ColoredLibrary): InteropProducerTypeDescription<IDLPrimitiveType> => {
    return {
        select: (type:IDLType) => type === IDLBufferType ? SelectResult.take(type as IDLPrimitiveType) : SelectResult.reject(),
        onManagedDeclaration: () => {
            return {
                continuation: T.c('ArrayBuffer'),
                declarations: []
            }
        },
        onNativeDeclaration() {
            return {
                continuation: ohosBufferSeed.createType({}),
                declarations: []
            }
        },
        interopBufferTransferable: () => ({
            symmetric: true,
            fromInteropBuffer(buffer) {
                return [[], E.call(E.get(buffer, 'readBuffer'), [])]
            },
            toInteropBuffer(arg, buffer) {
                return [S.e(E.call(E.get(buffer, 'writeBuffer'), [arg]))]
            },
        }),
        otherProducers: [ohosBufferProducer]
    }
}
