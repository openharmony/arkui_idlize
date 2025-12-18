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

import { stringOrNone, isDefined, indentedBy } from "../util"
import { isInterface, isOptionalType, isPrimitiveType, isContainerType, isReferenceType, isUnionType, isTypeParameterType, hasExtAttribute } from "./discriminators"
import { IDLKeywords } from "./keywords"
import { IDLType, IDLInterface, IDLExtendedAttributes, IDLKind, IDLParameter, IDLConstructor, IDLVariable, IDLConstant, IDLProperty, IDLNode, IDLSignature, IDLTypedef, IDLReferenceType, IDLExtendedAttribute, IDLFunction, IDLMethod, IDLFile, IDLImport, IDLNamespace, IDLCallback, IDLEntry, IDLEnumMember, IDLEnum } from "./node"
import { IDLNullTypeName, IDLUndefinedType, IDLStringType } from "./stdlib"

export function escapeIDLKeyword(name: string): string {
    return name + (IDLKeywords.has(name) ? "_" : "")
}

export function unescapeKeyword(name: string): string {
    if (name.endsWith("_")) {
        const unwrapped = name.slice(0, -1)
        if (IDLKeywords.has(unwrapped)) return unwrapped
    }
    return name
}

type PrintedIndentInc = "[[indent-inc]]"
type PrintedIndentDec = "[[indent-dec]]"
type PrintedLine = undefined | string | PrintedIndentInc | PrintedIndentDec

const printedIndentInc: PrintedIndentInc = "[[indent-inc]]"
const printedIndentDec: PrintedIndentDec = "[[indent-dec]]"

type PrintTypeOptions = {
    [key: string]: any
}
export function printType(type: IDLType | IDLInterface | undefined, options?: PrintTypeOptions): string {
    if (!type) throw new Error("Missing type")
    if (isInterface(type)) return type.name
    if (isOptionalType(type)) {
        if (hasExtAttribute(type, IDLExtendedAttributes.UnionOnlyNull))
            return `(${printType(type.type)} or ${IDLNullTypeName})`
        else if (hasExtAttribute(type, IDLExtendedAttributes.UnionWithNull))
            return `(${printType(type.type)} or ${IDLUndefinedType.name} or ${IDLNullTypeName})`
        else
            return `(${printType(type.type)} or ${IDLUndefinedType.name})`
    }
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type)) {
        const maybeExtendedAttributes = type.extendedAttributes && type.extendedAttributes.length
            ? `[${quoteAttributeValues(type.extendedAttributes)}] `
            : ''
        const res = `${maybeExtendedAttributes}${type.containerKind}<${type.elementType.map(it => printType(it)).join(", ")}>`
        if (maybeExtendedAttributes.length) {
            return `(${res})`
        }
        return res
    }
    if (isReferenceType(type)) {
        const maybeExtendedAttributes = type.extendedAttributes && type.extendedAttributes.length
            ? `[${quoteAttributeValues(type.extendedAttributes)}] `
            : ''
        const maybeTypeArguments = type.typeArguments && type.typeArguments.length
            ? '<' + type.typeArguments.map(t => printType(t)).join(', ') + '>'
            : ''
        let res = `${maybeExtendedAttributes}${type.name}${maybeTypeArguments}`;
        if (maybeExtendedAttributes.length && options?.bracketsAroundReferenceTypeWithExtAttrs)
            return `(${res})`;
        return res;
    }
    if (isUnionType(type)) return `(${type.types.map(it => printType(it)).join(" or ")})`
    if (isTypeParameterType(type)) return type.name
    throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
}

export function printReturnType(type: IDLType | IDLInterface | undefined): string {
    return printType(type, { bracketsAroundReferenceTypeWithExtAttrs: true });
}

export function printParameters(parameters: IDLParameter[] | undefined): string {
    return parameters
        ?.map(it =>
            nameWithType(it, it.isVariadic, it.isOptional)
        )
        ?.join(", ") ?? ""
}

export function printConstructor(idl: IDLConstructor): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 1),
        `constructor(${printParameters(idl.parameters)});`
    ]
}

export function nameWithType(
    idl: IDLVariable,
    isVariadic: boolean = false,
    isOptional: boolean = false
): string {
    const type = printType(idl.type)
    const variadic = isVariadic ? "..." : ""
    const optional = isOptional ? "optional " : ""
    return `${optional}${type}${variadic} ${escapeIDLKeyword(idl.name!)}`
}

export function printConstant(idl: IDLConstant): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 1),
        `const ${nameWithType(idl)}${idl.value ? ` = ${idl.value}` : ``};`
    ]
}

