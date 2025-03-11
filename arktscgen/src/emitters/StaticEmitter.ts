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

import fs from "node:fs"
import path from "node:path"

export class StaticEmitter {
    constructor(
        private outDir: string,
        private pandaSdkPath: string
    ) {}

    private copyFrom = path.join(__dirname, `../build/libarkts-copy`)

    private copyTo = path.join(this.outDir, `libarkts`)

    private patches: { filePath: string, substitutions: [string, string][] }[] = [
        {
            filePath: `./native/meson_options.txt`,
            substitutions: [
                [
                    `'../../../interop/src/cpp/'`,
                    `'../node_modules/@koalaui/interop/src/cpp/'`
                ],
                [
                    `'../../node_modules/'`,
                    `'../node_modules/'`
                ],
                [
                    `'../../../incremental/tools/panda/node_modules/@panda/sdk/'`,
                    `'${path.resolve(this.pandaSdkPath)}'`
                ],
            ]
        },
        {
            filePath: `./package.json`,
            substitutions: [
                [
                    `npm run --prefix ../../interop compile`,
                    ``
                ],
            ]
        }
    ]

    emit(): void {
        this.copyLibarkts()
        this.patchFiles()
    }

    private copyLibarkts(): void {
        console.log(`copying static library sources`)
        fs.cpSync(
            this.copyFrom,
            this.copyTo,
            { recursive: true }
        )
    }

    private patchFiles(): void {
        this.patches.forEach(it => {
            fs.writeFileSync(
                path.join(this.copyTo, it.filePath),
                it.substitutions
                    .map(([oldValue, newValue]) =>
                        (text: string) => text.replaceAll(oldValue, newValue)
                    )
                    .reduce(
                        (text, replace) => replace(text),
                        fs.readFileSync(
                            path.join(this.copyTo, it.filePath),
                            `utf8`
                        )
                    )
            )
        })
    }
}
