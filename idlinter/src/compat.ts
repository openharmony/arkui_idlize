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

import { convertType, DiagnosticMessageGroup, isDefined, parseIDLFile, stringOrNone, TypeConvertor } from "@idlizer/core"
import * as idl from "@idlizer/core/idl"

const errors = new DiagnosticMessageGroup("error", "Compat", "Incompatible API change")
const typedefs = new Map<string, idl.IDLType>()

function isCompatibleType(base?: idl.IDLType, commit?: idl.IDLType): boolean {
    if (!base || !commit)
        return base === commit
    else if (idl.isPrimitiveType(base) && idl.isPrimitiveType(commit))
        return base === commit
    else if (idl.isContainerType(base) && idl.isContainerType(commit))
        return base.containerKind === commit.containerKind &&
            base.elementType.length === commit.elementType.length &&
            base.elementType.every((it, index) => isCompatibleType(it, commit.elementType[index]))
    else if (idl.isOptionalType(base) && idl.isOptionalType(commit))
        return isCompatibleType(base.type, commit.type)
    else if (idl.isUnionType(base) && idl.isUnionType(commit))
        return base.types.length === commit.types.length &&
            base.types.every(type => isDefined(commit.types.find(it => isCompatibleType(it, type))))
    else if (idl.isTypeParameterType(base) && idl.isTypeParameterType(commit))
        return true
    return idl.isReferenceType(base) && idl.isReferenceType(commit) && base.name === commit.name
        || idl.isReferenceType(commit) && isCompatibleType(base, typedefs.get(commit.name))
        || idl.isReferenceType(base) && isCompatibleType(typedefs.get(base.name), commit)
}

function checkType(message: string, node: idl.IDLEntry, base?: idl.IDLType, commit?: idl.IDLType) {
    if (!isCompatibleType(base, commit))
        report(message, node)
}

function checkFunction(base: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor, commit?: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor) {
    if (!commit)
        report('Missing function', base)
    else {
        checkType('Return type mismatch', commit, base.returnType, commit.returnType)
        if (idl.isMethod(base) && idl.isMethod(commit)) {
            if (base.isOptional !== commit.isOptional)
                report('Optional attribute changed', commit)
            if (base.isStatic !== commit.isStatic)
                report('Static attribute changed', commit)
        }
    }
}

function checkProperty(base: idl.IDLProperty | idl.IDLConstant | idl.IDLEnumMember, commit?: idl.IDLProperty | idl.IDLConstant | idl.IDLEnumMember) {
    if (!commit)
        report('Missing property', base)
    else {
        checkType('Property type mismatch', commit, base.type, commit.type)
        if (idl.hasExtAttribute(base, idl.IDLExtendedAttributes.Optional) !== idl.hasExtAttribute(commit, idl.IDLExtendedAttributes.Optional))
            report('Optional attribute changed', commit)
    }
}

function checkEnum(base: idl.IDLEnum, commit?: idl.IDLEnum) {
    if (!commit)
        report('Missing enum', base)
    else {
        base.elements.forEach(elem => checkProperty(elem, commit.elements.find(it => it.name === elem.name)))
    }
}

function checkInterface(base: idl.IDLInterface, commit?: idl.IDLInterface) {
    if (!commit)
        report('Missing interface', base)
    else {
        base.inheritance.forEach(type => checkType('Inheritance mismatch', commit, type, commit.inheritance.find(it => it.name === type.name)))
        base.properties.forEach(prop => checkProperty(prop, commit.properties.find(it => isSameProperty(prop, it))))
        base.methods.forEach(method => checkFunction(method, commit.methods.find(it => isSameOverload(method, it))))
        base.constructors.forEach(ctor => checkFunction(ctor, commit.constructors.find(it => isSameOverload(ctor, it))))
    }
}

function checkNamespace(base: idl.IDLNamespace, commit?: idl.IDLNamespace) {
    if (!commit)
        report('Missing namespace', base)
    else
        checkEntries(base.members, commit.members)
}

