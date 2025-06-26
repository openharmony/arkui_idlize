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

import { dirname, join, relative } from "node:path"
import { scan } from "../utils"
import { copyFileSync, existsSync, mkdirSync } from "node:fs"

export interface InstallConfig {
    sourceDir: string
    installPath: string
}

export function install({
    sourceDir,
    installPath,
}:InstallConfig) {
    let installSourceDir = sourceDir
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
