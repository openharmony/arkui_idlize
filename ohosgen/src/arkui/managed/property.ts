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

import { capitalize } from "@idlizer/core"
import * as idl from "@idlizer/core/idl"
import { Builders, managedName, Ts, createProducer, expectType, expectExpr } from "@idlizer/libohos"
import { ArkUIRole } from ".."

export const propertyProducer = createProducer<idl.IDLProperty, ArkUIRole<idl.IDLProperty>>(
  { is: idl.isProperty, role: 'peer' },
  (prop, ctx) => {
    const attrName = managedName(idl.getFQName(prop.parent!))
    const propMethod = idl.createMethod(
        'set' + capitalize(prop.name),
        [idl.createParameter('value', prop.type)],
        idl.createPrimitiveType('void'))
    const peerName = idl.getQualifiedName(prop.parent!, 'name').replace(/(Attribute)?$/, 'Peer')
    const peerClass = idl.createInterface(peerName, idl.IDLInterfaceSubkind.Class)
    propMethod.parent = peerClass
    peerClass.parent = idl.getFileFor(prop)

    const propType = expectType(ctx, prop.type, 'managed')
    return {
      continuation: expectExpr(ctx, propMethod, 'managed'),
      declarations: [
        Builders.class(attrName).interface()
          .method(prop.name)
            .param('value').type(propType).$()
            .returns(Ts.prim.self).$().$(),
        Builders.class(attrName.replace(/(Attribute)?$/, 'Component'))
          .method(prop.name)
            .param('value').type(propType).$()
            .returns(Ts.prim.self)
            .block()
              .call(propMethod.name).arg('value').receiver()
                .call('getPeer').receiver('this').$().$().$()
              .return().value('this').$().$().$().$()
      ]
    }
  }
)
