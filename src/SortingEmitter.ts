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

import { IndentedPrinter } from "./IndentedPrinter";
import * as ts from "typescript"
import { asString, getDeclarationsByNode, stringOrNone } from "./util";

export class SortingEmitter extends IndentedPrinter {
    currentPrinter?: IndentedPrinter
    emitters = new Map<ts.TypeNode, IndentedPrinter>()
    deps = new Map<ts.TypeNode, Set<ts.TypeNode>>()

    constructor() {
        super()
    }

    private heritageTypes(clause: ts.HeritageClause): Array<ts.TypeNode> {
        return clause.types.map(it => {
            const name = ts.isIdentifier(it.expression) ? ts.idText(it.expression) : undefined
            if (!name) throw new Error(`NON_IDENTIFIER_HERITAGE ${asString(it)}`)
            return ts.factory.createTypeReferenceNode(name)
        })
    }

    private fillDeps(typeChecker: ts.TypeChecker, type: ts.TypeNode|undefined, seen: Set<ts.TypeNode>) {
        if (!type || seen.has(type)) return
        seen.add(type)
        if (!ts.isTypeReferenceNode(type)) return
        let decls = getDeclarationsByNode(typeChecker, type.typeName)
        if (decls.length > 0) {
            let decl = decls[0]
            if (ts.isInterfaceDeclaration(decl)) {
                decl.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => this.fillDeps(typeChecker, it.type, seen))
                decl.heritageClauses?.forEach(it => {
                        this.heritageTypes(it).forEach(it => this.fillDeps(typeChecker, it, seen))
                 })
            }
            if (ts.isClassDeclaration(decl)) {
                decl.members
                    .filter(ts.isPropertyDeclaration)
                    .forEach(it => this.fillDeps(typeChecker, it.type, seen))
                decl.heritageClauses?.forEach(it => {
                    this.heritageTypes(it).forEach(it => this.fillDeps(typeChecker, it, seen))
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
            console.log(`no decl for ${asString(type)}`)
        }
    }

    startEmit(typeChecker: ts.TypeChecker, type: ts.TypeNode) {
        if (this.emitters.has(type)) throw new Error("Already emitted")
        console.log(this.emitters.size)
        let next = new IndentedPrinter()
        let seen = new Set<ts.TypeNode>()
        this.fillDeps(typeChecker, type, seen)
        seen.delete(type)
        this.deps.set(type, seen)
        this.emitters.set(type, next)
        this.currentPrinter = next
        if (seen.size > 0)
            console.log(`${this.printType(type)}: depends on ${Array.from(seen.keys()).map(it => this.printType(it)).join(",")}`)
    }

    printType(type: ts.TypeNode): string {
        if (ts.isTypeReferenceNode(type)) {
            return asString(type.typeName)
        }
        return "__other"
    }

    print(value: stringOrNone) {
        // console.log("print", this.currentPrinter, value)
        if (!this.currentPrinter) throw new Error("startEmit() first")
        if (value) this.currentPrinter.print(this.indented(value))
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

    getToposorted(): Array<ts.TypeNode> {
        // Not exactly correct for non-named types.
        let source = new Set(Array.from(this.emitters.keys()))
        //console.log(`SOURCE ${Array.from(source).map(it => this.printType(it)).join(",")}`)
        //let result = Array.from(this.emitters.keys())
        //result.sort((a, b) => a == b ? 0 : (this.deps.get(a)?.has(b) ? -1 : 1))
        let result: ts.TypeNode[] = []
        // N^2, but nobody cares
        let added: Set<ts.TypeNode> = new Set()
        while (source.size > added.size) {
            source.forEach(it => {
                let deps = this.deps.get(it)!
                let canAdd = true
                deps.forEach(dep => {
                    console.log(`CHECK ${this.printType(it)} ${this.printType(dep)} ${source.has(dep)} ${!added.has(dep)}`)
                    if (source.has(dep) && !added.has(dep)) canAdd = false
                })
                if (canAdd && !added.has(it)) {
                    result.push(it)
                    added.add(it)
                }
                // console.log(`${this.printType(it)}: ${canAdd} depends on ${Array.from(deps).map(it => this.printType(it)).join(",")}`)
                //console.log(this.printType(it))
            })
        }
        console.log(`DEPS [${result.map(it => this.printType(it)).join(", ")}]`)
        return result
    }
}