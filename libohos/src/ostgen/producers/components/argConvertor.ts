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

import * as idl from "@idlizer/core/idl";
import { Hs, E, lw, Op, S, std, Ts, T, Vs } from "../../../ost";
import { AdvancedGeneratorContext, managedName, typeNameExpr } from "../common";
import { Builders } from "../../../ost/builders";
import { isMaterialized } from "@idlizer/core";
import { LWExpression, LWStatement } from "../../../ost/lws";

function selectPrimitiveTypeName(type: idl.IDLPrimitiveType): string {
    switch (type) {
        case idl.IDLBooleanType: return 'Boolean'
        case idl.IDLBufferType: return 'Buffer'
        case idl.IDLI8Type: return 'Int8'
        case idl.IDLI32Type: return 'Int32'
        case idl.IDLI64Type: return 'Int64'
        case idl.IDLF32Type: return 'Float32'
        case idl.IDLF64Type: return 'Float64'
        case idl.IDLNumberType: return 'Number'
        case idl.IDLPointerType: return 'Pointer'
        case idl.IDLSerializerBuffer: return 'Buffer'
        case idl.IDLStringType: return 'String'
        case idl.IDLU8Type: return 'Int8'
        case idl.IDLU32Type: return 'Int32'
        case idl.IDLU64Type: return 'Int64'
        default: throw new Error(`Can not convert "${idl.DebugUtils.debugPrintType(type)}"`)
    }
}
function selectWriteName(type:idl.IDLPrimitiveType): string {
    return "write" + selectPrimitiveTypeName(type)
}
function selectReadName(type:idl.IDLPrimitiveType): string {
    return "read" + selectPrimitiveTypeName(type)
}

export abstract class ArgConvertor<T extends idl.IDLType> {
    constructor(
        protected ctx: AdvancedGeneratorContext,
        protected type: T
    ) {}

    abstract interopType(native: boolean): lw.LWType
    abstract write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[]
    abstract read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression]

    isPointer(): boolean {
        return false
    }
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
        return [Builders.return().valueStr(resultVarName).$()]
    }
    protected getSerializer(node: idl.IDLNode, native: boolean) {
        return native
            ? this.ctx.useNativeSerializer(node)
            : this.ctx.useManagedSerializer(node)
    }
    protected convertType(type: idl.IDLType, native: boolean): lw.LWType {
        return native
            ? this.ctx.useCApi(type).reference()
            : this.ctx.useManaged(type).reference()
    }
}

export function argConvertor(ctx: AdvancedGeneratorContext, type: idl.IDLType, optional?: boolean): ArgConvertor<idl.IDLType> {
    ///what can we cache here? Take optional props into account
    if (optional)
        return new OptionalConvertor(ctx, type)
    if (idl.isPrimitiveType(type))
        return new PrimitiveConvertor(ctx, type)
    if (idl.isContainerType(type) && idl.IDLContainerUtils.isSequence(type))
        return new ArrayConvertor(ctx, type)
    if (idl.isUnionType(type))
        return new UnionConvertor(ctx, type)
    if (idl.isReferenceType(type)) {
        const decl = ctx.base.resolver.toDeclaration(type)
        if (decl) {
            if (idl.isEnum(decl))
                return new EnumConvertor(ctx, type)
            if (idl.isInterface(decl)) {
                return isMaterialized(decl, ctx.base.library)
                    ? new MaterializedConvertor(ctx, type)
                    : new DataConvertor(ctx, type)
            }
        }
    }
    throw new Error(`No convertor exists for "${idl.DebugUtils.debugPrintType(type)}"`)
}

class PrimitiveConvertor extends ArgConvertor<idl.IDLPrimitiveType> {
    interopType(native: boolean): lw.LWType {
        switch (this.type) {
            case idl.IDLBufferType:
                return Ts.prim.interopReturnBuffer
            case idl.IDLNumberType:
                return Ts.prim.interopNumber
            case idl.IDLStringType:
                return native ? Ts.const(Ts.ref(Ts.prim.interopString)) : Ts.prim.interopString
            default:
                return this.convertType(this.type, native)
        }
    }
    isPointer(): boolean {
        return this.type === idl.IDLNumberType || this.type === idl.IDLStringType
    }
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
        switch (this.type) {
            case idl.IDLBufferType:
                return [Builders.return().call()
                    .receiver().ctor('DeserializerBase')
                        .arg(resultVarName).$()
                        .arg().access(E.v(resultVarName)).member('length').$().$().$().$()
                    .functionName('readBuffer').$().$()]
            case idl.IDLVoidType: return []
            default: return super.returnFromInterop(resultVarName, native)
        }
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [Builders.stmt().call()
            .receiverExpr(serializerName)
            .functionName(selectWriteName(this.type))
            .args([accessor]).$().$()
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        let expr = Builders.expr().call()
            .receiverExpr(serializerName)
            .functionName(selectReadName(this.type)).$().$()
        if (!native && this.type === idl.IDLNumberType) // ugh
            expr = Builders.cast(Ts.prim.number).valueExpr(expr).$()
        return [
            [Builders.decl(name).valueExpr(expr).$()],
            E.v(name)
        ]
    }
}

