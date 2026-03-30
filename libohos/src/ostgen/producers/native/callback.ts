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
import { Builders, E, lw, Op, T, Ts } from "@idlizer/ost";
import { bridgeName, cApiName, expectType } from "../common.js";
import { argConvertor } from "../components/argConvertor.js";
import { createProducer } from "../../engine/index.js";

export const callbackProducer = createProducer(
  { is: idl.isCallback, role: 'capi' },
  (callback, ctx) => {
    const generatedDeclName = cApiName(idl.getFQName(callback))
    const callbackParams = callback.parameters.map(p => ({name: p.name, type: Ts.const(expectType(ctx, p.type, 'capi')) as lw.LWType}))
    const callbackParamWrites = callback.parameters.flatMap(p => argConvertor(ctx, p.type).write(E.v(p.name), E.v('argsSerializer'), true))
    const vmContextParam = {name: 'vmContext', type: T.c(cApiName('VMContext'))}
    const resourceIdParam = {name: 'resourceId', type: Ts.const(Ts.prim.i32)}
    const asyncParams = [resourceIdParam, ...callbackParams]
    let continuation: lw.LWType | undefined
    let continuationName: string | undefined
    const continuationReturnParams: {name: string, type: lw.LWType} [] = []
    if (!idl.isVoidType(callback.returnType)) {
      const ref = ctx.library.createContinuationCallbackReference(callback.returnType)!
      let callbackContinuation = ctx.library.resolveTypeReference(ref)
      continuationName = callbackContinuation!.name
      continuation = expectType(ctx, callbackContinuation!, `capi`)
      asyncParams.push({ name: 'continuation', type: Ts.const(continuation) })
      continuationReturnParams.push(resourceIdParam)
      continuationReturnParams.push({name: 'value', type: expectType(ctx, callback.returnType, 'capi')})
    }
    const syncParams = [vmContextParam, ...asyncParams]
    const reads = callback.parameters.map(p => argConvertor(ctx, p.type).read(p.name, E.v('deserializer'), true))
    const readCall: (sync: boolean, params: { name: string, type: lw.LWType}[], callbackName: string) => lw.LWExpression
      = (sync, params, callbackName) => {
      return Builders.cast(T.fn(params, Ts.prim.void))
        .value().call('readPointerOrDefault')
          .arg().call(`getManagedCallbackCaller${sync ? 'Sync' : ''}`)
            .arg(`CALLBACK_KIND_${callbackName.toUpperCase()}`).$().$()
        .receiver(`deserializer`)
        .$().$().$()
    }
    return {
      continuation: T.c(generatedDeclName),
      declarations: [
        Builders.struct(generatedDeclName)
          .field('resource').type(T.c(cApiName('CallbackResource'))).$()
          .field('call').funcType()
              .parameters(asyncParams)
              .returns(Ts.prim.void).$().$()
          .field('callSync').funcType()
              .parameters(syncParams)
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
              .arg().access('length').receiver('callData').$().$().$().$().$(),
        ...['', 'Sync'].map(sync =>
          Builders.func(bridgeName(`deserializeAndCall${sync}${callback.name}`))
            .parameters(sync ? [vmContextParam] : [])
            .param('thisArray').type(Ts.prim.serializerBuffer).$()
            .param(`thisLength`).type(Ts.prim.i32).$()

            .block()
              .decl('deserializer', T.c('DeserializerBase')).mutable().value()
                .ctor('DeserializerBase').stack().arg('thisArray').arg('thisLength').$().$().$()
              .decl('resourceId').value().call('readInt32').receiver('deserializer').$().$().$()
              .statements(sync ? [Builders.stmt().call('readPointer').receiver('deserializer').$().$()] : [])
              .decl(`call${sync}`).value(readCall(false, sync ? syncParams : asyncParams, callback.name)).$()
              .statements(sync ? [] : [Builders.stmt().call('readPointer').receiver('deserializer').$().$()])
              .statements(reads.flatMap(it => it[0]))
              .statements([
                continuation
                  ? Builders.decl('continuationResult').type(continuation)
                    .value().ctor().asStruct()
                    .arg().call('readCallbackResource').receiver('deserializer').$().$()
                    .arg(readCall(false, continuationReturnParams, continuationName!))
                    .arg(readCall(true, [vmContextParam, ...continuationReturnParams], continuationName!))
                    .$().$().$()
                  : Builders.none().$()
              ])
              .call(`call${sync}`)
                .args(sync ? [Builders.expr().const('vmContext').$()] : [])
                .arg(`resourceId`)
                .args(callbackParams.concat(continuation ? [{name: 'continuationResult', type: continuation}] : [])
                  .map(it => Builders.expr().const(it.name).$()))
              .$().$().$()
          )
      ]
    }
  }
)
