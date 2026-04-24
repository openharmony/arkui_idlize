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

import { D, DD, E, Hs, LWExpression, LWStatement, Md, S, T, Ts } from "@idlizer/ost";
import { InteropProducerTypeDescription, makeDeclarationProducer, SelectResult } from "../../generator/builder";
import { getFQName, IDLInterface, IDLType, isInterface, isReferenceType } from "@idlizer/core/idl";
import { ColoredLibrary } from "../../library";
import { Seed } from "@idlizer/kit";
import { NotTransferrableType, showErrorFile, throwDeclarationWasNotFound } from "../../generator/common";
import { IDLIZER_SERIALIZER_BASE, IDLIZER_DESERIALIZER_BASE } from "../../generator/names";
import { Ask } from "../../generator/seed";

class StructureSerializerSeedClass extends Seed {
    constructor(public decl: IDLInterface) { super() }
    hash(): string { return `::SERIALIZER:DECL:` + getFQName(this.decl) }
    debugMessage(): string { return `Generating serializer for structure type "${getFQName(this.decl)}" ${showErrorFile(this.decl)}` }
}
const [structureSerializerProducer, StructureSerializerSeed] = makeDeclarationProducer(
    StructureSerializerSeedClass,
    (seed, ctx) => {
        const node = seed.decl
        const generate = (
            readProp: (type: IDLType, buffer: LWExpression) => [LWStatement[], LWExpression],
            writeProp: (type: IDLType, field: LWExpression, buffer: LWExpression) => LWStatement[]
        ) => {
            const serializerName = getFQName(node) + '_Serializer'
            const resultTypeHole = Ask.typeName(node)

            const deserializeMapping: [string, LWExpression][] = []
            const deserializeBody: LWStatement[] = []
            node.properties.forEach(prop => {
                const res = readProp(prop.type, E.v('buffer'))
                if (!res) {
                    throw new NotTransferrableType(prop.type, 'fromManagedToNative')
                }
                const [deserializeBlock, deserializeResult] = res
                deserializeMapping.push([prop.name, deserializeResult])
                deserializeBody.push(
                    ...deserializeBlock
                )
            })
            deserializeBody.push(
                S.return(
                    E.instance2(
                        resultTypeHole,
                        deserializeMapping.map(([name, expr]) => {
                            expr.hints.push(Hs.named(name))
                            return expr
                        }),
                        [Hs.asStruct()]
                    )
                )
            )

            const serializeBody: LWStatement[] = []
            node.properties.forEach(prop => {
                const res = writeProp(prop.type, E.get(E.v('value'), prop.name), E.v('buffer'))
                if (!res) {
                    throw new NotTransferrableType(prop.type, 'fromNativeToManaged')
                }
                serializeBody.push(
                    ...res
                )
            })

            return {
                continuation: E.v(serializerName, [Hs.isType()]),
                declarations: [
                    D.class(serializerName, [], [
                        DD({ modifiers: [Md.static()] }).func(
                            'write', [
                            { name: 'value', type: resultTypeHole },
                            { name: 'buffer', type: T.c(IDLIZER_SERIALIZER_BASE) },
                        ],
                            Ts.prim.void,
                            S.block(serializeBody)
                        ),
                        DD({ modifiers: [Md.static()] }).func(
                            'read', [
                            { name: 'buffer', type: T.c(IDLIZER_DESERIALIZER_BASE) },
                        ],
                            resultTypeHole,
                            S.block(deserializeBody)
                        )
                    ])
                ]
            }
        }
        return ctx.library.stage === 'native'
            ? generate(
                (type, buf) => ctx.library.selector.fromInteropBuffer(type, buf),
                (type, fld, buf) => ctx.library.selector.toReturnBuffer(type, fld, buf)
            )
            : generate(
                (type, buf) => ctx.library.selector.fromReturnBuffer(type, buf),
                (type, fld, buf) => ctx.library.selector.toInteropBuffer(type, fld, buf)
            )
    }
)

export const createStructureProducer = (lib: ColoredLibrary): InteropProducerTypeDescription<IDLInterface> => {
    return {
        select: (type) => {
            if (isReferenceType(type)) {
                const decl = lib.index.get(type.name) ?? throwDeclarationWasNotFound(type)
                if (isInterface(decl) && lib.color.get(getFQName(decl)) === 'structure') {
                    return SelectResult.take(decl)
                }
            }
            return SelectResult.reject()
        },
        interopBufferTransferable: (decl) => ({
            symmetric: true,
            toInteropBuffer(arg: LWExpression, buffer: LWExpression): LWStatement[] {
                return [
                    S.e(E.call(E.get(StructureSerializerSeed.createExpr(decl), 'write'), [arg, buffer]))
                ]
            },
            fromInteropBuffer(buffer) {
                return [[], E.call(E.get(StructureSerializerSeed.createExpr(decl), 'read'), [buffer])]
            },
        }),
        onManagedDeclaration: (decl) => {
            const name = getFQName(decl)
            return {
                continuation: T.c(name),
                declarations: [
                    D.struct(name, decl.properties.map(prop => ({
                        name: prop.name,
                        type: Ask.typeName(prop.type),
                    })))
                ]
            }
        },
        onNativeDeclaration(entry, _, ctx) {
            if (!ctx.library.original.noHeader) {
                const name = 'capi.' + getFQName(entry).split('.').join('_')
                return {
                    continuation: T.c(name),
                    declarations: []
                }
            }
            const name = 'capi.' + 'OH_' + getFQName(entry).split('.').join('_')
            return {
                continuation: T.c(name),
                declarations: [
                    D.struct(name, entry.properties.map(prop => ({
                        name: prop.name,
                        type: Ask.typeName(prop.type),
                    })))
                ]
            }
        },
        otherProducers: [
            structureSerializerProducer
        ]
    }
}
