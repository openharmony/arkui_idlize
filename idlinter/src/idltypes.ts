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

import { UN } from "./servicetypes"
import * as idl from "@idlizer/core"

export type IDLNodeUnion = (idl.IDLNode
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

export type IDLNodeAny = idl.IDLNode & (UN<
idl.IDLFile, UN<
idl.IDLNamedNode, UN<
idl.IDLEntry, UN<
idl.IDLType, UN<
idl.IDLTypedef, UN<
idl.IDLPrimitiveType, UN<
idl.IDLOptionalType, UN<
idl.IDLContainerType, UN<
idl.IDLReferenceType, UN<
idl.IDLUnspecifiedGenericType, UN<
idl.IDLUnionType, UN<
idl.IDLTypeParameterType, UN<
idl.IDLVersion, UN<
idl.IDLVariable, UN<
idl.IDLTypedEntry, UN<
idl.IDLEnum, UN<
idl.IDLEnumMember, UN<
idl.IDLConstant, UN<
idl.IDLProperty, UN<
idl.IDLParameter, UN<
idl.IDLSignature, UN<
idl.IDLFunction, UN<
idl.IDLMethod, UN<
idl.IDLCallable, UN<
idl.IDLConstructor, UN<
idl.IDLInterface, UN<
idl.IDLImport, UN<
idl.IDLNamespace, 
idl.IDLCallback>>>>>>>>>>>>>>>>>>>>>>>>>>>>
)
