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

import { createProducer } from "../../engine/context";
import * as idl from "@idlizer/core/idl";
import { roles } from "../common";

// export const fileProducer = createProducer(
//   { is: idl.isFile },
//   (node, ctx) => {
//     return {
//       go: () => {
//         idl.linearizeNamespaceMembers(node.entries)
//           .filter(node =>
//                !idl.isImport(node)
//             && !idl.isNamespace(node)
//             && !idl.isCallback(node)
//           )
//           .forEach(node => ctx.use({ node, role: roles.managed }))
//       }
//     }
//   }
// )
///trigger each entry?
