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
    ConfigSchema,
    ConfigTypeInfer,
    CoreConfigurationSchema,
    generatorConfiguration,
    IDLKind,
    IDLLinterOptions,
    isDefined,
    Language,
} from "@idlizer/core";
import { mergeJSONs } from "./configMerge";
import { D } from "@idlizer/core";
import { IDLVisitorConfiguration, IDLVisitorConfigurationSchema, expandIDLVisitorConfig } from "./IDLVisitorConfig";

const T = {
    stringArray: () => D.array(D.string())
}

export const PeerGeneratorConfigurationSchema = D.combine(
    CoreConfigurationSchema,
    D.object({
        GenerateUnused: D.boolean(),
        ApiVersion: D.number(),
        dumpSerialized: D.boolean(),
        boundProperties: D.map(D.string(), T.stringArray()),

        cppPrefix: D.string(),
        components: D.object({
            ignoreComponents: T.stringArray(),
            ignorePeerMethod: T.stringArray(),
            invalidAttributes: T.stringArray(),
            customNodeTypes: T.stringArray(),
            ignoreEntry: T.stringArray(),
            ignoreEntryJava: T.stringArray(),
            ignoreMethodArkts: T.stringArray(),
            custom: T.stringArray(),
            handWritten: T.stringArray(),
            replaceThrowErrorReturn: T.stringArray(),
        }),
        dummy: D.object({
            ignoreMethods: D.map(D.string(), T.stringArray())
        }),
        materialized: D.object({
            ignoreReturnTypes: T.stringArray(),
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
        CollapseOverloadsARKTS: D.boolean(),
        IDLVisitor: IDLVisitorConfigurationSchema,
    })
)

export type PeerGeneratorConfigurationType = ConfigTypeInfer<typeof PeerGeneratorConfigurationSchema>
export type PeerGeneratorConfiguration = PeerGeneratorConfigurationType & PeerGeneratorConfigurationExtension
export interface PeerGeneratorConfigurationExtension {
    mapComponentName(originalName: string): string
    ignoreEntry(name: string, language: Language): boolean
    ignoreMethod(name: string, language: Language): boolean
    isHandWritten(component: string): boolean
    isKnownParametrized(name: string | undefined): boolean
    isShouldReplaceThrowingError(name: string): boolean
    noDummyGeneration(component: string, method?: string): boolean

    IDLVisitor: IDLVisitorConfiguration,
    linter: IDLLinterOptions
}

function expandPeerGeneratorConfiguration(data: PeerGeneratorConfigurationType): PeerGeneratorConfiguration {
    return {
        ...data,
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
                [IDLKind.Constructor, ["Deprecated",]]
            ]),
            checkEnumsConsistency: true,
            checkReferencesResolved: false,
        },
        IDLVisitor: expandIDLVisitorConfig(data.IDLVisitor),
    }
}

function isWhole(methods: string[]): boolean {
    return methods.includes("*")
}

function parseConfigFile(configurationFile: string): any {
    if (!fs.existsSync(configurationFile)) return undefined

    const data = fs.readFileSync(path.resolve(configurationFile)).toString()
    return JSON.parse(data)
}

export function readConfigFiles(configurationFiles?: string, ignoreDefaultConfig = false): unknown[] {
    const files = ignoreDefaultConfig ? [] : [
        path.join(__dirname, "..", "generation-config", "config.json"),
        path.join(__dirname, "..", "generation-config", "idl-config.json")
    ]
    if (configurationFiles) {
        files.push(...configurationFiles.split(","))
    }

    return files.map(file => parseConfigFile(file))
}

export function parseConfigFiles<T>(schema: ConfigSchema<T>, configurationFiles?: string, ignoreDefaultConfig = false): T {
    const json = mergeJSONs(
        readConfigFiles(configurationFiles, ignoreDefaultConfig)
    )
    const result = schema.validate(json)
    if (!result.success()) {
        throw new Error("Configuration is not valid!\n" + result.error() + '\n')
    }
    return result.unwrap()
}

export function loadPeerConfiguration(configurationFiles?: string, ignoreDefaultConfig = false): PeerGeneratorConfiguration {
    const config = expandPeerGeneratorConfiguration(
        parseConfigFiles(PeerGeneratorConfigurationSchema, configurationFiles, ignoreDefaultConfig)
    )
    config.IDLVisitor.parsePredefinedIDLFiles(path.join(__dirname, '..'))
    return config
}

export function peerGeneratorConfiguration(): PeerGeneratorConfiguration {
    return generatorConfiguration<PeerGeneratorConfiguration>()
}

export function IDLVisitorConfiguration(): IDLVisitorConfiguration {
    return peerGeneratorConfiguration().IDLVisitor
}
