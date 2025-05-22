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

import {
    ConfigTypeInfer,
    D,
} from "@idlizer/core";
import { readFileSync } from "node:fs";

const T = {
    stringArray: () => D.array(D.string()),
    stringMap: () => D.map(D.string(), D.string()),
}

export const ETSConfigScheme = D.object({
    DeletedPackages: T.stringArray(),
    DeletedDeclarations: T.stringArray(),
    DeletedMembers: D.map(D.string(), T.stringArray()),
    Components: T.stringArray(),
    Throws: T.stringArray(),
    ForceCallback: T.stringArray(),
    StubbedDeclarations: T.stringArray(),
    ForceDefaultExport: D.default(D.map(D.string(), D.string()), new Map()),
})
export type ETSVisitorConfig = ConfigTypeInfer<typeof ETSConfigScheme>

export function readConfig(fileName:string): ETSVisitorConfig {
    const text = readFileSync(fileName, 'utf-8')
    const json = JSON.parse(text)
    return ETSConfigScheme.validate(json).unwrap(`Not valid config: ${fileName}`)
}
