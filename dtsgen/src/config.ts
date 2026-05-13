/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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
import { ConfigTypeInfer, D, generatorConfiguration } from "@idlizer/core";
import { PeerGeneratorConfigurationExtension, PeerGeneratorConfigurationSchema, expandPeerGeneratorConfiguration, parseConfigFiles } from "@idlizer/libohos";

export const DtsgenConfigurationSchema = D.combine(
    PeerGeneratorConfigurationSchema,
    D.object({
        packageTransformation: D.maybe(D.map(D.string(), D.string())),
    })
)

export type DtsgenConfigurationType = ConfigTypeInfer<typeof DtsgenConfigurationSchema>
export type DtsgenConfiguration = ConfigTypeInfer<typeof DtsgenConfigurationSchema> & PeerGeneratorConfigurationExtension


export function dtsgenConfiguration(): DtsgenConfiguration {
    return generatorConfiguration<DtsgenConfiguration>()
}


export function loadDtsgenConfiguration(configurationFiles?: string, ignoreDefaultConfig = false): DtsgenConfiguration {
    return expandPeerGeneratorConfiguration(parseConfigFiles<DtsgenConfigurationType>(DtsgenConfigurationSchema, configurationFiles, ignoreDefaultConfig)) as DtsgenConfiguration
}