class EnumConvertor extends ArgConvertor<idl.IDLReferenceType> {
    interopType(native: boolean): lw.LWType {
        return Ts.prim.i32
    }
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
        return super.returnFromInterop(resultVarName, native)///toEnum()?
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [Builders.expr().call()
            .receiverExpr(serializerName)
            .functionName('writeInt32')
                .arg().call().receiverExpr(accessor).functionName('valueOf').$().$().$().$stmt()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        return [
            [Builders.decl(name)
                .value().call().receiverExpr(typeNameExpr(this.type.name)).functionName('fromValue')
                .arg().call().receiverExpr(serializerName).functionName('readInt32').$().$().$().$().$()],
            E.v(name)
        ]
    }
}

class MaterializedConvertor extends ArgConvertor<idl.IDLReferenceType> {
    interopType(native: boolean): lw.LWType {
        return Ts.prim.pointer
    }
    returnFromInterop(resultVarName: string, native: boolean): LWStatement[] {
        return [Builders.return().valueExpr(this.fromPtr(E.v(resultVarName), native)).$()]
    }
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        const peerPtr = native
            ? accessor
            : Builders.call().functionName('toPeerPtr').args([accessor]).$()
        return [Builders.stmt().call()
            .receiverExpr(serializerName)
            .functionName('writePointer')
            .args([peerPtr]).$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const peerPtr = Builders.call().receiverExpr(serializerName).functionName('readPointer').$()
        return [
            [Builders.decl(name).valueExpr(this.fromPtr(peerPtr, native)).$()],
            E.v(name)
        ]
    }
    private fromPtr(peerPtr: LWExpression, native: boolean): LWExpression {
        return native
            ? peerPtr
            : Builders.call()
                .receiverExpr(typeNameExpr(this.type.name + 'Internal'))
                .functionName('fromPtr')
                .args([peerPtr]).$()

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
                .arg(resultVarName).$()
                .arg().access(E.v(resultVarName)).member('length').$().$().$().$().$(),
            ...reads,
            Builders.return().valueExpr(readValue).$()
        ]
    }
}

class DataConvertor extends StructConvertor<idl.IDLReferenceType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [Builders.expr().call().function()
            .access(this.getSerializer(this.type, native).name())
            .member('write')
            .static().$().$()
            .args([serializerName, accessor]).$().$stmt()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        return [
            [Builders.decl(name).value().call()
                .function()
                    .access(this.getSerializer(this.type, native).name())
                    .member('read')
                    .static().$().$()
                .args([serializerName]).$().$().$()],
            E.v(name)
        ]
    }
}

class ArrayConvertor extends StructConvertor<idl.IDLContainerType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            Builders.stmt().call().receiverExpr(serializerName).functionName('writeInt32')
                .arg().access(accessor).member('length').$().$().$().$(),
            Builders.loop()
                .init().decl('i').mutable().valueStr('0').$().$()
                .cond().binary(Op.lt).leftStr('i').right().access(accessor).member('length').$().$().$().$()
                .step().binary('=').leftStr('i').right().binary(Op.add).leftStr('i').rightStr(1).$().$().$().$()
                .body().block()
                    .statements(argConvertor(this.ctx, this.type.elementType[0]).write(
                        Builders.access(accessor).indexStr('i').$(),
                        serializerName,
                        native)).$().$().$()
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const lengthDecl = Builders.decl(`${name}Length`).value()
            .call().receiverExpr(serializerName).functionName('readInt32').$().$().$()
        const elemType = this.convertType(this.type.elementType[0], native);
        const bufferDecl = Builders.decl(name).value()
            .ctor(std.names.types.array).typeArgs([elemType]).args([E.v(`${name}Length`)]).$().$().$()
        const [reads, readValue] = argConvertor(this.ctx, this.type.elementType[0])
            .read('tmp', serializerName, native);
        const loop = Builders.loop()
            .init().decl('i').mutable().valueStr(0).$().$()
            .cond().binary(Op.lt).leftStr('i').rightStr(`${name}Length`).$().$()
            .step().unary(Op.postinc).valueStr('i').$().$()
            .body().block()
                .statements(reads)
                .binary('=')
                    .left().access(E.v(name)).indexStr('i').$().$()
                    .rightExpr(readValue).$().$().$().$()
        return [[lengthDecl, bufferDecl, loop], E.v(name)]
    }
}

