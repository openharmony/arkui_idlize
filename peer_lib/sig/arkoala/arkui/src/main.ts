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
import { pointer, nullptr, wrapCallback, callCallback } from "@koalaui/interop"
import { SerializerBase } from "@arkoala/arkui/peers/SerializerBase"
import { DeserializerBase } from "@arkoala/arkui/peers/DeserializerBase"
import { Serializer, createSerializer } from "@arkoala/arkui/peers/Serializer"
import { Deserializer } from "@arkoala/arkui/peers/Deserializer"
import { ArkButtonPeer } from "@arkoala/arkui/peers/ArkButtonPeer"
import { ArkCommonPeer } from "@arkoala/arkui/peers/ArkCommonPeer"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/peers/ArkCalendarPickerPeer"
import { ArkFormComponentPeer } from "@arkoala/arkui/peers/ArkFormComponentPeer"
import { ArkNavigationPeer } from "@arkoala/arkui/peers/ArkNavigationPeer"
import { ArkSideBarContainerPeer } from "@arkoala/arkui/peers/ArkSidebarPeer"
import { ArkSideBarContainerComponent } from "@arkoala/arkui/ArkSidebar"
import { ArkTabContentPeer } from "@arkoala/arkui/peers/ArkTabContentPeer"
import { SubTabBarStyle } from "@arkoala/arkui/ArkSubTabBarStyleBuilder"
import { BottomTabBarStyle } from "@arkoala/arkui/ArkBottomTabBarStyleBuilder"
import { CanvasRenderingContext2D } from "@arkoala/arkui/ArkCanvasRenderingContext2DMaterialized"
import { ArkUINodeType } from "@arkoala/arkui/peers/ArkUINodeType"
import { startPerformanceTest } from "@arkoala/arkui/test_performance"
import { testLength_10_lpx } from "@arkoala/arkui/test_data"
import {
    deserializePeerEvent, PeerEventKind,
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
    startNativeTest,
    stopNativeTest,
} from "./test_utils"
import { nativeModule } from "@koalaui/arkoala"
import { mkdirSync, writeFileSync } from "fs"

if (!reportTestFailures) {
    console.log("WARNING: ignore test result")
}

const recordCallLog = false

function checkSerdeResult(name: string, value: any, expected: any) {
    if (value !== expected) {
        console.log(`TEST ${name} FAILURE: ${value} != ${expected}`)
    } else {
        console.log(`TEST ${name} PASS`)
    }
}

function checkSerdeBaseLength() {
    const ser = SerializerBase.hold(createSerializer)
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
    ser.release()
}

function checkSerdeBaseText() {
    const ser = SerializerBase.hold(createSerializer)
    const text = "test text serialization/deserialization"
    ser.writeString(text)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readString", des.readString(), text)
    ser.release()
}

function checkSerdeBasePrimitive() {
    const ser = SerializerBase.hold(createSerializer)
    ser.writeNumber(10)
    ser.writeNumber(10.5)
    ser.writeNumber(undefined)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readNumber, int", des.readNumber(), 10)
    checkSerdeResult("DeserializerBase.readNumber, float", des.readNumber(), 10.5)
    checkSerdeResult("DeserializerBase.readNumber, undefined", des.readNumber(), undefined)
    ser.release()
}

function checkSerdeBaseCustomObject() {
    const ser = SerializerBase.hold(createSerializer)
    const pixelMap: PixelMap = {
        isEditable: true,
        isStrideAlignment: true,
    }
    ser.writeCustomObject("PixelMap", pixelMap)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readCustomObject, PixelMap",
        JSON.stringify(pixelMap),
        JSON.stringify(des.readCustomObject("PixelMap") as PixelMap))
    ser.release()
}

