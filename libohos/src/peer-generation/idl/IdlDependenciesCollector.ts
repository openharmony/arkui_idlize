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

import * as idl from '@idlizer/core/idl'
import { IdlNameConvertor, NodeConvertor, convertNode, convertType, flattenUnionType, getSyntheticTypesFileName, maybeRestoreGenerics } from "@idlizer/core"
import { LibraryInterface, PeerLibrary } from '@idlizer/core'
import { Language } from '@idlizer/core'

export class DependenciesCollector implements NodeConvertor<idl.IDLEntry[]> {
    private nodeStack: string[] = []
    constructor(protected readonly library: LibraryInterface) {}

    convertOptional(type: idl.IDLOptionalType): idl.IDLEntry[] {
        return convertType(this, type.type)
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        return type.types.flatMap(ty => convertType(this, ty))
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLEntry[] {
        return type.elementType.flatMap(ty => convertType(this, ty))
    }
    convertImport(import_: idl.IDLImport): idl.IDLEntry[] {
        const maybeDecl = this.library.resolveTypeReference(idl.createReferenceType(import_.clause.join(".")))
        return maybeDecl ? [maybeDecl] : []
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const maybeDecl = this.library.resolveTypeReference(type)
        return maybeDecl ? [maybeDecl] : []
    }
    private preventRecursive = new Set<idl.IDLEntry>()
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (!decl) return []
        if (this.preventRecursive.has(decl))
            return []
        this.preventRecursive.add(decl)
        const result: idl.IDLEntry[] = idl.isEnumMember(decl) ? [decl.parent] : [decl]
        if (type.typeArguments) {
            result.push(...type.typeArguments.flatMap(it => convertType(this, it)))
        }
        if (idl.isCallback(decl)) {
            result.push(...decl.parameters.flatMap(it => this.convert(it.type)))
        }
        if (idl.isTypedef(decl)) {
            result.push(...this.convert(decl))
        }
        if (idl.isInterface(decl) && [idl.IDLInterfaceSubkind.AnonymousInterface, idl.IDLInterfaceSubkind.Tuple].includes(decl.subkind)) {
            result.push(...this.convert(decl))
        }
        this.preventRecursive.delete(decl)
        return result
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLEntry[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLEntry[] {
        return []
    }
    convertNamespace(decl: idl.IDLNamespace): idl.IDLEntry[] {
        return decl.members.flatMap(it => this.convert(it))
    }
    convertInterface(decl: idl.IDLInterface): idl.IDLEntry[] {
        return [
            ...decl.inheritance
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
    protected convertSupertype(type: idl.IDLType | idl.IDLInterface): idl.IDLEntry[] {
        if (idl.isInterface(type)) {
            return this.convert(idl.createReferenceType(type))
        }
        return this.convert(type)
    }
    convertEnum(decl: idl.IDLEnum): idl.IDLEntry[] {
        return []
    }
    convertTypedef(decl: idl.IDLTypedef): idl.IDLEntry[] {
        if (this.nodeStack.includes(decl.name))
            return []  // break typedef cycles that cause overflows
        this.nodeStack.push(decl.name)
        const entries = this.convert(decl.type)
        this.nodeStack.pop()
        return entries
    }
    convertCallback(decl: idl.IDLCallback): idl.IDLEntry[] {
        return [
            ...decl.parameters.flatMap(it => this.convert(it.type!)),
            ...this.convert(decl.returnType),
        ]
    }
    convertMethod(decl: idl.IDLMethod): idl.IDLEntry[] {
        return [
            ...decl.parameters.flatMap(it => this.convert(it.type!)),
            ...this.convert(decl.returnType),
        ]
    }
    convertConstant(decl: idl.IDLConstant): idl.IDLEntry[] {
        return this.convert(decl.type)
    }
    convert(node: idl.IDLNode | undefined): idl.IDLEntry[] {
        if (node === undefined)
            return []
        return convertNode(this, node)
    }
}

class TSDependenciesCollector extends DependenciesCollector {
    private static cache: Map<idl.IDLNode, idl.IDLEntry[]> = new Map()
    override convert(node: idl.IDLNode | undefined): idl.IDLEntry[] {
        if (!node)
            return []
        if (!TSDependenciesCollector.cache.has(node))
            TSDependenciesCollector.cache.set(node, super.convert(node))
        return TSDependenciesCollector.cache.get(node)!
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        type = maybeRestoreGenerics(type, this.library) ?? type
        const resolved = this.library.resolveTypeReference(type)
        if (resolved && (idl.isInterface(resolved) || idl.isCallback(resolved)) && idl.isSyntheticEntry(resolved)) {
            // type literal
            const result = this.convert(resolved)
            if (this.library.language === Language.ARKTS) {
                // ArkTS needs synthetic type literals as dependencies
                result.push(resolved)
            }
            return result
        }
        return super.convertTypeReference(type)
    }
}

export class ArkTSInterfaceDependenciesCollector extends DependenciesCollector {
    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl && idl.isSyntheticEntry(decl)) {
            return [
                decl,
            ]
        }
        return super.convertTypeReference(type);
    }
    override convertInterface(decl: idl.IDLInterface): idl.IDLEntry[] {
        return [
            ...decl.inheritance
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
    protected override convertSupertype(type: idl.IDLType | idl.IDLInterface): idl.IDLEntry[] {
        if (idl.isReferenceType(type)) {
            const resolved = this.library.resolveTypeReference(type)
            if (resolved && idl.isInterface(resolved))
                return this.convertSupertype(resolved)
        }
        if (idl.isInterface(type)) {
            return [
                type
            ]
        }
        console.log("Cannot be converted", type?.fileName)
        return []
    }
}

class CJDependenciesCollector extends DependenciesCollector {
    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        return []
    }
}

export class KotlinDependenciesCollector extends DependenciesCollector {
    protected readonly typeNameConvertor: IdlNameConvertor
    constructor(library: LibraryInterface) {
        super(library)
        this.typeNameConvertor = library.createTypeNameConvertor(Language.KOTLIN)
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        type = maybeRestoreGenerics(type, this.library) ?? type
        const resolved = this.library.resolveTypeReference(type)
        if (resolved && (idl.isInterface(resolved) || idl.isCallback(resolved)) && idl.isSyntheticEntry(resolved)) {
            // type literal
            const result = this.convert(resolved)
            result.push(resolved)
            return result
        }
        return super.convertTypeReference(type)
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        const result = super.convertUnion(type)
        const unionEntry = this.synthesizeUnionEntry(type)
        result.push(unionEntry)

        const flattened = flattenUnionType(this.library, type)
        if (idl.isUnionType(flattened) && type.name !== flattened.name) {
            const flattenedUnionEntry = this.synthesizeUnionEntry(flattened)
            result.push(flattenedUnionEntry)
        }

        return result
    }
    private synthesizeUnionEntry(type: idl.IDLUnionType): idl.IDLEntry {
        // TBD: Synthesize unions for Kotlin in a unified way in one place
        const entry = idl.createInterface(this.typeNameConvertor.convert(type), idl.IDLInterfaceSubkind.Interface)
        const packageName = getSyntheticTypesFileName()
        const file = idl.createFile([entry], packageName, [packageName])
        idl.linkParentBack(file)
        return entry
    }
}

export function createDependenciesCollector(library: PeerLibrary): DependenciesCollector {
    switch (library.language) {
        case Language.TS: return new TSDependenciesCollector(library)
        case Language.ARKTS: return new TSDependenciesCollector(library)
        case Language.CJ: return new CJDependenciesCollector(library)
        case Language.KOTLIN: return new KotlinDependenciesCollector(library)
        // in CJ there is no imports (just files in the same package)
        default: throw new Error("Not implemented")
    }
}
