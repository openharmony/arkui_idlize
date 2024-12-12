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

public func assertEquals(name: String, expected: String, actual: String): Unit {
    if (expected != actual) {
        println("TEST ${name} FAIL:\n  EXPECTED \"${expected}\"\n  ACTUAL   \"${actual}\"")
    } else {
        println("TEST ${name} PASS")
    }
}

public func getNativeString(ptr: Int64): String {
    let length = NativeModule._StringLength(ptr)
    var data = Array<UInt8>(Int64(length), repeat: UInt8(0))
    NativeModule._StringData(ptr, data, length)
    var result = StringBuilder()
    for (i in 0..length) {
        result.append(Rune(data[Int64(i)]))
    }
    return result.toString()
}

public func checkResult(name: String, test: () -> Unit, expected: String) {
    NativeModule._StartGroupedLog(1)
    test()
    NativeModule._StopGroupedLog(1)
    let actual = getNativeString(NativeModule._GetGroupedLog(1))
    if (actual != expected) {
        println("TEST ${name} FAIL:\n  EXPECTED \"${expected}\"\n  ACTUAL   \"${actual}\"")
        throw Exception("TEST ${name} FAIL")
    } else {
        println("TEST ${name} PASS")
    }
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
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=5}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
    // union
    labelStyle.maxLines = Option.None
    labelStyle.font = Font(Option.None, Union_FontWeight_Number_String("param"), Option.None, Option.None)
    checkResult("[Union] ButtonPeer.labelStyle",
        { => buttonPeer.labelStyleAttribute(labelStyle) },
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_OBJECT, .value={.size={.tag=ARK_TAG_UNDEFINED, .value={}}, .weight={.tag=ARK_TAG_OBJECT, .value={.selector=2, .value2={.chars=\"param\", .length=5}}}, .family={.tag=ARK_TAG_UNDEFINED, .value={}}, .style={.tag=ARK_TAG_UNDEFINED, .value={}}}}})");
    labelStyle.font = Font(Option.None, Union_FontWeight_Number_String(FontWeight.BOLD), Option.None, Option.None)
    checkResult("[Union + Enum] ButtonPeer.labelStyle",
        { => buttonPeer.labelStyleAttribute(labelStyle) },
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_OBJECT, .value={.size={.tag=ARK_TAG_UNDEFINED, .value={}}, .weight={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0=Ark_FontWeight(4)}}, .family={.tag=ARK_TAG_UNDEFINED, .value={}}, .style={.tag=ARK_TAG_UNDEFINED, .value={}}}}})");
    let resource = Resource("bundle_name", "module_name", 10.0, Option.None, 2000.0)   
    labelStyle.font = Font(Option.None, Option.None, Union_String_Resource(resource), Option.None)
    checkResult("[Union + Resource] ButtonPeer.labelStyle",
        { => buttonPeer.labelStyleAttribute(labelStyle) },
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_OBJECT, .value={.size={.tag=ARK_TAG_UNDEFINED, .value={}}, .weight={.tag=ARK_TAG_UNDEFINED, .value={}}, .family={.tag=ARK_TAG_OBJECT, .value={.selector=1, .value1={.bundleName={.chars=\"bundle_name\", .length=11}, .moduleName={.chars=\"module_name\", .length=11}, .id={.tag=102, .i32=10}, .params={.tag=ARK_TAG_UNDEFINED, .value={}}, .type_={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=2000}}}}}, .style={.tag=ARK_TAG_UNDEFINED, .value={}}}}})"
        )
    // tuple
    let peer = ArkTestPeer.create(Option.None, 0)
    let options = BlurOptions(Tuple_Number_Number(1.0, 2.0))
    checkResult("[Tuple] TestPeer.backdropBlur",
        { => peer.backdropBlurAttribute(42.0, options) },
        "backdropBlur({.tag=102, .i32=42}, {.tag=ARK_TAG_OBJECT, .value={.grayscale={.value0={.tag=102, .i32=1}, .value1={.tag=102, .i32=2}}}})");
    let tuple1 = Tuple_Number_String_EnumDTS(5.5, "test", EnumDTS.ELEM_1)
    checkResult("[Tuple + Enum] TestPeer.testTupleNumberStringEnum",
        { => peer.testTupleNumberStringEnumAttribute(tuple1) },
        "testTupleNumberStringEnum({.value0={.tag=103, .f32=5.5}, .value1={.chars=\"test\", .length=4}, .value2=Ark_EnumDTS(1)})")

    // optional
    let listPeer = ArkListPeer.create(Option.None, 0);
    checkResult("[Optional] ListPeer.someOptional",
        { => listPeer.someOptionalAttribute(false) },
        "someOptional({.tag=ARK_TAG_OBJECT, .value=false})");

    // enum
    checkResult("[Enum] ButtonPeer.type", { => buttonPeer.typeAttribute(ButtonType.CAPSULE) }, "type(Ark_ButtonType(0))");
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
                                    Option.None, 
                                    Option.None, 
                                    SheetMode.EMBEDDED,
                                    Option.None)
    checkResult("[Enum + Interface] ButtonPeer.bindSheet",
        { => buttonPeer.bindSheetAttribute(false, sheetOptions) },
        "bindSheet(false, {.tag=ARK_TAG_OBJECT, .value={.backgroundColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .height={.tag=ARK_TAG_UNDEFINED, .value={}}, .dragBar={.tag=ARK_TAG_UNDEFINED, .value={}}, .maskColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .blurStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .showClose={.tag=ARK_TAG_UNDEFINED, .value={}}, .preferType={.tag=ARK_TAG_UNDEFINED, .value={}}, .title={.tag=ARK_TAG_UNDEFINED, .value={}}, .enableOutsideInteractive={.tag=ARK_TAG_UNDEFINED, .value={}}, .width={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderWidth={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .mode={.tag=ARK_TAG_OBJECT, .value=Ark_SheetMode(1)}, .uiContext={.tag=ARK_TAG_UNDEFINED, .value={}}}})")
}

func createDefaultWriteCallback(kind: CallbackKind, callback: Any) {
    return {serializer: Serializer => 
        serializer.holdAndWriteCallback(callback,
            NativeModule._TestGetManagedHolder(),
            NativeModule._TestGetManagedReleaser(),
            NativeModule._TestGetManagedCaller(kind.value),
            NativeModule._TestGetManagedCallerSync(kind.value)
        )
    }
}
func enqueueCallback(
    writeCallback: (serializer: Serializer) -> ResourceId,
    readAndCallCallback: (deserializer: Deserializer) -> Unit
): Unit {
    let serializer = Serializer.hold()
    let resourceId = writeCallback(serializer)
    NativeModule._HoldArkoalaResource(resourceId)
    let buffer = Array<UInt8>(Int64(serializer.length()), repeat: 0)
    for (i in 0..buffer.size) {
        buffer[i] = serializer.asArray()[i]
    }
    serializer.release()

    /* libace calls stored callback */
    let deserializer = Deserializer(buffer, buffer.size)
    readAndCallCallback(deserializer)
    /* libace released resource */
    NativeModule._ReleaseArkoalaResource(resourceId)
}

class callResult {
    static var callResult1 = "NOT_CALLED"
    static var callResult2 = 0
}

func checkTwoSidesCallback() {
    NativeModule._TestSetArkoalaCallbackCaller()

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
    // for (i in 0..call2Count) {
    //     enqueueCallback(
    //         createDefaultWriteCallback(CallbackKind.Kind_Callback_Void, { =>
    //             callResult.callResult2++
    //         }),
    //         { deserializer =>
    //             let callback = deserializer.readCallback_Void(false)
    //             callback()
    //         }
    //     )
    // }

    assertEquals("Callback 1 enqueued", "NOT_CALLED", callResult.callResult1.toString())
    // assertEquals("Callback 2 enqueued ${call2Count} times", 0.toString(), callResult.callResult2.toString())
    checkArkoalaCallbacks()
    assertEquals("Callback 1 read&called", "CALLED, value=42.000000", callResult.callResult1.toString())
    // assertEquals("Callback 2 read&called ${call2Count} times", call2Count.toString(), callResult.callResult2.toString())
}

main(): Unit {
    checkPerf2(100)
    checkPerf3(100)
    peersTest()
    checkTwoSidesCallback()
}