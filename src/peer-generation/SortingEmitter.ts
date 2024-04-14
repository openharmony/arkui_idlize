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
import { DeclarationTable, DeclarationTarget } from "./DeclarationTable";

export class SortingEmitter extends IndentedPrinter {
    currentPrinter?: IndentedPrinter
    emitters = new Map<string, IndentedPrinter>()
    deps = new Map<string, Set<string>>()

    constructor(private table: DeclarationTable) {
        super()
    }

    deoptional(name: string): string {
        if (name.startsWith("Optional_")) name = name.substring(9)
        return name
    }

    private fillDeps(target: DeclarationTarget, seen: Set<string>) {
        let name = this.deoptional(this.table!.computeTargetName(target, false))
        if (seen.has(name)) return
        seen.add(name)
        let fields = this.table.targetFields(target)
        fields.forEach(it => {
            seen.add(this.deoptional(it.typeName))
        })
    }

    startEmit(table: DeclarationTable, declaration: DeclarationTarget) {
        this.table = table
        let name = this.deoptional(table.computeTargetName(declaration, false))
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
        // console.log(`DEPS [${result.join(", ")}]`)
        return result
    }
}