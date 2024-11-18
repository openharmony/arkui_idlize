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
import { NodeConvertor, convertNode, convertType } from "../LanguageWriters/nameConvertor";
import { LibraryInterface } from '../../LibraryInterface';

export class DependenciesCollector implements NodeConvertor<idl.IDLNode[]> {
    constructor(protected readonly library: LibraryInterface) {}

    convertOptional(type: idl.IDLOptionalType): idl.IDLNode[] {
        return convertType(this, type.type)
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        return type.types.flatMap(ty => convertType(this, ty))
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return type.elementType.flatMap(ty => convertType(this, ty))
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        return []
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
        const decl = this.library.resolveTypeReference(type)
        const result: idl.IDLNode[] = !decl ? []
            : idl.isEnumMember(decl) ? [decl.parent] : [decl]
        if (type.typeArguments) {
            result.push(...type.typeArguments.flatMap(it => convertType(this, it)))
        }
        return result
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLNode[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLNode[] {
        return []
    }
    convertInterface(decl: idl.IDLInterface): idl.IDLNode[] {
        return [
            ...decl.inheritance
                .filter(it => it !== idl.IDLTopType)
                .flatMap(it => this.convertSupertype(it)),
            ...decl.properties
                .filter(it => !it.isStatic)
                .flatMap(it => this.convert(it.type)),
            ...[...decl.constructors, ...decl.callables, ...decl.methods]
                .flatMap(it => [
                    ...it.parameters.flatMap(param => this.convert(param.type)),
                    ...this.convert(it.returnType)
                ])
        ]
    }
    protected convertSupertype(type: idl.IDLType | idl.IDLInterface): idl.IDLNode[] {
        if (idl.isInterface(type)) {
            return this.convert(idl.createReferenceType(type.name))
        }
        return this.convert(type)
    }
    convertEnum(decl: idl.IDLEnum): idl.IDLNode[] {
        return []
    }
    convertTypedef(decl: idl.IDLTypedef): idl.IDLNode[] {
        return this.convert(decl.type)
    }
    convertCallback(decl: idl.IDLCallback): idl.IDLNode[] {
        return [
            ...decl.parameters.flatMap(it => this.convert(it.type!)),
            ...this.convert(decl.returnType),
        ]
    }
    convert(node: idl.IDLNode | undefined): idl.IDLNode[] {
        if (node === undefined)
            return []
        return convertNode(this, node)
    }
}
