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

import {
    DatebookType,
    ArkDatebookPeer,
    ArkDatebookComponent,
    ArkCheckHooksPeer,
    ArkCheckHooksComponent,
    ArkCheckExceptionPeer,
    ArkCheckExceptionComponent,
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

export function checkResult<R>(name: string, test: () => R, expected: string) {
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

function initNatives() {
    registerNativeModuleLibraryName("InteropNativeModule", "ArkoalaNative_ani")
    registerNativeModuleLibraryName("TestNativeModule", "ArkoalaNative_ani")
    registerNativeModuleLibraryName("ArkUINativeModule", "ArkoalaNative_ani")
    registerNativeModuleLibraryName("ArkUIGeneratedNativeModule", "ArkoalaNative_ani")
}

function checkDatebook() {
    let peer = ArkDatebookPeer.create()
    const comp = new ArkDatebookComponent()
    comp.setPeer(peer)
    checkResult("type", () => comp.type(DatebookType.EGYPTIAN), `setType({.tag=INTEROP_TAG_OBJECT, .value=Ark_DatebookType(0)})`)
    checkResult("text", () => comp.text("Hello, Datebook!"), `setText({.tag=INTEROP_TAG_OBJECT, .value={.chars="Hello, Datebook!", .length=16}})`)
}

function checkHooks() {
    const peer = ArkCheckHooksPeer.create()
    const comp = new ArkCheckHooksComponent()
    comp.setPeer(peer)
    checkResult("hook attribute text", () => comp.text(
        "Pass text to the hook"),
        `setCheckHookResult({.tag=INTEROP_TAG_OBJECT, .value={.chars="Check hook text: Pass text to the hook", .length=38}})`)
    checkResult("hook method primitives", () => comp.methodPrimitives(
        true, 123, "Pass text to method primitives"),
        `setCheckHookResult({.tag=INTEROP_TAG_OBJECT, .value={.chars="Check hook method primitives: true, 123, Pass text to method primitives", .length=71}})`)
}

function checkExceptions() {
    const peer = ArkCheckExceptionPeer.create()
    const comp = new ArkCheckExceptionComponent()
    comp.setPeer(peer)
    checkResult("exception test", () => comp.methodThrowException(123),
        `setMethodThrowException(VMContext, {.tag=102, .i32=123})`)
}

export function main(): void {
    initNatives()

    checkDatebook()
    checkHooks()
    checkExceptions()

    if (hasTestErrors) {
        throw new Error("Tests failed!")
    }
}
