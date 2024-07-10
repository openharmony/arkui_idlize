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
import { wrapCallback, callCallback } from "./callback_registry"
import { ArkButtonPeer } from "@arkoala/arkui/ArkButtonPeer"
import { ArkCommonPeer } from "@arkoala/arkui/ArkCommonPeer"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/ArkCalendarPickerPeer"
import { ArkFormComponentPeer } from "@arkoala/arkui/ArkFormComponentPeer"
import { ArkNavigationPeer } from "@arkoala/arkui/ArkNavigationPeer"
import { ArkSideBarContainerPeer } from "@arkoala/arkui/ArkSidebarPeer"
import { ArkSideBarContainerComponent } from "@arkoala/arkui/ArkSidebar"
import { ArkTabContentPeer } from "@arkoala/arkui/ArkTabContentPeer"
import { SubTabBarStyle } from "@arkoala/arkui/ArkSubTabBarStyleBuilder"
import { CanvasRenderingContext2D } from "@arkoala/arkui/ArkCanvasRenderingContext2DMaterialized"
import { ArkUINodeType } from "@arkoala/arkui/ArkUINodeType"
import { startPerformanceTest } from "@arkoala/arkui/test_performance"
import { testLength_10_lpx } from "@arkoala/arkui/test_data"
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
    checkResult,
    checkTestFailures,
    startNativeLog,
    CALL_GROUP_LOG,
    stopNativeLog,
    assertEquals,
    assertTrue,
    assertThrows,
} from "./test_utils"
import { nativeModule } from "@koalaui/arkoala"
import { mkdirSync, writeFileSync } from "fs"


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
    let ptr: pointer = nativeModule()._CreateNode(ARKUI_TEXT, id, flags)

    let stackPtr: pointer = 0
    checkResult("BasicNodeAPI getNodeByViewStack",
        () => stackPtr = nativeModule()._GetNodeByViewStack(),
        `getNodeByViewStack()`
    )
    assertEquals("BasicNodeAPI getNodeByViewStack result", 234, stackPtr)

    checkResult("BasicNodeAPI disposeNode",
        () => nativeModule()._DisposeNode(ptr),
        `disposeNode(0x${ptr})`)

    checkResult("BasicNodeAPI addChild",
        () => nativeModule()._AddChild(ptr, stackPtr),
        `addChild(0x${ptr}, 0x234)`
    )

    checkResult("BasicNodeAPI removeChild",
        () => nativeModule()._RemoveChild(ptr, stackPtr),
        `removeChild(0x${ptr}, 0x234)`
    )

    checkResult("BasicNodeAPI insertChildAfter",
        () => nativeModule()._InsertChildAfter(ptr, stackPtr, nullptr),
        `insertChildAfter(0x${ptr}, 0x234, 0x0)`
    )

    checkResult("BasicNodeAPI insertChildBefore",
        () => nativeModule()._InsertChildBefore(ptr, stackPtr, nullptr),
        `insertChildBefore(0x${ptr}, 0x234, 0x0)`
    )

    checkResult("BasicNodeAPI insertChildAt",
        () => nativeModule()._InsertChildAt(ptr, stackPtr, 0),
        `insertChildAt(0x${ptr}, 0x234, 0)`
    )

    checkResult("BasicNodeAPI applyModifierFinish",
        () => nativeModule()._ApplyModifierFinish(ptr),
        `applyModifierFinish(0x${ptr})`
    )

    checkResult("BasicNodeAPI markDirty",
        () => nativeModule()._MarkDirty(ptr, 123456),
        `markDirty(0x${ptr}, 123456)`
    )

    let isBuilderNode = 0
    checkResult("BasicNodeAPI isBuilderNode",
        () => isBuilderNode = nativeModule()._IsBuilderNode(ptr),
        `isBuilderNode(0x${ptr})`
    )
    assertEquals("BasicNodeAPI isBuilderNode result", 1, isBuilderNode)

    let length = 0.0
    checkResult("BasicNodeAPI convertLengthMetricsUnit",
        () => length = nativeModule()._ConvertLengthMetricsUnit(1.23, 10, 0),
        `convertLengthMetricsUnit(1.230000, 10, 0)`
    )
    assertTrue("BasicNodeAPI convertLengthMetricsUnit result", Math.abs(12.3 - length) < 0.00001)
}