function checkNodeAPI() {
    startNativeTest(checkNodeAPI.name, CALL_GROUP_LOG)

    const ARKUI_TEXT = 1
    const id = 12
    const flags = 7
    let ptr: pointer = nativeModule()._CreateNode(ARKUI_TEXT, id, flags)
    let childPtr1: pointer = nativeModule()._CreateNode(ARKUI_TEXT, id + 1, flags)
    let childPtr2: pointer = nativeModule()._CreateNode(ARKUI_TEXT, id + 2, flags)

    let stackPtr: pointer = 0
    checkResult("BasicNodeAPI getNodeByViewStack",
        () => stackPtr = nativeModule()._GetNodeByViewStack(),
        `getNodeByViewStack()`
    )
    assertEquals("BasicNodeAPI getNodeByViewStack result", 234, stackPtr)

    checkResult("BasicNodeAPI addChild",
        () => nativeModule()._AddChild(ptr, childPtr1),
        `addChild(0x${ptr}, 0x${childPtr1})`
    )

    nativeModule()._AddChild(ptr, childPtr2)
    checkResult("BasicNodeAPI removeChild",
        () => nativeModule()._RemoveChild(ptr, childPtr2),
        `removeChild(0x${ptr}, 0x${childPtr2})`
    )

    checkResult("BasicNodeAPI insertChildAfter",
        () => nativeModule()._InsertChildAfter(ptr, childPtr2, childPtr1),
        `insertChildAfter(0x${ptr}, 0x${childPtr2}, 0x${childPtr1})`
    )
    nativeModule()._RemoveChild(ptr, childPtr2)

    checkResult("BasicNodeAPI insertChildBefore",
        () => nativeModule()._InsertChildBefore(ptr, childPtr2, childPtr1),
        `insertChildBefore(0x${ptr}, 0x${childPtr2}, 0x${childPtr1})`
    )
    nativeModule()._RemoveChild(ptr, childPtr2)

    checkResult("BasicNodeAPI insertChildAt",
        () => nativeModule()._InsertChildAt(ptr, childPtr2, 0),
        `insertChildAt(0x${ptr}, 0x${childPtr2}, 0)`
    )
    nativeModule()._RemoveChild(ptr, childPtr2)

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

    checkResult("BasicNodeAPI disposeNode",
        () => nativeModule()._DisposeNode(childPtr2),
        `disposeNode(0x${childPtr2})`)

    let length = 0.0
    checkResult("BasicNodeAPI convertLengthMetricsUnit",
        () => length = nativeModule()._ConvertLengthMetricsUnit(1.23, 10, 0),
        `convertLengthMetricsUnit(1.230000, 10, 0)`
    )
    assertTrue("BasicNodeAPI convertLengthMetricsUnit result", Math.abs(12.3 - length) < 0.00001)

    stopNativeTest(CALL_GROUP_LOG)
}

function checkCallback() {
    const id1 = wrapCallback((args, length) => 1001)
    const id2 = wrapCallback((args, length) => 1002)
    assertTrue("Register callback 1", id1 != -1)
    assertTrue("Register callback 2", id2 != -1)
    assertTrue("Callback ids are different", id1 != id2)

    const serializer = SerializerBase.hold(createSerializer)
    assertEquals("Call callback 1", 1001, callCallback(id1, serializer.asArray(), serializer.length()))
    assertEquals("Call callback 2", 1002, callCallback(id2, serializer.asArray(), serializer.length()))
// TODO: Fix the tests according to the latest callback changes
//     assertThrows("Call disposed callback 1", () => { callCallback(id1, serializer.asArray(), serializer.length()) })
//     assertThrows("Call disposed callback 2", () => { callCallback(id2, serializer.asArray(), serializer.length()) })
    serializer.release()
}

function checkWriteFunction() {
    const s = SerializerBase.hold(createSerializer)
    s.writeFunction((value: number, flag: boolean) => flag ? value + 10 : value - 10)
    // TBD: id is small number
    const id = s.asArray()[0]
    s.release()
    const args = SerializerBase.hold(createSerializer)
    args.writeNumber(20)
    args.writeBoolean(true)
    // TBD: callCallback() result should be 30
    assertEquals("Write function", 42, callCallback(id, args.asArray(), args.length()))
    args.release()
}

