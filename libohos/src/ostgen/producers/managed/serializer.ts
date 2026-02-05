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

import * as idl from "@idlizer/core/idl";
import { E, Hs } from "@idlizer/ost";
import { managedName } from "../common";
import { makeSerializer } from "../components/serializer";
import { createProducer } from "../../engine"

export const serializerProducer = createProducer(
  { is: idl.isInterface, role: 'managed' },
  (node, ctx) => {
    const serializerName = managedName(idl.getFQName(node) + 'Serializer')
    return {
      continuation: E.v(serializerName, [Hs.isType()]),
      declarations: makeSerializer(ctx, node, false)
    }
  }
)
