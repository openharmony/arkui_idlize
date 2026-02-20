import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ARKGEN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

export function arkgenDefaultConfigurationPaths(): string[] {
    return [
        join(ARKGEN_ROOT, 'generation-config/config.json'),
        join(ARKGEN_ROOT, 'generation-config/idl-config.json'),
    ]
}

export function defaultConfigPath(): string {
    return join(ARKGEN_ROOT, 'generation-config')
}