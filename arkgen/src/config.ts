import { dirname, join } from "node:path";

export const ARKGEN_ROOT = join(dirname(require.resolve('@idlizer/arkgen')), '../../..')

export function arkgenDefaultConfigurationPaths(): string[] {
    return [
        join(ARKGEN_ROOT, 'generation-config/config.json'),
        join(ARKGEN_ROOT, 'generation-config/idl-config.json'),
    ]
}

export function defaultConfigPath(): string {
    return join(ARKGEN_ROOT, 'generation-config')
}