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
    IDLContainerType,
    IDLContainerUtils,
    IDLExtendedAttribute,
    IDLInterface,
    IDLMethod,
    IDLParameter,
    IDLPrimitiveType,
    IDLProperty,
    IDLReferenceType,
    IDLType,
    IndentedPrinter,
    isContainerType,
    isPrimitiveType,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { Config } from "../Config"
import { mangleIfKeyword } from "../general/common"

export function isString(node: IDLType): node is IDLPrimitiveType {
    return isPrimitiveType(node) && node.name === `String`
}

export function isSequence(node: IDLType): boolean {
    return IDLContainerUtils.isSequence(node)
}

export function createUpdatedInterface(
    node: IDLInterface,
    methods?: IDLMethod[],
    name?: string,
    inheritance?: IDLReferenceType[],
    extendedAttributes?: IDLExtendedAttribute[],
    properties?: IDLProperty[]
): IDLInterface {
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

export function nodeNamespace(node: IDLInterface): string | undefined {
    return node.extendedAttributes
        ?.find(it => it.name === Config.nodeNamespaceAttribute)
        ?.value
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
    return nodeNamespace(node) === Config.irNamespace
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

export function makeMethod(
    name: string,
    parameters: { name: string, type: IDLType }[],
    returnType: IDLType,
    modifiers?: MethodModifier[]
): Method {
    return new Method(
        name,
        makeSignature(parameters, returnType),
        modifiers ?? []
    )
}

export function makeSignature(parameters: { name: string, type: IDLType }[], returnType: IDLType): MethodSignature {

    return new MethodSignature(
        returnType,
        parameters.map(it => it.type),
        undefined,
        undefined,
        parameters
            .map(it => it.name)
            .map(mangleIfKeyword)
    )
}
