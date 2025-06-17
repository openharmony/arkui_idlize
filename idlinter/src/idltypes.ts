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

import { FieldMix, RecursivePattern } from "./servicetypes"
import * as idl from "@idlizer/core"

export type IdlNodeUnion = (idl.IDLNode
| idl.IDLFile
| idl.IDLNamedNode
| idl.IDLEntry
| idl.IDLType
| idl.IDLTypedef
| idl.IDLPrimitiveType
| idl.IDLOptionalType
| idl.IDLContainerType
| idl.IDLReferenceType
| idl.IDLUnspecifiedGenericType
| idl.IDLUnionType
| idl.IDLTypeParameterType
| idl.IDLVersion
| idl.IDLVariable
| idl.IDLTypedEntry
| idl.IDLEnum
| idl.IDLEnumMember
| idl.IDLConstant
| idl.IDLProperty
| idl.IDLParameter
| idl.IDLSignature
| idl.IDLFunction
| idl.IDLMethod
| idl.IDLCallable
| idl.IDLConstructor
| idl.IDLInterface
| idl.IDLImport
| idl.IDLNamespace
| idl.IDLCallback
)

export type IdlNodeAny = idl.IDLNode & (FieldMix<
idl.IDLFile, FieldMix<
idl.IDLNamedNode, FieldMix<
idl.IDLEntry, FieldMix<
idl.IDLType, FieldMix<
idl.IDLTypedef, FieldMix<
idl.IDLPrimitiveType, FieldMix<
idl.IDLOptionalType, FieldMix<
idl.IDLContainerType, FieldMix<
idl.IDLReferenceType, FieldMix<
idl.IDLUnspecifiedGenericType, FieldMix<
idl.IDLUnionType, FieldMix<
idl.IDLTypeParameterType, FieldMix<
idl.IDLVersion, FieldMix<
idl.IDLVariable, FieldMix<
idl.IDLTypedEntry, FieldMix<
idl.IDLEnum, FieldMix<
idl.IDLEnumMember, FieldMix<
idl.IDLConstant, FieldMix<
idl.IDLProperty, FieldMix<
idl.IDLParameter, FieldMix<
idl.IDLSignature, FieldMix<
idl.IDLFunction, FieldMix<
idl.IDLMethod, FieldMix<
idl.IDLCallable, FieldMix<
idl.IDLConstructor, FieldMix<
idl.IDLInterface, FieldMix<
idl.IDLImport, FieldMix<
idl.IDLNamespace, 
idl.IDLCallback>>>>>>>>>>>>>>>>>>>>>>>>>>>>
)

export type IdlRecursivePattern = RecursivePattern<IdlNodeUnion>
