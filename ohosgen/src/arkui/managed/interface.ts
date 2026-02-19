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
import { E, T, Builders, createProducer, managedName, expectType, expectExpr, argConvertor, LWType, Ts } from "@idlizer/libohos";

function isComponentInterface(node: idl.IDLInterface) {
  return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.ComponentInterface)
}

export const arkInterfaceProducer = createProducer(
  { is: idl.isInterface, predicate: isComponentInterface, role: 'managed' },
  (node, ctx) => {
    const componentName = node.name.replace(/Interface$/, '')
    const baseName = managedName(idl.getFQName(node)).replace(/Interface$/, '')
    const methodName = `set${componentName}Options`

    // For each callable signature, build the peer method, interface method, and component method
    const callSigParams = node.callables.map(it =>
      it.parameters.map(p => ({ name: p.name, type: expectType(ctx, p.type, 'managed') })))

    // Build peer class with set{ComponentName}OptionsAttribute methods
    const peerClass = Builders.class(baseName + 'Peer')

    for (const callable of node.callables) {
      const params = callable.parameters.map(p => ({ name: p.name, type: expectType(ctx, p.type, 'managed') }))
      const serializerName = 'thisSerializer'

      // Build serialization for each parameter
      const writeStmts = callable.parameters.flatMap(p =>
        argConvertor(ctx, p.type, p.isOptional).write(E.v(p.name), E.v(serializerName), false)
      )

      // Build native module call: ArkUIGeneratedNativeModule._BlankInterface_setBlankOptions(this.peer.ptr, thisSerializer.asBuffer(), thisSerializer.length())
      const syntheticMethod = idl.createMethod(methodName, callable.parameters, idl.createPrimitiveType('void'), undefined, {
        extendedAttributes: node.extendedAttributes
      })
      syntheticMethod.parent = node
      const nativeModuleCall = Builders.call(
        expectExpr(ctx, syntheticMethod, 'native-module'))
        .arg().access('ptr').receiver().access('peer').receiver('this').excl().$().$().$().$()
        .arg().call('asBuffer').receiver(serializerName).$().$()
        .arg().call('length').receiver(serializerName).$().$().$()

      peerClass.method(`${methodName}Attribute`)
        .parameters(params)
        .returns(Ts.prim.void)
        .block()
          .decl(serializerName, T.c('SerializerBase'))
            .value().call('hold').receiver('SerializerBase').$().$().$()
          .statements(writeStmts)
          .call(nativeModuleCall).$()
          .call('release').receiver(serializerName).$().$().$().$()
    }

    // Build attribute interface with set{ComponentName}Options method
    const attrInterface = Builders.class(baseName + 'Attribute')
      .interface()

    for (const callable of node.callables) {
      const params = callable.parameters.map(p => ({ name: p.name, type: expectType(ctx, p.type, 'managed') }))
      attrInterface.method(methodName)
        .parameters(params)
        .returns(Ts.prim.self).$().$()
        ///no body in interface methods, ok?
        // .block()
        //   .return().ctor('Error').arg(`Unimplemented method ${methodName}`).$().$().$().$()
    }

    // Build component class with set{ComponentName}Options delegation method
    const componentClass = Builders.class(baseName + 'Component')

    for (const callable of node.callables) {
      const params = callable.parameters.map(p => ({ name: p.name, type: expectType(ctx, p.type, 'managed') }))

      // Build casted parameter declarations and delegation call
      const block = Builders.block()
      for (const p of callable.parameters) {
        const castedType = p.isOptional
          ? Ts.union([expectType(ctx, p.type, 'managed'), Ts.prim.undefined])
          : expectType(ctx, p.type, 'managed')
        block.decl(`${p.name}Casted`).value().cast(castedType).value(p.name).$().$().$()
      }

      // this.getPeer()?.set{ComponentName}OptionsAttribute(minCasted)
      const delegateCall = Builders.call(`${methodName}Attribute`)
        .receiver().call('getPeer').receiver('this').$().$()
      for (const p of callable.parameters) {
        delegateCall.arg(`${p.name}Casted`)
      }
      block.call(delegateCall.$()).$()

      // this.applyOptionsFinish("{ComponentName}Attribute")
      block.call('applyOptionsFinish').receiver('this').arg(`${componentName}Attribute`).$()

      // return this
      block.return().value('this').$()

      componentClass.method(methodName)
        .parameters(params)
        .returns(Ts.prim.self)
        .body(block.$()).$()
    }

    return {
      continuation: T.c('///see: arkInterfaceProducer'),
      declarations: [
        peerClass.$(),
        attrInterface.$(),
        componentClass.$(),
      ]
    }
  }
)
