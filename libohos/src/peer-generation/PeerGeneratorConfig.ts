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

import {
    Language,
    isDefined,
    generatorConfiguration
} from '@idlizer/core'
import {
    DefaultConfiguration,
    parseConfigFiles
} from "../DefaultConfiguration"

export interface PeerGeneratorConfiguration extends DefaultConfiguration {
    cppPrefix: string
    ignoreComponents: string[]
    ignorePeerMethod: string[]
    invalidAttributes: string[]
    customNodeTypes: string[]
    ignoreSerialization: string[]
    ignoreReturnTypes: string[]

    mapComponentName(originalName: string): string 
    ignoreEntry(name: string, language: Language): boolean
    ignoreMethod(name: string, language: Language) : boolean
    isMaterializedIgnored(name: string): boolean
    isHandWritten(component: string): boolean
    isKnownParametrized(name: string | undefined): boolean
    isShouldReplaceThrowingError(name: string) : boolean
    noDummyGeneration(component: string, method?: string) : boolean
}

export class PeerGeneratorConfigurationImpl extends DefaultConfiguration implements PeerGeneratorConfiguration {
    constructor(data: Record<string, any> = {}) {
        super(data)  
    }

    get cppPrefix(): string { return this.paramByKeys<string>("native", "cppPrefix") }
    get ignoreComponents(): string[] { return this.paramByKeys<string[]>("components", "ignoreComponents") }
    get ignorePeerMethod(): string[] { return this.paramByKeys<string[]>("components", "ignorePeerMethod") }
    get invalidAttributes(): string[] { return this.paramByKeys<string[]>("components", "invalidAttributes") }
    get customNodeTypes(): string[] { return this.paramByKeys<string[]>("components", "customTypes") }
    get ignoreSerialization(): string[] { return this.paramByKeys<string[]>("serializer", "ignore") }
    get ignoreReturnTypes(): string[] { return this.paramByKeys<string[]>("materialized", "ignoredReturnTypes") }

    private paramByKeys<T>(...keys: string[]): T {
        let result = this.params
        for (const key of keys) {
            if (key in result) {
                result = result[key]
            } else {
                throw new Error(`${key} is unknown (keys: ${keys})`)
            }
        }
        return result as T
    }

    mapComponentName(originalName: string): string {
        if (originalName.endsWith("Attribute"))
            return originalName.substring(0, originalName.length - 9)
        return originalName
    }
    ignoreEntry(name: string, language: Language): boolean {
        return this.paramByKeys<string[]>("components", "ignoreEntry").includes(name) ||
            language === Language.JAVA && this.paramByKeys<string[]>("components", "ignoreEntryJava").concat(this.paramByKeys<string[]>("components", "custom")).includes(name)
    }
    ignoreMethod(name: string, language: Language): boolean {
        return language === Language.ARKTS && this.paramByKeys<string[]>("components", "ignoreMethodArkts").includes(name)
    }
    isMaterializedIgnored(name: string): boolean {
        for (const ignore of this.ignoreMaterialized) {
            if (name.endsWith(ignore)) return true
        }
        return false
    }
    isHandWritten(component: string): boolean {
        return this.paramByKeys<string[]>("components", "handWritten").concat(this.paramByKeys<string[]>("components", "custom")).includes(component)
    }
    isKnownParametrized(name: string | undefined): boolean {
        return name != undefined && this.parameterized.includes(name)
    }
    isShouldReplaceThrowingError(name: string): boolean {
        for (const ignore of this.paramByKeys<string[]>("components", "replaceThrowErrorReturn")) {
            if (name.endsWith(ignore)) return true
        }
        return false
    }
    noDummyGeneration(component: string, method: string = ""): boolean {
        const ignoreMethods = new Map<string, string[]>(Object.entries(
            this.paramByKeys<Record<string, any>>("dummy", "ignoreMethods")
        )).get(component)
        if (!isDefined(ignoreMethods)) return false
        if (this.isWhole(ignoreMethods)) return true
        if (ignoreMethods.includes(method)) return true

        return false
    }
    private isWhole(methods: string[]): boolean {
        return methods.includes("*")
    }
}

export function loadPeerConfiguration(configurationFiles?: string, overrideConfigurationFiles?: string): PeerGeneratorConfigurationImpl {
    return new PeerGeneratorConfigurationImpl(parseConfigFiles(configurationFiles, overrideConfigurationFiles))
}

export function peerGeneratorConfiguration() {
    return generatorConfiguration() as PeerGeneratorConfigurationImpl
}

