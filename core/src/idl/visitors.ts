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

import { generateSyntheticUnionName } from "../peer-generation/idl/common"
import { IDLNodeInitializer, createInterface, createFile, createNamespace, createMethod, createCallable, createCallback, createConstructor, createUnionType, createOptionalType, createConstant, createEnum, createEnumMember, createProperty, createParameter, createTypedef, createContainerType, createReferenceType, createImport, createTypeParameterReference, createVersion } from "./builders"
import { isType, isNamespace, isInterface, isMethod, isCallback, isTypedef, isEnum, isImport, isVersion, isConstant, isConstructor, isProperty, isCallable, isFile, isReferenceType, isParameter, isUnionType, isOptionalType, isEnumMember, isPrimitiveType, isContainerType, isTypeParameterType } from "./discriminators"
import { IDLNode, IDLKind, IDLFile, IDLNamespace, IDLInterface, IDLSignature, IDLUnionType, IDLOptionalType, IDLConstant, IDLEnum, IDLProperty, IDLParameter, IDLTypedef, IDLContainerType, IDLReferenceType, IDLEntry, IDLConstructor, IDLMethod, IDLCallable, IDLType, IDLEnumMember, IDLCallback, IDLImport, IDLTypeParameterType, IDLVersion, IDLFunction } from "./node"

type IDLNodeVisitorVoid = (node: IDLNode) => void
type IDLNodeVisitorValue = (node: IDLNode) => () => void

type IDLNodeVisitor =
    IDLNodeVisitorVoid
    | IDLNodeVisitorValue