function checkCallback() {

    const id1 = wrapCallback((args, length) => 1001)
    const id2 = wrapCallback((args, length) => 1002)
    assertTrue("Register callback 1", id1 != -1)
    assertTrue("Register callback 2", id2 != -1)
    assertTrue("Callback ids are different", id1 != id2)

    const serializer = new Serializer()
    assertEquals("Call callback 1", 1001, callCallback(id1, serializer.asArray(), serializer.length()))
    assertEquals("Call callback 2", 1002, callCallback(id2, serializer.asArray(), serializer.length()))
    assertThrows("Call disposed callback 1", () => { callCallback(id1, serializer.asArray(), serializer.length()) })
    assertThrows("Call disposed callback 2", () => { callCallback(id2, serializer.asArray(), serializer.length()) })
}

function checkWriteFunction() {
    const s = new Serializer()
    s.writeFunction((value: number, flag: boolean) => flag ? value + 10 : value - 10)
    // TBD: id is small number
    const id = s.asArray()[0]
    const args = new Serializer()
    args.writeNumber(20)
    args.writeBoolean(true)
    // TBD: callCallback() result should be 30
    assertEquals("Write function", 42, callCallback(id, args.asArray(), args.length()))
}

function checkButton() {
    let peer = new ArkButtonPeer(ArkUINodeType.Button)

    checkResult("width", () => peer.widthAttribute("42%"),
        "width({.type=1, .value=42.000000, .unit=3, .resource=0})")
    checkResult("height", () => peer.heightAttribute({ id: 43, bundleName: "MyApp", moduleName: "MyApp" }),
        "height({.type=2, .value=0.000000, .unit=1, .resource=43})")
    checkResult("bindSheet", () =>
        peer.bindSheetAttribute(false, () => {}, {
            title: {
                title: { id: 43, bundleName: "MyApp", moduleName: "MyApp" }
            }
        }),
        `bindSheet(false, {.selector=0, .value0={.id=4}}, {.tag=ARK_TAG_OBJECT, .value={.backgroundColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .onAppear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onDisappear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillAppear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillDisappear={.tag=ARK_TAG_UNDEFINED, .value={}}, .height={.tag=ARK_TAG_UNDEFINED, .value={}}, .dragBar={.tag=ARK_TAG_UNDEFINED, .value={}}, .maskColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .detents={.tag=ARK_TAG_UNDEFINED, .value={}}, .blurStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .showClose={.tag=ARK_TAG_UNDEFINED, .value={}}, .preferType={.tag=ARK_TAG_UNDEFINED, .value={}}, .title={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.title={.selector=1, .value1={.kind="NativeErrorResource", .id=0}}, .subtitle={.tag=ARK_TAG_UNDEFINED, .value={}}}}}, .shouldDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillSpringBackWhenDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .enableOutsideInteractive={.tag=ARK_TAG_UNDEFINED, .value={}}, .width={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderWidth={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .shadow={.tag=ARK_TAG_UNDEFINED, .value={}}, .onHeightDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .mode={.tag=ARK_TAG_UNDEFINED, .value={}}, .onDetentsDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWidthDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .onTypeDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .uiContext={.tag=ARK_TAG_UNDEFINED, .value={}}}})`
    )
    checkResult("type", () => peer.typeAttribute(1), "type(1)")
    checkResult("labelStyle", () => peer.labelStyleAttribute({maxLines: 3}),
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=3}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
    checkResult("labelStyle2", () => peer.labelStyleAttribute({}),
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
    //nativeModule()._MeausureLayoutAndDraw(peer.peer.ptr)
    assertTrue("ButtonPeer finalizer", peer!.peer!.finalizer != nullptr)
}

function checkCalendar() {
    let peer = new ArkCalendarPickerPeer(ArkUINodeType.CalendarPicker)
    checkResult("edgeAlign1", () => peer.edgeAlignAttribute(2, {dx: 5, dy: 6}),
        `edgeAlign(2, {.tag=ARK_TAG_OBJECT, .value={.dx={.type=1, .value=5.000000, .unit=1, .resource=0}, .dy={.type=1, .value=6.000000, .unit=1, .resource=0}}})`)
    checkResult("edgeAlign2", () => peer.edgeAlignAttribute(2),
        `edgeAlign(2, {.tag=ARK_TAG_UNDEFINED, .value={}})`)
}

function checkFormComponent() {
    let peer = new ArkFormComponentPeer(ArkUINodeType.FormComponent)
    checkResult("size int", () => peer.sizeAttribute({width: 5, height: 6}),
        `size({.width={.tag=102, .i32=5}, .height={.tag=102, .i32=6}})`)
    checkResult("size float", () => peer.sizeAttribute({width: 5.5, height: 6.789}),
        `size({.width={.tag=103, .f32=5.50}, .height={.tag=103, .f32=6.78}})`)
    checkResult("size zero", () => peer.sizeAttribute({width: 0.0, height: 0.0}),
        `size({.width={.tag=102, .i32=0}, .height={.tag=102, .i32=0}})`)
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
        `backgroundBlurStyle(0, {.tag=ARK_TAG_OBJECT, .value={.colorMode={.tag=ARK_TAG_OBJECT, .value=0}, .adaptiveColor={.tag=ARK_TAG_OBJECT, .value=0}, .scale={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=1}}, .blurOptions={.tag=ARK_TAG_OBJECT, .value={.grayscale={.value0={.tag=102, .i32=1}, .value1={.tag=102, .i32=1}}}}}})`
    )

    checkResult("Test dragPreviewOptions numberBadge with number",
        () => peer.dragPreviewOptionsAttribute({numberBadge: 10}, {isMultiSelectionEnabled: true}),
        `dragPreviewOptions({.mode={.tag=ARK_TAG_UNDEFINED, .value={}}, .modifier={.tag=ARK_TAG_UNDEFINED, .value={}}, .numberBadge={.tag=ARK_TAG_OBJECT, .value={.selector=1, .value1={.tag=102, .i32=10}}}}, {.tag=ARK_TAG_OBJECT, .value={.isMultiSelectionEnabled={.tag=ARK_TAG_OBJECT, .value=true}, .defaultAnimationBeforeLifting={.tag=ARK_TAG_UNDEFINED, .value={}}}})`
    )

    checkResult("Test dragPreviewOptions numberBadge with boolean",
        () => peer.dragPreviewOptionsAttribute({numberBadge: true}, {defaultAnimationBeforeLifting: false}),
        `dragPreviewOptions({.mode={.tag=ARK_TAG_UNDEFINED, .value={}}, .modifier={.tag=ARK_TAG_UNDEFINED, .value={}}, .numberBadge={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0=true}}}, {.tag=ARK_TAG_OBJECT, .value={.isMultiSelectionEnabled={.tag=ARK_TAG_UNDEFINED, .value={}}, .defaultAnimationBeforeLifting={.tag=ARK_TAG_OBJECT, .value=false}}})`
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
        `minSideBarWidth({.tag=102, .i32=11})`
    )
    checkResult("Test string implementation for SideBarContainer.minSideBarWidth",
        () => component.minSideBarWidth("42%"),
        `minSideBarWidth({.type=1, .value=42.000000, .unit=3, .resource=0})`
    )
}

