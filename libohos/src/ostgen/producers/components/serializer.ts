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
import { Builders, E, Hs, LWExpression, LWStatement, LWType, T, Ts } from "@idlizer/ost"
import { expectType, managedName, bridgeName } from "../common.js"
import { OhosProducerContext, OhosProducer, OhosRole } from "../../engine/index.js"
import { argConvertor } from "./argConvertor.js"
import { collectProperties } from "../../../peer-generation/propertyCollectors.js"

export function produceSerializer(
  native: boolean
): OhosProducer<idl.IDLInterface | idl.IDLTypedef, OhosRole<idl.IDLInterface | idl.IDLTypedef>> {
  return (node, ctx) => {
    const serializerName = (native ? bridgeName : managedName)(idl.getFQName(node) + 'Serializer')
    return {
      continuation: E.v(serializerName, [Hs.isType()]),
      declarations: makeSerializer(ctx, node, native, serializerName)
    }
  }
}

/**
 * For TS, produce serializer class with method implementations.
 * Native needs forward class declaration + separate method implementations.
 */
function makeSerializer(ctx: OhosProducerContext, node: idl.IDLInterface | idl.IDLTypedef, native: boolean, serializerName: string) {
  const role = native ? 'capi' : 'managed'
  const valueType = expectType(ctx, node, role)
  const clazz = makeSerializerClass(valueType, serializerName)
  const write = makeSerializerWrite(ctx, node, valueType, native, serializerName)
  const read = makeSerializerRead(ctx, node, valueType, native, serializerName)
  if (native) {
    return [clazz, write, read]
  } else {
    clazz.methods[0].body = write.body
    clazz.methods[1].body = read.body
    return [clazz]
  }
}

function makeSerializerClass(type: LWType, serializerName: string) {
  return Builders.class(serializerName)
    .method('write')
      .static()
      .param('serializer').type(Ts.ref(T.c('SerializerBase'))).$()
      .param('value').type(type).$().$()
    .method('read')
      .static()
      .param('deserializer').type(Ts.ref(T.c('DeserializerBase'))).$()
      .returns(type).$().$()
}

function makeSerializerWrite(
  ctx: OhosProducerContext,
  node: idl.IDLInterface | idl.IDLTypedef,
  type: LWType,
  native: boolean,
  serializerName: string)
{
  let body: LWStatement[]
  switch (node.kind) {
    case idl.IDLKind.Interface:
      body = collectProperties(node, ctx.library).flatMap(prop => [
        Builders.decl(`${prop.name}Value`).value().access(prop.name).receiver('value').$().$().$(),
          ...argConvertor(ctx, prop.type, prop.isOptional).write(E.v(`${prop.name}Value`), E.v('serializer'), native)
      ])
      break
    case idl.IDLKind.Typedef:
      body = argConvertor(ctx, node.type, false).write(E.v('value'), E.v('serializer'), native)
      break
  }
  return Builders.func(serializerName + '::write')
    .param('serializer').type(Ts.ref(T.c('SerializerBase'))).$()
    .param('value').type(type).$()
    .block().statements(body).$().$()
}

function makeSerializerRead(
  ctx: OhosProducerContext,
  node: idl.IDLInterface | idl.IDLTypedef,
  type: LWType,
  native: boolean,
  serializerName: string)
{
  let reads: [LWStatement[], LWExpression][]
  let result: LWExpression
  switch (node.kind) {
    case idl.IDLKind.Interface:
      reads = collectProperties(node, ctx.library).map(prop =>
        argConvertor(ctx, prop.type, prop.isOptional).read(prop.name, E.v('deserializer'), native))
      result = Builders.ctor().asStruct().args(reads.map(([_, expr]) => expr)).$()
      break
    case idl.IDLKind.Typedef:
      reads = [argConvertor(ctx, node.type, false).read('value', E.v('deserializer'), native)]
      result = E.v('value')
      break
  }
  return Builders.func(serializerName + '::read')
    .param('deserializer').type(Ts.ref(T.c('DeserializerBase'))).$()
    .returns(type)
    .block()
      .statements(reads.flatMap(([stmts, _]) => stmts))
      .decl('retval', type).value(result).$()
      .return(type).value('retval').$().$().$()
}
