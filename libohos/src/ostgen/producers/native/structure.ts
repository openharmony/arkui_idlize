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

import { D, Md, T, Ts } from "@idlizer/ost"
import * as idl from "@idlizer/core/idl"
import { cApiName } from "../common"
import { isMaterialized } from "@idlizer/core"
import { createProducer } from "../../engine"
import { expectType } from "../common"
import { OhosProducerContext } from "../../engine"

export const structureProducer = createProducer(
  { is: idl.isInterface, role: 'capi' },
  (node, ctx) => {
    const name = cApiName(idl.getFQName(node))
    return {
      continuation: T.c(name),
      declarations: isMaterialized(node, ctx.library)
        ? makeMaterialized(node, name)
        : makeInterface(node, name, ctx)
    }
  }
)

function makeInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext) {
  return [D.struct(name, node.properties.map(prop => {
    const modifiers = [
      ...prop.isOptional ? [Md.optional()] : [],
      ...prop.isReadonly ? [Md.readonly()] : [],
      ...prop.isStatic ? [Md.static()] : [],
    ]
    return {
      name: prop.name,
      type: expectType(ctx, prop.type, 'capi'),
      modifiers,
    }
  }))]
}

function makeMaterialized(node: idl.IDLInterface, name: string) {
  return [
    D.type(name, Ts.ptr(Ts.prim.void)),
  ]
}
