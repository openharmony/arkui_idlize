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
import { isMaterialized } from "@idlizer/core"
import { Builders, E, Hs, LWExpression, LWStatement, LWType, lw, Op, std, T, Ts } from "@idlizer/ost"
import { cApiName, expectExpr, expectType, typeNameExpr } from "../common.js"
import { OhosProducerContext } from "../../engine/index.js"
import { monoName } from "../../postprocess/postprocess.js"

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
function selectWriteName(type: idl.IDLPrimitiveType): string {
    return type.name === 'any' ? 'holdAndWriteObject'
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
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
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
                return new PromiseConvertor(ctx, type)
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
            case 'buffer':
                return Ts.prim.interopReturnBuffer
            case 'number':
                return Ts.prim.interopNumber
            case 'String':
                return native ? Ts.const(Ts.ref(Ts.prim.interopString)) : Ts.prim.interopString
            case 'this':
            case 'void':
                return Ts.prim.void
            default:
                return this.convertType(this.type, native)
        }
    }
    isPointer(): boolean {
        return idl.isPrimitiveType(this.type, 'number') || idl.isPrimitiveType(this.type, 'String')
    }
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
        switch (this.type.name) {
            case 'buffer':
                return [Builders.return().call('readBuffer')
                    .receiver().ctor('DeserializerBase')
                        .arg(resultVarName)
                        .arg().access('length').receiver(resultVarName).$().$().$().$()
                    .$().$()];
            case 'void':
                return [];
            default:
                return super.returnFromInterop(resultVarName, native);
        }
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [Builders.stmt().call(selectWriteName(this.type))
            .receiver(serializerName)
            .arg(accessor).$().$()
        ]
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
    constructor(ctx: OhosProducerContext, protected decl: idl.IDLEnum) {
        super(ctx, decl.elements[0]?.type ?? idl.createPrimitiveType('i32'))
    }
    interopType(native: boolean): lw.LWType {
        return this.type.name === 'String' ? Ts.prim.str : Ts.prim.i32
    }
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
        return [Builders.return()
            .call("fromValue").receiver(this.decl.name).arg().var(resultVarName).$().$().$()]
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            Builders.expr().call('write' + this.elementTypeName())
                .receiver(serializerName)
                .arg().call('valueOf').receiver(accessor).$().$().$().$stmt()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        return [
            [native
                ? Builders.decl(name)
                    .value().cast(expectType(this.ctx, this.decl, 'capi')).static()
                    .value(Builders.expr().call(selectReadName(this.type)).receiver(serializerName).$().$()).$().$().$()

                : Builders.decl(name)
                    .value().call('fromValue').receiver(typeNameExpr(this.type.name))
                    .arg().call('read' + this.elementTypeName()).receiver(serializerName).$().$().$().$().$()
            ],
            E.v(name)
        ]
    }
    elementTypeName(): string {
        return this.type.name === 'String' ? 'String' : 'Int32'
    }
}

