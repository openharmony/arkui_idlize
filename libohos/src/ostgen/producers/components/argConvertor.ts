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
import { generatorConfiguration, hashCodeFromString, isDefined, isMaterialized, maybeRestoreThrows } from "@idlizer/core"
import { Builders, E, LWExpression, LWStatement, lw, Op, std, T, Ts, Hs } from "@idlizer/ost"
import { cApiName, expectExpr, expectType, managedName } from "../common.js"
import { OhosProducerContext } from "../../engine/index.js"

function selectPrimitiveTypeName(type: idl.IDLPrimitiveType): string {
    switch (type.name) {
        case 'any': return 'Object'
        case 'boolean': return 'Boolean'
        case 'bigint': return 'Int64' ///really?
        case 'buffer':
        case 'SerializerBuffer': return 'Buffer'
        case 'date': return 'Int64'
        case 'i8':
        case 'u8': return 'Int8'
        case 'i32':
        case 'u32': return 'Int32'
        case 'i64':
        case 'u64': return 'Int64'
        case 'f32': return 'Float32'
        case 'f64': return 'Float64'
        case 'number': return 'Number'
        case 'Object': return 'Object'
        case 'pointer': return 'Pointer'
        case 'String': return 'String'
        default: throw new Error(`Missing primitive convertor for "${idl.DebugUtils.debugPrintTrace(type)}"`)
    }
}
function selectWriteName(type: idl.IDLPrimitiveType, native?: boolean): string {
    return type.name === 'any' && !native
        ? 'holdAndWriteObject'
        : "write" + selectPrimitiveTypeName(type)
}
function selectReadName(type: idl.IDLPrimitiveType): string {
    return "read" + selectPrimitiveTypeName(type)
}

export abstract class ArgConvertor<T extends idl.IDLType> {
    constructor(
        protected ctx: OhosProducerContext,
        protected type: T
    ) {}

    abstract interopType(native: boolean): lw.LWType
    abstract write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[]
    abstract read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression]

    isPointer(): boolean {
        return false
    }
    returnFromInterop(resultVarName: string): LWStatement[] {
        return [Builders.return().value(resultVarName).$()]
    }
    protected getSerializer(node: idl.IDLInterface, native: boolean) {
        return native
            ? expectExpr(this.ctx, node, 'native-serde')
            : expectExpr(this.ctx, node, 'managed-serde')
    }
    protected convertType(type: idl.IDLType, native: boolean): lw.LWType {
        return native
            ? expectType(this.ctx, type, 'capi')
            : expectType(this.ctx, type, 'managed')
    }
}

export function argConvertor(ctx: OhosProducerContext, type: idl.IDLType, optional?: boolean): ArgConvertor<idl.IDLType> {
    ///what can we cache here? Take optional props into account
    if (optional)
        return new OptionalConvertor(ctx, idl.createOptionalType(type))
    if (idl.isOptionalType(type))
        return new OptionalConvertor(ctx, type)
    if (idl.isPrimitiveType(type))
        return new PrimitiveConvertor(ctx, type)
    if (idl.isContainerType(type)) {
        switch (type.containerKind) {
            case 'sequence':
                return new ArrayConvertor(ctx, type)
            case 'record':
                return new MapConvertor(ctx, type)
            case 'Promise':
                const ref = ctx.library.createContinuationCallbackReference(type)
                const continuation = ctx.library.resolveTypeReference(ref)! as idl.IDLCallback
                return new PromiseConvertor(ctx, ref, continuation, type)
        }
    }
    if (idl.isUnionType(type))
        return new UnionConvertor(ctx, type)
    if (idl.isReferenceType(type)) {
        const resolved = ctx.library.toDeclaration(type)
        if (resolved) {
            if (idl.isType(resolved))
                return argConvertor(ctx, resolved, optional)
            if (idl.isInterface(resolved)) {
                const restoredType = maybeRestoreThrows(resolved, ctx.library)
                if (restoredType)
                    return new ThrowsConvertor(ctx, type, restoredType)
                return isMaterialized(resolved, ctx.library)
                    ? new MaterializedConvertor(ctx, type)
                    : new DataConvertor(ctx, type, resolved)
            }
            if (idl.isEnum(resolved))
                return new EnumConvertor(ctx, resolved)
            if (idl.isCallback(resolved))
                return new CallbackConvertor(ctx, type, resolved)
        }
    }
    throw new Error(`Missing convertor for "${idl.DebugUtils.debugPrintTrace(type)}"`)
}

