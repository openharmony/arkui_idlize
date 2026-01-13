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
import { E, Hs, DD, Md, S, Ts } from "@idlizer/ost"
import { ProducerContext, ProducerResult } from "@idlizer/kit"
import { isInterface } from "@idlizer/core/idl"
import { GenerationLibrary } from "../../generator/common"
import { MakeApiOptions } from "../../generator/generator"
import { ApiSeedType, Ask } from "../../generator/seed"

function makeFreeFunctionApiCall(req: ApiSeedType, _: ProducerContext<GenerationLibrary, undefined>, options: MakeApiOptions): ProducerResult {
    const nameTokens = [req.method.name]
    if (req.method.parent && isInterface(req.method.parent)) {
        nameTokens.unshift(req.method.parent.name)
    }
    const functionName = req.method.extendedAttributes?.find(x => x.name === 'Name')?.value ?? nameTokens.join('_')
    const callBase = options.noReceiver ? E.v(functionName) : E.get(E.call(E.v('getAPI'), [], [], [Hs.ptrVal()]), functionName)
    return {
        continuation: E.call(callBase, req.arguments),
        declarations: (options.noHeader && options.noReceiver) ? [
            DD({ modifiers: [Md.externC()] }).func(functionName, req.apiCallParams, req.apiReturnType, S.none())
        ] : []
    }
}

function makeInstanceClassApiCall(req: ApiSeedType, ctx: ProducerContext<GenerationLibrary, undefined>, options: MakeApiOptions): ProducerResult {
    if (req.method.parent && isInterface(req.method.parent)) {
        if (req.method.isStatic) {
            return {
                continuation:  E.call(E.get(E.type(Ask.typeName(req.method.parent)), req.method.name), req.arguments),
                declarations: []
            }
        }
        return {
            continuation: E.call(E.get(E.cast(req.arguments[0], Ts.ptr(Ask.typeName(req.method.parent)), [Hs.ptrVal()]), req.method.name), req.arguments.slice(1)),
            declarations: []
        }
    }
    return makeFreeFunctionApiCall(req, ctx, { ...options, noReceiver: true })
}

export function makeApiCall(kind:'freeFunctions' | 'classesInstances'): typeof makeFreeFunctionApiCall {
    switch (kind) {
        case 'freeFunctions': return makeFreeFunctionApiCall
        case 'classesInstances': return makeInstanceClassApiCall
    }
}
