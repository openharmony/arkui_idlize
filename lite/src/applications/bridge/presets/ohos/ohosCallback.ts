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

import { InteropProducerTypeDescription, makeSingletonProducer, SelectResult } from "../../generator/builder";
import { getFQName, IDLCallback, IDLI32Type, IDLType, isCallback, isReferenceType } from "@idlizer/core/idl";
import { ColoredLibrary } from "../../library";
import { Builders, D, E, EnumDeclaration, Hs, LWType, S, T, Ts, Vs } from "@idlizer/ost";
import { throwDeclarationWasNotFound } from "../../generator/common";
import { Ask } from "../../generator/seed";
import { KOALAUI_DESERIALIZER_BASE, KOALAUI_RESOURCE_HOLDER, KOALAUI_INTEROP_CALLBACK_RESOURCE, KOALAUI_INTEROP_VMCONTEXT, KOALAUI_KPOINTER } from "../../generator/names";
import { hashCodeFromString } from "@idlizer/core";

const [ohosCallbackResourceProducer, callbackResourceSeed] = makeSingletonProducer(
    'capi.OH_CallbackResource',
    name => D.type(name, T.c(KOALAUI_INTEROP_CALLBACK_RESOURCE))
)

const [ohosVmContentProducer, vmContentSeed] = makeSingletonProducer(
    'capi.OH_VMContext',
    name =>  D.type(name, T.c(KOALAUI_INTEROP_VMCONTEXT))
)

