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
import { Builders, E, Op, T, Ts } from "@idlizer/ost";
import { bridgeName, cApiName, expectType } from "../common.js";
import { argConvertor } from "../components/argConvertor.js";
import { createProducer } from "../../engine/index.js";

export const callbackProducer = createProducer(
  { is: idl.isCallback, role: 'capi' },
  (callback, ctx) => {
    const generatedDeclName = cApiName(idl.getFQName(callback))
    const callbackParams = callback.parameters.map(p => ({name: p.name, type: Ts.const(expectType(ctx, p.type, 'capi'))}))
    const callbackParamWrites = callback.parameters.flatMap(p => argConvertor(ctx, p.type).write(E.v(p.name), E.v('argsSerializer'), true))
    const asyncParams = [{name: 'resourceId', type: Ts.const(Ts.prim.i32)}, ...callbackParams]
    const syncParams = [{name: 'vmContext', type: T.c(cApiName('VMContext'))}, ...asyncParams]
    return {
      continuation: T.c(generatedDeclName),
      declarations: [
        Builders.struct(generatedDeclName)
          .field('resource').type(T.c(cApiName('CallbackResource'))).$()
          .field('call').funcType()
              .parameters(asyncParams.map(({name, type}) => [name, type]))
              .returns(Ts.prim.void).$().$()
          .field('callSync').funcType()
              .parameters(syncParams.map(({name, type}) => [name, type]))
              .returns(Ts.prim.void).$().$().$(),
        Builders.func(bridgeName(`CallManaged${callback.name}`))
          .parameters(asyncParams)
          .block()
            .decl('callbackBuffer', T.c('CallbackBuffer')).mutable().value()
              .ctor().asStruct().arg('{}').arg('{}').$().$().$()
            .decl('callbackResourceSelf', T.c(cApiName('CallbackResource'))).value()
              .ctor().asStruct().arg('resourceId').arg('holdManagedCallbackResource').arg('releaseManagedCallbackResource').$().$().$()
            .call('holdCallbackResource')
              .receiver().access('resourceHolder').receiver('callbackBuffer').$().$()
              .arg().unary(Op.ref).value('callbackResourceSelf').$().$().$()
            .decl('argsSerializer', T.c('SerializerBase')).mutable().value()
              .ctor().stack()
                .arg().cast(T.c('KSerializerBuffer')).value()
                  .unary(Op.ref).value().access('buffer').receiver('callbackBuffer').$().$().$().$().$().$()
                .arg().call('sizeof').arg().access('buffer').receiver('callbackBuffer').$().$().$().$()
                .arg().unary(Op.ref).value().access('resourceHolder').receiver('callbackBuffer').$().$().$().$().$().$().$()
            .call('writeInt32').receiver('argsSerializer').arg(`CALLBACK_KIND_${callback.name.toUpperCase()}`).$()
            .call('writeInt32').receiver('argsSerializer').arg('resourceId').$()
            .statements(callbackParamWrites)
            .call('enqueueCallback').arg('0').arg().unary(Op.ref).value('callbackBuffer').$().$().$().$().$(),
        Builders.func(bridgeName(`SyncCallManaged${callback.name}`))
          .parameters(syncParams)
          .block()
            .decl('argsSerializer', T.c('SerializerBase')).mutable().value().ctor().stack().arg('nullptr').$().$().$()
            .call('writeInt32').receiver('argsSerializer').arg('0').$()
            .call('writeInt32').receiver('argsSerializer').arg(`CALLBACK_KIND_${callback.name.toUpperCase()}`).$()
            .call('writeInt32').receiver('argsSerializer').arg('resourceId').$()
            .statements(callbackParamWrites)
            .decl('callData', T.c('KInteropReturnBuffer')).value().call('toReturnBuffer').receiver('argsSerializer').$().$().$()
            .call('KOALA_INTEROP_CALL_VOID').arg('vmContext').arg('1')
              .arg().access('length').receiver('callData').$().$()
              .arg().access('data').receiver('callData').$().$().$()
            .call('dispose').receiver('callData')
              .arg().access('data').receiver('callData').$().$()
              .arg().access('length').receiver('callData').$().$().$().$().$()
      ]
    }
  }
)