export function printProperty(idl: IDLProperty): PrintedLine[] {
    const staticMod = idl.isStatic ? "static " : ""
    const readonlyMod = idl.isReadonly ? "readonly " : ""

    return [
        ...printExtendedAttributes(idl, 1),
        `${staticMod}${readonlyMod}attribute ${nameWithType(idl)};`
    ]
}

export function printExtendedAttributes(idl: IDLNode, indentLevel: number): PrintedLine[] {
    let typeParameters: string[] | undefined
    let typeArguments: IDLType[] | undefined
    switch (idl.kind) {
        case IDLKind.Interface:
            typeParameters = (idl as IDLInterface).typeParameters
            break
        case IDLKind.Callback:
        case IDLKind.Method:
        case IDLKind.Callable:
        case IDLKind.Constructor:
            typeParameters = (idl as IDLSignature).typeParameters
            break
        case IDLKind.Typedef:
            typeParameters = (idl as IDLTypedef).typeParameters
            break
        case IDLKind.ReferenceType:
            typeArguments = (idl as IDLReferenceType).typeArguments
            break
    }
    const attributes: IDLExtendedAttribute[] = Array.from(idl.extendedAttributes ?? [])

    if (idl.documentation) {
        let docs: IDLExtendedAttribute = {
            name: IDLExtendedAttributes.Documentation,
            value: idl.documentation
        }
        attributes.unshift(docs)
    }

    // Deduplicate
    const names = new Set<string>()
    const actualAttributes: IDLExtendedAttribute[] = []
    for (const attr of attributes) {
        if (names.has(attr.name)) {
            continue
        }
        names.add(attr.name)
        actualAttributes.push(attr)
    }

    if (actualAttributes.length == 0) {
        return []
    }

    const attrSpec = quoteAttributeValues(actualAttributes)
    return attrSpec ? [`[${attrSpec}]`] : []
}

export const attributesToQuote = new Set([
    IDLExtendedAttributes.Documentation,
    IDLExtendedAttributes.DtsName,
    IDLExtendedAttributes.DtsTag,
    IDLExtendedAttributes.Import,
    IDLExtendedAttributes.Interfaces,
    IDLExtendedAttributes.TraceKey,
    IDLExtendedAttributes.TypeParametersDefaults,
])

function printSpacedTypeParameters(params:string[] | undefined): string {
    return params && params.length
        ? '<' + params.join(', ') + '> '
        : ''
}

function quoteAttributeValues(attributes?: IDLExtendedAttribute[]): stringOrNone {
    return attributes
        ?.map(it => {
            let attr = it.name
            if (it.value) {
                let value = it.value
                if (value.includes('"') && !value.includes("'"))
                    value = value.replaceAll('"', "'")
                value = value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
                attr += `=${attributesToQuote.has(it.name as IDLExtendedAttributes) ? `"${value}"` : it.value}`
            }
            return attr
        })
        .join(", ")
}

export function printFunction(idl: IDLFunction): PrintedLine[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        `${idl.isAsync ? "async " : ""}${printReturnType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`
    ]
}

export function printMethod(idl: IDLMethod): PrintedLine[] {
    if (idl.name?.startsWith("__")) {
        console.log(`Ignore ${idl.name}`)
        return []
    }
    return [
        ...printExtendedAttributes(idl, 1),
        `${idl.isStatic ? "static " : ""}${idl.isAsync ? "async " : ""}${printSpacedTypeParameters(idl.typeParameters)}${printReturnType(idl.returnType)} ${idl.name}(${printParameters(idl.parameters)});`
    ]
}

export function printPackage(idl: IDLFile): PrintedLine[] {
    const effectiveClause = idl.packageClause.filter(it => !!it)
    if (!effectiveClause.length)
        return []
    return [
        `package ${effectiveClause.join(".")};`
    ]
}

export function printImport(idl: IDLImport): PrintedLine[] {
    const effectiveClause = idl.clause.filter(it => !!it)
    return [
        `import ${effectiveClause.join(".") || "NULL_IMPORT"}${idl.name ? " as " : ""}${idl.name};`
    ]
}

export function printNamespace(idl: IDLNamespace): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 0),
        `namespace ${idl.name} {`,
        printedIndentInc,
        ...idl.members.map(member => printIDL(member)).flat(),
        printedIndentDec,
        "};"
    ]
}

export function printCallback(idl: IDLCallback): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 0),
        `callback ${printSpacedTypeParameters(idl.typeParameters)}${idl.name} = ${printReturnType(idl.returnType)} (${printParameters(idl.parameters)});`
    ]
}

