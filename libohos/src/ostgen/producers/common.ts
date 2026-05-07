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
import { generatorConfiguration, moduleName } from "@idlizer/core"
import { LWExpression, LWType, Ts, lw } from "@idlizer/ost"
import { MakeSelector, OhosProducerContext, OhosSeed, OhosRole, OhosSeedData } from "../engine/index.js"
import { producers } from "./index.js"

export const MANAGED_PREFIX = 'managed'
export const C_API_PREFIX = 'capi'
export const BRIDGE_PREFIX = 'bridge'
export const IMPL_PREFIX = 'impl'
const HANDWRITTEN_PREFIX = '#handwritten'

export function managedName(name:string) {
    return MANAGED_PREFIX + '.' + name
}
export function cApiName(name:string) {
    return C_API_PREFIX + '.' + name
}
export function bridgeName(name:string) {
    return BRIDGE_PREFIX + '.' + name
}
export function implName(name:string) {
    return IMPL_PREFIX + '.' + name
}
export function handwrittenName(name: string) {
    return managedName(HANDWRITTEN_PREFIX + '.' + name)
}

function is(prefix:string, name:string) {
    return name.startsWith(prefix)
}
export function isManaged(name:string) {
    return is(MANAGED_PREFIX, name)
}
export function isCApi(name:string) {
    return is(C_API_PREFIX, name)
}
export function isBridge(name:string) {
    return is(BRIDGE_PREFIX, name)
}

export function isDirectInteropType(type: lw.LWType) {
    return type !== Ts.prim.interopReturnBuffer
        && type !== Ts.prim.interopString
}

export function createOhosEffect() {
    return {
        nativeModuleName: managedName('engine.' + moduleName('NativeModule')), ///substitute name @ type aliasing time?
        apiFunctionName: 'Get' + generatorConfiguration().TypePrefix + moduleName('_API'),
        modifiers: new Map<string, string[]>(),
        callbacks: [],
        defaultNamespaces: new Map<string, string>()
    }
}

export function expectExpr<N extends idl.IDLNode, R=OhosRole<N>>(
    ctx: OhosProducerContext, node: N, role: R, data?: OhosSeedData<N>
): LWExpression {
    return ctx.expectExpr(new OhosSeed(node, role, data))
}

export function expectType<N extends idl.IDLNode, R=OhosRole<N>>(
    ctx: OhosProducerContext, node: N, role: R, data?: OhosSeedData<N>
): LWType {
    return ctx.expectType(new OhosSeed(node, role, data))
}

export function registerDefaultProducers(selector: MakeSelector) {
    [...Object.values(producers.managed), ...Object.values(producers.native)]
        .sort((p, q) => {
            if (p.pattern.predicate && p.pattern.role) return -1
            if (p.pattern.predicate && !q.pattern.role) return -1
            if (p.pattern.role && !q.pattern.role) return -1
            if (!p.pattern.role && q.pattern.role) return 1
            if (!p.pattern.predicate && q.pattern.role) return 1
            if (!p.pattern.predicate && !p.pattern.role) return 1
            return 0
        })
        .forEach(p => selector.register(p as any))
}
