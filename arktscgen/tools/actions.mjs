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

import { execSync } from "child_process"
import { readPackageJson, Version, writePackageJson, run } from "./utils.mjs"

const paths = {
    idlize: `..`,
    arktscgen: `.`,
    build: `./build`,
    unpacked: `./build/libarkts`,
    libarkts: `../external/arkoala-arkts/libarkts/`
}

export function assertNoUncommitedChanges() {
    [
        paths.arktscgen,
        paths.libarkts
    ].forEach(path => {
        if (execSync(`cd ${path} && git diff -- . ':(exclude)./external'`).toString().length > 0) {
            throw new Error(`Uncommited changes at ${path}`)
        }
    })
}

export function assertEqualVersions() {
    const generator = readPackageJson(paths.arktscgen)
    const libarkts = readPackageJson(paths.libarkts)

    if (generator.version !== libarkts.config["gen_version"]) {
        throw new Error(`Different versions: generator ${generator.version}, libarkts: ${libarkts.version}`)
    }
}

export function dropCoreDevel() {
    const generator = readPackageJson(paths.arktscgen)
    generator.dependencies["@idlizer/core"] = new Version(generator.dependencies["@idlizer/core"])
        .truncatePlusDevel()
        .toString()
    writePackageJson(paths.arktscgen, generator)
}

export function addCoreDevel() {
    const generator = readPackageJson(paths.arktscgen)
    generator.dependencies["@idlizer/core"] = new Version(generator.dependencies["@idlizer/core"])
        .addPlusDevel()
        .toString()
    writePackageJson(paths.arktscgen, generator)
}

export function pack() {
    run(paths.arktscgen, `npm pack --pack-destination ./build`)
}

export function testPacked() {
    run(
        paths.idlize,
        [
            `npx --yes ./arktscgen/build/idlizer-arktscgen-*.tgz`,
            `--panda-sdk-path ./external/incremental/tools/panda/node_modules/@panda/sdk`,
            `--output-dir ./arktscgen/build`,
            `--options-file ./external/arkoala-arkts/libarkts/generator/options.json5`
        ].join(' ')
    )
    run(paths.unpacked, `npm i`)
    run(paths.unpacked, `npm run compile`)
}

export function publish() {
    run(paths.arktscgen, `npm publish --tag next`)
}

export function withCoreDevelDropped(action) {
    try {
        dropCoreDevel()
        action()
    } finally {
        addCoreDevel()
    }
}

export function testAll() {
    run(paths.arktscgen, `npm run test:all`)
}

export function incrementVersions(part) {
    const generator = readPackageJson(paths.arktscgen)
    generator.version = new Version(generator.version)
        .increment(part)
        .toString()
    writePackageJson(paths.arktscgen, generator)

    const libarkts = readPackageJson(paths.libarkts)
    libarkts.config["gen_version"] = new Version(libarkts.config["gen_version"])
        .increment(part)
        .toString()
    writePackageJson(paths.libarkts, libarkts)
}
