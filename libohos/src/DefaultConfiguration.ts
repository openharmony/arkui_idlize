
import * as fs from "fs"
import * as path from "path"
import { 
    BaseGeneratorConfiguration, 
} from "@idlizer/core";
import { deepMergeConfig } from "./configMerge";

export class DefaultConfiguration extends BaseGeneratorConfiguration {
    constructor(data: Record<string, any> = {}) {
        super({
            TypePrefix: "Ark_",
            LibraryPrefix: "",
            OptionalPrefix: "Opt_",
            GenerateUnused: false,
            ApiVersion: 9999,
            dumpSerialized: false,
            rootComponents: [],
            standaloneComponents: [],
            parameterized: [],
            ignoreMaterialized: [],
            boundProperties: new Map(),
            builderClasses: [],
            ...data
        })
    }

    get GenerateUnused(): boolean { return this.param<boolean>("GenerateUnused") }
    get ApiVersion(): number { return this.param<number>("ApiVersion") }
    get dumpSerialized(): boolean { return this.param<boolean>("dumpSerialized") }
    get rootComponents(): string[] { return this.param<string[]>("rootComponents") }
    get standaloneComponents(): string[] { return this.param<string[]>("standaloneComponents") }
    get parameterized(): string[] { return this.param<string[]>("parameterized") }
    get ignoreMaterialized(): string[] { return this.param<string[]>("ignoreMaterialized") }
    get builderClasses(): string[] { return this.param<string[]>("builderClasses") }
    get boundProperties(): Record<string, string[]> { return this.param("boundProperties") }
}

function parseConfigFile(configurationFile: string): Record<string, any> | undefined {
    if (!fs.existsSync(configurationFile)) return undefined

    const data = fs.readFileSync(path.resolve(configurationFile)).toString()
    return JSON.parse(data)
}

export function parseConfigFiles(configurationFiles?: string, overrideConfigurationFiles?: string): Record<string, any> {
    let files = [path.join(__dirname, "..", "generation-config", "config.json")]
    if (configurationFiles) files.push(...configurationFiles.split(","))    
    if (overrideConfigurationFiles) {
        files = overrideConfigurationFiles.split(",")
    }

    let configuration: Record<string, any> = {}
    files.forEach(file => {
        const nextConfiguration = parseConfigFile(file)
        if (nextConfiguration) {
            console.log(`Using options from ${file}`)
            configuration = deepMergeConfig(configuration, nextConfiguration)
        } else {
            throw new Error(`file ${file} does not exist or cannot parse`)
        }
    })

    return configuration
}

export function loadConfiguration(configurationFiles?: string, overrideConfigurationFiles?: string): DefaultConfiguration {
    return new DefaultConfiguration(parseConfigFiles(configurationFiles, overrideConfigurationFiles))
}
