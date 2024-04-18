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
import { asString, stringOrNone } from "../util";
import { DeclarationTable, DeclarationTarget, PrimitiveType } from "./DeclarationTable";

export class SortingEmitter extends IndentedPrinter {
    currentPrinter?: IndentedPrinter
    emitters = new Map<string, IndentedPrinter>()
    deps = new Map<string, Set<string>>()

    constructor(private table: DeclarationTable) {
        super()
    }

    private undecorate(name: string): string {
        return name.replace(/^(Optional_)*(.*?)(\*)*$/, '$2')
    }

    private fillDeps(target: DeclarationTarget, seen: Set<string>) {
        let name = this.undecorate(this.table!.computeTargetName(target, false))
        if (seen.has(name)) return
        seen.add(name)
        let struct = this.table.targetStruct(target)
        struct.supers.forEach(it => this.fillDeps(it, seen))
        struct.getFields().forEach(it => this.fillDeps(it.declaration, seen))
    }

    startEmit(table: DeclarationTable, declaration: DeclarationTarget) {
        this.table = table
        let name = this.undecorate(table.computeTargetName(declaration, false))
        let next = this.emitters.has(name) ? this.emitters.get(name)! : new IndentedPrinter()
        this.emitters.set(name, next)
        this.currentPrinter = next
        let seen = new Set<string>()
        this.fillDeps(declaration, seen)
        seen.delete(name)
        this.deps.set(name, seen)
        table.processPendingRequests()
        // if (seen.size > 0) console.log(`${name}: depends on ${Array.from(seen.keys()).join(",")}`)
    }
    printType(type: ts.TypeNode): string {
        return ts.isTypeReferenceNode(type)
            ? asString(type.typeName)
            : `${type.kind}:${ts.SyntaxKind[type.kind]}`
    }

    print(value: stringOrNone) {
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
            let next = this.emitters.get(type)?.getOutput()
            if (next) result = result.concat(next)
        })
        return result
    }

    // Kahn's algorithm.
    getToposorted(): Array<string> {
        let result: string[] = []
        let input = Array.from(this.emitters.keys())
        input.push(PrimitiveType.Int32.getText())
        let deps = this.deps

        const adjMap = new Map<string, string[]>()
        let count = 0
        // Build adj map.
        let inDegree = new Map<string, number>()
        for (let k of input) {
            //console.log("k", k)
            let array: string[] = []
            adjMap.set(k, array)
            inDegree.set(k, 0)
            deps.get(k)?.forEach(it => {
                array.push(it)
            })
            count++
        }
        // Compute in-degrees.
        for (let k of input) {
            for (let it of adjMap.get(k)!) {
                let old = inDegree.get(it)
                if (old == undefined) {
                    // throw new Error(`Forgotten type: ${it} of ${k}`)
                    old = 0
                }
                inDegree.set(it, old + 1)
            }
        }
        let queue: string[] = []
        // Insert elements with in-degree 0
        for (let k of input) {
            if (inDegree.get(k)! == 0) {
                queue.push(k)
            }
        }
        // Add all elements with 0
        while (queue.length > 0) {
            let e = queue.shift()!
            result.unshift(e)
            let kids = adjMap.get(e)
            if (kids != undefined) {
                for (let it of kids) {
                    let old = inDegree.get(it)! - 1
                    inDegree.set(it, old)
                    if (old == 0) {
                        queue.push(it)
                    }
                }
            }
        }

        if (result.length < input.length) {
            let cycle = []
            for (let it of input) {
                if (!result.includes(it)) {
                    cycle.push(it)
                }
            }
            console.log(`Cycle: ${cycle.join(",")}`)
            throw new Error("cycle detected")
        }
        return result
    }
}