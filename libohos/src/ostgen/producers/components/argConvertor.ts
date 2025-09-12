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
import { Hs, E, lw, Op, S, std, T, Ts } from "../../../ost";
import { AdvancedGeneratorContext, bridgeName } from "../common";
import { Builders } from "../../../ost/builders";
import { ConstType, IfStatement, LWExpression, LWKind, LWType } from "../../../ost/lws";

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

export class ArgConvertor {
    constructor(
        private ctx: AdvancedGeneratorContext,
        private sName: lw.LWExpression,
        private native: boolean
    ) {}

    private getSerializer(node:idl.IDLNode) {
        return this.native
            ? this.ctx.useNativeSerializer(node)
            : this.ctx.useManagedSerializer(node)
    }

    //////////////////////

    write(accessor:lw.LWExpression, type:idl.IDLType): lw.LWStatement {
        if (idl.isPrimitiveType(type)) {
            return S.e(E.call(E.get(this.sName, selectWriteName(type)), [accessor]))
        }
        if (idl.isReferenceType(type)) {
            const decl = this.ctx.base.resolver.toDeclaration(type)
            return decl && idl.isEnum(decl)
                ? Builders.expr().call()
                    .receiverExpr(this.sName)
                    .functionName('writeInt32')
                    .args([accessor]).$().$stmt()
                : Builders.expr().call().function()
                    .access(this.getSerializer(type).name())
                    .member('write')
                    .static().$().$()
                    .args([this.sName, accessor]).$().$stmt()
        }
        if (idl.isContainerType(type)) {
            if (idl.IDLContainerUtils.isSequence(type)) {
                return Builders.block()
                    .call().receiverExpr(this.sName).functionName('writeInt32')
                        .arg().access(accessor).member('length').$().$().$()
                    .loop()
                        .init().decl('i', Ts.prim.i32).mutable().valueStr('0').$().$()
                        .cond().binary(Op.lt).leftStr('i').right().access(accessor).member('length').$().$().$().$()
                        .step().binary('=').leftStr('i').right().binary(Op.add).leftStr('i').rightStr(1).$().$().$().$()
                        .bodyStmt(
                            this.write(
                                Builders.access(accessor).indexStr('i').$(),
                                type.elementType[0]))
                        .$().$()
            }
        }
        if (idl.isUnionType(type)) {
            return type.types
                .map((ty, i) => {
                    const cond = this.native
                        ? Builders.binary(Op.eq)
                            .left().access(accessor).member('selector').$().$()
                            .rightStr(i).$()
                        : Builders.instanceof(this.ctx.useManagedSerializer(ty).reference()).valueExpr(accessor).$()
                    const value = this.native
                        ? Builders.access(accessor).member('value' + i).$()
                        : accessor /// cast to `ty`
                    return Builders.if()
                        .condition(cond)
                        .then().block()
                            .call().receiverExpr(this.sName).functionName('writeInt8').args([E.c(i)]).$()
                            .statements([this.write(value, ty)]).$().$().$()
                })
                .reduceRight((acc, cur) => {cur.elseBody = acc; return cur})
        }
        throw new Error(`Can not process "${idl.DebugUtils.debugPrintType(type)}"`)
    }

    //////////////////////

    read(name: string, type: idl.IDLType): [lw.LWStatement[], lw.LWExpression] {
        if (idl.isPrimitiveType(type)) {
            let expr = Builders.expr().call()
                .receiverExpr(this.sName)
                .functionName(selectReadName(type)).$().$()
            if (!this.native && type === idl.IDLNumberType) // ugh
                expr = Builders.cast(Ts.prim.number).valueExpr(expr).$()
            return [
                [Builders.decl(name, this.convertType(type, this.native)).valueExpr(expr).$()],
                E.v(name)
            ]
        }
        if (idl.isReferenceType(type)) {
            const refTarget = this.ctx.base.resolver.toDeclaration(type)
            const call = refTarget && idl.isEnum(refTarget)
                ? Builders.call().receiverExpr(this.sName).functionName('readInt32').$()///cast
                : Builders.call()
                    .function()
                        .access(this.getSerializer(type).name())
                        .member('read')
                        .static().$().$()
                    .args([this.sName]).$()
            return [
                [Builders.decl(name, this.convertType(type, this.native)).valueExpr(call).$()],
                E.v(name)
            ]
        }
        if (idl.isContainerType(type)) {
            if (idl.IDLContainerUtils.isSequence(type)) {
                const elemType = this.native
                    ? this.ctx.useNativeSerializer(type.elementType[0])
                    : this.ctx.useManagedSerializer(type.elementType[0])
                const lengthDecl = Builders.decl('length', Ts.prim.i32).value()
                    .call().receiverExpr(this.sName).functionName('readInt32').$().$().$()
                const bufferDecl = Builders.decl('buffer', T.c('idlize.Array', elemType.reference())).value()///std name?
                    .ctor().args([E.v('length')]).$().$().$()///pass type to ctor
                const [reads, readValue] = this.read(name, type.elementType[0]);
                const loop = Builders.loop()
                    .init().decl('i', Ts.prim.i32).valueStr(0).$().$()
                    .cond().binary(Op.lt).leftStr('i').rightStr('length').$().$()
                    .step().binary(Op.postinc).leftStr('i').$().$()
                    .body().block()
                        .statements(reads)
                        .binary('=')
                            .left().access(E.v('buffer')).indexStr('i').$().$()
                            .rightExpr(readValue).$().$().$().$()
                return [[lengthDecl, bufferDecl, loop], E.v('buffer')]
            }
        }
        if (idl.isUnionType(type)) {
            const selectorDecl = Builders.decl('selector', Ts.prim.i8)
                .value().call().receiverExpr(this.sName).functionName('readInt8').$().$().$()
            const tmpDecl = Builders.decl('tmp', this.convertType(type, this.native)).$()
            if (this.native)
                tmpDecl.expression = E.c('{}')
            const ifs = type.types.map((ty, i) => {
                const [reads, readValue] = this.read(name, ty);
                const assignments = this.native
                    ? [ Builders.stmt().binary(Op.eq)
                            .left().access(E.v('tmp')).member('selector').$().$()
                            .rightStr(i).$().$(),
                        Builders.stmt().binary(Op.eq)
                            .left().access(E.v('tmp')).member('value' + i).$().$()
                            .rightExpr(readValue).$().$()]
                    : [ Builders.stmt().binary(Op.eq).leftStr('tmp').rightExpr(readValue).$().$()]
                return Builders.if()
                    .cond().binary(Op.eq).leftStr('selector').rightStr(i).$().$()
                    .then().block()
                        .statements(reads)
                        .statements(assignments).$().$().$()
            })
            return [ [selectorDecl, tmpDecl, ...ifs], E.v('tmp', [Hs.excl()])]
        }
        throw new Error(`Can not process "${idl.DebugUtils.debugPrintType(type)}"`)
    }

    private convertType(type:idl.IDLType, native: boolean): LWType {
        return native
            ? this.ctx.useCApi(type).reference()
            : this.ctx.useManaged(type).reference()
    }
}