class MaterializedConvertor extends ArgConvertor<idl.IDLReferenceType> {
    interopType(native: boolean): lw.LWType {
        return Ts.prim.pointer
    }
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
        return [Builders.return().value(this.fromPtr(E.v(resultVarName), native)).$()]
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
                .receiver(typeNameExpr(this.type.name + 'Internal'))
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
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
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

class DataConvertor extends StructConvertor<idl.IDLReferenceType> {
    constructor(ctx: OhosProducerContext, type: idl.IDLReferenceType, protected decl: idl.IDLInterface) {
        super(ctx, type)
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [Builders.expr().call().function()
            .access('write')
                .receiver(this.getSerializer(this.decl, native))
                .static().$().$()
            .arg(serializerName).arg(accessor).$().$stmt()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
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
        return [
            Builders.stmt().call('writeInt32').receiver(serializerName)
                .arg().access('length').receiver(accessor).$().$().$().$(),
            Builders.loop()
                .init().decl('i').mutable().value('0').$().$()
                .cond().binary(Op.lt).left('i').right().access('length').receiver(accessor).$().$().$().$()
                .step().binary('=').left('i').right().binary(Op.add).left('i').right(1).$().$().$().$()
                .body().block()
                    .decl('item').value().access().receiver(accessor).index('i').$().$().$()
                    .statements(argConvertor(this.ctx, this.type.elementType[0]).write(E.v('item'), serializerName, native)).$().$().$()
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const lengthDecl = Builders.decl(`${name}Length`).value()
            .call('readInt32').receiver(serializerName).$().$().$()
        const elemType = this.convertType(this.type.elementType[0], native);
        const bufferDecl = Builders.decl(name).value()
            .ctor(std.names.types.array).typeArgs([elemType]).arg(name + 'Length').$().$().$()
        const [reads, readValue] = argConvertor(this.ctx, this.type.elementType[0])
            .read('tmp', serializerName, native);
        const loop = Builders.loop()
            .init().decl('i').mutable().value(0).$().$()
            .cond().binary(Op.lt).left('i').right(name + 'Length').$().$()
            .step().unary(Op.postinc).value('i').$().$()
            .body().block()
                .statements(reads)
                .binary('=')
                    .left().access().receiver(name).index('i').$().$()
                    .right(readValue).$().$().$().$()
        return [[lengthDecl, bufferDecl, loop], E.v(name)]
    }
}

class MapConvertor extends StructConvertor<idl.IDLContainerType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            Builders.stmt().call('writeInt32').receiver(serializerName)
                .arg().access('size').receiver(accessor).$().$().$().$(),
            Builders.decl('entries').value().call('from').receiver('Array').arg().call('entries').receiver(accessor).$().$().$().$().$(),
            Builders.loop()
                .init().decl('i').mutable().value('0').$().$()
                .cond().binary(Op.lt).left('i').right().access('length').receiver('entries').$().$().$().$()
                .step().binary('=').left('i').right().binary(Op.add).left('i').right(1).$().$().$().$()
                .body().block()
                    .decl('key').value().access().receiver('entries').index('i').index(0).$().$().$()
                    .decl('value').value().access().receiver('entries').index('i').index(1).$().$().$()
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
        const mapDecl = Builders.decl(name).value()
            .ctor(std.names.types.map).typeArgs([keyType, valueType]).$().$().$()
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
                .call('set').receiver(name).arg(keyReadValue).arg(valueReadValue).$().$()
                .$().$()
        return [[lengthDecl, mapDecl, loop], E.v(name)]
    }
}

class PromiseConvertor extends StructConvertor<idl.IDLContainerType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            Builders.decl('promise').value('/// argConvertor.PromiseConvertor: not implemented').$()
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        return [[], E.c('/// argConvertor.PromiseConvertor: not implemented')]
    }
}

class UnionConvertor extends StructConvertor<idl.IDLUnionType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            this.type.types.map((ty, i) => {
                const cond = native
                    ? Builders.binary(Op.eq)
                        .left().access('selector').receiver(accessor).$().$()
                        .right(i).$()
                    : Builders.instanceof(expectType(this.ctx, ty, 'managed')).value(accessor).$()
                const value = native
                    ? Builders.access('value' + i).receiver(accessor).$()
                    : accessor /// cast to `ty`
                return Builders.if()
                    .condition(cond)
                    .then().block()
                        .call('writeInt8').receiver(serializerName).arg(i).$()
                        .statements(argConvertor(this.ctx, ty).write(value, serializerName, native)).$().$().$()
            })
            .reduceRight((acc, cur) => {cur.elseBody = acc; return cur})
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const selectorDecl = Builders.decl(`${name}Selector`)
            .value().call('readInt8').receiver(serializerName).$().$().$()
        const valueDecl = Builders.decl(`${name}Value`).mutable()
        if (native) {
            valueDecl.type(expectType(this.ctx, this.type, 'capi')).value('{}')
        } else {
            const valueType = Ts.union([
                ...(Ts.union(this.type.types.map(ty => this.convertType(ty, native)))).args,
                Ts.prim.undefined])
            valueDecl.type(valueType)
        }
        const ifs = this.type.types.map((ty, i) => {
            const [reads, readValue] = argConvertor(this.ctx, ty).read('tmp', serializerName, native);
            const assignments = native
                ? [ Builders.stmt().binary(Op.eq)
                        .left().access('selector').receiver(name).$().$()
                        .right(i).$().$(),
                    Builders.stmt().binary(Op.eq)
                        .left().access('value' + i).receiver(name).$().$()
                        .right(readValue).$().$()]
                : [ Builders.stmt().binary('=').left(`${name}Value`).right(readValue).$().$()]
            return Builders.if()
                .cond().binary(Op.eq).left(`${name}Selector`).right(i).$().$()
                .then().block()
                    .statements(reads)
                    .statements(assignments).$().$().$()
        })
        const assignment = Builders.decl(name)
            .value().unary(Op.assert).value(`${name}Value`).$().$().$()
        return [ [selectorDecl, valueDecl.$(), ...ifs, assignment], E.v(name, [Hs.excl()])]
    }
}

