/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import kotlin.system.exitProcess

import koalaui.arkoala.*
import koalaui.interop.*

import arkui.component.check.duplicates.*
import arkui.component.check.enum.*
import arkui.component.check.exeception.*
import arkui.component.check.flattenUnions.*
import arkui.component.check.hierarchy.*
import arkui.component.check.hooks.*
import arkui.component.check.modifiers.*
import arkui.component.check.optional.*
import arkui.component.check.transform.*
import arkui.component.common.*
import arkui.component.datebook.*

import synthetic_types.Union_Arkui_Component_Check_Transform_SampleI_Arkui_Component_Check_Transform_SampleTransformSrcI as SampleTransformUnionType

var hasTestErrors = false

fun checkResult(name: String, test: () -> Unit, expected: String) {
    NativeLog.startNativeLog(1)
    test()
    NativeLog.stopNativeLog(1)
    val actual = NativeLog.getNativeLog(1).replace(" \n", "")
    if (actual != expected) {
        println("TEST ${name} FAIL:\n  EXPECTED \"${expected}\"\n  ACTUAL   \"${actual}\"")
        hasTestErrors = true
    }
    else {
        println("TEST ${name} PASS")
    }
}

fun checkDatebook() {
    val peer = ArkDatebookPeer.create(null)
    val comp = ArkDatebookComponent()
    comp.setPeer(peer)
    checkResult("type", { comp.type(DatebookType.EGYPTIAN) }, "setType({.tag=INTEROP_TAG_OBJECT, .value=Ark_DatebookType(0)})")
    checkResult("text", { comp.text("Hello, Datebook!") }, "setText({.tag=INTEROP_TAG_OBJECT, .value={.chars=\"Hello, Datebook!\", .length=16}})")
}

fun checkEnums() {
    val peer = ArkCheckEnumPeer.create(null)
    val comp = ArkCheckEnumComponent()
    comp.setPeer(peer)
    checkResult("Enum UByte 1", { comp.enumUByte(EnumUByte.E1) }, "setEnumUByte(Ark_EnumUByte(1))")
    checkResult("Enum UByte 255", { comp.enumUByte(EnumUByte.E255) }, "setEnumUByte(Ark_EnumUByte(255))")
    checkResult("Enum Byte -127", { comp.enumByte(EnumByte.EN127) }, "setEnumByte(Ark_EnumByte(-127))")
    checkResult("Enum Int 512", { comp.enumInt(EnumInt.E512) }, "setEnumInt(Ark_EnumInt(512))")
    checkResult("Enum Long 0xFFFFFFFFA", { comp.enumLong(EnumLong.EFFFFFFFFA) }, "setEnumLong(Ark_EnumLong(68719476730))")
    checkResult("Enum String e2", { comp.enumString(EnumString.e2) }, "setEnumString(Ark_EnumString(1))")
}

fun checkHooks() {
    val peer = ArkCheckHooksPeer.create(null)
    val comp = ArkCheckHooksComponent()
    comp.setPeer(peer)
    checkResult("hook attribute text", { comp.text("Pass text to the hook") },
        "setCheckHookResult({.tag=INTEROP_TAG_OBJECT, .value={.chars=\"Check hook text: Pass text to the hook\", .length=38}})")
    checkResult("hook method primitives", { comp.methodPrimitives(true, 123.0, "Pass text to method primitives") },
        "setCheckHookResult({.tag=INTEROP_TAG_OBJECT, .value={.chars=\"Check hook method primitives: true, 123, Pass text to method primitives\", .length=71}})")
}

fun checkExceptions() {
    val peer = ArkCheckExceptionPeer.create(null)
    val comp = ArkCheckExceptionComponent()
    comp.setPeer(peer)
    checkResult("exception test", { comp.methodThrowException(123.0) },
        "setMethodThrowException({.tag=102, .i32=123})[return {.hasException=false}]")
}

