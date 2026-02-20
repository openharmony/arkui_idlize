import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OHOSGEN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

export function ohosgenDefaultConfigurationPaths(): string[] {
    return [
        join(OHOSGEN_ROOT, 'generation-config/config.json'),
        join(OHOSGEN_ROOT, 'generation-config/idl-config.json'),
    ]
}