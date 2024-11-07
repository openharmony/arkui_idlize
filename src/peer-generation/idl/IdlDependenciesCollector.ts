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
import { DeclarationConvertor, TypeConvertor, convertDeclaration, convertType } from "../LanguageWriters/typeConvertor";
import { LibraryInterface } from '../../LibraryInterface';

export class TypeDependenciesCollector implements TypeConvertor<idl.IDLNode[]> {
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
        const typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)
        if (typeArgs) {
            result.push(...typeArgs.split(",").flatMap(it => convertType(this, idl.toIDLType(it))))
        }
        return result
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLNode[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLNode[] {
        return []
    }
    convert(node: idl.IDLType | undefined): idl.IDLNode[] {
        return node ? convertType(this, node) : []
    }
}

export class DeclarationDependenciesCollector implements DeclarationConvertor<idl.IDLNode[]> {
    constructor(
        private readonly typeDepsCollector: TypeDependenciesCollector,
    ) {}
    convertInterface(decl: idl.IDLInterface): idl.IDLNode[] {
        return [
            ...decl.inheritance
                .filter(it => it !== idl.IDLTopType)
                .flatMap(it => this.convertSupertype(it)),
            ...decl.properties
                .filter(it => !it.isStatic)
                .flatMap(it => this.typeDepsCollector.convert(it.type)),
            ...[...decl.constructors, ...decl.callables, ...decl.methods]
                .flatMap(it => [
                    ...it.parameters.flatMap(param => this.typeDepsCollector.convert(param.type)),
                    ...this.typeDepsCollector.convert(it.returnType)
                ])
        ]
    }
    protected convertSupertype(type: idl.IDLType | idl.IDLInterface): idl.IDLNode[] {
        if (idl.isInterface(type)) {
            return this.typeDepsCollector.convert(idl.createReferenceType(type.name))
        }
        return this.typeDepsCollector.convert(type)
    }
    convertEnum(decl: idl.IDLEnum): idl.IDLNode[] {
        return []
    }
    convertTypedef(decl: idl.IDLTypedef): idl.IDLNode[] {
        return convertType(this.typeDepsCollector, decl.type)
    }
    convertCallback(decl: idl.IDLCallback): idl.IDLNode[] {
        return [
            ...decl.parameters.flatMap(it => convertType(this.typeDepsCollector, it.type!)),
            ...convertType(this.typeDepsCollector, decl.returnType),
        ]
    }
    convert(node: idl.IDLEntry | undefined): idl.IDLNode[] {
        if (node === undefined)
            return []
        return convertDeclaration(this, node)
    }
}
