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
import { indentedBy, nameOrNullFromIdl, stringOrNone } from "../util"
import { IDLCallback, IDLConstructor, IDLEntity, IDLEntry, IDLEnum, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLType, IDLTypedef, getExtAttribute,
    getVerbatimDts,
    hasExtAttribute,
    isCallback,
    isClass, isConstructor, isContainerType, isEnum, isEnumType, isInterface, isMethod, isModuleType, isPrimitiveType, isProperty, isReferenceType, isSyntheticEntry, isTypeParameterType, isTypedef, isUnionType, IDLExtendedAttributes, 
    IDLAccessorAttribute} from "../idl"
import * as webidl2 from "webidl2"
import { resolveSyntheticType, toIDLNode } from "./deserialize"


export class CustomPrintVisitor  {
    output: string[] = []
    currentInterface?: IDLInterface

    visit(node: IDLEntry) {
        if (isSyntheticEntry(node)) {
            if (isEnum(node) && node.name === "Metadata")
                this.printMetadata(node)
            else return
        } else if (isInterface(node) || isClass(node)) {
            this.printInterface(node)
        } else if (isMethod(node) || isConstructor(node)) {
            this.printMethod(node)
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
            this.print(imports.slice(1, -1))

        const exports = node.elements
            .find(it => it.name === "exports")
            ?.initializer as string
        if (exports)
            this.print(exports.slice(1, -1))
    }

    printInterface(node: IDLInterface) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.slice(1, -1).split(",").reverse()
        this.openNamespace(namespace)
        let typeSpec = toTypeName(node, IDLExtendedAttributes.TypeParameters)
        const entity = getExtAttribute(node, IDLExtendedAttributes.Entity)
        if (entity === IDLEntity.Literal) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${literal(node, false, true)}`)
        } else if (entity === IDLEntity.Tuple) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${literal(node, true, false)}`)
        } else if (entity === IDLEntity.NamedTuple) {
            this.print(`${namespace ? "" : "declare "}type ${typeSpec} = ${literal(node, true, true)}`)
        } else {
            // restore globalScope
            if (hasExtAttribute(node,IDLExtendedAttributes.GlobalScope)) {
                node.methods.map(it => this.printMethod(it, true))
                return
            }
            const component = getExtAttribute(node, IDLExtendedAttributes.Component)
            if (node.inheritance[0]) {
                const typeParams = component ? `<${component}Attribute>` : ""
                typeSpec += ` extends ${node.inheritance[0].name}${typeParams}`
            }
            const interfaces = getExtAttribute(node, IDLExtendedAttributes.Interfaces)
            if (interfaces) {
                typeSpec += ` implements ${interfaces}`
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
            if (component) {
                this.print(`${namespace ? "" : "declare "}const ${component}Instance: ${component}Attribute;`)
                this.print(`${namespace ? "" : "declare "}const ${component}: ${component}Interface;`)
            }
        }
        this.closeNamespace(namespace)
    }

    printMethod(node: IDLMethod|IDLConstructor, isGlobal : boolean = false) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.slice(1, -1).split(",").reverse()
        this.openNamespace(namespace)
        let returnType = node.returnType ? `: ${printTypeForTS(node.returnType, true)}` : ""
        let isStatic = isMethod(node) && node.isStatic
        let name = isConstructor(node) ? "constructor" : getName(node)
        let isOptional = isMethod(node) && node.isOptional
        let isProtected = hasExtAttribute(node, IDLExtendedAttributes.Protected)
        if (hasExtAttribute(node, IDLExtendedAttributes.CallSignature)) name = ""
        // if (hasExtAttribute(node,"DtsName")) {
        //     let dtsName = getExtAttribute(node, "DtsName")
        //     name = dtsName ? dtsName.replaceAll("\"","") : ""
        // }
        const typeParamsAttr = getExtAttribute(node, IDLExtendedAttributes.TypeParameters)
        const typeParams = typeParamsAttr ? `<${typeParamsAttr}>` : ""
        let isExport = hasExtAttribute(node, IDLExtendedAttributes.Export)
        this.print(`${isGlobal ? `${isExport ? "export ": ""}${namespace ? "" : "declare "}function `: ""}${isProtected ? "protected " : ""}${isStatic ? "static " : ""}${name}${isOptional ?"?":""}${typeParams}(${node.parameters.map(p => this.paramText(p)).join(", ")})${returnType};`)
        this.closeNamespace(namespace)
    }
    paramText(param: IDLParameter): string {
        return `${param.isVariadic ? "..." : ""}${getName(param)}${param.isOptional ? "?" : ""}: ${printTypeForTS(param.type)}`
    }
    printProperty(node: IDLProperty) {
        const isCommonMethod = hasExtAttribute(node, IDLExtendedAttributes.CommonMethod)
        let isProtected = hasExtAttribute(node, IDLExtendedAttributes.Protected)
        if (isCommonMethod) {
            let returnType = this.currentInterface!.name == "CommonMethod" ? "T" : this.currentInterface!.name
            this.print(`${getName(node)}(value: ${printTypeForTS(node.type, undefined, undefined, isCommonMethod)}): ${returnType};`)
        } else if (hasExtAttribute(node, IDLExtendedAttributes.Accessor)) {
            const accessorName = getExtAttribute(node, IDLExtendedAttributes.Accessor)
            if (accessorName == IDLAccessorAttribute.Getter) {
                this.print(`get ${getName(node)}(): ${printTypeForTS(node.type)};`)
            } else if (accessorName == IDLAccessorAttribute.Setter) {
                this.print(`set ${getName(node)}(value: ${printTypeForTS(node.type)});`)
            }
        } else {
            this.print(`${isProtected ? "protected " : ""}${node.isStatic ? "static " : ""}${node.isReadonly ? "readonly " : ""}${getName(node)}${node.isOptional ? "?" : ""}: ${printTypeForTS(node.type)};`)

        }
    }
    printEnum(node: IDLEnum) {
        const namespace = getExtAttribute(node, IDLExtendedAttributes.Namespace)?.slice(1, -1).split(",").reverse()
        this.openNamespace(namespace)
        let isExport = hasExtAttribute(node, IDLExtendedAttributes.Export)
        this.print(`${isExport ? "export ": ""}${namespace ? "" : "declare "}enum ${node.name} {`)
        this.pushIndent()
        node.elements.forEach((it, index) => {
            this.print(`${getName(it)}${it.initializer ? " = " + it.initializer : ""}${index < node.elements.length - 1 ? "," : ""}`)
        })
        this.popIndent()
        this.print("}")
        this.closeNamespace(namespace)
    }
    printTypedef(node: IDLTypedef | IDLCallback) {
        let text = ""
        if (isCallback(node)) {
            text = callbackType(node)
        } else {
            text = getVerbatimDts(node) ?? printTypeForTS(node.type)
        }
        let isExport = hasExtAttribute(node, IDLExtendedAttributes.Export)
        const typeParamsAttr = getExtAttribute(node, IDLExtendedAttributes.TypeParameters)
        const typeParams = typeParamsAttr ? `<${typeParamsAttr}>` : ""
        this.print(`${isExport ? "export ": ""}declare type ${getName(node)}${typeParams} = ${text};`)
    }

    printModuleType(node: IDLModuleType) {
        let text = getVerbatimDts(node) ?? ""
        this.print(`${text}`)
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
}

