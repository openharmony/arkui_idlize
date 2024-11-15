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

import * as idl from "../idl";
import { PeerLibrary } from "./PeerLibrary";

export interface ReferenceResolver {
    resolveTypeReference(type: idl.IDLReferenceType, entries?: idl.IDLEntry[]): idl.IDLEntry | undefined
    toDeclaration(type: idl.IDLType | idl.IDLCallback): idl.IDLNode
}

export function createEmptyReferenceResolver(): ReferenceResolver {
    return {
        resolveTypeReference() {
            return undefined
        },
        toDeclaration(type) {
            return type
        }
    }
}

export function getReferenceResolver(library: PeerLibrary): ReferenceResolver {
    return library
}
