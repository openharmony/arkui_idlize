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
    isClass, isConstructor, isContainerType, isEnum, isEnumType, isInterface, isMethod, isModuleType, isPrimitiveType, isProperty, isReferenceType, isSyntheticEntry, isTypeParameterType, isTypedef, isUnionType } from "../idl"
import * as webidl2 from "webidl2"
import { resolveSyntheticType, toIDLNode } from "./deserialize"


export class CustomPrintVisitor  {
    output: string[] = []

    visit(node: IDLEntry) {
        if (isSyntheticEntry(node)) return
        if (isInterface(node) || isClass(node)) {
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
            this.printCallbackDeclaration(node)
        } else if (isModuleType(node)) {
            this.printModuleType(node)
        } else {
            throw new Error(`Unexpected node kind: ${IDLKind[node.kind!]}`)
        }
    }

    currentInterface?: IDLInterface

    printInterface(node: IDLInterface) {
        const namespace = getExtAttribute(node, "Namespace")
        this.openNamespace(namespace)
        let typeSpec = toTypeName(node, "TypeParameters")
        const entity = getExtAttribute(node, "Entity")
        if (entity === IDLEntity.Literal) {
            this.print(`declare type ${typeSpec} = ${literal(node, false, true)}`)
        } else if (entity === IDLEntity.Tuple) {
            this.print(`declare type ${typeSpec} = ${literal(node, true, false)}`)
        } else if (entity === IDLEntity.NamedTuple) {
            this.print(`declare type ${typeSpec} = ${literal(node, true, true)}`)
        } else {
            // restore globalScope
            if (hasExtAttribute(node,"GlobalScope")) {
                node.methods.map(it => this.printMethod(it, true))
                return
            }
            const component = getExtAttribute(node, "Component")
            if (node.inheritance[0]) {
                const typeParams = component ? `<${component}Attribute>` : ""
                typeSpec += ` extends ${node.inheritance[0].name}${typeParams}`
            }
            const interfaces = getExtAttribute(node, "Interfaces")
            if (interfaces) {
                typeSpec += ` implements ${interfaces}`
            }
            this.print(`declare ${entity!.toLowerCase()} ${typeSpec} {`)
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
                this.print(`declare const ${component}Instance: ${component}Attribute;`)
                this.print(`declare const ${component}: ${component}Interface;`)
            }
        }
        this.closeNamespace(namespace)
    }

    printMethod(node: IDLMethod|IDLConstructor, isGlobal : boolean = false) {
        let returnType = node.returnType ? `: ${printTypeForTS(node.returnType, true)}` : ""
        let isStatic = isMethod(node) && node.isStatic
        let name = isConstructor(node) ? "constructor" : getName(node)
        let isOptional = isMethod(node) && node.isOptional
        if (hasExtAttribute(node, "CallSignature")) name = ""
        // if (hasExtAttribute(node,"DtsName")) {
        //     let dtsName = getExtAttribute(node, "DtsName")
        //     name = dtsName ? dtsName.replaceAll("\"","") : ""
        // }
        const typeParamsAttr = getExtAttribute(node, "TypeParameters")
        const typeParams = typeParamsAttr ? `<${typeParamsAttr}>` : ""
        this.print(`${isGlobal ? "declare function ": ""}${isStatic ? "static " : ""}${name}${isOptional ?"?":""}${typeParams}(${node.parameters.map(p => this.paramText(p)).join(", ")})${returnType};`)
    }
    paramText(param: IDLParameter): string {
        return `${param.isVariadic ? "..." : ""}${param.name}${param.isOptional ? "?" : ""}: ${printTypeForTS(param.type)}`
    }
    printProperty(node: IDLProperty) {
        const isCommonMethod = hasExtAttribute(node, "CommonMethod")
        if (isCommonMethod) {
            let returnType = this.currentInterface!.name == "CommonMethod" ? "T" : this.currentInterface!.name
            this.print(`${getName(node)}(value: ${printTypeForTS(node.type)}): ${returnType};`)
        } else {
            this.print(`${node.isStatic ? "static " : ""}${node.isReadonly ? "readonly " : ""}${getName(node)}${node.isOptional ? "?" : ""}: ${printTypeForTS(node.type)};`)

        }
    }
    printEnum(node: IDLEnum) {
        const namespace = getExtAttribute(node, "Namespace")
        this.openNamespace(namespace)
        this.print(`declare enum ${node.name} {`)
        this.pushIndent()
        node.elements.forEach((it, index) => {
            this.print(`${getName(it)}${it.initializer ? " = " + it.initializer : ""}${index < node.elements.length - 1 ? "," : ""}`)
        })
        this.popIndent()
        this.print("}")
        this.closeNamespace(namespace)
    }
    printCallbackDeclaration(node: IDLCallback) {
        // TODO: is it correct.
        this.print(`declare type ${getName(node)} = ${callbackType(node)};`)
    }
    printTypedef(node: IDLTypedef) {
        let text = getVerbatimDts(node) ?? printTypeForTS(node.type)
        this.print(`declare type ${(node.name)} = ${text};`)
    }

    printModuleType(node: IDLModuleType) {
        let text = getVerbatimDts(node) ?? ""
        this.print(`${text}`)
    }

    openNamespace(name: string | undefined) {
        if (name) {
            this.print(`declare namespace ${name} {`)
            this.pushIndent()
        }
    }
    closeNamespace(name: string | undefined) {
        if (name) {
            this.popIndent()
            this.print("}")
        }
    }

    checkVerbatim(node: IDLEntry) {
        let verbatim = getExtAttribute(node, "VerbatimDts")
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

export function printTypeForTS(type: IDLType | undefined, undefinedToVoid?: boolean): string {
    if (!type) throw new Error("Missing type")
    if (type.name == "undefined" && undefinedToVoid) return "void"
    if (type.name == "int32" || type.name == "float32") return "number"
    if (type.name == "DOMString") return "string"
    if (type.name == "this") return "T"
    if (type.name == "void_") return "void"
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type))
        return `${mapContainerType(type.name)}<${type.elementType.map(it => printTypeForTS(it)).join(",")}>`
    if (isReferenceType(type)) return toTypeName(type, "TypeArguments")
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

function toTypeName(node: IDLEntry, typeAttribute: string): string {
    const synthType = resolveSyntheticType(node.name)
    if (synthType) {
        if (isInterface(synthType)) {
            const isTuple = getExtAttribute(synthType, "Entity") === IDLEntity.Tuple
            return literal(synthType, isTuple, !isTuple)
        }
        if (isCallback(synthType)) {
            return callbackType(synthType)
        }
    }
    const importAttr = getExtAttribute(node, "Import")
    if (importAttr) {
        return importAttr
    }
    let typeSpec = node.name ?? "MISSING_TYPE_NAME"
    const qualifier = getExtAttribute(node, "Qualifier")
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
    return getExtAttribute(node, "DtsName") ?? nameOrNullFromIdl(node.name)
}
