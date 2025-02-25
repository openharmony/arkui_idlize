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
    createEmptyReferenceResolver,
    createInterface,
    IDLContainerUtils,
    IDLEntry,
    IDLInterface,
    IDLMethod,
    IDLNode,
    IDLPrimitiveType,
    IDLType,
    IndentedPrinter,
    isEnum,
    isInterface,
    isPrimitiveType,
    isReferenceType,
    throwException,
    TSLanguageWriter
} from "@idlizer/core"
import { Config } from "../Config"

export function isString(node: IDLType): node is IDLPrimitiveType {
    return isPrimitiveType(node) && node.name === "String"
}

export function isSequence(node: IDLType): boolean {
    return IDLContainerUtils.isSequence(node)
}

export function createUpdatedInterface(node: IDLInterface, methods?: IDLMethod[], name?: string): IDLInterface {
    return createInterface(
        name ?? node.name,
        node.subkind,
        node.inheritance,
        node.constructors,
        node.constants,
        node.properties,
        methods ?? node.methods,
        node.callables,
        node.typeParameters,
        {
            extendedAttributes: node.extendedAttributes,
            fileName: node.fileName,
            documentation: node.documentation
        }
    )
}

export class Typechecker {
    constructor(private idl: IDLEntry[]) {}

    findRealDeclaration(name: string): IDLEntry | undefined {
        const declarations = this.idl.filter(it => name === it.name)
        if (declarations.length === 1) {
            return declarations[0]
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
        return this.isHeir(node, Config.astNodeCommonAncestor) && node !== Config.astNodeCommonAncestor
    }

    isHollow(name: string): boolean {
        const declaration = this.findRealDeclaration(name)
        if (declaration === undefined) {
            return false
        }
        if (!isInterface(declaration)) {
            return false
        }
        return declaration.methods.length === 0
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

export function isAbstract(node: IDLInterface): boolean {
    return nodeType(node) === undefined
}

export function isGetter(node: IDLMethod): boolean {
    if (node.parameters.length !== 1) {
        return false
    }
    return node.extendedAttributes
        ?.some(it => it.name === Config.getterAttribute)
        ?? false
}

export function createDefaultTypescriptWriter() {
    return new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => throwException(`Unexpected type conversion`) }
    )
}

export function signatureTypes(node: IDLMethod): IDLType[] {
    return node.parameters
        .map(it => it.type)
        .concat(node.returnType)
}