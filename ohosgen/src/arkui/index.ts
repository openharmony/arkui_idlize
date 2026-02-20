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

import * as idl from "@idlizer/core/idl"
import { MakeSelector, OhosSeed, Role } from "@idlizer/libohos"
import { attributeProducer, componentProducer, peerProducer } from "./managed/attribute"
import { propertyProducer } from "./managed/property"
import { interfaceProducer } from "./managed/interface"
import { optionsProducer } from "./managed/callable"

type ArkUISpecificRole<N extends idl.IDLNode> =
  N extends idl.IDLInterface ? 'component' | 'peer' :
  N extends idl.IDLProperty ? 'peer' :
  N extends idl.IDLCallable ? 'peer' : ///better names?
  never

export type ArkUIRole<N extends idl.IDLNode> = Role<N> | ArkUISpecificRole<N>

export type ArkUISeed = OhosSeed<ArkUIRole<idl.IDLNode>>

export const producers = [
  attributeProducer,
  peerProducer,
  componentProducer,
  propertyProducer,
  interfaceProducer,
  optionsProducer
]

export function registerArkUIProducers(selector: MakeSelector<ArkUIRole<idl.IDLNode>>) {
  for (const producer of producers) {
    selector.register(producer as any)
  }
}