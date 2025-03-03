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

package idlize

import std.time.DateTime
import std.math.round
import std.collection.*

import Interop.*
import KoalaRuntime.*

public func assertEquals(name: String, expected: String, actual: String): Unit {
    if (expected != actual) {
        println("TEST ${name} FAIL:\n  EXPECTED \"${expected}\"\n  ACTUAL   \"${actual}\"")
    } else {
        println("TEST ${name} PASS")
    }
}

public func getNativeString(ptr: UInt64): String {
    let length = InteropNativeModule._StringLength(ptr)
    var data = Array<UInt8>(Int64(length), repeat: UInt8(0))
    InteropNativeModule._StringData(ptr, data, length)
    var result = StringBuilder()
    for (i in 0..length) {
        result.append(Rune(data[Int64(i)]))
    }
    return result.toString()
}

public func checkResult(name: String, test: () -> Unit, expected: String) {
    InteropNativeModule._StartGroupedLog(1)
    test()
    InteropNativeModule._StopGroupedLog(1)
    let actual = getNativeString(InteropNativeModule._GetGroupedLog(1))
    assertEquals(name, expected, actual)
}

func checkPerf2(count: Int64) {
    var peer = ArkBlankPeer.create(None<ComponentBase>, 0)
    var start = DateTime.now().nanosecond
    for (i in 0..count) {
        if (i % 2 == 0) {
            peer.backdropBlurAttribute(Float64(i), Option.None)
        }
        else {
            let options: BlurOptions = BlurOptions(Tuple_Number_Number(1.0, 2.0))
            peer.backdropBlurAttribute(Float64(i), options);
        }
    }
    var passed = DateTime.now().nanosecond - start;
    println("backdropBlur: ${passed} ns for ${count} iteration,  ${Int32(round(Float64(passed) / Float64(count)))} ms per 1M iterations");
}

func checkPerf3(count: Int32): Unit {
    var peer = ArkButtonPeer.create(None<ComponentBase>, 0)
    var testLength_10_lpx = Ark_Length("10lpx")
    let start = DateTime.now().nanosecond
    for (i in 0..count) {
        peer.widthAttribute(testLength_10_lpx);
    }
    let passed = DateTime.now().nanosecond - start;
    println("widthAttributeString: ${passed} ms for ${count} iteration")
}

func peersTest(): Unit {
    println("CJ peer tests")
    // interface
    let buttonPeer = ArkButtonPeer.create(Option.None, 0)
    let labelStyle = LabelStyle(Option.None, 5.0, Option.None, Option.None, Option.None, Option.None)
    checkResult("[Interface + Optional] ButtonPeer.labelStyle",
        { => buttonPeer.labelStyleAttribute(labelStyle) },
        "labelStyle({.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=5}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_UNDEFINED, .value={}}}) \n")
    // union
    labelStyle.maxLines = Option.None
    labelStyle.font = Font(Option.None, Union_FontWeight_Number_String("param"), Option.None, Option.None)
    checkResult("[Union] ButtonPeer.labelStyle",
        { => buttonPeer.labelStyleAttribute(labelStyle) },
        "labelStyle({.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_OBJECT, .value={.size={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .weight={.tag=INTEROP_TAG_OBJECT, .value={.selector=2, .value2={.chars=\"param\", .length=5}}}, .family={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .style={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}}) \n");
    labelStyle.font = Font(Option.None, Union_FontWeight_Number_String(FontWeight.BOLD), Option.None, Option.None)
    checkResult("[Union + Enum] ButtonPeer.labelStyle",
        { => buttonPeer.labelStyleAttribute(labelStyle) },
        "labelStyle({.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_OBJECT, .value={.size={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .weight={.tag=INTEROP_TAG_OBJECT, .value={.selector=0, .value0=Ark_FontWeight(4)}}, .family={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .style={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}}) \n")
    let resource = Resource("bundle_name", "module_name", 10.0, Option.None, 2000.0)   
    labelStyle.font = Font(Option.None, Option.None, Union_String_Resource(resource), Option.None)
    checkResult("[Union + Resource] ButtonPeer.labelStyle",
        { => buttonPeer.labelStyleAttribute(labelStyle) },
        "labelStyle({.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_OBJECT, .value={.size={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .weight={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .family={.tag=INTEROP_TAG_OBJECT, .value={.selector=1, .value1={.bundleName={.chars=\"bundle_name\", .length=11}, .moduleName={.chars=\"module_name\", .length=11}, .id={.tag=102, .i32=10}, .params={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .type_={.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=2000}}}}}, .style={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}}) \n"
        )
    // tuple
    let peer = ArkTestPeer.create(Option.None, 0)
    let options = BlurOptions(Tuple_Number_Number(1.0, 2.0))
    checkResult("[Tuple] TestPeer.backdropBlur",
        { => peer.backdropBlurAttribute(42.0, options) },
        "backdropBlur({.tag=102, .i32=42}, {.tag=INTEROP_TAG_OBJECT, .value={.grayscale={.value0={.tag=102, .i32=1}, .value1={.tag=102, .i32=2}}}}) \n");
    let tuple1 = Tuple_Number_String_EnumDTS(5.5, "test", EnumDTS.ELEM_1)
    checkResult("[Tuple + Enum] TestPeer.testTupleNumberStringEnum",
        { => peer.testTupleNumberStringEnumAttribute(tuple1) },
        "testTupleNumberStringEnum({.value0={.tag=103, .f32=5.5}, .value1={.chars=\"test\", .length=4}, .value2=Ark_EnumDTS(1)}) \n")

    // optional
    let listPeer = ArkListPeer.create(Option.None, 0);
    checkResult("[Optional] ListPeer.someOptional",
        { => listPeer.someOptionalAttribute(false) },
        "someOptional({.tag=INTEROP_TAG_OBJECT, .value=false}) \n");

    // enum
    checkResult("[Enum] ButtonPeer.type", { => buttonPeer.typeAttribute(ButtonType.CAPSULE) }, "type(Ark_ButtonType(0)) \n");
    let sheetOptions = SheetOptions(Option.None,
                                    Option.None, 
                                    Option.None, 
                                    Option.None, 
                                    Option.None, 
                                    Option.None, 
                                    Option.None, 
                                    Option.None, 
                                    Option.None, 
                                    Option.None, 
                                    SheetMode.EMBEDDED,
                                    Option.None)
    checkResult("[Enum + Interface] ButtonPeer.bindSheet",
        { => buttonPeer.bindSheetAttribute(false, sheetOptions) },
        "bindSheet(false, {.tag=INTEROP_TAG_OBJECT, .value={.backgroundColor={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .height={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .dragBar={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maskColor={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .blurStyle={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .showClose={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .preferType={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .title={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .enableOutsideInteractive={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .borderStyle={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .mode={.tag=INTEROP_TAG_OBJECT, .value=Ark_SheetMode(1)}, .uiContext={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}) \n")
}