function checkButton() {
    startNativeTest(checkButton.name, CALL_GROUP_LOG)

    let peer = ArkButtonPeer.create(ArkUINodeType.Button)

    checkResult("width", () => peer.widthAttribute("42%"),
        "width({.type=1, .value=42.000000, .unit=3, .resource=0})")
    checkResult("height", () => peer.heightAttribute({ id: 43, bundleName: "MyApp", moduleName: "MyApp" }),
        "height({.type=2, .value=0.000000, .unit=1, .resource=43})")

    checkResult("bindSheet", () =>
        peer.bindSheetAttribute(false, () => { }, {
            title: {
                title: { id: 43, type: 2000, bundleName: "MyApp", moduleName: "MyApp", params: ["param1", "param2"] }
            }
        }),
        `bindSheet({.tag=ARK_TAG_OBJECT, .value=false}, {.resource={.resourceId=0, .hold=0, .release=0}, .call=0}, {.tag=ARK_TAG_OBJECT, .value={.backgroundColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .onAppear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onDisappear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillAppear={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillDisappear={.tag=ARK_TAG_UNDEFINED, .value={}}, .height={.tag=ARK_TAG_UNDEFINED, .value={}}, .dragBar={.tag=ARK_TAG_UNDEFINED, .value={}}, .maskColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .detents={.tag=ARK_TAG_UNDEFINED, .value={}}, .blurStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .showClose={.tag=ARK_TAG_UNDEFINED, .value={}}, .preferType={.tag=ARK_TAG_UNDEFINED, .value={}}, .title={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.title={.selector=1, .value1={.bundleName={.chars="MyApp", .length=5}, .moduleName={.chars="MyApp", .length=5}, .id={.tag=102, .i32=43}, .params={.tag=ARK_TAG_OBJECT, .value={.array=allocArray<Ark_CustomObject, 2>({{{.kind="ErrorAny"}, {.kind="ErrorAny"}}}), .length=2}}, .type={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=2000}}}}, .subtitle={.tag=ARK_TAG_UNDEFINED, .value={}}}}}, .shouldDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWillSpringBackWhenDismiss={.tag=ARK_TAG_UNDEFINED, .value={}}, .enableOutsideInteractive={.tag=ARK_TAG_UNDEFINED, .value={}}, .width={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderWidth={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderColor={.tag=ARK_TAG_UNDEFINED, .value={}}, .borderStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, .shadow={.tag=ARK_TAG_UNDEFINED, .value={}}, .onHeightDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .mode={.tag=ARK_TAG_UNDEFINED, .value={}}, .scrollSizeMode={.tag=ARK_TAG_UNDEFINED, .value={}}, .onDetentsDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .onWidthDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .onTypeDidChange={.tag=ARK_TAG_UNDEFINED, .value={}}, .uiContext={.tag=ARK_TAG_UNDEFINED, .value={}}, .keyboardAvoidMode={.tag=ARK_TAG_UNDEFINED, .value={}}}})`
    )
    checkResult("type", () => peer.typeAttribute(1), "type(Ark_ButtonType(1))")
    checkResult("labelStyle", () => peer.labelStyleAttribute({ maxLines: 3 }),
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=3}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
    checkResult("labelStyle2", () => peer.labelStyleAttribute({}),
        "labelStyle({.overflow={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxLines={.tag=ARK_TAG_UNDEFINED, .value={}}, .minFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .maxFontSize={.tag=ARK_TAG_UNDEFINED, .value={}}, .heightAdaptivePolicy={.tag=ARK_TAG_UNDEFINED, .value={}}, .font={.tag=ARK_TAG_UNDEFINED, .value={}}})")
    //nativeModule()._MeausureLayoutAndDraw(peer.peer.ptr)
    assertTrue("ButtonPeer finalizer", peer!.peer!.finalizer != nullptr)

    stopNativeTest(CALL_GROUP_LOG)
}

