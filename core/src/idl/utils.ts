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

import { basename } from "node:path"
import { capitalize, stringOrNone } from "../util.js"
import { createOptionalType, createContainerType, createReferenceType, createPrimitiveType } from "./builders.js"
import { isNamedNode, isPrimitiveType, QNPattern, getQualifiedName, getFQName, isOptionalType, isContainerType, IDLContainerUtils, isNamespace, isInPackage, isType, isEntry, isTypeParameterType, isInterface, isTypedef, isCallback, isMethod, isCallable, getExtAttribute, hasExtAttribute, getNamespacesPathFor, getPackageName } from "./discriminators.js"
import { IDLNode, IDLNamedNode, IDLKind, IDLExtendedAttributes, IDLType, IDLEntry, IDLReferenceType, IDLContainerType, IDLSignature, IDLParameter, IDLEnum, IDLFile, IDLPrimitiveType } from "./node.js"
import { forEachChild, forEachFunction } from "./visitors.js"
import { Language } from "../Language.js"

export function entityToType(entity: IDLNode): IDLType {
    if (isType(entity)) {
        return entity
    } else if (isEntry(entity)) {
        return createReferenceType(entity)
    } else {
        throw new Error(`Expected to have IDLType or IDLEntry, got ${entity}`)
    }
}


export function forceAsNamedNode(type: IDLNode): IDLNamedNode {
    if (!isNamedNode(type)) {
        throw new Error(`Expected to be an IDLNamedNode, but got '${IDLKind[type.kind]}'`)
    }
    return type
}

export function isEqualByQualifedName(a?: IDLNamedNode, b?: IDLNamedNode, pattern: QNPattern = "package.namespace.name"): boolean {
    if (a === b)
        return true
    if (!a || !b)
        return false
    if (a.kind !== b.kind || a.name !== b.name)
        return false
    return getQualifiedName(a, pattern) === getQualifiedName(b, pattern)
}

export function getVerbatimDts(node: IDLEntry): stringOrNone {
    let value = getExtAttribute(node, IDLExtendedAttributes.VerbatimDts)
    return value ? value.substring(1, value.length - 1) : undefined
}

/**
 * @returns tuple of qualifier name and real type name
 */
export function decomposeQualifiedName(type: IDLReferenceType): [string | undefined, string] {
    const typeName = type.name
    const lastDot = typeName.lastIndexOf(".")
    if (lastDot >= 0) {
        const qualifier = typeName.slice(0, lastDot)
        const realTypeName = typeName.slice(lastDot + 1)
        return [qualifier, realTypeName]
    }
    return [undefined, typeName]
}

export function qualifiedNameStartsWith(node: IDLNode | string[], template: string[]): boolean {
    const name = Array.isArray(node) ? node : getFQName(node).split(".")
    if (name.length < template.length)
        return false
    for (let i = 0; i < template.length; i++) {
        if (name[i] != template[i])
            return false
    }
    return true
}

export function maybeUnwrapOptionalType(type: IDLType): IDLType {
    if (isOptionalType(type)) {
        return type.type
    }
    return type
}

export function maybeOptional(type: IDLType, optional = false): IDLType {
    if (optional) {
        return createOptionalType(type)
    }
    return type
}

export function asPromise(type?: IDLType): IDLContainerType | undefined {
    if (!type) return undefined
    if (!isContainerType(type)) return undefined
    const container = type as IDLContainerType
    if (!IDLContainerUtils.isPromise(container)) return undefined
    return container
}

export function transformMethodsAsync2ReturnPromise(entry: IDLEntry) {
    forEachFunction(entry, function_ => {
        if (function_.isAsync) {
            function_.isAsync = false
            if (!asPromise(function_.returnType))
                function_.returnType = createContainerType("Promise", [function_.returnType ?? createPrimitiveType('void')])
        }
    })
}

export function transformMethodsReturnPromise2Async(entry: IDLEntry) {
    forEachFunction(entry, function_ => {
        const promise = asPromise(function_.returnType)
        if (promise) {
            function_.returnType = promise.elementType[0]
            function_.isAsync = true
        }
    })
}

export interface SignatureTag { index: number, name: string, value: string }

export function fetchSignatureTags(node: IDLSignature): SignatureTag[] {
    if (!node.extendedAttributes)
        return []
    return node.extendedAttributes
        .filter((ea) => ea.name === IDLExtendedAttributes.DtsTag)
        .map((ea): SignatureTag => {
            if (!ea.value)
                throw new Error('Empty DtsTag is not allowed')
            let indexNameValue = ea.value.split('|')
            if (indexNameValue.length === 1) {
                return {
                    index: 0, // zero is from the idl.DtsTag specification
                    name: 'type', // 'type' is from the idl.DtsTag specification
                    value: indexNameValue[0],
                }
            }
            if (indexNameValue.length !== 3)
                throw new Error(`Malformed DtsTag: "${ea.value}"`)
            return {
                index: Number(indexNameValue[0]),
                name: indexNameValue[1],
                value: indexNameValue[2],
            }
        })
        .sort((a, b) => a.index - b.index)
}

