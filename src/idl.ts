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

import * as webidl2 from "webidl2"
import { indentedBy, isDefined, stringOrNone } from "./util";

export enum IDLKind {
    Interface,
    Class,
    AnonymousInterface,
    Callback,
    Property,
    Parameter,
    Method,
    Callable,
    Constructor,
    Enum,
    EnumMember,
    Typedef,
    PrimitiveType,
    ContainerType,
    ReferenceType,
    EnumType,
    UnionType,
    TypeParameterType
}

export interface IDLExtendedAttribute {
    name: string
    value?: string
}

export interface IDLEntry {
    name?: string
    kind?: IDLKind
    fileName?: string
    comment?: string
    documentation?: string
    extendedAttributes?: IDLExtendedAttribute[]
    scope?: IDLEntry[]
}

export interface IDLType {
    name: string
    kind: IDLKind
    fileName?: string
    extendedAttributes?: IDLExtendedAttribute[]
    documentation?: string
}

export interface IDLTypedef extends IDLEntry {
    kind: IDLKind.Typedef
    name: string
    type: IDLType
}

export interface IDLPrimitiveType extends IDLType {
    kind: IDLKind.PrimitiveType
}

export interface IDLContainerType extends IDLType {
    kind: IDLKind.ContainerType
    elementType: IDLType[]
}

export interface IDLReferenceType extends IDLType {
    kind: IDLKind.ReferenceType
}

export interface IDLEnumType extends IDLType {
    kind: IDLKind.EnumType
}

export interface IDLUnionType extends IDLType {
    kind: IDLKind.UnionType
    types: IDLType[]
}

export interface IDLTypeParameterType extends IDLType {
    kind: IDLKind.TypeParameterType
}

export interface IDLVariable extends IDLEntry {
    type?: IDLType;
}

export interface IDLTypedEntry extends IDLEntry {
    type?: IDLType;
}

export interface IDLEnum extends IDLEntry {
    kind: IDLKind.Enum
    name: string
    elements: IDLEnumMember[]
}

export interface IDLEnumMember extends IDLEntry {
    kind: IDLKind.EnumMember
    name: string
    type: IDLPrimitiveType
    initializer: number | string | undefined
}

export interface IDLProperty extends IDLTypedEntry {
    name: string
    kind: IDLKind.Property
    type: IDLType
    isReadonly: boolean
    isStatic: boolean
    isOptional: boolean
}

export interface IDLParameter extends IDLTypedEntry {
    kind: IDLKind.Parameter
    name: string
    isVariadic: boolean
    isOptional: boolean
}

export interface IDLSignature extends IDLEntry {
    parameters: IDLParameter[]
    returnType?: IDLType
}

export interface IDLFunction extends IDLSignature {
}

export interface IDLMethod extends IDLFunction {
    kind: IDLKind.Method
    name: string
    returnType: IDLType
    isStatic: boolean
}

export interface IDLCallable extends IDLFunction {
    kind: IDLKind.Callable
    isStatic: boolean
}

export interface IDLConstructor extends IDLSignature {
    kind: IDLKind.Constructor
}

export interface IDLInterface extends IDLEntry {
    name: string
    kind: IDLKind.Interface | IDLKind.Class | IDLKind.AnonymousInterface
    inheritance: IDLType[]
    constructors: IDLConstructor[]
    properties: IDLProperty[]
    methods: IDLMethod[]
    callables: IDLFunction[]
}

export interface IDLCallback extends IDLEntry, IDLSignature {
    kind: IDLKind.Callback
    name: string
    returnType: IDLType
}

export function forEachChild(node: IDLEntry, cb: (entry: IDLEntry) => void): void {
    cb(node)
    switch (node.kind) {
        case IDLKind.Interface:
        case IDLKind.Class:
        case IDLKind.AnonymousInterface: {
            let iface = node as IDLInterface
            iface.inheritance.forEach((value) => forEachChild(value, cb))
            iface.constructors?.forEach((value) => forEachChild(value, cb))
            iface.properties.forEach((value) => forEachChild(value, cb))
            iface.methods.forEach((value) => forEachChild(value, cb))
            iface.callables.forEach((value) => forEachChild(value, cb))
            iface.scope?.forEach((value) => forEachChild(value, cb))
            break
        }
        case IDLKind.Method:
        case IDLKind.Callable:
        case IDLKind.Callback:
        case IDLKind.Constructor: {
            let param = node as IDLSignature
            param.parameters?.forEach((value) => forEachChild(value, cb))
            if (param.returnType) forEachChild(param.returnType, cb)
            break
        }
        case IDLKind.UnionType: {
            let param = node as IDLUnionType
            param.types?.forEach((value) => forEachChild(value, cb))
            break
        }
        case IDLKind.Enum: {
            break
        }
        case IDLKind.Property:
        case IDLKind.Parameter:
        case IDLKind.Typedef:
        case IDLKind.EnumType:
        case IDLKind.PrimitiveType:
        case IDLKind.ContainerType:
        case IDLKind.TypeParameterType:
        case IDLKind.ReferenceType: {
            break
        }
        default: {
            throw new Error(`Unhandled ${node.kind}`)
        }
    }
}

