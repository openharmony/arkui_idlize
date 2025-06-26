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
import { getOrPut, renameDtsToPeer, Language, IDLNode, LayoutNodeRole, generatorConfiguration } from "@idlizer/core"
import { LanguageWriter } from "@idlizer/core";

export class ImportsCollector {
    private readonly moduleToFeatures: Map<string, Map<string, Set<string | undefined>>> = new Map()

    /**
     * @param feature Feature to be imported from @module
     * @param module Module name - can be package started with `@` or relative path from current package root
     */
    addFeature(feature: ImportFeature): void
    addFeature(feature: string, module: string, alias?: string): void
    addFeature(feature: string | ImportFeature, module?: string, alias?: string) {
        if (typeof feature != "string")
            return this.addFeature(feature.feature, feature.module, feature.alias)
        const isExternalType = generatorConfiguration().externalTypes.has(feature)
        let normalizedModule = isExternalType ? module! : path.normalize(module!)
        // TODO processing cases when there is path to file like `./@ohos.mediaquery` to not recognise it as package.
        // Should migrate to multimodules and then remove this hack
        if (normalizedModule.startsWith('@') && normalizedModule != module)
            normalizedModule = './' + normalizedModule
        // Checking for name collisions between modules
        // TODO: needs to be done more effectively
        const featureInAnotherModule = [...this.moduleToFeatures.entries()]
            .find(it => it[0] !== normalizedModule && it[1].get(feature))
        // TBD: use modules for externa types
        if (featureInAnotherModule && !isExternalType) {
            console.warn(`WARNING: Skip feature:'${feature}' is already imported from '${featureInAnotherModule[0]}'`)
        } else {
            const features = getOrPut(this.moduleToFeatures, normalizedModule, () => new Map())
            const aliases = getOrPut(features, feature, () => new Set())
            aliases.add(alias)
        }
    }

    addFeatures(features: string[], module: string) {
        for (const feature of features)
            this.addFeature(feature, module)
    }

    merge(other: ImportsCollector) {
        for (const [module, features] of other.moduleToFeatures) {
            const dstFeatures = getOrPut(this.moduleToFeatures, module, () => new Map<string, Set<string|undefined>>())
            for (const feature of features) {
                const dstAliases = getOrPut(dstFeatures, feature[0], () => new Set())
                feature[1].forEach(alias => dstAliases.add(alias))
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
            const importNodes = Array.from(features.keys()).flatMap(feature => {
                const aliases = Array.from(features.get(feature)!)
                return aliases.map(alias => {
                    if (!alias) return feature
                    return `${feature} as ${alias}`
                })
            })
            lines.push(`import { ${importNodes.join(', ')} } from "${module}"`)
        })
        return lines
    }

    static resolveRelative(povModule: string, targetModule: string): string | undefined {
        const currentModuleDir = path.dirname(povModule)
        if (path.relative(povModule, targetModule) === "")
            return undefined
        if (!targetModule.startsWith('@') && !targetModule.startsWith('#')) {
            targetModule = `./${path.relative(currentModuleDir, targetModule)}`
        }
        return targetModule
    }
}

export type ImportFeature = { feature: string, alias?: string, module: string }
