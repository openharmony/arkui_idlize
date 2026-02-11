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
    EnumUByte,
    EnumByte,
    EnumInt,
    EnumLong,
    ArkCheckEnumPeer,
    ArkCheckEnumComponent,
    ArkCheckHooksPeer,
    ArkCheckHooksComponent,
    ArkCheckExceptionPeer,
    ArkCheckExceptionComponent,
    ArkCheckOptionalPeer,
    ArkCheckOptionalComponent,
    ArkCheckTransformPeer,
    ArkCheckTransformComponent,
    ArkCheckParentPeer,
    ArkCheckParentComponent,
    ArkCheckChildPeer,
    ArkCheckChildComponent,
    CheckTrivialModifierModifier,
    MenuElement
} from "./."

import { CheckCustomModifierModifier } from "#handwritten"

import { InteropNativeModule } from "@koalaui/interop"

let hasTestErrors = false

export function checkResult<R>(name: string, actual: R, expected: R) {
    if (actual != expected) {
        console.log(`TEST ${name} FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${actual}"`)
        hasTestErrors = true
    } else {
        console.log(`TEST ${name} PASS`)
    }
}

export function getNativeLog(): string {
    let ptr = InteropNativeModule._GetGroupedLog(1)
    let length = InteropNativeModule._StringLength(ptr)
    let data = new FixedArray<byte>(length)
    InteropNativeModule._StringData(ptr, data, length)
    InteropNativeModule._InvokeFinalizer(ptr, InteropNativeModule._GetStringFinalizer())
    // Improve: better string decoding.
    let result = new StringBuilder()
    for (let i = 0; i < length; i++) {
        result.append(String.fromCharCode(data[i].toDouble()))
    }
    return result.toString()
}

export function checkNativeLog<R>(name: string, test: () => R, expected: string) {
    InteropNativeModule._StartGroupedLog(1)
    test()
    InteropNativeModule._StopGroupedLog(1)
    const nativeLog = getNativeLog().replaceAll(" \n", "")
    checkResult(name, nativeLog, expected)
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
    checkNativeLog("type", () => comp.type(DatebookType.EGYPTIAN), `setType({.tag=INTEROP_TAG_OBJECT, .value=Ark_DatebookType(0)})`)
    checkNativeLog("text", () => comp.text("Hello, Datebook!"), `setText({.tag=INTEROP_TAG_OBJECT, .value={.chars="Hello, Datebook!", .length=16}})`)
}

function checkEnums() {
    let peer = ArkCheckEnumPeer.create()
    const comp = new ArkCheckEnumComponent()
    comp.setPeer(peer)
    checkNativeLog("Enum UByte 1", () => comp.enumUByte(EnumUByte.E1), `setEnumUByte(Ark_EnumUByte(1))`)
    checkNativeLog("Enum UByte 255", () => comp.enumUByte(EnumUByte.E255), `setEnumUByte(Ark_EnumUByte(255))`)
    checkNativeLog("Enum Byte -127", () => comp.enumByte(EnumByte.EN127), `setEnumByte(Ark_EnumByte(-127))`)
    checkNativeLog("Enum Int 512", () => comp.enumInt(EnumInt.E512), `setEnumInt(Ark_EnumInt(512))`)
    checkNativeLog("Enum Long 0xFFFFFFFFA", () => comp.enumLong(EnumLong.EFFFFFFFFA), `setEnumLong(Ark_EnumLong(68719476730))`)
}

function checkHooks() {
    const peer = ArkCheckHooksPeer.create()
    const comp = new ArkCheckHooksComponent()
    comp.setPeer(peer)
    checkNativeLog("hook attribute text", () => comp.text(
        "Pass text to the hook"),
        `setCheckHookResult({.tag=INTEROP_TAG_OBJECT, .value={.chars="Check hook text: Pass text to the hook", .length=38}})`)
    checkNativeLog("hook method primitives", () => comp.methodPrimitives(
        true, 123, "Pass text to method primitives"),
        `setCheckHookResult({.tag=INTEROP_TAG_OBJECT, .value={.chars="Check hook method primitives: true, 123, Pass text to method primitives", .length=71}})`)
}

function checkExceptions() {
    const peer = ArkCheckExceptionPeer.create()
    const comp = new ArkCheckExceptionComponent()
    comp.setPeer(peer)
    checkNativeLog("exception test", () => comp.methodThrowException(123),
        `setMethodThrowException({.tag=102, .i32=123})[return {.hasException=false}]`)
}

