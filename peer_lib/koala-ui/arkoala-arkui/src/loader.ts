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

import { nativeModule } from "@koalaui/arkoala"
import { pointer, nullptr } from "@koalaui/interop"

function waitVSync(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 100) )
}

export async function runEventLoop(env: pointer) {
    for (let i = 0; i < 5; i++) {
        nativeModule()._RunVirtualMachine(env, i)
        await waitVSync()
    }
}

export function checkLoader() {
    console.log("checkLoader")
    let classPath = __dirname + "/../generated/java-subset/bin"
    let libPath = __dirname + "/../native"
    let env = nativeModule()._LoadVirtualMachine(libPath, classPath, 0)
    setTimeout(async () => runEventLoop(env), 0)
}

checkLoader()