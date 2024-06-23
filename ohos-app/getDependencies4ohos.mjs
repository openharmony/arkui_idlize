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

import { error } from "node:console";
import * as fs from "node:fs"
import * as path from "node:path"
import { argv } from 'process'

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

let arch = 'arm64'
let archPath = 'arm64-v8a'
if (!isArm64) {
    arch = 'arm'
    archPath = 'armeabi-v7a'
}

const libName = `libNativeBridge_ohos_${arch}.so`
const libSource = `native/${libName}`


const libsDir = `ohos-app/api_perf/entry/libs/`
const libTargetDir = `${libsDir}/${archPath}`
const libTarget = `${libTargetDir}/${libName}`
const codesTargetDir = 'ohos-app/api_perf/entry/src/main/ets/idlize'
const koalauiModulesDir = 'peer_lib/ts/@koalaui'
const arkoalaArkuiSrcDir = `generated/${isFull ? 'peers' : 'subset'}/koalaui/arkoala-arkui/src`
const peerNodePath = `${arkoalaArkuiSrcDir}/PeerNode.ts`
const testDtsDir = `tests/subset/ets`
const commonFilePath = path.join(codesTargetDir, 'common.ts')
const testDtsPath = path.join(codesTargetDir, 'test.d.ts')
let ohosSdkRoot = process.env.OHOS_SDK ?? '../koala-ui/ohos-sdk/ohos-sdk'
let ohosSdkVersion = process.env.OHOS_SDK_VERSION ?? 'HarmonyOS-NEXT-DP1'
let sysroot = `${ohosSdkRoot}/${ohosSdkVersion}/base/native/sysroot/`
let llvm = `${ohosSdkRoot}/${ohosSdkVersion}/base/native/llvm/`
let target = `${isArm64 ? 'aarch64-linux-ohos' : 'arm-linux-ohos'}`

if (fs.existsSync(codesTargetDir)) fs.rmSync(codesTargetDir, { recursive: true })
if (fs.existsSync(libTargetDir)) fs.rmSync(libTargetDir, { recursive: true })
if (!fs.existsSync(libsDir)) fs.mkdirSync(libsDir)
fs.mkdirSync(codesTargetDir)
if (!fs.existsSync(libTargetDir)) fs.mkdirSync(libTargetDir)


function resolveLibDependency() {
    // copy libc++_shared.so to app avoid runtime errors because of wrong version libc++
    // let cppSharedLibPath = `${sysroot}/usr/lib/${target}/`
    let cppSharedLibPath = `${llvm}/lib/${target}/`
    let cppLibName = `libc++_shared.so`
    console.log(`copy ${cppSharedLibPath}/${cppLibName} ${libTargetDir}/${cppLibName}`)
    fs.copyFileSync(`${cppSharedLibPath}/${cppLibName}`, `${libTargetDir}/${cppLibName}`)

    // copy libNativeBridge_ohos_xxx.so
    console.log(`copy ${libSource} ${libTarget}`)
    fs.copyFileSync(libSource, libTarget)
}


const whiteList = [
    "ArkUINodeType.ts"
]

const blackList = [
    "main.ts"
]

const testDtsWhiteList = []

function getCommonFilePath() {
    return commonFilePath
}

function getTestDtsPath() {
    return testDtsPath
}

function copyTestDts(sourceDir, specificFile = undefined) {
    let resolveTestDts = file => {
        const sourceFile = path.join(sourceDir, specificFile ?? file)
        if (fs.lstatSync(sourceFile).isDirectory()) {
            copyTestDts(sourceFile)
            return
        }
        console.log(`sourceFile : ${sourceFile}`)
        if (file.endsWith('.d.ts') || testDtsWhiteList.includes(file)) {
            console.log(`sourceFile endsWith : ${sourceFile}`)
            let data = fs.readFileSync(sourceFile, 'utf8')
            let expectedData = data
            fs.appendFileSync(getTestDtsPath(), expectedData, 'utf8', (error) => {
                if (error) {
                  console.error(`appendFile ${getTestDtsPath()} error :`, error)
                  return
                }
                console.log(`appendFile ${getTestDtsPath()} successfully`)
            });
        }
    }
    if (!specificFile) {
        fs.readdirSync(sourceDir).forEach(resolveTestDts)
    } else {
        resolveTestDts(sourceDir)
    }
}

