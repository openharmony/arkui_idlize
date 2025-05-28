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
    IDLEntry,
    IDLInterface,
    IDLMethod,
    IDLNode,
    IDLType,
    isEnum,
    isInterface,
    isPrimitiveType,
    isReferenceType,
    linearizeNamespaceMembers
} from "@idlizer/core"
import { Config } from "./Config"
import { baseNameString, isIrNamespace, nodeType, parent } from "../utils/idl"

export class Typechecker {
    constructor(private idl: IDLEntry[]) {
        this.idl = linearizeNamespaceMembers(idl)
    }

    findRealDeclaration(name: string): IDLEntry | undefined {
        // Poor man's namespace-aware resolve.
        // TODO: REWORK IT ALL!
        const declarations = this.idl.filter(it => (name === it.name) || (baseNameString(name) == baseNameString(it.name)))
        if (declarations.length === 1) {
            return declarations[0]
        }
        const ir = declarations
            .filter(isInterface)
            .filter(it => isIrNamespace(it))
        if (ir.length > 0) {
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
        let isHeir = declaration.name === ancestor
        declaration.inheritance.forEach(parent => {
            isHeir ||= this.isHeir(parent.name, ancestor)
        })
        return isHeir
    }

    isPeer(node: string): boolean {
        if (node === Config.astNodeCommonAncestor) return false // TODO: is handwritten
        if (node === Config.context) return false // TODO: is handwritten
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

    nodeTypeName(node: IDLInterface): string | undefined {
        const value = nodeType(node)
        const idlEnum = this.idl
            .filter(isEnum)
            .find(it => it.name === Config.nodeTypeAttribute)
        return idlEnum?.elements
            ?.find(it => it.initializer?.toString() === value)
            ?.name
    }

    parent(node: IDLInterface): IDLInterface | undefined {
        const parentName = parent(node)
        if (parentName === undefined) return undefined
        const decl = this.findRealDeclaration(parentName)
        if (decl === undefined) return undefined
        if (!isInterface(decl)) return undefined
        return decl
    }

    ancestry(node: IDLInterface): IDLInterface[] {
        let current = node
        const res = []
        while (true) {
            res.push(current)
            const parent = this.parent(current)
            if (parent === undefined) {
                return res
            }
            current = parent
        }
    }
}