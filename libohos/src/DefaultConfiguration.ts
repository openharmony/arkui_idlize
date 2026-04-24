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

import {
    capitalize,
    ConfigTypeInfer,
    CoreConfigurationSchema,
    DefaultIDLLinterOptions,
    generatorConfiguration,
    IDLLinterOptions,
    isDefined,
    Language,
    parseConfigFiles,
} from "@idlizer/core";
import { D } from "@idlizer/core";

const T = {
    stringArray: () => D.array(D.string())
}

export const TransformOnSerializeSchema = D.object({
    from: D.string(),
    to: D.string(),
})

export const HookMethodSchema = D.object({
    hookName: D.string(),
    replaceImplementation: D.boolean()
})

export const PeerGeneratorConfigurationSchema = D.combine(
    CoreConfigurationSchema,
    D.object({
        SupportCallHolder: D.boolean({ default: true }),
        GenerateUnused: D.boolean(),
        ApiVersion: D.number(),
        dumpSerialized: D.boolean(),

        currentModulePackagesPaths: D.maybe(D.array(D.object({ package: D.string(), path: D.string() }))),
        currentModuleExportedPackages: D.maybe(T.stringArray()),
        cppPrefix: D.string(),
        components: D.object({
            ignoreComponents: T.stringArray(),
            ignorePeerMethod: T.stringArray(),
            invalidAttributes: T.stringArray(),
            customNodeTypes: T.stringArray(),
            ignoreEntry: T.stringArray(),
            custom: T.stringArray(),
            handWritten: T.stringArray(),
            replaceThrowErrorReturn: T.stringArray(),
        }),
        dummy: D.object({
            ignoreMethods: D.map(D.string(), T.stringArray())
        }),
        materialized: D.object({
            ignoreReturnTypes: T.stringArray()
        }),
        serializer: D.object({
            ignore: T.stringArray()
        }),
        constants: D.default(
            D.map(D.string(), D.string()),
            new Map()
        ),
        patchMaterialized: D.default(
            D.map(D.string(), D.map(D.string(), D.string())),
            new Map()
        ),
        transformAnnotations: D.default(
            D.map(D.string(), D.string()),
            new Map<string, string>()
        ),
        transformOnSerialize: D.array(TransformOnSerializeSchema),
        ignoreGenerics: T.stringArray(),
        forceContext: T.stringArray(),
        hooks: D.map(D.string(), D.map(D.string(), HookMethodSchema)).onMerge('replace'),
        libraryNameMapping: D.maybe(D.map(D.string(), D.map(D.string(), D.string())).onMerge('replace')),
        handwrittenDeserializers: T.stringArray(),
    })
)

export type PeerGeneratorConfigurationType = ConfigTypeInfer<typeof PeerGeneratorConfigurationSchema>
export type PeerGeneratorConfiguration = PeerGeneratorConfigurationType & PeerGeneratorConfigurationExtension
export interface PeerGeneratorConfigurationExtension {
    ignoreEntry(name: string, language: Language): boolean
    isHandWritten(component: string): boolean
    isResource(name: string | undefined): boolean
    isShouldReplaceThrowingError(name: string): boolean
    noDummyGeneration(component: string, method?: string): boolean

    linter: IDLLinterOptions
}

export function expandPeerGeneratorConfiguration(data: PeerGeneratorConfigurationType): PeerGeneratorConfiguration {
    const config = {
        ...data,
        ignoreEntry(name: string, language: Language): boolean {
            return this.components.ignoreEntry.includes(name)
        },
        isHandWritten(component: string): boolean {
            return this.components.handWritten.concat(this.components.custom).includes(component)
        },
        isResource(name: string | undefined): boolean {
            return name != undefined && this.forceResource.includes(name)
        },
        isShouldReplaceThrowingError(name: string): boolean {
            for (const ignore of this.components.replaceThrowErrorReturn) {
                if (name.endsWith(ignore)) return true
            }
            return false
        },
        noDummyGeneration(component: string, method?: string): boolean {
            const ignoreMethods = this.dummy.ignoreMethods.get(component)
            if (!isDefined(ignoreMethods)) return false
            if (isWhole(ignoreMethods)) return true
            if (method && ignoreMethods.includes(method)) return true
            return false
        },

        linter: DefaultIDLLinterOptions
    }
    return config
}

function isWhole(methods: string[]): boolean {
    return methods.includes("*")
}

export function loadPeerConfiguration(configurationFiles: string[]): PeerGeneratorConfiguration {
    return expandPeerGeneratorConfiguration(parseConfigFiles(PeerGeneratorConfigurationSchema, configurationFiles))
}

export function peerGeneratorConfiguration(): PeerGeneratorConfiguration {
    return generatorConfiguration<PeerGeneratorConfiguration>()
}

interface HookMethod {
    hookName: string,
    replaceImplementation: boolean
}

export function getHookMethod(className: string, methodName: string): HookMethod | undefined {
    const hookMethods = peerGeneratorConfiguration().hooks.get(className)
    if (!hookMethods) return undefined
    const hook = hookMethods.get(methodName)
    if (!hook) return undefined
    const method: HookMethod = {
        hookName: hook.hookName ?? `hook${className}${capitalize(methodName)}`,
        replaceImplementation: hook.replaceImplementation ?? true
    }
    return method
}
