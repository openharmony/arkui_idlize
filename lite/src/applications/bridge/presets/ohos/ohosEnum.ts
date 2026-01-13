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

import { InteropProducerTypeDescription, SelectResult } from "../../generator/builder";
import { getFQName, IDLEnum, IDLType, isEnum, isReferenceType } from "@idlizer/core/idl";
import { ColoredLibrary } from "../../library";
import { D, E, S, T } from "@idlizer/libohos";
import { throwDeclarationWasNotFound } from "../../generator/common";

export const createOhosEnum = (library: ColoredLibrary): InteropProducerTypeDescription<IDLEnum> => {
    return {
        select: (ref: IDLType) => {
            if (isReferenceType(ref)) {
                const found = library.index.get(ref.name) ?? throwDeclarationWasNotFound(ref)
                if (found && isEnum(found)) {
                    return SelectResult.take(found)
                }
            }
            return SelectResult.reject()
        },
        onManagedDeclaration: (decl) => {
            const name = getFQName(decl)
            return {
                continuation: T.c(name),
                declarations: [
                    D.enum(name, decl.elements.map(el => ({
                        name: el.name,
                        value: el.initializer
                    })))
                ]
            }
        },
        onNativeDeclaration(decl) {
            const name = 'capi.' + getFQName(decl).split('.').join('_')
            return {
                continuation: T.c(name),
                declarations: [
                    D.enum(name, decl.elements.map(el => ({
                        name: el.name,
                        value: el.initializer
                    })))
                ]
            }
        },
        returnBufferTransferable: (decl) => ({
            fromReturnBuffer(buffer) {
                const declName = getFQName(decl)
                return [[], E.cast(E.call(E.get(buffer, 'readInt32'), []), T.c(declName))]
            },
            toReturnBuffer(arg, buffer) {
                return [S.e(E.call(E.get(buffer, 'writeInt32'), [arg]))]
            },
        })
    }
}
