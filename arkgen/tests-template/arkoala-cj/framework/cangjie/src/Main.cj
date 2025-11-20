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
import std.math.abs

import Interop.*
import KoalaRuntime.*
import KoalaRuntime.memoize.*

public func assertEquals(name: String, expected: String, actual: String): Unit {
    if (expected != actual) {
        println("TEST ${name} FAIL:\n  EXPECTED \"${expected}\"\n  ACTUAL   \"${actual}\"")
    } else {
        println("TEST ${name} PASS")
    }
}
public func assertTrue(name: String, value: Bool) {
    if (!value) {
        println("TEST ${name} FAIL:\n  EXPECTED value is not true.")
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
            peer.setBackdropBlurAttribute(Float64(i), Option.None)
        }
        else {
            let options: BlurOptions = BlurOptions(Tuple_Number_Number(1.0, 2.0))
            peer.setBackdropBlurAttribute(Float64(i), options);
        }
    }
    var passed = DateTime.now().nanosecond - start;
    println("backdropBlur: ${passed} ns for ${count} iteration,  ${Int32(round(Float64(passed) / Float64(count)))} ms per 1M iterations");
}

func checkPerf3(count: Int32): Unit {
    var peer = ArkButtonPeer.create(None<ComponentBase>, 0)
    var testLength_10_lpx = Union_Length_LayoutPolicy(Length("10lpx"))
    let start = DateTime.now().nanosecond
    for (i in 0..count) {
        peer.setWidthAttribute(testLength_10_lpx);
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
        { => buttonPeer.setLabelStyleAttribute(labelStyle) },
        "setLabelStyle({.tag=INTEROP_TAG_OBJECT, .value={.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=5}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}) \n")
    // union
    labelStyle.maxLines = Option.None
    labelStyle.font = Font(Option.None, Union_FontWeight_Number_String("param"), Option.None, Option.None)
    checkResult("[Union] ButtonPeer.labelStyle",
        { => buttonPeer.setLabelStyleAttribute(labelStyle) },
        "setLabelStyle({.tag=INTEROP_TAG_OBJECT, .value={.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_OBJECT, .value={.size={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .weight={.tag=INTEROP_TAG_OBJECT, .value={.selector=2, .value2={.chars=\"param\", .length=5}}}, .family={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .style={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}}}) \n")
    labelStyle.font = Font(Option.None, Union_FontWeight_Number_String(FontWeight.BOLD), Option.None, Option.None)
    checkResult("[Union + Enum] ButtonPeer.labelStyle",
        { => buttonPeer.setLabelStyleAttribute(labelStyle) },
        "setLabelStyle({.tag=INTEROP_TAG_OBJECT, .value={.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_OBJECT, .value={.size={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .weight={.tag=INTEROP_TAG_OBJECT, .value={.selector=0, .value0=Ark_FontWeight(4)}}, .family={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .style={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}}}) \n")
    let resource = Resource("bundle_name", "module_name", 10.0, Option.None, 2000.0)   
    labelStyle.font = Font(Option.None, Option.None, Union_String_Resource(resource), Option.None)
    checkResult("[Union + Resource] ButtonPeer.labelStyle",
        { => buttonPeer.setLabelStyleAttribute(labelStyle) },
        "setLabelStyle({.tag=INTEROP_TAG_OBJECT, .value={.overflow={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxLines={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .font={.tag=INTEROP_TAG_OBJECT, .value={.size={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .weight={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .family={.tag=INTEROP_TAG_OBJECT, .value={.selector=1, .value1={.bundleName={.chars=\"bundle_name\", .length=11}, .moduleName={.chars=\"module_name\", .length=11}, .id={.tag=102, .i32=10}, .params={.tag=INTEROP_TAG_UNDEFINED, .value={}}, .type={.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=2000}}}}}, .style={.tag=INTEROP_TAG_UNDEFINED, .value={}}}}}}) \n")
    // tuple
    let peer = ArkTestPeer.create(Option.None, 0)
    let options = BlurOptions(Tuple_Number_Number(1.0, 2.0))
    checkResult("[Tuple] TestPeer.backdropBlur",
        { => peer.setBackdropBlurAttribute(42.0, options) },
        "setBackdropBlur({.tag=INTEROP_TAG_OBJECT, .value={.tag=102, .i32=42}}, {.tag=INTEROP_TAG_OBJECT, .value={.grayscale={.value0={.tag=102, .i32=1}, .value1={.tag=102, .i32=2}}}}) \n")
    let tuple1 = Tuple_Number_String_EnumDTS(5.5, "test", EnumDTS.ELEM_1)
    checkResult("[Tuple + Enum] TestPeer.testTupleNumberStringEnum",
        { => peer.setTestTupleNumberStringEnumAttribute(tuple1) },
        "setTestTupleNumberStringEnum({.value0={.tag=103, .f32=5.5}, .value1={.chars=\"test\", .length=4}, .value2=Ark_EnumDTS(1)}) \n")

    // optional
    let listPeer = ArkListPeer.create(Option.None, 0);
    checkResult("[Optional] ListPeer.someOptional",
        { => listPeer.setSomeOptionalAttribute(false) },
        "setSomeOptional({.tag=INTEROP_TAG_OBJECT, .value=false}) \n");

    // enum
    checkResult("[Enum] ButtonPeer.type", { => buttonPeer.setTypeAttribute(ButtonType.CAPSULE) }, "setType(Ark_ButtonType(0)) \n");
}

