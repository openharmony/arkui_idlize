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
import { Builders, T } from "@idlizer/ost"
import { createProducer } from "../../engine/index.js"
import { expectExpr, expectType, managedName } from "../common.js"

export const constProducer = createProducer(
  { is: idl.isConstant, role: 'managed' },
  (node, ctx) => {
    const declName = managedName(idl.getFQName(node))
    const constType = expectType(ctx, node.type, 'managed')
    return {
      continuation: T.c(declName),
      declarations: [
        Builders.topLevel(declName)
          .type(constType)
          .value(node.value
            ? node.value
            : expectExpr(ctx, node.type, 'initializer')).$()
      ]
    }
  }
)
