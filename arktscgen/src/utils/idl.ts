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

import {
    createContainerType,
    createEmptyReferenceResolver,
    createInterface,
    createMethod,
    getNamespacesPathFor,
    getQualifiedName,
    IDLContainerType,
    IDLContainerUtils,
    IDLExtendedAttribute,
    IDLInterface,
    IDLMethod,
    IDLNamedNode,
    IDLNode,
    IDLParameter,
    IDLPrimitiveType,
    IDLProperty,
    IDLReferenceType,
    IDLType,
    IndentedPrinter,
    isContainerType,
    isInterface,
    isOptionalType,
    isPrimitiveType,
    isReferenceType,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import * as idl from "@idlizer/core"
import { Config } from "../general/Config"
import { mangleIfKeyword } from "../general/common"
import { dropPrefix } from "./string"

export function isString(node: IDLType): node is IDLPrimitiveType {
    return isPrimitiveType(node) && node.name === `String`
}

export function isSequence(node: IDLType): node is IDLContainerType {
    return IDLContainerUtils.isSequence(node)
}

export function createUpdatedInterface(
    node: IDLInterface,
    methods?: IDLMethod[],
    name?: string,
    inheritance?: IDLReferenceType[],
    extendedAttributes?: IDLExtendedAttribute[],
    properties?: IDLProperty[]
): idl.IDLInterface | idl.IDLNamespace {
    return createInterface(
        name ?? node.name,
        node.subkind,
        inheritance ?? node.inheritance,
        node.constructors,
        node.constants,
        properties ?? node.properties,
        methods ?? node.methods,
        node.callables,
        node.typeParameters,
        {
            extendedAttributes: extendedAttributes ?? node.extendedAttributes,
            fileName: node.fileName,
            documentation: node.documentation
        }
    )
}

export function baseName(type: IDLReferenceType): string {
    return baseNameString(type.name)
}

export function baseNameString(name: string): string {
    if (name.indexOf('.') > 0) {
        return name.substring(name.lastIndexOf('.') + 1)
    } else {
        return name
    }
}

export function createUpdatedMethod(
    node: IDLMethod,
    name?: string,
    parameters?: IDLParameter[],
    returnType?: IDLType,
    extendedAttributes?: IDLExtendedAttribute[]
): IDLMethod {
    return createMethod(
        name ?? node.name,
        parameters ?? node.parameters,
        returnType ?? node.returnType,
        {
            isAsync: node.isAsync,
            isFree: node.isFree,
            isStatic: node.isStatic,
            isOptional: node.isOptional,
        },
        {
            extendedAttributes: extendedAttributes ?? node.extendedAttributes,
            fileName: node.fileName,
            documentation: node.documentation,
        },
        node.typeParameters
    )
}

export function nodeType(node: IDLInterface): string | undefined {
    return node.extendedAttributes
        ?.find(it => it.name === Config.nodeTypeAttribute)
        ?.value
}

export function nativeType(node: IDLInterface): string | undefined {
    return node.extendedAttributes
        ?.find(it => it.name === 'c_type')
        ?.value
}

export function nodeNamespace(node: IDLNode): string | undefined {
    return getNamespacesPathFor(node)[0]?.name
}

export function fqName(node: IDLNamedNode): string {
    return getQualifiedName(node, "namespace.name")
}

export function dropNamespace(node: IDLInterface) {
    const index = node.extendedAttributes
        ?.findIndex(it => it.name === Config.nodeNamespaceAttribute)
    if (index == undefined || index == -1) return

    node.extendedAttributes?.splice(index, 1)
}

export function parent(node: IDLInterface): string | undefined {
    return node.inheritance[0]?.name
}

export function createDefaultTypescriptWriter() {
    return new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => throwException(`unexpected type conversion`) }
    )
}

export function signatureTypes(node: IDLMethod): IDLType[] {
    return node.parameters
        .map(it => it.type)
        .concat(node.returnType)
}

export function isIrNamespace(node: IDLInterface): boolean {
    let cppNamespace = node.extendedAttributes?.find(it => it.name == Config.nodeNamespaceAttribute)?.value
    return nodeNamespace(node) === Config.irNamespace || cppNamespace == Config.irNamespace
}

