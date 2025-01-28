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

import * as idl from "@idlizer/core/idl"
import * as fs from "fs"
import * as path from "path"
import { convertDeclaration, convertType, DeclarationConvertor, TypeConvertor } from "@idlizer/core"
import { ImportFeature } from "../../ImportsCollector"
import { createLanguageWriter, Method, MethodModifier, MethodSignature } from "../../LanguageWriters"
import { collectUniqueCallbacks } from "../CallbacksPrinter"
import { PeerLibrary } from "../../PeerLibrary"
import { Language } from "@idlizer/core"

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

    convertNamespace(node: idl.IDLNamespace): ImportFeature[] {
        throw new Error("Internal error: namespaces are not allowed on the CJ layer")
    }
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
    convertMethod(decl: idl.IDLMethod): ImportFeature[] {
        return [
            ...decl.parameters.flatMap(it => convertType(this.typeDepsCollector, it.type!)),
            ...convertType(this.typeDepsCollector, decl.returnType),
        ]
    }
    convertConstant(decl: idl.IDLConstant): ImportFeature[] {
        return convertType(this.typeDepsCollector, decl.type)
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
export function makeGetFunctionRuntimeType(library: PeerLibrary) {
    const uniqCallbacks = collectUniqueCallbacks(library, { transformCallbacks: true })
    const writer = createLanguageWriter(Language.CJ, library)
    writer.pushIndent()
    for (const callback of uniqCallbacks) {
        const signature = new MethodSignature(idl.createReferenceType('RuntimeType'), [idl.maybeOptional(idl.createReferenceType(callback.name), true)])
        const method = new Method('getRuntimeType', signature, [MethodModifier.STATIC])
        writer.writeMethodImplementation(method, () => {
            writer.makeCheckOptional(writer.makeString('arg0'), writer.makeReturn(writer.makeString('RuntimeType.FUNCTION'))).write(writer)
            writer.makeReturn(writer.makeString('RuntimeType.UNDEFINED')).write(writer)
        })  
    }
    let Ark_Object = fs.readFileSync(path.join(__dirname, `../templates/cangjie/Ark_Object_template.cj`), 'utf8').replace('%GET_FUNCTION_RUNTIME%', writer.getOutput().join('\n'))
    return Ark_Object
}