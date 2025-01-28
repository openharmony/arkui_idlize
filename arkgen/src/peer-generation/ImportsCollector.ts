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

import { posix as path } from "path"
import { getOrPut, renameDtsToPeer, Language } from "@idlizer/core"
import { LanguageWriter } from "@idlizer/core";

export class ImportsCollector {
    private readonly moduleToFeatures: Map<string, Set<string>> = new Map()

    /**
     * @param feature Feature to be imported from @module
     * @param module Module name - can be package started with `@` or relative path from current package root
     */
    addFeature(feature: ImportFeature): void
    addFeature(feature: string, module: string): void
    addFeature(feature: string | ImportFeature, module?: string) {
        if (typeof feature != "string")
            return this.addFeature(feature.feature, feature.module)
        module = path.normalize(module!)
        // Checking for name collisions between modules
        // TODO: needs to be done more effectively
        const featureInAnotherModule = [...this.moduleToFeatures.entries()]
            .find(it => it[0] !== module && it[1].has(feature))
        if (featureInAnotherModule) {
            console.warn(`WARNING: Skip feature:'${feature}' is already imported into '${featureInAnotherModule[0]}'`)
        } else {
            const dependencies = getOrPut(this.moduleToFeatures, module, () => new Set())
            dependencies.add(feature)
        }
    }

    addFeatures(features: string[], module: string) {
        for (const feature of features)
            this.addFeature(feature, module)
    }

    merge(other: ImportsCollector) {
        for (const [module, features] of other.moduleToFeatures) {
            const dst = getOrPut(this.moduleToFeatures, module, () => new Set())
            for (const feature of features) {
                dst.add(feature)
            }
        }
    }

    clear() {
        this.moduleToFeatures.clear()
    }

    print(printer: LanguageWriter, currentModule: string) {
        this.printToLines(currentModule).forEach(it => printer.print(it))
    }

    printToLines(currentModule: string): string[] {
        const lines = new Array<string>()
        const currentModuleDir = path.dirname(currentModule)
        this.moduleToFeatures.forEach((features, module) => {
            if (!module.startsWith('@') && !module.startsWith('#')) {
                if (path.relative(currentModule, module) === "")
                    return
                module = `./${path.relative(currentModuleDir, module)}`
            }
            lines.push(`import { ${Array.from(features).join(', ')} } from "${module}"`)
        })
        return lines
    }
}

export type ImportFeature = { feature: string, module: string }

export function convertPeerFilenameToModule(filename: string) {
    const basename = renameDtsToPeer(path.basename(filename.replaceAll('\\', '/')), Language.TS, false)
    return `./peers/${basename}`
}