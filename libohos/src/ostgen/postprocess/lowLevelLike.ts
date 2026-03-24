/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Builders, Hs, D, DD, E, IdentityTransformer, lw, Op, std, T, Ts } from "@idlizer/ost"
import { generatorConfiguration, zipStrip } from "@idlizer/core"
import { lowLevelLike } from "@idlizer/kit"
import { callbackKindDeclaration, monoName } from "./postprocess.js"
import { bridgeName, C_API_PREFIX, cApiName, implName } from "../producers/common.js"

export function postprocess(decls: lw.LWDeclaration[], modifiers: Map<string, string[]>, callbacks: string[]): Map<string, lw.LWDeclaration[]> {
    decls = introduceOptionalTypes(decls)
    decls = introduceCallbackCaller(decls, callbacks)
    decls = monomorphizeGenerics(decls)
    decls = monomorphizeAlgebraicTypes(decls)
    decls = makeApis(decls, modifiers)
    const files = lowLevelLike.postprocess(decls)
    const capi = files.get(C_API_PREFIX)
    if (capi)
        files.set(C_API_PREFIX, sortDeclarationsByDependency(capi))
    return files
}

class MakeOptional extends IdentityTransformer {
    override goStructureDeclaration(decl: lw.StructureDeclaration): lw.StructureDeclaration {
        decl.members.forEach(field => {
            if (field.modifiers?.find(it => it.name === std.names.modifiers.optional))
                field.type = Ts.optional(field.type)
        })
        return decl
    }
    go(decls: lw.LWDeclaration[]) {
        return decls.map(decl => this.goDeclaration(decl))
    }
}

function introduceOptionalTypes(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    ///needed?
    return new MakeOptional().go(decls)
}

function introduceCallbackCaller(decls: lw.LWDeclaration[], callbacks: string[]): lw.LWDeclaration[] {
    if (callbacks.length) {
        const callbackKindEnum = callbackKindDeclaration(callbacks, bridgeName)
        const caller = Builders.func(bridgeName('getManagedCallbackCaller'))
            .param('kind').type('CallbackKind').$()
            .returns(Ts.prim.pointer)
            .block()
                .switch().selector().var('kind').$()
                    .cases(callbacks.map(it => { return {
                        value: E.c(`CALLBACK_KIND_${it.toUpperCase()}`),
                        body: [Builders.return().cast(Ts.prim.pointer).value('CallManaged' + it).$().$()]
                    }})).$()
                .return().value('nullptr').$().$().$()
        const syncCaller = Builders.func(bridgeName('getManagedCallbackCallerSync'))
            .param('kind').type('CallbackKind').$()
            .returns(Ts.prim.pointer)
            .block()
                .switch().selector().var('kind').$()
                    .cases(callbacks.map(it => { return {
                        value: E.c(`CALLBACK_KIND_${it.toUpperCase()}`),
                        body: [Builders.return().cast(Ts.prim.pointer).value('SyncCallManaged' + it).$().$()]
                    }})).$()
                .return().value('nullptr').$().$().$()
        decls.push(callbackKindEnum, caller, syncCaller);
    }
    // Improve: Implement callback caller introduction
    return decls;
}

class MakeInstance extends IdentityTransformer {
    constructor(
        private subst: Map<string, lw.LWType>
    ) { super() }

    goValueType(type: lw.ValueType): lw.LWType {
        if (type.args.length) {
            return super.goValueType(type)
        }
        if (this.subst.has(type.name)) {
            return this.subst.get(type.name)!
        }
        return type
    }
    goDeclaration(decl: lw.LWDeclaration): lw.LWDeclaration {
        const processed = super.goDeclaration(decl)
        if (processed.kind === lw.LWKind.NamespaceDeclaration) {
            return processed
        }
        processed.generics = []
        return processed
    }
}

