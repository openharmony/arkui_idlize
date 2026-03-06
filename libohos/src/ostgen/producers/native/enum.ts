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

import { camelCaseToUpperSnakeCase } from "@idlizer/core"
import * as idl from "@idlizer/core/idl"
import { Builders, T } from "@idlizer/ost"
import { cApiName } from "../common.js"
import { createProducer } from "../../engine/context.js"

export const enumProducer = createProducer(
  { is: idl.isEnum, role: 'capi' },
  node => {
    const declName = cApiName(idl.getFQName(node))
    return {
      continuation: T.c(declName),
      declarations: [
        Builders.enum(declName)
          .members(node.elements.map(element => ({
            name: camelCaseToUpperSnakeCase(node.name + '_' + element.name),
            value: typeof element.initializer === 'number' ? element.initializer : undefined
          }))).$()
      ]
    }
  }
)
