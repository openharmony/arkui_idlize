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
import { createSpecialProducer, managedName, roles } from "../common";
import { E, S, T } from "../../../ost";
import { Builders } from "../../../ost";
import { argConvertor } from "../components/argConvertor";
import { Md } from "../../../ost";

export const functionProducer = createSpecialProducer(
  { is: idl.isMethod, role: roles.managed },
  (method, ctx) => {
    return {
      artifact: {
        reference: E.v(managedName(idl.getFQName(method))),
        implementationGenerator: () => {
          const declName = method.isFree
            ? managedName(idl.getFQName(method))
            : idl.getExtAttribute(method, idl.IDLExtendedAttributes.DtsName) ?? method.name
          const serializerName = 'serializer'
          const returnType = ctx.useManaged(method.returnType).reference()
          const nativeModuleCall = Builders.call(ctx.useManagedNativeModule(method).name())
            .arg().call('asBuffer').receiver(serializerName).$().$()
            .arg().call('length').receiver(serializerName).$().$().$()
          if (!method.isFree && !method.isStatic) {
            nativeModuleCall.args.unshift(
              Builders.access('ptr').receiver().access('peer').receiver('this').excl().$().$().$())
          }
          const body = [
            Builders.decl(serializerName, T.c('SerializerBase'))
              .value().call('hold').receiver('SerializerBase').$().$().$(),
            ...method.parameters.flatMap(param =>
              argConvertor(ctx, param.type, param.isOptional).write(E.v(param.name), E.v(serializerName), false)),
            idl.isPrimitiveType(method.returnType, 'void')
              ? S.e(nativeModuleCall)
              : Builders.decl('retval').value(nativeModuleCall).$(),
            Builders.stmt().call('release').receiver(serializerName).$().$(),
            ...argConvertor(ctx, method.returnType).returnFromInterop('retval', false)
          ]
          const funcDecl = Builders.func(declName)
            .parameters(method.parameters.map(it => ({ name: it.name, type: ctx.useManaged(it.type).reference() })))
            .returns(returnType)
            .block().statements(body).$().$()
          switch (idl.getExtAttribute(method, idl.IDLExtendedAttributes.Accessor)) {
            case idl.IDLAccessorAttribute.Getter: funcDecl.modifiers.push(Md.getter()); break
            case idl.IDLAccessorAttribute.Setter: funcDecl.modifiers.push(Md.setter()); break
          }
          if (method.isStatic)
            funcDecl.modifiers.push(Md.static())
          if (!method.isFree) {
            const clazz = Builders.class(managedName(idl.getFQName(method.parent!))).$()
            clazz.methods = [funcDecl]
            return [clazz]
          }
          return [funcDecl]
        }
      }
    }
  }
)

export const constructorProducer = createSpecialProducer(
  { is: idl.isConstructor, role: roles.managed },
  (ctor, ctx) => {
    return {
      artifact: {
        reference: E.v(managedName(idl.getFQName(ctor))),
        implementationGenerator: () => {
          const className = managedName(idl.getFQName(ctor.parent!))
          return [
            Builders.class(className)
              .ctor()
                .parameters(ctor.parameters.map(it => ({ name: it.name, type: ctx.useManaged(it.type).reference() })))
                .block()
                  .call('setPeer').receiver('this')
                    .arg().call(ctx.useManagedNativeModule(ctor).name())
                      .args(ctor.parameters.map(it => E.v(it.name))).$().$().$().$().$().$()
          ]
        }
      }
    }
  }
)
