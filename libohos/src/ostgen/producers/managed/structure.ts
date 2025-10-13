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

import { Hs, D, E, Md, T, Ts } from "../../../ost";
import * as idl from "@idlizer/core/idl"
import { makePeerMethod } from "../components/peerMethod";
import { AdvancedGeneratorContext, createSpecialProducer, managedName, roles } from "../common";
import { capitalize, getSuperType, isMaterialized } from "@idlizer/core";
import { fqName, ProducerDescription } from "../../engine";
import { LWDeclaration } from "../../../ost/lws";
import { Builders } from "../../../ost/builders";

export const structureProducer = createSpecialProducer(
  { is: idl.isInterface, role: roles.managed },
  (node, ctx) => {
    if (node.subkind === idl.IDLInterfaceSubkind.Tuple)
      return makeTuple(node, ctx)
    const declName = managedName(idl.getFQName(node))
    const generator = isMaterialized(node, ctx.base.library)
      ? makeMaterialized
      : makeInterface
    return {
      artifact: {
        reference: T.c(declName),
        implementationGenerator: () => {
          ctx.useCApi(node)
          return generator(node, declName, ctx)
        }
      }
    }
  }
)

function makeTuple(node: idl.IDLInterface, ctx: AdvancedGeneratorContext): ProducerDescription {
  return {
    recursive: () => {///native
      return {
        artifact: {
          reference: Ts.intersection(
            node.properties.map(prop => ctx.useManaged(prop.type).reference()))
        }
      }
    }
  }
}

function makeInterface(node: idl.IDLInterface, name: string, ctx: AdvancedGeneratorContext): LWDeclaration[] {
  const superType = getSuperType(node, ctx.base.library)
  return [D.class(name,
    node.properties.map(prop => {
      const modifiers = [
        ...prop.isOptional ? [Md.optional()] : [],
        ...prop.isReadonly ? [Md.readonly()] : [],
        ...prop.isStatic ? [Md.static()] : [],
      ]
      return {
        name: prop.name,
        type: ctx.useManaged(prop.type).reference(),
        modifiers,
      }
    }),
    node.methods.map(method => makePeerMethod(method, ctx)), {
    kind: idl.isClassSubkind(node) ? 'class' : 'interface',
    base: superType ? ctx.useManaged(superType).reference() : undefined
    })]
}

function makeMaterialized(node: idl.IDLInterface, name: string, ctx: AdvancedGeneratorContext): LWDeclaration[] {
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
  syntheticMethods.forEach(it => it.parent = node);
  [
    ...node.constructors,
    ...node.methods,
    ...syntheticMethods
  ].forEach(it => ctx.useManaged(it))

  const peerType = Ts.union([T.c('Finalizable'), T.c('undefined')])
  const thisType = ctx.useManaged(node).reference()
  const intClass = Builders.class(name + 'Internal')
    .method('fromPtr').static()
      .returns(thisType)
      .param('ptr').type(Ts.prim.pointer).$().block()
        .return(thisType).ctor(name).args([E.v('ptr')]).$().$().$().$().$()
  const matClass = Builders.class(name).implements(T.c('MaterializedBase'))
    // peer
    .field('peer').type(peerType).$()
    .method('getPeer').returns(peerType).block()
      .return(peerType).access(E.v('this')).member('peer').$().$().$().$()
    .method('setPeer').private().param('peerPtr').type(Ts.prim.pointer).$().block()
      .binary('=')
        .left().access(E.v('this')).member('peer').$().$()
        .right().ctor('Finalizable')
          .arg('peerPtr').$()
          .arg().call().receiverExpr(E.v(name, [Hs.isType()])).functionName('getFinalizer').$().$().$().$().$().$().$()
    // getFinalizer
    .method('getFinalizer').static().returns(Ts.prim.pointer).block()
      .return(Ts.prim.pointer).call().function()
        .access(ctx.useManagedNativeModule(node).name())
        .member(fqName(node, '_', '_getFinalizer')).$().$().$().$().$().$()
    // default constructor
    .ctor().param('ptr').type(Ts.prim.pointer).$().block()
      .call().receiverExpr(E.v('this')).functionName('setPeer').arg('ptr').$().$().$().$().$()
  return [intClass, matClass]
}