function checkOptional() {
    const peer = ArkCheckOptionalPeer.create()
    const comp = new ArkCheckOptionalComponent()
    comp.setPeer(peer)

    checkNativeLog("boolean true", () => comp.propBoolean(true),
        `setPropBoolean(true)`)
    checkNativeLog("boolean false", () => comp.propBoolean(false),
        `setPropBoolean(false)`)
    checkNativeLog("optional boolean true", () => comp.propBooleanOptional(true),
        `setPropBooleanOptional({.tag=INTEROP_TAG_OBJECT, .value=true})`)
    checkNativeLog("optional boolean false", () => comp.propBooleanOptional(false),
        `setPropBooleanOptional({.tag=INTEROP_TAG_OBJECT, .value=false})`)
    checkNativeLog("optional boolean undefined", () => comp.propBooleanOptional(undefined),
        `setPropBooleanOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})`)


    checkNativeLog("number positive", () => comp.propNumber(111),
        `setPropNumber({.tag=102, .i32=111})`)
    checkNativeLog("number negative", () => comp.propNumber(-111),
        `setPropNumber({.tag=102, .i32=-111})`)
    checkNativeLog("optional number", () => comp.propNumberOptional(222),
        `setPropNumberOptional({.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=222}})`)
    checkNativeLog("optional number undefined", () => comp.propNumberOptional(undefined),
        `setPropNumberOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})`)

    checkNativeLog("string", () => comp.propString("abc"),
        `setPropString({.chars="abc", .length=3})`)
    checkNativeLog("string empty", () => comp.propString(""),
        `setPropString({.chars="", .length=0})`)
    checkNativeLog("optional string", () => comp.propStringOptional("defgh"),
        `setPropStringOptional({.tag=INTEROP_TAG_OBJECT, .value={.chars="defgh", .length=5}})`)
    checkNativeLog("optional string undefined", () => comp.propStringOptional(undefined),
        `setPropStringOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})`)

    checkNativeLog("method", () => comp.method(true, 555, "i"),
        `setMethod(true, {.tag=102, .i32=555}, {.chars="i", .length=1})`)
    checkNativeLog("method ", () => comp.method(false, -555, "jk"),
        `setMethod(false, {.tag=102, .i32=-555}, {.chars="jk", .length=2})`)
    checkNativeLog("method optional", () => comp.methodOptional(true, 777, "lmn"),
        `setMethodOptional({.tag=INTEROP_TAG_OBJECT, .value=true}, {.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=777}}, {.tag=INTEROP_TAG_OBJECT, .value={.chars="lmn", .length=3}})`)
    checkNativeLog("method optional", () => comp.methodOptional(false, -777, ""),
        `setMethodOptional({.tag=INTEROP_TAG_OBJECT, .value=false}, {.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=-777}}, {.tag=INTEROP_TAG_OBJECT, .value={.chars="", .length=0}})`)
    checkNativeLog("method optional undefined", () => comp.methodOptional(undefined, undefined, undefined),
        `setMethodOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}}, {.tag=INTEROP_TAG_UNDEFINED, .value={}}, {.tag=INTEROP_TAG_UNDEFINED, .value={}})`)
}

function checkTransformOnSerialize() {
    let peer = ArkCheckTransformPeer.create()
    const comp = new ArkCheckTransformComponent()
    comp.setPeer(peer)
    checkNativeLog("sample", () => comp.sample({flag: true}), `setSample({.flag=true})`)
    checkNativeLog("sampleTransformI", () => comp.sampleTransformI({text: "abc"}), `setSampleTransformI({.length={.tag=102, .i32=3}})`)
    checkNativeLog("sampleTransformCallback", () => comp.sampleTransformCallback({flag: true }), `setSampleTransformCallback({.resource={.resourceId=100, .hold=0, .release=0}, .call=0})`)
    checkNativeLog("sampleTransformUnion", () => comp.sampleTransformUnion({flag: true}), `setSampleTransformUnion({.selector=0, .value0={.flag=true}})`)
    checkNativeLog("sampleTransformUnion", () => comp.sampleTransformUnion({text: "defgh"}), `setSampleTransformUnion({.selector=1, .value1={.length={.tag=102, .i32=5}}})`)
}

function checkHierarchy() {
    const parentPeer = ArkCheckParentPeer.create()
    const parentComp = new ArkCheckParentComponent()
    parentComp.setPeer(parentPeer)
    checkNativeLog("parent hierarchy test", () => parentComp.commonMethodBoolean(false),
        `setCommonMethodBoolean(false)`)
    checkNativeLog("parent hierarchy test", () => parentComp.commonMethodBoolean(true),
        `setCommonMethodBoolean(true)`)
    const childPeer = ArkCheckChildPeer.create()
    const childComp = new ArkCheckChildComponent()
    childComp.setPeer(childPeer)
    checkNativeLog("child hierarchy test", () => childComp.commonMethodBoolean(false),
        `setCommonMethodBoolean(false)`)
    checkNativeLog("child hierarchy test", () => childComp.commonMethodBoolean(true),
        `setCommonMethodBoolean(true)`)
}
class SomeElement implements MenuElement {
    modifierProp: CheckCustomModifierModifier | undefined
    trivialModifierProp: CheckTrivialModifierModifier | undefined
}

function checkModifiers() {
    const menuElement = new SomeElement()
    menuElement.modifierProp = new CheckCustomModifierModifier(5)
    menuElement.trivialModifierProp = new CheckTrivialModifierModifier()
    checkResult("modifier test", menuElement.modifierProp!.foo('Hello'), 10)
}

export function main(): void {
    initNatives()

    checkDatebook()
    checkEnums()
    checkHooks()
    checkExceptions()
    checkOptional()
    checkTransformOnSerialize()
    checkHierarchy()
    checkModifiers()

    if (hasTestErrors) {
        throw new Error("Tests failed!")
    }
}
