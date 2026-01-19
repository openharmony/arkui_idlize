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

import { IndentedPrinter } from "../IndentedPrinter"
import { stringOrNone } from "../util"
import { IDLNullTypeName, IDLStringType, IDLUndefinedType } from "./builders"
import { isInterface, isOptionalType, isPrimitiveType, isContainerType, isReferenceType, isUnionType, isTypeParameterType, hasExtAttribute, isFile } from "./discriminators"
import { IDLKeywords } from "./keywords"
import { IDLType, IDLInterface, IDLExtendedAttributes, IDLKind, IDLParameter, IDLConstructor, IDLVariable, IDLConstant, IDLProperty, IDLNode, IDLSignature, IDLTypedef, IDLReferenceType, IDLExtendedAttribute, IDLFunction, IDLMethod, IDLFile, IDLImport, IDLNamespace, IDLCallback, IDLEntry, IDLEnumMember, IDLEnum } from "./node"

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

export function nameWithType(idl: IDLVariable, isVariadic: boolean = false, isOptional: boolean = false): string {
    const type = printType(idl.type)
    const variadic = isVariadic ? "..." : ""
    const optional = isOptional ? "optional " : ""
    return `${optional}${type}${variadic} ${escapeIDLKeyword(idl.name!)}`
}

const attributesToQuote = new Set([
    IDLExtendedAttributes.Documentation,
    IDLExtendedAttributes.DtsName,
    IDLExtendedAttributes.DtsTag,
    IDLExtendedAttributes.Import,
    IDLExtendedAttributes.Interfaces,
    IDLExtendedAttributes.TraceKey,
    IDLExtendedAttributes.TypeParametersDefaults,
])

