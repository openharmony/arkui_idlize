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

import JSON5 from "json5"
import * as fs from "node:fs"

type Method = { name: string, definition: string }
type Fragment = { interface: string, methods: Method[] }

export class CodeFragmentOptions {
    constructor(filePath?: string) {
        if (filePath === undefined) {
            return
        }

        this.fragments = JSON5.parse(fs.readFileSync(filePath).toString()).fragments
            ?? []
    }

    private readonly fragments: Fragment[] = []

    getCodeFragment(name: string): Method[] | undefined {
        return this.fragments.find(it => it.interface === name)?.methods
    }
}
