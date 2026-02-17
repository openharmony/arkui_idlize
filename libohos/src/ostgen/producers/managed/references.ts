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

import * as idl from "@idlizer/core/idl"
import { warn } from "@idlizer/core"
import { createProducer } from "../../engine"
import { expectType } from "../common"

export const referenceProducer = createProducer(
  { is: idl.isReferenceType },
  (type, ctx, role) => {
    let decl = ctx.library.toDeclaration(type)
    if (!decl) {
      warn("Unresolved reference " + type.name)
      decl = idl.createPrimitiveType('Object')
    }
    return {
      continuation: expectType(ctx, decl, role!),
      declarations: []
    }
  }
)