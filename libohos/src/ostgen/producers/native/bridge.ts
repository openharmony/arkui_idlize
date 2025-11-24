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
import { createSpecialProducer, bridgeName, roles, isDirectInteropType } from "../common"
import { E, T } from "../../../ost/builder"
import { Builders } from "../../../ost/builders"
import { argConvertor } from "../components/argConvertor"
import { generatorConfiguration } from "@idlizer/core"
import { Op, Ts } from "../../../ost/stdlib"
import { fqName, modifierClassName, moduleName } from "../../engine"
import { LWExpression, LWStatement, LWType, VariableExpression } from "../../../ost/lws"

export const functionBridgeProducer = createSpecialProducer(
  { is: idl.isMethod, role: roles.bridge },
  (method, ctx) => {
    const declName = bridgeName(fqName(method, 'modifier.impl_'))
    return {
      artifact: {
        reference: E.v(declName),
        implementationGenerator: () => {
          const funcName = (ctx.useCApi(method).name() as VariableExpression).name
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
            macroArgs.push('OH_NativePointer')
          }
          macroName.push((macroArgs.length + (interopReturnType === Ts.prim.void ? 1 : 0)).toString())

          const apiCall = Builders.call().functionExpr(apiAccessor(method, funcName)).args(apiCallArgs).$()
          const body = Builders.block()
            .decl('deserializer', T.c('DeserializerBase')).mutable().value()
              .ctor('DeserializerBase').stack().args([E.v('thisArray'), E.v('thisLength')]).$().$().$()
            .statements(argReads.flatMap(([stmts, _]) => stmts))
          if (interopReturnType === Ts.prim.interopReturnBuffer) {
            body
              .decl('returnBuffer').valueExpr(apiCall).$()
              .decl('returnSerializer', T.c('SerializerBase')).mutable().value().ctor().stack().$().$().$()
              .statements(returnConv.write(E.v('returnBuffer'), E.v('returnSerializer'), true))
              .return().call().receiverName('returnSerializer').functionName('toReturnBuffer').$().$()
          } else {
            body.return(interopReturnType).valueExpr(apiCall).$()
          }
          return [
            Builders.func(declName)
              .parameters(params)
              .returns(interopReturnType)
              .body(body.$())
              .macro(macroName.join(''),
                ...macroArgs, Ts.prim.serializerBuffer, Ts.prim.i32).$()
          ]
        }
      }
    }
  }
)

export const constructorBridgeProducer = createSpecialProducer(
  { is: idl.isConstructor, role: roles.bridge },
  (ctor, ctx) => {
    ///need to enumerate overloaded ctors somehow
    const declName = bridgeName(fqName(ctor, 'modifier.impl_'))
    return {
      artifact: {
        reference: E.v(declName),
        implementationGenerator: () => {
          const funcName = (ctx.useCApi(ctor).name() as VariableExpression).name
          const interopParamTypes = ctor.parameters.map(it => argConvertor(ctx, it.type, it.isOptional).interopType(true))
          const callArgs = ctor.parameters.map(it =>
            Builders.cast(Ts.ptr(ctx.useCApi(it.type).reference())).value()
              .unary(Op.ref).valueStr(it.name).$().$().$());
          return [Builders.func(declName)
            .parameters(ctor.parameters.map((p, i) => ({ name: p.name, type: interopParamTypes[i] })))
            .returns(Ts.prim.pointer)
            .block()
              .return(Ts.prim.pointer)
                .call().functionExpr(apiAccessor(ctor, funcName))
                .args(callArgs).$().$().$()
            .macro(`KOALA_INTEROP_DIRECT_${callArgs.length}`,
              funcName, 'OH_NativePointer', ...interopParamTypes)
            .$()
          ]
        }
      }
    }
  }
)


export const materializedBridgeProducer = createSpecialProducer(
  { is: idl.isInterface, role: roles.bridge },
  (node, ctx) => {
    const fqn = fqName(node)
    const finalizerName = fqn + '_getFinalizer'
    const declName = bridgeName('modifier.impl_' + finalizerName)
    return {
      artifact: {
        reference: E.v(declName),
        implementationGenerator: () => [
          Builders.func(declName).returns(Ts.prim.pointer).block()
            .return(Ts.prim.pointer)
              .cast(Ts.prim.pointer).valueExpr(apiAccessor(node, fqn + '_destruct')).$().$().$()
            .macro('KOALA_INTEROP_DIRECT_0', finalizerName, Ts.prim.pointer).$()
          ]
      }
    }
  }
)

function apiAccessor(node: idl.IDLInterface | idl.IDLMethod | idl.IDLConstructor, modifierName: string): LWExpression {
  return Builders.access()
    .object().call().function().access()
      .object()
        .call()
          .functionName(('Get' + generatorConfiguration().TypePrefix + moduleName('_API')))
          .arg(moduleName('_API_VERSION')).$().$().$()
      .member(modifierClassName(node)).ptr().$().$().$().$()
    .member(modifierName).ptr().$()
}