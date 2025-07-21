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

import { D, ConfigTypeInfer } from "./configDescriber"
import { capitalize } from "./util"

const T = {
    stringArray: () => D.array(D.string())
}

export const ModuleConfigurationSchema = D.object({
    name: D.string(),
    external: D.maybe(D.boolean()),
    packages: T.stringArray(),
    useFoldersLayout: D.maybe(D.boolean()),
})

export const HookMethodSchema = D.object({
    hookName: D.string(),
    replaceImplementation: D.boolean()
})

export type ModuleConfiguration = ConfigTypeInfer<typeof ModuleConfigurationSchema>

export const CoreConfigurationSchema = D.object({
    TypePrefix: D.string(),
    LibraryPrefix: D.string(),
    OptionalPrefix: D.string(),

    rootComponents: T.stringArray(),
    standaloneComponents: T.stringArray(),
    parameterized: T.stringArray(),
    ignoreMaterialized: T.stringArray(),
    ignoreGenerics: T.stringArray(),
    builderClasses: T.stringArray(),
    forceMaterialized: T.stringArray(),
    forceCallback: D.map(D.string(), T.stringArray()).onMerge('replace'),
    forceResource: T.stringArray(),
    forceContext: T.stringArray(),
    hooks: D.map(D.string(), D.map(D.string(), HookMethodSchema)).onMerge('replace'),
    moduleName: D.string(),
    modules: D.map(D.string(), ModuleConfigurationSchema).onMerge('replace'),
    libraryNameMapping: D.maybe(D.map(D.string(), D.map(D.string(), D.string())).onMerge('replace')),

    globalPackages: T.stringArray()
})

export type CoreConfiguration = ConfigTypeInfer<typeof CoreConfigurationSchema>

export const defaultCoreConfiguration: CoreConfiguration = {
    TypePrefix: "",
    LibraryPrefix: "",
    OptionalPrefix: "",

    rootComponents: [],
    standaloneComponents: [],
    parameterized: [],
    ignoreMaterialized: [],
    ignoreGenerics: [],
    builderClasses: [],
    forceMaterialized: [],
    forceCallback: new Map<string, []>(),
    forceResource: [],
    forceContext: [],
    hooks: new Map<string, Map<string, HookMethod>>(),
    moduleName: "",
    modules: new Map<string, ModuleConfiguration>(),
    libraryNameMapping: new Map<string, Map<string, string>>(),

    globalPackages: []
}

let currentConfig: CoreConfiguration = defaultCoreConfiguration

export function setDefaultConfiguration<T extends CoreConfiguration>(config: T): void {
    currentConfig = config
}

export function patchDefaultConfiguration<T extends CoreConfiguration>(config: Partial<T>): void {
    currentConfig = Object.assign({}, currentConfig, config)
}

export function generatorConfiguration<T extends CoreConfiguration>(): T {
    return currentConfig as T
}

export function generatorTypePrefix() {
    const conf = generatorConfiguration()
    return `${conf.TypePrefix}${conf.LibraryPrefix}`
}

interface HookMethod {
    hookName: string,
    replaceImplementation: boolean
}

export function getHookMethod(className: string, methodName: string): HookMethod | undefined {
    const hookMethods = generatorConfiguration().hooks.get(className)
    if (!hookMethods) return undefined
    const hook = hookMethods.get(methodName)
    if (!hook) return undefined
    const method: HookMethod = {
        hookName: hook.hookName ?? `hook${className}${capitalize(methodName)}`,
        replaceImplementation: hook.replaceImplementation ?? true
    }
    return method
}
