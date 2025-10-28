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

import { Builders } from "../../ost/builders";
import { D, IdentityTransformer, lw, std, T, utils } from "../../ost";
import { ImportsCollector } from "../../peer-generation/ImportsCollector";
import { mapFileName, moduleName, nativeModuleName } from "../engine/utils";
import { managedName } from "../producers/common";
import { mergeStructs } from "./postprocess";

export function postprocess(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    decls = mergeNamespaces(decls)
    decls = mergeStructs(decls)
    decls = introduceTypeChecker(decls)
    decls = loadNativeModule(decls)
    return decls
}

function introduceTypeChecker(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    ///arkts only
    return decls.concat(Builders.class(managedName('engine.TypeChecker')).$())
}

function loadNativeModule(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const name = nativeModuleName();
    const nativeModule = decls.find(it => it.name == name) as lw.ClassDeclaration
    nativeModule.methods.unshift(
        Builders.func('').static().block()
            .call().functionName('loadNativeModuleLibrary').arg(`"${moduleName('NativeModule')}"`).$().$().$().$())
    return decls
}

function mergeNamespaces(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const index = new Map<string, lw.NamespaceDeclaration[]>()
    const others: lw.LWDeclaration[] = []
    decls.forEach(decl => {
        if (decl.kind !== lw.LWKind.NamespaceDeclaration) {
            others.push(decl)
            return
        }
        if (!index.has(decl.name)) {
            index.set(decl.name, [])
        }
        index.get(decl.name)?.push(decl)
    })

    const result: lw.LWDeclaration[] = others
    index.forEach((records, name) => {
        if (records.length === 0) {
            return
        }
        if (records.length === 1) {
            result.push(records[0])
            return
        }
        result.push(D.ns(name, mergeNamespaces(records.map(r => r.members).flat())))
    })
    return result
}

/////////////////////////////////////////////////////

interface ResultFile {
    moduleLikeImports: ImportsCollector
    body: lw.LWDeclaration[]
}

class RefSearcher extends IdentityTransformer {
    private seenNames: Map<string, string[]>
    constructor(
        private decls: lw.LWDeclaration[],
        private fileName: string,
        private registry: Map<string, string>,
        private imports: ImportsCollector
    ) {
        super()
        this.seenNames = new Map(decls.map(it => [it.name, ['.']]))
    }

    private nsStack: string[] = []
    private trimNs(name:string): string {
        const prefix = this.nsStack.join('.') + '.'
        if (name.startsWith(prefix)) {
            return name.substring(prefix.length)
        }
        return name
    }
    goNamespaceDeclaration(decl: lw.NamespaceDeclaration): lw.NamespaceDeclaration {
        this.nsStack.push(decl.name)
        const r = super.goNamespaceDeclaration(decl)
        this.nsStack.pop()
        return r
    }

    private getBase(name:string) {
        return name.split('.').at(0)!
    }

    private goTypeName(name: string): string {
        if (name.startsWith('@'))
            return name
        const record = this.registry.get(name)
        if (record) {
            let val = name
            if (val.startsWith(record)) {
                val = val.substring(record.length)
                while (val.startsWith('.')) {
                    val = val.substring(1)
                }
            }
            if (record === this.fileName)
                return this.trimNs(val)
            const baseName = this.getBase(val);
            const source = mapFileName(record)
            const conflictingNames = this.seenNames.get(baseName)
            if (conflictingNames) {
                const alias = source + '_' + baseName
                if (!conflictingNames.includes(source)) {
                    conflictingNames.push(source)
                    this.imports.addFeature(baseName, source, alias)
                }
                return this.trimNs(conflictingNames[0] === source ? val : alias)
            } else {
                this.seenNames.set(baseName, [source])
                this.imports.addFeature(baseName, source)
                return this.trimNs(val)
            }
        }
        return this.trimNs(name)
    }
    override goValueType(type: lw.ValueType): lw.LWType {
        return type.name.startsWith('@')
            ? super.goValueType(type)
            : T.c(this.goTypeName(type.name), ...type.args.map(t => this.goType(t)))
    }
    override goConstructorExpression(expr: lw.ConstructorExpression): lw.ConstructorExpression {
        expr = super.goConstructorExpression(expr)
        expr.name = this.goTypeName(expr.name)
        return expr
    }
    override goVariableExpression(expr: lw.VariableExpression): lw.VariableExpression {
        expr = super.goVariableExpression(expr) as lw.VariableExpression
        if (utils.hasHint(expr, std.names.hints.isType))
            expr.name = this.goTypeName(expr.name)
        return expr
    }
    go(): lw.LWDeclaration[] {
        return this.decls.map(it => this.goDeclaration(it))
    }
}

function putToNs(declarations:lw.LWDeclaration[]): lw.LWDeclaration[] {
    const index = new Map<string, lw.LWDeclaration[]>()
    const result: lw.LWDeclaration[] = []
    declarations.forEach(decl => {
        const clause = decl.name.split('.')
        if (clause.length === 1) {
            result.push(decl)
            return
        }
        const [base, ...rest] = clause
        if (!index.has(base)) {
            index.set(base, [])
        }
        // TODO: clone!!!
        decl.name = rest.join('.')
        index.get(base)?.push(decl)
    })

    index.forEach((decls, name) => {
        result.push(D.ns(name, putToNs(decls)))
    })
    return result
}

export function formFiles(knownPackages: Set<string>, declarations: lw.LWDeclaration[]): Map<string, ResultFile> {

    // form files
    const files = new Map<string, lw.LWDeclaration[]>()
    const refIndex = new Map<string, string>()
    declarations.forEach(decl => {
        const chunks = decl.name.split('.')
        const clause: string[] = []
        while (chunks.length) {
            clause.push(chunks.shift()!)
            const prefix = clause.join('.')
            if (knownPackages.has(prefix)) {
                if (!files.has(prefix)) {
                    files.set(prefix, [])
                }
                // TODO: clone!!!!
                refIndex.set(decl.name, prefix)
                decl.name = chunks.join('.')
                files.get(prefix)?.push(decl)
                return
            }
        }

        if (!files.has('other')) {
            files.set('other', [])
        }
        files.get('other')?.push(decl)
    })

    // do namespace stuff
    const nsFiles = new Map<string, ResultFile>()
    files.forEach((decls, fileName) => {
        const imports = defaultImports()
        const nsDecls = new RefSearcher(putToNs(decls), fileName, refIndex, imports).go()
        nsFiles.set(fileName, {
            moduleLikeImports: imports,
            body: nsDecls
        })
    })

    return nsFiles
}

function defaultImports(): ImportsCollector {
    const imports = new ImportsCollector()
    imports.addFeatures([
        'SerializerBase', 'DeserializerBase',
        'MaterializedBase', 'Finalizable', 'KPointer', 'toPeerPtr',
        'loadNativeModuleLibrary',
    ], '@koalaui/interop')
    return imports
}
