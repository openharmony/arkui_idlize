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

import { execSync } from "node:child_process"
import { argv } from 'process'
import path from 'path'
import * as fs from "node:fs"
import os from "os";

const platform = os.platform()
const isWindows = platform.includes('win')

function crossPathResolve(inPath) {
    if (isWindows) {
        return path.resolve(inPath).replace(/\\/g, '\\\\')
    } else {
        return path.resolve(inPath)
    }
}

const nativeDir = 'native'
let isFull = true
let isArm64 = true
let exeSuffix = isWindows ? '.exe' : ''

for (let i = 2; i < argv.length; ++i) {
    switch (argv[i]) {
        case "subset":
            isFull = false
            break
        case "full":
            isFull = true
            break
        case "arm64":
            isArm64 = true
            break
        case "arm32":
        case "arm":
            isArm64 = false
            break
    }
}

console.log(`isArm64 = ${isArm64}`)
console.log(`isFull = ${isFull}`)

let arch = isArm64 ? `arm64` : `arm32`
let mode = isFull ? `full` : `subset`
let crossFile = `cross-compilation-ohos-${arch}.txt`
let outDir = `build-${mode}-ohos-${arch}`
let ohosSdkRoot = process.env.OHOS_SDK ?? '../koala-ui/ohos-sdk/ohos-sdk'
let ohosSdkVersion = 'HarmonyOS-NEXT-DP1'

const sysrootDir = crossPathResolve(`${ohosSdkRoot}/${ohosSdkVersion}/base/native/sysroot`)
let builtInArgs = `${isArm64 ? '\'--target=aarch64-linux-ohos\'' : '\'--target=arm-linux-ohos\', \'-m32\''}`

let crossFileContent = `
[binaries]
c = \'${crossPathResolve(`${ohosSdkRoot}/${ohosSdkVersion}/base/native/llvm/bin/clang${exeSuffix}`)}\'
ar = \'${crossPathResolve(`${ohosSdkRoot}/${ohosSdkVersion}/base/native/llvm/bin/llvm-ar${exeSuffix}`)}\'
cpp = \'${crossPathResolve(`${ohosSdkRoot}/${ohosSdkVersion}/base/native/llvm/bin/clang++${exeSuffix}`)}\'
strip = \'${crossPathResolve(`${ohosSdkRoot}/${ohosSdkVersion}/base/native/llvm/bin/llvm-strip${exeSuffix}`)}\'

[built-in options]
c_args = ['--sysroot=${sysrootDir}', ${builtInArgs}]
c_link_args = ['--sysroot=${sysrootDir}', ${builtInArgs}]
cpp_args = ['--sysroot=${sysrootDir}', ${builtInArgs}]
cpp_link_args = ['--sysroot=${sysrootDir}', ${builtInArgs}]

[host_machine]
system = 'ohos'
cpu_family = ${isArm64 ? "'aarch64'" : "'armv7a'"}
cpu = ${isArm64 ? "'aarch64'" : "'arm'"}
endian = 'little'
`

fs.writeFileSync(`${nativeDir}/${crossFile}`, crossFileContent, 'utf8', (error) => {
    if (error) {
        console.error(`Init ${crossFile} error : `, error)
        return
    }
    console.log(`Init ${crossFile} successfully`);
});

let cleanCmd = `npx rimraf ${outDir}`
let configCmd = `meson setup -Dstrip=true ${isFull ? "" : '-Dsource_set="subset"'} ${outDir} --cross-file ${crossFile}`
let compileCmd = `meson compile -C ${outDir}`
let installCmd = `meson install -C ${outDir}`

execSync(cleanCmd, { cwd: nativeDir, stdio: 'inherit' })
execSync(configCmd, { cwd: nativeDir, stdio: 'inherit' })
execSync(compileCmd, { cwd: nativeDir, stdio: 'inherit' })
execSync(installCmd, { cwd: nativeDir, stdio: 'inherit' })