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

import { D, T } from "@idlizer/ost"
import * as idl from "@idlizer/core/idl"
import { managedName } from "../common";
import { createProducer } from "../../engine";
import { OhosSeed } from "../common"

export const typedefProducer = createProducer(
  { is: idl.isTypedef, role: 'managed' },
  (typedef, ctx) => {
    const generatedDeclName = managedName(idl.getFQName(typedef))
    return {
      continuation: T.c(generatedDeclName),
      declarations: [
        D.type(generatedDeclName, ctx.expectType(new OhosSeed(typedef.type, 'managed')))
      ]
    }
  }
)
