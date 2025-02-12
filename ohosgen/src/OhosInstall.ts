/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as fs from 'fs'
import * as path from 'path'
import { Language } from '@idlizer/core'
import { Install, TargetFile } from '@idlizer/libohos'

export class OhosInstall extends Install {
    constructor(private outDir: string, private lang: Language) {
        super()
    }

    targetDir = this.mkdir(path.join(this.outDir, 'generated'))

    support(filePath:string) {
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        return filePath
    }

    managedDir() {
        return this.mkdir(path.join(this.targetDir, this.lang.directory))
    }
    nativeDir() {
        return path.join(this.targetDir, 'native')
    }

    tsTypes(file:TargetFile) {
        return this.support(path.join(this.managedDir(), file.path ?? '', file.name))
    }
    arktsTypes(file:TargetFile) {
        return this.support(path.join(this.managedDir(), file.path ?? '', file.name))
    }

    materialized(file:TargetFile) {
        return this.support(path.join(this.managedDir(), file.path ?? '', file.name))
    }
    peer(file:TargetFile) {
        return this.support(path.join(this.managedDir(), this.lang == Language.CJ ? '' : 'peers', file.path ?? '', file.name + this.lang.extension))
    }
    globalFile(file: TargetFile): string {
        return this.support(path.join(this.managedDir(), file.path ?? '', file.name))
    }

    native(file:TargetFile) {
        return this.support(path.join(this.nativeDir(), file.path ?? '', file.name))
    }
}