function checkCalendar() {
    startNativeTest(checkCalendar.name, CALL_GROUP_LOG)

    let peer = ArkCalendarPickerPeer.create(ArkUINodeType.CalendarPicker)
    checkResult("setCalendarOptions: hintRadius", () => peer.setCalendarPickerOptionsAttribute({ hintRadius: 79 }),
        `setCalendarPickerOptions({.tag=ARK_TAG_OBJECT, .value={.hintRadius={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.tag=102, .i32=79}}}, .selected={.tag=ARK_TAG_UNDEFINED, .value={}}}})`)
    const date = new Date()
    checkResult("setCalendarOptions: selected", () => peer.setCalendarPickerOptionsAttribute({ selected: date }),
        `setCalendarPickerOptions({.tag=ARK_TAG_OBJECT, .value={.hintRadius={.tag=ARK_TAG_UNDEFINED, .value={}}, .selected={.tag=ARK_TAG_OBJECT, .value=${date.getTime()}}}})`)
    checkResult("edgeAlign1", () => peer.edgeAlignAttribute(2, { dx: 5, dy: 6 }),
        `edgeAlign(Ark_CalendarAlign(2), {.tag=ARK_TAG_OBJECT, .value={.dx={.type=1, .value=5.000000, .unit=1, .resource=0}, .dy={.type=1, .value=6.000000, .unit=1, .resource=0}}})`)
    checkResult("edgeAlign2", () => peer.edgeAlignAttribute(2),
        `edgeAlign(Ark_CalendarAlign(2), {.tag=ARK_TAG_UNDEFINED, .value={}})`)

    stopNativeTest(CALL_GROUP_LOG)
}

function checkFormComponent() {
    startNativeTest(checkFormComponent.name, CALL_GROUP_LOG)

    let peer = ArkFormComponentPeer.create(ArkUINodeType.FormComponent)
    checkResult("size int", () => peer.sizeAttribute({ width: 5, height: 6 }),
        `size({.width={.tag=102, .i32=5}, .height={.tag=102, .i32=6}})`)
    checkResult("size float", () => peer.sizeAttribute({ width: 5.5, height: 6.789 }),
        `size({.width={.tag=103, .f32=5.50}, .height={.tag=103, .f32=6.78}})`)
    checkResult("size zero", () => peer.sizeAttribute({ width: 0.0, height: 0.0 }),
        `size({.width={.tag=102, .i32=0}, .height={.tag=102, .i32=0}})`)

    stopNativeTest(CALL_GROUP_LOG)
}