function copyAndFixPeerFiles(sourceDir, codesTargetDir, isCommon) {
    const importUtil = 'import util from \'@ohos.util\'\n'
    let initString = `${importUtil}

export class ArkComponent {
    protected peer?: NativePeerNode
    setPeer(peer: NativePeerNode) {

    }
}`

    if (isCommon) {
        fs.readFile(peerNodePath, 'utf8', (error, data) => {
            if (error) {
                console.error(`read ${peerNodePath} error : `, error)
                return
            }
            initString += data.replace(/.*@koalaui\/common"/g, '')
            initString = initString.replace(/.*@koalaui\/arkoala"/g, '')
            initString = initString.replace(/.*@koalaui\/interop"/g, '')
            initString = initString.replace(/.*@koalaui\/runtime"/g, '')
            fs.writeFile(getCommonFilePath(), initString, 'utf8', (error) => {
                if (error) {
                    console.error(`Init ${getCommonFilePath()} error : `, error)
                    return
                }
                console.log(`Init ${getCommonFilePath()} successfully`);
            });
        })
    }

    fs.readdirSync(sourceDir).forEach(file => {
        const sourceFile = path.join(sourceDir, file);
        if (fs.lstatSync(sourceFile).isDirectory()) {
            copyAndFixPeerFiles(sourceFile, codesTargetDir, isCommon)
        }
        const targetFile = path.join(codesTargetDir, file);
        let condition = file.endsWith('.ts')
        if (!blackList.includes(file) && (condition || whiteList.includes(file))) {
            fs.readFile(sourceFile, 'utf8', (error, data) => {
                if (error) {
                    console.error(`read ${sourceFile} error : `, error)
                    return
                }
                let expectedData
                if (isCommon) {
                    expectedData = data.replace(/import.*/g, '')
                    expectedData = expectedData.replace(/new TextDecoder/g, 'new util.TextDecoder')
                    fs.appendFile(getCommonFilePath(), expectedData, 'utf8', (error) => {
                        if (error) {
                          console.error(`appendFile ${getCommonFilePath()} error :`, error)
                          return
                        }
                        console.log(`appendFile ${getCommonFilePath()} successfully`);
                    });
                } else {
                    expectedData = data.replace(/@arkoala\/arkui/g, '.')
                    expectedData = expectedData.replace(/@koalaui\/arkoala/g, './common')
                    expectedData = expectedData.replace(/@koalaui\/common/g, './common')
                    expectedData = expectedData.replace(/@koalaui\/interop/g, './common')
                    expectedData = expectedData.replace(/@koalaui\/runtime/g, './common')
                    expectedData = expectedData.replace(/implements.*/g, '{')
                    if (file === "NativeModule.ts") {
                        const requireStatement = 'LOAD_NATIVE as NativeModule'
                        const requireNapiStatement = `globalThis.requireNapi("libNativeBridge_ohos_${arch}.so", true)`
                        expectedData = expectedData.replace(requireStatement, requireNapiStatement)
                    }
                    if (expectedData.includes('new TextDecoder') || expectedData.includes('new TextEncoder')) {
                        expectedData = expectedData.replace(/new TextDecoder/g, 'new util.TextDecoder')
                        expectedData = expectedData.replace(/new TextEncoder/g, 'new util.TextEncoder')
                        expectedData = importUtil + expectedData
                    }
                    fs.writeFile(targetFile, expectedData, 'utf8', (error) => {
                        if (error) {
                          console.error(`write ${targetFile} error :`, error)
                          return
                        }
                        console.log(`write ${targetFile} successfully`);
                    });
                }
            })
        }
    });
}

resolveLibDependency()
copyAndFixPeerFiles(koalauiModulesDir, codesTargetDir, true)
if (!isFull) copyTestDts(testDtsDir)

console.log(`copy ${isFull ? 'full' : 'subset'} peer codes to ohos project.`)
copyAndFixPeerFiles(arkoalaArkuiSrcDir, codesTargetDir)
