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
    createReferenceType,
    IDLFile,
    IDLInterface,
    IDLKind,
    IDLMethod,
    IDLNamedNode,
    IDLNamespace,
    IDLNode,
    IDLReferenceType,
    IDLType,
    IDLTypedef,
    isEnum,
    isInterface,
    isNamespace,
    isPrimitiveType,
    isReferenceType,
    isTypedef,
    resolveNamedNode,
    throwException
} from "@idlizer/core"
import { Config } from "./Config"
import { flatParentsImpl, fqName, nodeType } from "../utils/idl"

export class Typechecker {
    private namespaces: IDLNamespace[]

    constructor(private file: IDLFile) {
        this.namespaces = this.file.entries.filter(e => isNamespace(e)) as IDLNamespace[]
    }

    resolveReference(ref: IDLReferenceType): IDLNamedNode|undefined {
        const prefix = Config.dataClassPrefix
        // XXX: This is a temporary hack until duplicates will not be removed from idl
        if (ref.name.startsWith(prefix)) {
            const entry = this.resolveReference2(createReferenceType(ref.name.slice(prefix.length)))
            if (entry) {
                return entry
            }
        }
        return this.resolveReference2(ref)
    }

    private resolveReference2(ref: IDLReferenceType, debugPrefix = ''): IDLNamedNode|undefined {
        const target = ref.name.split('.')
        let entry = undefined
        if (target.length > 1) { // full-qualified
            entry = resolveNamedNode(target, undefined, [this.file])

        } else {
            if (ref.parent) {
                entry = resolveNamedNode(target, ref.parent, [this.file])
            }

            if (!entry) {
                for (const pov of this.namespaces) {
                    entry = resolveNamedNode(target, pov, [this.file])
                    if (entry) break
                }
            }
        }

        if (debugPrefix.length) {
            console.log(`RESOLVER: ${ref.name} => ${entry ? fqName(entry) : entry}`);
        }

        return entry
    }

    resolveRecursive(ref: IDLReferenceType): IDLNamedNode|undefined {
        const decl = this.resolveReference(ref)
        return decl && isTypedef(decl) && isReferenceType(decl.type)
            ? this.resolveRecursive(decl.type)
            : decl
    }

    flatParents(ref: IDLReferenceType | IDLInterface): IDLInterface[] {
        const resolveReference = (ref: IDLReferenceType, pov?: IDLNode) =>
            // TODO: idlize/core version, change to ours after testing
            resolveNamedNode(ref.name.split('.'), pov, [this.file])
        return flatParentsImpl(ref, resolveReference)
    }

    // All classes are consideres heirs of ArktsObject now
    isHeir(ref: IDLReferenceType|IDLInterface, ancestor: string): boolean {
        const resolveReference =
            (r: IDLReferenceType, _?: IDLNode) => this.resolveReference(r)

        const iface = isReferenceType(ref) ? resolveReference(ref) : ref
        if (!iface || !isInterface(iface)) {
            return false
        }

        const parents = flatParentsImpl(iface, resolveReference)
        if (parents.map(p => p.name).includes(ancestor)) {
            return true
        }

        return ancestor === Config.defaultAncestor
    }

    hasDescendants(ref: IDLReferenceType|IDLInterface): boolean {
        const iface = isReferenceType(ref) ? this.resolveReference(ref) : ref
        if (!iface || !isInterface(iface)) {
            return false
        }

        const lookupScopes: IDLNode[] = []
        const parent = iface.parent
        if (parent && isNamespace(parent)) {
            lookupScopes.push(...this.namespaces.filter(ns => ns.name === parent.name))
        } else {
            lookupScopes.push(this.file)
        }

        const visitInterfaces = (node: IDLNode, cb: (_: IDLInterface) => boolean): boolean => {
            switch (node.kind) {
                case IDLKind.File:
                    return (node as IDLFile).entries.some((value) => visitInterfaces(value, cb))
                case IDLKind.Namespace:
                    return (node as IDLNamespace).members.some((value) => visitInterfaces(value, cb))
                case IDLKind.Interface:
                    return cb(node as IDLInterface)
            }
            return false
        }

        return lookupScopes.some(scope => visitInterfaces(
            scope, (node: IDLInterface) => node.name !== iface.name && this.isHeir(node, iface.name)
        ))
    }

    isPeer(node: IDLInterface|IDLReferenceType): boolean {
        if (node.name === Config.astNodeCommonAncestor) return false // TODO: is handwritten
        if (node.name === Config.context) return false // TODO: is handwritten
        if (this.isHeir(node, Config.astNodeCommonAncestor)) return true
        if (this.isHeir(node, Config.defaultAncestor)) return true
        return false
    }

    isReferenceTo(type: IDLType, isTarget: (type: IDLNode) => boolean): boolean  {
        if (!isReferenceType(type)) {
            return false
        }
        const declaration = this.resolveReference(type)
        return declaration !== undefined && isTarget(declaration)
    }

    isConstReturnValue(node: IDLMethod): boolean {
        const isPrimitive = (returnType: IDLNode): boolean => {
            const type = isReferenceType(returnType)
                ? this.resolveReference(returnType) ?? throwException(`Unresolved type ${returnType.name}`)
                : returnType
            return isPrimitiveType(type) || isEnum(type) || (isTypedef(type) && isPrimitive(type.type))
        }

        if (isPrimitive(node.returnType)) {
            return false
        }

        return node.name.endsWith(Config.constPostfix)
    }

    nodeTypeName(node: IDLInterface): string | undefined {
        const value = nodeType(node)
        const entry = this.resolveReference(createReferenceType(Config.nodeTypeAttribute))
        const name =  entry && isEnum(entry)
            ? entry.elements.find(e => e.initializer?.toString() === value)?.name
            : undefined
        return name ? `${Config.nodeTypeAttribute}.${name}` : undefined // value
    }
}
