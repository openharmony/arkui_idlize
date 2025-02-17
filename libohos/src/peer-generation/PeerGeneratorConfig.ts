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
    defaultOhosConfiguration,
    OhosBaseConfiguration,
    parseConfigFiles
} from "../DefaultConfiguration"

export interface PeerGeneratorConfiguration extends OhosBaseConfiguration {
    readonly cppPrefix: string
    readonly components: {
        readonly ignoreComponents: string[],
        readonly ignorePeerMethod: string[],
        readonly invalidAttributes: string[],
        readonly customNodeTypes: string[],
        readonly ignoreEntry: string[],
        readonly ignoreEntryJava: string[],
        readonly ignoreMethodArkts: string[],
        readonly custom: string[],
        readonly handWritten: string[],
        readonly replaceThrowErrorReturn: string[],
    }
    readonly dummy: {
        readonly ignoreMethods: Map<string, string[]>
    }
    readonly materialized: {
        readonly ignoreReturnTypes: string[]
    }
    readonly serializer: {
        readonly ignore: string[]
    }

    mapComponentName(originalName: string): string
    ignoreEntry(name: string, language: Language): boolean
    ignoreMethod(name: string, language: Language) : boolean
    isMaterializedIgnored(name: string): boolean
    isHandWritten(component: string): boolean
    isKnownParametrized(name: string | undefined): boolean
    isShouldReplaceThrowingError(name: string) : boolean
    noDummyGeneration(component: string, method?: string) : boolean
}

export const defaultPeerGeneratorConfiguration: PeerGeneratorConfiguration = {
    ...defaultOhosConfiguration,
    cppPrefix: '',
    serializer: {
        ignore: [],
    },
    materialized: {
        ignoreReturnTypes: [],
    },
    components: {
        ignoreComponents: [],
        ignorePeerMethod: [],
        invalidAttributes: [],
        customNodeTypes: [],
        ignoreEntry: [],
        ignoreEntryJava: [],
        ignoreMethodArkts: [],
        custom: [],
        handWritten: [],
        replaceThrowErrorReturn: []
    },
    dummy: {
        ignoreMethods: new Map(),
    },
    mapComponentName(originalName: string): string {
        if (originalName.endsWith("Attribute"))
            return originalName.substring(0, originalName.length - 9)
        return originalName
    },
    ignoreEntry(name: string, language: Language): boolean {
        return this.components.ignoreEntry.includes(name) ||
            language === Language.JAVA && this.components.ignoreEntryJava.concat(this.components.custom).includes(name)
    },
    ignoreMethod(name: string, language: Language): boolean {
        return language === Language.ARKTS && this.components.ignoreMethodArkts.includes(name)
    },
    isMaterializedIgnored(name: string): boolean {
        for (const ignore of this.ignoreMaterialized) {
            if (name.endsWith(ignore)) return true
        }
        return false
    },
    isHandWritten(component: string): boolean {
        return this.components.handWritten.concat(this.components.custom).includes(component)
    },
    isKnownParametrized(name: string | undefined): boolean {
        return name != undefined && this.parameterized.includes(name)
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
}
function isWhole(methods: string[]): boolean {
    return methods.includes("*")
}

export function loadPeerConfiguration(configurationFiles?: string, overrideConfigurationFiles?: string): PeerGeneratorConfiguration {
    return parseConfigFiles(defaultPeerGeneratorConfiguration, configurationFiles, overrideConfigurationFiles)
}

export function peerGeneratorConfiguration(): PeerGeneratorConfiguration {
    return generatorConfiguration<PeerGeneratorConfiguration>()
}

