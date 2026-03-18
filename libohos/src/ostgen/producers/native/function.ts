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
import { Builders, LWExpression, LWType, Ts } from "@idlizer/ost"
import { cApiName, implName } from "../common.js";
import { createProducer, fqName, mapPush, moduleName } from "../../engine/index.js"
import { argConvertor } from "../components/argConvertor.js";
import { expectType } from "../common.js"
import { OhosProducerContext } from "../../engine/index.js"

export const functionProducer = createProducer(
  { is: idl.isMethod, role: 'capi' },
  (method, ctx) => {
    const funcName = method.isFree ? fqName(method) : method.name
    const returnType = idl.isPrimitiveType(method.returnType) && method.returnType.name === 'this'
      ? Ts.prim.void
      : expectType(ctx, method.returnType, 'capi')
    const params: [string, LWType][] = method.parameters.map(it => [it.name, wrapPtr(it.type, ctx)])
    if (!method.isFree && !method.isStatic)
      params.unshift(['thisPtr', Ts.prim.pointer])
    return {
      continuation: apiAccessor(method, funcName, ctx),
      declarations: [
        Builders.struct(cApiName(modifierClassName(method) + 'Modifier'))
          .field(funcName)
            .funcType()
            .parameters(params)
            .returns(returnType).$().$().$(),
        generateImpl(ctx, method, returnType)
      ]
    }
  }
)

export const constructorProducer = createProducer(
  { is: idl.isConstructor, role: 'capi' },
  (ctor, ctx) => {
    const funcName = '_construct'
    const params: [string, LWType][] = ctor.parameters.map(it => [it.name, wrapPtr(it.type, ctx)])
    return {
      continuation: apiAccessor(ctor, funcName, ctx),
      declarations: [
        Builders.struct(cApiName(modifierClassName(ctor) + 'Modifier'))
          .field(funcName)
            .funcType()
            .parameters(params)
            .returns(Ts.prim.pointer).$().$().$(),
        generateImpl(ctx, ctor, Ts.prim.pointer)
      ]
    }
  }
)

function wrapPtr(type: idl.IDLType, ctx: OhosProducerContext): LWType {
    const typeRef = expectType(ctx, type, 'capi')
    return argConvertor(ctx, type).isPointer() ? Ts.const(Ts.ptr(typeRef)) : typeRef
}

function modifierClassName(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor): string {
  return idl.isInterface(node)
    ? fqName(node)
    : node.parent && idl.isInterface(node.parent)
      ? fqName(node.parent)
      : 'GlobalScope'
}

function apiAccessor(method: idl.IDLMethod | idl.IDLConstructor, name: string, ctx: OhosProducerContext): LWExpression {
  const modifierName = modifierClassName(method)
  ctx.updateEffect(e => mapPush(e.modifiers, modifierName, fqName(method)))
  return Builders
    .access(name).ptr().receiver().call().function()
      .access(modifierName).ptr().receiver().call(ctx.getEffect().apiFunctionName)
        .arg(moduleName('_API_VERSION')).$().$().$().$().$().$().$()
}

function generateImpl(ctx: OhosProducerContext, method: idl.IDLMethod | idl.IDLConstructor, returnType: LWType) {
  const params = method.parameters.map(it => ({ name: it.name, type: wrapPtr(it.type, ctx) }))
  if (!idl.isConstructor(method) && !method.isFree && !method.isStatic)
    params.unshift({ name: 'thisPtr', type: Ts.prim.pointer })
  return Builders.func(implName(fqName(method) + 'Impl'))
    .returns(returnType)
    .parameters(params).$()
}
