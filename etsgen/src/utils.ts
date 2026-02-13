import * as fs from "node:fs"
import * as path from "node:path"

export function resolveSymlinks(filePath: string, allowFallback: boolean = true): string {
    if (!fs.existsSync(filePath)) {
        if (allowFallback)
            return path.join(resolveSymlinks(path.dirname(filePath)), path.basename(filePath))
        throw new Error(`Path does not exist: ${filePath}`);
    }

    // Use realpathSync.native for better performance if available
    // Otherwise fall back to regular realpathSync
    // It resolves all symlinks in the path
    if (fs.realpathSync.native) {
        return fs.realpathSync.native(filePath);
    } else {
        return fs.realpathSync(filePath);
    }
}