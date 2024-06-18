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
import { pointer, nullptr } from "@koalaui/interop"
import { SerializerBase } from "@arkoala/arkui/SerializerBase"
import { DeserializerBase } from "@arkoala/arkui/DeserializerBase"
import { Serializer } from "@arkoala/arkui/Serializer"
import { Deserializer } from "@arkoala/arkui/Deserializer"
import { ArkButtonPeer } from "@arkoala/arkui/ArkButtonPeer"
import { ArkCommonPeer } from "@arkoala/arkui/ArkCommonPeer"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/ArkCalendarPickerPeer"
import { ArkFormComponentPeer } from "@arkoala/arkui/ArkFormComponentPeer"
import { ArkNavigationPeer } from "@arkoala/arkui/ArkNavigationPeer"
import { ArkSideBarContainerPeer } from "@arkoala/arkui/ArkSidebarPeer"
import { ArkSideBarContainerComponent } from "@arkoala/arkui/ArkSidebar"
import { ArkTabContentPeer } from "@arkoala/arkui/ArkTabContentPeer"
import { SubTabBarStyle } from "@arkoala/arkui/ArkSubTabBarStyleMaterialized"
import { CanvasRenderingContext2D } from "@arkoala/arkui/ArkCanvasRenderingContext2DMaterialized"
import { ArkUINodeType } from "@arkoala/arkui/ArkUINodeType"
import { startPerformanceTest } from "@arkoala/arkui/test_performance"
import { testString1000 } from "@arkoala/arkui/test_data"
import { deserializePeerEvent, PeerEventKind,
    CommonMethod_onChildTouchTest_event,
    List_onScrollVisibleContentChange_event,
    TextPicker_onAccept_event
} from "./peer_events"
// imports required interfaces (now generation is disabled)
// import { Resource, BackgroundBlurStyleOptions, TouchTestInfo } from "@arkoala/arkui"

import {
    getNativeLog,
    reportTestFailures,
    setReportTestFailures,
    checkResult,
    checkTestFailures,
    startNativeLog,
    CALL_GROUP_LOG,
    stopNativeLog,
    TEST_GROUP_LOG,
    assertEquals,
    assertTrue,
} from "./test_utils"
import { nativeModule } from "@arkoala/arkui//NativeModule"
import { writeFileSync } from "fs"

// TODO: hacky way to detect subset vs full.
startNativeLog(TEST_GROUP_LOG)
new ArkButtonPeer(0).labelStyleAttribute({maxLines: 3})
setReportTestFailures(getNativeLog().indexOf("heightAdaptivePolicy") == -1)
stopNativeLog(TEST_GROUP_LOG)

if (!reportTestFailures) {
    console.log("WARNING: ignore test result")
}

function checkSerdeResult(name: string, value: any, expected: any) {
    if (value !== expected) {
        console.log(`TEST ${name} FAILURE: ${value} != ${expected}`)
    } else {
        console.log(`TEST ${name} PASS`)
    }
}

function checkSerdeBaseLength() {
    const ser = new SerializerBase()
    ser.writeLength("10px")
    ser.writeLength("11vp")
    ser.writeLength("12%")
    ser.writeLength("13lpx")
    ser.writeLength(14)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readLength, unit px", des.readLength(), "10px")
    checkSerdeResult("DeserializerBase.readLength, unit vp", des.readLength(), "11vp")
    checkSerdeResult("DeserializerBase.readLength, unit %", des.readLength(), "12%")
    checkSerdeResult("DeserializerBase.readLength, unit lpx", des.readLength(), "13lpx")
    checkSerdeResult("DeserializerBase.readLength, number", des.readLength(), 14)
}

function checkSerdeBaseText() {
    const ser = new SerializerBase()
    const text = "test text serialization/deserialization"
    ser.writeString(text)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readString", des.readString(), text)
}

function checkSerdeBasePrimitive() {
    const ser = new SerializerBase()
    ser.writeNumber(10)
    ser.writeNumber(10.5)
    ser.writeNumber(undefined)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readNumber, int", des.readNumber(), 10)
    checkSerdeResult("DeserializerBase.readNumber, float", des.readNumber(), 10.5)
    checkSerdeResult("DeserializerBase.readNumber, undefined", des.readNumber(), undefined)
}