function checkCommon() {
    startNativeTest(checkCommon.name, CALL_GROUP_LOG)

    let peer = ArkCommonPeer.create(ArkUINodeType.Common)
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
        `backgroundBlurStyle(Ark_BlurStyle(0), {.tag=ARK_TAG_OBJECT, .value={.colorMode={.tag=ARK_TAG_OBJECT, .value=Ark_ThemeColorMode(0)}, .adaptiveColor={.tag=ARK_TAG_OBJECT, .value=Ark_AdaptiveColor(0)}, .scale={.tag=ARK_TAG_OBJECT, .value={.tag=102, .i32=1}}, .blurOptions={.tag=ARK_TAG_OBJECT, .value={.grayscale={.value0={.tag=102, .i32=1}, .value1={.tag=102, .i32=1}}}}, .policy={.tag=ARK_TAG_UNDEFINED, .value={}}, .inactiveColor={.tag=ARK_TAG_UNDEFINED, .value={}}}})`
    )

    checkResult("Test dragPreviewOptions numberBadge with number",
        () => peer.dragPreviewOptionsAttribute({ numberBadge: 10 }, { isMultiSelectionEnabled: true }),
        `dragPreviewOptions({.mode={.tag=ARK_TAG_UNDEFINED, .value={}}, .modifier={.tag=ARK_TAG_UNDEFINED, .value={}}, .numberBadge={.tag=ARK_TAG_OBJECT, .value={.selector=1, .value1={.tag=102, .i32=10}}}}, {.tag=ARK_TAG_OBJECT, .value={.isMultiSelectionEnabled={.tag=ARK_TAG_OBJECT, .value=true}, .defaultAnimationBeforeLifting={.tag=ARK_TAG_UNDEFINED, .value={}}}})`
    )

    checkResult("Test dragPreviewOptions numberBadge with boolean",
        () => peer.dragPreviewOptionsAttribute({ numberBadge: true }, { defaultAnimationBeforeLifting: false }),
        `dragPreviewOptions({.mode={.tag=ARK_TAG_UNDEFINED, .value={}}, .modifier={.tag=ARK_TAG_UNDEFINED, .value={}}, .numberBadge={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0=true}}}, {.tag=ARK_TAG_OBJECT, .value={.isMultiSelectionEnabled={.tag=ARK_TAG_UNDEFINED, .value={}}, .defaultAnimationBeforeLifting={.tag=ARK_TAG_OBJECT, .value=false}}})`
    )

    stopNativeTest(CALL_GROUP_LOG)
}

function checkOverloads() {
    startNativeTest(checkOverloads.name, CALL_GROUP_LOG)

    class ArkSideBarContainerComponentTest extends ArkSideBarContainerComponent {
        constructor(peer: ArkSideBarContainerPeer) {
            super()
            this.peer = peer
        }

        override checkPriority(name: string) {
            return true
        }
    }

    const peer = ArkSideBarContainerPeer.create(ArkUINodeType.SideBarContainer)
    const component = new ArkSideBarContainerComponentTest(peer)
    checkResult("Test number implementation for SideBarContainer.minSideBarWidth",
        () => component.minSideBarWidth(11),
        `minSideBarWidth({.tag=102, .i32=11})`
    )
    checkResult("Test string implementation for SideBarContainer.minSideBarWidth",
        () => component.minSideBarWidth("42%"),
        `minSideBarWidth({.type=1, .value=42.000000, .unit=3, .resource=0})`
    )

    stopNativeTest(CALL_GROUP_LOG)
}

function checkNavigation() {
    startNativeTest(checkNavigation.name, CALL_GROUP_LOG)
    let peer = ArkNavigationPeer.create(ArkUINodeType.Navigation)
    checkResult("backButtonIcon", () => peer.backButtonIconAttribute("attr"),
        `backButtonIcon({.selector=0, .value0={.chars="attr", .length=4}})`)
    stopNativeTest(CALL_GROUP_LOG)
}

