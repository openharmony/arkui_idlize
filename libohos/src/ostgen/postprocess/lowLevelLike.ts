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

import { Hs, D, DD, E, IdentityTransformer, lw, Md, Op, std, T, Ts, utils } from "../../ost";
import { throwError } from "../engine/utils";
import { generatorConfiguration, zipStrip } from "@idlizer/core";
import { mergeStructs } from "./postprocess";
import { Builders } from "../../ost/builders";
import { cApiName, implName } from "../producers/common";

export function postprocess(decls: lw.LWDeclaration[]): Map<string, lw.LWDeclaration[]> {
    decls = mergeStructs(decls)
    decls = introduceOptionalTypes(decls)
    decls = specializeGenerics(decls)
    decls = makeApis(decls)
    decls = makeForwardDeclarations(decls)
    return aliasTypes(decls)
}

class MakeOptional extends IdentityTransformer {
    override goStructureDeclaration(decl: lw.StructureDeclaration): lw.StructureDeclaration {
        decl.members.forEach(field => {
            if (field.modifiers?.includes(Md.optional()))
                field.type = T.c('idlize.Opt', field.type)
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

class MakeInstance extends IdentityTransformer {
    constructor(
        private subst: Map<string, lw.LWType>
    ) { super() }

    goConstType(type: lw.ConstType): lw.LWType {
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

class MakeMono extends IdentityTransformer {
    private index = new Map<string, lw.LWDeclaration>()
    private newDecls: lw.LWDeclaration[] = []
    constructor(
        decls: lw.LWDeclaration[]
    ) {
        super()
        decls.forEach(decl => {
            this.index.set(decl.name, decl)
        })

        // known special types
        this.index.set(
            'idlize.Array',
            DD({ generics: [{ name: 'T' }] }).struct('synthetic.mono.Array', [
                { name: 'length', type: Ts.prim.i32 },
                { name: 'value', type: Ts.ptr(T.c('T')) }
            ])
        )
        this.index.set(
            'idlize.Map',
            DD({ generics: [{ name: 'K' }, { name: 'V' }] }).struct('synthetic.mono.Map', [
                { name: 'length', type: Ts.prim.i32 },
                { name: 'keys', type: Ts.ptr(T.c('K')) },
                { name: 'values', type: Ts.ptr(T.c('V')) },
            ])
        )
        this.index.set(
            'idlize.Opt',
            DD({ generics: [{ name: 'T' }] }).struct('synthetic.mono.Optional', [
                { name: 'tag', type: Ts.prim.tag },
                { name: 'value', type: T.c('T') },
            ])
        )
    }
    private makeSpecializedArgName(type: lw.LWType): string {
        switch (type.kind) {
            case lw.LWKind.ConstType: return type.name.split('.').pop()!
            case lw.LWKind.AppType: throw new Error("")
            case lw.LWKind.FuncType: throw new Error("")
        }
    }
    private makeSpecializedName(name: string, args: lw.LWType[]): string {
        return `synthetic.mono.instance.${name}_${args.map(it => this.makeSpecializedArgName(it)).join('_')}`
    }
    private specialize(name: string, args: lw.LWType[]): lw.LWType {
        const decl = this.index.get(name) ?? throwError(`Not found! "${name}"`)
        switch (decl.kind) {
            case lw.LWKind.StructureDeclaration: {
                const specialName = this.makeSpecializedName(name, args)
                if (!this.index.has(specialName)) {
                    const subst = new Map<string, lw.LWType>()
                    zipStrip(args, decl.generics).forEach(([arg, gen]) => {
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
        }
        throw new Error(`Unsupported generic declaration "${name}" of kind "${lw.LWKind[decl.kind]}"`)
    }

    goAppType(type: lw.AppType): lw.LWType {
        const processed = super.goAppType(type) as lw.AppType
        if (processed.head.startsWith('@') || processed.head.startsWith('#')) {
            return processed
        }
        return this.specialize(processed.head, processed.args)
    }

    go(decls:lw.LWDeclaration[]): lw.LWDeclaration[] {
        return decls.map(decl => this.goDeclaration(decl))
            .concat(this.newDecls)
    }
}

function specializeGenerics(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    return new MakeMono(decls).go(decls)
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
            .funcType().returns(Ts.const(Ts.ptr(T.cc(decl.name)))).$().$()
        // modifier implementation
        const modifierImpl = Builders.func(modifierImplName)
            .returns(Ts.const(Ts.ptr(T.cc(decl.name))))
            .block()
                .decl('instance', T.cc(decl.name)).static().value()
                    .ctor().asStruct().args(
                        decl.members.map(it => E.unary(Op.ref, E.v(it.name + 'Impl')))).$().$().$()
                .return().valueExpr(E.unary(Op.ref, E.v('instance'))).$().$().$()
        modifierImpls.push(modifierImpl)
        // modifier implementation pointer in the API implementation struct
        apiImpls.push(E.unary(Op.ref, E.v(modifierImplName, [Hs.isType()])))
    })
    // API implementation function
    const apiImpl = Builders.func(implName(`Get${generatorConfiguration().moduleName.toUpperCase()}APIImpl`))
        .returns(Ts.const(Ts.ptr(T.cc(apiStructName))))
        .param('version').type(Ts.prim.i32).$()
        ///extern "C"
        .block()
            .decl('api', T.cc(apiStructName)).static().value()
                .ctor().asStruct().args([E.c(1), ...apiImpls]).$().$().$()
            .if()
                .cond().binary(Op.ne).leftStr('version').right().access(E.v('api')).member('version').$().$().$().$()
                .then().return().valueStr('nullptr').$().$().$()
            .return().valueExpr(E.unary(Op.ref, E.v('api'))).$().$().$()
    return [...decls, apiStruct.$(), ...modifierImpls, apiImpl]
}

function makeForwardDeclarations(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const [forward, typedefs, structs] = decls.reduce<[lw.LWDeclaration[], lw.LWDeclaration[], lw.LWDeclaration[]]>(
        ([fwd, tdef, str], decl) => {
            if (decl.kind == lw.LWKind.StructureDeclaration) {
                str.push(decl)
                fwd.push(D.type(decl.name, Ts.struct(T.cc(decl.name))))
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
        const p = (type: string) => this.ShortPrefix + type
        ///doesn't belong here, should be in cxx printer
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
            case std.names.types.returnBuffer: return 'KInteropReturnBuffer'
            case std.names.types.serializerBuffer: return 'KSerializerBuffer'
            case std.names.types.string: return p('String')
            case std.names.types.u8: return p('Int8')
            case std.names.types.u32: return p('UInt32')
            case std.names.types.u64: return p('UInt64')
            case std.names.types.tag: return p('Tag')
            case std.names.types.void: return 'void'
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
    override goConstType(type: lw.ConstType): lw.LWType {
        return T.cc(this.goTypeName(type.name))
    }
    override goEnumDeclaration(decl: lw.EnumDeclaration): lw.EnumDeclaration {
        decl = super.goEnumDeclaration(decl)
        decl.name = this.goTypeName(decl.name)
        return decl
    }
    override goUnionDeclaration(decl: lw.UnionDeclaration): lw.UnionDeclaration {
        decl = super.goUnionDeclaration(decl)
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
        expr = super.goVariableExpression(expr)
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
