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

import * as path from "node:path"
import { fileURLToPath } from "node:url";
import { ConfigTypeInfer, CoreConfigurationSchema, D, parseConfigFiles } from "@idlizer/core";
import  { IDLVisitorConfigurationSchema } from "./IDLVisitorConfig.js"

export const DTSGEN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

export const DtsgenConfigurationSchema = D.combine(CoreConfigurationSchema, D.object({
    packageTransformation: D.maybe(D.map(D.string(), D.string())),
    IDLVisitor: IDLVisitorConfigurationSchema,
    boundProperties: D.map(D.string(), D.array(D.string())),
    components: D.object({
        ignoreComponents: D.array(D.string()),
        ignoreTypeParameters: D.array(D.string()),
    }),
})
)

export type DtsgenConfiguration = ConfigTypeInfer<typeof DtsgenConfigurationSchema>

export function loadDtsgenConfiguration(configurationFiles: string[]): DtsgenConfiguration {
    return parseConfigFiles<DtsgenConfiguration>(DtsgenConfigurationSchema, configurationFiles)
}

export function dtsgenDefaultConfigurationPaths(): string[] {
    return [
        path.join(DTSGEN_ROOT, 'generation-config/config.json'),
        path.join(DTSGEN_ROOT, 'generation-config/idl-config.json')
    ]
}