function checkTabContent() {
    startNativeTest(checkTabContent.name, CALL_GROUP_LOG)

    let peer = ArkTabContentPeer.create(ArkUINodeType.TabContent)
    const subTabBarStyle: SubTabBarStyle = new SubTabBarStyle("ContentResource").id("subId")
    assertEquals("SubTabBarStyle content", "ContentResource", subTabBarStyle._content)
    assertEquals("SubTabBarStyle id", "subId", subTabBarStyle._id)

    checkResult("new SubTabBarStyle()",
        () => peer.tabBar1Attribute(subTabBarStyle),
        `tabBar({.selector=0, .value0={._content={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.selector=0, .value0={.chars="ContentResource", .length=15}}}}, ._indicator={.tag=ARK_TAG_UNDEFINED, .value={}}, ._selectedMode={.tag=ARK_TAG_UNDEFINED, .value={}}, ._board={.tag=ARK_TAG_UNDEFINED, .value={}}, ._labelStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, ._padding={.tag=ARK_TAG_UNDEFINED, .value={}}, ._id={.tag=ARK_TAG_OBJECT, .value={.chars="subId", .length=5}}}})`)
    checkResult("SubTabBarStyle.of()",
        () => peer.tabBar1Attribute(SubTabBarStyle.of("content2")),
        `tabBar({.selector=0, .value0={._content={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.selector=0, .value0={.chars="content2", .length=8}}}}, ._indicator={.tag=ARK_TAG_UNDEFINED, .value={}}, ._selectedMode={.tag=ARK_TAG_UNDEFINED, .value={}}, ._board={.tag=ARK_TAG_UNDEFINED, .value={}}, ._labelStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, ._padding={.tag=ARK_TAG_UNDEFINED, .value={}}, ._id={.tag=ARK_TAG_UNDEFINED, .value={}}}})`)

    const bottomTabBarStyle: BottomTabBarStyle = new BottomTabBarStyle("Icon", "Text").padding(10).id("bottomId")
    assertEquals("BottomTabBarStyle icon", "Icon", bottomTabBarStyle._icon)
    assertEquals("BottomTabBarStyle text", "Text", bottomTabBarStyle._text)
    assertEquals("BottomTabBarStyle id", "bottomId", bottomTabBarStyle._id)
    assertEquals("BottomTabBarStyle padding", 10, bottomTabBarStyle._padding)

    checkResult("new BottomTabBarStyle()",
        () => peer.tabBar1Attribute(bottomTabBarStyle),
        `tabBar({.selector=0, .value0={._content={.tag=ARK_TAG_UNDEFINED, .value={}}, ._indicator={.tag=ARK_TAG_UNDEFINED, .value={}}, ._selectedMode={.tag=ARK_TAG_UNDEFINED, .value={}}, ._board={.tag=ARK_TAG_UNDEFINED, .value={}}, ._labelStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, ._padding={.tag=ARK_TAG_OBJECT, .value={.top={.tag=ARK_TAG_UNDEFINED, .value={}}, .end={.tag=ARK_TAG_UNDEFINED, .value={}}, .bottom={.tag=ARK_TAG_UNDEFINED, .value={}}, .start={.tag=ARK_TAG_UNDEFINED, .value={}}}}, ._id={.tag=ARK_TAG_OBJECT, .value={.chars="bottomId", .length=8}}}})`
    )

    stopNativeTest(CALL_GROUP_LOG)
}

function checkCanvasRenderingContext2D() {
    startNativeTest(checkCanvasRenderingContext2D.name, CALL_GROUP_LOG)

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

    stopNativeTest(CALL_GROUP_LOG)
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
        let serializer = SerializerBase.hold(createSerializer)
        serializer.writeNumber(0)
        let data = serializer.asArray()
        module._TestPerfNumberWithArray(data, data.length)
        serializer.release()
    }
    passed = performance.now() - start
    console.log(`ARRAY: ${passed}ms for ${Math.round(count)} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

function checkPerf2(count: number) {
    let peer = ArkButtonPeer.create(ArkUINodeType.Button)
    let start = performance.now()
    for (let i = 0; i < count; i++) {
        peer.backdropBlurAttribute(i, i % 2 == 0 ? undefined : { grayscale: [1, 2] })
    }
    let passed = performance.now() - start
    console.log(`backdropBlur: ${Math.round(passed)}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}

