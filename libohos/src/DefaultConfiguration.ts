
import * as fs from "fs"
import * as path from "path"
import { 
    CoreConfiguration,
    defaultCoreConfuguration, 
} from "@idlizer/core";
import { deepMergeConfig } from "./configMerge";

export interface OhosBaseConfiguration extends CoreConfiguration {
    readonly GenerateUnused: boolean
    readonly ApiVersion: number
    readonly dumpSerialized: boolean
    readonly boundProperties: Map<string, string[]>
}

export const defaultOhosConfiguration: OhosBaseConfiguration = {
    ...defaultCoreConfuguration,
    TypePrefix: "Ark_",
    LibraryPrefix: "",
    OptionalPrefix: "Opt_",
    GenerateUnused: false,
    ApiVersion: 9999,
    dumpSerialized: false,
    boundProperties: new Map(),
}

function parseConfigFile(configurationFile: string): any {
    if (!fs.existsSync(configurationFile)) return undefined

    const data = fs.readFileSync(path.resolve(configurationFile)).toString()
    return JSON.parse(data)
}

export function parseConfigFiles<T extends object>(defaultConfiguration: T, configurationFiles?: string, overrideConfigurationFiles?: string): T {
    let files = [path.join(__dirname, "..", "generation-config", "config.json")]
    if (configurationFiles) files.push(...configurationFiles.split(","))    
    if (overrideConfigurationFiles) {
        files = overrideConfigurationFiles.split(",")
    }

    let result: T = defaultConfiguration
    files.forEach(file => {
        const nextConfiguration = parseConfigFile(file)
        if (nextConfiguration) {
            console.log(`Using options from ${file}`)
            result = deepMergeConfig<T>(result, nextConfiguration)
        } else {
            throw new Error(`file ${file} does not exist or cannot parse`)
        }
    })

    return result
}
