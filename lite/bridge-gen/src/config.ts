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
import { D as Conf, ConfigTypeInfer, D } from "@idlizer/core"

const ConfigBundleSchema = Conf.object({
    target: Conf.union(
        Conf.literal.string('node'),
        Conf.literal.string('panda')
    ),
    runtime: Conf.maybe(
        Conf.object({
            node: Conf.maybe(Conf.string()),
            panda: Conf.maybe(Conf.object({
                api: D.string(),
                binary: D.string(),
            })),
            headers: Conf.string(),
            native: Conf.string(),
        })
    ),
    flavours: Conf.default(Conf.array(Conf.string()), []),
    output_directory: Conf.string(),
    name: Conf.maybe(Conf.string()),
    version: Conf.maybe(Conf.string()),
})
export type ConfigBundle = ConfigTypeInfer<typeof ConfigBundleSchema>

const ConfigLibrarySchema = Conf.object({
    name: Conf.string(),
    path: Conf.string(),
    no_api_receiver: Conf.default(Conf.boolean(), false),
    header: Conf.maybe(Conf.string()),
    include_directory: Conf.maybe(Conf.array(Conf.string())),
})

export const ConfigSchema = Conf.object({
    name: Conf.string(),
    version: Conf.string(),
    declaration: Conf.object({
        root: Conf.string()
    }),
    library: ConfigLibrarySchema,
    bundle: Conf.array(ConfigBundleSchema)
})
export type InputConfigType = ConfigTypeInfer<typeof ConfigSchema>

export interface Config {
    originalConfig: InputConfigType

    paths: {
        originalConfigPath: string
        projectRoot: string
        projectDeclarationRoot: string
    }
}