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
import { generatorConfiguration } from "@idlizer/core"
import { Builders, E, LWExpression, LWType, Ts } from "@idlizer/ost"
import { cApiName, implName } from "../common";
import { createProducer, fqName, modifierClassName, moduleName } from "../../engine"
import { argConvertor } from "../components/argConvertor";
import { OhosProducerContext, OhosSeed } from "../common"

export const functionProducer = createProducer(
  { is: idl.isMethod, role: 'capi' },
  (method, ctx) => {
    const funcName = fqName(method);
    const returnType = ctx.expectType(new OhosSeed(method.returnType, 'capi'))
    const params: [string, LWType][] = method.parameters.map(it =>
      [it.name, wrapPtr(it.type, ctx)])
    if (!method.isFree && !method.isStatic)
      params.unshift(['thisPtr', Ts.prim.pointer])
    return {
      continuation: apiAccessor(method, funcName),
      declarations: [
        Builders.struct(cApiName(`modifier.${modifierClassName(method)}Modifier`))
          .field(funcName)
            .funcType()
            .parameters(params)
            .returns(returnType).$().$().$(),
        generateImpl(method, ctx)
      ]
    }
  }
)

export const constructorProducer = createProducer(
  { is: idl.isConstructor, role: 'capi' },
  (ctor, ctx) => {
    const funcName = fqName(ctor)
    const params: [string, LWType][] = ctor.parameters.map(it => [it.name, wrapPtr(it.type, ctx)])
    return {
      continuation: apiAccessor(ctor, funcName),
      declarations: [
        Builders.struct(cApiName(`modifier.${modifierClassName(ctor)}Modifier`))
          .field(funcName)
            .funcType()
            .parameters(params)
            .returns(Ts.prim.pointer).$().$().$(),
        generateImpl(ctor, ctx)
      ]
    }
  }
)

function wrapPtr(type: idl.IDLType, ctx: OhosProducerContext): LWType {
    const typeRef = ctx.expectType(new OhosSeed(type, 'capi'))
    return argConvertor(ctx, type).isPointer() ? Ts.const(Ts.ptr(typeRef)) : typeRef
}

function apiAccessor(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor, modifierName: string): LWExpression {
  return Builders
    .access(modifierName).ptr().receiver().call().function()
      .access(modifierClassName(node)).ptr().receiver().call(('Get' + generatorConfiguration().TypePrefix + moduleName('_API')))
        .arg(moduleName('_API_VERSION')).$().$().$().$().$().$().$()
}

function generateImpl(method: idl.IDLMethod | idl.IDLConstructor, ctx: OhosProducerContext) {
  const returnType = idl.isMethod(method) ? ctx.expectType(new OhosSeed(method.returnType, 'capi')) : Ts.prim.pointer
  const params = method.parameters.map(it => ({ name: it.name, type: wrapPtr(it.type, ctx) }))
  if (!idl.isConstructor(method) && !method.isFree && !method.isStatic)
    params.unshift({ name: 'thisPtr', type: Ts.prim.pointer })
  return Builders.func(implName(fqName(method, 'modifier.', 'Impl')))
    .returns(returnType)
    .parameters(params).$()
}
