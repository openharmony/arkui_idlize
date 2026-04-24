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

import * as idl from "@idlizer/core/idl"
import { generatorConfiguration } from "@idlizer/core"
import { readdirSync, statSync } from "node:fs"
import { join } from "node:path"
import { DD, D, EnumDeclaration, lw, Modifier } from "@idlizer/ost"

export function throwError(msg:string): never {
    throw new Error(msg)
}

export function scan(root: string): string[] {
  return statSync(root).isDirectory()
    ? readdirSync(root).flatMap(p => scan(join(root, p)))
    : [root]
}

export function mkName(...chunks:string[]): string {
  return chunks.join('.')
}

export function mapFileName(name: string): string {
  return name
      .replace(/^managed\./, '')
      .replace(/^native\./, '')
      .replace(/^engine/, generatorConfiguration().moduleName + '.INTERNAL')
}

export function moduleName(suffix?: string): string {
  return generatorConfiguration().moduleName.toUpperCase() + (suffix ?? '')
}

export function fqName(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor, prefix?: string, postfix?: string): string {
  const fqn = idl.isConstructor(node)
    ? idl.getFQName(node.parent as idl.IDLInterface) + '_construct'
    : idl.isMethod(node) && node.parent && idl.isInterface(node.parent)
      ? idl.getFQName(node.parent) + '_' + node.name
      : idl.getFQName(node)
  return (prefix ?? '') + fqn.split('.').join('_') + (postfix ?? '')
}

export function modifierClassName(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor): string {
  return idl.isInterface(node)
    ? fqName(node)
    : node.parent && idl.isInterface(node.parent)
      ? fqName(node.parent)
      : 'GlobalScope'
}

export function mergeStructs(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const index = new Map<string, (lw.ClassDeclaration | lw.StructureDeclaration)[]>()
    const others: lw.LWDeclaration[] = []
    decls.forEach(decl => {
        if (decl.kind !== lw.LWKind.ClassDeclaration && decl.kind !== lw.LWKind.StructureDeclaration) {
            others.push(decl)
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
        let kind: 'interface' | 'class' = 'interface'
        records.forEach(rec => {
            if (rec.kind === lw.LWKind.ClassDeclaration) {
                rec.modifiers.forEach(mod => {
                    if (!modifiers.find(m => m.name === mod.name)) {
                        modifiers.push(mod)
                    }
                })
                fields.push(...rec.fields)
                methods.push(...rec.methods)
                if (rec.oop) {
                    implementations.push(...rec.oop.implementations ?? [])
                    if (rec.oop.base)
                        base = rec.oop.base
                    if (rec.oop.kind === 'class')
                        kind = 'class'
                }
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
