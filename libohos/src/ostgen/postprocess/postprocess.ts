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

import { hashCodeFromString } from "@idlizer/core";
import { D, DD, lw, std } from "../../ost";
import { Builders } from "../../ost/builders";
import { C_API_PREFIX } from "../producers/common";
import { EnumDeclaration, Modifier } from "../../ost/lws";

export function mergeStructs(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const index = new Map<string, (lw.ClassDeclaration | lw.StructureDeclaration)[]>()
    const others: lw.LWDeclaration[] = []
    decls.forEach(decl => {
        if (decl.kind !== lw.LWKind.ClassDeclaration && decl.kind !== lw.LWKind.StructureDeclaration) {
            others.push(decl)
            return
        }
        if (decl.generics.length > 0) {
            return
        }
        if (!index.has(decl.name)) {
            index.set(decl.name, [])
        }
        index.get(decl.name)?.push(decl)
    })

    const merged: lw.LWDeclaration[] = []
    index.forEach((records, name) => {
        if (records.length === 0) {
            return
        }
        if (records.length === 1) {
            merged.push(records[0])
            return
        }
        const modifiers: Modifier[] = []
        const fields: lw.StructureDeclaration['members'] = []
        const methods: lw.FunctionDeclaration[] = []
        const implementations: lw.LWType[] = []
        let base: lw.LWType | undefined
        const kind = 'class'
        records.forEach(rec => {
            if (rec.kind === lw.LWKind.ClassDeclaration) {
                rec.modifiers.forEach(mod => {
                    if (!modifiers.find(m => m.name === mod.name)) {
                        modifiers.push(mod)
                    }
                })
                fields.push(...rec.fields)
                methods.push(...rec.methods)
                implementations.push(...rec.oop?.implementations ?? [])
                if (rec.oop?.base)
                    base = rec.oop.base
            } else {
                fields.push(...rec.members)
            }
        })
        merged.push(methods.length
            ? DD({ modifiers: modifiers.slice() }).class(name, fields, methods, { base, implementations, kind })
            : D.struct(name, fields))
    })
    return [...merged, ...others]
}
export function mergeEnums(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const index = new Map<string, lw.EnumDeclaration[]>()
    const others: lw.LWDeclaration[] = []
    decls.forEach(decl => {
        if (decl.kind !== lw.LWKind.EnumDeclaration) {
            others.push(decl)
            return
        }
        if (!index.has(decl.name)) {
            index.set(decl.name, [])
        }
        index.get(decl.name)?.push(decl)
    })
    const merged: lw.LWDeclaration[] = []
    index.forEach((decls, name) => {
        if (decls.length === 1) {
            merged.push(decls[0])
            return
        }
        const members: EnumDeclaration['members'] = []
        const modifiers: Modifier[] = []
        decls.forEach(decl => {
            members.push(...decl.members)
            decl.modifiers.forEach(mod => {
                if (!modifiers.find(x => x.name === mod.name && x.kind === mod.kind)) {
                    modifiers.push(mod)
                }
            })
        })
        merged.push({
            kind: lw.LWKind.EnumDeclaration,
            generics: decls[0].generics,
            members,
            modifiers,
            name
        })
    })
    return [...merged, ...others]
}

export function monoName(type: lw.LWType, prefix: string = C_API_PREFIX): string {
    prefix += '.synthetic.mono.instance.'
    if (type.kind === lw.LWKind.HoleType) {
        throw new Error("WAS NOT PROCESSED PROPERLY")
    }
    if (type.kind === lw.LWKind.FunctionalType)
        return [
            prefix + 'Callback',
            ...type.params.map(p => monoName(p.type)),
            monoName(type.returnType)
        ].join('_')
    switch (type.name) {
        case std.names.types.constant:
        case std.names.types.pointer:
        case std.names.types.reference:
        case std.names.types.struct:
            return monoName(type.args[0])
        case std.names.types.array:
            return [prefix + 'Array', monoName(type.args[0])].join('_')
        case std.names.types.map:
            return [prefix + 'Map', ...type.args.map(ty => monoName(ty))].join('_')
        case std.names.types.optional:
            return [prefix + 'Opt', monoName(type.args[0])].join('_')
        case std.names.types.union:
            return [prefix + 'Union', ...type.args.map(ty => monoName(ty))].join('_')
        default:
            return type.name.split('.').pop()!
    }
}

export function callbackKindDeclaration(callers: string[], nameFunc: (base: string) => string) {
    return Builders.enum(nameFunc('CallbackKind'))
        .members(callers.map(it => {
            const name = 'KIND_' + it.toUpperCase();
            return { name, value: hashCodeFromString(name) }
        })).$()
}