function checkSerdeBaseCustomObject() {
    const ser = new SerializerBase()
    const resource: Resource = {
        bundleName: "bundle name",
        moduleName: "module name",
        id: 1,
    }
    ser.writeCustomObject("Resource", resource)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readCustomObject, Resource",
        JSON.stringify(resource),
        JSON.stringify(des.readCustomObject("Resource") as Resource))
}

function checkNodeAPI() {
    const ARKUI_TEXT = 1
    const id = 12
    const flags = 7
    let ptr: pointer = 0
    checkResult("BasicNodeAPI createNode",
        () => ptr = nativeModule()._CreateNode(ARKUI_TEXT, id, flags),
        `createNode(${ARKUI_TEXT}, ${id}, ${flags})`)
    assertEquals("BasicNodeAPI createNode result", 123, ptr)
}

function checkButton() {
    let peer = new ArkButtonPeer(ArkUINodeType.Button)

    checkResult("width", () => peer.widthAttribute("42%"),
        "width({1, 42.000000, 3, 0})")
    checkResult("height", () => peer.heightAttribute({ id: 43, bundleName: "MyApp", moduleName: "MyApp" }),
        "height({2, 0.000000, 1, 43})")
    checkResult("bindSheet", () =>
        peer.bindSheetAttribute(false, () => {}, {
            title: {
                title: { id: 43, bundleName: "MyApp", moduleName: "MyApp" }
            }
        }),
        `bindSheet(false, {42}, {ARK_TAG_OBJECT, {{ARK_TAG_UNDEFINED, 0}, {ARK_TAG_OBJECT, {0, .value0={{1, .value1={.kind="NativeErrorResource", .id=0}}, {ARK_TAG_UNDEFINED, 0}}}}, {ARK_TAG_UNDEFINED, 0}}})`
    )
    checkResult("type", () => peer.typeAttribute(1), "type(1)")
    checkResult("labelStyle", () => peer.labelStyleAttribute({maxLines: 3}), "labelStyle({{ARK_TAG_OBJECT, {102, .i32=3}}})")
    checkResult("labelStyle2", () => peer.labelStyleAttribute({}), "labelStyle({{ARK_TAG_UNDEFINED, 0}})")
    //nativeModule()._MeausureLayoutAndDraw(peer.peer.ptr)
    assertEquals("ButtonPeer ptr", 123, peer!.peer!.ptr)
    assertTrue("ButtonPeer finalizer", peer!.peer!.finalizer != nullptr)
}

function checkCalendar() {
    let peer = new ArkCalendarPickerPeer(ArkUINodeType.CalendarPicker)
    checkResult("edgeAlign1", () => peer.edgeAlignAttribute(2, {dx: 5, dy: 6}),
        `edgeAlign(2, {ARK_TAG_OBJECT, {{1, 5.000000, 1, 0}, {1, 6.000000, 1, 0}}})`)
    checkResult("edgeAlign2", () => peer.edgeAlignAttribute(2),
        `edgeAlign(2, {ARK_TAG_UNDEFINED, 0})`)
}

function checkFormComponent() {
    let peer = new ArkFormComponentPeer(ArkUINodeType.FormComponent)
    checkResult("size int", () => peer.sizeAttribute({width: 5, height: 6}),
        `size({{102, .i32=5}, {102, .i32=6}})`)
    checkResult("size float", () => peer.sizeAttribute({width: 5.5, height: 6.789}),
        `size({{103, .f32=5.50}, {103, .f32=6.78}})`)
    checkResult("size zero", () => peer.sizeAttribute({width: 0.0, height: 0.0}),
        `size({{102, .i32=0}, {102, .i32=0}})`)
}

