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

import { snakeCaseToCamelCase } from "@idlizer/core";
import { Builders } from "../../ost";
import { D, E, Hs, IdentityTransformer, lw, std, T, utils } from "../../ost";
import { ImportsCollector } from "../../peer-generation/ImportsCollector";
import { mapFileName, moduleName, nativeModuleName } from "../engine/utils";
import { managedName } from "../producers/common";
import { callbackKindDeclaration, mergeStructs } from "./postprocess";
import { peerGeneratorConfiguration } from "../../DefaultConfiguration";

export function postprocess(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    decls = mergeNamespaces(decls)
    decls = mergeStructs(decls)
    // decls = introduceCallbackCaller(decls)
    // decls = introduceTypeChecker(decls)
    // decls = loadNativeModule(decls)
    return decls
}

function introduceCallbackCaller(decls: lw.LWDeclaration[]): lw.LWDeclaration[] {
    const callers = decls
        .filter(it => it.name.startsWith(managedName('engine.deserializeAndCall')))
        .map(it => it.name.replace(/^.*deserializeAndCall/, '')) ///where to take callback name from?
    const callbackKindEnum = callbackKindDeclaration(callers, s => managedName('engine.' + s))
    const caller = Builders.func(managedName('engine.deserializeAndCallCallback'))
        .param('deserializer').typeStr('DeserializerBase').$()
        .block()
            .decl('kind').value().call('readInt32').receiver('deserializer').$().$().$()
            .switch()
                .selector().call('fromValue').receiver('CallbackKind').arg('kind').$().$()
                .cases(callers.map(it => { return {
                    value: E.c(`CallbackKind.KIND_${it.toUpperCase()}`),
                    body: [
                        Builders.return().call(E.v('deserializeAndCall' + it, [Hs.isType()])).arg('deserializer').$().$()
                    ]
                }})).$().$().$()
            // TODO: throw new Error('Unknown callback kind')
    const camelCaseModuleName = snakeCaseToCamelCase(peerGeneratorConfiguration().moduleName.split(".").join("_"))
    const register = Builders.func(managedName(`engine.register${camelCaseModuleName}ApiHandler`))
        .block()
            .call('registerApiEventHandler')
                .arg('0')
                .arg('deserializeAndCallCallback').$().$().$()
    decls.push(callbackKindEnum, caller, register)
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
            .call('loadNativeModuleLibrary').arg(`"${moduleName('NativeModule')}"`).$().$().$())
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

export type OnUnknownImport = (name:string) => { name: string, source: string } | undefined

class RefSearcher extends IdentityTransformer {
    private seenNames: Map<string, string[]>
    private localNames: Set<string>[] = []
    constructor(
        private decls: lw.LWDeclaration[],
        private fileName: string,
        private registry: Map<string, string>,
        private imports: ImportsCollector,
        private knownImports?: Map<string, string>,
        private onUnknownImport?: OnUnknownImport,
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
    private mapToPackage(name:string): string {
        if (!this.knownImports) {
            return name
        }
        if (this.knownImports.has(name)) {
            return this.knownImports.get(name)!
        }
        return name
    }

    private isLocalName(name:string) {
        return !!this.localNames.find(s => s.has(name))
    }

    private goName(name: string): string {
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
            const source = this.mapToPackage(mapFileName(record))
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
        } else {
            const mapped = this.onUnknownImport?.(name)
            if (mapped) {
                this.imports.addFeature(mapped.name, mapped.source)
                return this.trimNs(mapped.name)
            }
        }
        return this.trimNs(name)
    }
    override goValueType(type: lw.ValueType): lw.LWType {
        return type.name.startsWith('@')
            ? super.goValueType(type)
            : T.c(this.goName(type.name), ...type.args.map(t => this.goType(t)))
    }
    override goConstructorExpression(expr: lw.ConstructorExpression): lw.ConstructorExpression {
        expr = super.goConstructorExpression(expr)
        if ('name' in expr.data) {
            expr.data.name = this.goName(expr.data.name)
        }
        return expr
    }
    override goVariableExpression(expr: lw.VariableExpression): lw.VariableExpression {
        expr = super.goVariableExpression(expr) as lw.VariableExpression
        if (utils.hasHint(expr, std.names.hints.isType))
            expr.name = this.goName(expr.name)
        if (!this.isLocalName(expr.name))
            expr.name = this.goName(expr.name)
        return expr
    }
    override goFunctionDeclaration(decl: lw.FunctionDeclaration): lw.FunctionDeclaration {
        const store = new Set<string>()
        decl.parameters.forEach(param => {
            store.add(param.name)
        })
        store.add(decl.name.split('.').at(-1)!)
        this.localNames.push(store)
        const r = super.goFunctionDeclaration(decl)
        this.localNames.pop()
        return r
    }
    override goCompoundStatement(stmt: lw.CompoundStatement): lw.CompoundStatement {
        const store = new Set<string>()
        this.localNames.push(store)
        const r = super.goCompoundStatement(stmt)
        this.localNames.pop()
        return r
    }
    override goDeclarationStatement(stmt: lw.DeclarationStatement): lw.DeclarationStatement {
        this.localNames.at(-1)?.add(stmt.varName)
        return super.goDeclarationStatement(stmt)
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

interface FormFilesOptions {
    knownReference:Map<string, string>
    knownImports: Map<string, string>
    onUnknownImport?: OnUnknownImport
}

export function formFiles(knownPackages: Set<string>, declarations: lw.LWDeclaration[], options?:FormFilesOptions): Map<string, ResultFile> {

    // form files
    const files = new Map<string, lw.LWDeclaration[]>()
    const refIndex = new Map<string, string>()
    if (options?.knownReference) {
        options.knownReference.forEach((val, key) => {
            refIndex.set(key, val)
        })
    }
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
        const nsDecls = new RefSearcher(putToNs(decls), fileName, refIndex, imports, options?.knownImports, options?.onUnknownImport).go()
        nsFiles.set(fileName, {
            moduleLikeImports: imports,
            body: nsDecls
        })
    })

    return nsFiles
}

function defaultImports(): ImportsCollector {
    const imports = new ImportsCollector()
    // imports.addFeatures([
    //     'KInt', 'KPointer', 'KInteropReturnBuffer', 'KSerializerBuffer',
    //     'SerializerBase', 'DeserializerBase', 'MaterializedBase',
    //     'Finalizable', 'toPeerPtr',
    //     'RuntimeType', 'ResourceHolder',
    //     'loadNativeModuleLibrary', 'registerApiEventHandler',
    // ], '@koalaui/interop')
    return imports
}
