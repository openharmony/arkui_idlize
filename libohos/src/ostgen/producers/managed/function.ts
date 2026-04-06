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
import { Builders, E, LWStatement, Md, S, T, lw } from "@idlizer/ost"
import { expectExpr, expectType, managedName } from "../common.js"
import { argConvertor } from "../components/argConvertor.js"
import { createProducer } from "../../engine/index.js"

export const functionProducer = createProducer(
  { is: idl.isMethod, role: 'managed' },
  (method, ctx) => {
    const declName = method.isFree
      ? managedName(idl.getFQName(method))
      : idl.getExtAttribute(method, idl.IDLExtendedAttributes.DtsName) ?? method.name
    const serializerName = 'serializer'
    const returnType = expectType(ctx, method.returnType, 'managed')
    const nativeModuleCall = Builders.call(expectExpr(ctx, method, 'native-module'))
      .arg().call('asBuffer').receiver(serializerName).$().$()
      .arg().call('length').receiver(serializerName).$().$().$()
    if (!method.isFree && !method.isStatic) {
      nativeModuleCall.args.unshift(
        Builders.access('ptr').receiver().access('peer').receiver('this').excl().$().$().$())
    }
    const isPromise = idl.isContainerType(method.returnType) && idl.IDLContainerUtils.isPromise(method.returnType)
    const isVoid = idl.isPrimitiveType(method.returnType, 'void') || isPromise
    const promiseParam = isPromise ? [idl.createParameter('out', method.returnType)] : []
    const body = [
      Builders.decl(serializerName, T.c('SerializerBase'))
        .value().call('hold').receiver('SerializerBase').$().$().$(),
      ...[...method.parameters, ...promiseParam]
      .flatMap(param =>
        argConvertor(ctx, param.type, param.isOptional).write(E.v(param.name), E.v(serializerName), false)),
      isVoid
        ? S.e(nativeModuleCall)
        : Builders.decl('retval').value(nativeModuleCall).$(),
      Builders.stmt().call('release').receiver(serializerName).$().$(),
      ...argConvertor(ctx, method.returnType).returnFromInterop('retval')
    ]
    const funcDecl = Builders.func(declName)
      .parameters(method.parameters.map(it => ({ name: it.name, type: expectType(ctx, it.type, 'managed') })))
      .returns(returnType)
      .block().statements(body).$().$()
    switch (idl.getExtAttribute(method, idl.IDLExtendedAttributes.Accessor)) {
      case idl.IDLAccessorAttribute.Getter: funcDecl.modifiers.push(Md.getter()); break
      case idl.IDLAccessorAttribute.Setter: funcDecl.modifiers.push(Md.setter()); break
    }
    let decl: lw.LWDeclaration = funcDecl
    if (method.isStatic)
      funcDecl.modifiers.push(Md.static())
    if (!method.isFree) {
      const clazz = Builders.class(managedName(idl.getFQName(method.parent!))).$()
      clazz.methods = [funcDecl]
      decl = clazz
    }
    return {
      continuation: E.v(declName),
      declarations: [decl]
    }
  }
)

export const constructorProducer = createProducer(
  { is: idl.isConstructor, role: 'managed' },
  (ctor, ctx) => {
    const className = managedName(idl.getFQName(ctor.parent!))
    const serializerName = 'serializer'
    const nativeModuleCall = Builders.call(expectExpr(ctx, ctor, 'native-module'))
      .arg().call('asBuffer').receiver(serializerName).$().$()
      .arg().call('length').receiver(serializerName).$().$().$()
    const body: LWStatement[] = [
      Builders.decl(serializerName, T.c('SerializerBase'))
        .value().call('hold').receiver('SerializerBase').$().$().$(),
      ...ctor.parameters.flatMap(param =>
        argConvertor(ctx, param.type, param.isOptional).write(E.v(param.name), E.v(serializerName), false)),
      Builders.decl('peerPtr').value(nativeModuleCall).$(),
      Builders.stmt().call('release').receiver(serializerName).$().$(),
    ]
    return {
      continuation: E.v(className),
      declarations: [
        Builders.class(className).ctor()
          .parameters(ctor.parameters.map(it => ({ name: it.name, type: expectType(ctx, it.type, 'managed') })))
          .block()
            .statements(body)
            .call('this')
              .arg().access('NOP').receiver('MaterializedBaseTag').$().$()
              .arg('peerPtr').$().$().$().$()
      ]
    }
  }
)
