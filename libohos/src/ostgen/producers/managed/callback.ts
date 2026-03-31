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
import { expectType, managedName } from "../common.js";
import { argConvertor, deserializeAndCallCallback } from "../components/argConvertor.js";
import { createProducer } from "../../engine/index.js";

export const callbackProducer = createProducer(
  { is: idl.isCallback, role: 'managed' },
  (callback, ctx) => {
    ctx.updateEffect(e => e.callbacks.push(callback.name))
    let continuation: idl.IDLEntry | undefined
    if (!idl.isVoidType(callback.returnType)) {
      const ref = ctx.library.createContinuationCallbackReference(callback.returnType)!
      continuation = ctx.library.resolveTypeReference(ref)!
    }
    const generatedDeclName = managedName(idl.getFQName(callback))
    const reads = callback.parameters.map(p => argConvertor(ctx, p.type).read(p.name, E.v('deserializer'), false))
    return {
      continuation: T.c(generatedDeclName),
      declarations: [
        Builders.type(generatedDeclName).funcType()
          .parameters(callback.parameters.map(it => ({ name: it.name, type: expectType(ctx, it.type, 'managed')})))
          .returns(expectType(ctx, callback.returnType, 'managed')).$().$(),
        Builders.func(managedName('engine.deserializeAndCall' + callback.name))
          .param('deserializer').type('DeserializerBase').$()
          .block()
            .decl('resourceId').value().call('readInt32').receiver('deserializer').$().$().$()
            .decl('call').value().cast(T.c(generatedDeclName)).value().call('get')
              .receiver().call('instance').receiver('ResourceHolder').$().$()
              .arg('resourceId').$().$().$().$().$()
            .statements(reads.flatMap(it => it[0]))
            .statements(continuation ? deserializeAndCallCallback('continuation', E.v('deserializer'), ctx, continuation! as idl.IDLCallback) : [])
            .statements(continuation
              ? [Builders.stmt().call('continuationClosure').arg().call('call').args(reads.map(it => it[1])).$().$().$().$()]
              : [Builders.stmt().call('call').args(reads.map(it => it[1])).$().$()]
            ).$().$(),
            // TBD: workaround to include the continuation to the declaration processing
            // Fix it in more appropriate way
            ...(continuation
              ? [Builders.struct(`Dummy_${continuation.name}`).field(`cb`).type(expectType(ctx, continuation, `managed`)).$().$()] : []),
      ]
    }
  }
)
