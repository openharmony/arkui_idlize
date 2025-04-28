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

import * as path from "node:path"
import { toIDLFile } from "@idlizer/core"
import { DynamicEmitter } from "./emitters/DynamicEmitter"
import { Config } from "./general/Config"
import { IgnoreOptions, IrHackOptions } from "./options/IgnoreOptions"
import { StaticEmitter } from "./emitters/StaticEmitter"
import { cliOptions } from "./options/cli-options"
import { NonNullableOptions } from "./options/NonNullableOptions"

const pandaSdkIdlFilePath = `ohos_arm64/include/tools/es2panda/generated/es2panda_lib/es2panda_lib.idl`

function main() {
    const options = cliOptions()
    if (options.initialize) {
        new StaticEmitter(
            options.outputDir,
            options.pandaSdkPath
        ).emit()
    }
    new DynamicEmitter(
        options.outputDir,
        toIDLFile(
            path.join(
                options.pandaSdkPath,
                pandaSdkIdlFilePath
            )
        )[0],
        new Config(
            new IgnoreOptions(options.optionsFile),
            new NonNullableOptions(options.optionsFile),
            new IrHackOptions(options.optionsFile),
        ),
        options.debug
    ).emit()
}

main()
