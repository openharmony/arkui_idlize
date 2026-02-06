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
import { PeerLibrary } from "@idlizer/core"
import { E, Hs, LWType, Ts, lw } from "@idlizer/ost"
import { ProducerContext, ProducerResult, Seed } from "@idlizer/kit"

export const MANAGED_PREFIX = 'managed'
export const C_API_PREFIX = 'capi'
export const BRIDGE_PREFIX = 'bridge'
export const IMPL_PREFIX = 'impl'

// export const roles = {
//     managed: MANAGED_PREFIX,
//     cApi: C_API_PREFIX,
//     bridge: BRIDGE_PREFIX,
//     nativeModule: MANAGED_PREFIX + ".nativeModule",
//     serializerManaged: MANAGED_PREFIX + ".serializer",
//     serializerNative: BRIDGE_PREFIX + ".serializer",
// }

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

///////////////////////////////////////////////////////////

// export class AdvancedGeneratorContext {

//     constructor(
//         public base: GeneratorContext
//     ) { }

//     useManaged(node:idl.IDLNode) {
//         return this.base.use({ node, role: roles.managed })
//     }
//     useCApi(node:idl.IDLNode) {
//         return this.base.use({ node, role: roles.cApi })
//     }
//     useManagedNativeModule(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor) {
//         return this.base.use({ node, role: roles.nativeModule })
//     }
//     useBridge(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor) {
//         return this.base.use({ node, role: roles.bridge })
//     }

//     useNativeSerializer(node:idl.IDLNode) {
//         return this.base.use({ node, role: roles.serializerNative })
//     }
//     useManagedSerializer(node:idl.IDLNode) {
//         return this.base.use({ node, role: roles.serializerManaged })
//     }
// }
// export interface AdvancedProducer<N extends idl.IDLNode = idl.IDLNode> {
//     (node: N, ctx: AdvancedGeneratorContext, query: MakeSelectorQuery): ProducerDescription
// }
// export function createSpecialProducer<N extends idl.IDLNode>(pattern: MakeSelectorPattern<N>, producer: AdvancedProducer<N>): ProducerBox<N> {
//     return createProducer(pattern, (n, ctx, query) => {
//         return producer(n, new AdvancedGeneratorContext(ctx), query)
//     })
// }

export function typeNameExpr(typeName: string): lw.LWExpression {
    return E.v(managedName(typeName), [Hs.isType()])
}

export function isDirectInteropType(type: lw.LWType) {
    return type !== Ts.prim.interopReturnBuffer
}

export type OhosProducerContext = ProducerContext<PeerLibrary, undefined>
export type OhosProducer<T extends idl.IDLNode> = (type: T, ctx: OhosProducerContext, role?: Role<T>) => ProducerResult

type CommonRole = 'managed' | 'capi'
type SpecificRole<T extends idl.IDLNode> =
  T extends idl.IDLInterface ? 'native-module' | 'bridge' | 'modifier' | 'managed-serde' | 'native-serde' :
  T extends idl.IDLMethod | idl.IDLConstructor ? 'native-module' | 'bridge' | 'modifier' | 'impl' :
  never
type Role<T extends idl.IDLNode> = CommonRole | SpecificRole<T>

export class OhosSeed<T extends idl.IDLNode = idl.IDLNode> extends Seed {///mv to common/context?
  constructor(
    public node: T,
    public role?: Role<T>,
  ) {
    super()
  }
  hash(): string {
    const repr = idl.isType(this.node)
        ? 'type:' + idl.printType(this.node)
        : 'node:' + idl.getFQName(this.node)
    return `${repr}:${this.role ?? ''}`
  }
}
