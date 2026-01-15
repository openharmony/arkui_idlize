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
import { AdvancedGeneratorContext, managedName, bridgeName } from "../common";
import { ProducerDescription } from "../../engine/context";
import { Hs, E, T, Ts } from "../../../ost";
import { argConvertor } from "./argConvertor";
import { Builders } from "../../../ost";
import { LWType } from "../../../ost";

function makeSerializerName(node: idl.IDLInterface, native: boolean) {
  const name = idl.getFQName(node) + 'Serializer'
    return native
      ? bridgeName(name)
      : managedName(name)
}

/**
 * For TS, produce serializer class with method implementations.
 * Native needs forward class declaration + separate method implementations.
 */
export function makeSerializer(
  ctx: AdvancedGeneratorContext,
  node: idl.IDLInterface,
  native: boolean
): ProducerDescription {
  return {
    artifact: {
      reference: E.v(makeSerializerName(node, native), [Hs.isType()]),
      implementationGenerator: () => {
        const valueType = (native ? ctx.useCApi(node) : ctx.useManaged(node)).reference()
        const clazz = makeSerializerClass(node, valueType, native)
        const write = makeSerializerWrite(ctx, node, valueType, native)
        const read = makeSerializerRead(ctx, node, valueType, native)
        if (native) {
          return [clazz, write, read]
        } else {
          clazz.methods[0].body = write.body
          clazz.methods[1].body = read.body
          return [clazz]
        }
      }
    }
  }
}

function makeSerializerClass(node: idl.IDLInterface, type: LWType, native: boolean) {
  return Builders.class(makeSerializerName(node, native))
    .method('write')
      .static()
      .param('serializer').type(Ts.ref(T.c('SerializerBase'))).$()
      .param('value').type(type).$().$()
    .method('read')
      .static()
      .param('deserializer').type(Ts.ref(T.c('DeserializerBase'))).$()
      .returns(type).$().$()
}

function makeSerializerWrite(ctx: AdvancedGeneratorContext, node: idl.IDLInterface, type: LWType, native: boolean) {
  return Builders.func(makeSerializerName(node, native) + '::write')
    .param('serializer').type(Ts.ref(T.c('SerializerBase'))).$()
    .param('value').type(type).$()
    .block()
      .statements(node.properties.flatMap(prop => [
        Builders.decl(`${prop.name}Value`).value().access(prop.name).receiver('value').$().$().$(),
        ...argConvertor(ctx, prop.type, prop.isOptional).write(E.v(`${prop.name}Value`), E.v('serializer'), native)
      ])).$().$()
}

function makeSerializerRead(ctx: AdvancedGeneratorContext, node: idl.IDLInterface, type: LWType, native: boolean) {
  const reads = node.properties.map(prop =>
    argConvertor(ctx, prop.type, prop.isOptional)
      .read(prop.name, E.v('deserializer'), native))
  return Builders.func(makeSerializerName(node, native) + '::read')
    .param('deserializer').type(Ts.ref(T.c('DeserializerBase'))).$()
    .returns(type)
    .block()
      .statements(reads.flatMap(([stmts, _]) => stmts))
      .decl('retval', type).value().ctor().asStruct().args(reads.map(([_, expr]) => expr)).$().$().$()
      .return(type).value('retval').$().$().$()
}
