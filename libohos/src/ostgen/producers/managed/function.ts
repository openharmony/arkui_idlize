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
import { E, S, T } from "../../../ost/builder";
import { Builders } from "../../../ost/builders";
import { ArgConvertor } from "../components/argConvertor";
import { Md } from "../../../ost/stdlib";

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
          const convertor = new ArgConvertor(ctx, E.v(serializerName), false)
          const fieldWrites = method.parameters.map(param => convertor.write(E.v(param.name), param.type))
          const releaseCall = Builders.stmt().call().receiverName(serializerName).functionName('release').$().$()
          const nativeModuleCall = Builders.call()
            .functionExpr(ctx.useManagedNativeModule(method).name())
            .arg().call().receiverName(serializerName).functionName('asBuffer').$().$()
            .arg().call().receiverName(serializerName).functionName('length').$().$().$()
          if (!method.isFree && !method.isStatic) {
            nativeModuleCall.args.unshift(
              Builders.access().object().access(E.v('this')).member('peer').excl().$().$().member('ptr').$())
          }
          const statements = [
            Builders.decl(serializerName, T.c('SerializerBase'))
              .value().call().receiverName('SerializerBase').functionName('hold').$().$().$(),
            ...fieldWrites]
          if (method.returnType !== idl.IDLVoidType) {
            statements.push(
              Builders.decl('result', returnType).valueExpr(nativeModuleCall).$(),
              releaseCall,
              Builders.return(returnType).valueStr('result').$())
          } else {
            statements.push(S.e(nativeModuleCall), releaseCall)
          }
          const funcDecl = Builders.func(declName)
            .parameters(method.parameters.map(it => ({ name: it.name, type: ctx.useManaged(it.type).reference() })))
            .returns(returnType)
            .block().statements(statements).$().$()
          switch (idl.getExtAttribute(method, idl.IDLExtendedAttributes.Accessor)) {
            case idl.IDLAccessorAttribute.Getter: funcDecl.modifiers.push(Md.getter()); break
            case idl.IDLAccessorAttribute.Setter: funcDecl.modifiers.push(Md.setter()); break
          }
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
                  .call().receiverName('this').functionName('setPeer')
                    .arg().call().functionExpr(ctx.useManagedNativeModule(ctor).name())
                      .args(ctor.parameters.map(it => E.v(it.name))).$().$().$().$().$().$()
          ]
        }
      }
    }
  }
)
