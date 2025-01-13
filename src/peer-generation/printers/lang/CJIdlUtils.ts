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

import * as idl from "@idlize/core/idl"
import { convertDeclaration, convertType, DeclarationConvertor, TypeConvertor } from "../../LanguageWriters/nameConvertor"
import { ImportFeature } from "../../ImportsCollector"

class CJImportsCollector implements TypeConvertor<ImportFeature[]> {
    convertOptional(type: idl.IDLOptionalType): ImportFeature[] {
        throw new Error("Unimplemented")
    }
    convertUnion(type: idl.IDLUnionType): ImportFeature[] {
        return []
    }
    convertContainer(type: idl.IDLContainerType): ImportFeature[] {
        const result = type.elementType.flatMap(ty => convertType(this, ty))
        if (idl.IDLContainerUtils.isRecord(type)) {
            result.push({feature: "java.util.Map", module: ""})
        }
        return result
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): ImportFeature[] {
        return []
    }
    convertTypeReference(type: idl.IDLReferenceType): ImportFeature[] {
        return []
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): ImportFeature[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): ImportFeature[] {
        return []
    }
    convert(node: idl.IDLType | undefined): ImportFeature[] {
        return node ? convertType(this, node) : []
    }
}

function uniqueImports(imports: ImportFeature[]): ImportFeature[] {
    const seen = new Set<string>();
    return imports.filter(item => {
        const key = item.feature
        return seen.has(key) ? false : seen.add(key)
    });
}

export function collectJavaImports(nodes: idl.IDLType[]): ImportFeature[] {
    const collector = new CJImportsCollector()
    const allImports = nodes.flatMap(node => collector.convert(node))
    return uniqueImports(allImports)
}


class CJDeclarationImportsCollector implements DeclarationConvertor<ImportFeature[]> {
    private readonly typeDepsCollector = new CJImportsCollector()

    convertInterface(decl: idl.IDLInterface): ImportFeature[] {
        return [
            ...decl.inheritance
                .filter(it => it !== idl.IDLTopType)
                .flatMap(it => this.convertSupertype(it)),
            ...decl.properties.flatMap(it => this.typeDepsCollector.convert(it.type)),
            ...[...decl.callables, ...decl.methods].flatMap(it => [
                ...it.parameters.flatMap(param => this.typeDepsCollector.convert(param.type)),
                ...this.typeDepsCollector.convert(it.returnType)])
        ]
    }
    protected convertSupertype(type: idl.IDLType): ImportFeature[] {
        return this.typeDepsCollector.convert(type)
    }
    convertEnum(decl: idl.IDLEnum): ImportFeature[] {
        return []
    }
    convertTypedef(decl: idl.IDLTypedef): ImportFeature[] {
        return convertType(this.typeDepsCollector, decl.type)
    }
    convertCallback(decl: idl.IDLCallback): ImportFeature[] {
        return [
            ...decl.parameters.flatMap(it => convertType(this.typeDepsCollector, it.type!)),
            ...convertType(this.typeDepsCollector, decl.returnType),
        ]
    }
    convert(node: idl.IDLEntry | undefined): ImportFeature[] {
        if (node === undefined)
            return []
        return convertDeclaration(this, node)
    }
}

export function collectCJImportsForDeclaration(declaration: idl.IDLEntry | undefined): ImportFeature[] {
    const collector = new CJDeclarationImportsCollector()
    return uniqueImports(collector.convert(declaration))
}