export function mixMethodParametersAndTags(node: IDLSignature): (IDLParameter | SignatureTag)[] {
    let mix: (IDLParameter | SignatureTag)[] = node.parameters.slice(0)
    for (const tag of fetchSignatureTags(node))
        mix.splice(tag.index, 0, tag)
    return mix
}

export function isHandwritten(decl: IDLEntry): boolean {
    return hasExtAttribute(decl, IDLExtendedAttributes.HandWrittenImplementation)
}

export function isNativeOnly(decl: IDLEntry): boolean {
    return hasExtAttribute(decl, IDLExtendedAttributes.NativeOnly)
}

export function isStringEnum(decl: IDLEnum): boolean {
    return decl.elements.some(e => isPrimitiveType(e.type, 'String'))
}

export function linearizeNamespaceMembers(entries: IDLEntry[]) {
    const linearized: IDLEntry[] = []
    for (const entry of entries) {
        linearized.push(entry)
        if (isNamespace(entry))
            linearized.push(...linearizeNamespaceMembers(entry.members))
    }
    return linearized
}

export function extremumOfOrdinals(enumEntry: IDLEnum): { low: number, high: number } {
    if (enumEntry.elements.length == 0) return { low: 0, high: 0 }
    let low: number = Number.POSITIVE_INFINITY
    let high: number = Number.NEGATIVE_INFINITY
    enumEntry.elements.forEach((member, index) => {
        let value = index
        if ((typeof member.initializer === 'number') && !isStringEnum(enumEntry)) {
            value = member.initializer
        }
        if (low > value) low = value
        if (high < value) high = value
    })
    return { low, high }
}

// Using compact true requires adding and updating KUByte type in the interop
export function enumBinaryRepresentation(enumEntry: IDLEnum, compact: boolean = false): IDLPrimitiveType {
    const { low, high } = extremumOfOrdinals(enumEntry)
    if (compact) {
        if (0 <= low && high <= 255) return createPrimitiveType('u8')
        if (-128 <= low && high <= 127) return createPrimitiveType('i8')
    }
    if (low < -0x80000000 || high > 0x7FFFFFFF) return createPrimitiveType('i64')
    return createPrimitiveType('i32')
}

export const PACKAGE_IDLIZE_INTERNAL = "idlize.internal"

export function isInIdlize(entry: IDLEntry | IDLFile): boolean {
    return isInPackage(entry, "idlize")
}

export function isInIdlizeInterop(entry: IDLEntry | IDLFile): boolean {
    return isInPackage(entry, `${PACKAGE_IDLIZE_INTERNAL}.interop`)
}

export function isInIdlizeInternal(entry: IDLEntry | IDLFile): boolean {
    return isInPackage(entry, PACKAGE_IDLIZE_INTERNAL)
}

export function isInIdlizeStdlib(entry: IDLEntry | IDLFile): boolean {
    return isInPackage(entry, "idlize.stdlib")
}

export function isInIdlizeTypescript(entry: IDLEntry | IDLFile): boolean {
    return isInPackage(entry, "idlize.typescript")
}

export function hasTypeParameters(entry: IDLEntry): boolean {
    let foundTypeParameter = false
    forEachChild(entry, n => {
        if (isTypeParameterType(n)) {
            foundTypeParameter = true
        }
    })
    return foundTypeParameter
}
export function isGeneric(entry: IDLEntry): entry is IDLEntry & { typeParameters?: string[] } {
    return isInterface(entry)
        || isTypedef(entry)
        || isCallback(entry)
        || isMethod(entry)
        || isCallable(entry)
}

export function snakeToLowCamelNode(node: IDLEntry): string {
    if (!node.fileName) {
        throw new Error("Invalid Convert")
    }
    const classname = basename(node.fileName).replace(".idl", "").replace(".d.ts", "")
    return classname
        .split('_')
        .filter(word => word !== '')
        .map((word, index) => {
            if (index === 0) {
                return word.toLowerCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join('');
}

export function entryToFunctionName(_language: Language, declaration: IDLEntry, prefix: string, postfix: string) {
    return `${prefix}${getQualifiedName(declaration, "package.namespace.name").split('.').map(capitalize).join('')}${postfix}`;
}

export function isInNamespace(node: IDLEntry): boolean {
    return getNamespacesPathFor(node).length > 0
}
