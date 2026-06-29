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

import { flat, over, run, scan } from "../utils.js"
import { join } from "node:path"
import { GENERATED_IDL_DIR } from "../shared.js"
import { execSync } from "node:child_process"

export interface Ets2IdlConfig {
    etsgen: string
    sdkPath: string
    optionsFile: string
    arktsConfigPath?: string
    traceStatus?: string
}
export interface Ets2IdlResult {
    idlPaths:string
}
export function ets2idl({
    etsgen,
    sdkPath,
    optionsFile,
    arktsConfigPath,
    traceStatus,
}: Ets2IdlConfig):Ets2IdlResult {
    const sdkApiPath = join(sdkPath, 'api')
    run(context => context.exec([
        etsgen,
        '--ets2idl',
        ['--output-dir', GENERATED_IDL_DIR],
        ['--base-dir', sdkApiPath],
        ['--input-dir', sdkApiPath],
        over(arktsConfigPath, path => ['--ets-config', path]),
        over(traceStatus, st => ['--trace-status', st]),
        ['--ignore-default-config'],
        ['--options-file', optionsFile],
    ]))
    return {
        idlPaths: GENERATED_IDL_DIR
    }
}
