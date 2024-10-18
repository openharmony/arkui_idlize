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
import { indentedBy, stringOrNone, zip } from "../util"
import { IDLCallback, IDLConstructor, IDLEntity, IDLEntry, IDLEnum, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLType, IDLTypedef, getExtAttribute,
    getVerbatimDts,
    hasExtAttribute,
    isCallback,
    isClass, isConstructor, isContainerType, isEnum, isEnumType, isInterface, isMethod, isModuleType, isPrimitiveType, isProperty, isReferenceType, isSyntheticEntry, isTypeParameterType, isTypedef, isUnionType,
    isPackage, isImport,
    IDLExtendedAttributes,
    IDLAccessorAttribute,
    IDLImport,
    IDLPackage,
    IDLVoidType,
    IDLStringType,
    IDLUndefinedType,
    IDLNullType,
    isCallable,
    isAnonymousInterface,
    isTupleInterface,
    getSuperType,
    IDLReferenceType,
    IDLCallable,
    IDLAnyType,} from "../idl"
import * as webidl2 from "webidl2"
import { resolveSyntheticType, toIDLNode } from "./deserialize"

export class CustomPrintVisitor {
    constructor(private syntheticTypeResolver: (type: IDLReferenceType) => IDLEntry | undefined) {}
    output: string[] = []
    currentInterface?: IDLInterface

    visit(node: IDLEntry) {
        if (isSyntheticEntry(node)) {
            return
        } else if (isInterface(node) || isAnonymousInterface(node) || isTupleInterface(node) || isClass(node)) {
            this.printInterface(node)
        } else if (isMethod(node) || isConstructor(node) || isCallable(node)) {
            this.printMethod(node)
        } else if (isPackage(node)) {
            this.printPackage(node)
        } else if (isImport(node)) {
            this.printImport(node)
        } else if (isProperty(node)) {
            this.printProperty(node)
        } else if (isTypedef(node)) {
            this.printTypedef(node)
        } else if (isEnum(node)) {
            this.printEnum(node)
        } else if (isCallback(node)) {
            this.printTypedef(node)
        } else if (isModuleType(node)) {
            this.printModuleType(node)
        } else {
            throw new Error(`Unexpected node kind: ${IDLKind[node.kind!]}`)
        }
    }

    printMetadata(node: IDLEnum) {
        const imports = node.elements
            .find(it => it.name === "imports")
            ?.initializer as string
        if (imports)
            this.print(imports)

        const exports = node.elements
            .find(it => it.name === "exports")
            ?.initializer as string
        if (exports)
            this.print(exports)
    }

    printInterface(node: IDLInterface) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.split(",").reverse()
        this.openNamespace(namespace)
        let typeSpec = this.toTypeName(node, IDLExtendedAttributes.TypeParameters)

        // Workaround for an SDK declaration clash between `WrappedBuilder` and `ContentModifier`
        if (node.name === "WrappedBuilder")
            typeSpec = "WrappedBuilder<Args extends any[]>"

