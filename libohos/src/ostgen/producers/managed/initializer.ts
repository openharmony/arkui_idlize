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
import { Builders, E, Hs, LWExpression } from "@idlizer/ost"
import { createProducer, OhosProducerContext } from "../../engine/index.js"
import { expectExpr } from "../common.js"

export const initializerProducer = createProducer<idl.IDLType, 'initializer'>(
  { is: idl.isType, role: 'initializer' },
  (type, ctx, role, data) => {
    const initExpr =
      idl.isPrimitiveType(type) ? primitiveDefault(type) :
      idl.isReferenceType(type) ? referenceDefault(type, ctx) :
      idl.isContainerType(type) ? E.v('[]') :
      idl.isUnionType(type) ? expectExpr(ctx, type.types[0], 'initializer') :
      E.c('undefined')
    if (data?.name)
      initExpr.hints.push(Hs.named(data.name))
    return {
      continuation: initExpr,
      declarations: []
    }
  }
)

function primitiveDefault(type: idl.IDLPrimitiveType): LWExpression {
  switch (type.name) {
    case 'boolean': return E.c('false')
    case 'String': return E.s('')
    default: return E.c(0)
  }
}

function referenceDefault(type: idl.IDLReferenceType, ctx: OhosProducerContext): LWExpression {
  const decl = ctx.library.resolveTypeReference(type)
  if (!decl) return E.c('{}')
  if (idl.isInterface(decl)) return interfaceDefault(decl, ctx)
  if (idl.isEnum(decl)) return Builders.access(decl.elements[0].name).receiver(expectExpr(ctx, decl, 'managed')).$()
  if (idl.isTypedef(decl)) return expectExpr(ctx, decl.type, 'initializer')
  return E.c('{}')
}

function interfaceDefault(node: idl.IDLInterface, ctx: OhosProducerContext): LWExpression {
  const isTuple = node.subkind === idl.IDLInterfaceSubkind.Tuple
  const args = node.properties.map(prop => {
    const nameData = isTuple ? undefined : { name: prop.name }
    return expectExpr<idl.IDLType, 'initializer'>(ctx, prop.type, 'initializer', nameData)
  })
  const hints = [isTuple ? Hs.arrayInstance() : Hs.asStruct()]
  return E.instance('', args, [], hints)
}
