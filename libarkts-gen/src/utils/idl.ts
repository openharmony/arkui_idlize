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
    IDLEntry,
    IDLExtendedAttribute,
    IDLInterface,
    IDLMethod,
    IDLNode,
    IDLParameter,
    IDLPrimitiveType,
    IDLReferenceType,
    IDLType,
    IndentedPrinter, isContainerType,
    isEnum,
    isInterface,
    isPrimitiveType,
    isReferenceType,
    Method,
    MethodModifier,
    MethodSignature,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { Config } from "../Config"
import { mangleIfKeyword } from "./common";

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
    extendedAttributes?: IDLExtendedAttribute[]
): IDLInterface {
    return createInterface(
        name ?? node.name,
        node.subkind,
        inheritance ?? node.inheritance,
        node.constructors,
        node.constants,
        node.properties,
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

export class Typechecker {
    constructor(private idl: IDLEntry[]) {}

    findRealDeclaration(name: string): IDLEntry | undefined {
        const declarations = this.idl.filter(it => name === it.name)
        if (declarations.length === 1) {
            return declarations[0]
        }
        const ir = declarations
            .filter(isInterface)
            .filter(it => isIrNamespace(it))
        if (ir.length === 1) {
            return ir[0]
        }
        return undefined
    }

    isHeir(name: string, ancestor: string): boolean {
        if (name === ancestor) {
            return true
        }
        const declaration = this.findRealDeclaration(name)
        if (declaration === undefined || !isInterface(declaration)) {
            return false
        }
        const parent = declaration.inheritance[0]
        if (parent === undefined) {
            return declaration.name === ancestor
        }
        return this.isHeir(parent.name, ancestor)
    }

    isPeer(node: string): boolean {
        if (node === Config.astNodeCommonAncestor) return false // TODO: is handwritten
        if (this.isHeir(node, Config.astNodeCommonAncestor)) return true
        if (this.isHeir(node, Config.defaultAncestor)) return true
        return false
    }

    isReferenceTo(type: IDLType, isTarget: (type: IDLNode) => boolean): boolean  {
        if (!isReferenceType(type)) {
            return false
        }
        const declaration = this.findRealDeclaration(type.name)
        return declaration !== undefined && isTarget(declaration)
    }

    isConstReturnValue(node: IDLMethod): boolean {
        if (isPrimitiveType(node.returnType) || this.isReferenceTo(node.returnType, isEnum)) {
            return false
        }
        return node.name.endsWith(Config.constPostfix)
    }
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
    parameters: IDLParameter[],
    returnType: IDLType,
    modifiers?: MethodModifier[]
): Method {
    return new Method(
        name,
        new MethodSignature(
            returnType,
            parameters
                .map(it => it.type),
            undefined,
            undefined,
            parameters
                .map(it => it.name)
                .map(mangleIfKeyword)
        ),
        modifiers ?? []
    )
}