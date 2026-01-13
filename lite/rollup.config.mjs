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

import { createTarget } from "./rollup/common.config.mjs";

export default [
    createTarget("./src/applications/bridge/main.ts", "./build/lib/bridge-gen.js", ["commander", "typescript", "toml"], true),
    createTarget("./src/applications/skin/main.ts", "./build/lib/sk-gen.js", ["commander", "typescript", "toml"], true),
]
