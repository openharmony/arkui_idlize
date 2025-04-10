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
import { getOrPut, renameDtsToPeer, Language, IDLNode, LayoutNodeRole } from "@idlizer/core"
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
            console.warn(`WARNING: Skip feature:'${feature}' is already imported from '${featureInAnotherModule[0]}'`)
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

    printToLines(currentModule: string, basePath?: string): string[] {
        const lines = new Array<string>()
        const basedModule = basePath ? path.resolve(basePath, currentModule) : currentModule
        const currentModuleDir = path.dirname(basedModule)
        this.moduleToFeatures.forEach((features, module) => {
            if (path.relative(currentModule, module) === "")
                return
            if (!module.startsWith('@') && !module.startsWith('#')) {
                module = basePath ? path.resolve(basePath, module) : module
                if (path.relative(basedModule, module) === "")
                    return
                module = `./${path.relative(currentModuleDir, module)}`
            }
            lines.push(`import { ${Array.from(features).join(', ')} } from "${module}"`)
        })
        return lines
    }

    getFeatures(): Map<string, Set<string>> {
        return this.moduleToFeatures
    }
}

export type ImportFeature = { feature: string, module: string }