function checkPerf3(count: number) {
    let peer = ArkButtonPeer.create(ArkUINodeType.Button)
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
    const serializer = SerializerBase.hold(createSerializer)
    serializer.writeInt32(1) //nodeId
    serializer.writeString("testString") //arg1
    serializer.writeNumber(22) //arg2
    nativeModule()._Test_TextPicker_OnAccept(serializer.asArray(), serializer.length())
    serializer.release()

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
    const serializer = SerializerBase.hold(createSerializer)
    const eventStart = { index: 11, itemIndexInGroup: 1 }
    const eventEnd = { index: 22 }
    serializer.writeInt32(1) //nodeId
    serializer.writeVisibleListContentInfo(eventStart);
    serializer.writeVisibleListContentInfo(eventEnd);
    nativeModule()._Test_List_OnScrollVisibleContentChange(serializer.asArray(), serializer.length())
    serializer.release()

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
    const serializer = SerializerBase.hold(createSerializer)
    const eventParam: TouchTestInfo[] = [
        {
            windowX: 10, windowY: 11, parentX: 12, parentY: 13, x: 14, y: 15, id: "one",
            rect: { x: 100, y: 101, width: 102, height: 103 }
        },
        {
            windowX: 20, windowY: 21, parentX: 22, parentY: 23, x: 24, y: 25, id: "two",
            rect: { x: 200, y: 201, width: 202, height: 203 }
        },
        {
            windowX: 30, windowY: 31, parentX: 32, parentY: 33, x: 34, y: 35, id: "three",
            rect: { x: 300, y: 301, width: 302, height: 303 }
        }]
    serializer.writeInt32(1) // nodeId
    serializer.writeInt8(3)  // RuntimeType.OBJECT
    serializer.writeInt32(eventParam.length);
    for (let i = 0; i < eventParam.length; i++) {
        serializer.writeTouchTestInfo(eventParam[i]);
    }
    nativeModule()._Test_Common_OnChildTouchTest(serializer.asArray(), serializer.length())
    serializer.release()

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

function checkNativeCallback() {
    startNativeTest(checkNativeCallback.name, CALL_GROUP_LOG)

    const id1 = wrapCallback((args: Uint8Array, length: number): number => {
        return 123456
    })
    assertEquals("NativeCallback without args", 123456, nativeModule()._TestCallIntNoArgs(id1))
// TODO: Fix the tests according to the latest callback changes
//     assertThrows("NativeCallback without args called again", () => { callCallback(id1, new Uint8Array([]), 0) })
//     assertThrows("NativeCallback without args called again from native", () => { nativeModule()._TestCallIntNoArgs(id1) })

    const id2 = wrapCallback((args: Uint8Array, length: number): number => {
        const args32 = new Int32Array(args.buffer)
        return args32.reduce((acc, val) => acc + val, 0)
    })
    const arr2 = new Int32Array([100, 200, 300, -1000])
    assertEquals("NativeCallback Int32Array sum", -400, nativeModule()._TestCallIntIntArraySum(id2, arr2, arr2.length))

    const id3 = wrapCallback((args: Uint8Array, length: number): number => {
        const args32 = new Int32Array(args.buffer)
        for (var i = 1; i < args32.length; i++) {
            args32[i] += args32[i - 1]
        }
        return 0
    })
    const arr3 = new Int32Array([100, 200, 300, -1000])
    nativeModule()._TestCallVoidIntArrayPrefixSum(id3, arr3, arr3.length)
    assertEquals("NativeCallback Int32Array PrefixSum [0]", 100, arr3[0])
    assertEquals("NativeCallback Int32Array PrefixSum [1]", 300, arr3[1])
    assertEquals("NativeCallback Int32Array PrefixSum [2]", 600, arr3[2])
    assertEquals("NativeCallback Int32Array PrefixSum [3]", -400, arr3[3])

    const start = performance.now()
    const id4 = wrapCallback((args: Uint8Array, length: number): number => {
        const args32 = new Int32Array(args.buffer)
        args32[1]++
        if (args32[0] + args32[1] < args32[2]) {
            return nativeModule()._TestCallIntRecursiveCallback(id3 + 1, args, args.length)
        }
        return 1
    }, false)
    assertEquals("NativeCallback prepare recursive callback test", id4, id3 + 1)
    const depth = 500
    const count = 100
    for (var i = 0; i < count; i++) {
        const arr4 = new Int32Array([0, 0, depth])
        nativeModule()._TestCallIntRecursiveCallback(id4, new Uint8Array(arr4.buffer), arr4.byteLength)
        if (i == 0) {
            assertEquals("NativeCallback Recursive [0]", Math.ceil(depth / 2), arr4[0])
            assertEquals("NativeCallback Recursive [1]", Math.floor(depth / 2), arr4[1])
        }
    }
    const passed = performance.now() - start
    console.log(`recursive native callback: ${Math.round(passed)}ms for ${depth * count} callbacks, ${Math.round(passed / (depth * count) * 1000000)}ms per 1M callbacks`)

    const id5 = wrapCallback((args: Uint8Array, length: number): number => {
        return args.reduce((acc, val) => acc + val, 0)
    }, false)
    nativeModule()._TestCallIntMemory(id5, 1000)

    stopNativeTest(CALL_GROUP_LOG)
}

function main() {
    checkSerdeBaseLength()
    checkSerdeBaseText()
    checkSerdeBasePrimitive()
    checkSerdeBaseCustomObject()

    checkPerf2(5 * 1000 * 1000)
    checkPerf3(5 * 1000 * 1000)

    startPerformanceTest()
    if (recordCallLog)
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
    checkNativeCallback()

    checkTabContent()
    checkCanvasRenderingContext2D()

    if (recordCallLog)
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

#include <string>
#include <array>
#include <memory>
#include <cassert>
#include <cstddef>

namespace OHOS::Ace::NG::GeneratedModifier {
    EXTERN_C IDLIZE_API_EXPORT const GENERATED_ArkUIAnyAPI* GENERATED_GetArkAnyAPI(GENERATED_Ark_APIVariantKind kind, int version);
}

const GENERATED_ArkUINodeModifiers* GetNodeModifiers() {
    static const auto val = (const GENERATED_ArkUIFullNodeAPI*)(OHOS::Ace::NG::GeneratedModifier::GENERATED_GetArkAnyAPI(GENERATED_FULL,GENERATED_ARKUI_FULL_API_VERSION));
    return val->getNodeModifiers();
}

const GENERATED_ArkUIAccessors* GetAccessors() {
    static const auto val = (const GENERATED_ArkUIFullNodeAPI*)(OHOS::Ace::NG::GeneratedModifier::GENERATED_GetArkAnyAPI(GENERATED_FULL,GENERATED_ARKUI_FULL_API_VERSION));
    return val->getAccessors();
}

const GENERATED_ArkUIBasicNodeAPI* GetBasicNodeApi() {
    static const auto val = (const GENERATED_ArkUIBasicNodeAPI*)OHOS::Ace::NG::GeneratedModifier::GENERATED_GetArkAnyAPI(GENERATED_BASIC, GENERATED_ARKUI_BASIC_NODE_API_VERSION);
    return val;
}

static const std::size_t buffer_size = 1024 * 1024; // 1 MB
static std::size_t offset = 0;
alignas(std::max_align_t) static char buffer[buffer_size];

template <typename T, std::size_t size>
T* allocArray(const std::array<T, size>& ref) {
  std::size_t space = sizeof(buffer) - offset;
  void* ptr = buffer + offset;
  void* aligned_ptr = std::align(alignof(T), sizeof(T) * size, ptr, space);
  assert(aligned_ptr != nullptr && "Insufficient space or alignment failed!");
  offset = (char*)aligned_ptr + sizeof(T) * size - buffer;
  T* array = reinterpret_cast<T*>(aligned_ptr);
  for (size_t i = 0; i < size; ++i) {
    new (&array[i]) T(ref[i]);
  }
  return array;
}

${callGroupLog}
`

    if (callGroupLog.length > 0) {
        console.log(callLogCppCode)
        mkdirSync('./generated/call_log', { recursive: true })
        writeFileSync('./generated/call_log/main.cpp', callLogCppCode)
    }

    // Report in error code.
    checkTestFailures()
}

main()