class GenericMonomorphizer extends IdentityTransformer {
    private index = new Map<string, lw.LWDeclaration>()
    private newDecls: lw.LWDeclaration[] = []
    constructor(private decls: lw.LWDeclaration[]) {
        super()
        decls.forEach(decl => {
            if (decl.kind === lw.LWKind.StructureDeclaration && decl.generics.length > 0)
                this.index.set(decl.name, decl)
        })

        // known special types
        this.index.set(
            std.names.types.array,
            DD({ generics: [{ name: 'T' }] }).struct('synthetic.mono.Array', [
                { name: 'length', type: Ts.prim.i32 },
                { name: 'array', type: Ts.ptr(T.c('T')) }
            ])
        )
        this.index.set(
            std.names.types.map,
            DD({ generics: [{ name: 'K' }, { name: 'V' }] }).struct('synthetic.mono.Map', [
                { name: 'length', type: Ts.prim.i32 },
                { name: 'keys', type: Ts.ptr(T.c('K')) },
                { name: 'values', type: Ts.ptr(T.c('V')) },
            ])
        )
        this.index.set(
            std.names.types.optional,
            DD({ generics: [{ name: 'T' }] }).struct('synthetic.mono.Optional', [
                { name: 'tag', type: Ts.prim.tag },
                { name: 'value', type: T.c('T') },
            ])
        )
    }
    private specialize(type: lw.ValueType): lw.LWType {
        const decl = this.index.get(type.name)
        if (decl && decl.kind === lw.LWKind.StructureDeclaration) {
            const specialName = monoName(type)
            if (!this.index.has(specialName)) {
                const subst = new Map<string, lw.LWType>()
                zipStrip(type.args, decl.generics).forEach(([arg, gen]) => {
                    subst.set(gen.name, arg)
                })
                const instance = this.goDeclaration(
                    new MakeInstance(subst).goDeclaration(decl)
                )
                instance.name = specialName
                this.newDecls.push(instance)
                this.index.set(specialName, instance)
            }
            return T.c(specialName)
        }
        return type
    }
    goValueType(type: lw.ValueType): lw.LWType {
        const processed = super.goValueType(type) as lw.ValueType
        return processed.args.length === 0
            ? processed
            : this.specialize(processed)
    }
    go(): lw.LWDeclaration[] {
        return this.newDecls.concat(this.decls.map(decl => this.goDeclaration(decl)))
    }
}

function monomorphizeGenerics(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    return new GenericMonomorphizer(decls).go()
}

class AlgebraicMonomorphizer extends IdentityTransformer {
    private knownNames = new Set<string>()
    private newDecls: lw.LWDeclaration[] = []
    constructor(private decls: lw.LWDeclaration[]) {
        super()
    }
    private specialize(type: lw.ValueType): lw.ValueType {
        const name = monoName(type)
        if (!this.knownNames.has(name)) {
            this.knownNames.add(name)
            const decl = type.name === std.names.types.union
                ? Builders.struct(name)
                    .field('selector').type(Ts.prim.i32).$()
                    .field(std.names.types.union).type(type).$().$() // let cxx printer do the rest
                : D.struct(name, type.args.map((ty, i) => ({ name: 'value' + i, type: ty })))
            this.newDecls.push(decl)
        }
        return T.c(name)
    }
    goValueType(type: lw.ValueType): lw.ValueType {
        const processed = super.goValueType(type) as lw.ValueType
        return processed.name === std.names.types.union
            || processed.name === std.names.types.intersection
                ? this.specialize(processed)
                : processed
    }
    go(): lw.LWDeclaration[] {
        return this.newDecls.concat(this.decls.map(decl => this.goDeclaration(decl)))
    }
}
function monomorphizeAlgebraicTypes(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    return new AlgebraicMonomorphizer(decls).go()
}

/**
 * Collect all ValueType names referenced by a type, skipping pointer-wrapped types.
 */
function collectTypeDeps(type: lw.LWType, deps: Set<string>): void {
    switch (type.kind) {
        case lw.LWKind.ValueType:
            if (type.name !== std.names.types.pointer && type.name !== std.names.types.reference) {
                deps.add(type.name)
                for (const arg of type.args)
                    collectTypeDeps(arg, deps)
            }
            break
        case lw.LWKind.FunctionalType:
            for (const param of type.params)
                collectTypeDeps(param.type, deps)
            collectTypeDeps(type.returnType, deps)
            break
        case lw.LWKind.HoleType:
            throw new Error('Encountered HoleType while postprocessing')
    }
}

/**
 * Sort declarations using Kahn's algorithm so that declarations with no
 * dependencies come first, followed by those that depend on them.
 * Only StructureDeclarations participate in the topological sort;
 * all other declaration kinds are left in their original positions.
 * Pointer-typed fields are not treated as dependencies.
 */
