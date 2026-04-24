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
import { E, Hs, DD, Md, Ts, D, T } from "@idlizer/ost"
import { ProducerResult, Seed } from "@idlizer/kit"
import { isInterface } from "@idlizer/core/idl"
import { ApiCallSeed } from "../../generator/seed"
import { makeDeclarationProducer } from "../../generator/builder"

class GetApiSeed extends Seed {
    hash(): string { return 'capi.getAPI' }
}
export const [getApiProducer, getApiProducerSeed] = makeDeclarationProducer(
        GetApiSeed,
        () => ({
            continuation: E.v('_getAPI'),
            declarations: [
                DD({ modifiers: [Md.externC()] }).func('capi.getAPI', [], Ts.ptr(T.c('capi.GENERATED_Api')))
            ]
        })
    )

function makeFreeFunctionApiCall(req: ApiCallSeed): ProducerResult {
    const nameTokens = [req.method.name]
    if (req.method.parent && isInterface(req.method.parent)) {
        nameTokens.unshift(req.method.parent.name)
    }
    const functionName = nameTokens.join('_')
    const callBase = E.get(E.call(getApiProducerSeed.createExpr(), [], [], [Hs.ptrVal()]), functionName)
    return {
        continuation: E.call(callBase, req.callArgs),
        declarations: [
            D.struct('capi.GENERATED_Api', [{
                name: functionName,
                type: T.fn(req.apiCallParams.map(p => ({ name: p.name, type: p.type })), req.apiReturnType)
            }])
        ]
    }
}

export function makeKoalaApiCall(): typeof makeFreeFunctionApiCall {
    return makeFreeFunctionApiCall
}
