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

import * as idl from '@idlizer/core/idl'
import { convertNode, convertType, Language, LibraryInterface, NodeConvertor, ReferenceResolver, sorted } from "@idlizer/core";
import { collectProperties } from "../printers/StructPrinter";
import { flattenUnionType, maybeTransformManagedCallback } from "@idlizer/core";

class SorterDependenciesCollector implements NodeConvertor<idl.IDLNode[]> {
    constructor(
        public library: LibraryInterface, 
        private doUnionFlattening: boolean)
    {}

    private toDeclarations(node: idl.IDLNode | idl.IDLType, isOptional = false): idl.IDLNode[] {
        const one = (node: idl.IDLNode | idl.IDLType) => {
            if (idl.isType(node) && isOptional)
                node = idl.maybeOptional(node, isOptional)
            return this.library.toDeclaration(node)
        }

        const result = [one(node)];
        if (this.doUnionFlattening && idl.isUnionType(node)) {
            const flattened = flattenUnionType(this.library, node)
            if (flattened !== node)
                result.push(one(flattened))
        }

        return result
    }
    convertOptional(type: idl.IDLOptionalType): idl.IDLNode[] {
        return this.toDeclarations(type.type)
    }
    convertNamespace(decl: idl.IDLNamespace): idl.IDLNode[] {
        return decl.members.flatMap(it => this.convert(it))
    }
    convertMethod(decl: idl.IDLMethod): idl.IDLNode[] {
        return [
            ...decl.parameters.flatMap(it => this.toDeclarations(it.type, it.isOptional)),
            ...this.toDeclarations(decl.returnType),
        ]
    }
    convertConstant(decl: idl.IDLConstant): idl.IDLNode[] {
        return this.toDeclarations(decl.type)
    }
    convertUnion(type: idl.IDLUnionType): idl.IDLNode[] {
        return type.types.flatMap(it => this.toDeclarations(it))
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        return [] // hack: containers are not required a complete element declaration in all languages we have, only forward, so, simulate no dependency here
        //return type.elementType.flatMap(it => this.toDeclarations(it))
    }
    convertImport(type: idl.IDLImport): idl.IDLNode[] {
        console.warn("Imports are not implemented yet")
        return []
    }
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        return this.convertTypeReference(type)
    }
    convertTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
        if (type.name === "Optional") {
            return type.typeArguments!
        }
        return this.toDeclarations(type)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): idl.IDLNode[] {
        return []
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): idl.IDLNode[] {
        return []
    }
    convertInterface(node: idl.IDLInterface): idl.IDLNode[] {
        return collectProperties(node, this.library).flatMap(it => this.toDeclarations(it.type, it.isOptional))
    }
    convertEnum(node: idl.IDLEnum): idl.IDLNode[] {
        return []
    }
    convertTypedef(node: idl.IDLTypedef): idl.IDLNode[] {
        return this.toDeclarations(node.type)
    }
    convertCallback(node: idl.IDLCallback): idl.IDLNode[] {
        return []
    }

    convert(node: idl.IDLNode | undefined): idl.IDLNode[] {
        if (node === undefined)
            return []
        return convertNode(this, node)
    }
}

class CachedTransformer {
    constructor(private readonly resolver: ReferenceResolver) {}
    private cache: Map<idl.IDLNode, idl.IDLNode> = new Map()
    transofrm(node: idl.IDLNode): idl.IDLNode {
        if (this.cache.has(node))
            return this.cache.get(node)!
        if (idl.isCallback(node)) {
            this.cache.set(node, maybeTransformManagedCallback(node, this.resolver) ?? node)
            return this.cache.get(node)!
        }
        if (idl.isContainerType(node) && idl.IDLContainerUtils.isPromise(node)) {
            this.cache.set(node, node.elementType[0])
            return this.cache.get(node)!
        }
        return node
    }
}

export type UnionFlatteningMode = boolean | "both"

export class DependencySorter {
    dependenciesCollector: SorterDependenciesCollector
    private cachedTransformer = new CachedTransformer(this.library)
    dependencies = new Set<idl.IDLNode>()
    adjMap = new Map<idl.IDLNode, idl.IDLNode[]>()
    seen = new Set<idl.IDLNode>()///one for all deps?

    constructor(
        private library: LibraryInterface,
        private unionFlatteningMode: UnionFlatteningMode)
    {
        this.dependenciesCollector = new SorterDependenciesCollector(library, this.unionFlatteningMode===true || this.unionFlatteningMode==="both");
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

    addDepExactly(declaration: idl.IDLNode) {
        declaration = this.cachedTransformer.transofrm(declaration)
        if (this.dependencies.has(declaration)) return
        this.dependencies.add(declaration)
        this.fillDependencies(declaration)
        // if (seen.size > 0) console.log(`${name}: depends on ${Array.from(seen.keys()).join(",")}`)
    }

    addDep(declaration: idl.IDLNode) {
        switch (this.unionFlatteningMode) {
        case "both":
            this.addDepExactly(declaration)
            if (idl.isUnionType(declaration)) {
                const flatten = flattenUnionType(this.library, declaration)
                if (flatten !== declaration)
                    this.addDepExactly(flatten)
            }
            break;
        case true:
            if (idl.isUnionType(declaration))
                this.addDepExactly(flattenUnionType(this.library, declaration))
            else
                this.addDepExactly(declaration)
            break;
        case false:
            this.addDepExactly(declaration)
            break;
        }
    }

    // Kahn's algorithm.
    getToposorted(): idl.IDLNode[] {
        let result = new Set<idl.IDLNode>
        const namer = this.library.createTypeNameConvertor(Language.CPP)
        let input = sorted([...this.dependencies], it => namer.convert(it))
        while (input.length) {
            let broken: idl.IDLNode[] = []
            let processed = 0
            for (const candidate of input) {
                const adj = this.adjMap.get(candidate)!
                if (adj.find(adj => !result.has(adj)))
                    broken.push(candidate)
                else {
                    result.add(candidate)
                    ++processed
                }
            }
            if (!processed) {
                console.warn("DependencySorter detects unsatisfiable dependencies (loops wtith consecuences):")
                for(const it of broken)
                    console.warn(`${namer.convert(it)} -> [${this.adjMap.get(it)?.filter(it => !result.has(it)).map(it => namer.convert(it)).join(", ")}]`)
                console.warn("DependencySorter dependencies end")
                //throw new Error("unsatisfeable dependencies detected")

                break
            }
            input = broken
        }
        // if(1) {
        //     const namer = this.library.createTypeNameConvertor(Language.CPP)
        //     console.debug("DEPS BEGIN")
        //     for(const it of resultArray)
        //         console.debug(namer.convert(it))
        //     console.debug("DEPS END")
        // }
        return [...result.values()]
    }
}