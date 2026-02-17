/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { capitalize } from "@idlizer/core";
import * as idl from "@idlizer/core/idl"
import { E, T, Builders, managedName, Ts, createProducer, expectType, expectExpr, argConvertor, Hs } from "@idlizer/libohos";

function isComponentAttribute(node: idl.IDLInterface) {
  return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Component)
}

function isCommonMethodProperty(prop: idl.IDLProperty) {
  return idl.hasExtAttribute(prop, idl.IDLExtendedAttributes.CommonMethod)
}

function isAttributeModifier(prop: idl.IDLProperty) {
  return prop.name === 'attributeModifier'
}

export const arkAttributeProducer = createProducer(
  { is: idl.isInterface, predicate: isComponentAttribute, role: 'managed' },
  (node, ctx) => {
    const packageName = idl.getPackageName(node)
    const componentName = node.name
    const baseName = managedName(`${packageName}.Ark${componentName}`)

    // Filter properties with [CommonMethod] attribute
    const commonMethodProps = node.properties.filter(isCommonMethodProperty)

    // Build peer class with set{Name}Attribute methods
    const peerClass = Builders.class(baseName + 'Peer')
      // create()
      .method('create').static()
        .returns(T.c(baseName + 'Peer'))
        .param('component').typeStr('ComponentBase').$()
        .param('flags').type(Ts.prim.i32).$()
        .block()
          .decl('peerId').value().call('nextId').receiver('PeerNode').$().$().$()
          .decl('peerPtr').value().call(`_${componentName}_construct`).receiver(ctx.getEffect().nativeModuleName)
            .arg('peerId').arg('flags').$().$().$()
          .decl('peer').value().ctor(`Ark${componentName}Peer`)
            .arg('peerPtr').arg('peerId').arg(componentName).arg('flags').$().$().$()
          .call('setPeer').receiver('component').arg('peer').$()
          .return().value('peer').$().$().$()

    // For each [CommonMethod] property, add a set{Name}Attribute method to the peer
    for (const prop of commonMethodProps) {
      if (isAttributeModifier(prop)) {
        // attributeModifier is a no-op in the peer - no native call needed
        continue
      }
      const propName = capitalize(prop.name)
      const propType = expectType(ctx, prop.type, 'managed')
      const serializerName = 'thisSerializer'

      // Build serialization body using argConvertor
      const writeStmts = argConvertor(ctx, prop.type).write(E.v('value'), E.v(serializerName), false)

      // NativeModule call: ArkUIGeneratedNativeModule._BlankAttribute_setColor(this.peer.ptr, thisSerializer.asBuffer(), thisSerializer.length())
      const syntheticMethod = idl.createMethod(`set${propName}`, [idl.createParameter('value', prop.type)], idl.createPrimitiveType('void'), undefined, {
        extendedAttributes: node.extendedAttributes
      })
      syntheticMethod.parent = node
      const nativeModuleCall = Builders.call(
        expectExpr(ctx, syntheticMethod, 'native-module'))
        .arg().access('ptr').receiver().access('peer').receiver('this').excl().$().$().$().$()
        .arg().call('asBuffer').receiver(serializerName).$().$()
        .arg().call('length').receiver(serializerName).$().$().$()

      peerClass.method(`set${propName}Attribute`)
        .param('value').type(propType).$()
        .returns(Ts.prim.void)
        .block()
          .decl(serializerName, T.c('SerializerBase'))
            .value().call('hold').receiver('SerializerBase').$().$().$()
          .statements(writeStmts)
          .call(nativeModuleCall).$()
          .call('release').receiver(serializerName).$().$().$().$()
    }

    // Build BlankAttribute interface extending CommonMethod
    const superType = node.inheritance.length > 0
      ? expectType(ctx, node.inheritance[0], 'managed')
      : undefined
    const attrInterface = Builders.class(baseName)
      .interface()
    if (superType) {
      attrInterface.extends(superType)
    }
    for (const prop of commonMethodProps) {
      const propType = expectType(ctx, prop.type, 'managed')
      attrInterface.method(prop.name)
        .param('value').type(propType).$()
        .returns(Ts.prim.self)
        .block()
          .return().value('this').$().$().$().$()
    }

    // Build ArkBlankComponent class
    const componentClass = Builders.class(baseName + 'Component')
    if (superType) {
      componentClass.extends(T.c(managedName(`${packageName}.Ark${node.inheritance[0].name}Component`)))
    }
    componentClass.implements(T.c(baseName))

    // getPeer()
    componentClass.method('getPeer')
      .returns(T.c(baseName + 'Peer'))
      .block()
        .return().cast(T.c(baseName + 'Peer')).value().access('peer').receiver('this').$().$().$().$().$().$()

    // For each [CommonMethod] property, add delegation method
    for (const prop of commonMethodProps) {
      const propName = prop.name
      const propType = expectType(ctx, prop.type, 'managed')

      if (isAttributeModifier(prop)) {
        // attributeModifier just returns this
        componentClass.method(propName)
          .param('value').type(propType).$()
          .returns(Ts.prim.self)
          .block()
            .return().value('this').$().$().$().$()
      } else {
        // Regular property: cast and delegate to peer
        componentClass.method(propName)
          .param('value').type(propType).$()
          .returns(Ts.prim.self)
          .block()
            .decl('valueCasted').value().cast(propType).value('value').$().$().$()
            .call(`set${capitalize(propName)}Attribute`).receiver().call('getPeer').receiver('this').$().$()
              .arg('valueCasted').$()
            .return().value('this').$().$().$().$()
      }
    }

    // applyAttributesFinish and applyOptionsFinish
    componentClass.method('applyAttributesFinish')
      .returns(Ts.prim.void)
      .block()
        .call('applyAttributesFinish').receiver('@base').$().$().$().$()

    componentClass.method('applyOptionsFinish')
      .param('traceName').type(Ts.prim.str).$()
      .returns(Ts.prim.void)
      .block()
        .call('applyOptionsFinish').receiver('@base').arg('traceName').$().$().$().$()

    // Build BlankImpl function
    const shortComponentName = baseName.split('.').pop()!
    const rememberCall = E.call(
      E.v('remember'),
      [Builders.lambda()
        .body().return().ctor(shortComponentName + 'Component').$().$().$().$()],
      [T.c(baseName + 'Component')]
    )
    const createLambda = Builders.lambda()
      .body().return().call('create').receiver(E.v(shortComponentName + 'Peer', [Hs.isType()]))
        .arg('receiver').$().$().$().$()
    const bodyLambda = Builders.lambda()
      .param('_').type(T.c(baseName + 'Peer')).$()
      .body().block()
        .call('style').arg('receiver').$()
        .call('content_').$().$().$().$()
    const nodeAttachCall = E.call(
      E.v('NodeAttach'),
      [createLambda, bodyLambda],
      [T.c(baseName + 'Peer')]
    )
    const implFunc = Builders.func(baseName.replace('Ark', '') + 'Impl')
      .param('style').type(Ts.optional(T.fn([['attributes', T.c(baseName)]], Ts.prim.void))).$()
      .param('content_').type(Ts.optional(T.fn([], Ts.prim.void))).$()
      .returns(Ts.prim.void)
      .annotation('memo')
      .block()
        .decl('receiver').value(rememberCall).$()
        .call(nodeAttachCall).$().$()

    return {
      continuation: T.c(baseName + 'Component'),
      declarations: [
        peerClass.$(),
        attrInterface.$(),
        componentClass.$(),
        implFunc.$()
      ]
    }
  }
)
