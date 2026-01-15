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
import { getIO, terminate } from "@idlizer/kit"
import { join, resolve } from "node:path"

const io = getIO()

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

const CONFIG_SEARCH_PATHS = [
    '.idlizer.config.json',
    '.idlizerrc',
    '.idlizerrc.json',
]

async function readUserConfig(rootDirectory: string): Promise<[ProjectUserConfig, string]> {
    const triedPaths: string[] = []
    for (const path of CONFIG_SEARCH_PATHS) {
        const possiblePath = join(rootDirectory, path)
        if (await io.exists(possiblePath)) {
            const text = await io.readFile(possiblePath)
            const json = JSON.parse(text)
            const maybeConfig = ProjectConfigSchema.validate(json)
            if (!maybeConfig.success()) {
                terminate(`Config was found at "${possiblePath}", but was not parsed!\n ` + maybeConfig.error())
            }
            return [maybeConfig.unwrap(), possiblePath]
        }
        triedPaths.push(possiblePath)
    }
    terminate(
        'Config was not found!\n'
        + 'Searched at: \n'
        + triedPaths.map(p => ' '.repeat(2) + p).join('\n')
    )
}

export async function readConfig(rootDirectory: string): Promise<ProjectConfig> {
    const [userConfig, foundPath] = await readUserConfig(rootDirectory)

    userConfig.generated.output = resolve(rootDirectory, userConfig.generated.output)
    if (userConfig.generated.outputReport) {
        userConfig.generated.outputReport = resolve(rootDirectory, userConfig.generated.outputReport)
    }
    userConfig.declarations.source = userConfig.declarations.source.map(path => resolve(rootDirectory, path))

    return {
        ...userConfig,
        rootDirectory: foundPath
    }
}
