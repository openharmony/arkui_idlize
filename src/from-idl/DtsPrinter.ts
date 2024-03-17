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
import { IDLCallback, IDLConstructor, IDLEntry, IDLEnum, IDLInterface, IDLKind, IDLMethod, IDLParameter, IDLProperty, IDLType, IDLTypedef, getExtAttribute,
    hasExtAttribute,
    isCallback,
    isClass, isConstructor, isContainerType, isEnum, isEnumType, isInterface, isMethod, isPrimitiveType, isProperty, isReferenceType, isTypeParameterType, isTypedef, isUnionType } from "../idl"
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
        } else {
            throw new Error(`Unexpected node kind: ${IDLKind[node.kind!]}`)
        }
    }

    printClass(node: IDLInterface) {
        let keyword = hasExtAttribute(node, "Class") ? "declare class" : "interface"
        this.print(`${keyword} ${node.name} {`)
        this.pushIndent()
        node.constructors.map(it => this.visit(it))
        node.properties.map(it => this.visit(it))
        node.methods.map(it => this.visit(it))
        node.callables.map(it => this.visit(it))
        this.popIndent()
        this.print("}")
        if (hasExtAttribute(node, "Component")) {
            let name = getExtAttribute(node, "Component")
            this.print(`declare const ${name}Instance: ${name}Attribute;`)
            this.print(`declare const ${name}: ${name}Interface;`)
        }
    }

    printMethod(node: IDLMethod|IDLConstructor) {
        let returnType = node.returnType ? `: ${printTypeForTS(node.returnType, true)}` : ""
        let isStatic = isMethod(node) && node.isStatic
        let name = isConstructor(node) ? "constructor" : node.name
        if (hasExtAttribute(node, "CallSignature")) name = ""
        this.print(`${isStatic ? "static " : ""}${name}(${node.parameters.map(p => this.paramText(p)).join(", ")})${returnType};`)
    }
    paramText(param: IDLParameter): string {
        return `${param.name}${param.isOptional ? "?" : ""}: ${printTypeForTS(param.type)}`
    }
    printProperty(node: IDLProperty) {
        this.print(`${node.isStatic ? "static " : ""}${node.isReadonly ? "readonly " : ""}${node.name}${node.isOptional ? "?" : ""}: ${printTypeForTS(node.type)};`)
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
        this.print(`type ${(node.name)} = (${node.parameters.map(it => printTypeForTS(it.type)).join(", ")}) => ${printTypeForTS(node.returnType)}`)
    }
    printTypedef(node: IDLTypedef) {
        this.print(`type ${(node.name)} = ${printTypeForTS(node.type)}`)
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
    let nodes = webidl2.parse(content)
        .map(it => toIDLNode(name, it))
        .map(it => printer.visit(it))
    return printer.output.join("\n")
}

export function printTypeForTS(type: IDLType | undefined, undefinedToVoid?: boolean): string {
    if (!type) throw new Error("Missing type")
    if (type.name == "undefined" && undefinedToVoid) return "void"
    if (type.name == "int32" || type.name == "float32") return "number"
    if (isPrimitiveType(type)) return type.name
    if (isContainerType(type)) return `Array<${printTypeForTS(type.elementType)}>`
    if (isReferenceType(type)) return `${type.name}`
    if (isUnionType(type)) return `(${type.types.map(it => printTypeForTS(it, undefinedToVoid)).join("|")})`
    if (isEnumType(type)) return type.name
    if (isTypeParameterType(type)) return type.name
    throw new Error(`Cannot map type: ${IDLKind[type.kind]}`)
}

