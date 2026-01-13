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

import { Hs, D, DD, E, IdentityTransformer, lw, Op, std, T, Ts, utils } from "../../ost";
import { generatorConfiguration, zipStrip } from "@idlizer/core";
import { callbackKindDeclaration, mergeEnums, mergeStructs, monoName } from "./postprocess";
import { Builders } from "../../ost/builders";
import { bridgeName, cApiName, implName } from "../producers/common";

export function postprocess(decls: lw.LWDeclaration[]): Map<string, lw.LWDeclaration[]> {
    decls = mergeStructs(decls)
    decls = mergeEnums(decls)
    // decls = introduceOptionalTypes(decls)
    // decls = introduceCallbackCaller(decls)
    // decls = monomorphizeGenerics(decls)
    // decls = monomorphizeAlgebraicTypes(decls)
    // decls = makeApis(decls)
    decls = makeForwardDeclarations(decls)
    return aliasTypes(decls)
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

function makeApis(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const apiStructName = cApiName('modifier.API')
    const apiStruct = Builders.struct(apiStructName)
        .field('version').type(Ts.prim.i32).$()
    const modifiers = decls
        .filter(it => it.name.startsWith('capi.modifier'))
        .map(it => it as lw.StructureDeclaration)
    const modifierImpls: lw.FunctionDeclaration[] = []
    const apiImpls: lw.LWExpression[] = []
    modifiers.forEach(decl => {
        // modifier field in the API struct
        const className = decl.name.split('.').pop()!.replace(/Modifier$/, '');
        const modifierImplName = implName(decl.name + 'Impl');
        apiStruct.field(className)
            .funcType().returns(Ts.const(Ts.ptr(T.c(decl.name)))).$().$()
        // modifier implementation
        const modifierImpl = Builders.func(modifierImplName)
            .returns(Ts.const(Ts.ptr(T.c(decl.name))))
            .block()
                .decl('instance', T.c(decl.name)).static().value()
                    .ctor().asStruct().args(
                        decl.members.map(it => E.unary(Op.ref, E.v(it.name + 'Impl')))).$().$().$()
                .return().value(E.unary(Op.ref, E.v('instance'))).$().$().$()
        modifierImpls.push(modifierImpl)
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

function makeForwardDeclarations(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const [forward, typedefs, structs] = decls.reduce<[lw.LWDeclaration[], lw.LWDeclaration[], lw.LWDeclaration[]]>(
        ([fwd, tdef, str], decl) => {
            if (decl.kind == lw.LWKind.StructureDeclaration) {
                str.push(decl)
                fwd.push(D.type(decl.name, Ts.struct(T.c(decl.name))))
            } else {
                tdef.push(decl)
            }
            return [fwd, tdef, str]
        }, [[], [], []])
    return [...forward, ...typedefs, ...structs]
}

class TypeAliasing extends IdentityTransformer {
    private readonly ShortPrefix = generatorConfiguration().TypePrefix
    private readonly LongPrefix = this.ShortPrefix + generatorConfiguration().moduleName.toUpperCase() + '_'
    private conflicts: Set<string> = new Set()

    private goTypeName(name: string): string {
        const p = (typeName: string) => this.ShortPrefix + typeName
        switch (name) {
            case std.names.types.auto: return 'auto'
            case std.names.types.bigint: return p('Int64')
            case std.names.types.boolean: return p('Boolean')
            case std.names.types.buffer: return p('Buffer')
            case std.names.types.f32: return p('Float32')
            case std.names.types.f64: return p('Float64')
            case std.names.types.i8: return p('Int8')
            case std.names.types.i32: return p('Int32')
            case std.names.types.i64: return p('Int64')
            case std.names.types.number: return p('Number')
            case std.names.types.nativePointer: return p('NativePointer')
            case std.names.types.object: return p('Object')
            case std.names.types.serializerBuffer: return 'KSerializerBuffer'
            case std.names.types.string: return p('String')
            case std.names.types.u8: return p('UInt8')
            case std.names.types.u32: return p('UInt32')
            case std.names.types.u64: return p('UInt64')
            case std.names.types.tag: return p('Tag')
            case std.names.types.void: return 'void'
            case std.names.types.interopNumber: return 'KInteropNumber'
            case std.names.types.interopString: return 'KStringPtr'
            case std.names.types.interopReturnBuffer: return 'KInteropReturnBuffer'
            default:
                if (name.startsWith('@'))
                    throw new Error('Unhandled builtin type: ' + name)
        }
        const path = name.split('.')
        if (path.length === 1)
            return name
        const prefix = path.shift()
        const typeName = this.conflicts.has(name)
            ? path.join('_')
            : path[path.length - 1]
        return prefix === 'capi' ? this.LongPrefix + typeName : typeName
    }
    override goValueType(type: lw.ValueType): lw.LWType {
        return type.args.length === 0
            ? T.c(this.goTypeName(type.name))
            : super.goValueType(type)
    }
    override goEnumDeclaration(decl: lw.EnumDeclaration): lw.EnumDeclaration {
        decl = super.goEnumDeclaration(decl)
        decl.name = this.goTypeName(decl.name)
        return decl
    }
    override goStructureDeclaration(decl: lw.StructureDeclaration): lw.StructureDeclaration {
        decl = super.goStructureDeclaration(decl)
        decl.name = this.goTypeName(decl.name)
        return decl
    }
    override goClassDeclaration(decl: lw.ClassDeclaration): lw.ClassDeclaration {
        decl = super.goClassDeclaration(decl)
        decl.name = this.goTypeName(decl.name)
        return decl
    }
    override goTypedefDeclaration(decl: lw.TypedefDeclaration): lw.TypedefDeclaration {
        decl = super.goTypedefDeclaration(decl)
        decl.name = this.goTypeName(decl.name)
        return decl
    }
    override goFunctionDeclaration(decl: lw.FunctionDeclaration): lw.FunctionDeclaration {
        decl = super.goFunctionDeclaration(decl)
        decl.name = this.goTypeName(decl.name)
        return decl
    }
    override goVariableExpression(expr: lw.VariableExpression): lw.VariableExpression {
        expr = super.goVariableExpression(expr) as lw.VariableExpression
        expr.name = utils.hasHint(expr, std.names.hints.isType)
            ? this.goTypeName(expr.name)
            : expr.name
        return expr
    }
    go(decls: lw.LWDeclaration[]) {
        const seenNames: Map<string, string[]> = new Map()
        decls.forEach(decl => {
            const path = decl.name.split('.')
            let name = path[path.length - 1]
            const conflictingNames = seenNames.get(name)
            if (conflictingNames) {
                if (!conflictingNames.includes(decl.name))
                    conflictingNames.push(decl.name)
            } else {
                seenNames.set(name, [decl.name])
            }
        })
        this.conflicts = new Set(
            Array.from(seenNames.entries())
                .filter(([_, names]) => names.length > 1)
                .flatMap(([_, names]) => names))
        const files: Map<string, lw.LWDeclaration[]> = new Map()
        decls.forEach(decl => {
            const file = decl.name.split('.').shift()!
            const content = files.get(file)
            const image = this.goDeclaration(decl)
            if (!content)
                files.set(file, [image])
            else
                content.push(image)
        })
        return files
    }
}

function aliasTypes(decls: lw.LWDeclaration[]): Map<string, lw.LWDeclaration[]> {
    return new TypeAliasing().go(decls)
}
