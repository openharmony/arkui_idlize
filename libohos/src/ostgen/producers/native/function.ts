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
import { Builders, FunctionDeclaration, LWExpression, LWType, Md, T, Ts } from "@idlizer/ost"
import { cApiName, implName } from "../common.js";
import { createProducer, fqName, mapPush, moduleName } from "../../engine/index.js"
import { argConvertor } from "../components/argConvertor.js";
import { expectType } from "../common.js"
import { OhosProducerContext } from "../../engine/index.js"

export const functionProducer = createProducer(
  { is: idl.isMethod, role: 'capi' },
  (method, ctx, role, data) => {
    const funcName = (method.isFree ? fqName(method) : method.name) + (data?.overrideIndex ?? '')
    const isPromise = idl.isContainerType(method.returnType) && idl.IDLContainerUtils.isPromise(method.returnType)
    const returnType = isPromise || (idl.isPrimitiveType(method.returnType) && method.returnType.name === 'this')
      ? Ts.prim.void
      : expectType(ctx, method.returnType, 'capi')
    return {
      continuation: apiAccessor(method, funcName, ctx, data?.overrideIndex),
      declarations: [
        Builders.struct(cApiName(modifierClassName(method) + 'Modifier'))
          .field(funcName)
            .funcType()
            .parameters(makeParameters(ctx, method))
            .returns(returnType).$().$().$(),
        makeImpl(ctx, method, returnType, data?.overrideIndex)
      ]
    }
  }
)

export const constructorProducer = createProducer(
  { is: idl.isConstructor, role: 'capi' },
  (ctor, ctx, role, data) => {
    const funcName = '_construct' + (data?.overrideIndex ?? '')
    return {
      continuation: apiAccessor(ctor, funcName, ctx, data?.overrideIndex),
      declarations: [
        Builders.struct(cApiName(modifierClassName(ctor) + 'Modifier'))
          .field(funcName)
            .funcType()
            .parameters(makeParameters(ctx, ctor))
            .returns(Ts.prim.pointer).$().$().$(),
        makeImpl(ctx, ctor, Ts.prim.pointer, data?.overrideIndex)
      ]
    }
  }
)

function modifierClassName(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor): string {
  return idl.isInterface(node)
    ? fqName(node)
    : node.parent && idl.isInterface(node.parent)
      ? fqName(node.parent)
      : 'GlobalScope'
}

function apiAccessor(
  method: idl.IDLMethod | idl.IDLConstructor, name: string, ctx: OhosProducerContext, overrideIndex?: number
): LWExpression {
  const modifierName = modifierClassName(method)
  ctx.updateEffect(e => mapPush(e.modifiers, modifierName, fqName(method, undefined, overrideIndex?.toString())))
  return Builders
    .access(name).ptr().receiver().call().function()
      .access(modifierName).ptr().receiver().call(ctx.getEffect().apiFunctionName)
        .arg(moduleName('_API_VERSION')).$().$().$().$().$().$().$()
}

function makeImpl(ctx: OhosProducerContext, method: idl.IDLMethod | idl.IDLConstructor, returnType: LWType, overrideIndex?: number) {
  return Builders.func(implName(fqName(method) + (overrideIndex ?? '') + 'Impl'))
    .returns(returnType)
    .parameters(makeParameters(ctx, method)).$()
}

function makeParameters(
  ctx: OhosProducerContext,
  method: idl.IDLMethod | idl.IDLConstructor
): FunctionDeclaration['parameters'] {
  const params = method.parameters.map(param => {
    const rawType = expectType(ctx, param.type, 'capi')
    const maybeOptType = param.isOptional ? Ts.optional(rawType) : rawType
    const maybePtrType = argConvertor(ctx, param.type, param.isOptional).isPointer() ? Ts.const(Ts.ptr(maybeOptType)) : maybeOptType
    return { name: param.name, type: maybePtrType }
  })
  if (!idl.isConstructor(method) && !method.isFree && !method.isStatic)
    params.unshift({ name: 'thisPtr', type: Ts.prim.pointer })
  const isPromise = idl.isMethod(method) && idl.isContainerType(method.returnType) && idl.IDLContainerUtils.isPromise(method.returnType)
  if (!isPromise) return params
  const ref = ctx.library.createContinuationCallbackReference(method.returnType)
  const callback = ctx.library.resolveTypeReference(ref)!
  return [
    { name: 'vmContext', type: T.c(cApiName('VMContext')) },
    { name: 'asyncWorker', type: T.c(cApiName('AsyncWorkerPtr')) },
    ...params,
    { name: 'out', type: Ts.const(Ts.ptr(expectType(ctx, callback, `capi`))) }
  ]
}