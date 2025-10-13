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
import { createSpecialProducer, bridgeName, roles, AdvancedGeneratorContext } from "../common"
import { E, T } from "../../../ost/builder"
import { Builders } from "../../../ost/builders"
import { ArgConvertor } from "../components/argConvertor"
import { generatorConfiguration } from "@idlizer/core"
import { Op, std, Ts } from "../../../ost/stdlib"
import { fqName, modifierClassName, moduleName } from "../../engine"
import { LWExpression, LWType, VariableExpression } from "../../../ost/lws"

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
          const convertor = new ArgConvertor(ctx, E.v('deserializer'), true)
          const argReads = method.parameters.map(it => convertor.read(it.name, it.type))
          const apiCallArgs: LWExpression[] = argReads.map(([_, expr]) => E.unary(Op.ref, expr))
          const macroArgs = [funcName]
          const [returnType, koalaReturnType, isDirect] = interopReturnType(method.returnType, ctx)
          if (koalaReturnType)
            macroArgs.push(koalaReturnType)
          if (!method.isFree && !method.isStatic) {
            params.unshift({ name: 'thisPtr', type: Ts.prim.pointer })
            apiCallArgs.unshift(E.v('thisPtr'))
            macroArgs.push('OH_NativePointer')
          }
          const macroArity = macroArgs.length + (koalaReturnType ? 0 : 1)
          const apiCall = Builders.call().functionExpr(apiAccessor(method, funcName)).args(apiCallArgs).$()
          const bridge = Builders.func(declName)
            .parameters(params)
            .returns(returnType)
            .macro(`KOALA_INTEROP_${isDirect ? 'DIRECT_' : ''}${koalaReturnType ? '' : 'V'}${macroArity}`,
              ...macroArgs, Ts.prim.serializerBuffer, Ts.prim.i32)
            .block()
              .decl('deserializer', T.c('DeserializerBase')).value()
                .ctor('DeserializerBase').stack().args([E.v('thisArray'), E.v('thisLength')]).$().$().$()
              .statements(argReads.flatMap(([stmts, _]) => stmts))
          if (returnType === Ts.prim.returnBuffer) {
            const conv = new ArgConvertor(ctx, E.v('returnSerializer'), true)
            bridge
              .decl('returnValue', T.c(std.names.types.auto)).valueExpr(apiCall).$()///make decl.type optional?
              .decl('returnSerializer', T.c('SerializerBase')).value().ctor().asStruct().$().$().$()
              .statements([conv.write(E.v('returnValue'), method.returnType)])
              .return().call().receiverName('returnSerializer').functionName('toReturnBuffer').$().$()
          } else {
            bridge.return(returnType).valueExpr(apiCall).$()
          }
          return [bridge.$().$()]
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
          const interopParamTypes = ctor.parameters.map(it => interopType(it.type, ctx))
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

function interopReturnType(
  type: idl.IDLType, ctx: AdvancedGeneratorContext
): [returnType: LWType, koalaReturnType: string | undefined, isDirect:boolean] {
  const returnType = ctx.useCApi(type).reference()
  switch (type) {
    case idl.IDLVoidType: return [returnType, undefined, true]
    case idl.IDLNumberType: return [returnType, 'KInteropNumber', true]
    case idl.IDLStringType: return [returnType, 'KStringPtr', true]
    default: return [T.c('KInteropReturnBuffer'), 'KInteropReturnBuffer', false]
  }
}

function interopType(type: idl.IDLType, ctx: AdvancedGeneratorContext): LWType {
  switch (type) {
    case idl.IDLNumberType: return T.c('KInteropNumber')
    case idl.IDLBufferType: return T.c('KInteropBuffer')
    case idl.IDLSerializerBuffer: return T.c('KSerializerBuffer')
    case idl.IDLFunctionType: return Ts.prim.i32
    case idl.IDLDate: return Ts.prim.i64
    default: return ctx.useCApi(type).reference()
  }
}

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