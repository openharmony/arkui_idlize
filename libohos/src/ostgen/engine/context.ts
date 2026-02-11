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

export interface MakeSelectorPattern<N extends idl.IDLNode> {
    is: (node: idl.IDLNode) => node is N,
    role?: Role<N>
}

export interface ProducerBox<N extends idl.IDLNode> {
    pattern: MakeSelectorPattern<N>
    producer: OhosProducer<N>
}

export function createProducer<N extends idl.IDLNode>(pattern: MakeSelectorPattern<N>, producer: OhosProducer<N>): ProducerBox<N> {
    return {
        pattern,
        producer,
    }
}

export class MakeSelector {
    private readonly storage: ProducerBox<idl.IDLNode>[] = []

    register<N extends idl.IDLNode>(box: ProducerBox<N>) {
        this.storage.push(box as any)
    }

    select(seed: OhosSeed): OhosProducer<idl.IDLNode> {
        const record = this.storage.find(it => {
            if (!it.pattern.is(seed.node)) {
                return false
            }
            if (it.pattern.role === undefined) {
                return true
            }
            const queryRole = seed.role ?? ''
            return it.pattern.role === queryRole
        })
        if (!record)
            terminate(`Can not process "${idl.getFQName(seed.node)}", ${idl.IDLKind[seed.node.kind]}, ${seed.role}`)
        return record.producer
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
export type OhosProducer<T extends idl.IDLNode> = (type: T, ctx: OhosProducerContext, role?: Role<T>) => ProducerResult

type CommonRole = 'managed' | 'capi'
type SpecificRole<N extends idl.IDLNode> =
  N extends idl.IDLMethod | idl.IDLConstructor ? 'native-module' :
  N extends idl.IDLInterface ? 'native-module' | 'managed-serde' | 'native-serde' :
  never
export type Role<T extends idl.IDLNode> = CommonRole | SpecificRole<T>

export class OhosSeed<T extends idl.IDLNode = idl.IDLNode> extends Seed {
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