fun checkOptional() {
    val peer = ArkCheckOptionalPeer.create(null)
    val comp = ArkCheckOptionalComponent()
    comp.setPeer(peer)

    checkResult("boolean true", { comp.propBoolean(true) },
        "setPropBoolean(true)")
    checkResult("boolean false", { comp.propBoolean(false) },
        "setPropBoolean(false)")
    checkResult("optional boolean true", { comp.propBooleanOptional(true) },
        "setPropBooleanOptional({.tag=INTEROP_TAG_OBJECT, .value=true})")
    checkResult("optional boolean false", { comp.propBooleanOptional(false) },
        "setPropBooleanOptional({.tag=INTEROP_TAG_OBJECT, .value=false})")
    checkResult("optional boolean undefined", { comp.propBooleanOptional(null) },
        "setPropBooleanOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})")

    checkResult("number positive", { comp.propNumber(111.0) },
        "setPropNumber({.tag=102, .i32=111})")
    checkResult("number negative", { comp.propNumber(-111.0) },
        "setPropNumber({.tag=102, .i32=-111})")
    checkResult("optional number", { comp.propNumberOptional(222.0) },
        "setPropNumberOptional({.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=222}})")
    checkResult("optional number undefined", { comp.propNumberOptional(null) },
        "setPropNumberOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})")

    checkResult("string", { comp.propString("abc") },
        "setPropString({.chars=\"abc\", .length=3})")
    checkResult("string empty", { comp.propString("") },
        "setPropString({.chars=\"\", .length=0})")
    checkResult("optional string", { comp.propStringOptional("defgh") },
        "setPropStringOptional({.tag=INTEROP_TAG_OBJECT, .value={.chars=\"defgh\", .length=5}})")
    checkResult("optional string undefined", { comp.propStringOptional(null) },
        "setPropStringOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}})")

    checkResult("method", { comp.method(true, 555.0, "i") },
        "setMethod(true, {.tag=102, .i32=555}, {.chars=\"i\", .length=1})")
    checkResult("method ", { comp.method(false, -555.0, "jk") },
        "setMethod(false, {.tag=102, .i32=-555}, {.chars=\"jk\", .length=2})")
    checkResult("method optional", { comp.methodOptional(true, 777.0, "lmn") },
        "setMethodOptional({.tag=INTEROP_TAG_OBJECT, .value=true}, {.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=777}}, {.tag=INTEROP_TAG_OBJECT, .value={.chars=\"lmn\", .length=3}})")
    checkResult("method optional", { comp.methodOptional(false, -777.0, "") },
        "setMethodOptional({.tag=INTEROP_TAG_OBJECT, .value=false}, {.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=-777}}, {.tag=INTEROP_TAG_OBJECT, .value={.chars=\"\", .length=0}})")
    checkResult("method optional undefined", { comp.methodOptional(null, null, null) },
        "setMethodOptional({.tag=INTEROP_TAG_UNDEFINED, .value={}}, {.tag=INTEROP_TAG_UNDEFINED, .value={}}, {.tag=INTEROP_TAG_UNDEFINED, .value={}})")
}

fun checkTransformOnSerialize() {
    val peer = ArkCheckTransformPeer.create()
    val comp = ArkCheckTransformComponent()
    comp.setPeer(peer)
    checkResult("sample", { comp.sample(object: SampleI { override var flag = true }) },
        "setSample({.flag=true})")
    checkResult("sampleTransformI", { comp.sampleTransformI(object: SampleTransformSrcI { override var text = "abc" }) },
        "setSampleTransformI({.length={.tag=102, .i32=3}})")
    checkResult("sampleTransformCallback", { comp.sampleTransformCallback(object: TransformSrcCallbackI { override var flag = true }) },
        "setSampleTransformCallback({.resource={.resourceId=100, .hold=0, .release=0}, .call=0})")
    checkResult("sampleTransformUnion", { comp.sampleTransformUnion(SampleTransformUnionType.create0(object: SampleI { override var flag = true})) },
        "setSampleTransformUnion({.selector=0, .value0={.flag=true}})")
    checkResult("sampleTransformUnion", { comp.sampleTransformUnion(SampleTransformUnionType.create1(object: SampleTransformSrcI { override var text = "defgh"})) },
        "setSampleTransformUnion({.selector=1, .value1={.length={.tag=102, .i32=5}}})")
}

fun checkHierarchy() {
    val parentPeer = ArkCheckParentPeer.create()
    val parentComp = ArkCheckParentComponent()
    parentComp.setPeer(parentPeer)
    checkResult("parent hierarchy test", { parentComp.commonMethodBoolean(false) },
        "setCommonMethodBoolean(false)")
    checkResult("parent hierarchy test", { parentComp.commonMethodBoolean(true) },
        "setCommonMethodBoolean(true)")
    val childPeer = ArkCheckChildPeer.create()
    val childComp = ArkCheckChildComponent()
    childComp.setPeer(childPeer)
    checkResult("child hierarchy test", { childComp.commonMethodBoolean(false) },
        "setCommonMethodBoolean(false)")
    checkResult("child hierarchy test", { childComp.commonMethodBoolean(true) },
        "setCommonMethodBoolean(true)")
}

public fun main() {
    checkDatebook()
    checkEnums()
    checkHooks()
    checkExceptions()
    checkOptional()
    checkTransformOnSerialize()
    checkHierarchy()

    if (hasTestErrors) {
        println("Tests failed!")
        exitProcess(1)
    }
}
