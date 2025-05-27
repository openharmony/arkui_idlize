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

import { arkgen, defaultConfigPath as arkgenConfigPath } from "@idlizer/arkgen/app"
import { etsgen } from "@idlizer/etsgen/app"
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { flat, installTemplate, over, run, scan } from "./utils"
import { Command } from "commander"

/////////////////////////////////////////////////
// CONSTANTS

const WORKING_DIR = resolve(__dirname, '..', 'out')
const SDK_PATCH_FILE = resolve(__dirname, '..', 'interface_sdk-js.patch')
const GENERATED_IDL_DIR = join(WORKING_DIR, 'idl')
const CLONED_SDK_DIR = join(WORKING_DIR, 'original-sdk')
const CLONED_SDK_BUILD_TOOLS = join(CLONED_SDK_DIR, 'build-tools')
const PREPARED_SDK_DIR = join(WORKING_DIR, 'patched-sdk')
const PREPARED_SDK_INTERNAL = join(PREPARED_SDK_DIR, 'api', '@internal', 'component', 'ets')
const PREPARED_SDK_ARKUI_COMPONENT = join(PREPARED_SDK_DIR, 'api', 'arkui', 'component')
const GENERATED_PEER_DIR = join(WORKING_DIR, 'peers')
const GENERATED_PEER_SIG = join(GENERATED_PEER_DIR, 'sig')
const GENERATED_PEER_LIBACE = join(GENERATED_PEER_DIR, 'libace')
const ADDITIONAL_FILES = [
    ['global', 'resource.d.ets']
]
const REFERENCE_CONFIG_PATH = resolve(arkgenConfigPath(), 'references', 'ets-sdk.refs.json')

/////////////////////////////////////////////////

function main(argv:string[]) {

    const program = new Command()
        .name("@idlizer/runner")
        .arguments("<sdk-path> <install-path>")
        .option('--target <target>', 'sig | libace | all', 'sig')
        .option('--original-sdk')
        .parse(argv, { from: 'user' })

    const [sdkPathInput, installPath] = program.args
    const options = program.opts()

    // 0. prepare
    if (existsSync(WORKING_DIR)) {
        rmSync(WORKING_DIR, { recursive: true })
    }
    mkdirSync(WORKING_DIR, { recursive: true })
    mkdirSync(GENERATED_IDL_DIR, { recursive: true })
    mkdirSync(GENERATED_PEER_DIR, { recursive: true })

    let sdkPath = sdkPathInput
    let configPath: string | undefined = undefined
    if (options.originalSdk) {
        mkdirSync(PREPARED_SDK_DIR, { recursive: true })
        mkdirSync(CLONED_SDK_DIR, { recursive: true })
        cpSync(sdkPath, CLONED_SDK_DIR, { recursive: true })

        run(r => {
            r.cd(CLONED_SDK_DIR)
            r.exec(['git', 'apply', SDK_PATCH_FILE])

            const prepareSdkScriptFile = join(CLONED_SDK_DIR, 'build-tools', 'handleApiFiles.js')
            r.cd(CLONED_SDK_BUILD_TOOLS)
            r.exec(['npm', 'i'])
            r.exec([
                'node', prepareSdkScriptFile,
                    ['--path', CLONED_SDK_DIR],
                    ['--type', 'ets2'],
                    ['--output', PREPARED_SDK_DIR]
            ])


            const arkuiTransformerDir = join(CLONED_SDK_DIR, 'build-tools', 'arkui_transformer')
            r.cd(arkuiTransformerDir)
            r.exec(['npm', 'i'])
            r.exec(['npm', 'run', 'compile:arkui'])
            r.exec([
                'node', '.',
                    ['--input-dir', PREPARED_SDK_INTERNAL],
                    ['--target-dir', PREPARED_SDK_ARKUI_COMPONENT]
            ])
        })

        configPath = join(WORKING_DIR, 'arkts.config.json')
        installTemplate(
            'panda.config.json',
            configPath,
            new Map([
                ['PATCHED_SDK_PATH', PREPARED_SDK_DIR]
            ])
        )


        sdkPath = PREPARED_SDK_DIR
    }

    // 1. d.ets -> idl
    const sdkApiPath = join(sdkPath, 'api')
    const additionalFiles = ADDITIONAL_FILES.map(it => join(sdkApiPath, join(...it)))
    etsgen(
        flat([
            '--ets2idl',
            '--use-component-stubs',
            ['--output-dir', GENERATED_IDL_DIR],
            ['--base-dir', sdkApiPath],
            ['--input-dir', join(sdkApiPath, 'arkui', 'component')],
            ['--input-files', additionalFiles],
            over(configPath, path => ['--ets-config', path])
        ])
    )
    // 2. idl -> peer
    const idlFiles = scan(GENERATED_IDL_DIR)
    arkgen(
        flat([
            '--idl2peer',
            ['--reference-names', REFERENCE_CONFIG_PATH],
            ['--input-files', idlFiles],
            ['--output-dir', GENERATED_PEER_DIR],
            ['--generator-target', 'arkoala'],
            ['--language', 'arkts'],
            '--only-integrated',
            '--use-memo-m3',
            ['--arkts-extension', '.ets']
        ])
    )
    // 3. Install
    let installSourceDir = GENERATED_PEER_DIR
    switch (options.target) {
        case 'sig': { installSourceDir = GENERATED_PEER_SIG; break }
        case 'libace': { installSourceDir = GENERATED_PEER_LIBACE; break }
        case 'all': { installSourceDir = GENERATED_PEER_DIR; break }
    }
    const peerFiles = scan(installSourceDir)
    peerFiles.forEach(file => {
        const relativeFile = relative(installSourceDir, file)
        const destinationFile = join(installPath, relativeFile)
        const destinationDir = dirname(destinationFile)
        if (!existsSync(destinationDir)) {
            mkdirSync(destinationDir, { recursive: true })
        }
        copyFileSync(file, join(installPath, relativeFile))
    })
}

main(process.argv.slice(2))