function checkCommon() {
    let peer = new ArkCommonPeer(ArkUINodeType.Common)
    // check backgroundBlurStyle and check the heritance by the way
    let backgroundBlurStyle: BackgroundBlurStyleOptions = {
        colorMode: 0,
        adaptiveColor: 0,
        scale: 1,
        blurOptions: {
            grayscale: [1, 1]
        }
    }
    checkResult("Test backgroundBlurStyle for BackgroundBlurStyleOptions",
        () => peer.backgroundBlurStyleAttribute(0, backgroundBlurStyle),
        `backgroundBlurStyle(0, {ARK_TAG_OBJECT, {{ARK_TAG_OBJECT, 0}, {ARK_TAG_OBJECT, 0}, {ARK_TAG_OBJECT, {102, .i32=1}}, {ARK_TAG_OBJECT, {{{102, .i32=1}, {102, .i32=1}}}}}})`
    )

    checkResult("Test dragPreviewOptions numberBadge with number",
        () => peer.dragPreviewOptionsAttribute({numberBadge: 10}, {isMultiSelectionEnabled: true}),
        `dragPreviewOptions({{ARK_TAG_OBJECT, {1, .value1={102, .i32=10}}}}, {ARK_TAG_OBJECT, {{ARK_TAG_OBJECT, true}, {ARK_TAG_UNDEFINED, 0}}})`
    )

    checkResult("Test dragPreviewOptions numberBadge with boolean",
        () => peer.dragPreviewOptionsAttribute({numberBadge: true}, {defaultAnimationBeforeLifting: false}),
        `dragPreviewOptions({{ARK_TAG_OBJECT, {0, .value0=true}}}, {ARK_TAG_OBJECT, {{ARK_TAG_UNDEFINED, 0}, {ARK_TAG_OBJECT, false}}})`
    )
}

class ArkSideBarContainerComponentTest extends ArkSideBarContainerComponent {
    constructor(peer: ArkSideBarContainerPeer) {
        super()
        this.peer = peer
    }

    override checkPriority(name: string) {
        return true
    }
}

function checkOverloads() {
    const peer = new ArkSideBarContainerPeer(ArkUINodeType.SideBarContainer)
    const component = new ArkSideBarContainerComponentTest(peer)
    checkResult("Test number implementation for SideBarContainer.minSideBarWidth",
        () => component.minSideBarWidth(11),
        `minSideBarWidth({102, .i32=11})`
    )
    checkResult("Test string implementation for SideBarContainer.minSideBarWidth",
        () => component.minSideBarWidth("42%"),
        `minSideBarWidth({"42%", 3})`
    )
}

function checkNavigation() {
    let peer = new ArkNavigationPeer(ArkUINodeType.Navigation)
    checkResult("backButtonIcon", () => peer.backButtonIconAttribute("attr"),
        `backButtonIcon({0, .value0={"attr", 4}})`)
}

function checkTabContent() {
    let peer = new ArkTabContentPeer(ArkUINodeType.TabContent)

    let subTabBarStyle: SubTabBarStyle| undefined = undefined

    checkResult("new SubTabBarStyle()",
        () => peer.tabBar_SubTabBarStyleBottomTabBarStyleAttribute(subTabBarStyle = new SubTabBarStyle("abc")),
        `new SubTabBarStyle({0, .value0={"abc", 3}})[return (void*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]tabBar({0, .value0="Materialized 0x2a"})`)
    assertEquals("SubTabBarStyle ptr", 100, subTabBarStyle!.peer!.ptr)
    assertTrue("SubTabBarStyle finalizer", subTabBarStyle!.peer!.finalizer != nullptr)


    checkResult("new SubTabBarStyle()",
        () => peer.tabBar_SubTabBarStyleBottomTabBarStyleAttribute(subTabBarStyle = SubTabBarStyle.of("ABC")),
        `of({0, .value0={"ABC", 3}})[return (void*) 300]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]tabBar({0, .value0="Materialized 0x2a"})`)
    assertEquals("SubTabBarStyle.of() ptr", 300, subTabBarStyle!.peer!.ptr)
    assertTrue("SubTabBarStyle finalizer", subTabBarStyle!.peer!.finalizer != nullptr)

    checkResult("SubTabBarStyle peer close()",
        () => subTabBarStyle!.peer!.close(),
        `dummyClassFinalizer(0x12c)`)
}

