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

import * as fs from 'fs'
import * as path from 'path'


const TS_MODULES = [
    'NativeModuleBase.ts',
    'NativeModuleEmpty.ts',
    'NativeModule.ts',
    'SerializerBase.ts',
    'Serializer.ts',
]

const NATIVE_FILES = [
    'arkoala_api.h',
    'all_modifiers.cc',
    'ArgDeserializerBase.h',
    'Deserializer.h',
    'bridge.cc',
    'Interop.h',
]

function copyFile(srcDir: string, dstDir: string, srcFilename: string, dstFilename: string = '') {
    if (dstFilename == '') {
        dstFilename = srcFilename
    }
    const src = path.join(srcDir, srcFilename)
    const dst = path.join(dstDir, dstFilename)
    fs.copyFileSync(src, dst)
    console.log(`Copied: ${src} -> ${dst}`)
}


function copyTsLib(peersDir: string, koalaUiPeersDir: string) {
    fs.readdirSync(peersDir)
        .filter(file => TS_MODULES.includes(file))
        .forEach(file => {
            copyFile(peersDir, koalaUiPeersDir, file)
        })
}

function copyPeers(peersDir: string, koalaUiPeersDir: string, components: string[]) {
    if (components.length == 0) {
        fs.readdirSync(peersDir)
        .filter(file => file.startsWith('Ark') && file.endsWith('Peer.ts'))
        .forEach(file => {
            copyFile(peersDir, koalaUiPeersDir, file)
        })
    }
    else {
        components.forEach(componentName => {
            try {
                copyFile(peersDir, koalaUiPeersDir, `Ark${componentName}Peer.ts`)
            }
            catch (e) {
                console.log(`Peer not found for component '${componentName}'`)
                throw e
            }
        })
    }
}

function copyCpp(peersDir: string, koalaUiNativeDir: string) {
    fs.readdirSync(peersDir)
        .filter(file => NATIVE_FILES.includes(file))
        .forEach(file => {
            const renamed = (file == 'arkoala_api.h' ? 'arkoala_api_generated.h' : file)
            copyFile(peersDir, koalaUiNativeDir, file, renamed)
        })
}

export function copyPeersToKoalaUi(generatedDir: string, destinationDir: string, components: string[]) {
    const koalaUiPeers = path.join(destinationDir, "arkoala-arkui/src/")
    const koalaUiNative = path.join(destinationDir, "arkoala/native/src/")
    fs.mkdirSync(koalaUiPeers, {recursive: true})
    fs.mkdirSync(koalaUiNative, {recursive: true})

    copyTsLib(generatedDir, koalaUiPeers)
    copyPeers(generatedDir, koalaUiPeers, components)
    copyCpp(generatedDir, koalaUiNative)
}

export function copyPeersToLibace(generatedDir: string, destinationDir: string) {
    const libaceArkoala = path.join(destinationDir, 'frameworks/core/interfaces/arkoala')
    const libaceNative = path.join(destinationDir, 'frameworks/core/interfaces/native')
    const libaceNode = path.join(destinationDir, 'frameworks/core/interfaces/native/node')
    fs.mkdirSync(libaceArkoala, {recursive: true})
    fs.mkdirSync(libaceNative, {recursive: true})
    fs.mkdirSync(libaceNode, {recursive: true})

    copyFile(generatedDir, libaceArkoala, 'arkoala_api.h', 'arkoala_api_generated.h')
    copyFile(generatedDir, libaceNative, 'delegates.cc')
    copyFile(generatedDir, libaceNative, 'delegates.h')
    copyFile(generatedDir, libaceNode, 'all_modifiers.cc')
}
