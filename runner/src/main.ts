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
import { GENERATED_IDL_DIR, GENERATED_PEER_DIR, SCRAPER_CONFIG, SCRAPER_CWD, WORKING_DIR } from "./shared"
import { commands } from "./commands"
import { join } from "node:path"
import { transformBuilderFunctions } from "./tools/builderFuncsTransformer"
import { formatArkts } from "./tools/formatArkts"

/////////////////////////////////////////////////

function setup() {
    if (existsSync(WORKING_DIR)) {
        rmSync(WORKING_DIR, { recursive: true })
    }
    mkdirSync(SCRAPER_CWD, { recursive: true })
    mkdirSync(WORKING_DIR, { recursive: true })
    mkdirSync(GENERATED_IDL_DIR, { recursive: true })
    mkdirSync(GENERATED_PEER_DIR, { recursive: true })
}

///

interface M3Options {
    originalSdk?: boolean
    target: string
    language: string
    scraperConfig?: string
}

function m3(sdkPathInput: string, installPath: string, options: M3Options) {
    setup()

    let sdkPath = sdkPathInput
    let configPath: string | undefined = undefined
    if (options.originalSdk) {
        const prepareResult = commands.prepareSdk({ sdkPath, installArktsConfig: true })
        sdkPath = prepareResult.sdkPath12
        configPath = prepareResult.configPath
    }

    const { idlPaths } = commands.ets2idl({ sdkPath, configPath })
    const { scrapedIDLs, arkuiConfig } = commands.scrape({
        idlDirectory: idlPaths,
        configPath: options.scraperConfig ?? SCRAPER_CONFIG,
    })
    const { peersPath } = commands.idl2peer({
        target: options.target,
        language: options.language,
        optionsFile: arkuiConfig,
        idlPath: scrapedIDLs
    })

    if (formatArkts({
        inputDir: peersPath,
        outputDir: undefined,
        inplace: true
    }) < 0) {
        console.error('ERROR: ArkTS formatting failed')
    }

    let installSourceDir = peersPath
    switch (options.target) {
        case 'sig': { installSourceDir = join(installSourceDir, 'sig'); break }
        case 'libace': { installSourceDir = join(installSourceDir, 'libace'); break }
        case 'all': { break }
    }
    commands.install({ sourceDir: installSourceDir, installPath })
}

function tracker(sdkPathInput: string, sdkStatus: string, trackerStatus: string, installPath: string) {
    setup()

    const { idlPaths } = commands.ets2idl({
        sdkPath: sdkPathInput,
        configPath:  undefined,
        traceStatus: sdkStatus,
    })
    const { scrapedIDLs, arkuiConfig } = commands.scrape({
        idlDirectory: idlPaths,
        configPath: SCRAPER_CONFIG,
    })
    const { peersPath } = commands.idl2peer({
        target: 'tracker',
        language: 'arkts',
        optionsFile: arkuiConfig,
        idlPath: scrapedIDLs,
        trackerStatus: trackerStatus
    })
    commands.install({sourceDir: peersPath, installPath})
}

///

function sdk(sdkPathInput: string, installPath12: string, installPath11: string) {
    setup()

    const { sdkPath11, sdkPath12 } = commands.prepareSdk({
        sdkPath: sdkPathInput,
        installArktsConfig: false,
    })
    commands.install({ sourceDir: sdkPath12, installPath: installPath12 })
    commands.install({ sourceDir: sdkPath11, installPath: installPath11 })
}

///
interface AbsoluteSdkOptions {
    originalSdk?: boolean,
}

function sdkM3(preparedSdk12: string, absolutePreparedSdk12: string, options: AbsoluteSdkOptions) {
    if (options.originalSdk) {
        const { sdkPath12 } = commands.prepareSdk({ sdkPath: preparedSdk12, installArktsConfig: false })
        preparedSdk12 = sdkPath12
    }
    const { absoluteSdk } = commands.absoluteSdk({ preparedSdk12 })
    commands.install({ sourceDir: absoluteSdk, installPath: absolutePreparedSdk12 })
}

///

function sdkNewShape(path:string) {
    transformBuilderFunctions(path)
}

/////////////////////////////////////////////////

function main(argv: string[]) {

    const program = new Command()
        .name("@idlizer/runner")

    program.command('m3 <sdk-path> <install-path>')
        .description('generate using m3 pipeline')
        .option('--target <target>', 'sig | libace | all', 'sig')
        .option('--language <language>', 'ts | arkts', 'arkts')
        .option('--original-sdk')
        .action(m3)

    program.command('tracker <sdk-path> <sdk-status> <tracker-status> <out-dir>')
        .description('generate tracker report')
        .action(tracker)

    program.command('m3-sdk <prepared-sdk-12> <absolute-prepared-sdk-12>')
        .description('prepare sdk to link peers against')
        .option('--original-sdk')
        .action(sdkM3)

    program.command('sdk <sdk-path> <prepared-sdk-12> <prepared-sdk-11>')
        .description('prepares sdk')
        .action(sdk)

    program.command('sdk-new-shape <path>')
        .description('creates new sdk')
        .action(sdkNewShape)

    program.parse(argv, { from: 'user' })
}

main(process.argv.slice(2))
