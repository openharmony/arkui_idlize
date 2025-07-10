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

import { arkgen } from "@idlizer/arkgen/app"
import { GENERATED_IDL_DIR, GENERATED_PEER_DIR, REFERENCE_CONFIG_PATH } from "../shared"
import { flat, scan } from "../utils"

export interface Idl2PeerConfig {
    target: string,
    language: string,
}

export function idl2peer({
    target,
    language,
}: Idl2PeerConfig) {
    const idlFiles = scan(GENERATED_IDL_DIR)

    let arkgenTarget = ''
    if (target === 'sig') {
        arkgenTarget = 'arkoala'
    }
    if (target === 'libace') {
        arkgenTarget = 'arkoala'
    }

    arkgen(
        flat([
            '--idl2peer',
            ['--reference-names', REFERENCE_CONFIG_PATH],
            ['--input-files', flat(idlFiles).join(",")],
            ['--output-dir', GENERATED_PEER_DIR],
            ['--generator-target', arkgenTarget],
            ['--language', language],
            '--only-integrated',
            '--use-memo-m3',
            ['--arkts-extension', '.ets']
        ])
    )
}
