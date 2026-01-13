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

import { D, DD, E, FunctionDeclaration, Hs, LWDeclaration, LWExpression, LWType, Md, S, std, T, Ts, Vs } from "@idlizer/ost";
import { InteropProducerTypeDescription, SelectResult } from "../../generator/builder";
import { getFQName, IDLInterface, IDLMethod, isInterface, isReferenceType } from "@idlizer/core/idl";
import { ColoredLibrary } from "../../library";
import { functionToMethod } from "@idlizer/kit";
import { throwDeclarationWasNotFound } from "../../generator/common";
import { Ask } from "../../generator/seed";
import { PeerFunctionPlacementResult } from "../../generator/generator";

export const createNativeInstanceTypeProducer = (lib: ColoredLibrary, isCXXClasses:boolean): InteropProducerTypeDescription<IDLInterface> => {
    return {
        select: (type) => {
            if (isReferenceType(type)) {
                const decl = lib.index.get(type.name) ?? throwDeclarationWasNotFound(type)
                if (isInterface(decl) && lib.color.get(getFQName(decl)) === 'materialized') {
                    return SelectResult.take(decl)
                }
            }
            return SelectResult.reject()
        },
        interopBufferTransferable: () => ({
            toInteropBuffer(arg, buffer) {
                return [
                    S.e(E.call(E.get(buffer, 'writePointer'), [E.call(E.get(arg, 'getPeer'), [])]))
                ]
            },
            fromInteropBuffer(buffer) {
                return [[], E.call(E.get(buffer, 'readPointer'), [])]
            },
        }),
        returnBufferTransferable: (decl) => ({
            toReturnBuffer(arg, buffer) {
                return [
                    S.e(E.call(E.get(buffer, 'writePointer'), [arg]))
                ]
            },
            fromReturnBuffer(buffer) {
                const primaryExpression = E.call(E.get(E.type(Ask.typeName(decl)), 'fromPeer'), [E.call(E.get(buffer, 'readPointer'), [])])
                return [[], isCXXClasses ? E.cast(primaryExpression, Ts.ptr(Ask.typeName(decl))) : primaryExpression]
            },
        }),
        toInteropTransferable: (decl) => ({
            toInteropArgument(param: LWExpression): [LWExpression, LWType] {
                return [E.call(E.get(param, 'getPeer'), []), Ts.prim.pointer]
            },
            fromInteropArgument(param) {
                return isCXXClasses ? E.cast(param, Ts.ptr(Ask.typeName(decl))) : param
            },
        }),
        fromInteropTransferable: (decl) => ({
            toInteropReturn(param: LWExpression): [LWExpression, LWType] {
                return [param, Ts.prim.pointer]
            },
            fromInteropReturn(param: LWExpression): LWExpression {
                return E.call(E.get(E.type(Ask.typeName(decl)), 'fromPeer'), [param])
            },
        }),
        onManagedDeclaration: (decl) => {
            const declName = getFQName(decl)
            const nativePointerFieldName = '_nativePointer'
            return {
                continuation: T.c(declName),
                declarations: [
                    D.class(declName, [
                        { name: nativePointerFieldName, type: Ts.prim.pointer, modifiers: [Md.private()] }
                    ], [
                        DD({ modifiers: [Md.private()] }).func(std.names.members.ctor, [{ name: 'ptr', type: Ts.prim.pointer }], Ts.prim.void, S.block([
                            S.e(E.bin('=', E.get(Vs.self, nativePointerFieldName), E.v('ptr')))
                        ])),
                        D.func('getPeer', [], Ts.prim.pointer, S.block([
                            S.return(E.get(Vs.self, nativePointerFieldName))
                        ])),
                        DD({ modifiers: [Md.static()] }).func('fromPeer', [{ name: 'ptr', type: Ts.prim.pointer }], T.c(declName), S.block([
                            S.return(E.instance2(T.c(declName), [E.v('ptr')]))
                        ]))
                    ])
                ]
            }
        },
        onNativeDeclaration(decl, _ , ctx) {
            if (ctx.library.flavours.includes("VanillaCXXClasses")) {
                return {
                    continuation: T.c(decl.name),
                    declarations: []
                }
            }
            const name = 'capi.' + 'OH_' + getFQName(decl).split('.').join('_') + 'Peer'
            return {
                continuation: T.c(name),
                declarations: [
                    D.type(name, Ts.prim.pointer)
                ]
            }
        },
    }
}

export function handleInstanceMethodPlacement(original: IDLMethod, declaration:FunctionDeclaration): PeerFunctionPlacementResult {
    if (original.parent && isInterface(original.parent)) {
        const methodCode = original.isStatic ? declaration : functionToMethod(declaration)
        methodCode.name = original.name
        if (original.isStatic) {
            methodCode.modifiers.push(Md.static())
        }
        const declName = getFQName(original.parent)
        return {
            reference: original.isStatic ? E.get(E.v(declName, [Hs.isType()]), methodCode.name) : E.get(Vs.self, methodCode.name),
            declaration: D.class(declName, [], [methodCode])
        }
    }
    return {
        reference: E.v(declaration.name),
        declaration
    }
}
