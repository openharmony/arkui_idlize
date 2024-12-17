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
import { LibraryInterface } from "../../LibraryInterface";
import { maybeTransformManagedCallback } from "../ArgConvertors";
import { PeerLibrary } from "../PeerLibrary";
import { collectProperties } from "../printers/StructPrinter";
import { flattenUnionType } from "../unions";
import { DependenciesCollector } from "./IdlDependenciesCollector";

class SorterDependenciesCollector extends DependenciesCollector {
    constructor(public library: LibraryInterface) {
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
        return collectProperties(node, this.library).map(it =>
            this.library.toDeclaration(flattenUnionType(this.library, it.type)))
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

class CachedTransformer {
    private cache: Map<idl.IDLNode, idl.IDLNode> = new Map()
    transofrm(node: idl.IDLNode): idl.IDLNode {
        if (this.cache.has(node))
            return this.cache.get(node)!
        if (idl.isCallback(node)) {
            this.cache.set(node, maybeTransformManagedCallback(node) ?? node)
            return this.cache.get(node)!
        }
        return node
    }
}

export class DependencySorter {
    dependenciesCollector: SorterDependenciesCollector
    private cachedTransformer = new CachedTransformer()
    dependencies = new Set<idl.IDLNode>()
    adjMap = new Map<idl.IDLNode, idl.IDLNode[]>()
    seen = new Set<idl.IDLNode>()///one for all deps?

    constructor(private library: LibraryInterface) {
        this.dependenciesCollector = new SorterDependenciesCollector(library);
    }

    private fillDependencies(target: idl.IDLNode) {
        if (this.seen.has(target)) return
        this.seen.add(target)
        // Need to request that declaration.
        this.dependencies.add(target)
        let deps = this.dependenciesCollector.convert(target)
            .map(it => this.cachedTransformer.transofrm(it))
        deps.forEach(it => this.fillDependencies(it))

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
        declaration = this.cachedTransformer.transofrm(declaration)
        if (this.dependencies.has(declaration)) return
        this.dependencies.add(declaration)
        this.fillDependencies(declaration)
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