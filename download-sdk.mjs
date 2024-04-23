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

import * as fs from "node:fs"
import { execSync } from "node:child_process"

const dir = "./interface_sdk-js"

if (fs.existsSync(dir)) {
    //execSync(`cd ${dir} && git pull`)
    process.exit(0)
}

console.log("Downloading sdk")
execSync("git clone --depth=1 https://gitee.com/openharmony/interface_sdk-js.git")

if (!fs.existsSync("./sdk")) {
    fs.mkdirSync("./sdk")
    fs.symlinkSync("../interface_sdk-js/api/\@internal/component/ets", "./sdk/component")
}
