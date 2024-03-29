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

import { IndentedPrinter } from "../IndentedPrinter";
import * as ts from "typescript"
import {
    asString, getDeclarationsByNode, heritageTypes, stringOrNone, getDeclarationByTypeNode,
    getSuperClasses, mapCInteropType, heritageDeclarations
} from "../util";

export class SortingEmitter extends IndentedPrinter {
    currentPrinter?: IndentedPrinter
    emitters = new Map<string, IndentedPrinter>()
    deps = new Map<string, Set<string>>()
    private static generatedStructs = new Set<string>()
    printerStructsForwardC: IndentedPrinter

    constructor(printerStructsForwardC: IndentedPrinter) {
        super()
        this.printerStructsForwardC = printerStructsForwardC
    }

    private fillDeps(typeChecker: ts.TypeChecker, type: ts.TypeNode | undefined, seen: Set<string>) {
        if (!type) return
        if (ts.isTypeReferenceNode(type)) {
            if (seen.has(this.repr(type))) return
            seen.add(this.repr(type))
            let decls = getDeclarationsByNode(typeChecker, type.typeName)
            if (decls.length > 0) {
                let decl = decls[0]
                if (ts.isInterfaceDeclaration(decl)) {
                    decl.members
                        .filter(ts.isPropertySignature)
                        .forEach(it => this.fillDeps(typeChecker, it.type, seen))
                    decl.heritageClauses?.forEach(it => {
                        heritageTypes(typeChecker, it).forEach(it => this.fillDeps(typeChecker, it, seen))
                    })
                }
                if (ts.isClassDeclaration(decl)) {
                    decl.members
                        .filter(ts.isPropertyDeclaration)
                        .forEach(it => this.fillDeps(typeChecker, it.type, seen))
                    decl.heritageClauses?.forEach(it => {
                        heritageTypes(typeChecker, it).forEach(it => this.fillDeps(typeChecker, it, seen))
                    })
                }
                if (ts.isUnionTypeNode(decl)) {
                    decl.types
                        .forEach(it => this.fillDeps(typeChecker, it, seen))
                }
                /*
                if (ts.isTypeLiteralNode(decl)) {
                    decl.members
                        .filter(ts.isPropertyAssignment)
                        .forEach(it => this.fillDeps(typeChecker, i, seen))
                } */
            } else {
                console.log(`no decl for ${asString(type.typeName)}`)
            }
        } else if (ts.isUnionTypeNode(type)) {
            type.types.forEach(it => this.fillDeps(typeChecker, it, seen))
        }
    }

    printStructsCHead(name: string, parent: string) {
        this.printerStructsForwardC.print(`struct ${name};`)
        this.print(`struct ${name}${parent === "" ? "" : " : public " + parent} {`)
        this.pushIndent()
        this.print(`${name}() {}`)
        this.print(`~${name}() {}`)
    }

    printStructsCProperty(modifier: string, type: string, property: string, initializer: string) {
        this.print(`${modifier}: ${type} ${property}${initializer === "" ? "" : " = "}${initializer};`)
    }

    printStructsCMethod(modifier: string, retType: string, methodName: string, params: string, body: string) {
        // TODO: complete the function params and body
        this.print(`${modifier}: ${retType} ${methodName}() {}`)
    }

    printStructsCTail() {
        this.popIndent()
        this.print(`};`)
    }

    printStructs(typeChecker: ts.TypeChecker, declaration: ts.NamedDeclaration | undefined) {
        if (!declaration) return
        if (SortingEmitter.generatedStructs.has(asString(declaration.name))) return
        const ancestors = getSuperClasses(typeChecker, declaration).map(it => it).join(", ")
        this.printStructsCHead(asString(declaration.name), ancestors)
        if (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) {
            for (const item of declaration.members) {
                if (ts.isPropertyDeclaration(item) || ts.isPropertySignature(item)) {
                    const modifier = item.modifiers ? asString(item.modifiers[0]) : "public"
                    const property = asString(item.name)
                    const type = mapCInteropType(item.type!)
                    const initializer = item.initializer ? asString(item.initializer) : ""
                    this.printStructsCProperty(modifier, type, property, initializer)
                    continue
                }
                if (ts.isMethodDeclaration(item) || ts.isMethodSignature(item)) {
                    const modifier = item.modifiers ? asString(item.modifiers[0]) : "public"
                    const methodName = asString(item.name)
                    const type = mapCInteropType(item.type!)
                    this.printStructsCMethod(modifier, type, methodName, "", "")
                    continue
                }
            }
        }
        this.printStructsCTail()
        SortingEmitter.generatedStructs.add(asString(declaration.name))
    }

