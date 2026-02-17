import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url)
const OHOSGEN_ROOT = join(dirname(require.resolve('@idlizer/ohosgen')), '../../..')

export function ohosgenDefaultConfigurationPaths(): string[] {
    return [
        join(OHOSGEN_ROOT, 'generation-config/config.json'),
        join(OHOSGEN_ROOT, 'generation-config/idl-config.json'),
    ]
}