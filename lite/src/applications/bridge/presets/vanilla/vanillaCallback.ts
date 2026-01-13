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

import { getFQName, IDLCallback, isCallback, isReferenceType } from "@idlizer/core/idl";
import { ColoredLibrary } from "../../library";
import { InteropProducerTypeDescription, makeDeclarationProducer, SelectResult } from "../../generator/builder";
import { terminate } from "../../../../cli/error";
import { DD, D, E, Hs, S, T, Ts, Md, LWStatement, LWExpression, LWType } from "@idlizer/ost";
import { makeSeed } from "../../../../engine";
import { IDLIZER_RAW_MEMORY, IDLIZER_SERIALIZER_BASE, IDLIZER_RESOURCE_MANAGER, IDLIZER_DESERIALIZER_BASE } from "../../generator/names";
import { Ask } from "../../generator/seed";
import { NotTransferrableType } from "../../generator/common";

const [vanillaResourceBox, ResourceBoxSeed] = makeDeclarationProducer(
    makeSeed(() => ':VANILLA:NATIVE_RESOURCE_BOX'),
    () => {
        return {
            continuation: T.c('capi.ResourceBox'),
            declarations: [
                D.struct('capi.ResourceBox', [
                    { name: 'resourceId', type: Ts.prim.i32 },
                ])
            ]
        }
    }
)
const [vanillaNativeCallbackCall, NativeCallbackCall] = makeDeclarationProducer(
    makeSeed<{ callback: IDLCallback, named?: string }>((cb) => `:VANILLA:NATIVE:FUNCTION_CALL:${cb.named ?? '_'}:${getFQName(cb.callback)}`),
    (req, ctx) => {
        const functionName = req.callback.name + '_' + 'CallbackCall'
        const callArgs: [string, LWType][] = req.callback.parameters.map(param => [param.name, Ask.typeName(param.type)])
        callArgs.unshift(['resource', T.c('capi.ResourceBox')])

        const body: LWStatement[] = []
        body.push(S.declaration('memory', T.c(IDLIZER_RAW_MEMORY), true, E.call(E.get(E.v(IDLIZER_RAW_MEMORY, [Hs.isType()]), 'allocate'), [])))
        body.push(S.declaration('thisSerializer', T.c(IDLIZER_SERIALIZER_BASE), true, E.call(E.get(E.v(IDLIZER_SERIALIZER_BASE, [Hs.isType()]), 'use'), [E.v('memory')])))

        req.callback.parameters.forEach(param => {
            const stmts = ctx.library.selector.selectConvertor(param.type).fromBufferTransferrable?.toReturnBuffer(E.v(param.name), E.v('thisSerializer'))
            if (!stmts) {
                throw new NotTransferrableType(param.type, 'fromNativeToManaged')
            }
            body.push(...stmts)
        })
        body.push(S.e(E.call(E.v('enqueueCallback'), [E.get(E.v('resource'), 'resourceId'), E.v('memory')])))

        body.push(S.e(E.call(E.get(E.v('thisSerializer'), 'swap'), [])))

        return {
            continuation: E.v(functionName, req.named ? [Hs.named(req.named)] : undefined),
            declarations: [
                D.func(functionName,
                    callArgs.map(p => ({ name: p[0], type: p[1] })),
                    Ts.prim.void,
                    S.block(body)
                )
            ]
        }
    }
)