export function isPrimitiveType(type: IDLType): type is IDLPrimitiveType {
    return type.kind == IDLKind.PrimitiveType
}
export function isContainerType(type: IDLType): type is IDLContainerType {
    return type.kind == IDLKind.ContainerType
}
export function isReferenceType(type: IDLType): type is IDLReferenceType {
    return type.kind == IDLKind.ReferenceType
}
export function isEnumType(type: IDLType): type is IDLEnumType {
    return type.kind == IDLKind.EnumType
}
export function isEnum(type: IDLEntry): type is IDLEnum {
    return type.kind == IDLKind.Enum
}
export function isUnionType(type: IDLType): type is IDLUnionType {
    return type.kind == IDLKind.UnionType
}
export function isTypeParameterType(type: IDLType): type is IDLTypeParameterType {
    return type.kind == IDLKind.TypeParameterType
}
export function isInterface(node: IDLEntry): node is IDLInterface {
    return node.kind === IDLKind.Interface
}
export function isClass(node: IDLEntry): node is IDLInterface {
    return node.kind === IDLKind.Class
}
export function isMethod(node: IDLEntry): node is IDLMethod {
    return node.kind === IDLKind.Method
}
export function isConstructor(node: IDLEntry): node is IDLConstructor {
    return node.kind === IDLKind.Constructor
}
export function isProperty(node: IDLEntry): node is IDLProperty {
    return node.kind === IDLKind.Property
}
export function isCallback(node: IDLEntry): node is IDLCallback {
    return node.kind === IDLKind.Callback
}
export function isTypedef(node: IDLEntry): node is IDLTypedef {
    return node.kind === IDLKind.Typedef
}

export function createStringType(): IDLPrimitiveType {
    return {
        kind: IDLKind.PrimitiveType,
        name: "DOMString"
    }
}

export function createNumberType(): IDLPrimitiveType {
    return {
        kind: IDLKind.PrimitiveType,
        name: "number"
    }
}

export function createUndefinedType(): IDLPrimitiveType {
    return {
        kind: IDLKind.PrimitiveType,
        name: "undefined"
    }
}

export function createAnyType(documentation?: string): IDLPrimitiveType {
    return {
        kind: IDLKind.PrimitiveType,
        name: "any",
        documentation: documentation
    }
}

export function createReferenceType(name: string): IDLReferenceType {
    return {
        kind: IDLKind.ReferenceType,
        name: name
    }
}

export function createEnumType(name: string): IDLEnumType {
    return {
        kind: IDLKind.EnumType,
        name: name
    }
}

export function createContainerType(container: string, element: IDLType[]): IDLContainerType {
    return {
        kind: IDLKind.ContainerType,
        name: container,
        elementType: element
    }
}

export function createUnionType(types: IDLType[]): IDLUnionType {
    return {
        kind: IDLKind.UnionType,
        name: "or",
        types: types
    }
}

export function createTypeParameterReference(name: string): IDLTypeParameterType {
    return {
        kind: IDLKind.TypeParameterType,
        name: name
    }
}

export function createTypedef(name: string, type: IDLType): IDLTypedef {
    return {
        kind: IDLKind.Typedef,
        name: name,
        type: type
    }
}

export function printType(type: IDLType | undefined): string {
    if (!type) throw new Error("Missing type")
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type)) return `${type.name}<${type.elementType.map(printType).join(", ")}>`
    if (isReferenceType(type)) return `${type.name}`
    if (isUnionType(type)) return `(${type.types.map(printType).join(" or ")})`
    if (isEnumType(type)) return type.name
    if (isTypeParameterType(type)) return type.name
    throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
}

export function printParameters(parameters: IDLParameter[] | undefined): string {
    return parameters
        ?.map(it =>
            nameWithType(it, it.isVariadic, it.isOptional)
        )
        ?.join(", ") ?? ""
}

export function printConstructor(idl: IDLFunction): stringOrNone[] {
    return [indentedBy(`constructor(${printParameters(idl.parameters)});`, 1)]
}

export function nameWithType(
    idl: IDLVariable,
    isVariadic: boolean = false,
    isOptional: boolean = false
): string {
    const type = printType(idl.type)
    const variadic = isVariadic ? "..." : ""
    const optional = isOptional ? "optional " : ""
    return `${optional}${type}${variadic} ${idl.name}`
}

function printProperty(idl: IDLProperty): stringOrNone[] {
    const staticMod = idl.isStatic ? "static " : ""
    const readonlyMod = idl.isReadonly ? "readonly " : ""

    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`${staticMod}${readonlyMod}attribute ${nameWithType(idl)};`, 1)
    ]
}

