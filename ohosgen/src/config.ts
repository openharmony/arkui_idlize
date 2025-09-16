import { dirname, join } from "node:path";

export const OHOSGEN_ROOT = join(dirname(require.resolve('@idlizer/ohosgen')), '..')

export function ohosgenDefaultConfigurationPaths(): string[] {
    return [
        join(OHOSGEN_ROOT, 'generation-config/config.json'),
        join(OHOSGEN_ROOT, 'generation-config/idl-config.json'),
    ]
}