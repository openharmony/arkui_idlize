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
import { E, Builders, managedName, Ts, createProducer, expectType, OhosSeed, Md } from "@idlizer/libohos"
import { ArkUIRole } from "../index.js"

export const optionsProducer = createProducer<idl.IDLCallable, ArkUIRole<idl.IDLCallable>>(
  { is: idl.isCallable, role: 'peer' },
  (callsig, ctx) => {
    const attrName = managedName(idl.getFQName(callsig.parent!)).replace(/Interface$/, '')
    const parentName = (callsig.parent as idl.IDLInterface).name.replace(/Interface$/, '')
    const methodName = `set${parentName}Options`;
    const idlParams = callsig.parameters.slice(0, -1);
    const propMethod = idl.createMethod(methodName, idlParams, idl.createPrimitiveType('void'))
    const peerClass = idl.createInterface(parentName + 'Peer', idl.IDLInterfaceSubkind.Class)
    propMethod.parent = peerClass
    peerClass.parent = idl.getFileFor(callsig)

    const params = idlParams.map(it => ({
      name: it.name,
      type: expectType(ctx, it.type, 'managed'),
      modifiers: it.isOptional ? [Md.optional()] : []
    }))
    return {
      continuation: E.v(methodName),
      declarations: [
        Builders.class(attrName + 'Attribute').kind('interface')
          .method(methodName)
            .parameters(params)
            .returns(Ts.prim.self).$().$(),
        Builders.class(attrName + 'Component')
          .method(methodName)
            .parameters(params)
            .returns(Ts.prim.self)
            .block()
              .call(propMethod.name).args(params.map(it => E.v(it.name))).receiver()
                .call('getPeer').receiver('this').$().$().$()
              .return().value('this').$().$().$().$()
      ],
      trigger: [new OhosSeed(propMethod, 'managed')]
    }
  }
)
