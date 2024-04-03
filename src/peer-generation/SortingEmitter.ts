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
import { asString, getDeclarationsByNode, getNameWithoutQualifiersRight, heritageTypes, stringOrNone } from "../util";

export class SortingEmitter extends IndentedPrinter {
    currentPrinter?: IndentedPrinter
    emitters = new Map<string, IndentedPrinter>()
    deps = new Map<string, Set<string>>()

    constructor() {
        super()
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

    startEmit(typeChecker: ts.TypeChecker, type: ts.TypeNode, name: string | undefined = undefined) {
        const repr = this.repr(type, name)
        if (this.emitters.has(repr)) throw new Error("Already emitted")
        let next = new IndentedPrinter()
        let seen = new Set<string>()
        this.fillDeps(typeChecker, type, seen)
        seen.delete(repr)
        this.deps.set(repr, seen)
        this.emitters.set(repr, next)
        this.currentPrinter = next
        if (seen.size > 0)
            console.log(`${repr}: depends on ${Array.from(seen.keys()).join(",")}`)
    }

    repr(type: ts.TypeNode, name: string | undefined = undefined): string {
        return ts.isTypeReferenceNode(type) ? getNameWithoutQualifiersRight(type.typeName)! : name!
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