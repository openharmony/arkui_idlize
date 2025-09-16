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

import { etsgen } from "@idlizer/etsgen"
import { flat, over, scan } from "../utils"
import { join } from "node:path"
import { ADDITIONAL_FILES, GENERATED_IDL_DIR } from "../shared"

export interface Ets2IdlConfig {
    sdkPath: string
    configPath: string | undefined
}
export interface Ets2IdlResult {
    idlPaths:string
}
export function ets2idl({
    sdkPath,
    configPath
}: Ets2IdlConfig):Ets2IdlResult {
    const sdkApiPath = join(sdkPath, 'api')
    const files = scan(sdkApiPath).filter(it => it.endsWith(".d.ets"))
    etsgen(
        flat([
            '--ets2idl',
            ['--output-dir', GENERATED_IDL_DIR],
            ['--base-dir', sdkApiPath],
            ['--input-files', files],
            over(configPath, path => ['--ets-config', path])
        ])
    )
    return {
        idlPaths: GENERATED_IDL_DIR
    }
}
