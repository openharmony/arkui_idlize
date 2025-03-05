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

import * as fs from "fs"
import * as path from "path"
import {
    CoreConfiguration,
    defaultCoreConfuguration,
    generatorConfiguration,
    IDLKind,
    IDLLinterOptions,
    isDefined,
    Language,
} from "@idlizer/core";
import { deepMergeConfig } from "./configMerge";
import { 
    defaultIDLVisitorConfiguration, 
    IDLVisitorConfiguration
} from "./IDLVisitorConfig";

export interface PeerGeneratorConfiguration extends CoreConfiguration {
    readonly GenerateUnused: boolean
    readonly ApiVersion: number
    readonly dumpSerialized: boolean
    readonly boundProperties: Map<string, string[]>

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
    readonly constants: Map<string, string>
    readonly patchMaterialized: Map<string, Record<string, string>>
    readonly CollapseOverloadsARKTS: boolean
    readonly IDLVisitor: IDLVisitorConfiguration
    readonly linter: IDLLinterOptions

    mapComponentName(originalName: string): string
    ignoreEntry(name: string, language: Language): boolean
    ignoreMethod(name: string, language: Language) : boolean
    isHandWritten(component: string): boolean
    isKnownParametrized(name: string | undefined): boolean
    isShouldReplaceThrowingError(name: string) : boolean
    noDummyGeneration(component: string, method?: string) : boolean
}

function isWhole(methods: string[]): boolean {
    return methods.includes("*")
}

export const defaultPeerGeneratorConfiguration: PeerGeneratorConfiguration = {
    ...defaultCoreConfuguration,
    TypePrefix: "Ark_",
    LibraryPrefix: "",
    OptionalPrefix: "Opt_",
    GenerateUnused: false,
    ApiVersion: 9999,
    dumpSerialized: false,
    boundProperties: new Map(),
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
    constants: new Map(),
    patchMaterialized: new Map(),
    CollapseOverloadsARKTS: true,
    linter: {
        validEntryAttributes: new Map([
            [IDLKind.Property, ["Optional", "Accessor", "Deprecated", "CommonMethod", "Protected", "DtsName"]],
            [IDLKind.Interface, ["Predefined", "TSType", "CPPType", "Entity", "Interfaces", "ParentTypeArguments", "Component", "Synthetic", "Deprecated", "HandWrittenImplementation"]],
            [IDLKind.Callback, ["Async", "Synthetic"]],
            [IDLKind.Method, ["Optional", "DtsTag", "DtsName", "Throws", "Deprecated", "IndexSignature", "Protected"]],
            [IDLKind.Callable, ["CallSignature", "Deprecated"]],
            [IDLKind.Typedef, ["Import"]],
            [IDLKind.Enum, ["Deprecated"]],
            [IDLKind.EnumMember, ["OriginalEnumMemberName", "Deprecated"]],
            [IDLKind.Constructor, ["Deprecated", ]]
        ]),
        checkEnumsConsistency: true,
        checkReferencesResolved: true,
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
    IDLVisitor: defaultIDLVisitorConfiguration
}

function parseConfigFile(configurationFile: string): any {
    if (!fs.existsSync(configurationFile)) return undefined

    const data = fs.readFileSync(path.resolve(configurationFile)).toString()
    return JSON.parse(data)
}

export function readConfigFiles(configurationFiles?: string, ignoreDefaultConfig: boolean = false): [string, unknown][] {
    let files = ignoreDefaultConfig ? [] : [
        path.join(__dirname, "..", "generation-config", "config.json"),
        path.join(__dirname, "..", "generation-config", "idl-config.json")
    ] 
    if (configurationFiles) files.push(...configurationFiles.split(","))

    return files.map(file => [file, parseConfigFile(file)])
}

export function parseConfigFiles<T extends object>(defaultConfiguration: T, configurationFiles?: string, ignoreDefaultConfig = false): T {    
    const files = readConfigFiles(configurationFiles, ignoreDefaultConfig)
    let result: T = defaultConfiguration
    files.forEach(([file, nextConfiguration]) => {
        if (nextConfiguration) {
            console.log(`Using options from ${file}`)
            result = deepMergeConfig<T>(result, nextConfiguration)
        } else {
            throw new Error(`file ${file} does not exist or cannot parse`)
        }
    })

    return result
}

export function loadPeerConfiguration(configurationFiles?: string, ignoreDefaultConfig = false): PeerGeneratorConfiguration {
    let config = parseConfigFiles(defaultPeerGeneratorConfiguration, configurationFiles, ignoreDefaultConfig)
    config.IDLVisitor.parsePredefinedIDLFiles()
    return config
}

export function peerGeneratorConfiguration(): PeerGeneratorConfiguration {
    return generatorConfiguration<PeerGeneratorConfiguration>()
}

export function IDLVisitorConfiguration(): IDLVisitorConfiguration {
    return peerGeneratorConfiguration().IDLVisitor
}