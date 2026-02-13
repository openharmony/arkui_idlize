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

import { Ts } from "@idlizer/ost"
import * as idl from "@idlizer/core/idl"
import { createProducer, OhosSeed } from "../../engine/index.js"

export const containerProducer = createProducer(
  { is: idl.isContainerType },
  (type, ctx, role) => {
    if (idl.IDLContainerUtils.isSequence(type)) {
      const elemRef = ctx.expectType(new OhosSeed(type.elementType[0], role))
      return {
        continuation: Ts.array(elemRef),
        declarations: []
      }
    }
    if (idl.IDLContainerUtils.isRecord(type)) {
      const keyRef = ctx.expectType(new OhosSeed(type.elementType[0], role))
      const valRef = ctx.expectType(new OhosSeed(type.elementType[1], role))
      return {
        continuation: Ts.map(keyRef, valRef),
        declarations: []
      }
    }
    throw new Error(`Unknown type "${idl.DebugUtils.debugPrintType(type)}"`)
  }
)
