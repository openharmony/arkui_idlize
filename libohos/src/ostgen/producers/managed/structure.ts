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
import { Builders, D, E, Hs, Md, T, Ts, lw } from "@idlizer/ost"
import { managedName } from "../common"
import { capitalize, getSuperType, isMaterialized } from "@idlizer/core"
import { fqName } from "../../engine"
import { OhosProducer, OhosProducerContext, OhosSeed } from "../../seed"
import { ProducerResult } from "@idlizer/kit"

export const structure: OhosProducer<idl.IDLInterface> = (node, ctx) => {
  const declName = managedName(idl.getFQName(node))
  return node.subkind === idl.IDLInterfaceSubkind.Tuple ? tuple(node, ctx) :
    isMaterialized(node, ctx.library) ? materializedInterface(node, declName, ctx) :
    dataInterface(node, declName, ctx)
}

const tuple: OhosProducer<idl.IDLInterface> = (node, ctx) => {
  return {
    continuation: Ts.intersection(node.properties.map(prop => ctx.expectType(new OhosSeed(prop.type)))),
    declarations: []
  }
}

function dataInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext): ProducerResult {
  ///node.methods.forEach(it => ctx.useManaged(it))
  const superType = getSuperType(node, ctx.library)
  const decl = D.class(name,
    node.properties.map(prop => {
      const modifiers = [
        ...prop.isOptional ? [Md.optional()] : [],
        ...prop.isReadonly ? [Md.readonly()] : [],
        ...prop.isStatic ? [Md.static()] : [],
      ]
      return {
        name: prop.name,
        type: ctx.expectType(new OhosSeed(prop.type)),
        modifiers,
      }
    }),
    [], {
    kind: idl.isClassSubkind(node) ? 'class' : 'interface',
    base: superType ? ctx.expectType(new OhosSeed(superType)) : undefined
    }
  )
  return {
    continuation: T.c(name),
    declarations: [decl]
  }
}

function materializedInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext): ProducerResult {
  const syntheticMethods = [
    ...node.constructors.length ? [] : [idl.createConstructor([], undefined)],
    ...node.properties.flatMap(prop => [
      idl.createMethod('get' + capitalize(prop.name), [], prop.type, undefined, {
        extendedAttributes: [
          { name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Getter },
          { name: idl.IDLExtendedAttributes.DtsName, value: prop.name }]}),
      idl.createMethod('set' + capitalize(prop.name), [idl.createParameter(prop.name, prop.type)], idl.IDLVoidType, undefined, {
        extendedAttributes: [
          { name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Setter },
          { name: idl.IDLExtendedAttributes.DtsName, value: prop.name }]}),
    ])
  ]
  // syntheticMethods.forEach(it => it.parent = node);
  // [
  //   ...node.constructors,
  //   ...node.methods,
  //   ...syntheticMethods
  // ].forEach(it => ctx.useManaged(it))

  const peerType = Ts.union([T.c('Finalizable'), T.c('undefined')])
  const thisType = ctx.expectType(new OhosSeed(node))
  const intClass = Builders.class(name + 'Internal')
    .method('fromPtr').static()
      .returns(thisType)
      .param('ptr').type(Ts.prim.pointer).$().block()
        .return(thisType).ctor(name).arg('ptr').$().$().$().$().$()
  const matClass = Builders.class(name).implements(T.c('MaterializedBase'))
    // peer
    .field('peer').type(peerType).$()
    .method('getPeer').returns(peerType).block()
      .return(peerType).access('peer').receiver('this').$().$().$().$()
    .method('setPeer').private().param('peerPtr').type(Ts.prim.pointer).$().block()
      .binary('=')
        .left().access('peer').receiver('this').$().$()
        .right().ctor('Finalizable')
          .arg('peerPtr')
          .arg().call('getFinalizer').receiver(E.v(name, [Hs.isType()])).$().$().$().$().$().$().$()
    // getFinalizer
    // .method('getFinalizer').static().returns(Ts.prim.pointer).block()
    //   .return(Ts.prim.pointer).call(fqName(node, '_', '_getFinalizer'))
    //     .receiver(ctx.useManagedNativeModule(node).name()).$().$().$().$()
    // default constructor
    .ctor().param('ptr').type(Ts.prim.pointer).$().block()
      .call('setPeer').receiver('this').arg('ptr').$().$().$().$()
  return {
    continuation: T.c(name),
    declarations: [intClass, matClass]
  }
}
