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
import { join, resolve } from "node:path"
import { transformBuilderFunctions } from "./tools/builderFuncsTransformer"
import { formatArkts } from "./tools/formatArkts"
import { Ets2IdlResult } from "./commands/ets2idl"

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

interface PrepareSdkOptions {
    etsgen: string
    sdkStage: string
}

interface ArkgenOptions extends PrepareSdkOptions {
    output: string
    arkgen: string
    target: string
    language: string
    scraperConfig?: string
    arkgenOptionsFile: string
}

function sdk2idl(sdkPath: string, options: PrepareSdkOptions): Ets2IdlResult {
    let configPath: string | undefined = undefined
    let idlPaths = sdkPath
    switch (options.sdkStage) {
        case "original": {
            const prepareResult = commands.prepareSdk({ sdkPath, installArktsConfig: true })
            sdkPath = prepareResult.sdkPath12
            configPath = prepareResult.configPath
        }
        case "prepared": {
            idlPaths = commands.ets2idl({
                etsgen: options.etsgen,
                sdkPath,
                configPath,
            }).idlPaths
        }
        case "idl": {
            break;
        }
        default: {
            throw new Error(`Unexpected --sdk-stage value ${options.sdkStage}`)
        }
    }
    return { idlPaths }
}

function m3(sdkPath: string, idlFiles: string[], options: ArkgenOptions) {
    setup()
    const { idlPaths } = sdk2idl(sdkPath, options)
    const { scrapedIDLs, arkuiConfig } = commands.scrape({
        idlDirectory: idlPaths,
        extraIdlPaths: idlFiles,
        configPath: options.scraperConfig ?? SCRAPER_CONFIG,
    })
    const { peersPath } = commands.idl2peer({
        arkgen: options.arkgen,
        target: options.target,
        language: options.language,
        optionsFile: [options.arkgenOptionsFile, arkuiConfig],
        idlPath: scrapedIDLs,
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
    commands.install({ sourceDir: installSourceDir, installPath: options.output })
}

interface OhosgenOptions extends PrepareSdkOptions {
    ohosgen: string
    ohosgenConfig: string
    target: string
    language: string
    scraperConfig?: string
}

function complete(sdkPath: string, options: OhosgenOptions) {
    setup()
    const { idlPaths } = sdk2idl(sdkPath, options)
    commands.idl2ohos({
        ohosgen: options.ohosgen,
        target: options.target,
        language: options.language,
        optionsFile: [resolve(options.ohosgenConfig)],
        idlPath: idlPaths
    })
}

interface TrackerOptions {
    sdkStatus: string
    trackerStatus: string
    arkgenOptionsFile: string
    arkgen: string
    etsgen: string
    output: string
}

function tracker(sdkPathInput: string, idlFiles: string[], options: TrackerOptions) {
    setup()

    const { idlPaths } = commands.ets2idl({
        etsgen: options.etsgen,
        sdkPath: sdkPathInput,
        configPath:  undefined,
        traceStatus: options.sdkStatus,
    })
    const { scrapedIDLs, arkuiConfig } = commands.scrape({
        idlDirectory: idlPaths,
        extraIdlPaths: idlFiles,
        configPath: SCRAPER_CONFIG,
    })
    const { peersPath } = commands.idl2peer({
        arkgen: options.arkgen,
        target: 'tracker',
        language: 'arkts',
        optionsFile: [options.arkgenOptionsFile, arkuiConfig],
        idlPath: scrapedIDLs,
        trackerStatus: options.trackerStatus,
    })
    commands.install({sourceDir: peersPath, installPath: options.output})
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

    program.command('m3 <sdk-path> <idl-files...>')
        .description('generate using m3 pipeline')
        .requiredOption('--output <path>', 'path to output files')
        .requiredOption('--sdk-stage <stage>', 'original | prepared | idl')
        .requiredOption('--arkgen-options-file <file>', 'arkgen config file')
        .option('--etsgen <executable>', 'etsgen executable. Not used if --sdk-stage=idl', 'npx etsgen')
        .option('--arkgen <executable>', 'arkgen executable', 'npx arkgen')
        .option('--target <target>', 'sig | libace | all', 'sig')
        .option('--language <language>', 'ts | arkts', 'arkts')
        .action(m3)

    program.command('complete <sdk-path>')
        .description('generate peers from complete sdk')
        .requiredOption('--ohosgen-config <config-file>', 'Path to configuration file for ohosgen')
        .requiredOption('--sdk-stage <stage>', 'original | prepared | idl')
        .option('--etsgen <executable>', 'etsgen executable. Not used if --sdk-stage=idl', 'npx etsgen')
        .option('--ohosgen <executable>', 'ohosgen executable', 'npx ohosgen')
        .option('--target <target>', 'sig | libace | all', 'sig')
        .option('--language <language>', 'ts | arkts', 'arkts')
        .action(complete)

    program.command('tracker <sdk-path> <idl-files...>')
        .description('generate tracker report')
        .requiredOption('--sdk-status <file>', 'sdk status')
        .requiredOption('--tracker-status <file>', 'tracker status')
        .requiredOption('--output <path>', 'path to out dir')
        .requiredOption('--arkgen-options-file <file>', 'arkgen config file')
        .option('--etsgen <executable>', 'etsgen executable', 'npx etsgen')
        .option('--arkgen <executable>', 'arkgen executable', 'npx arkgen')
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
