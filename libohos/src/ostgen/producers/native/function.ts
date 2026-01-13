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
import { AdvancedGeneratorContext, cApiName, createSpecialProducer, implName, roles } from "../common";
import { E } from "../../../ost";
import { Builders } from "../../../ost";
import { fqName, modifierClassName } from "../../engine";
import { Ts } from "../../../ost";
import { LWType } from "../../../ost";
import { argConvertor } from "../components/argConvertor";

export const functionProducer = createSpecialProducer(
  { is: idl.isMethod, role: roles.cApi },
  (method, ctx) => {
    const funcName = fqName(method);
    return {
      artifact: {
        reference: E.v(funcName),
        implementationGenerator: () => {
          const returnType = ctx.useCApi(method.returnType).reference()
          const params: [string, LWType][] = method.parameters.map(it =>
            [it.name, wrapPtr(it.type, ctx)])
          if (!method.isFree && !method.isStatic)
            params.unshift(['thisPtr', Ts.prim.pointer])
          return [
            Builders.struct(cApiName(`modifier.${modifierClassName(method)}Modifier`))
              .field(funcName)
                .funcType()
                .parameters(params)
                .returns(returnType).$().$().$(),
            generateImpl(method, ctx)
          ]
        }
      }
    }
  }
)

export const constructorProducer = createSpecialProducer(
  { is: idl.isConstructor, role: roles.cApi },
  (ctor, ctx) => {
    const funcName = fqName(ctor)
    return {
      artifact: {
        reference: E.v(funcName),
        implementationGenerator: () => {
          const params: [string, LWType][] = ctor.parameters.map(it => [it.name, wrapPtr(it.type, ctx)])
          return [
            Builders.struct(cApiName(`modifier.${modifierClassName(ctor)}Modifier`))
              .field(funcName)
                .funcType()
                .parameters(params)
                .returns(Ts.prim.pointer).$().$().$(),
            generateImpl(ctor, ctx)
          ]
        }
      }
    }
  }
)

function generateImpl(method: idl.IDLMethod | idl.IDLConstructor, ctx: AdvancedGeneratorContext) {
  const returnType = idl.isMethod(method) ? ctx.useCApi(method.returnType).reference() : Ts.prim.pointer
  const params = method.parameters.map(it => ({ name: it.name, type: wrapPtr(it.type, ctx) }))
  if (!idl.isConstructor(method) && !method.isFree && !method.isStatic)
    params.unshift({ name: 'thisPtr', type: Ts.prim.pointer })
  return Builders.func(implName(fqName(method, 'modifier.', 'Impl')))
    .returns(returnType)
    .parameters(params).$()
}

function wrapPtr(type: idl.IDLType, ctx: AdvancedGeneratorContext): LWType {
    const typeRef = ctx.useCApi(type).reference()
    return argConvertor(ctx, type).isPointer() ? Ts.const(Ts.ptr(typeRef)) : typeRef
}
