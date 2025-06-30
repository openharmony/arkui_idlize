/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, '..')
const INTERFACES = join(ROOT, 'interfaces')

export const libraries = {
    arkuiExtra: join(INTERFACES, 'arkui-extra')
}

function scan(path:string): string[] {
    return statSync(path).isDirectory()
        ? readdirSync(path).flatMap(x => join(path, x))
        : [path]
}

export function readLibrary(name:keyof typeof libraries) {
    return scan(libraries[name])
}
