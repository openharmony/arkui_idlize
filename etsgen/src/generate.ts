/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import { Language, PeerLibrary } from "@idlizer/core"
import * as arkts from "@koalaui/libarkts"
import * as path from "path"
import * as fs from "fs"

export function generateFromSts(inputFiles: string[]): PeerLibrary {
    if (!process.env.PANDA_SDK_PATH) {
        process.env.PANDA_SDK_PATH = path.resolve(__dirname, "../../node_modules/@panda/sdk")
    }
    console.log(`Use Panda from ${process.env.PANDA_SDK_PATH}`)
    let result = new PeerLibrary(Language.ARKTS)
    // inputFiles = [ '/home/huawei/src/idlize/etsgen/a.ts']
    inputFiles.forEach(file => {
        console.log(`Processing ${file}`)
        let input = fs.readFileSync(file).toString()
        //let module = arkts.createETSModuleFromSource(input, arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED)
        arkts.arktsGlobal.filePath = file
        arkts.arktsGlobal.config = arkts.Config.create([
            '_',
            '--arktsconfig',
            path.resolve(__dirname, "..", "config.json"),
            file,
            '--extension',
            'ets',
            '--stdlib',
            path.join(process.env.PANDA_SDK_PATH as string, 'ets', 'stdlib'),
            '--output',
            'a.abc'
        ]).peer
        arkts.arktsGlobal.compilerContext = arkts.Context.createFromString(input)
        arkts.proceedToState(arkts.Es2pandaContextState.ES2PANDA_STATE_PARSED)
        const script = arkts.createETSModuleFromContext()
        console.log(`AST: ${script.dumpSrc()}`)
    })
    return result
}

