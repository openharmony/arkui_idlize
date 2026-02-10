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

import { Builders, Hs, D, DD, E, IdentityTransformer, lw, Op, std, T, Ts } from "../../ost";
import { generatorConfiguration, zipStrip } from "@idlizer/core";
import { callbackKindDeclaration, monoName } from "./postprocess";
import { bridgeName, cApiName, implName } from "../producers/common";
import { lowLevelLike } from "@idlizer/kit";

export function postprocess(decls: lw.LWDeclaration[], modifiers: Map<string, string[]>): Map<string, lw.LWDeclaration[]> {
    decls = introduceOptionalTypes(decls)
    decls = introduceCallbackCaller(decls)
    decls = monomorphizeGenerics(decls)
    decls = monomorphizeAlgebraicTypes(decls)
    decls = makeApis(decls, modifiers)
    return lowLevelLike.postprocess(decls)
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
    return new MakeOptional().go(decls)
}

function introduceCallbackCaller(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const callers = decls
        .filter(it => it.name.startsWith(bridgeName('CallManaged')))
        .map(it => it.name.replace(/^.*CallManaged/, '')) ///where to take callback name from?
    if (callers.length) {
        const callbackKindEnum = callbackKindDeclaration(callers, bridgeName)
        const caller = Builders.func(bridgeName('getManagedCallbackCaller'))
            .param('kind').typeStr('CallbackKind').$()
            .returns(Ts.prim.pointer)
            .block()
                .switch().selector().var('kind').$()
                    .cases(callers.map(it => { return {
                        value: E.c(`KIND_${it.toUpperCase()}`),
                        body: [Builders.return().cast(Ts.prim.pointer).value('CallManaged' + it).$().$()]
                    }})).$()
                .return().value('nullptr').$().$().$()
        const syncCaller = Builders.func(bridgeName('getManagedCallbackCallerSync'))
            .param('kind').typeStr('CallbackKind').$()
            .returns(Ts.prim.pointer)
            .block()
                .switch().selector().var('kind').$()
                    .cases(callers.map(it => { return {
                        value: E.c(`KIND_${it.toUpperCase()}`),
                        body: [Builders.return().cast(Ts.prim.pointer).value('SyncCallManaged' + it).$().$()]
                    }})).$()
                .return().value('nullptr').$().$().$()
        decls.push(callbackKindEnum, caller, syncCaller);
    }
    // TODO: Implement callback caller introduction
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
                { name: 'value', type: Ts.ptr(T.c('T')) }
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
                    new MakeInstance(subst).goStructureDeclaration(decl)
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
            const decl = D.struct(name, type.args.map(it => ({ name: monoName(it), type: it })))
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
