/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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