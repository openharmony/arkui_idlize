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
import { asString, getDeclarationsByNode, heritageDeclarations, heritageTypes, stringOrNone } from "./util";

// Use string for TypeReferenceNode to make them unique, original TypeNodes for everything else
type TypeRepr = string | ts.TypeNode

export class SortingEmitter extends IndentedPrinter {
    currentPrinter?: IndentedPrinter
    emitters = new Map<TypeRepr, IndentedPrinter>()
    deps = new Map<TypeRepr, Set<TypeRepr>>()

    constructor() {
        super()
    }

    private fillDeps(typeChecker: ts.TypeChecker, type: ts.TypeNode | undefined, seen: Set<TypeRepr>) {
        if (!type || seen.has(this.repr(type))) return
        seen.add(this.repr(type))
        if (!ts.isTypeReferenceNode(type)) return
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
    }

    startEmit(typeChecker: ts.TypeChecker, type: ts.TypeNode) {
        const repr = this.repr(type)
        if (this.emitters.has(repr)) throw new Error("Already emitted")
        let next = new IndentedPrinter()
        let seen = new Set<TypeRepr>()
        this.fillDeps(typeChecker, type, seen)
        seen.delete(repr)
        this.deps.set(repr, seen)
        this.emitters.set(repr, next)
        this.currentPrinter = next
        if (seen.size > 0)
            console.log(`${this.printType(type)}: depends on ${Array.from(seen.keys()).map(it => this.printType(it)).join(",")}`)
    }

    repr(type: ts.TypeNode): TypeRepr {
        return ts.isTypeReferenceNode(type) ? asString(type.typeName) : type
    }

    printType(repr: TypeRepr): string {
        return typeof repr === 'string'
            ? repr
            : `${repr.kind}:${ts.SyntaxKind[repr.kind]}`
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

    getToposorted(): Array<TypeRepr> {
        // Not exactly correct for non-named types.
        let source = new Set(Array.from(this.emitters.keys()))
        //console.log(`SOURCE ${Array.from(source).map(it => this.printType(it)).join(",")}`)
        //let result = Array.from(this.emitters.keys())
        //result.sort((a, b) => a == b ? 0 : (this.deps.get(a)?.has(b) ? -1 : 1))
        let result: TypeRepr[] = []
        // N^2, but nobody cares
        let added: Set<TypeRepr> = new Set()
        while (source.size > added.size) {
            source.forEach(it => {
                if (added.has(it)) return
                let deps = this.deps.get(it)!
                let canAdd = true
                deps.forEach(dep => {
                    //console.log(`CHECK ${this.printType(it)} ${this.printType(dep)} ${source.has(dep)} ${!added.has(dep)}`)
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