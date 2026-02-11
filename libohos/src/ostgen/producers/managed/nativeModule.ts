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
import { Builders, D, E, Hs, LWExpression, LWStatement, LWType, Op, T, Ts } from "@idlizer/ost"
import { bridgeName, expectExpr, expectType, isDirectInteropType } from "../common"
import { createProducer, fqName } from "../../engine"
import { argConvertor } from "../components/argConvertor"

export const nativeModuleMaterializedProducer = createProducer(
  { is: idl.isInterface, role: 'native-module' },
  (node, ctx) => {
    const getFinalizer = idl.createMethod('_getFinalizer', [], idl.IDLPointerType, {
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
    const returnConv = argConvertor(ctx, method.returnType)
    // native module
    const returnType = returnConv.interopType(false)
    const nativeModuleMethod = Builders.func('_' + funcName)
        .native().static()
        ///no annotation for vmContext methods, see MethodUtils
        .annotation(isDirectInteropType(returnType) ? 'ani.unsafe.Direct' : 'ani.unsafe.Quick')
        .param('buffer').type(Ts.prim.serializerBuffer).$()
        .param('length').type(Ts.prim.i32).$()
        .returns(returnType).$()
    if (!method.isFree && !method.isStatic)
      nativeModuleMethod.parameters.unshift(
        { name: 'ptr', type: Ts.prim.pointer })
    // bridge
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

    // rewrite `getFinalizer` to call `destruct`
    let capiMethod = method
    let makeApiCall: (expr: LWExpression) => LWExpression = expr => Builders.call(expr).args(apiCallArgs).$()
    if (method.name === 'getFinalizer') {
      capiMethod = idl.createMethod('destruct', [], idl.IDLVoidType)
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
    return {
      continuation: E.get(E.v(className, [Hs.isType()]), '_' + funcName),
      declarations: [
        D.class(className, [], [nativeModuleMethod]),
        Builders.func(bridgeName('modifier.impl_' + funcName))
          .parameters(params)
          .returns(interopReturnType)
          .body(body.$())
          .macro(macroName.join(''), ...macroArgs, Ts.prim.serializerBuffer, Ts.prim.i32).$()
      ]
    }
  }
)

export const nativeModuleConstructorProducer = createProducer(
  { is: idl.isConstructor, role: 'native-module' },
  (ctor, ctx) => {
    const funcName = fqName(ctor)
    const nativeModuleClassName = ctx.getEffect().nativeModuleName
    const interopParamTypes = ctor.parameters.map(it => argConvertor(ctx, it.type, it.isOptional).interopType(true))
    const callArgs = ctor.parameters.map(it =>
      Builders.cast(Ts.ptr(expectType(ctx, it.type, 'capi'))).value()
        .unary(Op.ref).value(it.name).$().$().$());
    return {
      continuation: E.get(E.v(nativeModuleClassName, [Hs.isType()]), '_' + funcName),
      declarations: [
        // native module
        Builders.class(nativeModuleClassName)
          .method('_' + funcName)
          .native().static().annotation('ani.unsafe.Direct')
          .returns(Ts.prim.pointer)
          .parameters(ctor.parameters.map(it => ({ name: it.name, type: expectType(ctx, it.type, 'managed') }))).$().$(),
        // bridge
        Builders.func(bridgeName('modifier.impl_' + funcName))
          .parameters(ctor.parameters.map((p, i) => ({ name: p.name, type: interopParamTypes[i] })))
          .returns(Ts.prim.pointer)
          .block()
            .return(Ts.prim.pointer)
              .call(expectExpr(ctx, ctor, 'capi'))
              .args(callArgs).$().$().$()
          .macro(`KOALA_INTEROP_DIRECT_${callArgs.length}`, funcName, Ts.prim.pointer, ...interopParamTypes)
          .$()
      ]
    }
  }
)
