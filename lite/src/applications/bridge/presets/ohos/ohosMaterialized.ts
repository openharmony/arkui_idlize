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

import { Builders, D, DD, E, FunctionDeclaration, Hs, LWDeclaration, LWExpression, LWType, Md, S, std, T, Ts, Vs } from "@idlizer/ost";
import { createMethod, getFQName, IDLInterface, IDLMethod, IDLPointerType, isClassSubkind, isInterface, isInterfaceSubkind, isReferenceType } from "@idlizer/core/idl";
import { ColoredLibrary } from "../../library";
import { makeSeed } from "../../../../engine";
import { functionToMethod } from "../../../../processors/transformers";
import { makeDeclarationProducer, InteropProducerTypeDescription, SelectResult } from "../../generator/builder";
import { showErrorForIDLNode, throwDeclarationWasNotFound } from "../../generator/common";
import { KOALAUI_FINALIZABLE, KOALAUI_INTEROP_NATIVE_POINTER, KOALAUI_KPOINTER, KOALAUI_MATERIALIZED_BASE, KOALAUI_TO_PEER_PTR } from "../../generator/names";
import { Ask } from "../../generator/seed";
import { PeerFunctionPlacementResult } from "../../generator/generator";

function getMaterializedImplementationName(decl: IDLInterface) {
    const fqName = getFQName(decl)
    return isInterfaceSubkind(decl)
        ? fqName + 'Internal'
        : fqName
}

const [materializedImplementationProducer, MaterializedImplementationSeed] = makeDeclarationProducer(
    makeSeed<IDLInterface>(
        decl => ':OHOS:MATERIALIZED:IMPL:' + getFQName(decl),
        decl => `Generating implementation for materialized class. ` + showErrorForIDLNode(decl),
    ),
    decl => {
        const finalizerMethod = createMethod('getFinalizer', [], IDLPointerType, { isStatic: true, isAsync: false, isFree: false, isOptional: false })
        finalizerMethod.parent = decl
        const name = getMaterializedImplementationName(decl)
        const peerType = Ts.union([T.c(KOALAUI_FINALIZABLE), Ts.prim.undefined])
        const matClass = Builders.class(name).implements(T.c(KOALAUI_MATERIALIZED_BASE))
            .method('fromPtr').static()
            .returns(Ask.typeName(decl))
            .param('ptr').type(T.c(KOALAUI_KPOINTER)).$().block()
            .return(Ask.typeName(decl)).ctor(name).arg('ptr').$().$().$().$()
            .field('peer').type(peerType).$()
            .method('getPeer').returns(peerType).block()
            .return(peerType).access('peer').receiver('this').$().$().$().$()
            .method('setPeer').private().param('peerPtr').type(T.c(KOALAUI_KPOINTER)).$().block()
            .binary('=')
            .left().access('peer').receiver('this').$().$()
            .right().ctor('Finalizable')
            .arg('peerPtr')
            .arg().call(Ask.interopMethod(finalizerMethod)).$().$().$().$().$().$().$()
            // default constructor
            .ctor().param('ptr').type(T.c(KOALAUI_KPOINTER)).$().block()
            .call('setPeer').receiver('this').arg('ptr').$().$().$().$()

        return {
            continuation: T.c(matClass.name),
            declarations: [matClass]
        }
    }
)

export const createOhosMaterializedProducer = (lib: ColoredLibrary): InteropProducerTypeDescription<IDLInterface> => {
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
                const peerPtr = Builders.call(KOALAUI_TO_PEER_PTR).arg(arg).$()
                return [
                    Builders.stmt().call('writePointer')
                        .receiver(buffer)
                        .arg(peerPtr).$().$()
                ]
            },
            fromInteropBuffer(buffer) {
                return [[], Builders.call('readPointer').receiver(buffer).$()]
            },
        }),
        returnBufferTransferable: (decl) => ({
            toReturnBuffer(arg, buffer) {
                return [
                    Builders.stmt().call('writePointer')
                        .receiver(buffer)
                        .arg(arg).$().$()
                ]
            },
            fromReturnBuffer(buffer) {
                const peerPtr = Builders.call('readPointer').receiver(buffer).$()
                const peer = Builders.call('fromPtr')
                    .receiver(E.type(MaterializedImplementationSeed.createType(decl)))
                    .arg(peerPtr).$()
                return [[], peer]
            },
        }),
        toInteropTransferable: () => ({
            toInteropArgument(param: LWExpression): [LWExpression, LWType] {
                return [Builders.call(KOALAUI_TO_PEER_PTR).arg(param).$(), T.c(KOALAUI_KPOINTER)]
            },
            fromInteropArgument(param) {
                return param
            },
        }),
        fromInteropTransferable: (decl) => ({
            toInteropReturn(param: LWExpression): [LWExpression, LWType] {
                return [param, T.c(KOALAUI_KPOINTER)]
            },
            fromInteropReturn(param: LWExpression): LWExpression {
                return Builders.call('fromPtr')
                    .receiver(E.type(MaterializedImplementationSeed.createType(decl)))
                    .arg(param).$()
            },
        }),
        onManagedDeclaration: (decl) => {
            if (isClassSubkind(decl)) {
                return {
                    continuation: MaterializedImplementationSeed.createType(decl),
                    declarations: []
                }
            }
            const interfaceName = getFQName(decl)
            return {
                continuation: T.c(interfaceName),
                declarations: [
                    D.class(interfaceName,
                        decl.properties.map(prop => ({
                            name: prop.name,
                            type: Ask.typeName(prop.type)
                        })),
                        decl.methods.map(method => {
                            return D.func(
                                method.name,
                                method.parameters.map(param => ({
                                    name: param.name,
                                    type: Ask.typeName(param.type)
                                })),
                                Ask.typeName(method.returnType),
                            )
                        }),
                        {
                            kind: 'interface'
                        }
                    )
                ],
                trigger: [MaterializedImplementationSeed.create(decl)]
            }
        },
        onNativeDeclaration(decl) {
            const name = 'capi.' + 'OH_' + getFQName(decl).split('.').join('_') + 'Peer'
            return {
                continuation: T.c(name),
                declarations: [
                    D.type(name, T.c(KOALAUI_INTEROP_NATIVE_POINTER))
                ]
            }
        },
        otherProducers: [
            materializedImplementationProducer
        ]
    }
}

export function handleOHMethodPlacement(original: IDLMethod, declaration: FunctionDeclaration): PeerFunctionPlacementResult {
    if (original.parent && isInterface(original.parent)) {
        const methodCode = original.isStatic ? declaration : functionToMethod(declaration)
        methodCode.name = original.name
        if (original.isStatic) {
            methodCode.modifiers.push(Md.static())
        }
        const implName = getMaterializedImplementationName(original.parent)
        return {
            reference: original.isStatic ? E.get(E.v(implName, [Hs.isType()]), methodCode.name) : E.get(Vs.self, methodCode.name),
            declaration: D.class(implName, [], [methodCode])
        }
    }
    return {
        reference: E.v(declaration.name),
        declaration,
    }
}