function checkEntries(base: idl.IDLEntry[], commit: idl.IDLEntry[]) {
    base.forEach(e => {
        if (idl.isEnum(e))
            checkEnum(e, findEntry(commit, e, idl.isEnum))
        else if (idl.isInterface(e))
            checkInterface(e, findEntry(commit, e, x => idl.isInterface(x) && x.subkind === e.subkind))
        else if (idl.isConstant(e))
            checkProperty(e, findEntry(commit, e, idl.isConstant))
        else if (idl.isMethod(e))
            checkFunction(e, findEntry(commit, e, x => idl.isMethod(x) && isSameOverload(e, x)))
        else if (idl.isNamespace(e))
            checkNamespace(e, findEntry(commit, e, idl.isNamespace))
    })
}

function findEntry<T extends idl.IDLEntry>(entries: idl.IDLEntry[], entry: T, predicate: (e: idl.IDLEntry) => boolean): T | undefined {
    const candidates = entries.filter(it => predicate(it) && it.name === entry.name) as T[]
    if (candidates.length > 1) {
        if (entry.parent && idl.isFile(entry.parent)) {
            const pkg = entry.parent.packageClause.join('.')
            return candidates.find(it => it.parent && idl.isFile(it.parent) && it.parent.packageClause.join('.') === pkg)
        }
    }
    return candidates[0]
}

function isSameProperty(base: idl.IDLProperty, commit: idl.IDLProperty) {
    return base.name === commit.name &&
        idl.getExtAttribute(base, idl.IDLExtendedAttributes.Accessor) === idl.getExtAttribute(commit, idl.IDLExtendedAttributes.Accessor) &&
        isCompatibleType(base.type, commit.type)
}

function isSameOverload(base: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor, commit: idl.IDLFunction | idl.IDLMethod | idl.IDLConstructor) {
    return base.name === commit.name &&
        base.parameters.length === commit.parameters.length &&
        base.parameters.every((it, index) => isCompatibleType(it.type, commit.parameters[index].type))
}

function report(message: string, node?: idl.IDLNode) {
    const decorator = makeDecorator(node)
    const crumbs: string[] = []
    for (; node && !idl.isFile(node); node = node.parent)
        if (idl.isNamedNode(node))
            crumbs.unshift(node.name)
    if (node && idl.isFile(node))
        crumbs.unshift(...node.packageClause)
    const locations = node?.nodeLocation ? [node.nodeLocation] : []
    errors.reportDiagnosticMessage(locations, `${message}: ${crumbs.join('.')}${decorator ?? ''}`)
}

function makeDecorator(node?: idl.IDLNode): stringOrNone {
    if (!node)
        return undefined
    if (idl.isProperty(node)) {
        const accessor = idl.getExtAttribute(node, idl.IDLExtendedAttributes.Accessor)
        return `: ${typeName(node.type)}${accessor ? ` [${accessor}]` : ''}`
    }
    if (idl.isMethod(node)) {
        return `(${node.parameters.map(p => typeName(p.type)).join(', ')})`
    }
    return ''
}

class TypeNameConvertor implements TypeConvertor<string> {
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        return type.name
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        return type.name
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType): string {
        return type.name
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertImport(type: idl.IDLImport): string {
        return type.name
    }
    convertOptional(type: idl.IDLOptionalType): string {
        return `optional ${convertType(this, type.type)}`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return type.types.map(ty => convertType(this, ty)).join(' or ')
    }
    convertContainer(type: idl.IDLContainerType): string {
        return `${type.containerKind}<${type.elementType.map(ty => convertType(this, ty)).join(', ')}>`
    }
}

const typeNameConvertor = new TypeNameConvertor()

function typeName(type: idl.IDLType): string {
    return convertType(typeNameConvertor, type)
}

export function checkCompat(baseFiles: Set<string>, commitFiles: Set<string>, loadFiles: Set<string>) {
    const read = (files: Set<string>) => Array.from(files).flatMap(f => parseIDLFile(f).entries)
    const [base, commit, load] = [baseFiles, commitFiles, loadFiles].map(read)
    for (const e of [...base, ...commit, ...load].filter(idl.isTypedef))
        typedefs.set(e.name, e.type)
    checkEntries(base, commit)
}
