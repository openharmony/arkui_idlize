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
    createInterface,
    IDLContainerUtils,
    IDLEntry,
    IDLInterface,
    IDLMethod,
    IDLNode,
    IDLPrimitiveType,
    IDLReferenceType,
    IDLType,
    isEnum,
    isInterface,
    isPrimitiveType,
    isReferenceType
} from "@idlizer/core"

export function isString(node: IDLType): node is IDLPrimitiveType {
    return isPrimitiveType(node) && node.name === "String"
}

export function isSequence(node: IDLType): boolean {
    return IDLContainerUtils.isSequence(node)
}

export function createInterfaceWithUpdatedMethods(node: IDLInterface, methods: IDLMethod[]): IDLInterface {
    return createInterface(
        node.name,
        node.subkind,
        node.inheritance,
        node.constructors,
        node.constants,
        node.properties,
        methods,
        node.callables,
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

    isEnumReference(type: IDLType): type is IDLReferenceType {
        if (!isReferenceType(type)) {
            return false
        }
        const declaration = this.findRealDeclaration(type.name)
        return declaration !== undefined && isEnum(declaration)
    }

    isReferenceTo(type: IDLType, isTarget: (type: IDLNode) => boolean): boolean  {
        if (!isReferenceType(type)) {
            return false
        }
        const declaration = this.findRealDeclaration(type.name)
        return declaration !== undefined && isTarget(declaration)
    }
}