export function forEachChild(node: IDLNode, cbEnter: IDLNodeVisitor, cbLeave?: (entry: IDLNode) => void): void {
    const cleanup = cbEnter(node)
    switch (node.kind) {
        case IDLKind.File:
            (node as IDLFile).entries.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        case IDLKind.Namespace:
            (node as IDLNamespace).members.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break

        case IDLKind.Interface: {
            let concrete = node as IDLInterface
            concrete.inheritance.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.constructors.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.properties.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.methods.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            concrete.callables.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.Method:
        case IDLKind.Callable:
        case IDLKind.Callback:
        case IDLKind.Constructor: {
            let concrete = node as IDLSignature
            concrete.parameters?.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            if (concrete.returnType) forEachChild(concrete.returnType, cbEnter, cbLeave)
            break
        }
        case IDLKind.UnionType: {
            let concrete = node as IDLUnionType
            concrete.types?.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.OptionalType: {
            let concrete = node as IDLOptionalType
            forEachChild(concrete.type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Const: {
            forEachChild((node as IDLConstant).type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Enum: {
            (node as IDLEnum).elements.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.Property: {
            forEachChild((node as IDLProperty).type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Parameter: {
            const concrete = node as IDLParameter
            if (concrete.type)
                forEachChild(concrete.type, cbEnter, cbLeave)
            break
        }
        case IDLKind.Typedef: {
            forEachChild((node as IDLTypedef).type, cbEnter, cbLeave)
            break
        }
        case IDLKind.ContainerType: {
            (node as IDLContainerType).elementType.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.ReferenceType: {
            (node as IDLReferenceType).typeArguments?.forEach((value) => forEachChild(value, cbEnter, cbLeave))
            break
        }
        case IDLKind.TypeParameterType:
        case IDLKind.EnumMember:
        case IDLKind.Import:
        case IDLKind.PrimitiveType:
        case IDLKind.Version:
            break
        default: {
            throw new Error(`Unhandled ${node.kind}`)
        }
    }

    cbLeave?.(node)
    cleanup?.()
}

/** Updates tree in place! */
export function updateEachChild(node: IDLNode, op: (node: IDLNode) => IDLNode, cbLeave?: (entry: IDLNode) => void): IDLNode {
    const old = node
    node = op(old)
    if (node.kind !== old.kind && !(isType(old) && isType(node))) {
        throw new Error("Kinds must be the same!")
    }
    switch (node.kind) {
        case IDLKind.File: {
            const concrete = node as IDLFile
            concrete.entries = concrete.entries.map(it => updateEachChild(it, op, cbLeave) as IDLEntry)
            break
        }
        case IDLKind.Namespace: {
            const concrete = node as IDLNamespace
            concrete.members = concrete.members.map((it) => updateEachChild(it, op, cbLeave) as IDLEntry)
            break
        }
        case IDLKind.Interface: {
            const concrete = node as IDLInterface
            concrete.inheritance = concrete.inheritance.map((it) => updateEachChild(it, op, cbLeave) as IDLReferenceType)
            concrete.constructors = concrete.constructors.map((it) => updateEachChild(it, op, cbLeave) as IDLConstructor)
            concrete.properties = concrete.properties.map((it) => updateEachChild(it, op, cbLeave) as IDLProperty)
            concrete.methods = concrete.methods.map((it) => updateEachChild(it, op, cbLeave) as IDLMethod)
            concrete.callables = concrete.callables.map((it) => updateEachChild(it, op, cbLeave) as IDLCallable)
            break
        }
        case IDLKind.Method:
        case IDLKind.Callable:
        case IDLKind.Callback:
        case IDLKind.Constructor: {
            const concrete = node as IDLSignature
            concrete.parameters = concrete.parameters.map((it) => updateEachChild(it, op, cbLeave) as IDLParameter)
            if (concrete.returnType) {
                concrete.returnType = updateEachChild(concrete.returnType, op, cbLeave) as IDLType
            }
            break
        }
        case IDLKind.UnionType: {
            const concrete = node as IDLUnionType
            concrete.types = concrete.types.map((it) => updateEachChild(it, op, cbLeave) as IDLType)
            break
        }
        case IDLKind.OptionalType: {
            const concrete = node as IDLOptionalType
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Const: {
            const concrete = node as IDLConstant
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Enum: {
            const concrete = node as IDLEnum
            concrete.elements = concrete.elements.map((it) => updateEachChild(it, op, cbLeave) as IDLEnumMember)
            break
        }
        case IDLKind.Property: {
            const concrete = node as IDLProperty
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Parameter: {
            const concrete = node as IDLParameter
            if (concrete.type)
                concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.Typedef: {
            const concrete = node as IDLTypedef
            concrete.type = updateEachChild(concrete.type, op, cbLeave) as IDLType
            break
        }
        case IDLKind.ContainerType: {
            const concrete = node as IDLContainerType
            concrete.elementType = concrete.elementType.map(it => updateEachChild(it, op, cbLeave) as IDLType)
            break
        }
        case IDLKind.ReferenceType: {
            const concrete = node as IDLReferenceType
            concrete.typeArguments = concrete.typeArguments?.map(it => updateEachChild(it, op, cbLeave) as IDLType)
            break
        }
        case IDLKind.TypeParameterType:
        case IDLKind.EnumMember:
        case IDLKind.Import:
        case IDLKind.PrimitiveType:
        case IDLKind.Version:
            break
        default: {
            throw new Error(`Unhandled ${node.kind}`)
        }
    }
    if (cbLeave) {
        cbLeave?.(node)
    }
    return node
}

export function cloneNodeInitializer(other: IDLNodeInitializer): IDLNodeInitializer {
    return {
        documentation: other.documentation,
        extendedAttributes: other.extendedAttributes?.map(it => { return { ...it } }),
        fileName: other.fileName,
        nameLocation: other.nameLocation,
        nodeLocation: other.nodeLocation,
        valueLocation: other.valueLocation,
    }
}

export function visitChildren(node: IDLNode, mutator: (node: IDLNode) => IDLNode): IDLNode {
    function track(visitor: (op: (node: IDLNode) => IDLNode) => () => IDLNode) {
        let changed = false
        let factory: () => IDLNode = visitor(
            (node) => {
                const newNode = mutator(node)
                changed ||= node !== newNode
                return newNode
            },
        )
        return changed ? factory!() : node
    }
    function assert<T extends IDLNode, S extends T>(predicate: (value: T) => value is S): (node: T) => S {
        return (node: T) => {
            if (predicate(node))
                return node
            throw new Error(`Unexpected node kind ${node.kind}`)
        }
    }
    function isNamespaceMember(node: IDLNode): node is IDLNamespace | IDLInterface | IDLMethod | IDLCallback | IDLTypedef | IDLConstant {
        return isNamespace(node)
            || isInterface(node)
            || isMethod(node) && node.isFree
            || isCallback(node)
            || isTypedef(node)
            || isEnum(node)
            || isImport(node)
            || isVersion(node)
            || isConstant(node)
    }
    function isInterfaceMember(node: IDLNode): node is IDLConstructor | IDLMethod | IDLConstant | IDLProperty | IDLCallable {
        return isConstructor(node)
            || isMethod(node)
            || isConstant(node)
            || isProperty(node)
            || isCallable(node)
    }

    if (isFile(node)) {
        return track((op) => {
            const entries = node.entries.map(op).map(assert(isNamespaceMember))
            return () => createFile(
                entries,
                node.fileName,
                node.packageClause,
                cloneNodeInitializer(node)
            )
        })
    }
    if (isNamespace(node)) {
        return track((op) => {
            const members = node.members.map(op).map(assert(isNamespaceMember))
            return () => createNamespace(
                node.name,
                members,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isInterface(node)) {
        return track((op) => {
            const inheritance = node.inheritance.map(op).map(assert(isReferenceType))
            const members = [
                ...node.constructors,
                ...node.callables,
                ...node.properties,
                ...node.methods,
                ...node.constants,
            ].map(op).map(assert(isInterfaceMember))
            return () => createInterface(
                node.name,
                node.subkind,
                inheritance,
                members.filter(isConstructor),
                members.filter(isConstant),
                members.filter(isProperty),
                members.filter(isMethod),
                members.filter(isCallable),
                node.typeParameters,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isMethod(node)) {
        return track(op => {
            const parameters = node.parameters.map(op).map(assert(isParameter))
            const returnType = assert(isType)(op(node.returnType))
            return () => createMethod(
                node.name,
                parameters,
                returnType,
                { isAsync: node.isAsync, isFree: node.isFree, isOptional: node.isOptional, isStatic: node.isStatic },
                cloneNodeInitializer(node),
                node.typeParameters,
            )
        })
    }
    if (isCallable(node)) {
        return track(op => {
            const parameters = node.parameters.map(op).map(assert(isParameter))
            const returnType = assert(isType)(op(node.returnType))
            return () => createCallable(
                node.name,
                parameters,
                returnType,
                { isAsync: node.isAsync, isStatic: node.isStatic },
                cloneNodeInitializer(node),
            )
        })
    }
    if (isCallback(node)) {
        return track(op => {
            const parameters = node.parameters.map(op).map(assert(isParameter))
            const returnType = assert(isType)(op(node.returnType))
            return () => createCallback(
                node.name,
                parameters,
                returnType,
                cloneNodeInitializer(node),
                node.typeParameters,
            )
        })
    }
    if (isConstructor(node)) {
        return track(op => {
            const parameters = node.parameters.map(op).map(assert(isParameter))
            const returnType = node.returnType ? assert(isType)(op(node.returnType)) : undefined
            return () => createConstructor(
                parameters,
                returnType,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isUnionType(node)) {
        return track(op => {
            const types = node.types.map(op).map(assert(isType))
            const name = types.some((it, index) => it !== node.types[index])
                ? generateSyntheticUnionName(types)
                : node.name
            return () => createUnionType(
                types,
                name,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isOptionalType(node)) {
        return track(op => {
            const t = assert(isType)(op(node.type))
            return () => createOptionalType(
                t,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isConstant(node)) {
        return track(op => {
            const t = assert(isType)(op(node.type))
            return () => createConstant(
                node.name,
                t,
                node.value,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isEnum(node)) {
        return track(op => {
            const elements = node.elements.map(op).map(assert(isEnumMember))
            return () => createEnum(
                node.name,
                elements,
                cloneNodeInitializer(node)
            )
        })
    }
    if (isEnumMember(node)) {
        return track(op => {
            const t = assert(isPrimitiveType)(op(node.type))
            return () => createEnumMember(
                node.name,
                node.parent /* TODO seems strange in that context */,
                t,
                node.initializer,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isProperty(node)) {
        return track(op => {
            const t = assert(isType)(op(node.type))
            return () => createProperty(
                node.name,
                t,
                node.isReadonly,
                node.isStatic,
                node.isOptional,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isParameter(node)) {
        return track(op => {
            const t = assert(isType)(op(node.type))
            return () => createParameter(
                node.name,
                t,
                node.isOptional,
                node.isVariadic,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isTypedef(node)) {
        return track(op => {
            const t = assert(isType)(op(node.type))
            return () => createTypedef(
                node.name,
                t,
                node.typeParameters,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isContainerType(node)) {
        return track(op => {
            const elementType = node.elementType.map(op).map(assert(isType))
            return () => createContainerType(
                node.containerKind,
                elementType,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isReferenceType(node)) {
        return track(op => {
            const typeArguments = node.typeArguments?.map(op).map(assert(isType))
            return () => createReferenceType(
                node.name,
                typeArguments,
                cloneNodeInitializer(node),
            )
        })
    }
    if (isTypeParameterType(node)
        || isImport(node)
        || isPrimitiveType(node)
        || isVersion(node)) {
        return node
    }

    throw new Error(`Not implemented`)
}

export function linkParentBack<T extends IDLNode>(node: T): T {
    const parentStack: IDLNode[] = []
    updateEachChild(node, (node) => {
        if (isPrimitiveType(node)) {
            return node
        }
        if (parentStack.length) {
            const top = parentStack[parentStack.length - 1]
            if (node.parent !== undefined && node.parent !== top) {
                node = clone(node)
            }
            node.parent = top
        }
        parentStack.push(node)
        return node
    }, (node) => {
        if (isPrimitiveType(node)) {
            return
        }
        parentStack.pop()
    })
    return node
}

export function clone<T extends IDLNode>(node: T): T {
    const make = (newnode: IDLNode): T => {
        if (node.nodeLocation) {
            newnode.nodeLocation = node.nodeLocation
        }
        if (node.nameLocation) {
            newnode.nameLocation = node.nameLocation
        }
        if (node.valueLocation) {
            newnode.valueLocation = node.valueLocation
        }
        return newnode as T
    }
    const get = <K>(node: T): K => node as IDLNode as K

    switch (node.kind) {
        case IDLKind.Interface: {
            const entry = get<IDLInterface>(node)
            return make(
                createInterface(
                    entry.name,
                    entry.subkind,
                    entry.inheritance?.map(clone),
                    entry.constructors?.map(clone),
                    entry.constants.map(clone),
                    entry.properties.map(clone),
                    entry.methods.map(clone),
                    entry.callables.map(clone),
                    entry.typeParameters?.map(it => it),
                    cloneNodeInitializer(node),
                )
            )
        }
        case IDLKind.Import: {
            const entry = get<IDLImport>(node)
            return make(
                createImport(
                    entry.clause,
                    entry.name,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.Callback: {
            const entry = get<IDLCallback>(node)
            return make(
                createCallback(
                    entry.name,
                    entry.parameters.map(clone),
                    clone(entry.returnType),
                    cloneNodeInitializer(entry),
                    entry.typeParameters
                )
            )
        }
        case IDLKind.Const: {
            const entry = get<IDLConstant>(node)
            return make(
                createConstant(
                    entry.name,
                    clone(entry.type),
                    entry.value,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.Property: {
            const entry = get<IDLProperty>(node)
            return make(
                createProperty(
                    entry.name,
                    clone(entry.type),
                    entry.isReadonly,
                    entry.isStatic,
                    entry.isOptional,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.Parameter: {
            const entry = get<IDLParameter>(node)
            return make(
                createParameter(
                    entry.name,
                    clone(entry.type),
                    entry.isOptional,
                    entry.isVariadic,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.Method: {
            const entry = get<IDLMethod>(node)
            return make(
                createMethod(
                    entry.name,
                    entry.parameters.map(clone),
                    clone(entry.returnType),
                    {
                        isAsync: entry.isAsync,
                        isFree: entry.isFree,
                        isOptional: entry.isOptional,
                        isStatic: entry.isStatic
                    },
                    cloneNodeInitializer(entry),
                    entry.typeParameters
                )
            )
        }
        case IDLKind.Callable: {
            const entry = get<IDLCallable>(node)
            return make(
                createCallable(
                    entry.name,
                    entry.parameters.map(clone),
                    clone(entry.returnType),
                    {
                        isAsync: entry.isAsync,
                        isStatic: entry.isStatic
                    },
                    cloneNodeInitializer(entry),
                    entry.typeParameters
                )
            )
        }
        case IDLKind.Constructor: {
            const entry = get<IDLConstructor>(node)
            return make(
                createConstructor(
                    entry.parameters.map(clone),
                    entry.returnType ? clone(entry.returnType) : undefined,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.Enum: {
            const entry = get<IDLEnum>(node)
            const cloned = createEnum(
                entry.name,
                entry.elements.map(clone),
                cloneNodeInitializer(entry),
            )
            cloned.elements.forEach(it => {
                it.parent = cloned
            })
            return make(cloned)
        }
        case IDLKind.EnumMember: {
            const entry = get<IDLEnumMember>(node)
            return make(
                createEnumMember(
                    entry.name,
                    entry.parent,
                    clone(entry.type),
                    entry.initializer,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.Typedef: {
            const entry = get<IDLTypedef>(node)
            return make(
                createTypedef(
                    entry.name,
                    clone(entry.type),
                    entry.typeParameters,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.PrimitiveType: {
            return node
        }
        case IDLKind.ContainerType: {
            const type = get<IDLContainerType>(node)
            return make(
                createContainerType(
                    type.containerKind,
                    type.elementType.map(clone),
                    cloneNodeInitializer(type),
                )
            )
        }
        case IDLKind.ReferenceType: {
            const type = get<IDLReferenceType>(node)
            return make(
                createReferenceType(
                    type.name,
                    type.typeArguments?.map(clone),
                    cloneNodeInitializer(type),
                )
            )
        }
        case IDLKind.UnionType: {
            const type = get<IDLUnionType>(node)
            return make(
                createUnionType(
                    type.types.map(clone),
                    type.name,
                    cloneNodeInitializer(type),
                )
            )
        }
        case IDLKind.TypeParameterType: {
            const type = get<IDLTypeParameterType>(node)
            return make(
                createTypeParameterReference(
                    type.name,
                    cloneNodeInitializer(type),
                )
            )
        }
        case IDLKind.OptionalType: {
            const type = get<IDLOptionalType>(node)
            return make(
                createOptionalType(
                    clone(type.type),
                    cloneNodeInitializer(type),
                )
            )
        }
        case IDLKind.Version: {
            const entry = get<IDLVersion>(node)
            return make(
                createVersion(
                    entry.value,
                    cloneNodeInitializer(entry),
                )
            )
        }
        case IDLKind.Namespace: {
            const ns = get<IDLNamespace>(node)
            return make(
                createNamespace(
                    ns.name,
                    ns.members.map(clone),
                    cloneNodeInitializer(ns),
                )
            )
        }
        case IDLKind.File: {
            const file = get<IDLFile>(node)
            return make(
                createFile(
                    file.entries.map(clone),
                    file.fileName,
                    file.packageClause,
                    cloneNodeInitializer(file),
                )
            )
        }
    }
}

export function forEachFunction(node: IDLNode, cb: (node: IDLFunction) => void): void {
    forEachChild(node, child => {
        if (child.kind === IDLKind.Method || child.kind === IDLKind.Callable)
            cb(child as IDLFunction)
    })
}