        const entity = getExtAttribute(node, IDLExtendedAttributes.Entity)
        if (entity === IDLEntity.Literal) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${this.literal(node, false, true)}`)
        } else if (entity === IDLEntity.Tuple) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${this.literal(node, true, false)}`)
        } else if (entity === IDLEntity.NamedTuple) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${this.literal(node, true, true)}`)
        } else {
            // restore globalScope
            if (hasExtAttribute(node,IDLExtendedAttributes.GlobalScope)) {
                node.methods.map(it => this.printMethod(it, true))
                return
            }
            let interfaces = node.inheritance
            let keyword = "extends"
            let parentTypeArgs = getExtAttribute(node, IDLExtendedAttributes.ParentTypeArguments)?.split(",")
            if (isClass(node)) {
                const superType = getSuperType(node)
                const superTypeArg = parentTypeArgs?.shift()
                if (superType) {
                    const typeArgs = superTypeArg ? `<${superTypeArg}>` : ""
                    typeSpec += ` extends ${superType.name}${typeArgs}`
                }
                interfaces = interfaces.slice(1)
                keyword = "implements"
            }
            if (interfaces.length > 0) {
                const interfaceList = zip(interfaces, parentTypeArgs ?? new Array(interfaces.length))
                    .map(([iface, typeArg]) => iface.name + (typeArg ? `<${typeArg}>` : ""))
                    .join(", ")
                typeSpec += ` ${keyword} ${interfaceList}`
            }
            let isExport = hasExtAttribute(node, IDLExtendedAttributes.Export)
            this.print(`${isExport ? "export ": ""}${namespace ? "" : "declare "}${entity!.toLowerCase()} ${typeSpec} {`)
            this.currentInterface = node
            this.pushIndent()
            node.constructors.map(it => this.visit(it))
            node.properties.map(it => this.visit(it))
            node.methods.map(it => this.visit(it))
            node.callables.map(it => this.visit(it))
            let verbatim = getVerbatimDts(node)
            if (verbatim) {
                verbatim
                    .split("\n")
                    .map(it => this.print(it))
            }

            this.popIndent()
            this.print("}")
        }
        this.closeNamespace(namespace)
    }

    printMethod(node: IDLMethod | IDLConstructor | IDLCallable, isGlobal: boolean = false) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.split(",").reverse()
        this.openNamespace(namespace)
        const returnType = node.returnType && !(isConstructor(node) && isClass(this.currentInterface!))
            ? `: ${this.printTypeForTS(node.returnType, true)}` : ""
        const name = isConstructor(node)
            ? isClass(this.currentInterface!) ? "constructor" : "new"
            : getName(node)
        const typeParamsAttr = getExtAttribute(node, IDLExtendedAttributes.TypeParameters)
        const typeParams = typeParamsAttr ? `<${typeParamsAttr}>` : ""
        let preamble = ""
        if (!isCallable(node)) {
            const isExport = hasExtAttribute(node, IDLExtendedAttributes.Export)
            const isStatic = isMethod(node) && node.isStatic
            const isProtected = hasExtAttribute(node, IDLExtendedAttributes.Protected)
            const isOptional = isMethod(node) && node.isOptional
            preamble = `${isGlobal ? `${isExport ? "export ": ""}${namespace ? "" : "declare "}function `: ""}${isProtected ? "protected " : ""}${isStatic ? "static " : ""}${name}${isOptional ?"?":""}`
        }
        this.print(`${preamble}${typeParams}(${node.parameters.map(p => this.paramText(p)).join(", ")})${returnType};`)
        this.closeNamespace(namespace)
    }
    paramText(param: IDLParameter): string {
        return `${param.isVariadic ? "..." : ""}${getName(param)}${param.isOptional ? "?" : ""}: ${this.printTypeForTS(param.type)}`
    }
    printProperty(node: IDLProperty) {
        const isCommonMethod = hasExtAttribute(node, IDLExtendedAttributes.CommonMethod)
        let isProtected = hasExtAttribute(node, IDLExtendedAttributes.Protected)
        if (isCommonMethod) {
            const returnType = getExtAttribute(this.currentInterface!, IDLExtendedAttributes.TypeParameters) ?? this.currentInterface!.name
            this.print(`${getName(node)}(value: ${this.printTypeForTS(node.type, undefined, undefined, isCommonMethod)}): ${returnType};`)
        } else if (hasExtAttribute(node, IDLExtendedAttributes.Accessor)) {
            const accessorName = getExtAttribute(node, IDLExtendedAttributes.Accessor)
            if (accessorName == IDLAccessorAttribute.Getter) {
                this.print(`get ${getName(node)}(): ${this.printTypeForTS(node.type)};`)
            } else if (accessorName == IDLAccessorAttribute.Setter) {
                this.print(`set ${getName(node)}(value: ${this.printTypeForTS(node.type)});`)
            }
        } else {
            this.print(`${isProtected ? "protected " : ""}${node.isStatic ? "static " : ""}${node.isReadonly ? "readonly " : ""}${getName(node)}${node.isOptional ? "?" : ""}: ${this.printTypeForTS(node.type)};`)

        }
    }
    printEnum(node: IDLEnum) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.split(",").reverse()
        this.openNamespace(namespace)
        let isExport = hasExtAttribute(node, IDLExtendedAttributes.Export)
        this.print(`${isExport ? "export ": ""}${namespace ? "" : "declare "}enum ${node.name} {`)
        this.pushIndent()
        node.elements.forEach(it => {
            const initializer = it.initializer
                ? it.type === IDLStringType ? ` = "${it.initializer}"` : ` = ${it.initializer}`
                : undefined
            this.print(`${getName(it)}${initializer ?? ""},`)
        })
        this.popIndent()
        this.print("}")
        this.closeNamespace(namespace)
    }
    printTypedef(node: IDLTypedef | IDLCallback) {
        // Special case: Resource is redefined by us
        if (isTypedef(node) && isReferenceType(node.type) && node.type.name === "ArkResource") {
            this.print("import { ArkResource } from './shared/ArkResource'")
            this.print("\n")
        }
        const text = isCallback(node) ? this.callback(node)
            : hasExtAttribute(node, IDLExtendedAttributes.Import) ? IDLAnyType.name
            : this.printTypeForTS(node.type)
        let isExport = hasExtAttribute(node, IDLExtendedAttributes.Export)
        const typeParamsAttr = getExtAttribute(node, IDLExtendedAttributes.TypeParameters)
        const typeParams = typeParamsAttr ? `<${typeParamsAttr}>` : ""
        this.print(`${isExport ? "export ": ""}declare type ${getName(node)}${typeParams} = ${text};`)
    }

    printModuleType(node: IDLModuleType) {
        let text = getVerbatimDts(node) ?? ""
        this.print(`${text}`)
    }

    printImport(node: IDLImport) {
        this.print(`// import ${node.name}`)
    }

    printPackage(node: IDLPackage) {
        this.print(`// package ${node.name}`)
    }

    openNamespace(names: string[] | undefined) {
        names?.forEach((it, idx) => {
            if (it) {
                if (it.startsWith("Export ") && it.length > "Export ".length) {
                    it = it.split(' ')[1]
                    this.print(`export ${idx ? "" : "declare "}namespace ${it} {`)
                    this.pushIndent()
                } else {
                    this.print(`${idx ? "" : "declare "}namespace ${it} {`)
                    this.pushIndent()
                }
            }
        })
    }
    closeNamespace(names: string[] | undefined) {
        names?.forEach(it => {
            if (it) {
                this.popIndent()
                this.print("}")
            }
        })
    }

    checkVerbatim(node: IDLEntry) {
        let verbatim = getExtAttribute(node, IDLExtendedAttributes.VerbatimDts)
        if (verbatim) {
            verbatim
                .substring(1, verbatim.length - 2)
                .split('\n')
                .forEach(it => this.print(it))
        }
    }

    private indent = 0
    indented(input: string): string {
        return indentedBy(input, this.indent)
    }
    pushIndent() {
        this.indent++
    }
    popIndent() {
        this.indent--
    }
    print(value: stringOrNone) {
        if (value) this.output.push(this.indented(value))
    }

    private printTypeForTS(type: IDLType | undefined, undefinedToVoid?: boolean, sequenceToArrayInterface: boolean = false, isCommonMethod = false): string {
        if (!type) throw new Error("Missing type")
        if (type === IDLUndefinedType && undefinedToVoid) return "void"
        if (type === IDLStringType) return "string"
        if (isCommonMethod && type.name == "this") return "T"
        if (type === IDLNullType) return "null"
        if (type === IDLVoidType) return "void"
        if (isPrimitiveType(type)) return type.name
        if (isContainerType(type)) {
            if (!sequenceToArrayInterface && type.name == "sequence")
                return `${type.elementType.map(it => this.printTypeForTS(it)).join(",")}[]`
            return `${mapContainerType(type.name)}<${type.elementType.map(it => this.printTypeForTS(it)).join(",")}>`
        }
        if (isReferenceType(type)) return this.toTypeName(type, IDLExtendedAttributes.TypeArguments)
        if (isUnionType(type)) return `(${type.types.map(it => this.printTypeForTS(it)).join("|")})`
        if (isEnumType(type)) return type.name
        if (isTypeParameterType(type)) return type.name
        throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
    }

    private toTypeName(node: IDLEntry, typeAttribute: IDLExtendedAttributes): string {
        if (isReferenceType(node)) {
            const synthDecl = this.syntheticTypeResolver(node)
            if (synthDecl) {
                if (isInterface(synthDecl) || isAnonymousInterface(synthDecl) || isTupleInterface(synthDecl)) {
                    const isTuple = getExtAttribute(synthDecl, IDLExtendedAttributes.Entity) === IDLEntity.Tuple
                    return this.literal(synthDecl, isTuple, !isTuple)
                }
                if (isCallback(synthDecl)) {
                    return this.callback(synthDecl)
                }
            }
        }
        if (hasExtAttribute(node, IDLExtendedAttributes.Import)) {
            return IDLAnyType.name
        }
        let typeSpec = node.name ?? "MISSING_TYPE_NAME"
        const qualifier = getExtAttribute(node, IDLExtendedAttributes.Qualifier)
        if (qualifier) {
            typeSpec = `${qualifier}.${typeSpec}`
        }
        const typeParams = getExtAttribute(node, typeAttribute)
        if (typeParams) {
            typeSpec = `${typeSpec}<${typeParams}>`
        }
        return typeSpec
    }

    private callback(node: IDLCallback): string {
        const printParam = (p: IDLParameter) =>
            `${p.isVariadic ? "..." : ""}${getName(p)}${p.isOptional ? "?" : ""}: ${this.printTypeForTS(p.type)}`
        return `((${node.parameters.map(printParam).join(", ")}) => ${this.printTypeForTS(node.returnType)})`
    }

    private literal(node: IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        return `${
                isTuple ? "[" : "{"
            } ${
                node.properties.map(it => {
                    const questionMark = it.isOptional ? "?" : ""
                    const type = this.printTypeForTS(it.type)
                    return includeFieldNames ? `${getName(it)}${questionMark}: ${type}` : `${type}${questionMark}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`
    }
}

export function idlToString(name: string, content: string): string {
    let printer = new CustomPrintVisitor(resolveSyntheticType)
    webidl2.parse(content)
        .map(it => toIDLNode(name, it))
        .map(it => printer.visit(it))
    return printer.output.join("\n")
}

function mapContainerType(idlName: string): string {///belongs to LW?
    switch (idlName) {
        case "sequence": return "Array"
        case "record": return "Map"
        case "Promise": return "Promise"
        default: throw new Error(`Unmapped container type: ${idlName}`)
    }
}

function getName(node: IDLEntry): stringOrNone {
    return getExtAttribute(node, IDLExtendedAttributes.DtsName) ?? node.name
}