class OptionalConvertor extends StructConvertor<idl.IDLOptionalType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        if (native) {
            // TODO: implement
            return [Builders.stmt().call('writeInt8')
                .receiver(serializerName)
                .arg(this.runtimeType('UNDEFINED', native)).$().$()]
        }
        return [Builders.if()
            .cond().unary(Op.not).value(accessor).$().$()
            .then().block()
                .call('writeInt8').receiver(serializerName).arg(this.runtimeType('UNDEFINED', native)).$().$().$()
            .else().block()
                .call('writeInt8').receiver(serializerName).arg(this.runtimeType('OBJECT', native)).$()
                .statements(argConvertor(this.ctx, this.type.type).write(accessor, serializerName, native)).$().$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const type = this.convertType(this.type, native);
        if (native) {
            // TODO: implement
            return [[
                Builders.decl(name, Ts.optional(type)).mutable().$(),
                Builders.decl(`${name}RuntimeType`).value().call('readInt8').receiver(serializerName).$().$().$(),
                Builders.stmt().binary('=')
                    .left().access('tag').receiver(name).$().$()
                    .right('INTEROP_TAG_UNDEFINED').$().$()
            ], E.v(name)]
        } else {
            const [typeReads, typeValue] = argConvertor(this.ctx, this.type.type).read(`${name}Value`, serializerName, native)
            return [[
                Builders.decl(name, Ts.union([type, Ts.prim.undefined])).mutable().$(),
                Builders.decl(`${name}RuntimeType`).value().call('readInt8').receiver(serializerName).$().$().$(),
                Builders.if()
                    .cond().binary(Op.ne).left(`${name}RuntimeType`).right(this.runtimeType('UNDEFINED', native)).$().$()
                    .then().block()
                        .statements(typeReads)
                        .binary('=').left(name).right(typeValue).$().$().$().$()
            ], E.v(name)]
        }
    }
    private runtimeType(name: string, native: boolean): lw.LWExpression {
        return native
            ? E.v(`INTEROP_RUNTIME_${name}`)
            : Builders.access(name).receiver('RuntimeType').$()
    }
}

class CallbackConvertor extends ArgConvertor<idl.IDLReferenceType> {
    constructor(ctx: OhosProducerContext, type: idl.IDLReferenceType, private decl: idl.IDLCallback) {
        super(ctx, type);
    }
    interopType(native: boolean): lw.LWType {
        return this.convertType(this.type, native)
    }
    isPointer(): boolean {
        return true
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            Builders.stmt().call('holdAndWriteCallback')
                .receiver(serializerName)
                .arg(accessor).$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const callbackName = this.decl.name ///monoName(this.convertType(this.type, native))
        const kindName = E.v('KIND_' + callbackName.toUpperCase())
        const callbackParams: [string, LWType][] = this.decl.parameters.map(p => [p.name, this.convertType(p.type, native)])
        const asyncParams: [string, LWType][] = [['resourceId', Ts.prim.i32], ...callbackParams]
        const syncParams: [string, LWType][] = [['vmContext', T.c(cApiName('VMContext'))], ...asyncParams]
        return [[
            Builders.decl(name, expectType(this.ctx, this.type, 'capi')).value()
                .ctor().asStruct()
                    .arg().call('readCallbackResource').receiver(serializerName).$().$()
                    .arg().cast(T.fn(asyncParams, Ts.prim.void)).value()
                        .call('readPointerOrDefault').receiver(serializerName)
                            .arg().call('getManagedCallbackCaller')
                                .arg(kindName).$().$().$().$().$().$()
                    .arg().cast(T.fn(syncParams, Ts.prim.void)).value()
                        .call('readPointerOrDefault').receiver(serializerName)
                            .arg().call('getManagedCallbackCallerSync')
                                .arg(kindName).$().$().$().$().$().$().$().$().$()
        ], E.v(name)]
    }
}