export function sortDeclarationsByDependency(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    // Separate struct declarations and track their original indices
    const structIndices: number[] = []
    const structs: lw.StructureDeclaration[] = []
    for (let i = 0; i < decls.length; i++) {
        if (decls[i].kind === lw.LWKind.StructureDeclaration) {
            structIndices.push(i)
            structs.push(decls[i] as lw.StructureDeclaration)
        }
    }

    if (structs.length <= 1) return decls

    // Build name-to-index map for structs
    const nameToIdx = new Map<string, number>()
    for (let i = 0; i < structs.length; i++) {
        nameToIdx.set(structs[i].name, i)
    }

    // Build adjacency list and in-degree array
    // dependents[i] = set of struct indices that depend on struct i
    const dependsOn: Set<number>[] = structs.map(() => new Set<number>())
    const dependents: Set<number>[] = structs.map(() => new Set<number>())
    const inDegree: number[] = new Array(structs.length).fill(0)

    for (let i = 0; i < structs.length; i++) {
        const deps = new Set<string>()
        for (const member of structs[i].members) {
            collectTypeDeps(member.type, deps)
        }
        for (const depName of deps) {
            const depIdx = nameToIdx.get(depName)
            if (depIdx !== undefined && depIdx !== i) {
                if (!dependsOn[i].has(depIdx)) {
                    dependsOn[i].add(depIdx)
                    dependents[depIdx].add(i)
                    inDegree[i]++
                }
            }
        }
    }

    // Kahn's algorithm
    const queue: number[] = []
    for (let i = 0; i < structs.length; i++) {
        if (inDegree[i] === 0) {
            queue.push(i)
        }
    }

    const sorted: lw.StructureDeclaration[] = []
    const visited = new Set<number>()

    while (queue.length > 0) {
        const idx = queue.shift()!
        sorted.push(structs[idx])
        visited.add(idx)
        for (const depIdx of dependents[idx]) {
            inDegree[depIdx]--
            if (inDegree[depIdx] === 0) {
                queue.push(depIdx)
            }
        }
    }

    // Cycle fallback: append remaining structs in original order
    for (let i = 0; i < structs.length; i++) {
        if (!visited.has(i)) {
            sorted.push(structs[i])
        }
    }

    // Reconstruct the result array: non-struct declarations stay in place,
    // struct slots are filled with the sorted structs in order
    const result = decls.slice()
    for (let i = 0; i < structIndices.length; i++) {
        result[structIndices[i]] = sorted[i]
    }
    return result
}

function makeApis(decls: lw.LWDeclaration[], modifierNames: Map<string, string[]>): lw.LWDeclaration[] {
    const apiStructName = cApiName('modifier.API')
    const apiStruct = Builders.struct(apiStructName)
        .field('version').type(Ts.prim.i32).$()
    const modifierImpls: lw.FunctionDeclaration[] = []
    const apiImpls: lw.LWExpression[] = []
    // API struct fields
    modifierNames.forEach((impls, className) => {
        const name = cApiName(className + 'Modifier')
        const modifierImplName = implName(name + 'Impl')
        // modifier field in the API struct
        apiStruct.field(className)
            .funcType().returns(Ts.const(Ts.ptr(T.c(name)))).$().$()
        // modifier implementation
        modifierImpls.push(
            Builders.func(modifierImplName)
                .returns(Ts.const(Ts.ptr(T.c(name))))
                .block()
                    .decl('instance', T.c(name)).static().value()
                        .ctor().asStruct().args(
                            impls.map(it => E.unary(Op.ref, E.v(it + 'Impl')))).$().$().$()
                    .return().value(E.unary(Op.ref, E.v('instance'))).$().$().$())
        // modifier implementation pointer in the API implementation struct
        apiImpls.push(E.unary(Op.ref, E.v(modifierImplName, [Hs.isType()])))
    })
    // API implementation function
    const apiImpl = Builders.func(implName(`Get${generatorConfiguration().moduleName.toUpperCase()}APIImpl`))
        .returns(Ts.const(Ts.ptr(T.c(apiStructName))))
        .param('version').type(Ts.prim.i32).$()
        ///extern "C"
        .block()
            .decl('api', T.c(apiStructName)).static().value()
                .ctor().asStruct().arg(1).args(apiImpls).$().$().$()
            .if()
                .cond().binary(Op.ne).left('version').right().access('version').receiver('api').$().$().$().$()
                .then().return().value('nullptr').$().$().$()
            .return().value(E.unary(Op.ref, E.v('api'))).$().$().$()
    return [...decls, apiStruct.$(), ...modifierImpls, apiImpl]
}
