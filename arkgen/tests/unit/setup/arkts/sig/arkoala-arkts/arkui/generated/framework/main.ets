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
// import { ArkUINativeModule, TestNativeModule } from "#components"
import { registerNativeModuleLibraryName, SerializerBase, DeserializerBase } from "@koalaui/interop"

import { ArkDatebookPeer,
    DatebookType,
} from "@arkoala/arkui"

import { InteropNativeModule } from "@koalaui/interop"

let hasTestErrors = false

export function getNativeLog(): string {
    let ptr = InteropNativeModule._GetGroupedLog(1)
    let length = InteropNativeModule._StringLength(ptr)
    let data: FixedArray<byte> = new byte[length]
    InteropNativeModule._StringData(ptr, data, length)
    InteropNativeModule._InvokeFinalizer(ptr, InteropNativeModule._GetStringFinalizer())
    // Improve: better string decoding.
    let result = new StringBuilder()
    for (let i = 0; i < length; i++) {
        result.append(String.fromCharCode(data[i].toDouble()))
    }
    return result.toString()
}

export function checkResult(name: string, test: () => void, expected: string) {
    InteropNativeModule._StartGroupedLog(1)
    test()
    InteropNativeModule._StopGroupedLog(1)
    const actual = getNativeLog()
        .replaceAll(" \n", "")
    if (actual != expected) {
        console.log(`TEST ${name} FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${actual}"`)
        hasTestErrors = true
    } else {
        console.log(`TEST ${name} PASS`)
    }
}

function checkDatebook() {
    let peer = ArkDatebookPeer.create()
    checkResult("type", () => peer.setTypeAttribute(DatebookType.EGYPTIAN), `setType({.tag=INTEROP_TAG_OBJECT, .value=Ark_DatebookType(0)})`)
    checkResult("text", () => peer.setTextAttribute("Hello, Datebook!"), `setText({.tag=INTEROP_TAG_OBJECT, .value={.chars="Hello, Datebook!", .length=16}})`)
}

export function main(): void {

    registerNativeModuleLibraryName("InteropNativeModule", "ArkoalaNative_ani")
    registerNativeModuleLibraryName("TestNativeModule", "ArkoalaNative_ani")
    registerNativeModuleLibraryName("ArkUINativeModule", "ArkoalaNative_ani")
    registerNativeModuleLibraryName("ArkUIGeneratedNativeModule", "ArkoalaNative_ani")

    checkDatebook()

    if (hasTestErrors) {
        throw new Error("Tests failed!")
    }
}
