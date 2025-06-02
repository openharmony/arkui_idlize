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
                .flatMap(it => this.walk(it)),
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

function isFirstTypeSubsetOfSecond(first: idl.IDLType, second: idl.IDLType): boolean {
    if (idl.isOptionalType(second)) {
        return isFirstTypeSubsetOfSecond(idl.maybeUnwrapOptionalType(first), idl.maybeUnwrapOptionalType(second))
    }
    if (idl.isUnionType(second)) {
        const firstTypes = idl.isUnionType(first) ? first.types : [first]
        const secondTypes = second.types
        return firstTypes.every(firstType => secondTypes.some(secondType => isFirstTypeSubsetOfSecond(firstType, secondType)))
    }
    return idl.printType(first) === idl.printType(second)
}
function isFirstParameterSubsetOfSecond(first: idl.IDLParameter | undefined, second: idl.IDLParameter): boolean {
    if (first === undefined)
        return second.isOptional
    if (first.isOptional && !second.isOptional)
        return false
    if (second.isOptional)
        return isFirstTypeSubsetOfSecond(idl.maybeUnwrapOptionalType(first.type), idl.maybeUnwrapOptionalType(second.type))
    return isFirstTypeSubsetOfSecond(first.type, second.type)
}
function isFirstMethodSubsetOfSecond(first: idl.IDLMethod, second: idl.IDLMethod): boolean {
    if (first.parameters.length > second.parameters.length)
        return false
    if (first.isAsync !== second.isAsync)
        return false
    if (first.isStatic !== second.isStatic)
        return false
    if (second.parameters.some((secondParameter, idx) => !isFirstParameterSubsetOfSecond(first.parameters.at(idx), secondParameter)))
        return false
    if (!isFirstTypeSubsetOfSecond(first.returnType, second.returnType))
        return false
    return true
}
function isFirstPropertySubsetOfSecond(first: idl.IDLProperty, second: idl.IDLProperty): boolean {
    if (idl.getExtAttribute(first, idl.IDLExtendedAttributes.Accessor) !==
        idl.getExtAttribute(second, idl.IDLExtendedAttributes.Accessor))
        return false
    if (first.isStatic !== second.isStatic)
        return false
    if (first.isOptional && !second.isOptional)
        return false
    if (second.isOptional)
        return isFirstTypeSubsetOfSecond(idl.maybeUnwrapOptionalType(first.type), idl.maybeUnwrapOptionalType(second.type))
    return isFirstTypeSubsetOfSecond(first.type, second.type)
}

function filterRedundantOverloadsSameNamed<T extends idl.IDLEntry>(entries: T[]): T[] {
    const entryToSupersets = new Map<T, T[]>()
    for (const entry of entries) {
        entryToSupersets.set(entry, [])
        for (const other of entries) {
            if (entry === other) continue
            if (idl.isMethod(entry) && idl.isMethod(other)) {
                if (isFirstMethodSubsetOfSecond(entry, other))
                    entryToSupersets.get(entry)!.push(other)
            } else if (idl.isProperty(entry) && idl.isProperty(other)) {
                if (isFirstPropertySubsetOfSecond(entry, other))
                    entryToSupersets.get(entry)!.push(other)
            } else {
                throw new Error("Not implemented")
            }
        }
    }
    const visited: T[] = []
    const roots: T[] = []
    const visit = (method: T): void => {
        if (visited.includes(method)) return
        visited.push(method)
        for (const superset of entryToSupersets.get(method)!) {
            visit(superset)
        }
        if (!entryToSupersets.get(method)!.some(it => roots.includes(it)))
            roots.push(method)
    }
    entries.forEach(visit)
    return roots
}

export function filterRedundantMethodsOverloads(methods: idl.IDLMethod[]): idl.IDLMethod[] {
    const sameNamedGroups = new Map<string, idl.IDLMethod[]>()
    for (const method of methods) {
        if (!sameNamedGroups.has(method.name))
            sameNamedGroups.set(method.name, [])
        sameNamedGroups.get(method.name)!.push(method)
    }
    const filtered: idl.IDLMethod[] = []
    for (const sameNamed of sameNamedGroups.values()) {
        filtered.push(...filterRedundantOverloadsSameNamed(sameNamed))
    }
    // stabilizing order
    return methods.filter(it => filtered.includes(it))
}

export function filterRedundantAttributesOverloads(properties: idl.IDLProperty[]): idl.IDLProperty[] {
    const sameNamedGroups = new Map<string, idl.IDLProperty[]>()
    for (const property of properties) {
        if (!sameNamedGroups.has(property.name))
            sameNamedGroups.set(property.name, [])
        sameNamedGroups.get(property.name)!.push(property)
    }
    const filtered: idl.IDLProperty[] = []
    for (const sameNamed of sameNamedGroups.values()) {
        filtered.push(...filterRedundantOverloadsSameNamed(sameNamed))
    }
    // stabilizing order
    return properties.filter(it => filtered.includes(it))

}