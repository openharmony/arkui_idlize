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
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { Package, IDLIZE_HOME } from "../../tools/utils.mjs";

const packages = [
    new Package(path.join(IDLIZE_HOME, "dtsgen")),
    new Package(path.join(IDLIZE_HOME, "arkgen")),
    new Package(path.join(IDLIZE_HOME, "ohosgen"))
]

const packagesPath = path.join(__dirname, '.packages')

if (fs.existsSync(packagesPath)) fs.rmSync(packagesPath, {recursive: true, force: true})
fs.mkdirSync(path.join(__dirname, '.packages'))

packages.map(module => module.pack(packagesPath))




