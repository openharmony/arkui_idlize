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
import { indentedBy, stringOrNone } from "../util"
import { IDLCallback, IDLConstructor, IDLEntry, IDLEnum, IDLInterface, IDLKind, IDLMethod, IDLModuleType, IDLParameter, IDLProperty, IDLType, IDLTypedef, getExtAttribute,
    getVerbatimDts,
    hasExtAttribute,
    isCallback,
    isClass, isConstructor, isContainerType, isEnum, isEnumType, isInterface, isMethod, isModuleType, isPrimitiveType, isProperty, isReferenceType, isTypeParameterType, isTypedef, isUnionType } from "../idl"
import * as webidl2 from "webidl2"
import { toIDLNode } from "./deserialize"


export class CustomPrintVisitor  {
    output: string[] = []

    visit(node: IDLEntry) {
        if (isInterface(node) || isClass(node)) {
            this.printClass(node)
        } else if (isMethod(node) || isConstructor(node)) {
            this.printMethod(node)
        } else if (isProperty(node)) {
            this.printProperty(node)
        } else if (isTypedef(node)) {
            this.printTypedef(node)
        } else if (isEnum(node)) {
            this.printEnum(node)
        } else if (isCallback(node)) {
            this.printCallback(node)
        } else if (isModuleType(node)) {
            this.printModuleType(node)
        } else {
            throw new Error(`Unexpected node kind: ${IDLKind[node.kind!]}`)
        }
    }

    computeDeclaration(node: IDLInterface): string {
        let keyword = hasExtAttribute(node, "Class") ? "class" : "interface"
        let typeOrExtends = ""
        if (hasExtAttribute(node, "Component")) {
            if (node.name == "CommonMethod")
                typeOrExtends = "<T>"
            else
                typeOrExtends = ` extends CommonMethod<${getExtAttribute(node, "Component")}Attribute>`
        }
        if (hasExtAttribute(node, "Parametrized")) {
            typeOrExtends = `<${getExtAttribute(node, "Parametrized")}>`
        }
        return `${keyword} ${node.name}${typeOrExtends}`
    }

    currentInterface?: IDLInterface

    printClass(node: IDLInterface) {
        // restore globalScope 
        if (hasExtAttribute(node,"GlobalScope")) {
            node.methods.map(it => this.printMethod(it, true))
            return
        }
        this.print(`declare ${this.computeDeclaration(node)} {`)
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
        if (hasExtAttribute(node, "Component")) {
            let name = getExtAttribute(node, "Component")
            this.print(`declare const ${name}Instance: ${name}Attribute;`)
            this.print(`declare const ${name}: ${name}Interface;`)
        }
    }

    printMethod(node: IDLMethod|IDLConstructor, isGlobal : boolean = false) {
        let returnType = node.returnType ? `: ${printTypeForTS(node.returnType, true)}` : ""
        let isStatic = isMethod(node) && node.isStatic
        let name = isConstructor(node) ? "constructor" : node.name
        let isOptional = isMethod(node) && node.isOptional
        if (hasExtAttribute(node, "CallSignature")) name = ""
        if (hasExtAttribute(node,"DtsName")) {
            let dtsName = getExtAttribute(node, "DtsName")
            name = dtsName ? dtsName.replaceAll("\"","") : ""
        }
        this.print(`${isGlobal ? "declare function ": ""}${isStatic ? "static " : ""}${name}${isOptional ?"?":""}(${node.parameters.map(p => this.paramText(p)).join(", ")})${returnType};`)
    }
    paramText(param: IDLParameter): string {
        return `${param.isVariadic ? "..." : ""}${param.name}${param.isOptional ? "?" : ""}: ${printTypeForTS(param.type)}`
    }
    printProperty(node: IDLProperty) {
        const isCommonMethod = hasExtAttribute(node, "CommonMethod")
        if (isCommonMethod) {
            let returnType = this.currentInterface!.name == "CommonMethod" ? "T" : this.currentInterface!.name
            this.print(`${node.name}(value: ${printTypeForTS(node.type)}): ${returnType};`)
        } else {
            this.print(`${node.isStatic ? "static " : ""}${node.isReadonly ? "readonly " : ""}${node.name}${node.isOptional ? "?" : ""}: ${printTypeForTS(node.type)};`)

        }
    }
    printEnum(node: IDLEnum) {
        this.print(`declare enum ${node.name} {`)
        this.pushIndent()
        node.elements.forEach((it, index) => {
            this.print(`${it.name}${it.initializer ? " = " + it.initializer : ""}${index < node.elements.length - 1 ? "," : ""}`)
        })
        this.popIndent()
        this.print("}")
    }
    printCallback(node: IDLCallback) {
        // TODO: is it correct.
        this.print(`declare type ${(node.name)} = (${node.parameters.map(it => `${it.isVariadic ? "..." : ""}${it.name}: ${printTypeForTS(it.type)}`).join(", ")}) => ${printTypeForTS(node.returnType)};`)
    }
    printTypedef(node: IDLTypedef) {
        let text = getVerbatimDts(node) ?? printTypeForTS(node.type)
        this.print(`declare type ${(node.name)} = ${text};`)
    }

    printModuleType(node: IDLModuleType) {
        let text = getVerbatimDts(node) ?? ""
        this.print(`${text}`)
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
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type))
        return `${mapContainerType(type.name)}<${type.elementType.map(it => printTypeForTS(it)).join("\n")}>`
    if (isReferenceType(type)) return `${type.name}`
    if (isUnionType(type)) return `(${type.types.map(it => printTypeForTS(it, undefinedToVoid)).join("|")})`
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