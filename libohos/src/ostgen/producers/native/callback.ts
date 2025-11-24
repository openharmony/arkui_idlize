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

import { E, T, Ts } from "../../../ost";
import * as idl from "@idlizer/core/idl"
import { bridgeName, cApiName, createSpecialProducer, roles } from "../common";
import { Builders } from "../../../ost/builders";
import { argConvertor } from "../components/argConvertor";

export const callbackProducer = createSpecialProducer(
  { is: idl.isCallback, role: roles.cApi },
  (callback, ctx) => {
    const generatedDeclName = cApiName(idl.getFQName(callback))
    return {
      artifact: {
        reference: T.c(generatedDeclName),
        implementationGenerator: () => {
          const callbackParams = callback.parameters.map(p => ({name: p.name, type: Ts.const(ctx.useCApi(p.type).reference())}))
          const callbackParamWrites = callback.parameters.flatMap(p => argConvertor(ctx, p.type).write(E.v(p.name), E.v('argsSerializer'), true))
          const asyncParams = [{name: 'resourceId', type: Ts.const(Ts.prim.i32)}, ...callbackParams]
          const syncParams = [{name: 'vmContext', type: T.c(cApiName('VMContext'))}, ...asyncParams]
          return [
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
                  .ctor().asStruct().arg('{}').$().arg('{}').$().$().$().$()
                .decl('callbackResourceSelf', T.c(cApiName('CallbackResource'))).value()
                  .ctor().asStruct().arg('resourceId').$().arg('holdManagedCallbackResource').$().arg('releaseManagedCallbackResource').$().$().$().$()
                .call()
                  .receiver().access(E.v('callbackBuffer')).member('resourceHolder').$().$()
                  .functionName('holdCallbackResource').arg('&callbackResourceSelf').$().$()///
                .decl('argsSerializer', T.c('SerializerBase')).mutable().value()
                  .ctor().stack()
                    .arg().cast(T.c('KSerializerBuffer')).valueStr('&callbackBuffer.buffer').$().$()
                    .arg().call().functionName('sizeof').arg().access(E.v('callbackBuffer')).member('buffer').$().$().$().$()
                    .arg('&callbackBuffer.resourceHolder').$().$().$().$()
                .call().receiverName('argsSerializer').functionName('writeInt32').arg(`KIND_${callback.name.toUpperCase()}`).$().$()
                .call().receiverName('argsSerializer').functionName('writeInt32').arg('resourceId').$().$()
                .statements(callbackParamWrites)
                .call().functionName('enqueueCallback').arg('0').$().arg('&callbackBuffer').$().$().$().$(),
            Builders.func(bridgeName(`SyncCallManaged${callback.name}`))
              .parameters(syncParams)
              .block()
                .decl('argsSerializer', T.c('SerializerBase')).mutable().value().ctor().stack().arg('nullptr').$().$().$().$()
                .call().receiverName('argsSerializer').functionName('writeInt32').arg('0').$().$()
                .call().receiverName('argsSerializer').functionName('writeInt32').arg(`KIND_${callback.name.toUpperCase()}`).$().$()
                .call().receiverName('argsSerializer').functionName('writeInt32').arg('resourceId').$().$()
                .statements(callbackParamWrites)
                .decl('callData', T.c('KInteropReturnBuffer')).value().call().receiverName('argsSerializer').functionName('toReturnBuffer').$().$().$()
                .call().functionName('KOALA_INTEROP_CALL_VOID').arg('vmContext').$().arg('1').$()
                  .arg().access(E.v('callData')).member('length').$().$()
                  .arg().access(E.v('callData')).member('data').$().$().$()
                .call().receiverName('callData').functionName('dispose')
                  .arg().access(E.v('callData')).member('data').$().$()
                  .arg().access(E.v('callData')).member('length').$().$().$().$().$()
          ]
        }
      }
    }
  }
)
