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
import { NodeConvertor, convertNode, convertType } from "@idlizer/core"
import { LibraryInterface, PeerLibrary } from '@idlizer/core'
import { Language, getInternalClassName, isMaterialized } from '@idlizer/core'

export class DependenciesCollector implements NodeConvertor<idl.IDLEntry[]> {
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
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (!decl) return []
        const result: idl.IDLEntry[] = idl.isEnumMember(decl) ? [decl.parent] : [decl]
        if (type.typeArguments) {
            result.push(...type.typeArguments.flatMap(it => convertType(this, it)))
        }
        if (idl.isCallback(decl)) {
            result.push(...decl.parameters.flatMap(it => this.convert(it.type)))
        }
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
        return this.convert(decl.type)
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
        const resolved = this.library.resolveTypeReference(type)
        if (resolved && idl.isInterface(resolved) && idl.isSyntheticEntry(resolved)) {
            // type literal
            return this.convert(resolved)
        }
        return super.convertTypeReference(type)
    }
}

class ArkTSDependenciesCollector extends DependenciesCollector {
    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl && idl.isSyntheticEntry(decl)) {
            return [
                decl,
                ...this.convert(decl),
            ]
        }
        return super.convertTypeReference(type);
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

class JavaDependenciesCollector extends DependenciesCollector {
    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        return []
    }
}

export function createDependenciesCollector(library: PeerLibrary): DependenciesCollector {
    switch (library.language) {
        case Language.TS: return new TSDependenciesCollector(library)
        case Language.ARKTS: return new ArkTSDependenciesCollector(library)
        case Language.CJ: return new CJDependenciesCollector(library)
        case Language.JAVA: return new JavaDependenciesCollector(library)
        // in Java and CJ there is no imports (just files in the same package)
        default: throw new Error("Not implemented")
    }
}