export function idlToString(name: string, content: string): string {
    let printer = new CustomPrintVisitor()
    webidl2.parse(content)
        .map(it => toIDLNode(name, it))
        .map(it => printer.visit(it))
    return printer.output.join("\n")
}

export function printTypeForTS(type: IDLType | undefined, undefinedToVoid?: boolean, sequenceToArrayInterface: boolean = false, isCommonMethod = false): string {
    if (!type) throw new Error("Missing type")
    if (type.name == "undefined" && undefinedToVoid) return "void"
    if (type.name == "DOMString") return "string"
    if (isCommonMethod && type.name == "this") return "T"
    if (type.name == "void_") return "void"
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type)) {
        if (!sequenceToArrayInterface && type.name == "sequence") 
            return `${type.elementType.map(it => printTypeForTS(it)).join(",")}[]`
        return `${mapContainerType(type.name)}<${type.elementType.map(it => printTypeForTS(it)).join(",")}>`
    }
    if (isReferenceType(type)) return toTypeName(type, IDLExtendedAttributes.TypeArguments)
    if (isUnionType(type)) return `(${type.types.map(it => printTypeForTS(it)).join("|")})`
    if (isEnumType(type)) return type.name
    if (isTypeParameterType(type)) return type.name
    throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
}

function mapContainerType(idlName: string): string {
    switch (idlName) {
        case "sequence": return "Array"
        case "record": return "Map"
        case "Promise": return "Promise"
        default: throw new Error(`Unmapped container type: ${idlName}`)
    }
}

function toTypeName(node: IDLEntry, typeAttribute: IDLExtendedAttributes): string {
    const synthType = resolveSyntheticType(node.name)
    if (synthType) {
        if (isInterface(synthType)) {
            const isTuple = getExtAttribute(synthType, IDLExtendedAttributes.Entity) === IDLEntity.Tuple
            return literal(synthType, isTuple, !isTuple)
        }
        if (isCallback(synthType)) {
            return callbackType(synthType)
        }
    }
    const importAttr = getExtAttribute(node, IDLExtendedAttributes.Import)
    if (importAttr) {
        return importAttr
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

function callbackType(node: IDLCallback): string {
    return `((${node.parameters.map(it => `${it.isVariadic ? "..." : ""}${getName(it)}: ${printTypeForTS(it.type)}`).join(", ")}) => ${printTypeForTS(node.returnType)})`
}

function literal(node: IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
    return `${
            isTuple ? "[" : "{"
        } ${
            node.properties.map(it => {
                const questionMark = it.isOptional ? "?" : ""
                const type = printTypeForTS(it.type)
                return includeFieldNames ? `${getName(it)}${questionMark}: ${type}` : `${type}${questionMark}`
            }).join(", ")
        } ${
            isTuple ? "]" : "}"
        }`
}

function getName(node: IDLEntry): stringOrNone {
    return getExtAttribute(node, IDLExtendedAttributes.DtsName) ?? nameOrNullFromIdl(node.name)
}