class PrimitiveConvertor extends ArgConvertor<idl.IDLPrimitiveType> {
    interopType(native: boolean): lw.LWType {
        switch (this.type.name) {
            case 'buffer': return Ts.prim.interopReturnBuffer
            case 'number': return Ts.prim.interopNumber
            case 'String': return Ts.prim.interopString
            case 'this':
            case 'void': return Ts.prim.void
            default: return this.convertType(this.type, native)
        }
    }
    isPointer(): boolean {
        return ['buffer', 'number', 'String'].includes(this.type.name)
    }
    returnFromInterop(resultVarName: string): LWStatement[] {
        switch (this.type.name) {
            case 'buffer':
                return [Builders.return().call('readBuffer')
                    .receiver().ctor('DeserializerBase')
                        .arg(resultVarName)
                        .arg().access('length').receiver(resultVarName).$().$().$().$()
                    .$().$()];
            case 'void':
                return []
            default:
                return super.returnFromInterop(resultVarName)
        }
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        const stmts: LWStatement[] = [
            Builders.stmt().call(selectWriteName(this.type, native))
                .receiver(serializerName)
                .arg(accessor).$().$()
        ]
        // if (this.type.name === 'any' && native) {
        //     stmts.unshift(
        //         Builders.decl('argResource', T.c(cApiName('CallbackResource'))).value()
        //             .ctor().asStruct()
        //                 .arg().access('resourceId').receiver().access('resource').receiver(accessor).$().$().$().$()
        //                 .arg('holdManagedCallbackResource')
        //                 .arg('releaseManagedCallbackResource').$().$().$(),
        //         Builders.stmt().call('holdCallbackResource')
        //             .receiver().access('resourceHolder').receiver('callbackBuffer').$().$()
        //             .arg().unary(Op.ref).value('argResource').$().$().$().$()
        //     )
        // }
        return stmts
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        let expr = Builders.expr().call(selectReadName(this.type)).receiver(serializerName).$().$()
        if (!native && idl.isPrimitiveType(this.type, 'number')) // ugh
            expr = Builders.cast(Ts.prim.number).value(expr).$()
        return [
            [Builders.decl(name).value(expr).$()],
            E.v(name)
        ]
    }
}

class EnumConvertor extends ArgConvertor<idl.IDLPrimitiveType> {
    private arity: number
    constructor(ctx: OhosProducerContext, protected decl: idl.IDLEnum) {
        const isLong = (n: number) => n >= 0x7FFFFFFF || n < -0x80000000
        const elementType = decl.elements[0]?.type
        const enumType: idl.IDLPrimitiveType['name'] =
            elementType.name === 'String'
                ? 'String'
                : decl.elements.some(it => typeof it.initializer === 'number' && isLong(it.initializer))
                    ? 'i64' : 'i32'
        super(ctx, idl.createPrimitiveType(enumType))
        this.arity = enumType === 'i64' ? 64 : 32
    }
    interopType(native: boolean): lw.LWType {
        return this.type.name === 'i64' ? Ts.prim.i64 : Ts.prim.i32
    }
    returnFromInterop(resultVarName: string): LWStatement[] {
        return [Builders.return().value(this.valueToEnum(E.v(resultVarName))).$()]
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        const enumValue = native
            ? accessor
            : Builders.call(this.type.name === 'String' ? 'getOrdinal' : 'valueOf').receiver(accessor).$()
        return [
            Builders.stmt().call('writeInt' + this.arity).receiver(serializerName).arg(enumValue).$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const readExpr = Builders.call('readInt' + this.arity).receiver(serializerName).$()
        return [
            [native
                ? Builders.decl(name).value()
                    .cast(expectType(this.ctx, this.decl, 'capi')).static().value(readExpr).$().$().$()
                : Builders.decl(name).value(this.valueToEnum(readExpr)).$()
            ],
            E.v(name)
        ]
    }
    private valueToEnum(valueExpr: LWExpression): LWExpression {
        const enumTypeNameExpr = E.type(expectType(this.ctx, this.decl, 'managed'))
        return this.type.name === 'String'
            ? Builders.access(valueExpr).receiver().call('values').receiver(enumTypeNameExpr).$().$().$()
            : Builders.call('fromValue').receiver(enumTypeNameExpr).arg(valueExpr).$()
    }
}

class MaterializedConvertor extends ArgConvertor<idl.IDLReferenceType> {
    interopType(native: boolean): lw.LWType {
        return Ts.prim.pointer
    }
    returnFromInterop(resultVarName: string): LWStatement[] {
        return [Builders.return().value(this.fromPtr(E.v(resultVarName), false)).$()]
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        const peerPtr = native
            ? accessor
            : Builders.call('toPeerPtr').arg(accessor).$()
        return [Builders.stmt().call('writePointer')
            .receiver(serializerName)
            .arg(peerPtr).$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const peerPtr = Builders.call('readPointer').receiver(serializerName).$()
        return [
            [Builders.decl(name).value(this.fromPtr(peerPtr, native)).$()],
            E.v(name)
        ]
    }
    private fromPtr(peerPtr: LWExpression, native: boolean): LWExpression {
        return native
            ? peerPtr
            : Builders.call('fromPtr')
                .receiver().type(managedName(this.type.name + 'Internal')).$()
                .arg(peerPtr).$()

    }
}

abstract class StructConvertor<T extends idl.IDLType> extends ArgConvertor<T> {
    interopType(native: boolean): lw.LWType {
        return Ts.prim.interopReturnBuffer
    }
    isPointer(): boolean {
        return true
    }
    returnFromInterop(resultVarName: string): LWStatement[] {
        const [reads, readValue] = this.read(`${resultVarName}Deserialized`, E.v('returnDeserializer'), false)
        return [
            Builders.decl('returnDeserializer', T.c('DeserializerBase')).value().ctor('DeserializerBase')
                .arg(resultVarName)
                .arg().access('length').receiver(resultVarName).$().$().$().$().$(),
            ...reads,
            Builders.return().value(readValue).$()
        ]
    }
}


class ThrowsConvertor extends StructConvertor<idl.IDLType> {
    private convertor: ArgConvertor<idl.IDLType>

