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
import { isDefined, isRoot, capitalize } from "@idlizer/core"
import { T, Ts, E, S, Hs, LWType, LWExpression, LWKind, Builders, FunctionDeclaration,
  ClassDeclaration, managedName, createProducer, expectExpr, expectType,
  OhosSeed, OhosProducerContext
} from "@idlizer/libohos"
import { ArkUIRole } from ".."

function isComponentAttribute(node: idl.IDLInterface) {
  return isRoot(node.name) ||
    idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Component)
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
    : node.inheritance.length
      ? expectType(ctx, node.inheritance[0], role)
      : undefined
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
        createImpl(ctx, node, attrName),
        createModifier(ctx, node, attrName)
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
    ctor.parent = node ///parent should in fact be peer, not attribute
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
              .decl('peer').value().ctor(peerName)
                .arg('peerPtr').arg('peerId').arg(E.c(`'${componentName}'`)).arg('flags').$().$().$()
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

function modifierFieldName(propName: string, index: number): string {
  return `_${propName}_${index}_value`
}

function createModifier(ctx: OhosProducerContext, attrNode: idl.IDLInterface, attrName: string): ClassDeclaration {
  const baseName = attrName.replace(/Attribute$/, '')
  const modifierName = baseName + 'Modifier'
  const parentModifierName = attrNode.inheritance.length
    ? managedName((attrNode.inheritance[0] as idl.IDLReferenceType).name.replace(/(Attribute)?$/, 'Modifier'))
    : modifierName // fallback, e.g. CommonMethod extends itself
  const peerName = baseName + 'Peer'

  // Separate regular properties from attributeModifier
  const regularProps = attrNode.properties.filter(it => !isAttributeModifier(it))
  const attrModProps = attrNode.properties.filter(it => isAttributeModifier(it))

  // Resolve types for regular properties
  const propTypes = regularProps.map(prop => expectType(ctx, prop.type, 'managed'))

  // Build fields with initializers
  const fields: ClassDeclaration['fields'] = [
    { name: '_instanceId', type: Ts.prim.number, expression: E.c(-1) },
    { name: '_state', type: T.c('ModifierState'), expression: E.instance('ModifierState', []) },
    { name: '_addr', type: T.c('ArrayBuffer'), expression: E.instance('ArrayBuffer', [E.c(4096)]) },
    { name: '_flagArray', type: T.c('Uint8Array'), expression: E.instance('Uint8Array', [E.get(E.v('this'), '_addr')]) },
  ]

  // Add per-property value fields
  regularProps.forEach((prop, i) => {
    fields.push({
      name: modifierFieldName(prop.name, i),
      type: Ts.optional(propTypes[i]),
    })
  })

  // isUpdater: () => boolean = () => false
  fields.push({
    name: 'isUpdater',
    type: T.fn([], Ts.prim.boolean),
    expression: E.lambda([], S.e(E.c('false'))),
  })

  // Build the class
  const classBuilder = Builders.class(modifierName)
    .extends(T.c(parentModifierName))
    .implements(T.c(attrName))
    .implements(T.c('AttributeModifier', T.c(attrName)))
    .fields(fields)

  // Constructor: super() + fill flagArray with 0
  classBuilder.ctor()
    .block()
      .call('super').$()
      .call('fill').receiver().access('_flagArray').receiver('this').$().$().arg(E.c(0)).$()
      .$().$()

  // setInstanceId method
  classBuilder.method('setInstanceId')
    .param('instanceId').type(Ts.prim.number).$()
    .returns(Ts.prim.void)
    .block()
      .binary('=').left(E.get(E.v('this'), '_instanceId')).right(E.v('instanceId')).$()
      .$().$()

  // applyNormalAttribute, applyPressedAttribute, applyFocusedAttribute, applyDisabledAttribute, applySelectedAttribute
  for (const methodName of ['applyNormalAttribute', 'applyPressedAttribute', 'applyFocusedAttribute', 'applyDisabledAttribute', 'applySelectedAttribute']) {
    classBuilder.method(methodName)
      .param('instance').type(T.c(attrName)).$()
      .returns(Ts.prim.void)
      .block().$().$()
  }

  // applyModifierPatch method
  classBuilder.method('applyModifierPatch')
    .param('node').typeStr('PeerNode').$()
    .returns(Ts.prim.void)
    .block()
      .call('applyModifierPatch').receiver('super').arg(E.v('node')).$()
      .call('addRef').receiver().access('_state').receiver('this').$().$().$()
      .statements([
        S.declaration('peer', T.c('Ark' + peerName.split('.').pop()!), false, E.cast(E.v('node'), T.c('Ark' + peerName.split('.').pop()!))),
        S.declaration('flagArray', T.c('Uint8Array'), false, E.get(E.v('this'), '_flagArray')),
        ...regularProps.map((prop, i) =>
          S.if(
            E.bin('!=', E.get(E.v('flagArray'), E.c(i)), E.c(0)),
            S.block([
              {
                kind: LWKind.SwitchStatement,
                selector: E.get(E.v('flagArray'), E.c(i)),
                cases: [
                  {
                    value: E.c(1),
                    body: [
                      S.e(E.call(E.get(E.v('peer'), 'set' + capitalize(prop.name) + 'Attribute'), [E.get(E.v('this'), modifierFieldName(prop.name, i))])),
                      S.e(E.bin('=', E.get(E.v('flagArray'), E.c(i)), E.c(2))),
                      S.e(E.v('break')),
                    ]
                  },
                  {
                    value: E.c(3),
                    body: [
                      S.e(E.bin('=', E.get(E.v('flagArray'), E.c(i)), E.c(2))),
                      S.e(E.v('break')),
                    ]
                  }
                ],
                default: [
                  S.e(E.bin('=', E.get(E.v('flagArray'), E.c(i)), E.c(0))),
                  S.e(E.call(E.get(E.v('peer'), 'set' + capitalize(prop.name) + 'Attribute'), [E.v('undefined')])),
                  S.e(E.v('break')),
                ]
              } as any
            ])
          )
        )
      ])
      .$().$()

  // mergeModifier method
  classBuilder.method('mergeModifier')
    .param('modifier').type(T.c(modifierName)).$()
    .returns(Ts.prim.void)
    .block()
      .call('mergeModifier').receiver('super').arg(E.v('modifier')).$()
      .binary('=').left(E.get(E.v('this'), '_state')).right(E.get(E.v('modifier'), '_state')).$()
      .statements([
        S.declaration('flagArray', T.c('Uint8Array'), false, E.get(E.v('modifier'), '_flagArray')),
        ...regularProps.map((prop, i) =>
          S.if(
            E.bin('!=', E.get(E.v('flagArray'), E.c(i)), E.c(0)),
            S.block([
              {
                kind: LWKind.SwitchStatement,
                selector: E.get(E.v('flagArray'), E.c(i)),
                cases: [
                  {
                    value: E.c(1),
                    body: [
                      S.e(E.call(E.get(E.v('this'), prop.name), [E.get(E.v('modifier'), modifierFieldName(prop.name, i))])),
                      S.e(E.v('break')),
                    ]
                  },
                  {
                    value: E.c(3),
                    body: [
                      S.e(E.call(E.get(E.v('this'), prop.name), [E.get(E.v('modifier'), modifierFieldName(prop.name, i))])),
                      S.e(E.v('break')),
                    ]
                  }
                ],
                default: [
                  S.e(E.call(E.get(E.v('this'), prop.name), [E.v('undefined')])),
                  S.e(E.v('break')),
                ]
              } as any
            ])
          )
        )
      ])
      .$().$()

  // Per-property setter methods
  regularProps.forEach((prop, i) => {
    classBuilder.method(prop.name)
      .param('value').type(propTypes[i]).$()
      .returns(Ts.prim.self)
      .block()
        .if()
          .condition(E.bin('==', E.get(E.get(E.v('this'), '_flagArray'), E.c(i)), E.c(0)))
          .then().block()
            .binary('=').left(E.get(E.get(E.v('this'), '_flagArray'), E.c(i))).right(E.c(1)).$()
            .binary('=').left(E.get(E.v('this'), modifierFieldName(prop.name, i))).right(E.v('value')).$()
            .call('fireChange').receiver().access('_state').receiver('this').$().$().$()
            .$().$()
          .else().block()
            .binary('=').left(E.get(E.get(E.v('this'), '_flagArray'), E.c(i))).right(E.c(3)).$()
            .$().$()
          .$()
        .return().value('this').$()
        .$().$()
  })

  // attributeModifier stub methods
  for (const prop of attrModProps) {
    const propType = expectType(ctx, prop.type, 'managed')
    classBuilder.method(prop.name)
      .param('value').type(propType).$()
      .returns(Ts.prim.self)
      .block()
        .statements([S.e(E.v('throw new Error("Not implemented")'))])
        .$().$()
  }

  return classBuilder.$()
}
