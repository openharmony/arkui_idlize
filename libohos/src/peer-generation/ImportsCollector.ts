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
import { getOrPut, Language, LayoutNodeRole } from "@idlizer/core"
import { LanguageWriter } from "@idlizer/core";

class FeatureInfo {
    aliases: Set<string | undefined> = new Set()
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
        const features = getOrPut(this.moduleToFeatures, normalizedModule, () => new Map<string, FeatureInfo>())
        const info = getOrPut(features, feature, () => new FeatureInfo())
        info.aliases.add(alias)
        info.isDefault = isDefault ?? false
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

    private unfoldAliases(features: Map<string, FeatureInfo>): [string[], string[]] {
        const importedFeatures: string[] = []
        const aliases: string[] = []
        Array.from(features.keys()).forEach(feature => {
            const info = features.get(feature)!
            Array.from(info.aliases).forEach(alias => {
                if (info.isDefault) {
                    importedFeatures.push("default")
                    aliases.push(alias ?? feature)
                    return
                }
                importedFeatures.push(feature)
                aliases.push(alias ?? "")
            })
        })
        return [importedFeatures, aliases]
    }

    print(printer: LanguageWriter, currentModule: string, basePath?: string) {
        const basedModule = basePath ? path.resolve(basePath, currentModule) : currentModule
        const currentModuleDir = path.dirname(basedModule)
        this.moduleToFeatures.forEach((features, module) => {
            if (printer.language === Language.TS || printer.language === Language.ARKTS) {
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
            }
            if (printer.language === Language.KOTLIN) {
                if (currentModule === module) {
                    return
                }
            }
            const [importedFeatures, aliases] = this.unfoldAliases(features)
            printer.writeImports(module, importedFeatures, aliases)
        })
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