export function quoteAttributeValues(attributes?: IDLExtendedAttribute[]): stringOrNone {
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

export class IDLWriter {
    constructor(protected printer: IndentedPrinter) { }

    print(line: stringOrNone): this {
        this.printer.print(line)
        return this
    }

    pushIndent(): this {
        this.printer.pushIndent()
        return this
    }

    popIndent(): this {
        this.printer.popIndent()
        return this
    }

    getOutput(): string[] {
        return this.printer.getOutput()
    }

    printReturnType(type: IDLType | IDLInterface | undefined): string {
        return printType(type, { bracketsAroundReferenceTypeWithExtAttrs: true });
    }

    printParameters(parameters: IDLParameter[]): string {
        return parameters
            ?.map(it =>
                nameWithType(it, it.isVariadic, it.isOptional)
            )
            ?.join(", ") ?? ""
    }

    printConstructor(idl: IDLConstructor): this {
        return this.printExtendedAttributes(idl)
            .print(`constructor(${this.printParameters(idl.parameters)});`)
    }

    printConstant(idl: IDLConstant): this {
        return this.printExtendedAttributes(idl)
            .print(`const ${nameWithType(idl)}${idl.value ? ` = ${idl.value}` : ``};`)
    }

    printProperty(idl: IDLProperty): this {
        const staticMod = idl.isStatic ? "static " : ""
        const readonlyMod = idl.isReadonly ? "readonly " : ""
        const optional = idl.isOptional ? "optional " : ""

        return this.printExtendedAttributes(idl)
            .print(`${staticMod}${readonlyMod}${optional}attribute ${nameWithType(idl)};`)
    }

    printExtendedAttributes(idl: IDLNode): this {
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
            return this
        }

        const attrSpec = quoteAttributeValues(actualAttributes)
        if (attrSpec) this.print(`[${attrSpec}]`)

        return this
    }

    printSpacedTypeParameters(params: string[] | undefined): string {
        return params && params.length
            ? '<' + params.join(', ') + '> '
            : ''
    }

    printFunction(idl: IDLFunction): this {
        if (idl.name?.startsWith("__")) {
            console.log(`Ignore ${idl.name}`)
            return this
        }
        return this.printExtendedAttributes(idl)
            .print(`${idl.isAsync ? "async " : ""}` +
                `${this.printReturnType(idl.returnType)} ${idl.name}` +
                `(${this.printParameters(idl.parameters)});`)
    }

    printMethod(idl: IDLMethod): this {
        if (idl.name?.startsWith("__")) {
            console.log(`Ignore ${idl.name}`)
            return this
        }
        return this.printExtendedAttributes(idl)
            .print(`${idl.isStatic ? "static " : ""}${idl.isAsync ? "async " : ""}` +
                `${this.printSpacedTypeParameters(idl.typeParameters)}` +
                `${this.printReturnType(idl.returnType)} ${idl.name}` +
                `(${this.printParameters(idl.parameters)});`)
    }

    printPackage(idl: IDLFile): this {
        const effectiveClause = idl.packageClause.filter(it => !!it)
        if (!effectiveClause.length) {
            return this
        }
        return this.print(`package ${effectiveClause.join(".")};`)
    }

    printImport(idl: IDLImport): this {
        const effectiveClause = idl.clause.filter(it => !!it)
        return this.print(`import ${effectiveClause.join(".") || "NULL_IMPORT"}${idl.name ? " as " : ""}${idl.name};`)
    }

    printNamespace(idl: IDLNamespace): this {
        this.printExtendedAttributes(idl)
            .print(`namespace ${idl.name} {`)
            .pushIndent()
        idl.members.forEach(member => this.printIDL(member))
        return this.popIndent().print("};")
    }

    printCallback(idl: IDLCallback): this {
        return this.printExtendedAttributes(idl)
            .print(`callback ${this.printSpacedTypeParameters(idl.typeParameters)}${idl.name} = ` +
                `${this.printReturnType(idl.returnType)} (${this.printParameters(idl.parameters)});`)
    }

    printScoped(idl: IDLEntry): this {
        if (idl.kind == IDLKind.Callback) return this.printCallback(idl as IDLCallback)
        if (idl.kind === IDLKind.Interface) return this.printInterface(idl as IDLInterface)
        throw new Error(`Unexpected scoped: ${idl.kind} ${idl.name}`)
    }

    printInterfaceInherit(idl: IDLInterface): string {
        if (idl.inheritance.length === 0) {
            return ""
        }
        const types = idl.inheritance.map(type => printType(type))
        return ": " + types.join(', ')
    }

    printInterfaceHead(decl: IDLInterface): this {
        return this.print('interface ' +
            this.printSpacedTypeParameters(decl.typeParameters) +
            `${decl.name}${this.printInterfaceInherit(decl)} {`)
    }

    printInterface(idl: IDLInterface): this {
        this.printExtendedAttributes(idl)
            .printInterfaceHead(idl)
            .pushIndent()
        idl.constructors.forEach(it => this.printConstructor(it))
        idl.constants.forEach(it => this.printConstant(it))
        idl.properties.forEach(it => this.printProperty(it))
        idl.methods.forEach(it => this.printMethod(it))
        idl.callables.forEach(it => this.printFunction(it))
        return this.popIndent().print("};")
    }

    getInitializerValue(type: string, initializer: number | string, decimalType: number | undefined): string {
        if (type == IDLStringType.name) return `"${String(initializer).replaceAll('"', "'")}"`
        if (decimalType == undefined) throw new Error(`Expected defined enum initializer decimal type for value: ${initializer}`)
        switch (decimalType) {
            case 2: return `0b${initializer.toString(2)}`
            case 16: return `0x${initializer.toString(16).toUpperCase()}`
            default: return `${initializer}`
        }
    }

    printEnumMember(idl: IDLEnumMember): this {
        const type = printType(idl.type)
        const initializer = idl.initializer === undefined
            ? ''
            : ` = ${this.getInitializerValue(type, idl.initializer, idl.initializerDecimalType)}`

        return this.print(idl.documentation)
            .printExtendedAttributes(idl)
            .print(`${type} ${idl.name}${initializer};`)
    }

    printEnum(idl: IDLEnum, skipInitializers: boolean): this {
        this.print(idl.documentation)
            .printExtendedAttributes(idl)
        if (skipInitializers) {
            this.print(`enum ${idl.name!} {`)
                .pushIndent()
            idl.elements.forEach(it =>
                this.print(`${it.name} ${(it.initializer !== undefined ? " /* " + it.initializer + " */" : "")}`))
            return this.popIndent().print("};")
        } else {
            this.print(`dictionary ${idl.name!} {`)
                .pushIndent()
            idl.elements.forEach(it => this.printEnumMember(it))
            return this.popIndent().print("};")
        }
    }

    printTypedef(idl: IDLTypedef): this {
        return this.print(idl.documentation)
            .printExtendedAttributes(idl)
            .print(`typedef ${this.printSpacedTypeParameters(idl.typeParameters)}${idl.name} = ` +
                `${printType(idl.type)};`)
    }

    printIDL(idl: IDLNode, options?: Partial<IDLPrintOptions>): this {
        if (idl.kind == IDLKind.Interface) return this.printInterface(idl as IDLInterface)
        if (idl.kind == IDLKind.Enum) return this.printEnum(idl as IDLEnum, options?.disableEnumInitializers ?? false)
        if (idl.kind == IDLKind.Typedef) return this.printTypedef(idl as IDLTypedef)
        if (idl.kind == IDLKind.Callback) return this.printCallback(idl as IDLCallback)
        if (idl.kind == IDLKind.Import) return this.printImport(idl as IDLImport)
        if (idl.kind == IDLKind.Namespace) return this.printNamespace(idl as IDLNamespace)
        if (idl.kind == IDLKind.Method) return this.printMethod(idl as IDLMethod)
        if (idl.kind == IDLKind.Const) return this.printConstant(idl as IDLConstant)
        if (idl.kind == IDLKind.Property) return this.printProperty(idl as IDLProperty)

        if (options?.allowUnknownKinds) {
            return this.print(`${IDLKind[idl.kind]} ${"name" in idl ? (idl as any).name : ""}`)
        } else {
            throw new Error(`unexpected kind: ${idl.kind}`)
        }
    }
}

export interface IDLPrintOptions {
    verifyIdl: boolean
    disableEnumInitializers: boolean
    allowUnknownKinds: boolean
    oneLine: boolean
}

export function toIDLString(node: IDLNode, options: Partial<IDLPrintOptions>): string {
    const writer = new IDLWriter(new IndentedPrinter())

    if (isFile(node)) {
        writer.printPackage(node)
        node.entries.forEach(it => writer.printIDL(it, options))
    } else {
        writer.printIDL(node, options)
    }

    return writer.getOutput().join(options.oneLine ? " " : "\n")
}

export const DebugUtils = {
    debugPrintType: (type: IDLType): string => {
        const filename = type.fileName ? `, fileName: '${type.fileName}'` : ""
        if (isContainerType(type)) {
            return `[IDLType, name: '${printType(type)}', kind: '${IDLKind[type.kind]}', elements: [${type.elementType.map(DebugUtils.debugPrintType).join(', ')}]${filename}]`
        }
        return `[IDLType, name: '${printType(type)}', kind: '${IDLKind[type.kind]}'${filename}]`
    },
}
