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

import * as idl from '../../idl'
import { ReferenceResolver } from '../../peer-generation/ReferenceResolver'
import { zip } from '../../util'
import { convertNode, convertType, IdlNameConvertor, NodeConvertor, TypeConvertor } from '../nameConvertor'

export class KotlinTypeNameConvertor implements NodeConvertor<string>, IdlNameConvertor {

    constructor(protected resolver: ReferenceResolver) { }

    convert(node: idl.IDLNode): string {
        return convertNode(this, node)
    }

    convertNamespace(node: idl.IDLNamespace): string {
        throw new Error("Not implemented")
    }
    convertInterface(node: idl.IDLInterface): string {
        throw new Error("Not implemented")
    }
    convertEnum(node: idl.IDLEnum): string {
        throw new Error("Not implemented")
    }
    convertTypedef(node: idl.IDLTypedef): string {
        throw new Error("Not implemented")
    }
    convertCallback(node: idl.IDLCallback): string {
        throw new Error("Not implemented")
    }
    convertMethod(node: idl.IDLMethod): string {
        throw new Error("Not implemented")
    }
    convertConstant(node: idl.IDLConstant): string {
        throw new Error("Not implemented")
    }
    convertOptional(type: idl.IDLOptionalType): string {
        throw new Error("Not implemented")
    }
    convertUnion(type: idl.IDLUnionType): string {
        throw new Error("Not implemented")
    }
    convertContainer(type: idl.IDLContainerType): string {
        throw new Error("Not implemented")
    }
    convertImport(type: idl.IDLImport): string {
        throw new Error("Not implemented")
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): string {
        throw new Error("Not implemented")
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        throw new Error("Not implemented")
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        throw new Error("Not implemented")
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        throw new Error("Not implemented")
    }
}