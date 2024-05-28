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
import { argv } from 'process'
import * as path from "node:path"

let isFull = true
let isArm64 = true

for (let i = 2; i < argv.length; ++i) {
    switch (argv[i]) {
        case "subset":
            isFull = false
            break;
        case "full":
            isFull = true
            break;
        case "arm64":
            isArm64 = true
            break;
        case "arm32":
        case "arm":
            isArm64 = false
            break;
        default:
            break;
    }
}

let arch = isArm64 ? 'arm64' : 'arm'
let deviceLibDir = isArm64 ? '/system/lib64/platformsdk' : '/system/lib/platformsdk'
let target = isArm64 ? 'aarch64-linux-ohos' : 'arm-linux-ohos'

const libName = `NativeBridgeNapi.node`
const native = `native`
const ohosV8 = `ohos-v8`
let nodeBin = `node`
let nodeLib = `libnode.so`
let nodeLib108 = `libnode.so.108`
let nodeDir = `${ohosV8}/3rdtools/${target}`
let sourceDir = isFull ? `build/peers` : `build/subset`
let deviceAppDir = `/data/local/tmp/perf/`
let koalauiModulesDir = `peer_lib/ts/@koalaui`
let ohosSdkRoot = process.env.OHOS_SDK ?? '../koala-ui/ohos-sdk/ohos-sdk'
let ohosSdkVersion = process.env.OHOS_SDK_VERSION ?? 'HarmonyOS-NEXT-DP1'
let llvmDir = `${ohosSdkRoot}/${ohosSdkVersion}/base/native/llvm/`

function downloadOhosNode() {
    const thirdToolsDir = `${ohosV8}/3rdtools`
    const download3rdToolCmd = 'node download-3rdtools.mjs'
    if (!fs.existsSync(thirdToolsDir)) execSync(download3rdToolCmd, { cwd: ohosV8, stdio: 'inherit' })
}

function mountRW() {
    execSync(`hdc shell mount -o rw,remount /`, )
}

function makeDir(targetDir, dir) {
    execSync(`hdc shell mkdir -p ${targetDir}/${dir}`, {stdio: 'inherit'})
    return `${targetDir}/${dir}`
}

function hdcFileSend(sourcePath, targetPath) {
    sourcePath = path.join(sourcePath)
    console.log(`hdc file send  ${sourcePath} ${targetPath}`)
    execSync(`hdc file send  ${sourcePath} ${targetPath}`, {stdio: 'inherit'})
}

function pushDirectory(sourceDir, targetDir) {
    fs.readdirSync(sourceDir).forEach(file => {
        if (file !== '.gitignore') {
            const sourceFile = path.join(sourceDir, file);
            hdcFileSend(sourceFile, targetDir)
        }
    });
}

function pushAppJsDeps2Device() {
    let deviceNodeModulesDir = makeDir(deviceAppDir, 'node_modules')
    let deviceKoalauiModulesDir = makeDir(deviceNodeModulesDir, '@koalaui')
    pushDirectory(koalauiModulesDir, deviceKoalauiModulesDir)
}

function pushAppLibDeps2Device() {
    // push node
    hdcFileSend(path.join(nodeDir, nodeBin), deviceLibDir + '/' + nodeBin)
    execSync(`hdc shell chmod 777 ${deviceLibDir}/${nodeBin}`, { stdio: 'inherit' })
    hdcFileSend(path.join(nodeDir, nodeLib108), deviceLibDir + '/' + nodeLib108)
    execSync(`hdc shell ln -s ${deviceLibDir}/${nodeLib108} ${deviceLibDir}/${nodeLib}`, { stdio: 'inherit' })

    // push libc++_shared.so to /system/lib64/platformsdk/ avoid runtime errors because of wrong version libc++
    let cppSharedLibPath = `${llvmDir}/lib/${target}/`
    let cppLibName = `libc++_shared.so`
    hdcFileSend(path.join(cppSharedLibPath, cppLibName), `${deviceLibDir}/${cppLibName}`)

    // push lib
    hdcFileSend(path.join(native, libName), deviceLibDir + '/' + libName)
}

function pushApp2Device() {
    pushDirectory(sourceDir, deviceAppDir)
}

function resolveBridgePath4NativeModule() {
    let nativeModuleFile = path.resolve(`${sourceDir}/generated/subset/NativeModule.js`)
    let nativeModuleDevicePath = `${deviceAppDir}/generated/subset/NativeModule.js`
    let nativeModuleFileCopy = `${nativeModuleFile}.copy`
    let content = fs.readFileSync(nativeModuleFile, 'utf8')
    const requireStatement = 'require("../../../../native/NativeBridgeNapi")'
    const requireNapiStatement = `require("${deviceLibDir}/NativeBridgeNapi")`
    let expectedData = content.replace(requireStatement, requireNapiStatement)
    fs.writeFileSync(nativeModuleFileCopy, expectedData, 'utf8', (error) => {
        if (error) {
        console.error(`write ${nativeModuleFileCopy} error :`, error)
        return
        }
        console.log(`write ${nativeModuleFileCopy} successfully`);
    });
    hdcFileSend(nativeModuleFileCopy, nativeModuleDevicePath)
}

function runPerfOnOhosV8(nodePath, appDir) {
    console.log(`hdc shell  ${nodePath} ${appDir}`)
    execSync(`hdc shell  ${nodePath} ${appDir}`, {stdio: 'inherit'})
}

if (!fs.existsSync(sourceDir)) {
    console.log(`${sourceDir} is empty. please build the codes first.`)
    process.exit()
}

downloadOhosNode()
mountRW()
pushAppJsDeps2Device()
pushAppLibDeps2Device()
pushApp2Device()
resolveBridgePath4NativeModule()

let nodePath = `${deviceLibDir}/${nodeBin}`
runPerfOnOhosV8(nodePath, deviceAppDir)