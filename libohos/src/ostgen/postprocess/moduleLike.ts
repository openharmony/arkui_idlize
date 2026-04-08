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
import { Builders, E, Hs, lw, std } from "@idlizer/ost"
import { moduleName } from "../engine/utils.js";
import { managedName } from "../producers/common.js";
import { callbackKindDeclaration } from "./postprocess.js";
import { peerGeneratorConfiguration } from "../../DefaultConfiguration.js";
import { moduleLike } from "@idlizer/kit";
import { collectTypecheckDeclarations } from "../producers/managed/typecheck.js";

export function postprocess(decls: lw.LWDeclaration[], nativeModuleName: string, callbacks: string[]): lw.LWDeclaration[] {
    decls = moduleLike.postprocess(decls)
    decls = introduceCallbackCaller(decls, callbacks)
    decls = introduceTypeChecker(decls)
    decls = loadNativeModule(decls, nativeModuleName)
    return decls
}

function introduceCallbackCaller(decls: lw.LWDeclaration[], callbacks: string[]): lw.LWDeclaration[] {
    const callbackKindEnum = callbackKindDeclaration(callbacks, s => managedName('engine.' + s))
    const caller = Builders.func(managedName('engine.deserializeAndCallCallback'))
        .param('deserializer').type('DeserializerBase').$()
        .block()
            .decl('kind').value().call('readInt32').receiver('deserializer').$().$().$()
            .switch()
                .selector().call('fromValue').receiver('CallbackKind').arg('kind').$().$()
                .cases(callbacks.map(it => { return {
                    value: E.c('CallbackKind.' + it.toUpperCase()),
                    body: [
                        Builders.return().call(E.v('deserializeAndCall' + it)).arg('deserializer').$().$()
                    ]
                }})).$().$().$()
            // Improve: throw new Error('Unknown callback kind')
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
    const typecheckDecls = collectTypecheckDeclarations()
    // Merge all TypeChecker class declarations into a single class
    const typeCheckerName = managedName('engine.TypeChecker')
    const allMethods: lw.FunctionDeclaration[] = []
    const seenMethods = new Set<string>()
    for (const decl of typecheckDecls) {
        if (decl.kind === lw.LWKind.ClassDeclaration && decl.name === typeCheckerName) {
            for (const method of (decl as lw.ClassDeclaration).methods) {
                if (!seenMethods.has(method.name)) {
                    seenMethods.add(method.name)
                    allMethods.push(method)
                }
            }
        }
    }
    const typeCheckerClass = Builders.class(typeCheckerName)
        .methods(allMethods).$()
    return decls.concat(typeCheckerClass)
}

function loadNativeModule(decls: lw.LWDeclaration[], nativeModuleName: string): lw.LWDeclaration[] {
    const nativeModule = decls.find(it => it.name == nativeModuleName) as lw.ClassDeclaration
    nativeModule.methods.unshift(
        Builders.func(std.names.members.staticCtor).static().block()
            .call('loadNativeModuleLibrary').arg(`"${moduleName('NativeModule')}"`).$().$().$())
    return decls
}
