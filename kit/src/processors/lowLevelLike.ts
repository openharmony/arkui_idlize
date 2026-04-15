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

import { D, IdentityTransformer, lw, std, T, Ts, utils } from "@idlizer/ost";
import { camelCaseToUpperSnakeCase, generatorConfiguration } from "@idlizer/core";
import { mergeEnums, mergeStructs } from "./utils.js";

export function postprocess(decls: lw.LWDeclaration[]): Map<string, lw.LWDeclaration[]> {
    decls = mergeStructs(decls)
    decls = mergeEnums(decls)
    decls = makeForwardDeclarations(decls)
    return aliasTypes(decls)
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
        ///split into type & func
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
            case std.names.types.exception: return p('Exception')
            case std.names.types.u8: return p('UInt8')
            case std.names.types.u32: return p('UInt32')
            case std.names.types.u64: return p('UInt64')
            case std.names.types.tag: return p('Tag')
            case std.names.types.undefined: return p('///Undefined')
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
        const memberPrefix = camelCaseToUpperSnakeCase(decl.name)
        for (const m of decl.members)
            m.name = memberPrefix + '_' + m.name
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
        if (utils.hasHint(expr, std.names.hints.isType))
            expr.name = this.goTypeName(expr.name)
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
