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
import { Builders, E, T } from "@idlizer/ost";
import { managedName } from "../common";
import { argConvertor } from "../components/argConvertor";
import { OhosSeed } from "../common"
import { createProducer } from "../../engine";

export const callbackProducer = createProducer(
  { is: idl.isCallback, role: 'managed' },
  (callback, ctx) => {
    ctx.updateEffect(e => e.callbacks.push(callback.name))
    const generatedDeclName = managedName(idl.getFQName(callback))
    const reads = callback.parameters.map(p => argConvertor(ctx, p.type).read(p.name, E.v('deserializer'), false))
    return {
      continuation: T.c(generatedDeclName),
      declarations: [
        Builders.type(generatedDeclName).funcType()
          .parameters(callback.parameters.map(it => [it.name, ctx.expectType(new OhosSeed(it.type, 'managed'))]))
          .returns(ctx.expectType(new OhosSeed(callback.returnType, 'managed'))).$().$(),
        Builders.func(managedName('engine.deserializeAndCall' + callback.name))
          .param('deserializer').typeStr('DeserializerBase').$()
          .block()
            .decl('resourceId').value().call('readInt32').receiver('deserializer').$().$().$()
            .decl('call').value().cast(T.c(generatedDeclName)).value().call('get')
              .receiver().call('instance').receiver('ResourceHolder').$().$()
              .arg('resourceId').$().$().$().$().$()
            .statements(reads.flatMap(it => it[0]))
            .call('call').args(reads.map(it => it[1])).$().$().$()
      ]
    }
  }
)
