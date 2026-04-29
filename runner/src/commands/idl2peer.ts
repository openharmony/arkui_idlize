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

import { libraries as predefs } from "@idlizer/interfaces"
import { GENERATED_PEER_DIR, RESPONSE_FILE_DIR } from "../shared"
import { scan, run } from "../utils"
import { basename, join, parse } from "node:path"
import { writeFileSync } from "node:fs"
import { createResponseFile } from "@idlizer/core"

export interface Idl2PeerConfig {
    target: string
    language: string
    idlPaths: string[]
    optionsFiles?: string[]
}

export interface Idl2PeerArkuiConfig extends Idl2PeerConfig {
    arkgen: string
    interopTypes: string
    noDummyImpl?: boolean
}

export interface Idl2PeerOhosConfig {
    target: string
    language: string
    idlPath: string
    optionsFile?: string
    ohosgen: string
}

export interface Idl2PeerResult {
    peersPath: string
}

export function idl2peer({
    arkgen,
    target,
    language,
    idlPaths,
    optionsFiles,
    interopTypes,
    noDummyImpl,
}: Idl2PeerArkuiConfig): Idl2PeerResult {
    const idlFiles = idlPaths.flatMap(scan)

    let arkgenTarget = ''
    if (target === 'sig') {
        arkgenTarget = 'arkoala'
    }
    if (target === 'libace') {
        arkgenTarget = 'libace'
    }
    if (target === 'all') {
        arkgenTarget = 'all'
    }

    // Create response file to avoid passing huge file list to exec
    const responseFile = createResponseFile(idlFiles, RESPONSE_FILE_DIR)

    run(context => context.exec([
        arkgen,
        '--idl2peer',
        ['--reference-names', 'ets'],
        ['--input-files', `@${responseFile}`],
        ['--output-dir', GENERATED_PEER_DIR],
        ['--generator-target', arkgenTarget],
        ['--language', language],
        '--only-integrated',
        '--use-memo-m3',
        '--no-component-named-overloads',
        '--no-implicit-predefined',
        ['--arkts-extension', '.ets'],
        optionsFiles ? ['--options-file', optionsFiles] : [],
        optionsFiles ? ['--ignore-default-config'] : [],
        ['--interop-types', interopTypes],
        noDummyImpl ? ['--no-arkgen-dummy-impl'] : [],
    ]))
    return {
        peersPath: GENERATED_PEER_DIR
    }
}

export function idl2ohos({
    ohosgen,
    language,
    idlPath,
    optionsFile,
}: Idl2PeerOhosConfig): Idl2PeerResult {
    const idlFiles = [
        ...scan(idlPath),
        ...scan(predefs.arkuiExtra)
    ]

    // Create response file to avoid passing huge file list to exec
    const responseFile = createResponseFile(idlFiles, RESPONSE_FILE_DIR)

    run(context => context.exec([
        ohosgen,
        '--idl2peer',
        ['--input-files', `@${responseFile}`],
        ['--output-dir', GENERATED_PEER_DIR],
        ['--language', language],
        ['--arkts-extension', '.ets'],
        optionsFile ? ['--options-file', optionsFile] : [],
    ]))
    writeArktsConfig()
    return {
        peersPath: GENERATED_PEER_DIR
    }
}

function writeArktsConfig() {
    const generatedArkts = './generated/arkts'
    const generatedArktsDir = join(GENERATED_PEER_DIR, generatedArkts)
    const arktsconfig: any = {
        'compilerOptions': {
            'baseUrl': generatedArkts,
            'outDir': './build/panda',
            'paths': {
                '@koalaui/interop': ['../../../../../external/interop/src/arkts'],
                '@koalaui/common': ['../../../../../external/common/src'],
                '@koalaui/compat': ['../../../../../external/compat/src/arkts'],
                '@koalaui/runtime': ['../../../../../external/incremental/runtime/src']
            }
        },
        'include': [generatedArkts + '/**/*.ets']
    }
    scan(generatedArktsDir)
        .filter(file => basename(file).startsWith('@'))
        .forEach(file => {
            const pkg = parse(file).name
            arktsconfig['compilerOptions']['paths'][pkg] = [join(generatedArktsDir, pkg)]
        })
    writeFileSync(
        join(GENERATED_PEER_DIR, 'arktsconfig.json'),
        JSON.stringify(arktsconfig, undefined, 4),
        'utf-8'
    )
}