function escapeDocs(input: string): string {
    return input.replaceAll('"', "'")
}

function printExtendedAttributes(idl: IDLEntry, indentLevel: number): stringOrNone[] {
    let attributes = idl.extendedAttributes
    if (idl.documentation) {
        let docs: IDLExtendedAttribute = {
            name: 'Documentation',
            value: `"${escapeDocs(idl.documentation)}"`
        }
        if (attributes)
            attributes.push(docs)
        else
            attributes = [docs]
    }
    return [attributes ? indentedBy(`[${attributes.map(it => `${it.name}${it.value ? "=" + it.value : ""}`).join(", ")}]`, indentLevel) : undefined]
}

export function printFunction(idl: IDLFunction): stringOrNone[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`${printType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`, 1)
    ]
}

export function printMethod(idl: IDLMethod): stringOrNone[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        indentedBy(`${idl.isStatic ? "static " : ""}${printType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`, 1)
    ]
}

export function printCallback(idl: IDLCallback): stringOrNone[] {
    return [`callback ${idl.name} = ${printType(idl.returnType)} (${printParameters(idl.parameters)});`]
}

export function printScoped(idl: IDLEntry): stringOrNone[] {
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind == IDLKind.AnonymousInterface) return printInterface(idl as IDLInterface)
    return [`/* Unexpected scoped: ${idl.kind} ${idl.name} */`]
}

export function printInterface(idl: IDLInterface): stringOrNone[] {
    return [
        ...printExtendedAttributes(idl, 0),
        `interface ${idl.name} ${idl.inheritance.length > 0 ? ": " + printType(idl.inheritance[0]) : ""} {`,
        // TODO: type system hack!
    ]
        .concat(idl.constructors.map(printConstructor).flat())
        .concat(idl.properties.map(printProperty).flat())
        .concat(idl.methods.map(printMethod).flat())
        .concat(idl.callables.map(printFunction).flat())
        .concat(["};"])
}

export function printEnumMember(idl: IDLEnumMember): stringOrNone[] {
    const type = printType(idl.type)
    const initializer = type == "DOMString" ? `"${idl.initializer}"` : idl.initializer
    return [indentedBy(`${type} ${idl.name}${initializer ? ` = ${initializer}` : ``};`, 1)]
}

export function printEnum(idl: IDLEnum, skipInitializers: boolean): stringOrNone[] {
    if (skipInitializers) {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `enum ${idl.name!} {`,
            ...idl.elements.map(it => indentedBy(`${it.name} ${(it.initializer ? " /* " + it.initializer + " */" : "")}`, 1)),
            "};"
        ]
    } else {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `dictionary ${idl.name!} {`,
            ...idl.elements.map(printEnumMember) as any,
            "};"
        ]
    }
}

export function printTypedef(idl: IDLTypedef): stringOrNone[] {
    return [
        idl.documentation,
        ...printExtendedAttributes(idl, 0),
        `typedef ${printType(idl.type)} ${idl.name!};`
    ]
}


export function printIDL(idl: IDLEntry, options?: Partial<IDLPrintOptions>): stringOrNone[] {
    if (idl.kind == IDLKind.Class
        || idl.kind == IDLKind.Interface
        || idl.kind == IDLKind.AnonymousInterface
    ) return printInterface(idl as IDLInterface)
    if (idl.kind == IDLKind.Enum) return printEnum(idl as IDLEnum, options?.disableEnumInitializers ?? false)
    if (idl.kind == IDLKind.Typedef) return printTypedef(idl as IDLTypedef)
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    return [`unexpected kind: ${idl.kind}`]
}

export interface IDLPrintOptions {
    verifyIdl: boolean
    disableEnumInitializers: boolean
}

export function toIDLString(entries: IDLEntry[], options: Partial<IDLPrintOptions>): string {
    const generatedScopes = printScopes(entries)
    const generatedIdl = entries
        .map(it => printIDL(it, options))
        .concat(generatedScopes)
        .flat()
        .filter(isDefined)
        .filter(it => it.length > 0)
        .join("\n")
    if (options.verifyIdl) webidl2.validate(webidl2.parse(generatedIdl))
    return generatedIdl
}

function printScopes(entries: IDLEntry[]) {
    return entries
        .map((it: IDLEntry) => it.scope)
        .filter(isDefined)
        .flatMap((it: IDLEntry[]) => it.map(printScoped))
}

export function hasExtAttribute(node: IDLEntry, attribute: string): boolean {
    return node.extendedAttributes?.find((it) => it.name == attribute) != undefined
}

export function getExtAttribute(node: IDLEntry, name: string): stringOrNone {
    let value = undefined
    node.extendedAttributes?.forEach(it => {
        if (it.name == name) value = it.value
    })
    return value
}

export function getVerbatimDts(node: IDLEntry): stringOrNone {
    let value = getExtAttribute(node, "VerbatimDts")
    return value ? value.substring(1, value.length - 1) : undefined
}