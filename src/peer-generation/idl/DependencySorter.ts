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

import * as idl from "../../idl";
import { PeerLibrary } from "../PeerLibrary";
import { collectProperties } from "../printers/StructPrinter";
import { DependenciesCollector } from "./IdlDependenciesCollector";

class SorterDependenciesCollector extends DependenciesCollector {
    constructor(library: PeerLibrary) {
        super(library)
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        return type.types.map(it => this.library.toDeclaration(it))
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return []
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        return []
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
        if (type.name === "Optional") {
            return type.typeArguments!
        }
        return [this.library.toDeclaration(type)]
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLNode[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLNode[] {
        return []
    }
    convertInterface(node: idl.IDLInterface): idl.IDLNode[] {
        return collectProperties(node, this.library).map(it => this.library.toDeclaration(it.type))
    }
    convertEnum(node: idl.IDLEnum): idl.IDLNode[] {
        return []
    }
    convertTypedef(node: idl.IDLTypedef): idl.IDLNode[] {
        return [this.library.toDeclaration(node)]
    }
    convertCallback(node: idl.IDLCallback): idl.IDLNode[] {
        return []
    }
}

export class DependencySorter {
    dependenciesCollector: SorterDependenciesCollector
    dependencies = new Set<idl.IDLNode>()
    adjMap = new Map<idl.IDLNode, idl.IDLNode[]>()

    constructor(private library: PeerLibrary) {
        this.dependenciesCollector = new SorterDependenciesCollector(library);
    }

    private fillDependencies(target: idl.IDLNode, seen: Set<idl.IDLNode>) {
        if (seen.has(target)) return
        seen.add(target)
        // Need to request that declaration.
        this.dependencies.add(target)
        let deps = this.dependenciesCollector.convert(target)
        deps.forEach(it => this.fillDependencies(it, seen))

        // Require structs but do not make dependencies to them from `target`
        if (idl.isContainerType(target)) {
            for (const type of target.elementType)
                this.addDep(this.library.toDeclaration(type))
        }
        if (idl.isOptionalType(target)) {
            this.addDep(this.library.toDeclaration(target.type))
        }
        if (idl.isCallback(target)) {
            for (const parameter of target.parameters)
                this.addDep(this.library.toDeclaration(parameter.type!))
            this.addDep(this.library.toDeclaration(target.returnType))
        }

        this.adjMap.set(target, deps)
    }

    addDep(declaration: idl.IDLNode) {
        if (this.dependencies.has(declaration)) return
        let seen = new Set<idl.IDLEntry>()///one for all deps?
        this.dependencies.add(declaration)
        this.fillDependencies(declaration, seen)
        // if (seen.size > 0) console.log(`${name}: depends on ${Array.from(seen.keys()).join(",")}`)
    }

    // Kahn's algorithm.
    getToposorted(): idl.IDLNode[] {
        let result: idl.IDLNode[] = []
        let input = Array.from(this.dependencies)
        // Compute in-degrees.
        let inDegree = new Map<idl.IDLNode, number>()
        for (let k of input) {
            inDegree.set(k, 0)
        }
        for (let k of input) {
            for (let it of this.adjMap.get(k)!) {
                let old = inDegree.get(it)
                if (old == undefined) {
                    // throw new Error(`Forgotten type: ${it} of ${k}`)
                    old = 0
                }
                inDegree.set(it, old + 1)
            }
        }
        let queue: idl.IDLNode[] = []
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
            let kids = this.adjMap.get(e)
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
            console.log(`CYCLE:\n${cycle.map(it => `${idl.forceAsNamedNode(it).name} (ind=${inDegree.get(it)}): ${this.adjMap.get(it)?.map(it => idl.forceAsNamedNode(it).name).join(",")}`).join("\n")}`)
            throw new Error("cycle detected")
        }
        // console.log("DEPS", result.map(it => this.table.computeTargetName(it, false)).join(","))
        return result
    }
}