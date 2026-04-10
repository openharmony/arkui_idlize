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
import { capitalize, getInitializerDefaultValue, getSuper, getSuperType, isDefined, isInExternalModule, isMaterialized } from "@idlizer/core"
import { Builders, ClassDeclaration, Md, T, Ts } from "@idlizer/ost"
import { ProducerResult } from "@idlizer/kit"
import { expectType, managedName } from "../common.js"
import { OhosProducer, OhosProducerContext, OhosSeed, Role } from "../../engine/index.js"
import { createProducer } from "../../engine/index.js"
import { peerGeneratorConfiguration } from "../../../DefaultConfiguration.js"

export const structureProducer = createProducer(
  { is: idl.isInterface, role: 'managed' },
  (node, ctx) => {
    const declName = managedName(idl.getFQName(node))
    return node.subkind === idl.IDLInterfaceSubkind.Tuple ? tuple(node, ctx)
      : skip(node) ? { continuation: T.c(declName), declarations: [] }
      : isMaterialized(node, ctx.library) ? materializedInterface(node, declName, ctx)
      : dataInterface(node, declName, ctx)
  }
)

function skip(node: idl.IDLInterface): boolean {
  return isInExternalModule(node) ||
    peerGeneratorConfiguration().isHandWritten(node.name)
}

const tuple: OhosProducer<idl.IDLInterface, Role<idl.IDLInterface>> = (node, ctx) => {
  return {
    continuation: Ts.intersection(node.properties.map(prop => expectType(ctx, prop.type, 'managed'))),
    declarations: []
  }
}

function dataInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext): ProducerResult {
  const superType = getSuperType(node, ctx.library)
  return {
    continuation: T.c(name),
    declarations: [
      Builders.class(name)
        .kind(idl.isClassSubkind(node) ? 'class' : 'interface')
        .extends(superType ? expectType(ctx, superType, 'managed') : undefined)
        .fields(node.properties.map(prop => {
          const modifiers = [
            ...prop.isOptional ? [Md.optional()] : [],
            ...prop.isReadonly ? [Md.readonly()] : [],
            ...prop.isStatic ? [Md.static()] : [],
          ]
          const field = Builders.field(prop.name).type(expectType(ctx, prop.type, 'managed')).modifiers(modifiers)
          if (idl.isClassSubkind(node))
            field.value(getInitializerDefaultValue(prop, ctx.library.language))
          return field.$()
        })).$()
    ]
  }
}

function materializedInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext): ProducerResult {
  const peerType = Ts.union([T.c('Finalizable'), T.c('undefined')])
  const superType = getSuperType(node, ctx.library)
  const superNode = getSuper(node, ctx.library)
  const superIsMaterialized = superNode ? isMaterialized(superNode, ctx.library) : false
  const matClass = Builders.class(name)
    .extends(superType ? expectType(ctx, superType, 'managed') : undefined)
    .implements(T.c('MaterializedBase'))
    // peer
    .field('peer').type(peerType).$()
    .method('getPeer').returns(peerType).block()
      .return(peerType).access('peer').receiver('this').$().$().$().$()
    .method('setPeer').private().param('peerPtr').type(Ts.prim.pointer).$().block()
      .binary('=')
        .left().access('peer').receiver('this').$().$()
        .right().ctor('Finalizable')
          .arg('peerPtr')
          .arg().call('getFinalizer').receiver(name).$().$().$().$().$().$().$()
    // default constructor
    .ctor().param('tag').type(T.c('MaterializedBaseTag')).$().param('ptr').type(Ts.prim.pointer).$()
      .block().statements([superIsMaterialized
        ? Builders.stmt().call('super').arg('tag').arg('ptr').$().$()
        : Builders.stmt().call('setPeer').receiver('this').arg('ptr').$().$()
      ]).$().$().$()
  const syntheticMethods = [
    // client constructors
    ...node.constructors.length ? [] : [idl.createConstructor([], undefined)],
    // property getters + setters
    ...node.properties.flatMap(prop => {
      const accessor = idl.getExtAttribute(prop, idl.IDLExtendedAttributes.Accessor)
      return [
        accessor === idl.IDLAccessorAttribute.Setter
          ? undefined
          : idl.createMethod('get' + capitalize(prop.name), [], prop.type, undefined, {
              extendedAttributes: [
                { name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Getter },
                { name: idl.IDLExtendedAttributes.DtsName, value: prop.name }]}),
        prop.isReadonly || accessor === idl.IDLAccessorAttribute.Getter
          ? undefined
          : idl.createMethod('set' + capitalize(prop.name), [idl.createParameter(prop.name, prop.type)], idl.createPrimitiveType('void'), undefined, {
              extendedAttributes: [
                { name: idl.IDLExtendedAttributes.Accessor, value: idl.IDLAccessorAttribute.Setter },
                { name: idl.IDLExtendedAttributes.DtsName, value: prop.name }]}),
      ].filter(isDefined)
    }),
    // getFinalizer
    idl.createMethod('getFinalizer', [], idl.createPrimitiveType('pointer'), {
      isStatic: true, isAsync: false, isOptional: false, isFree: false}),
  ]
  syntheticMethods.forEach(it => it.parent = node)
  return {
    continuation: T.c(name),
    declarations: [
      internalMaterializedClass(node, name, ctx),
      matClass
    ],
    trigger: [
      ...node.constructors,
      ...node.methods,
      ...syntheticMethods
    ].map(it => new OhosSeed(it, 'managed'))
  }
}

function internalMaterializedClass(node: idl.IDLInterface, name: string, ctx: OhosProducerContext): ClassDeclaration {
  const fqName = idl.getFQName(node)
  const thisType = expectType(ctx, node, 'managed')
  const fromPtrExpr = peerGeneratorConfiguration().handwrittenDeserializers.includes(fqName)
    ? Builders.return(thisType)
      .call(`deserialize_${fqName.replaceAll('.', '_')}`)
        .receiver(managedName('#handwritten.extractors'))
        .arg('ptr').$().$()
    : Builders.return(thisType)
      .ctor(name)
        .arg().access('NOP').receiver('MaterializedBaseTag').$().$()
        .arg('ptr').$().$()
  return Builders.class(name + 'Internal')
    .method('fromPtr').static()
      .returns(thisType)
      .param('ptr').type(Ts.prim.pointer).$()
      .block().statements([fromPtrExpr]).$().$().$()
}
