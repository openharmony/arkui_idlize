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

import { Ts } from "../../../ost";
import * as idl from "@idlizer/core/idl";
import { createSpecialProducer } from "../common";

export const containerProducer = createSpecialProducer(
  { is: idl.isContainerType },
  (node, ctx) => {
    return {
      recursive: () => {
        if (idl.IDLContainerUtils.isSequence(node)) {
          const elemRef = ctx.useManaged(node.elementType[0]).reference()
          return {
            artifact: {
              reference: Ts.array(elemRef)
            }
          }
        }
        if (idl.IDLContainerUtils.isRecord(node)) {
          const keyRef = ctx.useManaged(node.elementType[0]).reference()
          const valRef = ctx.useManaged(node.elementType[1]).reference()
          return {
            artifact: {
              reference: Ts.map(keyRef, valRef)
            }
          }
        }
        throw new Error(`Unknown type "${idl.DebugUtils.debugPrintType(node)}"`)
      }
    }
  }
)