export function printScoped(idl: IDLEntry): PrintedLine[] {
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind === IDLKind.Interface) return printInterface(idl as IDLInterface)
    throw new Error(`Unexpected scoped: ${idl.kind} ${idl.name}`)
}

function printInterfaceInherit(idl: IDLInterface): string {
    if (idl.inheritance.length === 0) {
        return ""
    }
    const types = idl.inheritance.map(type => printType(type))
    return ": " + types.join(', ')
}

function printInterfaceHead(decl: IDLInterface): string {
    return [
        'interface ',
        printSpacedTypeParameters(decl.typeParameters),
        `${decl.name}${printInterfaceInherit(decl)} {`,
    ].join('')
}

export function printInterface(idl: IDLInterface): PrintedLine[] {
    return [
        ...printExtendedAttributes(idl, 0),
        printInterfaceHead(idl),
    ]
        .concat(printedIndentInc)
        .concat(idl.constructors.map(printConstructor).flat())
        .concat(idl.constants.map(printConstant).flat())
        .concat(idl.properties.map(printProperty).flat())
        .concat(idl.methods.map(printMethod).flat())
        .concat(idl.callables.map(printFunction).flat())
        .concat(printedIndentDec)
        .concat(["};"])
}

export function printEnumMember(idl: IDLEnumMember): PrintedLine[] {
    const type = printType(idl.type)
    const initializer = idl.initializer === undefined
        ? ''
        : ' = ' + (type === IDLStringType.name
            ? `"${String(idl.initializer).replaceAll('"', "'")}"`
            : idl.initializer)
    return [
        idl.documentation,
        ...printExtendedAttributes(idl, 0),
        `${type} ${idl.name}${initializer};`
    ]
}

export function printEnum(idl: IDLEnum, skipInitializers: boolean): PrintedLine[] {
    if (skipInitializers) {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `enum ${idl.name!} {`,
            printedIndentInc,
            ...idl.elements.map(it => `${it.name} ${(it.initializer !== undefined ? " /* " + it.initializer + " */" : "")}`),
            printedIndentDec,
            "};"
        ]
    } else {
        return [
            idl.documentation,
            ...printExtendedAttributes(idl, 0),
            `dictionary ${idl.name!} {`,
            printedIndentInc,
            ...idl.elements.map(printEnumMember) as any,
            printedIndentDec,
            "};"
        ].flat()
    }
}

export function printTypedef(idl: IDLTypedef): PrintedLine[] {
    return [
        idl.documentation,
        ...printExtendedAttributes(idl, 0),
        `typedef ${printSpacedTypeParameters(idl.typeParameters)}${idl.name} = ${printType(idl.type)};`
    ]
}

// TODO: use IndentedPrinter instead!
export function printIDL(idl: IDLNode, options?: Partial<IDLPrintOptions>): PrintedLine[] {
    if (idl.kind == IDLKind.Interface) return printInterface(idl as IDLInterface)
    if (idl.kind == IDLKind.Enum) return printEnum(idl as IDLEnum, options?.disableEnumInitializers ?? false)
    if (idl.kind == IDLKind.Typedef) return printTypedef(idl as IDLTypedef)
    if (idl.kind == IDLKind.Callback) return printCallback(idl as IDLCallback)
    if (idl.kind == IDLKind.Import) return printImport(idl as IDLImport)
    if (idl.kind == IDLKind.Namespace) return printNamespace(idl as IDLNamespace)
    if (idl.kind == IDLKind.Method) return printMethod(idl as IDLMethod)
    if (idl.kind == IDLKind.Const) return printConstant(idl as IDLConstant)

    if (options?.allowUnknownKinds) {
        return [`${IDLKind[idl.kind]} ${"name" in idl ? (idl as any).name : ""}`]
    } else {
        throw new Error(`unexpected kind: ${idl.kind}`)
    }
}

export interface IDLPrintOptions {
    verifyIdl: boolean
    disableEnumInitializers: boolean
    allowUnknownKinds: boolean
}

export function toIDLString(file: IDLFile, options: Partial<IDLPrintOptions>): string {
    let indent = 0

    const generated = printPackage(file)
    return generated.concat(file.entries
        .map(it => printIDL(it, options))
        .flat()
        .filter(isDefined)
        .filter(it => it.length > 0)
        .map(it => {
            if (it === printedIndentInc) {
                ++indent
                return undefined
            } else if (it === printedIndentDec) {
                --indent
                return undefined
            } else
                return indentedBy(it as string, indent)
        })
        .filter(isDefined)
    ).join("\n")
}