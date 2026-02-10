/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

export * from "./builders/index.js"
export * from "./stdlib.js"

export { processNPrintCJ } from "./printers/translators/cangjie.js"
export { processNPrintTS } from "./printers/translators/typescript.js"
export { processNPrintCXX } from "./printers/translators/cxx.js"
export { processNPrintJava } from "./printers/translators/java.js"
export { processNPrintArkTS } from "./printers/translators/arkts.js"
export { dumpToString } from "./printers/dump.js"

export * as lw from "./lws.js"
export * from "./lws.js"

export { IdentityTransformer, transformer } from "./visitors/identity.js"