function checkNavigation() {
    let peer = new ArkNavigationPeer(ArkUINodeType.Navigation)
    checkResult("backButtonIcon", () => peer.backButtonIconAttribute("attr"),
        `backButtonIcon({.selector=0, .value0={.chars="attr", .length=4}})`)
}

function checkTabContent() {
    let peer = new ArkTabContentPeer(ArkUINodeType.TabContent)

    let subTabBarStyle: SubTabBarStyle = new SubTabBarStyle("Resource").id("testID")
    assertEquals("SubTabBarStyle id", "testID", subTabBarStyle._id)

    // TBD: Check that id field is passed to native
    checkResult("new SubTabBarStyle()",
        () => peer.tabBar_SubTabBarStyleBottomTabBarStyleAttribute(subTabBarStyle = new SubTabBarStyle("abc")),
        `tabBar({.selector=0, .value0={._indicator={.tag=ARK_TAG_UNDEFINED, .value={}}, ._selectedMode={.tag=ARK_TAG_UNDEFINED, .value={}}, ._board={.tag=ARK_TAG_UNDEFINED, .value={}}, ._labelStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, ._padding={.tag=ARK_TAG_UNDEFINED, .value={}}, ._id={.tag=ARK_TAG_UNDEFINED, .value={}}}})`)


    // TBD: check SubTabBarStyle is created from static method
    // subTabBarStyle = SubTabBarStyle.of("Resource2")
}

