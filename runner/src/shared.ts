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

import { join, resolve } from "node:path"
import { defaultConfigPath as arkgenConfigPath } from "@idlizer/arkgen/app"

/////////////////////////////////////////////////
// CONSTANTS

export const WORKING_DIR = resolve(__dirname, '..', 'out')
export const SDK_PATCH_FILE = resolve(__dirname, '..', 'interface_sdk-js.patch')
export const GENERATED_IDL_DIR = join(WORKING_DIR, 'idl')
export const CLONED_SDK_DIR = join(WORKING_DIR, 'original-sdk')
export const CLONED_SDK_BUILD_TOOLS = join(CLONED_SDK_DIR, 'build-tools')
export const PREPARED_SDK_DIR_ARKTS = join(WORKING_DIR, 'patched-sdk-arkts')
export const PREPARED_SDK_ARKTS_INTERNAL = join(PREPARED_SDK_DIR_ARKTS, 'api', '@internal', 'component', 'ets')
export const PREPARED_SDK_ARKTS_ARKUI_COMPONENT = join(PREPARED_SDK_DIR_ARKTS, 'api', 'arkui', 'component')
export const PREPARED_SDK_DIR_TS = join(WORKING_DIR, 'patched-sdk-ts')
export const GENERATED_PEER_DIR = join(WORKING_DIR, 'peers')
export const GENERATED_PEER_SIG = join(GENERATED_PEER_DIR, 'sig')
export const GENERATED_PEER_LIBACE = join(GENERATED_PEER_DIR, 'libace')
export const ADDITIONAL_FILES = [
    ['global', 'resource.d.ets']
]
export const REFERENCE_CONFIG_PATH = resolve(arkgenConfigPath(), 'references', 'ets-sdk.refs.json')