    constructor(ctx: OhosProducerContext, type: idl.IDLReferenceType, protected restoredType: idl.IDLType) {
        super(ctx, type)
        this.convertor = argConvertor(ctx, restoredType)
    }
    returnFromInterop(resultVarName: string): LWStatement[] {
        const [reads, readValue] = this.read(`${resultVarName}Deserialized`, E.v('returnDeserializer'), false)
        return [
            Builders.decl('returnDeserializer', T.c('DeserializerBase')).value().ctor('DeserializerBase')
                .arg(resultVarName)
                .arg().access('length').receiver(resultVarName).$().$().$().$().$(),
            ...reads,
        ]
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        if (native) {
            const isVoid = idl.isVoidType(this.restoredType)
            const writes = isVoid ? [] : this.convertor.write(
                Builders.access().member('value').receiver(accessor).$(), serializerName, native)
            return [
                Builders.decl('isException').type(Ts.prim.boolean).value().access().member('hasException').receiver(accessor).$().$().$(),
                Builders.stmt().call('writeBoolean').arg(E.c('isException')).receiver(serializerName).$().$(),
                Builders.if()
                    .cond().const('isException').$()
                    .then().block()
                        .call('writeException').arg(Builders.access().member('exception').receiver(accessor).$())
                        .receiver(serializerName).$().$().$()
                    .else().block()
                        .statements(writes).$().$().$(),
            ]
        }
        return[]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        if (native)
            return [[], E.v(name)]
        const isVoid = idl.isVoidType(this.restoredType)
        let readsReturnValue: lw.LWStatement[] = []
        if (!isVoid) {
            const [reads, readValue] = this.convertor.read(name, serializerName, native)
            readsReturnValue = [...reads, Builders.return().value(readValue).$()]
        }
        return [
            [
                Builders.decl('isError').type(Ts.prim.boolean).value().call('readBoolean').receiver(serializerName).$().$().$(),
                Builders.if().condition(E.c('isError')).then().block()
                    .statements([
                        Builders.throw().err().call('readException').receiver(serializerName).$().$().$()
                    ]).$().$().$(),
                ...readsReturnValue,
            ],
            E.v(name)
        ]
    }
}

class DataConvertor extends StructConvertor<idl.IDLReferenceType> {
    constructor(ctx: OhosProducerContext, type: idl.IDLReferenceType, protected decl: idl.IDLInterface) {
        super(ctx, type)
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        if (!native && idl.getExtAttribute(this.decl, idl.IDLExtendedAttributes.Entity) === idl.IDLEntity.Tuple) {
            return this.decl.properties.flatMap((prop, index) =>
                argConvertor(this.ctx, prop.type, prop.isOptional).write(E.get(accessor, E.c(index)), serializerName, false))
        }
        return [Builders.stmt().call().function()
            .access('write')
                .receiver(this.getSerializer(this.decl, native))
                .static().$().$()
            .arg(serializerName).arg(accessor).$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        if (!native && idl.getExtAttribute(this.decl, idl.IDLExtendedAttributes.Entity) === idl.IDLEntity.Tuple) {
            const [propReads, propValues] = this.decl.properties
                .map((prop, index) => argConvertor(this.ctx, prop.type, prop.isOptional).read(name + index, serializerName, false))
                .reduce<[lw.LWStatement[], lw.LWExpression[]]>(([accReads, accValues], [curReads, curValue]) =>
                    [accReads.concat(curReads), [...accValues, curValue]], [[], []])
            const tupleType = Ts.intersection(this.decl.properties.map(prop => expectType(this.ctx, prop.type, 'managed')))
            const decl = Builders.decl(name, tupleType).value().ctor().array().args(propValues).$().$().$()
            return [
                [...propReads, decl],
                E.v(name)
            ]
        }
        return [
            [Builders.decl(name).value().call()
                .function()
                    .access('read')
                    .receiver(this.getSerializer(this.decl, native))
                    .static().$().$()
                .arg(serializerName).$().$().$()],
            E.v(name)
        ]
    }
}

class ArrayConvertor extends StructConvertor<idl.IDLContainerType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        const arrayAccess = native
            ? Builders.access().receiver(accessor).member(`array`).$()
            : accessor
        return [
            Builders.stmt().call('writeInt32').receiver(serializerName)
                .arg().access('length').receiver(accessor).$().$().$().$(),
            Builders.loop()
                .init().decl('i').mutable().value('0').$().$()
                .cond().binary(Op.lt).left('i').right().access('length').receiver(accessor).$().$().$().$()
                .step().binary('=').left('i').right().binary(Op.add).left('i').right(1).$().$().$().$()
                .body().block()
                    .decl('item').value().access().receiver(arrayAccess).index('i').$().$().$()
                    .statements(argConvertor(this.ctx, this.type.elementType[0]).write(E.v('item'), serializerName, native)).$().$().$()
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const lengthDecl = Builders.decl(`${name}Length`).value()
            .call('readInt32').receiver(serializerName).$().$().$()
        const elemType = this.convertType(this.type.elementType[0], native);
        const nativeArrayType = expectType(this.ctx, this.type, 'capi')
        const bufferDecl = native
            ? Builders.decl(name).type(nativeArrayType).mutable()
                .value().ctor().asStruct().$().$().$()
            : Builders.decl(name).value()
                .ctor(std.names.types.array).typeArgs([elemType]).arg(name + 'Length').$().$().$()
        const [reads, readValue] = argConvertor(this.ctx, this.type.elementType[0])
            .read(name + 'Element', serializerName, native);
        const arrayAccess = native
            ? Builders.access().receiver(name).member(`array`).$()
            : name
        const resizeArray = native
            ? Builders.stmt().call("resizeArray").typeArgs([nativeArrayType, elemType]).receiver(serializerName)
                .arg(Builders.expr().unary(Op.ref).value(name).$().$())
                .arg(`${name}Length`).$().$()
            : Builders.none().$()
        const loop = Builders.loop()
            .init().decl('i').mutable().value(0).$().$()
            .cond().binary(Op.lt).left('i').right(name + 'Length').$().$()
            .step().unary(Op.postinc).value('i').$().$()
            .body().block()
                .statements(reads)
                .binary('=')
                    .left().access().receiver(arrayAccess).index('i').$().$()
                    .right(readValue).$().$().$().$()
        return [[lengthDecl, bufferDecl, resizeArray, loop], E.v(name)]
    }
}

class MapConvertor extends StructConvertor<idl.IDLContainerType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            Builders.stmt().call('writeInt32').receiver(serializerName)
                .arg().access('size').receiver(accessor).$().$().$().$(),
            native
                ? Builders.none().$()
                : Builders.decl('entries').value().call('from').receiver('Array')
                    .arg().call('entries').receiver(accessor).$().$().$().$().$(),
            Builders.loop()
                .init().decl('i').mutable().value('0').$().$()
                .cond().binary(Op.lt).left('i').right( native
                    ? Builders.access('size').receiver(accessor).$()
                    : Builders.access('length').receiver('entries').$()
                ).$().$()
                .step().unary(Op.postinc).value('i').$().$()
                .body().block()
                    .statements(native
                        ? []
                        : [Builders.decl('entry').value().access().receiver('entries').index('i').$().$().$()])
                    .statements(['key', 'value'].map((prop, index) =>
                        Builders.decl(prop).value(native
                            ? Builders.access().receiver(Builders.access().receiver(accessor).member(`${prop}s`).$()).index('i').$()
                            : Builders.access().receiver('entry').index(index).$()
                        ).$(),
                    ))
                    .statements(
                        argConvertor(this.ctx, this.type.elementType[0])
                            .write(E.v('key'), serializerName, native))
                    .statements(
                        argConvertor(this.ctx, this.type.elementType[1])
                            .write(E.v('value'), serializerName, native)).$().$().$()
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const lengthDecl = Builders.decl(`${name}Length`).value()
            .call('readInt32').receiver(serializerName).$().$().$()
        const keyType = this.convertType(this.type.elementType[0], native);
        const valueType = this.convertType(this.type.elementType[1], native);
        const nativeMapType = expectType(this.ctx, this.type, 'capi')
        const mapDecl = native
            ? Builders.decl(name).type(nativeMapType).mutable()
                .value().ctor().asStruct().$().$().$()
            : Builders.decl(name).value()
                .ctor(std.names.types.map).typeArgs([keyType, valueType]).$().$().$()
        const resizeMap = native
            ? Builders.stmt().call("resizeMap").typeArgs([nativeMapType, keyType, valueType]).receiver(serializerName)
                .arg(Builders.expr().unary(Op.ref).value(name).$().$())
                .arg(`${name}Length`).$().$()
            : Builders.none().$()
        const [keyReads, keyReadValue] = argConvertor(this.ctx, this.type.elementType[0])
            .read('key', serializerName, native);
        const [valueReads, valueReadValue] = argConvertor(this.ctx, this.type.elementType[1])
            .read('value', serializerName, native);
        const loop = Builders.loop()
            .init().decl('i').mutable().value(0).$().$()
            .cond().binary(Op.lt).left('i').right(name + 'Length').$().$()
            .step().unary(Op.postinc).value('i').$().$()
            .body().block()
                .statements(keyReads)
                .statements(valueReads)
            .statements(native
                ? [{ prop: 'keys', value: keyReadValue }, { prop: 'values', value: valueReadValue }].map(it =>
                    Builders.stmt()
                        .binary('=')
                        .left().access().receiver(Builders.access().receiver(name).member(it.prop).$()).index('i').$().$()
                        .right(it.value).$().$(),)
                : [Builders.stmt().call('set').receiver(name).arg(keyReadValue).arg(valueReadValue).$().$()])
            .$().$().$()
        return [[lengthDecl, mapDecl, resizeMap, loop], E.v(name)]
    }
}

