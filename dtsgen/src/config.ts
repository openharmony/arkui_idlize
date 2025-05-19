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