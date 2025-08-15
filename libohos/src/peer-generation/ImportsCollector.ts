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
import { getOrPut, renameDtsToPeer, Language, IDLNode, LayoutNodeRole, generatorConfiguration, isInCurrentModule } from "@idlizer/core"
import { LanguageWriter } from "@idlizer/core";

class FeatureInfo {
    aliases: Set<string> = new Set()
    isDefault: boolean = false
}

export class ImportsCollector {
    private readonly moduleToFeatures: Map<string, Map<string, FeatureInfo>> = new Map()

    /**
     * @param feature Feature to be imported from @module
     * @param module Module name - can be package started with `@` or relative path from current package root
     */
    addFeature(feature: ImportFeature): void
    addFeature(feature: string, module: string, alias?: string): void
    addFeature(feature: string, module: string, alias?: string, isDefault?: boolean): void
    addFeature(feature: string | ImportFeature, module?: string, alias?: string, isDefault?: boolean) {
        if (typeof feature != "string")
            return this.addFeature(feature.feature, feature.module, feature.alias, feature.isDefault)
        let normalizedModule = path.normalize(module!)
        // TODO processing cases when there is path to file like `./@ohos.mediaquery` to not recognise it as package.
        // Should migrate to multimodules and then remove this hack
        if (normalizedModule.startsWith('@') && normalizedModule != module)
            normalizedModule = './' + normalizedModule
        // Checking for name collisions between modules
        // TODO: needs to be done more effectively
        const featureInAnotherModule = [...this.moduleToFeatures.entries()]
            .find(it => it[0] !== normalizedModule && it[1].get(feature))
        // TBD: use modules for externa types
        if (featureInAnotherModule) {
            console.warn(`WARNING: Skip feature:'${feature}' is already imported from '${featureInAnotherModule[0]}'`)
        } else {
            const features = getOrPut(this.moduleToFeatures, normalizedModule, () => new Map())
            const info = getOrPut(features, feature, () => new FeatureInfo())
            info.aliases.add(alias)
            info.isDefault = isDefault ?? false
        }
    }

    addFeatures(features: string[], module: string) {
        for (const feature of features)
            this.addFeature(feature, module)
    }

    merge(other: ImportsCollector) {
        for (const [module, features] of other.moduleToFeatures) {
            const dstFeatures = getOrPut(this.moduleToFeatures, module, () => new Map<string, FeatureInfo>())
            for (const [feature, info] of features) {
                const dstInfo = getOrPut(dstFeatures, feature, () => new FeatureInfo())
                info.aliases.forEach(alias => dstInfo.aliases.add(alias))
                dstInfo.isDefault = info.isDefault
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
            // The global.resource package belongs top the outer module
            // and its name does not start neither with '@' nor '#'
            // Prefix '^' used for module name as a workaround
            // as the information about the outer module is lost
            if (!module.startsWith('@') && !module.startsWith('#') && !module.startsWith(`^`)) {
                module = basePath ? path.resolve(basePath, module) : module
                if (path.relative(basedModule, module) === "")
                    return
                module = `./${path.relative(currentModuleDir, module)}`
            }
            if (module.startsWith(`^`)) {
                module = module.substring(1)
            }
            const importNodes = Array.from(features.keys()).flatMap(feature => {
                const info = features.get(feature)!
                if (info.isDefault) return `default as ${feature}`
                return Array.from(info.aliases).map(alias => {
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
        // TBD: workaround with '^' prefix for outer modules
        if (!targetModule.startsWith('@') && !targetModule.startsWith('#') && !targetModule.startsWith('^')) {
            targetModule = `./${path.relative(currentModuleDir, targetModule)}`
        }
        if (targetModule.startsWith(`^`)) {
            targetModule = targetModule.substring(1)
        }
        return targetModule
    }
}

export type ImportFeature = { feature: string, alias?: string, module: string,  role?: LayoutNodeRole, isDefault?: boolean }
