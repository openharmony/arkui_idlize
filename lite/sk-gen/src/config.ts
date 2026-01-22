/*
 * Copyright (c) 2025 Huawei Device Co., LtConf.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implieConf.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { D as Conf, ConfigTypeInfer } from "@idlizer/core"
import { resolve } from "node:path"

export const GeneratedSchema = Conf.object({
    output: Conf.string(),
    outputReport: Conf.maybe(Conf.string()),
})

export const DeclarationsSchema = Conf.object({
    /**
      * a list of idl source directories.
      * EXAMPLE ["./declarations/idl"]
      */
    source: Conf.array(Conf.string()),
    /**
     * a list of interfaces that should be ignored in the generation.
     * EXAMPLE {["Finalizable.Finalizable", "DoNotGenerateMe"]}
     *
     * another option, is specify methods to ignore.
     * EXAMPLE "[{ name: "GenerateExcept", member: ["ThisMethod", "ThisAttribute"] }]"
     *
     * both options can be mixed
     */
    ignore: Conf.default(
        Conf.array(
            Conf.union(
                Conf.string(),
                Conf.object({
                    name: Conf.string(),
                    members: Conf.array(Conf.string()),
                })
            )
        ), []
    ),
    /**
     * interfaces that are ignored in the generation, but imported from handwritten if necessary
     * EXAMPLE ["DoNotGenerate.ButIamUseful"]
     */
    custom: Conf.default(Conf.array(Conf.string()), []),
    /**
     * filters to remove specific methods
     *
     * SYNTAX
     * `$<COMMAND>:arg1:arg2:...:argN `
     *
     * EXAMPLE
     * `$NAME:getFinalizer` -- do not generate members with `getFinalizer` name
     *
     * COMMANDS
     * + $NAME:X -- remove members with name X
     * + $PARAM_IS:reference:X -- remove member if there is an parameter with X type
     * + $RET_TYPE_IS:reference:X -- remove member if it's return type is X
     * There is more: check generator.ts, evalBlacklistMethodFilter
     *
     */
    censor: Conf.default(
        Conf.object({
            methods: Conf.default(Conf.array(Conf.string()), [])
        }),
        {
            methods: []
        }
    )
})

export const ProjectConfigSchema = Conf.object({
    name: Conf.string(),
    declarations: DeclarationsSchema,
    generated: GeneratedSchema,
})
export type ProjectUserConfig = ConfigTypeInfer<typeof ProjectConfigSchema>

export interface ProjectEnvConfig {
    rootDirectory: string
}
export type ProjectConfig = ProjectUserConfig & ProjectEnvConfig

export const CONFIG_SEARCH_PATHS = [
    '.idlizer.config.json',
    '.idlizerrc',
    '.idlizerrc.json',
]

export function resolveConfigPaths(userConfig:ProjectUserConfig, foundPath: string): ProjectConfig {

    userConfig.generated.output = resolve(foundPath, userConfig.generated.output)
    if (userConfig.generated.outputReport) {
        userConfig.generated.outputReport = resolve(foundPath, userConfig.generated.outputReport)
    }
    userConfig.declarations.source = userConfig.declarations.source.map(path => resolve(foundPath, path))

    return {
        ...userConfig,
        rootDirectory: foundPath
    }
}
