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

import { join, relative, resolve, sep } from "node:path"
import { scan } from "../utils"
import { readFileSync, writeFileSync } from "node:fs"
import { ConfigTypeInfer, D } from "@idlizer/core"
import { CONFIG_RESULT_DIR } from "../shared"

export const SDK2ConfigScheme = D.object({
    rewriteArkConfigPath: D.default(D.map(D.string(), D.array(D.string())), new Map<string, string[]>()),
})
export type SDK2Config = ConfigTypeInfer<typeof SDK2ConfigScheme>

export interface SDK2ConfigOptions {
    sdkPath: string
    codePath: string
    configPath: string
    baseUrlPath: string
    externalPath: string
    buildPath: string
}
export interface SDK2ConfigResult {
    ui2abcConfigPath: string
}

export function sdk2config(options: SDK2ConfigOptions): SDK2ConfigResult {

    const text = readFileSync(options.configPath, 'utf-8')
    const content = JSON.parse(text)
    const config = SDK2ConfigScheme.validate(content).unwrap()

    const externalDir = resolve(options.externalPath)
    const externalPath = (...chunks: string[]) => join(externalDir, ...chunks)
    const arkuiConfig: any = {
        compilerOptions: {
            package: "idlize.test",
            baseUrl: options.baseUrlPath,
            outDir: options.buildPath,
            paths: {
                "#components": ["./framework/arkts"],
                "#handwritten": ["./handwritten"],
                "@arkoala/arkui": ["./framework"],
                "@koalaui/builderLambda": ["./annotations"],
                "@koalaui/interop": [externalPath("interop", "src", "arkts")],
                "@koalaui/common": [externalPath("incremental", "common", "src")],
                "@koalaui/compat": [externalPath("incremental", "compat", "src", "arkts")],
                "@koalaui/runtime": [externalPath("incremental", "runtime", "src")],
                "@koalaui/runtime/annotations": [externalPath("incremental", "runtime", "annotations")],
            }
        },
        include: [
            join(options.baseUrlPath, '**', '*.ets')
        ],
    }
    scanAbsolutePathDir(options.sdkPath).forEach(([packageName, fileName]) => {
        let value = [fileName]
        if (config.rewriteArkConfigPath.has(packageName)) {
            value = config.rewriteArkConfigPath.get(packageName)!
        }
        arkuiConfig.compilerOptions.paths[packageName] = value
    })

    const ui2abcConfigPath = join(CONFIG_RESULT_DIR, 'ui2abcconfig.json')
    writeFileSync(
        ui2abcConfigPath,
        JSON.stringify(arkuiConfig, null, 2),
        'utf-8'
    )

    return {
        ui2abcConfigPath
    }
}

function scanAbsolutePathDir(absolutePath:string) {
    const fileNames = scan(absolutePath)
    return fileNames.map((fileName): [string, string] => {
        let packageName = relative(absolutePath, fileName)
            .replaceAll('.d.ets', '')
            .split(sep)
            .filter(p => p)
            .join('.')
        if (packageName.indexOf("@") >= 0)
            packageName = packageName.substring(packageName.indexOf("@"))
        const fixedFileName = fileName.replaceAll('.d.ets', '')

        return [packageName, fixedFileName]
    })
}