function checkCanvasRenderingContext2D() {

    let canvasRenderingContext2D: CanvasRenderingContext2D | undefined = undefined

    checkResult("new CanvasRenderingContext2D()",
        () => canvasRenderingContext2D = new CanvasRenderingContext2D(),
        `new CanvasRenderingContext2D({ARK_TAG_UNDEFINED, 0})[return (void*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]`)

    checkResult("CanvasRenderingContext2D width",
        () => canvasRenderingContext2D!.width,
        `getWidth()`)

    checkResult("CanvasRenderingContext2D width",
        () => canvasRenderingContext2D!.height,
        `getHeight()`)

    assertEquals("CanvasRenderingContext2D width", 0, canvasRenderingContext2D!.width)
    assertEquals("CanvasRenderingContext2D height", 0, canvasRenderingContext2D!.height)

    checkResult("CanvasRenderingContext2D peer close()",
        () => canvasRenderingContext2D!.peer!.close(),
        `dummyClassFinalizer(0x64)`)
}

function checkPerf1(count: number) {
    let module = nativeModule()
    let start = performance.now()
    for (let i = 0; i < count; i++) {
        module._TestPerfNumber(i)
    }
    let passed = performance.now() - start
    console.log(`NUMBER: ${passed}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)

    start = performance.now()
    for (let i = 0; i < count; i++) {
        let serializer = new SerializerBase()
        serializer.writeNumber(0)
        let data = serializer.asArray()
        module._TestPerfNumberWithArray(data, data.length)
    }
    passed = performance.now() - start
    console.log(`ARRAY: ${passed}ms for ${Math.round(count)} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

function checkPerf2(count: number) {
    let peer = new ArkButtonPeer(ArkUINodeType.Button)
    let start = performance.now()
    for (let i = 0; i < count; i++) {
        peer.backdropBlurAttribute(i, i % 2 == 0 ? undefined : {grayscale: [1, 2]})
    }
    let passed = performance.now() - start
    console.log(`backdropBlur: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

function checkPerf3(count: number) {
    let peer = new ArkButtonPeer(ArkUINodeType.Button)
    let start = performance.now()
    for (let i = 0; i < count; i++) {
        peer.widthAttribute(testString1000)
    }
    let passed = performance.now() - start
    console.log(`widthAttributeString: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

function checkEvent_Primitive() {
    const BufferSize = 60 * 4
    const serializer = new SerializerBase()
    serializer.writeInt32(1) //nodeId
    serializer.writeString("testString") //arg1
    serializer.writeNumber(22) //arg2
    nativeModule()._Test_TextPicker_OnAccept(serializer.asArray(), serializer.length())

    const buffer = new Uint8Array(BufferSize)
    const checkResult = nativeModule()._CheckArkoalaEvents(buffer, BufferSize)
    const event = deserializePeerEvent(new Deserializer(buffer.buffer, BufferSize))
    assertEquals("Event_Primitive: read event from native", 1, checkResult)
    if (checkResult !== 1)
        return

    assertEquals("Event_Primitive: valid kind", PeerEventKind.TextPicker_onAccept, event.kind)
    if (event.kind !== PeerEventKind.TextPicker_onAccept)
        return

    const convertedEvent = event as TextPicker_onAccept_event
    assertEquals("Event_Primitive: string argument", "testString", convertedEvent.value)
    assertEquals("Event_Primitive: number argument", 22, convertedEvent.index)
}

function checkEvent_Interface_Optional() {
    const bufferSize = 60 * 4
    const serializer = new Serializer()
    const eventStart = { index: 11, itemIndexInGroup: 1 }
    const eventEnd = { index: 22 }
    serializer.writeInt32(1) //nodeId
    serializer.writeVisibleListContentInfo(eventStart);
    serializer.writeVisibleListContentInfo(eventEnd);
    nativeModule()._Test_List_OnScrollVisibleContentChange(serializer.asArray(), serializer.length())

    const buffer = new Uint8Array(bufferSize)
    const checkResult = nativeModule()._CheckArkoalaEvents(buffer, bufferSize)
    const event = deserializePeerEvent(new Deserializer(buffer.buffer, bufferSize))
    assertEquals("Event_Interface_Optional: read event from native", 1, checkResult)
    if (checkResult !== 1)
        return

    assertEquals("Event_Interface_Optional: valid kind", PeerEventKind.List_onScrollVisibleContentChange, event.kind)
    if (event.kind !== PeerEventKind.List_onScrollVisibleContentChange)
        return

    const convertedEvent = event as List_onScrollVisibleContentChange_event
    assertEquals("Event_Interface_Optional: start.index", eventStart.index, convertedEvent.start.index)
    assertEquals("Event_Interface_Optional: start.itemIndexInGroup", eventStart.itemIndexInGroup, convertedEvent.start.itemIndexInGroup)
    assertEquals("Event_Interface_Optional: end.index", eventEnd.index, convertedEvent.end.index)
    assertEquals("Event_Interface_Optional: end.itemIndexInGroup", undefined, convertedEvent.end.itemIndexInGroup)
}

function checkEvent_Array_Class() {
    const bufferSize = 60 * 4
    const serializer = new Serializer()
    const eventParam: TouchTestInfo[] = [
        { windowX: 10, windowY: 11, parentX: 12, parentY: 13, x: 14, y: 15, id: "one",
            rect: { x: 100, y: 101, width: 102, height: 103 } },
        { windowX: 20, windowY: 21, parentX: 22, parentY: 23, x: 24, y: 25, id: "two",
            rect: { x: 200, y: 201, width: 202, height: 203 } },
        { windowX: 30, windowY: 31, parentX: 32, parentY: 33, x: 34, y: 35, id: "three",
            rect: { x: 300, y: 301, width: 302, height: 303 } }]
    serializer.writeInt32(1) // nodeId
    serializer.writeInt8(3)  // RuntimeType.OBJECT
    serializer.writeInt32(eventParam.length);
    for (let i = 0; i < eventParam.length; i++) {
      serializer.writeTouchTestInfo(eventParam[i]);
    }
    nativeModule()._Test_Common_OnChildTouchTest(serializer.asArray(), serializer.length())

    const buffer = new Uint8Array(bufferSize)
    const checkResult = nativeModule()._CheckArkoalaEvents(buffer, bufferSize)
    const event = deserializePeerEvent(new Deserializer(buffer.buffer, bufferSize))
    assertEquals("Event_Array_Class: read event from native", 1, checkResult)
    if (checkResult !== 1)
        return

    assertEquals("Event_Array_Class: valid kind", PeerEventKind.CommonMethod_onChildTouchTest, event.kind)
    if (event.kind !== PeerEventKind.CommonMethod_onChildTouchTest)
        return

    const convertedEvent = event as CommonMethod_onChildTouchTest_event
    const checkTouchTestInfo = (expected: TouchTestInfo, actual: TouchTestInfo) =>
        expected.x === actual.x && expected.y === actual.y &&
        expected.rect.x === actual.rect.x && expected.rect.y === actual.rect.y &&
        expected.rect.width === actual.rect.width && expected.rect.height === actual.rect.height &&
        expected.id === actual.id
    assertEquals("Event_Array_Class: array length", eventParam.length, convertedEvent.value.length)
    for (let i = 0; i < eventParam.length; i++) {
        assertTrue(`Event_Array_Class: element ${i}`, checkTouchTestInfo(eventParam[i], convertedEvent.value[i]))
    }
}
checkSerdeBaseLength()
checkSerdeBaseText()
checkSerdeBasePrimitive()
checkSerdeBaseCustomObject()

checkPerf2(200 * 1000)
checkPerf3(200 * 1000)

startPerformanceTest()
startNativeLog(CALL_GROUP_LOG)
checkNodeAPI()
checkButton()
checkCalendar()
//checkDTS()
checkFormComponent()
checkCommon()
checkOverloads()
checkNavigation()
checkEvent_Primitive()
checkEvent_Interface_Optional()
checkEvent_Array_Class()
stopNativeLog(CALL_GROUP_LOG)

const callGroupLog = getNativeLog(CALL_GROUP_LOG)
const callLogCppCode = `
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
#include "arkoala_api_generated.h"
#include <array>

const GENERATED_ArkUINodeModifiers* GetNodeModifiers() {
    // TODO: restore the proper call
    // return GetFullImpl()->getNodeModifiers();
    extern const GENERATED_ArkUINodeModifiers* GENERATED_GetArkUINodeModifiers();
    return GENERATED_GetArkUINodeModifiers();
}

int main(int argc, const char** argv) {
${callGroupLog}
  return 0;
}`
if (callGroupLog.length > 0) {
    console.log(callLogCppCode)
    writeFileSync('./peer_lib/call_log/main.cpp', callLogCppCode)
}
checkTabContent()
checkCanvasRenderingContext2D()

// Report in error code.
checkTestFailures()