function checkCanvasRenderingContext2D() {

    let canvasRenderingContext2D: CanvasRenderingContext2D | undefined = undefined

    checkResult("new CanvasRenderingContext2D()",
        () => canvasRenderingContext2D = new CanvasRenderingContext2D(),
        "new CanvasPath()[return (void*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]" +
        "new CanvasRenderer()[return (void*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]" +
        "new CanvasRenderingContext2D({.tag=ARK_TAG_UNDEFINED, .value={}})[return (void*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]")

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
        peer.widthAttribute(testLength_10_lpx)
    }
    let passed = performance.now() - start
    console.log(`widthAttributeString: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

function setEventsAPI() {
    nativeModule()._Test_SetEventsApi()
}

function checkEvent_Primitive() {
    const BufferSize = 60 * 4
    const serializer = new SerializerBase()
    serializer.writeInt32(1) //nodeId
    serializer.writeString("testString") //arg1
    serializer.writeNumber(22) //arg2
    nativeModule()._Test_TextPicker_OnAccept(serializer.asArray(), serializer.length())

    const buffer = new Uint8Array(BufferSize)
    const checkResult = nativeModule()._CheckArkoalaGeneratedEvents(buffer, BufferSize)
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
    const checkResult = nativeModule()._CheckArkoalaGeneratedEvents(buffer, bufferSize)
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
    const checkResult = nativeModule()._CheckArkoalaGeneratedEvents(buffer, bufferSize)
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

checkPerf2(5 * 1000 * 1000)
checkPerf3(5 * 1000 * 1000)

startPerformanceTest()
startNativeLog(CALL_GROUP_LOG)
checkNodeAPI()
checkCallback()
checkWriteFunction()
checkButton()
checkCalendar()
//checkDTS()
checkFormComponent()
checkCommon()
checkOverloads()
checkNavigation()
setEventsAPI()
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
#include "arkoala-macros.h"

#include <map>
#include <string>

namespace OHOS::Ace::NG::GeneratedModifier {
    EXTERN_C IDLIZE_API_EXPORT const GENERATED_ArkUIAnyAPI* GENERATED_GetArkAnyAPI(GENERATED_Ark_APIVariantKind kind, int version);
}

const GENERATED_ArkUINodeModifiers* GetNodeModifiers() {
    static const auto val = (const GENERATED_ArkUIFullNodeAPI*)(OHOS::Ace::NG::GeneratedModifier::GENERATED_GetArkAnyAPI(GENERATED_FULL,GENERATED_ARKUI_FULL_API_VERSION));
    return val->getNodeModifiers();
}

const GENERATED_ArkUIBasicNodeAPI* GetBasicNodeApi() {
    static const auto val = (const GENERATED_ArkUIBasicNodeAPI*)OHOS::Ace::NG::GeneratedModifier::GENERATED_GetArkAnyAPI(GENERATED_BASIC, GENERATED_ARKUI_BASIC_NODE_API_VERSION);
    return val;
}

int main(int argc, const char** argv) {
${callGroupLog}
  return 0;
}`
if (callGroupLog.length > 0) {
    console.log(callLogCppCode)
    mkdirSync('./generated/call_log', {recursive: true})
    writeFileSync('./generated/call_log/main.cpp', callLogCppCode)
}
checkTabContent()
checkCanvasRenderingContext2D()

// Report in error code.
checkTestFailures()
