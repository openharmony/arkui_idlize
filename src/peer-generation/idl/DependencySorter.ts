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
import { convert } from "./common";
import { DeclarationDependenciesCollector, TypeDependenciesCollector } from "./IdlDependenciesCollector";
import { IdlPeerLibrary } from "./IdlPeerLibrary";
import { collectProperties } from "./StructPrinter";

class TypeDependencies extends TypeDependenciesCollector {
    constructor(library: IdlPeerLibrary) {
        super(library)
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLEntry[] {
        return type.types.map(it => this.library.toDeclaration(it))
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLEntry[] {
        return []
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        return []
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        if (idl.getIDLTypeName(type) === "Optional") {
            const wrapped = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!
            return [this.library.toDeclaration(idl.toIDLType(wrapped))]
        }
        return [this.library.toDeclaration(type)]
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLEntry[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLEntry[] {
        return []
    }
}

class DeclDependencies extends DeclarationDependenciesCollector {
    constructor (private library: IdlPeerLibrary, private typeDependencies: TypeDependencies) {
        super(typeDependencies)
    }
    convertInterface(node: idl.IDLInterface): idl.IDLEntry[] {
        return collectProperties(node, this.library).map(it => this.library.toDeclaration(it.type))
    }
    convertEnum(node: idl.IDLEnum): idl.IDLEntry[] {
        return []
    }
    convertTypedef(node: idl.IDLTypedef): idl.IDLEntry[] {
        return [this.library.toDeclaration(node)]
    }
    convertCallback(node: idl.IDLCallback): idl.IDLEntry[] {
        return []
    }
}

export class DependencySorter {
    typeConvertor: TypeDependenciesCollector
    declConvertor: DeclarationDependenciesCollector
    dependencies = new Set<idl.IDLEntry>()
    adjMap = new Map<idl.IDLEntry, idl.IDLEntry[]>()

    constructor(private library: IdlPeerLibrary) {
        this.typeConvertor = new TypeDependencies(library);
        this.declConvertor = new DeclDependencies(library, this.typeConvertor)
    }

    private fillDependencies(target: idl.IDLEntry, seen: Set<idl.IDLEntry>) {
        if (seen.has(target)) return
        seen.add(target)
        // Need to request that declaration.
        this.dependencies.add(target)
        let deps = convert(target, this.typeConvertor, this.declConvertor)
        deps.forEach(it => this.fillDependencies(it, seen))

        // Require structs but do not make dependencies to them from `target`
        if (idl.isContainerType(target)) {
            for (const type of target.elementType)
                this.addDep(this.library.toDeclaration(type))
        }
        if (idl.isCallback(target)) {
            for (const parameter of target.parameters)
                this.addDep(this.library.toDeclaration(parameter.type!))
            this.addDep(this.library.toDeclaration(target.returnType))
        }

        this.adjMap.set(target, deps)
    }

    addDep(declaration: idl.IDLEntry) {
        if (this.dependencies.has(declaration)) return
        let seen = new Set<idl.IDLEntry>()///one for all deps?
        this.dependencies.add(declaration)
        this.fillDependencies(declaration, seen)
        // if (seen.size > 0) console.log(`${name}: depends on ${Array.from(seen.keys()).join(",")}`)
    }

    // Kahn's algorithm.
    getToposorted(): idl.IDLEntry[] {
        let result: idl.IDLEntry[] = []
        let input = Array.from(this.dependencies)
        // Compute in-degrees.
        let inDegree = new Map<idl.IDLEntry, number>()
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
        let queue: idl.IDLEntry[] = []
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
            console.log(`CYCLE:\n${cycle.map(it => `${it.name} (ind=${inDegree.get(it)}): ${this.adjMap.get(it)?.map(it => it.name).join(",")}`).join("\n")}`)
            throw new Error("cycle detected")
        }
        // console.log("DEPS", result.map(it => this.table.computeTargetName(it, false)).join(","))
        return result
    }
}