const [vanillaManagedSerializerProducer, ManagedCallbackSerializer] = makeDeclarationProducer(
    makeSeed<IDLCallback>(cb => `:VANILLA:MANAGED:SERIALIZER:${getFQName(cb)}`),
    (node, ctx) => {
        const serializerName = getFQName(node) + "_CallbackSerializer"

        const applyBody: LWStatement[] = []
        const applyFuncArgs: LWExpression[] = []
        node.parameters.forEach((param, idx) => {
            const argName = 'orderedParam' + idx
            const res = ctx.library.selector.selectConvertor(param.type).fromBufferTransferrable?.fromReturnBuffer(E.v('buffer'))
            if (!res) {
                throw new NotTransferrableType(param.type, 'fromNativeToManaged')
            }
            const [stmts, expr] = res
            applyBody.push(...stmts)
            applyBody.push(S.declaration(argName, Ask.typeName(param.type), true, expr))
            applyFuncArgs.push(E.v(argName))
        })
        applyBody.push(S.e(E.call(E.v('func'), applyFuncArgs)))

        return {
            continuation: E.v(serializerName, [Hs.isType()]),
            declarations: [
                D.class(serializerName, [], [
                    DD({ modifiers: [Md.static()] }).func(
                        'write', [{ name: 'buffer', type: T.c(IDLIZER_SERIALIZER_BASE) }, { name: 'value', type: Ask.typeName(node) }], Ts.prim.void, S.block([
                            S.e(E.call(E.get(E.v('buffer'), 'writeInt32'), [E.call(E.get(E.v(IDLIZER_RESOURCE_MANAGER, [Hs.isType()]), 'storeCallback'), [E.v('value'), E.get(E.v(serializerName, [Hs.isType()]), 'apply')])]))
                        ])),
                    DD({ modifiers: [Md.static()] }).func(
                        'apply', [{ name: 'func', type: Ask.typeName(node) }, { name: 'buffer', type: T.c(IDLIZER_DESERIALIZER_BASE) }], Ts.prim.void, S.block(applyBody)
                    ),
                ])
            ]
        }
    }
)

export function createVanillaCallbackProducer(library: ColoredLibrary): InteropProducerTypeDescription<IDLCallback> {
    return {
        select: (ref) => {
            if (isReferenceType(ref)) {
                const found = library.index.get(ref.name) ?? terminate("WAS NOT FOUND!")
                if (found && isCallback(found)) {
                    return SelectResult.take(found)
                }
            }
            return SelectResult.reject()
        },
        interopBufferTransferable: (entry) => ({
            fromInteropBuffer(buffer) {
                return [
                    [
                        S.declaration('resourceId', Ts.prim.i32, true, E.call(E.get(buffer, 'readInt32'), [])),
                    ],
                    E.instance2(Ask.typeName(entry), [
                        E.instance2(ResourceBoxSeed.createType({}), [
                            E.v('resourceId', [Hs.named('resourceId')])
                        ], [Hs.asStruct(), Hs.named('resource')]),
                        NativeCallbackCall.createExpr({ callback: entry, named: 'call' })
                    ], [Hs.asStruct()])
                ]
            },
            toInteropBuffer(arg, buffer) {
                return [
                    S.e(E.call(E.get(ManagedCallbackSerializer.createExpr(entry), 'write'), [buffer, arg]))
                ]
            },
        }),
        onManagedDeclaration(val) {
            const name = getFQName(val)
            return {
                continuation: T.c(name),
                declarations: [
                    D.type(
                        name,
                        T.fn(
                            val.parameters.map(param => [param.name, Ask.typeName(param.type)]),
                            Ask.typeName(val.returnType)
                        )
                    )
                ]
            }
        },
        onNativeDeclaration(val) {
            const name = 'capi.' + getFQName(val)
            const callArgs: [string, LWType][] = val.parameters.map(param => [param.name, Ask.typeName(param.type)])
            callArgs.unshift(['resource', T.c('capi.ResourceBox')])
            return {
                continuation: T.c(name),
                declarations: [
                    D.struct(name, [
                        { name: 'resource', type: ResourceBoxSeed.createType({}) },
                        {
                            name: 'call',
                            type: T.fn(
                                callArgs,
                                Ask.typeName(val.returnType)
                            )
                        }
                    ])
                ]
            }
        },
        otherProducers: [
            vanillaNativeCallbackCall,
            vanillaResourceBox,
            vanillaManagedSerializerProducer,
        ]
    }
}
