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

import * as path from "node:path"
import { ConfigTypeInfer, D, generatorConfiguration } from "@idlizer/core";
import { PeerGeneratorConfigurationExtension, PeerGeneratorConfigurationSchema, expandPeerGeneratorConfiguration, parseConfigFiles } from "@idlizer/libohos";
import  { expandIDLVisitorConfig, IDLVisitorConfiguration, IDLVisitorConfigurationSchema } from "./IDLVisitorConfig"

export const DtsgenConfigurationSchema = D.combine(
    PeerGeneratorConfigurationSchema,
    D.object({
        packageTransformation: D.maybe(D.map(D.string(), D.string())),
        IDLVisitor: IDLVisitorConfigurationSchema,
    })
)

export interface DtsgenConfigurationExtension {
    IDLVisitor: IDLVisitorConfiguration,
}

export type DtsgenConfigurationType = ConfigTypeInfer<typeof DtsgenConfigurationSchema>
export type DtsgenConfigurationWithExtension = DtsgenConfigurationType & DtsgenConfigurationExtension
export type DtsgenConfiguration = DtsgenConfigurationWithExtension & PeerGeneratorConfigurationExtension


export function dtsgenConfiguration(): DtsgenConfiguration {
    return generatorConfiguration<DtsgenConfiguration>()
}

export function expandDtsgenConfiguration(data: DtsgenConfigurationType): DtsgenConfigurationWithExtension {
    const config = {
        ...data,
        IDLVisitor: expandIDLVisitorConfig(data.IDLVisitor),
    }
    config.IDLVisitor.parsePredefinedIDLFiles(path.join(__dirname, '..'))
    return config
}


export function loadDtsgenConfiguration(configurationFiles?: string, ignoreDefaultConfig = false): DtsgenConfiguration {
    return expandPeerGeneratorConfiguration(
        expandDtsgenConfiguration(
            parseConfigFiles<DtsgenConfigurationType>(
                DtsgenConfigurationSchema, configurationFiles, ignoreDefaultConfig)
        )
    ) as DtsgenConfiguration
}

export function IDLVisitorConfiguration(): IDLVisitorConfiguration {
    return dtsgenConfiguration().IDLVisitor
}
