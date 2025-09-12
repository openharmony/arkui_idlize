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

import { D, T } from "../../../ost"
import * as idl from "@idlizer/core/idl"
import { cApiName, roles } from "../common"
import { createProducer } from "../../engine/context"

export const enumProducer = createProducer(
  { is: idl.isEnum, role: roles.cApi },
  node => {
    const name = cApiName(idl.getFQName(node))
    return {
      artifact: {
        reference: T.cc(name),
        implementationGenerator: () =>
          [D.enum(name, node.elements.map(element => {
            return {
              name: element.name,
              value: element.initializer
            }
          }))]
      }
    }
  }
)
