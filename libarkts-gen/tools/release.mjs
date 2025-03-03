/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

import { assertNoUncommitedChanges, readPackageJson, run, Version, writePackageJson } from "./utils.mjs"

const paths = {
    generator: `.`,
    libarkts: `../external/arkoala-arkts/libarkts/`
}

assertNoUncommitedChanges(paths.generator)
assertNoUncommitedChanges(paths.libarkts)

const generator = readPackageJson(paths.generator)
const libarkts = readPackageJson(paths.libarkts)

if (generator.version !== libarkts.config["gen_version"]) {
    throw new Error(`Different versions: generator ${generator.version}, libarkts: ${libarkts.version}`)
}
run(
    paths.generator,
    `npm run all`
)
assertNoUncommitedChanges(paths.generator)
assertNoUncommitedChanges(paths.libarkts)

generator.version = new Version(generator.version)
    .incrementPatch()
    .toString()
generator.dependencies["@idlizer/core"] = new Version(generator.dependencies["@idlizer/core"])
    .truncatePlusDevel()
    .toString()
writePackageJson(paths.generator, generator)

run(
    paths.generator,
    `npm run compile`,
    `npm publish --tag next --access public`
)

generator.dependencies["@idlizer/core"] = new Version(generator.dependencies["@idlizer/core"])
    .addPlusDevel()
    .toString()
writePackageJson(paths.generator, generator)

libarkts.config["gen_version"] = new Version(libarkts.config["gen_version"])
    .incrementPatch()
    .toString()

writePackageJson(
    paths.libarkts,
    libarkts
)
run(
    paths.libarkts,
    `npm run regenerate -y`
)