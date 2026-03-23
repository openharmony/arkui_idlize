/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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