func createDefaultWriteCallback(kind: CallbackKind, callback: Any) {
    return {serializer: Serializer => 
        serializer.holdAndWriteCallback(callback,
            TestNativeModule._TestGetManagedHolder(),
            TestNativeModule._TestGetManagedReleaser(),
            TestNativeModule._TestGetManagedCaller(kind.value),
            TestNativeModule._TestGetManagedCallerSync(kind.value)
        )
    }
}
func enqueueCallback(
    writeCallback: (serializer: Serializer) -> ResourceId,
    readAndCallCallback: (deserializer: Deserializer) -> Unit
): Unit {
    let serializer = Serializer.hold()
    let resourceId = writeCallback(serializer)
    ArkUINativeModule._HoldCallbackResource(resourceId)
    let buffer = Array<UInt8>(Int64(serializer.length()), repeat: 0)
    for (i in 0..buffer.size) {
        buffer[i] = serializer.asArray()[i]
    }
    serializer.release()

    /* libace calls stored callback */
    let deserializer = Deserializer(buffer, buffer.size)
    readAndCallCallback(deserializer)
    /* libace released resource */
    ArkUINativeModule._ReleaseCallbackResource(resourceId)
}

class callResult {
    static var callResult1 = "NOT_CALLED"
    static var callResult2 = 0
}

func checkTwoSidesCallback() {
    let call2Count = 100

    enqueueCallback(
        createDefaultWriteCallback(
            CallbackKind.Kind_Callback_Number_Void,
            { value: Float64 =>
                callResult.callResult1 = "CALLED, value=${value}" 
            }
        ),
        { deserializer =>
            let callback = deserializer.readCallback_Number_Void(false)
            callback(42.0)
        }
    )
    for (i in 0..call2Count) {
        enqueueCallback(
            createDefaultWriteCallback(CallbackKind.Kind_Callback_Void, { =>
                callResult.callResult2++
            }),
            { deserializer =>
                let callback = deserializer.readCallback_Void(false)
                callback()
            }
        )
    }

    assertEquals("Callback 1 enqueued", "NOT_CALLED", callResult.callResult1.toString())
    assertEquals("Callback 2 enqueued ${call2Count} times", 0.toString(), callResult.callResult2.toString())
    checkArkoalaCallbacks()
    assertEquals("Callback 1 read&called", "CALLED, value=42.000000", callResult.callResult1.toString())
    assertEquals("Callback 2 read&called ${call2Count} times", call2Count.toString(), callResult.callResult2.toString())
}

main(): Unit {
    getCallsiteKey()
    checkPerf2(100)
    checkPerf3(100)
    peersTest()
    checkTwoSidesCallback()
}