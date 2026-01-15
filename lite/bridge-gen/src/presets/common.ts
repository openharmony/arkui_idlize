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

import { E, LWType, S } from "@idlizer/ost"
import { IDLPrimitiveType, isPrimitiveType } from "@idlizer/core"
import { InteropProducerTypeDescription, SelectResult } from "../generator/builder"
import { terminate } from "@idlizer/kit"

export function addTrivialProducers(
    types: [IDLPrimitiveType, LWType, string][]
): InteropProducerTypeDescription<IDLPrimitiveType> {
    return {
        select(ref) {
            if (!isPrimitiveType(ref)) {
                return SelectResult.reject()
            }
            const found = types.find(record => record[0] === ref)
            if (!found) {
                return SelectResult.reject()
            }
            return SelectResult.take(ref as IDLPrimitiveType)
        },
        onManagedDeclaration(val) {
            const found = types.find(record => record[0] === val) ?? terminate("WOW!")
            return {
                continuation: found[1],
                declarations: []
            }
        },
        onNativeDeclaration(val) {
            const found = types.find(record => record[0] === val) ?? terminate("WOW!")
            return {
                continuation: found[1],
                declarations: []
            }
        },
        fromInteropTransferable: (val) => {
            const found = types.find(record => record[0] === val) ?? terminate("WOW!")
            return {
                fromInteropReturn(param) {
                    return param
                },
                toInteropReturn(param) {
                    return [param, found[1]]
                },
            }
        },
        toInteropTransferable: (val) => {
            const found = types.find(record => record[0] === val) ?? terminate("WOW!")
            return {
                fromInteropArgument(param) {
                    return param
                },
                toInteropArgument(param) {
                    return [param, found[1]]
                },
            }
        },
        interopBufferTransferable: (val) => {
            const found = types.find(record => record[0] === val) ?? terminate("WOW!")
            return {
                symmetric: true,
                fromInteropBuffer(buffer) {
                    return [[], E.call(E.get(buffer, 'read' + found[2]), [])]
                },
                toInteropBuffer(arg, buffer) {
                    return [
                        S.e(E.call(E.get(buffer, 'write' + found[2]), [arg]))
                    ]
                },
            }
        }
    }
}
