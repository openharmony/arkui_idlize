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

import * as idl from './idl'
import { ReferenceResolver } from './peer-generation/ReferenceResolver'

export interface IDLConverter<T> {
    visitOptional(type: idl.IDLOptionalType): T
    visitUnion(type: idl.IDLUnionType): T
    visitContainer(type: idl.IDLContainerType): T
    visitImport(type: idl.IDLReferenceType, importClause: string): T
    visitTypeReference(type: idl.IDLReferenceType): T
    visitTypeParameter(type: idl.IDLTypeParameterType): T
    visitPrimitiveType(type: idl.IDLPrimitiveType): T
    visitNamespace(node: idl.IDLNamespace): T
    visitInterface(node: idl.IDLInterface): T
    visitEnum(node: idl.IDLEnum): T
    visitTypedef(node: idl.IDLTypedef): T
    visitCallback(node: idl.IDLCallback): T
    visitMethod(node: idl.IDLMethod): T
    visitProperty(node: idl.IDLProperty): T
    visitConstant(node: idl.IDLConstant): T
}

export function walkIDL<T>(convertor: IDLConverter<T>, node: idl.IDLNode): T {
    if (idl.isNamespace(node)) return convertor.visitNamespace(node)
    if (idl.isInterface(node))
        return convertor.visitInterface(node)
    if (idl.isEnum(node)) return convertor.visitEnum(node)
    if (idl.isEnumMember(node)) return convertor.visitEnum(node.parent)
    if (idl.isTypedef(node)) return convertor.visitTypedef(node)
    if (idl.isCallback(node)) return convertor.visitCallback(node)
    if (idl.isMethod(node))  return convertor.visitMethod(node)
    if (idl.isProperty(node)) return convertor.visitProperty(node)
    if (idl.isConstant(node))  return convertor.visitConstant(node)
    if (idl.isOptionalType(node)) return convertor.visitOptional(node)
    if (idl.isUnionType(node)) return convertor.visitUnion(node)
    if (idl.isContainerType(node)) return convertor.visitContainer(node)
    if (idl.isReferenceType(node)) {
        const importAttr = idl.getExtAttribute(node, idl.IDLExtendedAttributes.Import)
        return importAttr
            ? convertor.visitImport(node, importAttr)
            : convertor.visitTypeReference(node)
    }
    if (idl.isTypeParameterType(node)) return convertor.visitTypeParameter(node)
    if (idl.isPrimitiveType(node)) return convertor.visitPrimitiveType(node)
        throw new Error(`Unknown kind ${idl.IDLKind[node.kind]}`)
}

////////////////////////////////////////////////////////////////////////////

export class IDLDependencyCollector implements IDLConverter<idl.IDLNode[]> {
    constructor(
        private readonly resolver: ReferenceResolver
    ) {}

    visitOptional(type: idl.IDLOptionalType): idl.IDLNode[] {
        return this.walk(type.type)
    }
    visitUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        return type.types.flatMap(ty => this.walk(ty))
    }
    visitContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return type.elementType.flatMap(ty => this.walk(ty))
    }
    visitImport(type: idl.IDLReferenceType): idl.IDLNode[] {
        const maybeDecl = this.resolver.resolveTypeReference(type)
        return maybeDecl ? [maybeDecl] : []
    }
    visitTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
        const decl = this.resolver.resolveTypeReference(type)
        const result: idl.IDLNode[] = !decl ? []
            : idl.isEnumMember(decl) ? [decl.parent] : [decl]
        if (type.typeArguments) {
            result.push(...type.typeArguments.flatMap(it => this.walk(it)))
        }
        return result
    }
    visitTypeParameter(): idl.IDLNode[] {
        return []
    }
    visitPrimitiveType(): idl.IDLNode[] {
        return []
    }
    visitNamespace(decl: idl.IDLNamespace): idl.IDLNode[] {
        return decl.members.flatMap(it => this.walk(it))
    }
    visitInterface(decl: idl.IDLInterface): idl.IDLNode[] {
        return [
            ...decl.inheritance
                .filter(it => it !== idl.IDLTopType)
                .flatMap(it => this.visitSupertype(it)),
            ...decl.properties
                .filter(it => !it.isStatic)
                .flatMap(it => this.walk(it.type)),
            ...[...decl.constructors, ...decl.callables, ...decl.methods]
                .flatMap(it => [
                    ...it.parameters.flatMap(param => this.walk(param.type)),
                    ...this.walk(it.returnType)
                ])
        ]
    }
    protected visitSupertype(type: idl.IDLType | idl.IDLInterface): idl.IDLNode[] {
        if (idl.isInterface(type)) {
            return this.walk(idl.createReferenceType(type))
        }
        return this.walk(type)
    }
    visitEnum(): idl.IDLNode[] {
        return []
    }
    visitTypedef(decl: idl.IDLTypedef): idl.IDLNode[] {
        return this.walk(decl.type)
    }
    visitCallback(decl: idl.IDLCallback): idl.IDLNode[] {
        return [
            ...decl.parameters.flatMap(it => this.walk(it.type)),
            ...this.walk(decl.returnType),
        ]
    }
    visitMethod(decl: idl.IDLMethod): idl.IDLNode[] {
        return [
            ...decl.parameters.flatMap(it => this.walk(it.type)),
            ...this.walk(decl.returnType),
        ]
    }
    visitProperty(node: idl.IDLProperty): idl.IDLNode[] {
        return this.walk(node.type)
    }
    visitConstant(decl: idl.IDLConstant): idl.IDLNode[] {
        return this.walk(decl.type)
    }
    walk(node?: idl.IDLNode): idl.IDLNode[] {
        if (node === undefined)
            return []
        return walkIDL(this, node)
    }
}

export function collectDependencies(resolver: ReferenceResolver, node:idl.IDLNode): idl.IDLNode[] {
    return walkIDL(new IDLDependencyCollector(resolver), node)
}