class UnionConvertor extends StructConvertor<idl.IDLUnionType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            this.type.types.map((ty, i) => {
                const cond = native
                    ? Builders.binary(Op.eq)
                        .left().access(accessor).member('selector').$().$()
                        .rightStr(i).$()
                    : Builders.instanceof(this.ctx.useManagedSerializer(ty).reference()).valueExpr(accessor).$()
                const value = native
                    ? Builders.access(accessor).member('value' + i).$()
                    : accessor /// cast to `ty`
                return Builders.if()
                    .condition(cond)
                    .then().block()
                        .call().receiverExpr(serializerName).functionName('writeInt8').args([E.c(i)]).$()
                        .statements(argConvertor(this.ctx, ty).write(value, serializerName, native)).$().$().$()
            })
            .reduceRight((acc, cur) => {cur.elseBody = acc; return cur})
        ]
    }

    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const selectorDecl = Builders.decl(`${name}Selector`)
            .value().call().receiverExpr(serializerName).functionName('readInt8').$().$().$()
        const tmpType = Ts.union([
            ...(Ts.union(this.type.types.map(ty => this.convertType(ty, native)))).args,
            Ts.prim.undefined])
        const tmpDecl = Builders.decl(`${name}Value`, tmpType).mutable().$()
        if (native)
            tmpDecl.expression = E.c('{}')
        const ifs = this.type.types.map((ty, i) => {
            const [reads, readValue] = argConvertor(this.ctx, ty).read('tmp', serializerName, native);
            const assignments = native
                ? [ Builders.stmt().binary(Op.eq)
                        .left().access(E.v(name)).member('selector').$().$()
                        .rightStr(i).$().$(),
                    Builders.stmt().binary(Op.eq)
                        .left().access(E.v(name)).member('value' + i).$().$()
                        .rightExpr(readValue).$().$()]
                : [ Builders.stmt().binary('=').leftStr(`${name}Value`).rightExpr(readValue).$().$()]
            return Builders.if()
                .cond().binary(Op.eq).leftStr(`${name}Selector`).rightStr(i).$().$()
                .then().block()
                    .statements(reads)
                    .statements(assignments).$().$().$()
        })
        const assignment = Builders.decl(name)
            .value().unary(Op.assert).valueStr(`${name}Value`).$().$().$()
        return [ [selectorDecl, tmpDecl, ...ifs, assignment], E.v(name, [Hs.excl()])]
    }
}

class OptionalConvertor extends StructConvertor<idl.IDLType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        if (native) {
            // TODO: implement
            return [Builders.stmt().call()
                .receiverExpr(serializerName).functionName('writeInt8').args([this.runtimeType('UNDEFINED', native)]).$().$()]
        }
        return [Builders.if()
            .cond().unary(Op.not).valueExpr(accessor).$().$()
            .then().block()
                .call().receiverExpr(serializerName).functionName('writeInt8').args([this.runtimeType('UNDEFINED', native)]).$().$().$()
            .else().block()
                .call().receiverExpr(serializerName).functionName('writeInt8').args([this.runtimeType('OBJECT', native)]).$()
                .statements(argConvertor(this.ctx, this.type).write(accessor, serializerName, native)).$().$().$()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        const type = this.convertType(this.type, native);
        if (native) {
            // TODO: implement
            return [[
                Builders.decl(name, Ts.optional(type)).$(),
                Builders.decl(`${name}RuntimeType`).value().call().receiverExpr(serializerName).functionName('readInt8').$().$().$(),
                Builders.stmt().binary('=')
                    .left().access(E.v(name)).member('tag').$().$()
                    .rightStr('INTEROP_TAG_UNDEFINED').$().$()
            ], E.v(name)]
        } else {
            const [typeReads, typeValue] = argConvertor(this.ctx, this.type).read(`${name}Value`, serializerName, native)
            return [[
                Builders.decl(name, Ts.union([type, Ts.prim.undefined])).mutable().$(),
                Builders.decl(`${name}RuntimeType`).value().call().receiverExpr(serializerName).functionName('readInt8').$().$().$(),
                Builders.if()
                    .cond().binary(Op.ne).leftStr(`${name}RuntimeType`).rightExpr(this.runtimeType('UNDEFINED', native)).$().$()
                    .then().block()
                        .statements(typeReads)
                        .binary('=').leftStr(name).rightExpr(typeValue).$().$().$().$()
            ], E.v(name)]
        }
    }
    private runtimeType(name: string, native: boolean): lw.LWExpression {
        return native
            ? E.v(`INTEROP_RUNTIME_${name}`)
            : Builders.access(E.v('RuntimeType')).member(name).$()
    }
}