class ptrHolder {
    public var value: pointer = 0
    init (value: pointer) {
        this.value = value
    }
    init () {}
}
class booleanHolder {
    public var value: Bool = false
    init (value: Bool) {
        this.value = value
    }
    init () {}
}
class float32Holder {
    public var value: Float32 = 0.0
    init (value: Float32) {
        this.value = value
    }
    init () {}
}


func checkNodeAPI() {
    let id = Int32(12)
    let flags = Int32(7)
    let ptr = ptrHolder(ArkUIGeneratedNativeModule._ComponentRoot_construct(id, flags))
    let childPtr1 = ptrHolder(ArkUIGeneratedNativeModule._ComponentRoot_construct(id + 1, flags))
    let childPtr2 = ptrHolder(ArkUIGeneratedNativeModule._ComponentRoot_construct(id + 2, flags))

    let stackPtr = ptrHolder()
    checkResult("BasicNodeAPI getNodeByViewStack",
        { => stackPtr.value = ArkUINativeModule._GetNodeByViewStack() },
        "getNodeByViewStack()"
    )
    assertEquals("BasicNodeAPI getNodeByViewStack result", 234.toString(), stackPtr.value.toString())

    checkResult("BasicNodeAPI addChild",
        { => ArkUINativeModule._AddChild(ptr.value, childPtr1.value) },
        "addChild(0x${ptr.value}, 0x${childPtr1.value})markDirty(0x${ptr.value}, 32)"
    )

    ArkUINativeModule._AddChild(ptr.value, childPtr2.value)
    checkResult("BasicNodeAPI removeChild",
        { => ArkUINativeModule._RemoveChild(ptr.value, childPtr2.value) },
        "removeChild(0x${ptr.value}, 0x${childPtr2.value})markDirty(0x${ptr.value}, 32)"
    )

    checkResult("BasicNodeAPI insertChildAfter",
        { => ArkUINativeModule._InsertChildAfter(ptr.value, childPtr2.value, childPtr1.value) },
        "insertChildAfter(0x${ptr.value}, 0x${childPtr2.value}, 0x${childPtr1.value})markDirty(0x${ptr.value}, 32)"
    )
    ArkUINativeModule._RemoveChild(ptr.value, childPtr2.value)

    checkResult("BasicNodeAPI insertChildBefore",
        { => ArkUINativeModule._InsertChildBefore(ptr.value, childPtr2.value, childPtr1.value) },
        "insertChildBefore(0x${ptr.value}, 0x${childPtr2.value}, 0x${childPtr1.value})markDirty(0x${ptr.value}, 32)"
    )
    ArkUINativeModule._RemoveChild(ptr.value, childPtr2.value)

    checkResult("BasicNodeAPI insertChildAt",
        { => ArkUINativeModule._InsertChildAt(ptr.value, childPtr2.value, 0) },
        "insertChildAt(0x${ptr.value}, 0x${childPtr2.value}, 0)markDirty(0x${ptr.value}, 32)"
    )
    ArkUINativeModule._RemoveChild(ptr.value, childPtr2.value)

    checkResult("BasicNodeAPI applyModifierFinish",
        { => ArkUINativeModule._ApplyModifierFinish(ptr.value) },
        "applyModifierFinish(0x${ptr.value})"
    )

    checkResult("BasicNodeAPI markDirty",
        { => ArkUINativeModule._MarkDirty(ptr.value, 123456) },
        "markDirty(0x${ptr.value}, 123456)"
    )

    let isBuilderNode = booleanHolder(false)
    checkResult("BasicNodeAPI isBuilderNode",
        { => isBuilderNode.value = ArkUINativeModule._IsBuilderNode(ptr.value) },
        "isBuilderNode(0x${ptr.value})"
    )
    assertEquals("BasicNodeAPI isBuilderNode result", true.toString(), isBuilderNode.value.toString())

    checkResult("BasicNodeAPI disposeNode",
        { => ArkUINativeModule._DisposeNode(childPtr2.value) },
        "disposeNode(0x${childPtr2.value})")

    let length = float32Holder(0.0)
    checkResult("BasicNodeAPI convertLengthMetricsUnit",
        { => length.value = ArkUINativeModule._ConvertLengthMetricsUnit(1.23, 10, 0) },
        "convertLengthMetricsUnit(1.23, 10, 0)"
    )
    assertTrue("BasicNodeAPI convertLengthMetricsUnit result", abs(12.3 - length.value) < 0.00001)
}