export function createSequence(inner: IDLType): IDLContainerType {
    return createContainerType(
        `sequence`,
        [inner]
    )
}

export function innerType(node: IDLContainerType): IDLType {
    return node.elementType[0]
}

export function innerTypeIfContainer(node: IDLType): IDLType {
    if (isContainerType(node)) {
        return innerType(node)
    }
    return node
}

export function innerTypeCommon(type: IDLType): IDLType {
    if (isContainerType(type)) {
        if (IDLContainerUtils.isSequence(type)) {
            return type.elementType[0]
        }

    } else if (isOptionalType(type)) {
        return type.type
    }

    return type
}

export function makeMethod(
    name: string,
    parameters: { name: string, type: IDLType, isOptional: boolean }[],
    returnType: IDLType,
    modifiers?: MethodModifier[]
): Method {
    return new Method(
        name,
        makeSignature(parameters, returnType),
        modifiers ?? []
    )
}

export function makeSignature(parameters: { name: string, type: IDLType, isOptional?: boolean }[], returnType: IDLType): MethodSignature {
    let parameterModifiers = parameters.map(it => it.isOptional || idl.isOptionalType(it.type) ? idl.ArgumentModifier.OPTIONAL : undefined)
    let lastNonOptional = -1
    for (let i = 0; i < parameterModifiers.length; i++) {
        if (parameterModifiers[i] == undefined) lastNonOptional = i
    }
    if (lastNonOptional != -1) {
        for (let i = 0; i < lastNonOptional; i++) parameterModifiers[i] = undefined
    }
    return new MethodSignature(
        returnType,
        parameters.map(it => it.type),
        undefined,
        parameterModifiers,
        undefined,
        parameters
            .map(it => it.name)
            .map(mangleIfKeyword)
    )
}

export function makeExpression(writer: LanguageWriter, arg: string | LanguageExpression): LanguageExpression {
    return typeof arg === 'string' ? writer.makeString(arg) : arg
}

export function makeStatement(writer: LanguageWriter, arg: string | LanguageExpression | LanguageStatement): LanguageStatement {
    return typeof arg !== 'string' && 'write' in arg ? arg : writer.makeStatement(makeExpression(writer, arg))
}

export type ReferenceResolver = (ref: IDLReferenceType, pov?: IDLNode) => IDLNamedNode|undefined

export function flatParentsImpl(
    ref: IDLReferenceType|IDLInterface,
    resolveReference: ReferenceResolver
): IDLInterface[] {
    if (isReferenceType(ref)) {
        const type = resolveReference(ref)
        if (!type || !isInterface(type)) {
            return []
        }
        ref = type
    }

    const result: IDLInterface[] = []
    const queue: IDLInterface[] = [ref]
    while (queue.length) {
        const node = queue.shift()!
        result.push(node)

        if (result.length > 1 && baseNameString(ref.name) === node.name) {
            //console.warn(`Cyclic dependency: ${ref.name} -> ${node.name}`);
            break
        }

        node.inheritance
            .map(p => resolveReference(p, ref as IDLInterface))
            .filter(p => p !== undefined && isInterface(p))
            .forEach(p => queue.push(p as IDLInterface))
    }

    return result // with self
}

export function makePrettyName(name: string): string {
    // ir namespace is a global namespace
    return dropPrefix(dropPrefix(name, Config.dataClassPrefix), `${Config.irNamespace}.`)
}

export function makeEnoughQualifiedName(
    ref: IDLReferenceType,
    resolveReference: ReferenceResolver,
): string {
    const decl = resolveReference(ref)
    if (!decl) {
        return ref.name
    }

    const declNs = getNamespacesPathFor(decl).map(n => n.name).join('.')
    const contextNs = getNamespacesPathFor(ref).map(n => n.name).join('.')

    // ir namespace is a global namespace
    if (declNs === contextNs || declNs === '' || declNs === Config.irNamespace) {
        const name = declNs != '' && ref.name.startsWith(declNs)
            ? ref.name.slice(declNs.length + 1)
            : dropPrefix(ref.name, Config.dataClassPrefix)
        return name
    }

    return fqName(decl)
}
