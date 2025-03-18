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

import { ReferenceResolver } from './ReferenceResolver'
import { IDLType, IDLEnum, isReferenceType, isEnum, isStringEnum } from "../idl"

export function isEnumType(type: IDLType, resolver: ReferenceResolver): boolean {
    return toEnum(type, resolver) != undefined
}

export function isStringEnumType(type: IDLType, resolver: ReferenceResolver): boolean {
    const enumNode = toEnum(type, resolver)
    return enumNode ? isStringEnum(enumNode) : false
}

function toEnum(type: IDLType, resolver: ReferenceResolver): IDLEnum | undefined {
    if (!isReferenceType(type)) return undefined
    const resolved = resolver.resolveTypeReference(type)
    return resolved && isEnum(resolved) ? resolved : undefined
}
