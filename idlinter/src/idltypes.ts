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

import * as idl from "@idlizer/core"

export type IdlNodeAny = {
    _idlNodeBrand: any
    kind: idl.IDLKind
    nodeLocation?: idl.Location
    nameLocation?: idl.Location
    valueLocation?: idl.Location
    parent?: idl.IDLNode | (idl.IDLNode & idl.IDLEnum)
    fileName?: string
    extendedAttributes?: idl.IDLExtendedAttribute[]
    documentation?: string
    members?: idl.IDLEntry[]
    _idlEntryBrand?: any
    comment?: string
    _idlNamedNodeBrand?: any
    name?: string
    returnType?: idl.IDLType
    typeParameters?: string[]
    parameters?: idl.IDLParameter[]
    clause?: string[]
    subkind?: idl.IDLInterfaceSubkind
    inheritance?: idl.IDLReferenceType[]
    constructors?: idl.IDLConstructor[]
    constants?: idl.IDLConstant[]
    properties?: idl.IDLProperty[]
    methods?: idl.IDLMethod[]
    callables?: idl.IDLCallable[]
    isStatic?: boolean
    isAsync?: boolean
    isOptional?: boolean
    isFree?: boolean
    isVariadic?: boolean
    type?: idl.IDLType | idl.IDLPrimitiveType
    isReadonly?: boolean
    value?: string | string[]
    initializer?: string | number
    elements?: idl.IDLEnumMember[]
    _idlTypeBrand?: any;
    types?: idl.IDLType[]
    typeArguments?: idl.IDLType[]
    elementType?: idl.IDLType[]
    containerKind?: idl.IDLContainerKind
    packageClause?: string[]
    entries?: idl.IDLEntry[]
    text?: string
}

export type IdlNodePattern = {
    _idlNodeBrand?: any
    kind?: idl.IDLKind
    nodeLocation?: idl.Location
    nameLocation?: idl.Location
    valueLocation?: idl.Location
    parent?: idl.IDLNode | (idl.IDLNode & idl.IDLEnum)
    fileName?: string
    extendedAttributes?: idl.IDLExtendedAttribute[]
    documentation?: string
    members?: idl.IDLEntry[]
    _idlEntryBrand?: any
    comment?: string
    _idlNamedNodeBrand?: any
    name?: string
    returnType?: idl.IDLType
    typeParameters?: string[]
    parameters?: idl.IDLParameter[]
    clause?: string[]
    subkind?: idl.IDLInterfaceSubkind
    inheritance?: idl.IDLReferenceType[]
    constructors?: idl.IDLConstructor[]
    constants?: idl.IDLConstant[]
    properties?: idl.IDLProperty[]
    methods?: idl.IDLMethod[]
    callables?: idl.IDLCallable[]
    isStatic?: boolean
    isAsync?: boolean
    isOptional?: boolean
    isFree?: boolean
    isVariadic?: boolean
    type?: idl.IDLType | idl.IDLPrimitiveType
    isReadonly?: boolean
    value?: string | string[]
    initializer?: string | number
    elements?: idl.IDLEnumMember[]
    _idlTypeBrand?: any;
    types?: idl.IDLType[]
    typeArguments?: idl.IDLType[]
    elementType?: idl.IDLType[]
    containerKind?: idl.IDLContainerKind
    packageClause?: string[]
    entries?: idl.IDLEntry[]
    text?: string
}
