/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import * as fs from "fs"
import * as path from "path"
import { ABSOLUTE_SDK_DIR } from "../shared"
import { transformBuilderFunctions } from "../tools/builderFuncsTransformer"

export interface AbsoluteSdkConfig {
    preparedSdk12: string
}
export interface AbsoluteSdkResult {
    absoluteSdk: string
}

export function absoluteSdk({
    preparedSdk12,
}: AbsoluteSdkConfig): AbsoluteSdkResult {
    preparedSdk12 = path.resolve(preparedSdk12)
    const absolutePreparedSdk12 = ABSOLUTE_SDK_DIR

    fs.mkdirSync(absolutePreparedSdk12, { recursive: true })
    fs.cpSync(path.join(preparedSdk12, "api"), path.join(absolutePreparedSdk12, "api"), { recursive: true })
    fs.rmSync(path.join(absolutePreparedSdk12, "api", "@internal"), { recursive: true, force: true })

    const arktsconfig = {
        "compilerOptions": {
            "package": "api",
            "baseUrl": "./api",
            "outDir": "./build",
            "paths": {} as any
        },
        "include": ["./api/**/*.ets"]
    }
    const apiPath = path.join(absolutePreparedSdk12, "api")
    for (const file of fs.readdirSync(apiPath, { recursive: true, encoding: 'utf-8' })) {
        if (!fs.statSync(path.join(apiPath, file)).isFile() || !file.endsWith('.d.ets')) {
            continue
        }
        const content = fs.readFileSync(path.join(apiPath, file), { encoding: 'utf-8' }).replaceAll(/^(import|export) .* from ['"](.*)['"];?$/gm, (all: string, _: string, from: string): string => {
            if (!from.startsWith('.'))
                return all
            const fromAbsolute = path.join(apiPath, file, '..', from)
            const fromRelatire = path.relative(apiPath, fromAbsolute)
            return all.replace(from, pathToPackage(fromRelatire))
        })
        const fileNoExt = file.substring(0, file.length - ".d.ets".length)
        arktsconfig["compilerOptions"]["paths"][pathToPackage(fileNoExt)] = [path.join(apiPath, file).substring(0, path.join(apiPath, file).length-".d.ets".length)]
        fs.writeFileSync(path.join(apiPath, file), content, { encoding: 'utf-8' })
    }
    fs.writeFileSync(path.join(absolutePreparedSdk12, "arktsconfig.json"), JSON.stringify(arktsconfig, undefined, 4), { encoding: 'utf-8' })
    return {
        absoluteSdk: ABSOLUTE_SDK_DIR
    }
}

function pathToPackage(s: string): string {
    if (path.basename(s).startsWith("@"))
        return path.basename(s)
    return s.replaceAll("/", ".")
}