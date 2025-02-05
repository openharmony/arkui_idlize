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
    deepMergeConfig,
    warn
} from '@idlizer/core'

import * as fs from "fs"
import * as path from "path"

export interface CoreGeneratorConfiguration {
    get components(): {
        [key: string]: {}
    }
    get materialized(): {
        [key: string]: {}
    }
    get interfaces(): {
        [key: string]: {}
    }
    get native(): {
        [key: string]: {}
    }
    get serializer(): {
        [key: string]: {}
    }
    get dummy(): {
        [key: string]: {}
    }
}

export const defaultCoreGeneratorConfiguration: CoreGeneratorConfiguration = {
    "components": {
        "custom": [],
        "handWritten": [],
        "ignore": [],
        "ignoreJava": [],
        "parameterized": [],
        "inheritanceRole": {
            "rootComponents": [],
            "standaloneComponents": []
        }
    },
    "materialized": {
        "ignore": [],
    },
    "interfaces": {
        "needInterfaces": true
    },
    "native": {
        "cppPrefix": "GENERATED_"
    },
    "serializer": {
        "ignore": []
    },
    "dummy": {
        "ignoreMethods": {
            "LazyForEachOps": ["*"],
            "CommonMethod": ["onClick"]
        }
    }
}

export function loadConfigurationFromFile(configurationFile: string): CoreGeneratorConfiguration | undefined {
    if (!fs.existsSync(configurationFile)) return undefined

    const data = fs.readFileSync(path.resolve(configurationFile)).toString()
    return JSON.parse(data) as CoreGeneratorConfiguration
}

export function loadConfiguration(configurationFiles?: string): CoreGeneratorConfiguration {
    let files = [path.join(__dirname, "..", "generation-config", "config.json")]
    if (configurationFiles) files.concat(configurationFiles.split(","))

    let configuration = defaultCoreGeneratorConfiguration
    files.forEach(file => {
        const nextConfiguration = loadConfigurationFromFile(file)
        if (nextConfiguration) {
            console.log(`Using options from ${file}`)
            configuration = deepMergeConfig(configuration, nextConfiguration)
        }
    })
    return configuration
}

export class PeerGeneratorConfigImpl implements CoreGeneratorConfiguration {
    readonly components: Record<string, any>
    readonly materialized: Record<string, any>
    readonly interfaces: Record<string, any>
    readonly native: Record<string, any>
    readonly serializer: Record<string, any>
    readonly dummy: Record<string, any>
    constructor(private data: CoreGeneratorConfiguration) {

        this.components = this.data?.components
        this.materialized = this.data?.materialized
        this.interfaces = this.data?.interfaces
        this.native = this.data?.native
        this.serializer = this.data?.serializer
        this.dummy = this.data?.dummy


        // components
        if (this.components?.["custom"]) {
            this.customComponents = Object.values(this.components["custom"])
        }
        if (this.components?.["customTypes"]) {
            this.customNodeTypes = Object.values(this.components["customTypes"])
        }
        if (this.components?.["handWritten"]) {
            this.handWritten = Object.values(this.components["handWritten"])
        }
        if (this.components?.["ignoreEntry"]) {
            this.ignoredEntriesCommon = Object.values(this.components["ignoreEntry"])
        }
        if (this.components?.["ignoreEntryJava"]) {
            this.ignoredEntriesJava = Object.values(this.components["ignoreEntryJava"])
        }
        if (this.components?.["ignoreComponents"]) {
            this.ignoreComponents = Object.values(this.components["ignoreComponents"])
        }
        if (this.components?.["ignorePeerMethod"]) {
            this.ignorePeerMethod = Object.values(this.components["ignorePeerMethod"])
        }
        if (this.components?.["ignoreMethodArkts"]) {
            this.ignoreMethodArkts = Object.values(this.components["ignoreMethodArkts"])
        }
        if (this.components?.["invalidAttributes"]) {
            this.invalidAttributes = Object.values(this.components["invalidAttributes"])
        }
        if (this.components?.["replaceThrowErrorReturn"]) {
            this.replaceThrowErrorReturn = Object.values(this.components["replaceThrowErrorReturn"])
        }
        if (this.components?.["parameterized"]) {
            this.knownParameterized = Object.values(this.components["parameterized"])
        }
        if (this.components?.["builderClasses"]) {
            this.builderClasses = Object.values(this.components["builderClasses"])
        }
        if (this.components?.["inheritanceRole"]) {
            const inheritanceRole = new Map<string, string[]>(Object.entries(this.components["inheritanceRole"]))
            this.rootComponents = inheritanceRole.get("rootComponents") ?? []
            this.standaloneComponents = inheritanceRole.get("standaloneComponents") ?? []
        }
        if (this.components?.["boundProperties"]) {
            this.boundProperties = new Map<string, string[]>(Object.entries(this.components["boundProperties"]))
        }

        // materialized
        if (this.materialized?.["ignoredSuffixes"]) {
            this.ignoreMaterialized = Object.values(this.materialized["ignoredSuffixes"])
        }
        if (this.materialized?.["ignoredReturnTypes"]) {
            this.ignoreReturnTypes = Object.values(this.materialized["ignoredReturnTypes"])
        }

        // interfaces
        if (this.interfaces?.["needInterfaces"]) {
            this.needInterfaces = this.interfaces["needInterfaces"] as boolean
        }

        // native
        if (this.native?.["cppPrefix"]) {
            this.cppPrefix = this.native["cppPrefix"] as string
        }

        // serializer
        if (this.serializer?.["ignore"]) {
            this.ignoreSerialization = Object.values(this.serializer["ignore"])
        }

        // dummy
        if (this.dummy?.["ignoreMethods"]) {
            this.noDummyComponents = new Map<string, string[]>(Object.entries(this.dummy["ignoreMethods"]))
        }
    }

