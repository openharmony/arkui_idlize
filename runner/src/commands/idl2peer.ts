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
import { execSync } from "child_process"
import { GENERATED_PEER_DIR } from "../shared"
import { flat, scan, over, run } from "../utils"

export interface Idl2PeerConfig {
    target: string
    language: string
    idlPath: string
    optionsFile?: string
    trackerStatus?: string
}

export interface Idl2PeerArkuiConfig extends Idl2PeerConfig {
    arkgen: string
}

export interface Idl2PeerOhosConfig extends Idl2PeerConfig {
    ohosgen: string
}

export interface Idl2PeerResult {
    peersPath: string
}

export function idl2peer({
    arkgen,
    target,
    language,
    idlPath,
    optionsFile,
    trackerStatus,
}: Idl2PeerArkuiConfig): Idl2PeerResult {
    const idlFiles = scan(idlPath)

    let arkgenTarget = ''
    if (target === 'sig') {
        arkgenTarget = 'arkoala'
    }
    if (target === 'libace') {
        arkgenTarget = 'libace'
    }
    if (target === 'tracker') {
        arkgenTarget = 'tracker'
    }

    run(context => context.exec([
        arkgen,
        '--idl2peer',
        ['--reference-names', 'ets'],
        ['--input-files', flat(idlFiles).join(",")],
        ['--output-dir', GENERATED_PEER_DIR],
        ['--generator-target', arkgenTarget],
        ['--language', language],
        '--only-integrated',
        '--use-memo-m3',
        ['--arkts-extension', '.ets'],
        optionsFile ? [`--options-file`, optionsFile] : [],
        over(trackerStatus, st => ['--tracker-status', st]),
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
    run(context => context.exec([
        ohosgen,
        '--idl2peer',
        ['--input-files', flat(idlFiles).join(",")],
        ['--output-dir', GENERATED_PEER_DIR],
        ['--language', language],
        ['--arkts-extension', '.ets'],
        optionsFile ? [`--options-file`, optionsFile] : [],
    ]))
    return {
        peersPath: GENERATED_PEER_DIR
    }
}
