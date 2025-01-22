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

import * as fs from 'fs'
import * as path from 'path'
import { Language } from '@idlize/core'
import { TargetFile } from './peer-generation/printers/TargetFile'

class Install {
    mkdir(path: string): string {
        fs.mkdirSync(path, { recursive: true })
        return path
    }
}

export class ArkoalaInstall extends Install {
    constructor (private outDir: string, private lang: Language, private test: boolean) {
        super()
    }
    langDir(): string {
        switch (this.lang) {
            case Language.TS: return this.tsDir
            case Language.ARKTS: return this.arktsDir
            case Language.JAVA: return this.javaDir
            case Language.CJ: return this.cjDir
            default: throw new Error("unsupported")
        }
    }
    indexDir(): string {
        switch (this.lang) {
            case Language.TS: return this.tsTypesDir
            case Language.ARKTS: return this.arktsTypesDir
            default: return this.langDir()
        }
    }
    createDirs(dirs: string[]) {
        for (const dir of dirs) {
            this.mkdir(dir)
        }
    }
    sig = this.mkdir(this.test ? path.join(this.outDir, "sig") : this.outDir)

    tsDir = this.mkdir(path.join(this.sig, "arkoala/arkui/src/"))
    tsTypesDir = this.mkdir(path.join(this.sig, `arkoala/arkui-types/`))
    arktsDir = this.mkdir(path.join(this.sig, "arkoala-arkts/arkui/src/generated/"))
    arktsTypesDir = this.mkdir(path.join(this.sig, `arkoala-arkts/arkui/types/`))

    frameworkDir = this.mkdir(path.join(this.sig, "arkoala/framework"))
    tsArkoalaDir = this.mkdir(path.join(this.frameworkDir, "src/generated/"))
    nativeDir = this.mkdir(path.join(this.frameworkDir, "native/src/generated/"))
    javaDir = this.mkdir(path.join(this.frameworkDir, "java/src/"))
    cjDir = this.mkdir(path.join(this.frameworkDir, "cangjie/src/"))
    peer(targetFile: TargetFile): string {
        const peerDir = this.mkdir(path.join(this.langDir(), this.lang === Language.JAVA || this.lang === Language.CJ ? '.' : 'peers'))
        return path.join(peerDir, targetFile.path ?? "", targetFile.name + this.lang.extension)
    }
    component(targetFile: TargetFile): string {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name)
    }
    builderClass(targetFile: TargetFile): string {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name)
    }
    globalFile(targetFile: TargetFile): string {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name)
    }
    materialized(targetFile: TargetFile): string {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name)
    }
    interface(targetFile: TargetFile): string {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name)
    }
    langLib(targetFile: TargetFile) {
        return path.join(this.langDir(), targetFile.path ?? "", targetFile.name + this.lang.extension)
    }
    tsLib(targetFile: TargetFile) {
        return path.join(this.tsDir, targetFile.path ?? "", targetFile.name + this.lang.extension)
    }
    tsArkoalaLib(targetFile: TargetFile) {
        return path.join(this.tsArkoalaDir, targetFile.path ?? "", targetFile.name + this.lang.extension)
    }
    arktsLib(targetFile: TargetFile) {
        return path.join(this.arktsDir, targetFile.path ?? "", targetFile.name + this.lang.extension)
    }
    javaLib(targetFile: TargetFile) {
        return path.join(this.javaDir, targetFile.path ?? "", targetFile.name + this.lang.extension)
    }
    cjLib(targetFile: TargetFile) {
        return path.join(this.cjDir, targetFile.path ?? "", targetFile.name + this.lang.extension)
    }
    native(targetFile: TargetFile) {
        return path.join(this.nativeDir, targetFile.path ?? "", targetFile.name)
    }
}

export class LibaceInstall extends Install {
    constructor(private outDir: string, private test: boolean) { super() }
    libace = this.mkdir(this.test ? path.join(this.outDir, "libace") : this.outDir)
    implementationDir = this.mkdir(path.join(this.libace, "implementation"))
    generatedInterface = this.mkdir(path.join(this.libace, "generated", "interface"))
    generatedUtility = this.mkdir(path.join(this.libace, "utility", "generated"))
    userConverterHeader = path.join(this.generatedUtility, "converter_generated.h")
    mesonBuild = path.join(this.libace, "meson.build")

    arkoalaMacros = this.interface("arkoala-macros.h")
    generatedArkoalaApi = this.interface("arkoala_api_generated.h")
    gniComponents = this.interface("node_interface.gni")
    viewModelBridge = this.implementation("view_model_bridge.cpp")
    allModifiers = this.implementation("all_modifiers.cpp")
    allEvents = this.implementation("all_events.cpp")

    interface(name: string) {
        return path.join(this.generatedInterface, name)
    }
    implementation(name: string) {
        return path.join(this.implementationDir, name)
    }
    modifierHeader(component: string) {
        return this.interface(`${component}_modifier.h`)
    }
    modifierCpp(component: string) {
        return this.implementation(`${component}_modifier.cpp`)
    }
    accessorCpp(component: string) {
        return this.implementation(`${component}_accessor.cpp`)
    }
    delegateHeader(component: string) {
        return this.interface(`${component}_delegate.h`)
    }
    delegateCpp(component: string) {
        return this.implementation(`${component}_delegate.cpp`)
    }
}
