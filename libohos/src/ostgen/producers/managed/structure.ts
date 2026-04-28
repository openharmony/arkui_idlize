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
import { capitalize, getSuper, getSuperType, isDefined, isInExternalModule, isMaterialized, isStaticMaterialized } from "@idlizer/core"
import { Builders, Md, T, Ts } from "@idlizer/ost"
import { ProducerResult } from "@idlizer/kit"
import { expectExpr, expectType, managedName } from "../common.js"
import { OhosProducerContext, OhosRole, OhosSeed } from "../../engine/index.js"
import { createProducer } from "../../engine/index.js"
import { peerGeneratorConfiguration } from "../../../DefaultConfiguration.js"

export const structureProducer = createProducer<idl.IDLInterface, OhosRole<idl.IDLInterface>>(
  { is: idl.isInterface, role: 'managed' },
  (node, ctx, role, data) => {
    const declName = managedName(idl.getFQName(node))
    return node.subkind === idl.IDLInterfaceSubkind.Tuple ? tuple(node, ctx)
      : skip(node) ? { continuation: T.c(declName), declarations: [] }
      : isMonomorphized(node) ? unmonomorphize(node, ctx)
      : isGeneric(node) ? dataInterface(node, declName, ctx, data?.typeArgs)
      : isStaticMaterialized(node, ctx.library) ? staticMaterializedInterface(node, declName, ctx)
      : isMaterialized(node, ctx.library) ? materializedInterface(node, declName, ctx)
      : dataInterface(node, declName, ctx)
  }
)

function skip(node: idl.IDLInterface): boolean {
  return isInExternalModule(node) ||
    peerGeneratorConfiguration().isHandWritten(node.name)
}

function isGeneric(node: idl.IDLInterface): boolean {
  return isDefined(node.typeParameters) && node.typeParameters.length > 0
}

function isMonomorphized(node: idl.IDLInterface): boolean {
  return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.OriginalGenericName)
}

function unmonomorphize(node: idl.IDLInterface, ctx: OhosProducerContext): ProducerResult {
  const attr = node.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.OriginalGenericName)!
  return {
    continuation: T.c(managedName(attr.value!), ...attr.typesValue?.map(ty => expectType(ctx, ty, 'managed')) ?? []),
    declarations: []
  }
}

function tuple(node: idl.IDLInterface, ctx: OhosProducerContext): ProducerResult {
  return {
    continuation: Ts.intersection(node.properties.map(prop => expectType(ctx, prop.type, 'managed'))),
    declarations: []
  }
}

/*
 * This is called via two different paths:
 * 1. type reference -> seed(resolved declaration, type args from reference)
 * 2. interface -> seed(interface declaration, no type args)
 * We don't want to produce interface declaration each time this is called via path 1 with different type args.
 * When type args are present, we just generate type reference that bears the type args, and expect the declaration
 * to be generated when this is called via path 2.
 */
function dataInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext, typeArgs?: idl.IDLType[]): ProducerResult {
  const superType = getSuperType(node, ctx.library)
  if (typeArgs) {
    return {
      continuation: T.c(name, ...typeArgs.map(ty => expectType(ctx, ty, 'managed'))),
      declarations: []
    }
  }
  return {
    continuation: T.c(name),
    declarations: [
      Builders.class(name)
        .kind(idl.isClassSubkind(node) ? 'class' : 'interface')
        .typeParameters(node.typeParameters)
        .extends(superType ? expectType(ctx, superType, 'managed') : undefined)
        .fields(node.properties.map(prop => {
          const modifiers = [
            ...prop.isOptional ? [Md.optional()] : [],
            ...prop.isReadonly ? [Md.readonly()] : [],
            ...prop.isStatic ? [Md.static()] : [],
          ]
          const field = Builders.field(prop.name).type(expectType(ctx, prop.type, 'managed')).modifiers(modifiers)
          if (idl.isClassSubkind(node))
            field.value(expectExpr(ctx, prop.type, 'initializer'))
          return field.$()
        }))
        .methods(node.methods.map(method =>
          Builders.func(method.name)
          .returns(expectType(ctx, method.returnType, 'managed'))
          .parameters(method.parameters.map(param => ({ name: param.name, type: expectType(ctx, param.type, 'managed')}))).$()
        ))
        .$()
    ]
  }
}

function staticMaterializedInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext): ProducerResult {
  const superType = getSuperType(node, ctx.library)
  return {
    continuation: T.c(name),
    declarations: [
      Builders.class(name)
        .extends(superType ? expectType(ctx, superType, 'managed') : undefined).$()
    ],
    trigger: node.methods.map(it => new OhosSeed(it, 'managed', ctx))
  }
}

function materializedInterface(node: idl.IDLInterface, name: string, ctx: OhosProducerContext): ProducerResult {
  const peerType = Ts.union([T.c('Finalizable'), T.c('undefined')])
  const thisType = expectType(ctx, node, 'managed')
  const superType = getSuperType(node, ctx.library)
  const superNode = getSuper(node, ctx.library)
  const superIsMaterialized = superNode ? isMaterialized(superNode, ctx.library) : false
  const fqName = idl.getFQName(node)
  const fromPtrExpr = peerGeneratorConfiguration().handwrittenDeserializers.includes(fqName)
    ? Builders.call(`deserialize_${fqName.replaceAll('.', '_')}`)
      .receiver(managedName('#handwritten.extractors'))
      .arg('ptr').$()
    : Builders.ctor(name)
      .arg().access('NOP').receiver('MaterializedBaseTag').$().$()
      .arg('ptr').$()
  const intClass = Builders.class(name + 'Internal')
    .method('fromPtr').static()
      .returns(thisType)
      .param('ptr').type(Ts.prim.pointer).$().block()
        .return(thisType).value(fromPtrExpr).$().$().$().$()
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
    declarations: [ intClass, matClass ],
    trigger: [
      ...node.constructors,
      ...node.methods,
      ...syntheticMethods
    ].map(it => new OhosSeed(it, 'managed', ctx))
  }
}
