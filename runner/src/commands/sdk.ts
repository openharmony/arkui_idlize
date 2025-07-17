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

import { cpSync, existsSync, mkdirSync } from "node:fs"
import { installTemplate, run } from "../utils"
import { CLONED_SDK_BUILD_TOOLS, CLONED_SDK_DIR, PREPARED_SDK_ARKTS_ARKUI_COMPONENT, PREPARED_SDK_ARKTS_INTERNAL, PREPARED_SDK_DIR_ARKTS, PREPARED_SDK_DIR_TS, SDK_PATCH_DIR, SDK_PATCH_FILE, WORKING_DIR } from "../shared"
import { join } from "node:path"
import { EOL } from "node:os"

export interface PrepareSdkConfig {
    sdkPath: string
    installArktsConfig: boolean
}
export interface PrepareSdkResult {
    sdkPath12: string
    sdkPath11: string
    configPath: string | undefined
}

export function prepareSdk({
    sdkPath,
    installArktsConfig,
}:PrepareSdkConfig): PrepareSdkResult {
    mkdirSync(PREPARED_SDK_DIR_ARKTS, { recursive: true })
    mkdirSync(PREPARED_SDK_DIR_TS, { recursive: true })
    mkdirSync(CLONED_SDK_DIR, { recursive: true })
    cpSync(sdkPath, CLONED_SDK_DIR, { recursive: true })

    run(r => {
        r.cd(CLONED_SDK_DIR)
        const commit = r.query(['git', 'rev-parse', 'HEAD'])
        const hash = commit.replaceAll(EOL, '').trim()
        let sdkPatchFile = SDK_PATCH_FILE
        let maybeSpecificPatchFile = join(SDK_PATCH_DIR, hash + '.patch')
        if (existsSync(maybeSpecificPatchFile)) {
            sdkPatchFile = maybeSpecificPatchFile
        }
        r.exec(['git', 'apply', sdkPatchFile])

        const prepareSdkScriptFile = join(CLONED_SDK_DIR, 'build-tools', 'handleApiFiles.js')
        r.cd(CLONED_SDK_BUILD_TOOLS)
        r.exec(['npm', 'i'])
        r.exec([
            'node', prepareSdkScriptFile,
            ['--path', CLONED_SDK_DIR],
            ['--type', 'ets2'],
            ['--output', PREPARED_SDK_DIR_ARKTS]
        ])
        r.exec([
            'node', prepareSdkScriptFile,
            ['--path', CLONED_SDK_DIR],
            ['--type', 'ets'],
            ['--output', PREPARED_SDK_DIR_TS]
        ])

        const arkuiTransformerDir = join(CLONED_SDK_DIR, 'build-tools', 'arkui_transformer')
        r.cd(arkuiTransformerDir)
        r.exec(['npm', 'ci'])
        r.exec(['npm', 'run', 'compile:arkui'])
        r.exec([
            'node', '.',
            ['--input-dir', PREPARED_SDK_ARKTS_INTERNAL],
            ['--target-dir', PREPARED_SDK_ARKTS_ARKUI_COMPONENT],
            ['--use-memo-m3']
        ])
    })

    let configArktsDir: string | undefined = undefined
    if (installArktsConfig) {
        configArktsDir = join(WORKING_DIR, 'arkts.config.json')
        installTemplate(
            'panda.config.json',
            configArktsDir,
            new Map([
                ['PATCHED_SDK_PATH', PREPARED_SDK_DIR_ARKTS]
            ])
        )
    }


    return {
        sdkPath12: PREPARED_SDK_DIR_ARKTS,
        sdkPath11: PREPARED_SDK_DIR_TS,
        configPath: configArktsDir,
    }
}
