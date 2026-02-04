/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import * as idl from "@idlizer/core/idl";
import { PeerLibrary } from "@idlizer/core";
import { ProducerContext, ProducerResult, Seed } from "@idlizer/kit";

export type OhosProducerContext = ProducerContext<PeerLibrary, undefined>
export type OhosProducer<T extends idl.IDLNode> = (type: T, ctx: OhosProducerContext) => ProducerResult

type Role<T extends idl.IDLNode> =
  T extends idl.IDLInterface ? 'interface' | 'managed-serde' | 'native-serde' :
  T extends idl.IDLMethod ? 'method' | 'native-module' | 'bridge' | 'capi' | 'impl' :
  never

export class OhosSeed<T extends idl.IDLNode = idl.IDLNode> extends Seed {///mv to common/context?
  constructor(
    public node: T,
    public role?: Role<T>,
  ) {
    super()
  }
  hash(): string {
    return `hash:${idl.isType(this.node) ? idl.printType(this.node) : idl.getFQName(this.node)}:${this.role ?? ''}`
  }
}