    private generateAncestors(typeChecker: ts.TypeChecker, type: ts.TypeNode) {
        const decl = getDeclarationByTypeNode(typeChecker, type)
        if (!decl) return
        if (!ts.isClassDeclaration(decl) && !ts.isInterfaceDeclaration(decl)) return
        const heritages = decl.heritageClauses
            ?.filter(it => it.token == ts.SyntaxKind.ExtendsKeyword || it.token == ts.SyntaxKind.ImplementsKeyword)
            .forEach(it => {
                for (const declaration of heritageDeclarations(typeChecker, it)) {
                    // Recursion, if the parent class also has a parent class
                    if (ts.isTypeReferenceNode(declaration)) this.generateAncestors(typeChecker, declaration)
                    this.printStructs(typeChecker, declaration)
                }
            })
    }

    startEmit(typeChecker: ts.TypeChecker, type: ts.TypeNode, name: string | undefined = undefined) {
        let next = new IndentedPrinter()
        this.currentPrinter = next

        this.generateAncestors(typeChecker, type)
        const decl = getDeclarationByTypeNode(typeChecker, type)
        this.printStructs(typeChecker, decl!)

        const repr = this.repr(type, name)
        if (this.emitters.has(repr)) throw new Error("Already emitted")
        let seen = new Set<string>()
        this.fillDeps(typeChecker, type, seen)
        seen.delete(repr)
        this.deps.set(repr, seen)
        this.emitters.set(repr, next)
        if (seen.size > 0)
            console.log(`${repr}: depends on ${Array.from(seen.keys()).join(",")}`)
    }

    repr(type: ts.TypeNode, name: string | undefined = undefined): string {
        return ts.isTypeReferenceNode(type) ? asString(type.typeName) : name!
    }

    printType(type: ts.TypeNode): string {
        return ts.isTypeReferenceNode(type)
            ? asString(type.typeName)
            : `${type.kind}:${ts.SyntaxKind[type.kind]}`
    }

    print(value: stringOrNone) {
        // console.log("print", this.currentPrinter, value)
        if (!this.currentPrinter) throw new Error("startEmit() first")
        if (value) this.currentPrinter.print(value)
    }

    pushIndent(): void {
        this.currentPrinter?.pushIndent()
    }

    popIndent(): void {
        this.currentPrinter?.popIndent()
    }

    getOutput(): string[] {
        let result: string[] = []
        let sortedTypes = this.getToposorted()
        sortedTypes.forEach(type => {
            let next = this.emitters.get(type)!.getOutput()
            result = result.concat(next)
        })
        return result
    }

    getToposorted(): Array<string> {
        // Not exactly correct for non-named types.
        let source = new Set(Array.from(this.emitters.keys()))
        //console.log(`SOURCE ${Array.from(source).join(",")}`)
        //let result = Array.from(this.emitters.keys())
        //result.sort((a, b) => a == b ? 0 : (this.deps.get(a)?.has(b) ? -1 : 1))
        let result: string[] = []
        // N^2, but nobody cares
        let added: Set<string> = new Set()
        while (source.size > added.size) {
            source.forEach(it => {
                if (added.has(it)) return
                let deps = this.deps.get(it)!
                let canAdd = true
                deps.forEach(dep => {
                    //console.log(`CHECK ${it} ${dep} ${source.has(dep)} ${!added.has(dep)}`)
                    if (source.has(dep) && !added.has(dep)) canAdd = false
                })
                if (canAdd && !added.has(it)) {
                    result.push(it)
                    added.add(it)
                }
                //console.log(`${it}: ${canAdd} depends on ${Array.from(deps).join(",")}`)
            })
        }
        console.log(`DEPS [${result.join(", ")}]`)
        return result
    }
}