func createDefaultWriteCallback(kind: CallbackKind, callback: Any) {
    return {serializer: SerializerBase => 
        serializer.holdAndWriteCallback(callback,
            TestNativeModule._TestGetManagedHolder(),
            TestNativeModule._TestGetManagedReleaser(),
            TestNativeModule._TestGetManagedCaller(kind.value),
            TestNativeModule._TestGetManagedCallerSync(kind.value)
        )
    }
}
func enqueueCallback(
    writeCallback: (serializer: SerializerBase) -> ResourceId,
    readAndCallCallback: (deserializer: DeserializerBase) -> Unit
): Unit {
    let serializer = SerializerBase.hold()
    let resourceId = writeCallback(serializer)
    ArkUINativeModule._HoldCallbackResource(resourceId)
    let bufferLength = serializer.length()
    serializer.release()

    /* libace calls stored callback */
    let deserializer = DeserializerBase(Array<UInt8>(), 0)
    deserializer.buffer = serializer.asBuffer()
    deserializer.length = bufferLength
    readAndCallCallback(deserializer)
    /* libace released resource */
    ArkUINativeModule._ReleaseCallbackResource(resourceId)
}

class callResult {
    static var callResult1 = "NOT_CALLED"
    static var callResult2 = 0
}

public func readCallback_Number_Void(deserializer: DeserializerBase): ((parameter: Float64) -> Unit) {
    let _resource: CallbackResource = deserializer.readCallbackResource()
    let _call: UInt64 = deserializer.readPointer()
    let _callSync: UInt64 = deserializer.readPointer()
    return { parameter: Float64 => 
        let _argsSerializer: SerializerBase = SerializerBase.hold();
        _argsSerializer.writeInt32(_resource.resourceId);
        _argsSerializer.writePointer(_call);
        _argsSerializer.writePointer(_callSync);
        _argsSerializer.writeNumber(parameter);
        InteropNativeModule._CallCallback(10, 36519084, _argsSerializer.asBuffer(), _argsSerializer.length())
        _argsSerializer.release();
        return;
    }
}

public func readCallback_Void(deserializer: DeserializerBase): (() -> Unit) {
    let _resource: CallbackResource = deserializer.readCallbackResource()
    let _call: UInt64 = deserializer.readPointer()
    let _callSync: UInt64 = deserializer.readPointer()
    return { => 
        let _argsSerializer: SerializerBase = SerializerBase.hold();
        _argsSerializer.writeInt32(_resource.resourceId);
        _argsSerializer.writePointer(_call);
        _argsSerializer.writePointer(_callSync);
        InteropNativeModule._CallCallback(10, -1867723152, _argsSerializer.asBuffer(), _argsSerializer.length())
        _argsSerializer.release();
        return;
    }
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
            let callback = readCallback_Number_Void(deserializer)
            callback(42.0)
        }
    )
    for (i in 0..call2Count) {
        enqueueCallback(
            createDefaultWriteCallback(CallbackKind.Kind_Callback_Void, { =>
                callResult.callResult2++
            }),
            { deserializer =>
                let callback = readCallback_Void(deserializer)
                callback()
            }
        )
    }
    registerArkuiApiHandler()

    assertEquals("Callback 1 enqueued", "NOT_CALLED", callResult.callResult1.toString())
    assertEquals("Callback 2 enqueued ${call2Count} times", 0.toString(), callResult.callResult2.toString())
    checkEvents()
    assertEquals("Callback 1 read&called", "CALLED, value=42.000000", callResult.callResult1.toString())
    assertEquals("Callback 2 read&called ${call2Count} times", call2Count.toString(), callResult.callResult2.toString())
}

let state: MutableState<Float64> = mutableState(42.0)

@Memo
func demo(): Unit {
    ArkBlank(Option.None, @Memo({ => println("ArkBlank with ${state.getValue()}")}), Union_Number_String(42.0))
}



main(): Unit {
    println("Start Cangjie tests")
    println("Callsitekey result: ${getCallsiteKey()}")
    checkPerf2(100)
    checkPerf3(100)

    peersTest()
    checkNodeAPI()
    checkTwoSidesCallback()

    println("Create app root")
    let root: ComputableState<IncrementalNode> = memoRoot(IncrementalNode(0), demo)
    for (i in 0..10) {
        println("~Incremental state update")
        root.getValue()
        let newValue = Float64(i/2)
        state.setValue(newValue)
        GlobalStateManager.updateSnapshot()
    }
}