class UnionConvertor extends StructConvertor<idl.IDLUnionType> {
    /**
     * Most specific checks should come first.
     * `interface Child extends Parent` => first check if `value instanceof Child`, then if `value instanceof Parent`
     * @returns array of indices sorted in proper check order
     */
    private orderIndices(): number[] {
        const resolveInterface = (type: idl.IDLType): idl.IDLInterface | undefined => {
            if (!idl.isReferenceType(type))
                return undefined
            const decl = this.ctx.library.resolveTypeReference(type)
            return decl && idl.isInterface(decl) ? decl : undefined
        }
        const resolveParents = (decl: idl.IDLInterface): idl.IDLInterface[] => {
            return decl.inheritance
                .map(resolveInterface)
                .filter(isDefined)
                .flatMap(it => [it, ...resolveParents(it)])
        }
        const queue = this.type.types.map<{
            type: idl.IDLType,
            index: number,
            needs?: idl.IDLType[],
        }>((type, index) => ({ type, index }))
        queue.forEach((it, _, sortItems) => {
            const decl = resolveInterface(it.type)
            const parents = decl ? resolveParents(decl) : undefined
            if (parents) {
                for (const other of sortItems) {
                    const otherDecl = resolveInterface(other.type)
                    if (otherDecl && parents.includes(otherDecl)) {
                        other.needs ??= []
                        other.needs.push(it.type)
                    }
                }
            }
        })
        const sorted: [idl.IDLType, number][] = []
        while (queue.length) {
            for (let i = 0; i < queue.length;) {
                const {type, index, needs} = queue[i]
                if (!needs || needs?.every(dep => sorted.find(it => it[0] === dep))) {
                    queue.splice(i, 1)
                    sorted.push([type, index])
                } else {
                    i++
                }
            }
        }
        return sorted.map(it => it[1])
    }

    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            this.orderIndices().map(i => {
                const type = this.type.types[i]
                const cond = native
                    ? Builders.binary(Op.eq)
                        .left().access('selector').receiver(accessor).$().$()
                        .right(i).$()
                    : Builders.instanceof(expectType(this.ctx, type, 'managed')).value(accessor).$()
                const value = native
                    ? Builders.access('value' + i).receiver(accessor).$()
                    : accessor /// cast to `ty`
                return Builders.if()
                    .condition(cond)
                    .then().block()
                        .call('writeInt8').receiver(serializerName).arg(i).$()
                        .statements(argConvertor(this.ctx, type).write(value, serializerName, native)).$().$().$()
            })
            .reduceRight((acc, cur) => {cur.elseBody = acc; return cur})
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const selectorDecl = Builders.decl(`${name}Selector`)
            .value().call('readInt8').receiver(serializerName).$().$().$()
        const valueDecl = Builders.decl(name).mutable()
        if (native) {
            valueDecl.type(expectType(this.ctx, this.type, 'capi')).value('{}')
        } else {
            const valueType = Ts.union([
                ...(Ts.union(this.type.types.map(ty => this.convertType(ty, native)))).args,
                Ts.prim.undefined])
            valueDecl.type(valueType)
        }
        const ifs = this.type.types.map((ty, i) => {
            const [reads, readValue] = argConvertor(this.ctx, ty).read(`${name}Variant${i}`, serializerName, native);
            const assignments = native
                ? [ Builders.stmt().binary('=')
                        .left().access('selector').receiver(name).$().$()
                        .right(i).$().$(),
                    Builders.stmt().binary('=')
                        .left().access('value' + i).receiver(name).$().$()
                        .right(readValue).$().$()]
                : [ Builders.stmt().binary('=').left(name).right(readValue).$().$()]
            return Builders.if()
                .cond().binary(Op.eq).left(`${name}Selector`).right(i).$().$()
                .then().block()
                    .statements(reads)
                    .statements(assignments).$().$().$()
        })
        const stmts: LWStatement[] = [selectorDecl, valueDecl.$(), ...ifs]
        if (!native)
            stmts.push(
                Builders.stmt().binary('=').left(name).right().unary(Op.assert).value(name).$().$().$().$())
        return [stmts, E.v(name)]
    }
}

