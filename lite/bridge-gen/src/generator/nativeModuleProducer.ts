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
import { DD, E, Hs, lw, Md, Modifier, S } from "@idlizer/ost"
import { GenerationLibrary } from "./common"
import { TwinFunctionCallSeed } from "./seed"
import { TypedProducer } from "@idlizer/kit"

export interface GeneratedNativeModule {
    nativeModuleName: string
    methods: {
        original: idl.IDLMethod,
        nativeBridgeFunction: lw.FunctionDeclaration
    }[]
}

///

export const nativeModuleProducer: TypedProducer<TwinFunctionCallSeed, GenerationLibrary, GeneratedNativeModule> = (seed, ctx) => {
    const method = seed.method
    const methodFQ = idl.getFQName(method)
    const nmName = ctx.getEffect().nativeModuleName
    const interopFunctionName = '_' + methodFQ.split('.').join('_')
    const parameters: lw.FunctionDeclaration['parameters'] = seed.twinDeclaration.parameters.map(param => ({ ...param }))
    ctx.updateEffect(module => {
        module.methods.push({
            original: seed.method,
            nativeBridgeFunction: seed.twinDeclaration,
        })
    })

    const nativeModuleModifiers: Modifier[] = []
    if (ctx.library.target === 'node') {
        nativeModuleModifiers.push(Md.declare())
    }

    const methodModifiers: Modifier[] = []
    methodModifiers.push(Md.static())
    if (ctx.library.target === 'panda') {
        methodModifiers.push(Md.native())
    }

    return {
        continuation: E.get(E.v(nmName, [Hs.isType()]), interopFunctionName),
        declarations: [
            DD({ modifiers: nativeModuleModifiers }).class(nmName, [], [
                DD({ modifiers: methodModifiers }).func(interopFunctionName, parameters, seed.twinDeclaration.returnType, S.none())
            ])
        ]
    }
}

///

///

export interface DividedResult {
    hostDeclarations: lw.LWDeclaration[]
    wrapperDeclarations: lw.LWDeclaration[]
    nativeModuleName: string,
}
