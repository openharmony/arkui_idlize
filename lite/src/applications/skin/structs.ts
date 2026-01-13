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

import { createConstructor, createParameter, createReferenceType, hasExtAttribute, IDLBooleanType, IDLConstructor, IDLEnum, IDLExtendedAttributes, IDLF32Type, IDLI32Type, IDLInterface, IDLPointerType, IDLType, IDLVoidType, isEnum, isInterface, isReferenceType } from "@idlizer/core/idl"
import { E, LWExpression, LWStatement, LWType, S, Ts } from "@idlizer/libohos"
import { terminate } from "../../cli/error"
import { IDLLibrary } from "./library"
import { GO } from "./generator"

export interface StructMemoryInfo {
    ctor: IDLConstructor
    bufferType: LWType
    isWriteable: boolean
    structureSize: number
    basedOn: 'Float32' | 'Int32'
    basedOnStat: SelectStat,
    init(): LWExpression,
    clone(src: LWExpression, srcOffset: LWExpression, dst: LWExpression, dstOffset: LWExpression): LWStatement[],
    assignTo(idx: number, offsetVar: LWExpression, receiver: LWExpression, param: LWExpression): LWStatement[]
    readFrom(idx: number, offsetVar: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression]
}

///

function typeSizeOf(type: IDLType, lib: IDLLibrary): number {
    if (type === IDLI32Type) {
        return 1
    }
    if (type === IDLBooleanType) {
        return 1
    }
    if (type === IDLF32Type) {
        return 1
    }
    if (type === IDLPointerType) {
        return 2
    }
    if (isReferenceType(type)) {
        const decl = lib.toDeclaration(type)
        if (isEnum(decl)) {
            return 1
        }
        if (isInterface(decl)) {
            if (hasExtAttribute(decl, IDLExtendedAttributes.DataClass)) {
                return makeStructureInfo(decl, lib).structureSize
            }
            return 2
        }
    }
    terminate('UNKNOWN TYPE 1')
}

interface SelectStat {
    f32: number
    i32: number
}

function selectBaseTypeFor(type: IDLType, lib:IDLLibrary, seenVals: Set<StructMemoryInfo['basedOn']>): SelectStat {
    if (type === IDLI32Type) {
        return { i32: 1, f32: 0 }
    }
    if (type === IDLF32Type) {
        return { i32: 0, f32: 1 }
    }
    if (type === IDLBooleanType) {
        return { i32: 0, f32: 0 }
    }
    if (isReferenceType(type)) {
        const decl = lib.toDeclaration(type)
        if (isEnum(decl)) {
            return { f32: 0, i32: 0 }
        }
        if (isInterface(decl)) {
            if (hasExtAttribute(decl, IDLExtendedAttributes.DataClass)) {
                const info = makeStructureInfo(decl, lib)
                if (seenVals.size === 0) {
                    seenVals.add(info.basedOn)
                } else {
                    if (!seenVals.has(info.basedOn)) {
                        terminate("MIXED DATA CLASSES IS NOT ALLOWED")
                    }
                }
                return info.basedOnStat
            }
            return { f32: 0, i32: 2 }
        }
    }
    terminate('UNKNOWN TYPE 2')
}

///

class FieldAssigner {
    constructor(
        private library: IDLLibrary,
        private basedOn: StructMemoryInfo['basedOn']
    ) { }

    private unsafeToInt32(f32Expression: LWExpression): LWExpression {
        return E.call(E.get(E.get(E.v('InteropUtils'), 'UnsafeCast'), 'float32ToInt32'), [f32Expression])
    }

    private unsafeToFloat32(i32Expression: LWExpression): LWExpression {
        return E.call(E.get(E.get(E.v('InteropUtils'), 'UnsafeCast'), 'int32ToFloat32'), [i32Expression])
    }

    private assignI32ToVec(param: LWExpression, offsetVal: LWExpression, receiver: LWExpression) {
        const arg = this.basedOn === 'Int32' ? param : this.unsafeToFloat32(param)
        return [S.e(E.bin('=', E.get(receiver, offsetVal), arg))]
    }

    private assignF32ToVec(param: LWExpression, offsetVal: LWExpression, receiver: LWExpression) {
        const arg = this.basedOn === 'Float32' ? param : this.unsafeToInt32(param)
        return [S.e(E.bin('=', E.get(receiver, offsetVal), arg))]
    }

