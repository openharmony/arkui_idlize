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
    ArkCheckOptionalPeer,
    ArkCheckOptionalComponent,
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
        `setMethodThrowException(VMContext_Not_NULL, {.tag=102, .i32=123})`)
}

function checkOptional() {
    const peer = ArkCheckOptionalPeer.create()
    const comp = new ArkCheckOptionalComponent()
    comp.setPeer(peer)

    checkResult("boolean true", () => comp.propBoolean(true),
        `setPropBoolean(true)`)
    checkResult("boolean false", () => comp.propBoolean(false),
        `setPropBoolean(false)`)
    checkResult("optional boolean true", () => comp.propBooleanOptional(true),
        `setPropBooleanOptional({.tag=INTEROP_TAG_OBJECT, .value=true})`)
    checkResult("optional boolean false", () => comp.propBooleanOptional(false),
        `setPropBooleanOptional({.tag=INTEROP_TAG_OBJECT, .value=false})`)
    checkResult("optional boolean undefined", () => comp.propBooleanOptional(undefined),
        `setPropBooleanOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})`)


    checkResult("number positive", () => comp.propNumber(111),
        `setPropNumber({.tag=102, .i32=111})`)
    checkResult("number negative", () => comp.propNumber(-111),
        `setPropNumber({.tag=102, .i32=-111})`)
    checkResult("optional number", () => comp.propNumberOptional(222),
        `setPropNumberOptional({.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=222}})`)
    checkResult("optional number undefined", () => comp.propNumberOptional(undefined),
        `setPropNumberOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})`)

    checkResult("string", () => comp.propString("abc"),
        `setPropString({.chars="abc", .length=3})`)
    checkResult("string empty", () => comp.propString(""),
        `setPropString({.chars="", .length=0})`)
    checkResult("optional string", () => comp.propStringOptional("defgh"),
        `setPropStringOptional({.tag=INTEROP_TAG_OBJECT, .value={.chars="defgh", .length=5}})`)
    checkResult("optional string undefined", () => comp.propStringOptional(undefined),
        `setPropStringOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})`)

    checkResult("method", () => comp.method(true, 555, "i"),
        `setMethod(true, {.tag=102, .i32=555}, {.chars="i", .length=1})`)
    checkResult("method ", () => comp.method(false, -555, "jk"),
        `setMethod(false, {.tag=102, .i32=-555}, {.chars="jk", .length=2})`)
    checkResult("method optional", () => comp.methodOptional(true, 777, "lmn"),
        `setMethodOptional({.tag=INTEROP_TAG_OBJECT, .value=true}, {.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=777}}, {.tag=INTEROP_TAG_OBJECT, .value={.chars="lmn", .length=3}})`)
    checkResult("method optional", () => comp.methodOptional(false, -777, ""),
        `setMethodOptional({.tag=INTEROP_TAG_OBJECT, .value=false}, {.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=-777}}, {.tag=INTEROP_TAG_OBJECT, .value={.chars="", .length=0}})`)
    checkResult("method optional undefined", () => comp.methodOptional(undefined, undefined, undefined),
        `setMethodOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}}, {.tag=INTEROP_TAG_UNDEFINED, .value={}}, {.tag=INTEROP_TAG_UNDEFINED, .value={}})`)
}

export function main(): void {
    initNatives()

    checkDatebook()
    checkHooks()
    checkExceptions()
    checkOptional()

    if (hasTestErrors) {
        throw new Error("Tests failed!")
    }
}
