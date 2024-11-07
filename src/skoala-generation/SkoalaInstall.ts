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

import * as path from "path"
import * as fs from "fs"
import { TargetFile } from "../peer-generation/printers/TargetFile"
import { Language } from "../Language"

class Install {
    mkdir(path: string): string {
        fs.mkdirSync(path, { recursive: true })
        return path
    }
}

export class SkoalaInstall extends Install {
    constructor(readonly outDir: string, private test: boolean) {
        super()
    }
    langDir(): string {
        return this.tsDir
    }
    createDirs(dirs: string[]) {
        for (const dir of dirs) {
            this.mkdir(dir)
        }
    }
    sig = this.mkdir(this.test ? path.join(this.outDir, "sig") : this.outDir)
    tsDir = this.mkdir(path.join(this.sig, "./skoala/arkui/src/"))
    frameworkDir = this.mkdir(path.join(this.sig, "./skoala/framework"))
    tsSkoalaDir = this.mkdir(path.join(this.frameworkDir, "./src/generated/"))
    nativeDir = this.mkdir(path.join(this.frameworkDir, "./native/src/generated/"))
    interface(targetFile: TargetFile): string {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name)
    }
    langLib(targetFile: TargetFile) {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name + Language.TS.extension)
    }
    tsLib(targetFile: TargetFile) {
        return path.join(this.tsDir, targetFile.path ?? "", targetFile.name + Language.TS.extension)
    }
    tsSkoalaLib(targetFile: TargetFile) {
        return path.join(this.tsSkoalaDir, targetFile.path ?? "", targetFile.name + Language.TS.extension)
    }
    native(targetFile: TargetFile) {
        return path.join(this.nativeDir, targetFile.path ?? "", targetFile.name)
    }
}