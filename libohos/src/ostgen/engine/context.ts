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
import { ProducerContext, ProducerResult, Seed, terminate } from "@idlizer/kit"

export interface MakeSelectorPattern<N extends idl.IDLNode, R> {
    is: (node: idl.IDLNode) => node is N
    predicate?: (node: N) => boolean
    role?: R
}

export interface ProducerBox<N extends idl.IDLNode, R=OhosRole<N>> {
    pattern: MakeSelectorPattern<N, R>
    producer: OhosProducer<N, R>
}

export function createProducer<N extends idl.IDLNode, R=OhosRole<N>>(
    pattern: MakeSelectorPattern<N, R>, producer: OhosProducer<N, R>
): ProducerBox<N, R> {
    return {
        pattern,
        producer,
    }
}

export class MakeSelector {
    private readonly storage: ProducerBox<idl.IDLNode, OhosRole<idl.IDLNode>>[] = []

    register<N extends idl.IDLNode, R=OhosRole<N>>(box: ProducerBox<N, R>) {
        this.storage.push(box as any)
    }

    select<N extends idl.IDLNode, R=OhosRole<N>>(seed: OhosSeed<N, R>): OhosProducer<N, R> {
        const record = this.storage.find(it => {
            if (!it.pattern.is(seed.node) ||
                it.pattern.predicate && !it.pattern.predicate(seed.node)
            ) {
                return false
            }
            if (it.pattern.role === undefined) {
                return true
            }
            return it.pattern.role === seed.role
        })
        if (!record)
            terminate(`Missing producer for "${idl.DebugUtils.debugPrintTrace(seed.node)}", ${idl.IDLKind[seed.node.kind]}, ${seed.role}`)
        return record.producer as any
    }

    static create() {
        return new MakeSelector()
    }
}

export interface OhosEffect {
    nativeModuleName: string,
    apiFunctionName: string,
    modifiers: Map<string, string[]>,
    callbacks: string[]
}

export type OhosProducerContext = ProducerContext<PeerLibrary, OhosEffect>
export type OhosProducer<N extends idl.IDLNode, R=OhosRole<N>> =
    (type: N, ctx: OhosProducerContext, role: R, data?: OhosSeedData<N, R>) => ProducerResult

type CommonRole = 'managed' | 'capi'
type SpecificRole<N extends idl.IDLNode> =
  N extends idl.IDLMethod | idl.IDLConstructor ? 'native-module' :
  N extends idl.IDLInterface ? 'native-module' | 'managed-serde' | 'native-serde' :
  N extends idl.IDLType ? 'typecheck' | 'initializer' :
  never
export type OhosRole<T extends idl.IDLNode> = CommonRole | SpecificRole<T>

export type OhosSeedData<N extends idl.IDLNode, R=OhosRole<N>> =
    N extends idl.IDLEntry ?
        R extends 'managed' ? { typeArgs?: idl.IDLType[] } :
        never :
    N extends idl.IDLType ?
        R extends 'initializer' ? { name?: string } :
        never :
    never

export class OhosSeed<N extends idl.IDLNode, R=OhosRole<N>> extends Seed {
  constructor(
    public node: N,
    public role: R,
    public data?: OhosSeedData<N, R>
  ) {
    super()
  }
  hash(): string {
    const repr = idl.isType(this.node)
        ? 'type:' + idl.printType(this.node)
        : 'node:' + idl.getFQName(this.node)
    const suffix =
        !this.data ? '' :
        'typeArgs' in this.data && this.data.typeArgs ? this.data.typeArgs.map(ty => idl.printType(ty)).join(',') :
        'name' in this.data && this.data.name ? this.data.name :
        ''
    return `${repr}:${this.role}:${suffix}`
  }
}
