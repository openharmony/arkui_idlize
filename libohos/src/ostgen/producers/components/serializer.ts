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
import { Builders, E, Hs, LWType, T, Ts } from "@idlizer/ost"
import { expectType, managedName, bridgeName } from "../common.js"
import { OhosProducerContext, OhosProducer } from "../../engine/index.js"
import { argConvertor } from "./argConvertor.js"

export function produceSerializer(native: boolean): OhosProducer<idl.IDLInterface> {
  return (node: idl.IDLInterface, ctx: OhosProducerContext) => {
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
function makeSerializer(ctx: OhosProducerContext, node: idl.IDLInterface, native: boolean, serializerName: string) {
  const role = native ? 'capi' : 'managed'
  const valueType = expectType(ctx, node, role)
  const clazz = makeSerializerClass(node, valueType, native, serializerName)
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

function makeSerializerClass(node: idl.IDLInterface, type: LWType, native: boolean, serializerName: string) {
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

function makeSerializerWrite(ctx: OhosProducerContext, node: idl.IDLInterface, type: LWType, native: boolean, serializerName: string) {
  return Builders.func(serializerName + '::write')
    .param('serializer').type(Ts.ref(T.c('SerializerBase'))).$()
    .param('value').type(type).$()
    .block()
      .statements(node.properties.flatMap(prop => [
        Builders.decl(`${prop.name}Value`).value().access(prop.name).receiver('value').$().$().$(),
        ...argConvertor(ctx, prop.type, prop.isOptional).write(E.v(`${prop.name}Value`), E.v('serializer'), native)
      ])).$().$()
}

function makeSerializerRead(ctx: OhosProducerContext, node: idl.IDLInterface, type: LWType, native: boolean, serializerName: string) {
  const reads = node.properties.map(prop =>
    argConvertor(ctx, prop.type, prop.isOptional)
      .read(prop.name, E.v('deserializer'), native))
  return Builders.func(serializerName + '::read')
    .param('deserializer').type(Ts.ref(T.c('DeserializerBase'))).$()
    .returns(type)
    .block()
      .statements(reads.flatMap(([stmts, _]) => stmts))
      .decl('retval', type).value().ctor().asStruct().args(reads.map(([_, expr]) => expr)).$().$().$()
      .return(type).value('retval').$().$().$()
}
