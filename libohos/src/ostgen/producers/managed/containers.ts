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
import { createProducer, OhosSeed, throwError } from "../../engine/index.js"

export const containerProducer = createProducer(
  { is: idl.isContainerType },
  (type, ctx, role) => {
    const elemTypes = type.elementType.map(ty => ctx.expectType(new OhosSeed(ty, role)))
    const continuation = idl.IDLContainerUtils.isSequence(type) ? Ts.array(elemTypes[0])
      : idl.IDLContainerUtils.isRecord(type) ? Ts.map(elemTypes[0], elemTypes[1])
      : idl.IDLContainerUtils.isPromise(type) ? Ts.promise(elemTypes[0])
      : throwError(`Unknown container type "${idl.DebugUtils.debugPrintTrace(type)}"`)
    const trigger = idl.IDLContainerUtils.isPromise(type)
      ? [new OhosSeed(ctx.library.resolveTypeReference(ctx.library.createContinuationCallbackReference(type))!, role)]
      : []
    return {
      continuation,
      declarations: [],
      trigger: trigger
    }
  }
)
