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

import { existsSync, mkdirSync, rmSync } from "node:fs"
import { Command } from "commander"
import { GENERATED_IDL_DIR, GENERATED_PEER_DIR, GENERATED_PEER_LIBACE, GENERATED_PEER_SIG, WORKING_DIR } from "./shared"
import { commands } from "./commands"

/////////////////////////////////////////////////

function setup() {
    if (existsSync(WORKING_DIR)) {
        rmSync(WORKING_DIR, { recursive: true })
    }
    mkdirSync(WORKING_DIR, { recursive: true })
    mkdirSync(GENERATED_IDL_DIR, { recursive: true })
    mkdirSync(GENERATED_PEER_DIR, { recursive: true })
}

///

function m3(sdkPathInput:string, installPath:string, options:any) {
    setup()

    let sdkPath = sdkPathInput
    let configPath: string | undefined = undefined
    if (options.originalSdk) {
        const prepareResult = commands.prepareSdk({ sdkPath, installArktsConfig: true })
        sdkPath = prepareResult.sdkPath12
        configPath = prepareResult.configPath
    }

    commands.ets2idl({ sdkPath, configPath })
    commands.idl2peer({ target: options.target })

    let installSourceDir = GENERATED_PEER_DIR
    switch (options.target) {
        case 'sig': { installSourceDir = GENERATED_PEER_SIG; break }
        case 'libace': { installSourceDir = GENERATED_PEER_LIBACE; break }
        case 'all': { installSourceDir = GENERATED_PEER_DIR; break }
    }
    commands.install({ sourceDir: installSourceDir, installPath })
}

///

function sdk(sdkPathInput:string, installPath12:string, installPath11:string) {
    setup()

    const { sdkPath11, sdkPath12 } = commands.prepareSdk({
        sdkPath: sdkPathInput,
        installArktsConfig: false
    })
    commands.install({ sourceDir: sdkPath12, installPath: installPath12 })
    commands.install({ sourceDir: sdkPath11, installPath: installPath11 })
}

/////////////////////////////////////////////////

function main(argv:string[]) {

    const program = new Command()
        .name("@idlizer/runner")

    program.command('m3 <sdk-path> <install-path>')
        .description('generate using m3 pipeline')
        .option('--target <target>', 'sig | libace | all', 'sig')
        .option('--original-sdk')
        .action(m3)

    program.command('sdk <sdk-path> <prepared-sdk-12> <prepared-sdk-11>')
        .description('prepares sdk')
        .action(sdk)

    program.parse(argv, { from: 'user' })
}

main(process.argv.slice(2))
