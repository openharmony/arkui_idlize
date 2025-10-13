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

import { D, T } from "../../../ost";
import * as idl from "@idlizer/core/idl"
import { createSpecialProducer, managedName, roles } from "../common";

export const callbackProducer = createSpecialProducer(
  { is: idl.isCallback, role: roles.managed },
  (callback, ctx) => {
    const generatedDeclName = managedName(idl.getFQName(callback))
    return {
      artifact: {
        reference: T.c(generatedDeclName),
        implementationGenerator: () => {
          return [D.type(
            generatedDeclName,
            T.fn(
              callback.parameters.map(it => [it.name, ctx.useManaged(it.type).reference()]),
              ctx.useManaged(callback.returnType).reference()))]
        }
      }
    }
  }
)
