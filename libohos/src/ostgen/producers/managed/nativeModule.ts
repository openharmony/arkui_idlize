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
import { Hs, E, Ts } from "../../../ost";
import { createSpecialProducer, isDirectInteropType, roles } from "../common";
import { fqName, nativeModuleName } from "../../engine";
import { Builders } from "../../../ost/builders";
import { argConvertor } from "../components/argConvertor";

export const nativeModuleMaterializedProducer = createSpecialProducer(
  { is: idl.isInterface, role: roles.nativeModule },
  (node, ctx) => {
    const methodName = fqName(node, '_', '_getFinalizer')
    const nativeModuleClassName = nativeModuleName()
    return {
      artifact: {
        reference: E.v(nativeModuleClassName, [Hs.isType()]),
        implementationGenerator: () => {
          ctx.useBridge(node)
          return [Builders.class(nativeModuleClassName)
            .method(methodName)
              .native().static().annotation('ani.unsafe.Direct')
              .returns(Ts.prim.pointer).$().$()
          ]
        }
      }
    }
  }
)

export const nativeModuleFunctionProducer = createSpecialProducer(
  { is: idl.isMethod, role: roles.nativeModule },
  (method, ctx) => {
    const methodName = fqName(method, '_')
    const className = nativeModuleName();
    return {
      artifact: {
        reference: E.get(E.v(className, [Hs.isType()]), methodName),
        implementationGenerator: () => {
          ctx.useBridge(method)
          const returnType = argConvertor(ctx, method.returnType).interopType(false)
          const nativeModule = Builders.class(className)
            .method(methodName)
              .native().static()
              ///no annotation for vmContext methods, see MethodUtils
              .annotation(isDirectInteropType(returnType) ? 'ani.unsafe.Direct' : 'ani.unsafe.Quick')
              .param('buffer').type(Ts.prim.serializerBuffer).$()
              .param('length').type(Ts.prim.i32).$()
              .returns(returnType).$().$()
          if (!method.isFree && !method.isStatic)
            nativeModule.methods[0].parameters.unshift(
              { name: 'ptr', type: Ts.prim.pointer })
          return [nativeModule]
        }
      }
    }
  }
)

export const nativeModuleConstructorProducer = createSpecialProducer(
  { is: idl.isConstructor, role: roles.nativeModule },
  (ctor, ctx) => {
    const methodName = fqName(ctor.parent as idl.IDLInterface, '_', '_construct')
    const nativeModuleClassName = nativeModuleName();
    return {
      artifact: {
        reference: E.get(E.v(nativeModuleClassName, [Hs.isType()]), methodName),
        implementationGenerator: () => {
          ctx.useBridge(ctor)
          const nativeModule = Builders.class(nativeModuleClassName)
            .method(methodName)
              .native().static().annotation('ani.unsafe.Direct')
              .returns(Ts.prim.pointer)
              .parameters(ctor.parameters.map(it => ({ name: it.name, type: ctx.useManaged(it.type).reference() }))).$().$()
          return [nativeModule]
        }
      }
    }
  }
)
