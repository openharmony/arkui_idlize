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

import { snakeCaseToCamelCase, moduleName, Language } from "@idlizer/core";
import { Builders, E, Hs, lw, Md, Op, std, Ts } from "@idlizer/ost"
import { managedName } from "../producers/common.js";
import { callbackKindDeclaration } from "./postprocess.js";
import { peerGeneratorConfiguration } from "../../DefaultConfiguration.js";
import { moduleLike } from "@idlizer/kit";
export function postprocess(decls: lw.LWDeclaration[], nativeModuleName: string, callbacks: string[], language: Language): lw.LWDeclaration[] {
    decls = moduleLike.postprocess(decls)
    decls = introduceCallbackCaller(decls, callbacks)
    decls = loadNativeModule(decls, nativeModuleName, language)
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

function loadNativeModule(decls: lw.LWDeclaration[], nativeModuleName: string, language: Language): lw.LWDeclaration[] {
    const nativeModule = decls.find(it => it.name == nativeModuleName) as lw.ClassDeclaration
    const args = [`"${moduleName('NativeModule')}"`]
    if (language != Language.TS) {
        nativeModule.methods.unshift(
            Builders.func(std.names.members.staticCtor).static().block()
                .call('loadNativeModuleLibrary')
                .args(args.map(it => E.c(it)))
                .$().$().$())
        return decls
    }
    args.push(`${moduleName('NativeModule')}`)
    nativeModule.fields.unshift(
        { name: '_isLoaded', type: Ts.prim.boolean, modifiers: [Md.static()], expression: E.c('false') })
    nativeModule.methods.unshift(
        Builders.func('_LoadOnce').static().returns(Ts.prim.boolean).block()
            .if().condition(E.unary(Op.not, E.c('this._isLoaded')))
            .then().block()
            .assign('this._isLoaded').value(E.c('true')).$()
            .call('loadNativeModuleLibrary')
            .args(args.map(it => E.c(it))).$()
            .return().value(E.c('true')).$()
            .$().$().$()
            .return().value(E.c('false')).$()
            .$().$()
        )
    return decls
}
