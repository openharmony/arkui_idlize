/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { createCommand } from "commander"
import { bundle } from "./bundle/bundle.mjs";

function main() {
    createCommand()
        .arguments('<bundle-version> [bundle-out]')
        .option('--no-panda-version', 'Mangle bundle version with Panda version')
        .option('--idlizer-only', 'Do not pack koalaui dependencies', false)
        .option('--koalaui-version <version>',
            'Use with --idlizer-only. Indicates the version of koalaui that idlizer packages will depend on')
        .action(bundle)
        .parse()
}

main()
