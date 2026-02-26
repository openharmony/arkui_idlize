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

import * as idl from "@idlizer/core/idl"
import { T, Builders, managedName, Ts, createProducer, expectType, OhosSeed, E, FunctionDeclaration, OhosProducerContext, Hs, LWType, Md, expectExpr } from "@idlizer/libohos"
import { ArkUIRole } from ".."
import { isDefined } from "@idlizer/core"

function isComponentAttribute(node: idl.IDLInterface) {
  return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Component)
}

function isCommonMethodProperty(prop: idl.IDLProperty) {
  return idl.hasExtAttribute(prop, idl.IDLExtendedAttributes.CommonMethod)
}

function isAttributeModifier(prop: idl.IDLProperty) {
  return prop.name === 'attributeModifier'
}

function superClassForRole(node: idl.IDLInterface, role: 'peer' | 'component', ctx: OhosProducerContext): LWType | undefined {
  return node.name === 'CommonMethod'
    ? T.c(role === 'peer' ? 'PeerNode' : 'ComponentBase')
    : expectType(ctx, node.inheritance[0], role)
}

export const attributeProducer = createProducer(
  { is: idl.isInterface, predicate: isComponentAttribute, role: 'managed' },
  (node, ctx) => {
    const attrName = managedName(idl.getFQName(node))
    return {
      continuation: T.c(attrName),
      declarations: [
        Builders.class(attrName).interface()
          .extends(node.inheritance.length
              ? expectType(ctx, node.inheritance[0], 'managed')
              : undefined)
          .$(),
        createImpl(ctx, node, attrName)
      ].filter(isDefined),
      trigger: node.properties
        .filter(it => !isAttributeModifier(it))
        .map(it => new OhosSeed(it, 'peer'))
        ///add attrModifier()
    }
  }
)

export const peerProducer = createProducer<idl.IDLInterface, ArkUIRole<idl.IDLInterface>>(
  { is: idl.isInterface, predicate: isComponentAttribute, role: 'peer' },
  (node, ctx) => {
    const name = managedName(idl.getFQName(node).replace(/(Attribute)?$/, ''))
    const componentName = name.split('.').pop()!
    const peerName = name + 'Peer'
    const ctor = idl.createConstructor([
        idl.createParameter('peerPtr', idl.createPrimitiveType('i32')),
        idl.createParameter('id', idl.createPrimitiveType('i32')),
      ], undefined)
    ctor.parent = node
    const nativeModuleCall = expectExpr(ctx, ctor, 'native-module')
    return {
      continuation: T.c(peerName),
      declarations: [
        Builders.class(peerName)
          .extends(superClassForRole(node, 'peer', ctx))
          .ctor()
            .param('peerPtr').type(Ts.prim.pointer).$()
            .param('id').type(Ts.prim.i32).$()
            .param('name').type(Ts.prim.str).$()
            .param('flags').type(Ts.prim.i32).$()
            .block()
              .call('super').arg('peerPtr').arg('id').arg('name').arg('flags').$().$().$()
          .method('create').static()
            .returns(T.c(peerName))
            .param('component').typeStr('ComponentBase').$()
            .param('flags').type(Ts.prim.i32).$()
            .block()
              .decl('peerId').value().call('nextId').receiver('PeerNode').$().$().$()
              .decl('peerPtr').value().call(nativeModuleCall).arg('peerId').arg('flags').$().$().$()
              .decl('peer').value().ctor(peerName).arg('peerPtr').arg('peerId').arg(E.c(`'${componentName}'`)).arg('flags').$().$().$()
              .call('setPeer').receiver('component').arg('peer').$()
              .return().value('peer').$().$().$()
          .$()
      ]
    }
  }
)

export const componentProducer = createProducer<idl.IDLInterface, ArkUIRole<idl.IDLInterface>>(
  { is: idl.isInterface, predicate: isComponentAttribute, role: 'component' },
  (node, ctx) => {
    const name = managedName(idl.getFQName(node).replace(/(Attribute)?$/, 'Component'))
    const peerType = expectType(ctx, node, 'peer');
    return {
      continuation: T.c(name),
      declarations: [
        Builders.class(name)
          .extends(superClassForRole(node, 'component', ctx))
          .implements(expectType(ctx, node, 'managed'))
          .method('getPeer')
            .returns(peerType)
            .block()
            .return().cast(peerType).value().access('peer').receiver('this').$().$().$().$().$().$().$()
      ]
    }
  }
)

function createImpl(ctx: OhosProducerContext, attrNode: idl.IDLInterface, attrName: string): FunctionDeclaration | undefined {
  if (attrNode.name === 'CommonMethod')
    return undefined
  const name = attrName.replace(/Attribute$/, '')
  const peerType = expectType(ctx, attrNode, 'peer')
  const componentType = expectType(ctx, attrNode, 'component')
  const rememberCall = E.call(
    E.v('remember'),
    [Builders.lambda().body().block().return().ctor(name + 'Component').$().$().$().$().$()],
    [componentType]
  )
  const nodeAttachCall = E.call(
    E.v('NodeAttach'),
    [
      Builders.lambda().body()
        .call('create')
          .receiver(E.v(name + 'Peer', [Hs.isType()]))
          .arg('receiver').$().$().$(),
      Builders.lambda().param('_').type(peerType).$().body().block()
        .call('style').arg('receiver').$()
        .call('content_').$().$().$().$()
    ],
    [peerType]
  )
  return Builders.func(name + 'Impl')
    .param('style').type(Ts.optional(T.fn([['attributes', T.c(attrName)]], Ts.prim.void))).$()
    .param('content_').type(Ts.optional(T.fn([], Ts.prim.void))).$()
    .returns(Ts.prim.void)
    .annotation('memo')
    .block()
      .decl('receiver').value(rememberCall).$()
      .call(nodeAttachCall).$().$().$()
}
