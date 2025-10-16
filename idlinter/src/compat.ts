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

import { DiagnosticMessageGroup, isDefined, parseIDLFile } from "@idlizer/core"
import * as idl from "@idlizer/core/idl"

const Errors = new DiagnosticMessageGroup("error", "Compat", "Incompatible API change")

function isCompatibleType(base?: idl.IDLType, target?: idl.IDLType): boolean {
    if (!base || !target)
        return base === target
    else if (idl.isPrimitiveType(base) && idl.isPrimitiveType(target))
        return base === target
    else if (idl.isReferenceType(base) && idl.isReferenceType(target))
        return base.name === target.name
    else if (idl.isContainerType(base) && idl.isContainerType(target))
        return base.containerKind === target.containerKind &&
            base.elementType.length === target.elementType.length &&
            base.elementType.every((it, index) => isCompatibleType(it, target.elementType[index]))
    else if (idl.isOptionalType(base) && idl.isOptionalType(target))
        return isCompatibleType(base.type, target.type)
    else if (idl.isUnionType(base) && idl.isUnionType(target))
        return base.types.length === target.types.length &&
            base.types.every(type => isDefined(target.types.find(it => isCompatibleType(it, type))))
    else if (idl.isTypeParameterType(base) && idl.isTypeParameterType(target))
        return true
    return false
}

function checkType(message: string, node: idl.IDLEntry, base?: idl.IDLType, target?: idl.IDLType) {
    if (!isCompatibleType(base, target))
        report(message, node)
}

function checkFunction(base: idl.IDLFunction | idl.IDLMethod, target?: idl.IDLFunction | idl.IDLMethod) {
    if (!target)
        report('Missing function', base)
    else {
        checkType('Return type mismatch', target, base.returnType, target.returnType)
        if (base.parameters.length !== target.parameters.length)
            report('Different number of parameters', target)
        else
            base.parameters.forEach((it, index) => checkType('Parameter type mismatch', it, it.type, target.parameters[index].type))
    }
}

function checkProperty(base: idl.IDLProperty | idl.IDLConstant | idl.IDLEnumMember, target?: idl.IDLProperty | idl.IDLConstant | idl.IDLEnumMember) {
    if (!target)
        report('Missing property', base)
    else {
        checkType('Property type mismatch', target, base.type, target.type)
        if (idl.hasExtAttribute(base, idl.IDLExtendedAttributes.Optional) !== idl.hasExtAttribute(target, idl.IDLExtendedAttributes.Optional))
            report('Different optionality', target)
    }
}

function checkEnum(base: idl.IDLEnum, target?: idl.IDLEnum) {
    if (!target)
        report('Missing enum', base)
    else {
        base.elements.forEach(elem => checkProperty(elem, target.elements.find(it => it.name === elem.name)))
    }
}

function checkInterface(base: idl.IDLInterface, target?: idl.IDLInterface) {
    if (!target)
        report('Missing interface', base)
    else {
        base.inheritance.forEach(type => checkType('Inheritance mismatch', target, type, target.inheritance.find(it => it.name === type.name)))
        base.properties.forEach(prop => checkProperty(prop, target.properties.find(it => isSameProperty(prop, it))))
        base.methods.forEach(method => checkFunction(method, target.methods.find(it => isSameOverload(method, it))))
    }
}

function checkNamespace(base: idl.IDLNamespace, target?: idl.IDLNamespace) {
    if (!target)
        report('Missing namespace', base)
    else
        checkEntries(base.members, target.members)
}

function checkEntries(base: idl.IDLEntry[], target: idl.IDLEntry[]) {
    base.forEach(e => {
        if (idl.isEnum(e))
            checkEnum(e, findEntry(target, e.name, idl.isEnum))
        else if (idl.isInterface(e))
            checkInterface(e, findEntry(target, e.name, x => idl.isInterface(x) && x.subkind === e.subkind))
        else if (idl.isConstant(e))
            checkProperty(e, findEntry(target, e.name, idl.isConstant))
        else if (idl.isMethod(e))
            checkFunction(e, findEntry(target, e.name, x => idl.isMethod(x) && isSameOverload(e, x)))
        else if (idl.isNamespace(e))
            checkNamespace(e, findEntry(target, e.name, idl.isNamespace))
    })
}

function findEntry<T extends idl.IDLEntry>(entries: idl.IDLEntry[], name: string, predicate: (e: idl.IDLEntry) => boolean): T | undefined {
    return entries.find(it => predicate(it) && it.name === name) as T
}

function isSameProperty(base: idl.IDLProperty, target: idl.IDLProperty) {
    return base.name === target.name &&
        idl.getExtAttribute(base, idl.IDLExtendedAttributes.Accessor) === idl.getExtAttribute(target, idl.IDLExtendedAttributes.Accessor) &&
        isCompatibleType(base.type, target.type)
}

function isSameOverload(base: idl.IDLFunction | idl.IDLMethod, target: idl.IDLFunction | idl.IDLMethod) {
    return base.name === target.name &&
        base.parameters.length === target.parameters.length &&
        base.parameters.every((it, index) => isCompatibleType(it.type, target.parameters[index].type))
}

function report(message: string, node?: idl.IDLNode) {
    const crumbs: string[] = []
    for (; node && !idl.isFile(node); node = node.parent)
        if (idl.isNamedNode(node))
            crumbs.push(node.name)
    message += ': ' + crumbs.reverse().join('.')
    const locations = node?.nodeLocation ? [node.nodeLocation] : []
    Errors.reportDiagnosticMessage(locations, message)
}

export function checkCompat(baseFiles: Set<string>, targetFiles: Set<string>) {
    const read = (files: Set<string>) => Array.from(files).flatMap(f => parseIDLFile(f).entries)
    checkEntries(read(baseFiles), read(targetFiles))
}
