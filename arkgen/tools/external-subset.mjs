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
import fs from "fs"
import path from "path"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export const External = path.join(__dirname, "../../external")
export const ExternalStubs = path.join(External, "subset")
export const Subset = path.join(__dirname, "../external-subset")
export const SubsetJson = path.join(ExternalStubs, "subset.json")

const data = JSON.parse(fs.readFileSync(SubsetJson).toString())
if (!data) throw new Error(`Cannot parse ${SubsetJson}`)

export function copySubset() {
    if (fs.existsSync(Subset))
        fs.rmSync(Subset, {recursive: true, force: true});

    fs.mkdirSync(Subset)

    const filters = data.subset.map(it => path.join(External, it))
    copyDir(External, Subset, filters)
    copyDir(ExternalStubs, Subset)
}

function copyDir(from, to, filters) {
    fs.readdirSync(from, { recursive: true, withFileTypes: true }).forEach(it => {
        if (!it.isFile()) {
            return
        }
        const relativePath = path.relative(from, path.join(it.parentPath ?? it.path, it.name))
        const sourcePath = path.join(from, relativePath)
        const targetPath = path.join(to, relativePath)
        if (!filters || filters.includes(sourcePath)) {
            fs.mkdirSync(path.dirname(targetPath), {recursive: true})
            fs.copyFileSync(sourcePath, targetPath)
        }
    })
}

copySubset()