    private assignBooleanToVec(param: LWExpression, offsetVal: LWExpression, receiver: LWExpression) {
        const castName = this.basedOn === 'Int32' ? 'boolToInt32' : 'boolToFloat32'
        return [S.e(E.bin('=', E.get(receiver, offsetVal), E.call(E.get(E.get(E.v('InteropUtils'), 'UnsafeCast'), castName), [param])))]
    }

    private assignEnumToVec(param: LWExpression, offsetVal: LWExpression, receiver: LWExpression) {
        const enumIntVal = E.call(E.get(param, 'valueOf'), [])
        const arg = this.basedOn === 'Int32' ? enumIntVal : E.call(E.get(enumIntVal, 'toFloat'), [])
        return [
            S.e(E.bin('=', E.get(receiver, offsetVal), arg))
        ]
    }

    private assignDataToVec(param: LWExpression, offsetVal: LWExpression, receiver: LWExpression) {
        // TODO:
        return [
            S.e(E.call(E.get(param, 'cloneTo'), [receiver, offsetVal]))
        ]
    }

    private assignPeerToVec(param: LWExpression, offsetVal: LWExpression, receiver: LWExpression) {
        const loBites = E.call(E.get(E.bin('&', E.bin('>>', E.get(param, 'ptr'), E.c('0x0')), E.c('0xFFFFFFFF')), 'toInt'), [])
        const hiBites = E.call(E.get(E.bin('&', E.bin('>>', E.get(param, 'ptr'), E.c('0x2')), E.c('0xFFFFFFFF')), 'toInt'), [])

        const loBitesCasted = this.basedOn === 'Int32' ? loBites : this.unsafeToFloat32(loBites)
        const hiBitesCasted = this.basedOn === 'Int32' ? hiBites : this.unsafeToFloat32(hiBites)

        return [
            S.e(E.bin('=', E.get(receiver, E.bin('+', offsetVal, E.c(0))), loBitesCasted)),
            S.e(E.bin('=', E.get(receiver, E.bin('+', offsetVal, E.c(1))), hiBitesCasted))
        ]
    }

    assignToType(type: IDLType, param: LWExpression, offsetVal: LWExpression, receiver: LWExpression) {
        if (type === IDLI32Type) {
            return this.assignI32ToVec(param, offsetVal, receiver)
        }
        if (type === IDLF32Type) {
            return this.assignF32ToVec(param, offsetVal, receiver)
        }
        if (type === IDLBooleanType) {
            return this.assignBooleanToVec(param, offsetVal, receiver)
        }
        if (isReferenceType(type)) {
            const decl = this.library.toDeclaration(type)
            if (isEnum(decl)) {
                return this.assignEnumToVec(param, offsetVal, receiver)
            }
            if (isInterface(decl)) {
                if (hasExtAttribute(decl, IDLExtendedAttributes.DataClass)) {
                    return this.assignDataToVec(param, offsetVal, receiver)
                }
                return this.assignPeerToVec(param, offsetVal, receiver)
            }
        }
        terminate("ERROR 42")
    }

    ///

    private readI32FromVec(offsetVal: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression] {
        const gotValue = E.get(receiver, offsetVal)
        const result = this.basedOn === 'Int32' ? gotValue : this.unsafeToInt32(gotValue)
        return [[], result]
    }

    private readF32FromVec(offsetVal: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression] {
        const gotValue = E.get(receiver, offsetVal)
        const result = this.basedOn === 'Float32' ? gotValue : this.unsafeToFloat32(gotValue)
        return [[], result]
    }

     private readBoolFromVec(offsetVal: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression] {
        const gotValue = E.get(receiver, offsetVal)
        const cmpVal = this.basedOn === 'Float32' ? E.c('0.0') : E.c('0')
        return [[], E.bin('!=', cmpVal, gotValue)]
    }

    private readEnumFromVec(decl: IDLEnum, offsetVal: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression] {
        const gotValue = E.get(receiver, offsetVal)
        const intEnumVal = this.basedOn === 'Int32' ? gotValue : E.call(E.get(gotValue, 'toInt'), [])
        return [[], E.call(E.get(E.type(GO.typeName(createReferenceType(decl))), 'fromValue'), [intEnumVal])]
    }

    private readDataFromVec(decl: IDLInterface, offsetVal: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression] {
        // TODO:
        return [[], E.instance2(GO.typeName(createReferenceType(decl)), [receiver, offsetVal])]
    }