class OptionalConvertor extends StructConvertor<idl.IDLOptionalType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        const isUndefinedCondition = native
            ? Builders.binary(Op.eq).left().access('tag').receiver(accessor).$().$().right('INTEROP_TAG_UNDEFINED').$()
            : Builders.binary(Op.eq).left(accessor).right('undefined').$()
        const definedValue = native
            ? Builders.access('value').receiver(accessor).$()
            : Builders.unary(Op.assert).value(accessor).$()
        return [
            Builders.if()
                .condition(isUndefinedCondition)
                .then().block()
                    .call('writeInt8').receiver(serializerName).arg(this.runtimeType('UNDEFINED', native)).$().$().$()
                .else().block()
                    .call('writeInt8').receiver(serializerName).arg(this.runtimeType('OBJECT', native)).$()
                    .statements(argConvertor(this.ctx, this.type.type).write(definedValue, serializerName, native)).$().$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const type = this.convertType(this.type, native);
        const runtimeTypeVarName = name + 'RuntimeType'
        const initialValue = native
            ? Builders.ctor().asStruct().$()
            : E.c('undefined')
        const valueReceiver = native
            ? Builders.access('value').receiver(name).$()
            : E.v(name)
        const tagAssignment = native
            ? Builders.stmt().binary('=')
                .left().access('tag').receiver(name).$().$()
                .right().call('runtimeTypeToTag').arg(runtimeTypeVarName).$().$().$().$()
            : Builders.none().$()
        const [typeReads, typeValue] = argConvertor(this.ctx, this.type.type).read(`${name}Value`, serializerName, native)
        return [[
            Builders.decl(name, type).mutable().value(initialValue).$(),
            Builders.decl(runtimeTypeVarName).value().call('readInt8').receiver(serializerName).$().$().$(),
            tagAssignment,
            Builders.if()
                .cond().binary(Op.ne).left(runtimeTypeVarName).right(this.runtimeType('UNDEFINED', native)).$().$()
                .then().block()
                    .statements(typeReads)
                    .binary('=').left(valueReceiver).right(typeValue).$().$().$().$()
        ], E.v(name)]
    }
    private runtimeType(name: string, native: boolean): lw.LWExpression {
        return native
            ? E.c('INTEROP_RUNTIME_' + name)
            : Builders.access(name).receiver('RuntimeType').$()
    }
}
class CallbackConvertor extends StructConvertor<idl.IDLReferenceType> {
    constructor(ctx: OhosProducerContext, type: idl.IDLReferenceType, private decl: idl.IDLCallback) {
        super(ctx, type);
    }
    interopType(native: boolean): lw.LWType {
        return Ts.prim.interopReturnBuffer
    }
    isPointer(): boolean {
        return true
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        if (native)
            return [
                Builders.stmt().call('writeCallbackResource')
                    .receiver(serializerName)
                    .arg().access('resource').receiver(accessor)
                    .$().$().$().$(),
                Builders.stmt().call('writePointer')
                    .receiver(serializerName)
                    .arg().cast(Ts.prim.pointer).value().access('call').receiver(accessor)
                    .$().$().$().$().$().$(),
                Builders.stmt().call('writePointer')
                    .receiver(serializerName)
                    .arg().cast(Ts.prim.pointer).value().access('callSync').receiver(accessor)
                    .$().$().$().$().$().$(),
            ]
        return [
            Builders.stmt().call('holdAndWriteCallback')
                .receiver(serializerName)
                .arg(accessor).$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        if (native) {
            const callbackParams = this.decl.parameters.map(p => ({ name: p.name, type: this.convertType(p.type, native) }))
            const callbackName = this.decl.name ///monoName(this.convertType(this.type, native))
            const asyncParams = [{ name: 'resourceId', type: Ts.prim.i32 }, ...callbackParams]
            if (!idl.isVoidType(this.decl.returnType)) {
                const ref = this.ctx.library.createContinuationCallbackReference(this.decl.returnType)!
                let callbackContinuation = this.ctx.library.resolveTypeReference(ref)
                let continuation = expectType(this.ctx, callbackContinuation!, `capi`)
                asyncParams.push({ name: 'continuation', type: Ts.const(continuation) })
            }
            return [[
                readCallbackStruct(name, expectType(this.ctx, this.type, 'capi'), callbackName, asyncParams)
            ], E.v(name)]
        }
        return [
            deserializeAndCallCallback(name, serializerName, this.ctx, this.decl),
            E.v(`${name}Closure`)
        ]
    }
}

class PromiseConvertor extends CallbackConvertor {
    constructor(
        ctx: OhosProducerContext,
        continuationRef: idl.IDLReferenceType,
        continuation: idl.IDLCallback,
        private promise: idl.IDLContainerType) {
        super(ctx, continuationRef, continuation);
    }
    interopType(native: boolean): lw.LWType {
        return Ts.prim.void
    }
    returnFromInterop(resultVarName: string): LWStatement[] {
        const [reads, readValue] = this.read(`${resultVarName}Deserialized`, E.v('returnDeserializer'), false)
        return [
            ...reads,
            Builders.return().value(readValue).$()
        ]
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        if (native)
            return super.write(accessor, serializerName, native)
        const isVoid = idl.isVoidType(this.promise.elementType[0])
        return [
            Builders.decl('retval').value()
                .access().index(0).receiver(
                    isVoid
                        ? Builders.call('holdAndWriteCallbackForPromiseVoid')
                            .receiver(serializerName).$()
                        : Builders.call('holdAndWriteCallbackForPromise')
                            .typeArgs([expectType(this.ctx, this.promise.elementType[0], 'managed')])
                            .receiver(serializerName).$()
                        ).$().$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        if (native)
            return super.read(name, serializerName, native)
        return [
            [],
            E.v(`retval`)]
    }
}

export function readCallbackCall(sync: boolean, params: { name: string, type: lw.LWType}[], callbackName: string): lw.LWExpression {
      return Builders.cast(T.fn(params, Ts.prim.void))
        .value().call('readPointerOrDefault')
          .arg().call(`getManagedCallbackCaller${sync ? 'Sync' : ''}`)
            .arg(`CALLBACK_KIND_${callbackName.toUpperCase()}`).$().$()
        .receiver(`deserializer`)
        .$().$().$()
}

export function readCallbackStruct(
    name: string,
    type: lw.LWType,
    continuationName: string,
    params: { name: string, type: lw.LWType }[]): lw.LWStatement {
    return Builders.decl(name).type(type)
        .value().ctor().asStruct()
        .arg().call('readCallbackResource').receiver('deserializer').$().$()
        .arg(readCallbackCall(false, params, continuationName!))
        .arg(readCallbackCall(true, [{name: 'vmContext', type: T.c(cApiName('VMContext'))}, ...params], continuationName!))
        .$().$().$()
}

export function deserializeAndCallCallback(name: string, serializerName: lw.LWExpression, ctx: OhosProducerContext, decl: idl.IDLCallback): lw.LWStatement[] {
    const returnCallbackSerializer = `continuationSerializer`
    const callbackParams = decl.parameters.map(p => ({ name: p.name, type: expectType(ctx, p.type, 'managed') }))
    const paramWrites = decl.parameters.flatMap(param => argConvertor(ctx, param.type, param.isOptional)
        .write(E.v(param.name), E.v(returnCallbackSerializer), false))
    const returnCallbackType = expectType(ctx, decl.returnType, 'managed')
    const needsContinuation = !idl.isVoidType(decl.returnType)
    const continuationStatements = needsContinuation
        ? [
            Builders.decl(`${name}Result`, Ts.optional(returnCallbackType)).mutable().$(),
            Builders.decl(`${name}Continuation`)
                .funcType()
                    .param(`value`).type(returnCallbackType).$()
                    .returns(Ts.prim.void).$()
                .value().lambda()
                    .param(`value`).type(returnCallbackType).$()
                .body().block()
                    .binary(`=`).left(`${name}Result`).right(`value`).$().$().$().$().$().$(),
            Builders.stmt().call('holdAndWriteCallback').receiver(returnCallbackSerializer).arg(`${name}Continuation`).$().$(),
        ] : []
    const returnCallback = Builders.stmt()
        .decl(`${name}Closure`)
            .funcType().parameters(callbackParams).returns(returnCallbackType).$()
            .value().lambda()
                .parameters(callbackParams)
                .body().block()
                    .decl(returnCallbackSerializer, T.c('SerializerBase')).value().call('hold').receiver('SerializerBase').$().$().$()
                    .call('writeInt32').receiver(returnCallbackSerializer)
                        .arg().access('resourceId').receiver(`${name}Resource`).$().$().$()
                    .call('writePointer').receiver(returnCallbackSerializer).arg(`${name}Call`).$()
                    .call('writePointer').receiver(returnCallbackSerializer).arg(`${name}CallSync`).$()
                    .statements(paramWrites)
                    .statements(continuationStatements)
                    .call('_CallCallbackSync').receiver(`InteropNativeModule`)
                        .arg(generatorConfiguration().ApiKind)
                        // TBD: Use CallbackKind
                        .arg(hashCodeFromString(decl.name.toUpperCase()) + ` /* CallbackKind.${decl.name} */`)
                        .arg(Builders.call('asBuffer').receiver(returnCallbackSerializer).$())
                        .arg(Builders.call('length').receiver(returnCallbackSerializer).$()).$()
                    .call('release').receiver(returnCallbackSerializer).$()
                    .statements([needsContinuation
                        ? Builders.return(returnCallbackType).value(E.c(`${name}Result`, [Hs.excl()])).$()
                        : Builders.none().$()
                    ]).$().$().$().$().$().$()
    return [
        Builders.decl(`${name}Resource`).value().call('readCallbackResource').receiver(serializerName).$().$().$(),
        Builders.decl(`${name}Call`).type(Ts.prim.pointer).value().call('readPointer').receiver(serializerName).$().$().$(),
        Builders.decl(`${name}CallSync`).type(Ts.prim.pointer).value().call('readPointer').receiver(serializerName).$().$().$(),
        returnCallback,
        Builders.stmt().call('resourceFinalizerRegister').arg(`${name}Closure`).arg(`${name}Resource`).$().$()
    ]
}