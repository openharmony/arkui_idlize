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
} else {
    console.log("Downloading sdk")
    execSync("git clone https://gitee.com/openharmony/interface_sdk-js.git")
}

let sdk = "./sdk"
let components = "./interface_sdk-js/api/\@internal/component/ets"
if (!fs.existsSync(sdk)) {
    execSync("cd ./interface_sdk-js && git checkout 0aae0ebf596d34e203818819b55436f5a3528d2f")
    fs.mkdirSync(sdk)
    try {
      fs.symlinkSync("." + components, sdk + "/component")
    } catch (e) {
      console.log("Symlink failed, try to copy")
      fs.cpSync(components, sdk + "/component", { recursive: true })
    }
}
