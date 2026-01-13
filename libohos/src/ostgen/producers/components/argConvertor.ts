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
import { AdvancedGeneratorContext, cApiName, managedName, typeNameExpr } from "../common";
import { isMaterialized } from "@idlizer/core";
import { Builders, LWExpression, LWStatement, LWType } from "../../../ost";
import { monoName } from "../../postprocess/postprocess";

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
        return [Builders.return().value(resultVarName).$()]
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
            if (idl.isInterface(decl)) {
                return isMaterialized(decl, ctx.base.library)
                    ? new MaterializedConvertor(ctx, type)
                    : new DataConvertor(ctx, type)
            }
            if (idl.isEnum(decl))
                return new EnumConvertor(ctx, type)
            if (idl.isCallback(decl))
                return new CallbackConvertor(ctx, type, decl)
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
                return [Builders.return().call('readBuffer')
                    .receiver().ctor('DeserializerBase')
                        .arg(resultVarName)
                        .arg().access('length').receiver(resultVarName).$().$().$().$()
                    .$().$()]
            case idl.IDLVoidType: return []
            default: return super.returnFromInterop(resultVarName, native)
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
        if (!native && this.type === idl.IDLNumberType) // ugh
            expr = Builders.cast(Ts.prim.number).value(expr).$()
        return [
            [Builders.decl(name).value(expr).$()],
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
        return [Builders.expr().call('writeInt32')
            .receiver(serializerName)
            .arg().call('valueOf').receiver(accessor).$().$().$().$stmt()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        return [
            [Builders.decl(name)
                .value().call('fromValue').receiver(typeNameExpr(this.type.name))
                .arg().call('readInt32').receiver(serializerName).$().$().$().$().$()],
            E.v(name)
        ]
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
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [Builders.expr().call().function()
            .access('write')
                .receiver(this.getSerializer(this.type, native).name())
                .static().$().$()
            .arg(serializerName).arg(accessor).$().$stmt()
        ]
    }
    read(name: string, serializerName: lw.LWExpression, native: boolean): [lw.LWStatement[], lw.LWExpression] {
        return [
            [Builders.decl(name).value().call()
                .function()
                    .access('read')
                    .receiver(this.getSerializer(this.type, native).name())
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
                    .statements(argConvertor(this.ctx, this.type.elementType[0]).write(
                        Builders.access().receiver(accessor).index('i').$(),
                        serializerName,
                        native)).$().$().$()
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

class UnionConvertor extends StructConvertor<idl.IDLUnionType> {
    write(accessor: lw.LWExpression, serializerName: lw.LWExpression, native: boolean): lw.LWStatement[] {
        return [
            this.type.types.map((ty, i) => {
                const cond = native
                    ? Builders.binary(Op.eq)
                        .left().access('selector').receiver(accessor).$().$()
                        .right(i).$()
                    : Builders.instanceof(this.ctx.useManagedSerializer(ty).reference()).value(accessor).$()
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
        return [ [selectorDecl, tmpDecl, ...ifs, assignment], E.v(name, [Hs.excl()])]
    }
}

class OptionalConvertor extends StructConvertor<idl.IDLType> {
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
                .statements(argConvertor(this.ctx, this.type).write(accessor, serializerName, native)).$().$().$()
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
            const [typeReads, typeValue] = argConvertor(this.ctx, this.type).read(`${name}Value`, serializerName, native)
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
    constructor(ctx: AdvancedGeneratorContext, type: idl.IDLReferenceType, private decl: idl.IDLCallback) {
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
        const callbackName = monoName(this.convertType(this.type, native))
        const kindName = E.v(`KIND_${callbackName.toUpperCase()}`)
        const callbackParams: [string, LWType][] = this.decl.parameters.map(p => [p.name, this.convertType(p.type, native)])
        const asyncParams: [string, LWType][] = [['resourceId', Ts.prim.i32], ...callbackParams]
        const syncParams: [string, LWType][] = [['vmContext', T.c(cApiName('VMContext'))], ...asyncParams]
        return [[
            Builders.decl(name, this.ctx.useCApi(this.type).reference()).value()
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
