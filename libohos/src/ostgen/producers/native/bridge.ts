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
import { generatorConfiguration } from "@idlizer/core"
import { Builders, E, LWExpression, LWStatement, LWType, Op, T, Ts } from "@idlizer/ost"
import { bridgeName, isDirectInteropType, OhosProducerContext, OhosSeed } from "../common"
import { createProducer, fqName, modifierClassName, moduleName } from "../../engine"
import { argConvertor } from "../components/argConvertor"

export const functionBridgeProducer = createProducer(
  { is: idl.isMethod, role: 'bridge' },
  (method, ctx) => {
    const declName = bridgeName(fqName(method, 'modifier.impl_'))
    const funcName = fqName(method, '_')
    const params = [
      { name: 'thisArray', type: Ts.prim.serializerBuffer },
      { name: 'thisLength', type: Ts.prim.i32 },
    ]
    const argReads: [LWStatement[], LWExpression][] = method.parameters.map(it => {
      const conv = argConvertor(ctx, it.type, it.isOptional)
      const [stmts, expr] = conv.read(it.name, E.v('deserializer'), true)
      return [stmts, conv.isPointer() ? E.unary(Op.ref, expr) : expr]
    })
    const apiCallArgs = argReads.map(([_, expr]) => expr)
    const macroName = ['KOALA_INTEROP_']
    const macroArgs: (string | LWType)[] = [funcName]
    const returnConv = argConvertor(ctx, method.returnType)
    const interopReturnType = returnConv.interopType(true)
    if (isDirectInteropType(interopReturnType))
      macroName.push('DIRECT_')
    if (interopReturnType === Ts.prim.void)
      macroName.push('V')
    else
      macroArgs.push(interopReturnType)
    if (!method.isFree && !method.isStatic) {
      params.unshift({ name: 'thisPtr', type: Ts.prim.pointer })
      apiCallArgs.unshift(E.v('thisPtr'))
      macroArgs.push(Ts.prim.pointer)
    }
    macroName.push((macroArgs.length + (interopReturnType === Ts.prim.void ? 1 : 0)).toString())

    const apiCall = Builders.call(apiAccessor(method, funcName)).args(apiCallArgs).$()
    const body = Builders.block()
      .decl('deserializer', T.c('DeserializerBase')).mutable().value()
        .ctor('DeserializerBase').stack().arg('thisArray').arg('thisLength').$().$().$()
      .statements(argReads.flatMap(([stmts, _]) => stmts))
    if (interopReturnType === Ts.prim.interopReturnBuffer) {
      body
        .decl('returnBuffer').value(apiCall).$()
        .decl('returnSerializer', T.c('SerializerBase')).mutable().value().ctor().stack().$().$().$()
        .statements(returnConv.write(E.v('returnBuffer'), E.v('returnSerializer'), true))
        .return().call('toReturnBuffer').receiver('returnSerializer').$().$()
    } else {
      body.return(interopReturnType).value(apiCall).$()
    }
    const trigger = method.isFree ? undefined : [new OhosSeed(method.parent!, 'capi')]///use holes
    return {
      continuation: E.v(declName),
      declarations: [
        Builders.func(declName)
          .parameters(params)
          .returns(interopReturnType)
          .body(body.$())
          .macro(macroName.join(''), ...macroArgs, Ts.prim.serializerBuffer, Ts.prim.i32).$()
      ],
      trigger
    }
  }
)

export const constructorBridgeProducer = createProducer(
  { is: idl.isConstructor, role: 'bridge' },
  (ctor, ctx) => {
    ///need to enumerate overloaded ctors somehow
    const declName = bridgeName(fqName(ctor, 'modifier.impl_'))
    const funcName = fqName(ctor, '_')
    const interopParamTypes = ctor.parameters.map(it => argConvertor(ctx, it.type, it.isOptional).interopType(true))
    const callArgs = ctor.parameters.map((it, i) =>
      Builders.cast(Ts.ptr(ctx.expectType(new OhosSeed(it.type, 'capi')))).value()
        .unary(Op.ref).value(it.name).$().$().$());
    return {
      continuation: E.v(declName),
      declarations: [Builders.func(declName)
        .parameters(ctor.parameters.map((p, i) => ({ name: p.name, type: interopParamTypes[i] })))
        .returns(Ts.prim.pointer)
        .block()
          .return(Ts.prim.pointer)
            .call(apiAccessor(ctor, funcName))
            .args(callArgs).$().$().$()
        .macro(`KOALA_INTEROP_DIRECT_${callArgs.length}`, funcName, Ts.prim.pointer, ...interopParamTypes)
        .$()
      ],
      trigger: [new OhosSeed(ctor.parent!, 'capi')]///use holes
    }
  }
)

export const materializedBridgeProducer = createProducer(
  { is: idl.isInterface, role: 'bridge' },
  (node, ctx) => {
    const fqn = fqName(node)
    const finalizerName = fqn + '_getFinalizer'
    const declName = bridgeName('modifier.impl_' + finalizerName)
    return {
      continuation: E.v(declName),
      declarations: [
        Builders.func(declName).returns(Ts.prim.pointer).block()
          .return(Ts.prim.pointer)
            .cast(Ts.prim.pointer).value(apiAccessor(node, fqn + '_destruct')).$().$().$()
          .macro('KOALA_INTEROP_DIRECT_0', finalizerName, Ts.prim.pointer).$()
      ],
      trigger: [new OhosSeed(node, 'capi')]///use holes
    }
  }
)

function apiAccessor(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor, modifierName: string): LWExpression {///rm  
  return Builders
    .access(modifierName).ptr().receiver().call().function()
      .access(modifierClassName(node)).ptr().receiver().call(('Get' + generatorConfiguration().TypePrefix + moduleName('_API')))
        .arg(moduleName('_API_VERSION')).$().$().$().$().$().$().$()
}

// function api(method: idl.IDLMethod | idl.IDLConstructor, ctx: OhosProducerContext): LWExpression {///name
//   const methodExpr = ctx.expectExpr(new OhosSeed(method, 'modifier'))
//   const modifierExpr = method.parent && idl.isInterface(method.parent)
//     ? ctx.expectExpr(new OhosSeed(method.parent, 'modifier'))
//     : E.v(`GlobalScope`)///populate GS
//   return Builders
//     .access(methodExpr).ptr().receiver().call().function()
//       .access(modifierExpr).ptr().receiver().call(('Get' + generatorConfiguration().TypePrefix + moduleName('_API')))
//         .arg(moduleName('_API_VERSION')).$().$().$().$().$().$().$()
// }
