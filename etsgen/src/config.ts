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
    parseConfigFiles,
} from "@idlizer/core";
import { dirname, join } from "node:path";

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
    ForceCallback: D.map(D.string(), D.string()),
    StubbedDeclarations: T.stringArray(),
    ForceDefaultExport: D.default(D.map(D.string(), D.string()), new Map()),
})
export type ETSVisitorConfig = ConfigTypeInfer<typeof ETSConfigScheme>

export function loadEtsgenConfiguration(configurationFiles: string[]) {
    return parseConfigFiles(ETSConfigScheme, configurationFiles)
}

export function etsgenDefaultConfigurationPath(): string {
    return join(ETSGEN_ROOT, 'generator-config.json')
}

export const ETSGEN_ROOT = join(dirname(require.resolve('@idlizer/etsgen')), '../../..')