export const createOhosCallbackProducer = (library: ColoredLibrary): InteropProducerTypeDescription<IDLCallback> => {
    return {
        select: (ref: IDLType) => {
            if (isReferenceType(ref)) {
                const found = library.index.get(ref.name) ?? throwDeclarationWasNotFound(ref)
                if (found && isCallback(found)) {
                    return SelectResult.take(found)
                }
            }
            return SelectResult.reject()
        },
        onManagedDeclaration: (callback, _, ctx) => {
            const deserializerName = 'deserializer'
            const generatedDeclName = getFQName(callback)
            const reads = callback.parameters.map(p => ctx.library.selector.fromReturnBuffer(p.type, E.v(deserializerName)))
            return {
                continuation: T.c(generatedDeclName),
                declarations: [
                    Builders.type(generatedDeclName).funcType()
                        .parameters(callback.parameters.map(it => [it.name, Ask.typeName(it.type)]))
                        .returns(Ask.typeName(callback.returnType)).$().$(),
                    Builders.func('framework.engine.deserializeAndCall' + callback.name)
                        .param(deserializerName).typeStr(KOALAUI_DESERIALIZER_BASE).$()
                        .block()
                        .decl('resourceId').value().call('readInt32').receiver('deserializer').$().$().$()
                        .decl('call').value().cast(T.c(generatedDeclName)).value().call('get')
                        .receiver().call('instance').receiver(E.v(KOALAUI_RESOURCE_HOLDER, [Hs.isType()])).$().$()
                        .arg('resourceId').$().$().$().$().$()
                        .statements(reads.flatMap(it => it[0]))
                        .call('call').args(reads.map(it => it[1])).$().$().$()
                ]
            }
        },
        onNativeDeclaration(callback, _, ctx) {
            const argSerializerName = 'argsSerializer'
            const generatedDeclName = 'capi.' + getFQName(callback)
            const callbackParams = callback.parameters.map(p => ({ name: p.name, type: Ts.const(Ask.typeName(p.type)) }))
            const callbackParamWrites = callback.parameters.flatMap(p => ctx.library.selector.toReturnBuffer(p.type, E.v(p.name), E.v(argSerializerName)))
            const asyncParams = [{ name: 'resourceId', type: Ts.const(Ask.typeName(IDLI32Type)) }, ...callbackParams]
            const syncParams = [{ name: 'vmContext', type: vmContentSeed.createType({}) }, ...asyncParams]
            const callbackResourceType = callbackResourceSeed.createType({})
            const kindName = `KIND_${callback.name.toUpperCase()}`
            return {
                continuation: T.c(generatedDeclName),
                declarations: [
                    Builders.struct(generatedDeclName)
                        .field('resource').type(callbackResourceType).$()
                        .field('call').funcType()
                        .parameters(asyncParams.map(({ name, type }) => [name, type]))
                        .returns(Ts.prim.void).$().$()
                        .field('callSync').funcType()
                        .parameters(syncParams.map(({ name, type }) => [name, type]))
                        .returns(Ts.prim.void).$().$().$(),
                    Builders.func(`impl.CallManaged${callback.name}`)
                        .parameters(asyncParams)
                        .block()
                        .decl('callbackBuffer', T.c('CallbackBuffer')).mutable().value()
                        .ctor().asStruct().arg('{}').arg('{}').$().$().$()
                        .decl('callbackResourceSelf', callbackResourceType).value()
                        .ctor().asStruct().arg('resourceId').arg('holdManagedCallbackResource').arg('releaseManagedCallbackResource').$().$().$()
                        .call('holdCallbackResource')
                        .receiver().access('resourceHolder').receiver('callbackBuffer').$().$()
                        .arg('&callbackResourceSelf').$()///
                        .decl(argSerializerName, T.c('SerializerBase')).mutable().value()
                        .ctor().stack()
                        .arg().cast(T.c('KSerializerBuffer')).value('&callbackBuffer.buffer').$().$()
                        .arg().call('sizeof').arg().access('buffer').receiver('callbackBuffer').$().$().$().$()
                        .arg('&callbackBuffer.resourceHolder').$().$().$()
                        .call('writeInt32').receiver(argSerializerName).arg(kindName).$()
                        .call('writeInt32').receiver(argSerializerName).arg('resourceId').$()
                        .statements(callbackParamWrites)
                        .call('enqueueCallback').arg('0').arg('&callbackBuffer').$().$().$(),
                    Builders.func(`impl.SyncCallManaged${callback.name}`)
                        .parameters(syncParams)
                        .block()
                        .decl(argSerializerName, T.c('SerializerBase')).mutable().value().ctor().stack().arg('nullptr').$().$().$()
                        .call('writeInt32').receiver(argSerializerName).arg('0').$()
                        .call('writeInt32').receiver(argSerializerName).arg(`KIND_${callback.name.toUpperCase()}`).$()
                        .call('writeInt32').receiver(argSerializerName).arg('resourceId').$()
                        .statements(callbackParamWrites)
                        .decl('callData', T.c('KInteropReturnBuffer')).value().call('toReturnBuffer').receiver(argSerializerName).$().$().$()
                        .call('KOALA_INTEROP_CALL_VOID').arg('vmContext').arg('1')
                        .arg().access('length').receiver('callData').$().$()
                        .arg().access('data').receiver('callData').$().$().$()
                        .call('dispose').receiver('callData')
                        .arg().access('data').receiver('callData').$().$()
                        .arg().access('length').receiver('callData').$().$().$().$().$(),
                    Builders.enum(`capi.CallbackKind`)
                        .member(kindName, hashCodeFromString(kindName)).$()
                ]
            }
        },
        interopBufferTransferable: (decl) => ({
            fromInteropBuffer(buffer) {
                const callbackName = getFQName(decl).split('.').at(-1)!
                const kindName = E.v(`KIND_${callbackName.toUpperCase()}`)
                const callbackParams: [string, LWType][] = decl.parameters.map(p => [p.name, Ask.typeName(p.type)])
                const asyncParams: [string, LWType][] = [['resourceId', Ask.typeName(IDLI32Type)], ...callbackParams]
                const syncParams: [string, LWType][] = [['vmContext', vmContentSeed.createType({})], ...asyncParams]
                const name = 'gotCallback'
                return [[
                    Builders.decl(name, Ask.typeName(decl)).value()
                        .ctor().asStruct()
                        .arg().call('readCallbackResource').receiver(buffer).$().$()
                        .arg().cast(T.fn(asyncParams, Ts.prim.void)).value()
                        .call('readPointerOrDefault').receiver(buffer)
                        .arg().call('getManagedCallbackCaller')
                        .arg(kindName).$().$().$().$().$().$()
                        .arg().cast(T.fn(syncParams, Ts.prim.void)).value()
                        .call('readPointerOrDefault').receiver(buffer)
                        .arg().call('getManagedCallbackCallerSync')
                        .arg(kindName).$().$().$().$().$().$().$().$().$()
                ], E.v(name)]
            },
            toInteropBuffer(arg, buffer) {
                return [
                    Builders.stmt().call('holdAndWriteCallback')
                        .receiver(buffer)
                        .arg(arg).$().$()
                ]
            },
        }),

        afterAll: (collected) => {
            const callers = collected.flatMap(d => ({
                callManaged: d[1][1],
                callManagedSync: d[1][2],
                enum: d[1][3] as EnumDeclaration
            }))
            if (callers.length) {
                const caller = Builders.func('impl.getManagedCallbackCaller')
                    .param('kind').typeStr(callers.at(0)!.enum.name).$()
                    .returns(T.c(KOALAUI_KPOINTER))
                    .block()
                        .switch().selector().var('kind').$()
                            .cases(callers.map(it => { return {
                                value: E.c(it.enum.members[0].name),
                                body: [Builders.return().cast(T.c(KOALAUI_KPOINTER)).value(it.callManaged.name.split('.').at(-1)!).$().$()]
                            }})).$()
                        .return().value('nullptr').$().$().$()
                const syncCaller = Builders.func('impl.getManagedCallbackCallerSync')
                    .param('kind').typeStr(callers.at(0)!.enum.name).$()
                    .returns(T.c(KOALAUI_KPOINTER))
                    .block()
                        .switch().selector().var('kind').$()
                            .cases(callers.map(it => { return {
                                value: E.c(it.enum.members[0].name),
                                body: [Builders.return().cast(T.c(KOALAUI_KPOINTER)).value(it.callManagedSync.name.split('.').at(-1)!).$().$()]
                            }})).$()
                        .return().value(Vs.null).$().$().$()
                return [caller, syncCaller]
            }
            return [];
        },

        otherProducers: [
            ohosCallbackResourceProducer,
            ohosVmContentProducer,
        ]
    }
}