    mapComponentName(originalName: string): string {
        if (originalName.endsWith("Attribute"))
            return originalName.substring(0, originalName.length - 9)
        return originalName
    }

    ignoreEntry(name: string, language: Language) {
        return this.ignoredEntriesCommon.includes(name) ||
            language === Language.JAVA && this.ignoredEntriesJava.concat(this.customComponents).includes(name)
    }

    ignoreMethod(name: string, language: Language) {
        return language === Language.ARKTS && this.ignoreMethodArkts.includes(name)
    }

    isMaterializedIgnored(name: string): boolean {
        for (const ignore of this.ignoreMaterialized) {
            if (name.endsWith(ignore)) return true
        }
        return false
    }

    isHandWritten(component: string) {
        return this.handWritten.concat(this.customComponents).includes(component)
    }

    isKnownParametrized(name: string | undefined): boolean {
        return name != undefined && this.knownParameterized.includes(name)
    }

    isShouldReplaceThrowingError(name: string) {
        for (const ignore of this.replaceThrowErrorReturn) {
            if (name.endsWith(ignore)) return true
        }
        return false
    }

    noDummyGeneration(component: string, method = "") {
        const ignoreMethods = this.noDummyComponents.get(component)
        if (!isDefined(ignoreMethods)) return false
        if (this.isWhole(ignoreMethods)) return true
        if (ignoreMethods.includes(method)) return true

        return false
    }

    private isWhole(methods: string[]): boolean {
        return methods.includes("*")
    }

    readonly cppPrefix: string = "GENERATED_"
    public needInterfaces: boolean = true
    private ignoredEntriesCommon: string[] = []
    private ignoredEntriesJava: string[] = []
    readonly ignoreComponents: string[] = []
    readonly ignorePeerMethod: string[] = []
    private ignoreMethodArkts: string[] = []
    readonly invalidAttributes: string[] = []
    private replaceThrowErrorReturn: string[] = []
    readonly ignoreSerialization: string[] = []
    private customComponents: string[] = []
    readonly customNodeTypes: string[] = []
    private handWritten: string[] = []
    readonly builderClasses: string[] = []
    readonly knownParameterized: string[] = []
    readonly rootComponents: string[] = []
    readonly standaloneComponents: string[] = []
    readonly boundProperties: Map<string, string[]> = new Map()
    readonly ignoreMaterialized: string[] = []
    readonly ignoreReturnTypes: string[] = []
    private noDummyComponents: Map<string, string[]> = new Map()
}

export let PeerGeneratorConfig = new PeerGeneratorConfigImpl(defaultCoreGeneratorConfiguration)

export function setFileGeneratorConfiguration(config: CoreGeneratorConfiguration) {
    PeerGeneratorConfig = new PeerGeneratorConfigImpl(config)
}

