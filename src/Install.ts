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
import { Language } from './util'
import { ARKOALA_PACKAGE_PATH, INTEROP_PACKAGE_PATH } from './lang/java'

class Install {
    mkdir(path: string): string {
        fs.mkdirSync(path, { recursive: true })
        return path
    }
}

export class ArkoalaInstall extends Install {
    constructor (private outDir: string, private lang: Language, private test: boolean) {
        super()
        if (lang == Language.JAVA) {
            this.mkdir(path.join(this.javaDir, ARKOALA_PACKAGE_PATH))
            this.mkdir(path.join(this.javaDir, INTEROP_PACKAGE_PATH))
        }
    }
    langDir(): string {
        switch (this.lang) {
            case Language.TS: return this.tsDir
            case Language.ARKTS: return this.arktsDir
            case Language.JAVA: return this.javaDir
            default: throw new Error("unsupported")
        }
    }
    koala = this.mkdir(this.test ? path.join(this.outDir, "koalaui") : this.outDir)
    tsDir = this.mkdir(path.join(this.koala, "arkoala-arkui/src/"))
    tsArkoalaDir = this.mkdir(path.join(this.koala, "arkoala/src/generated/"))
    arktsDir = this.mkdir(path.join(this.koala, "arkoala-arkui/arkts/src/"))
    nativeDir = this.mkdir(path.join(this.koala, "arkoala/native/src/generated/"))
    javaDir = this.mkdir(path.join(this.koala, "arkoala/java/src/"))
    peer(name: string): string {
        return path.join(this.langDir(), name)
    }
    component(name: string): string {
        return path.join(this.langDir(), name)
    }
    builderClass(name: string): string {
        return path.join(this.langDir(), name)
    }
    materialized(name: string): string {
        return path.join(this.langDir(), name)
    }
    interface(name: string): string {
        return path.join(this.langDir(), name)
    }
    langLib(name: string) {
        return path.join(this.langDir(), name + this.lang.extension)
    }
    tsLib(name: string) {
        return path.join(this.tsDir, name + this.lang.extension)
    }
    tsArkoalaLib(name: string) {
        return path.join(this.tsArkoalaDir, name + this.lang.extension)
    }
    arktsLib(name: string) {
        return path.join(this.arktsDir, name + this.lang.extension)
    }
    javaLib(packagePath: string, name: string) {
        return path.join(this.javaDir, packagePath, name + this.lang.extension)
    }
    native(name: string) {
        return path.join(this.nativeDir, name)
    }
}

export class LibaceInstall extends Install {
    constructor(private outDir: string, private test: boolean) { super() }
    libace = this.mkdir(this.test ? path.join(this.outDir, "libace") : this.outDir)
    implementationDir = this.mkdir(path.join(this.libace, "implementation"))
    generatedInterface = this.mkdir(path.join(this.libace, "generated", "interface"))
    generatedUtility = this.mkdir(path.join(this.libace, "utility", "generated"))
    userConvertors = path.join(this.generatedUtility, "convertors_generated.h")
    mesonBuild = path.join(this.libace, "meson.build")

    arkoalaMacros = this.interface("arkoala-macros.h")
    generatedArkoalaApi = this.interface("arkoala_api_generated.h")
    gniComponents = this.interface("node_interface.gni")
    viewModelBridge = this.implementation("view_model_bridge.cpp")
    allModifiers = this.implementation("all_modifiers.cpp")

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
    delegateHeader(component: string) {
        return this.interface(`${component}_delegate.h`)
    }
    delegateCpp(component: string) {
        return this.implementation(`${component}_delegate.cpp`)
    }
}
