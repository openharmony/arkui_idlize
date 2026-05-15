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
import { Builders, D, E, FunctionDeclaration, LWExpression, LWStatement, LWType, Op, T, Ts } from "@idlizer/ost"
import { bridgeName, cApiName, expectExpr, expectType, isDirectInteropType } from "../common.js"
import { cppParamName, createProducer, fqName, OhosProducerContext } from "../../engine/index.js"
import { argConvertor } from "../components/argConvertor.js"
import { Language } from "@idlizer/core"

export const nativeModuleMaterializedProducer = createProducer(
  { is: idl.isInterface, role: 'native-module' },
  (node, ctx) => {
    const getFinalizer = idl.createMethod('_getFinalizer', [], idl.createPrimitiveType('pointer'), {
      isStatic: true, isAsync: false, isOptional: false, isFree: false})
    getFinalizer.parent = node
    return {
      continuation: expectExpr(ctx, getFinalizer, 'native-module'),
      declarations: []
    }
  }
)

export const nativeModuleFunctionProducer = createProducer(
  { is: idl.isMethod, role: 'native-module' },
  (method, ctx) => {
    const funcName = fqName(method)
    const className = ctx.getEffect().nativeModuleName
    const returnType = argConvertor(ctx, method.returnType).interopType(false)
    const params = [
      ...method.isFree || method.isStatic ? [] : [{ name: 'ptr', type: Ts.prim.pointer }],
      { name: 'buffer', type: Ts.prim.serializerBuffer },
      { name: 'length', type: Ts.prim.i32 }
    ]
    const isPromise = idl.isContainerType(method.returnType) && idl.IDLContainerUtils.isPromise(method.returnType)
    return {
      continuation: E.get(E.v(className), '_' + funcName),
      declarations: [
        ctx.library.language != Language.TS
        ? Builders.class(className)
          .method('_' + funcName)
            .native().static()
            ///no annotation for vmContext methods, see MethodUtils
            .annotation(!isPromise && isDirectInteropType(returnType) ? 'ani.unsafe.Direct' : 'ani.unsafe.Quick')
            .parameters(params)
            .returns(returnType).$().$()
        : Builders.class(className)
          .method('_' + funcName)
            .static()
            .parameters(params)
            .returns(returnType)
            .block()
            .if()
              .condition(E.c('this._LoadOnce()'))
              .then()
                .return().call(`_${funcName}`).args(params.map(it => E.c(it.name))).receiver(E.c('this'))
              .$().$().$().$()
            .throw().err().ctor('Error').arg('"Not implemented"').$().$().$().$().$().$(),
        makeBridge(funcName, method, ctx)
      ]
    }
  }
)

export const nativeModuleConstructorProducer = createProducer(
  { is: idl.isConstructor, role: 'native-module' },
  (ctor, ctx) => {
    const funcName = fqName(ctor)
    const nativeModuleClassName = ctx.getEffect().nativeModuleName
    const params = [
      { name: 'buffer', type: Ts.prim.serializerBuffer },
      { name: 'length', type: Ts.prim.i32 }
    ]
    return {
      continuation: E.get(E.v(nativeModuleClassName), '_' + funcName),
      declarations: [
        // native module
        Builders.class(nativeModuleClassName)
          .method('_' + funcName)
            .native().static().annotation('ani.unsafe.Direct')
            .returns(Ts.prim.pointer)
            .parameters(params).$().$(),
        // bridge
        makeConstructorBridge(funcName, ctor, ctx)
      ]
    }
  }
)

function makeConstructorBridge(name: string, ctor: idl.IDLConstructor, ctx: OhosProducerContext): FunctionDeclaration {
  const params = [
    { name: 'thisArray', type: Ts.prim.serializerBuffer },
    { name: 'thisLength', type: Ts.prim.i32 },
  ]
  const argReads: [LWStatement[], LWExpression][] = ctor.parameters.map(it => {
    const conv = argConvertor(ctx, it.type, it.isOptional)
    const [stmts, expr] = conv.read(it.name, E.v('deserializer'), true)
    return [stmts, conv.isPointer() ? E.unary(Op.ref, expr) : expr]
  })
  const apiCallArgs = argReads.map(([_, expr]) => expr)
  const apiCall = Builders.call(expectExpr(ctx, ctor, 'capi')).args(apiCallArgs).$()

  const body = Builders.block()
    .decl('deserializer', T.c('DeserializerBase')).mutable().value()
      .ctor('DeserializerBase').stack().arg('thisArray').arg('thisLength').$().$().$()
    .statements(argReads.flatMap(([stmts, _]) => stmts))
    .return(Ts.prim.pointer).value(apiCall).$()

  return Builders.func(bridgeName('impl_' + name))
    .parameters(params)
    .returns(Ts.prim.pointer)
    .body(body.$())
    .macro('KOALA_INTEROP_DIRECT_2', name, Ts.prim.pointer, Ts.prim.serializerBuffer, Ts.prim.i32).$()
}

function makeBridge(name: string, method: idl.IDLMethod, ctx: OhosProducerContext): FunctionDeclaration {
  const params = [
    { name: 'thisArray', type: Ts.prim.serializerBuffer },
    { name: 'thisLength', type: Ts.prim.i32 },
  ]
  const isPromise = idl.isContainerType(method.returnType) && idl.IDLContainerUtils.isPromise(method.returnType)
  const argReads: [LWStatement[], LWExpression][] = [
    ...method.parameters,
    ...(isPromise ? [idl.createParameter('out', method.returnType)] : []),
  ]
  .map(it => {
    const conv = argConvertor(ctx, it.type, it.isOptional)
    const [stmts, expr] = conv.read(cppParamName(it.name), E.v('deserializer'), true)
    return [stmts, conv.isPointer() ? E.unary(Op.ref, expr) : expr]
  })

  const returnConv = argConvertor(ctx, method.returnType)
  const apiCallArgs = argReads.map(([_, expr]) => expr)
  const macroName = ['KOALA_INTEROP_']
  const macroArgs: (string | LWType)[] = [name]
  const interopReturnType = returnConv.interopType(true)
  if (isPromise)
    macroName.push('CTX_')
  else if (isDirectInteropType(interopReturnType))
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

  if (isPromise) {
    params.unshift({ name: 'vmContext', type: T.c(cApiName('VMContext')) })
    apiCallArgs.unshift(Builders.call('GetAsyncWorker').$())
    apiCallArgs.unshift(E.c('vmContext'))
  }

  // rewrite `getFinalizer` to call `destruct`
  let capiMethod = method
  let makeApiCall: (expr: LWExpression) => LWExpression = expr => Builders.call(expr).args(apiCallArgs).$()
  if (method.name === 'getFinalizer') {
    capiMethod = idl.createMethod('_destruct', [], idl.createPrimitiveType('void'))
    capiMethod.parent = method.parent
    makeApiCall = (expr: LWExpression) => Builders.cast(Ts.prim.pointer).value(expr).$()
  }
  const apiCall = makeApiCall(expectExpr(ctx, capiMethod, 'capi'))

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
  return Builders.func(bridgeName('impl_' + name))
    .parameters(params)
    .returns(interopReturnType)
    .body(body.$())
    .macro(macroName.join(''), ...macroArgs, Ts.prim.serializerBuffer, Ts.prim.i32).$()
}