    private readPeerFromVec(decl: IDLInterface, offsetVal: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression] {
        const loBites = E.get(receiver, E.bin('+', offsetVal, E.c(0)))
        const hiBites = E.get(receiver, E.bin('+', offsetVal, E.c(1)))

        const loBitesCasted = this.basedOn === 'Int32' ? loBites : this.unsafeToInt32(loBites)
        const hiBitesCasted = this.basedOn === 'Int32' ? hiBites : this.unsafeToInt32(hiBites)

        return [
            [],
            E.instance2(GO.typeName(createReferenceType(decl)), [
                E.bin('|',
                    E.bin('<<', E.call(E.get(loBitesCasted, 'toLong'), []), E.c('0x0')),
                    E.bin('<<', E.call(E.get(hiBitesCasted, 'toLong'), []), E.c('0x2'))
                ),
                E.c('true')
            ])
        ]
    }

    readFromType(type: IDLType, offsetVal: LWExpression, receiver: LWExpression): [LWStatement[], LWExpression] {
        if (type === IDLI32Type) {
            return this.readI32FromVec(offsetVal, receiver)
        }
        if (type === IDLF32Type) {
            return this.readF32FromVec(offsetVal, receiver)
        }
        if (type === IDLBooleanType) {
            return this.readBoolFromVec(offsetVal, receiver)
        }
        if (isReferenceType(type)) {
            const decl = this.library.toDeclaration(type)
            if (isEnum(decl)) {
                return this.readEnumFromVec(decl, offsetVal, receiver)
            }
            if (isInterface(decl)) {
                if (hasExtAttribute(decl, IDLExtendedAttributes.DataClass)) {
                    return this.readDataFromVec(decl, offsetVal, receiver)
                }
                return this.readPeerFromVec(decl, offsetVal, receiver)
            }
        }
        terminate("ERROR 42")
    }

}

// REVIEW AND REWORK THE METHOD
export function makeStructureInfo(decl: IDLInterface, lib: IDLLibrary): StructMemoryInfo {
    return makeStructureInfoUnpacked(decl, lib)
}

function makeStructureInfoUnpacked(decl: IDLInterface, lib: IDLLibrary): StructMemoryInfo {

    const offsetTable: number[] = []
    let structureSize = 0
    decl.properties.forEach(param => {
        offsetTable.push(structureSize)
        structureSize += typeSizeOf(param.type, lib)
    })
    const basedOnStat: SelectStat = { f32: 0, i32: 0 }
    const seenBasedOn = new Set<StructMemoryInfo['basedOn']>()
    decl.properties.forEach(param => {
        const stat = selectBaseTypeFor(param.type, lib, seenBasedOn)
        basedOnStat.i32 += stat.i32
        basedOnStat.f32 += stat.f32
    })
    const basedOn: StructMemoryInfo['basedOn'] = basedOnStat.i32 >= basedOnStat.f32 ? 'Int32' : 'Float32'
    const bufferType = basedOn === "Int32" ? Ts.vector(Ts.prim.i32) : Ts.vector(Ts.prim.f32)
    const assigner = new FieldAssigner(lib, basedOn)
    return {
        ctor: createConstructor(
            decl.properties.map(prop => createParameter(prop.name, prop.type)),
            IDLVoidType
        ),
        bufferType,
        isWriteable: true,
        structureSize,
        basedOn,
        basedOnStat,
        init() {
            return E.instance2(bufferType, [E.c(structureSize)])
        },
        clone(src, srcOffset, dst, dstOffset) {
            return [
                S.declaration('srcLength', Ts.prim.i32, false, E.get(src, 'length')),
                S.declaration('ii', Ts.prim.i32, true, E.c(0)),
                S.loop(E.bin('<', E.v('ii'), E.v('srcLength')), S.block([
                    S.e(E.bin('=', E.get(dst, E.bin('+', dstOffset, E.v('ii'))), E.get(src, E.bin('+', srcOffset, E.v('ii'))))),
                    S.e(E.bin('+=', E.v('ii'), E.c(1)))
                ])),
            ]
        },
        assignTo(idx, offsetVar, receiver, param) {
            return assigner.assignToType(decl.properties[idx].type, param, E.bin('+', offsetVar, E.c(offsetTable[idx])), receiver)
        },
        readFrom(idx, offsetVar, receiver) {
            return assigner.readFromType(decl.properties[idx].type, E.bin('+', offsetVar, E.c(offsetTable[idx])), receiver)
        },
    }
}
