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
import { Serializer } from "@arkoala/arkui/peers/Serializer"
import { Deserializer } from "@arkoala/arkui/peers/Deserializer"
import { MaterializedBase } from "@arkoala/arkui/MaterializedBase"
import { checkArkoalaCallbacks } from "@arkoala/arkui/peers/CallbacksChecker"
import { ArkButtonPeer } from "@arkoala/arkui/peers/ArkButtonPeer"
import { ArkCommonPeer } from "@arkoala/arkui/peers/ArkCommonPeer"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/peers/ArkCalendarPickerPeer"
import { ArkFormComponentPeer } from "@arkoala/arkui/peers/ArkFormComponentPeer"
import { ArkSideBarContainerPeer } from "@arkoala/arkui/peers/ArkSidebarPeer"
import { ArkSideBarContainerComponent } from "@arkoala/arkui/ArkSidebar"
import { ArkTabContentPeer } from "@arkoala/arkui/peers/ArkTabContentPeer"
import { SubTabBarStyle } from "@arkoala/arkui/ArkSubTabBarStyleBuilder"
import { BottomTabBarStyle } from "@arkoala/arkui/ArkBottomTabBarStyleBuilder"
// TBD: It needs to be possible to use CanvasRenderingContext2D without import
import { CanvasRenderingContext2D as CanvasRenderingContext2DImpl, CanvasRenderingContext2DInternal } from "@arkoala/arkui/ArkCanvasRenderingContext2DMaterialized"
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
    startNativeTest,
    stopNativeTest,
} from "./test_utils"
import { nativeModule } from "@koalaui/arkoala"
import { mkdirSync, writeFileSync } from "fs"
import { CallbackKind } from "@arkoala/arkui/peers/CallbackKind"
import { ResourceId, ResourceHolder } from "@koalaui/interop"

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

function checkSerdeLength() {
    const ser = Serializer.hold()
    ser.writeLength("10px")
    ser.writeLength("11vp")
    ser.writeLength("12%")
    ser.writeLength("13lpx")
    ser.writeLength(14)
    const des = new Deserializer(ser.asArray().buffer, ser.length())
    checkSerdeResult("Deserializer.readLength, unit px", des.readLength(), "10px")
    checkSerdeResult("Deserializer.readLength, unit vp", des.readLength(), "11vp")
    checkSerdeResult("Deserializer.readLength, unit %", des.readLength(), "12%")
    checkSerdeResult("Deserializer.readLength, unit lpx", des.readLength(), "13lpx")
    checkSerdeResult("Deserializer.readLength, number", des.readLength(), 14)
    ser.release()
}

function checkSerdeText() {
    const ser = Serializer.hold()
    const text = "test text serialization/deserialization"
    ser.writeString(text)
    const des = new Deserializer(ser.asArray().buffer, ser.length())
    checkSerdeResult("Deserializer.readString", des.readString(), text)
    ser.release()
}

function checkSerdePrimitive() {
    const ser = Serializer.hold()
    ser.writeNumber(10)
    ser.writeNumber(10.5)
    ser.writeNumber(undefined)
    const des = new Deserializer(ser.asArray().buffer, ser.length())
    checkSerdeResult("Deserializer.readNumber, int", des.readNumber(), 10)
    checkSerdeResult("Deserializer.readNumber, float", des.readNumber(), 10.5)
    checkSerdeResult("Deserializer.readNumber, undefined", des.readNumber(), undefined)
    ser.release()
}

function checkSerdeCustomObject() {
    const ser = Serializer.hold()
    const date = new Date(2024, 11, 28)
    ser.writeCustomObject("Date", date)
    const des = new Deserializer(ser.asArray().buffer, ser.length())
    checkSerdeResult("Deserializer.readCustomObject, Date",
        JSON.stringify(date),
        JSON.stringify(des.readCustomObject("Date") as Date))
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
        `addChild(0x${ptr}, 0x${childPtr1})markDirty(0x${ptr}, 32)`
    )

    nativeModule()._AddChild(ptr, childPtr2)
    checkResult("BasicNodeAPI removeChild",
        () => nativeModule()._RemoveChild(ptr, childPtr2),
        `removeChild(0x${ptr}, 0x${childPtr2})markDirty(0x${ptr}, 32)`
    )

    checkResult("BasicNodeAPI insertChildAfter",
        () => nativeModule()._InsertChildAfter(ptr, childPtr2, childPtr1),
        `insertChildAfter(0x${ptr}, 0x${childPtr2}, 0x${childPtr1})markDirty(0x${ptr}, 32)`
    )
    nativeModule()._RemoveChild(ptr, childPtr2)

    checkResult("BasicNodeAPI insertChildBefore",
        () => nativeModule()._InsertChildBefore(ptr, childPtr2, childPtr1),
        `insertChildBefore(0x${ptr}, 0x${childPtr2}, 0x${childPtr1})markDirty(0x${ptr}, 32)`
    )
    nativeModule()._RemoveChild(ptr, childPtr2)

    checkResult("BasicNodeAPI insertChildAt",
        () => nativeModule()._InsertChildAt(ptr, childPtr2, 0),
        `insertChildAt(0x${ptr}, 0x${childPtr2}, 0)markDirty(0x${ptr}, 32)`
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
        `convertLengthMetricsUnit(1.23, 10, 0)`
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

    const serializer = Serializer.hold()
    assertEquals("Call callback 1", 1001, callCallback(id1, serializer.asArray(), serializer.length()))
    assertEquals("Call callback 2", 1002, callCallback(id2, serializer.asArray(), serializer.length()))
// TODO: Fix the tests according to the latest callback changes
//     assertThrows("Call disposed callback 1", () => { callCallback(id1, serializer.asArray(), serializer.length()) })
//     assertThrows("Call disposed callback 2", () => { callCallback(id2, serializer.asArray(), serializer.length()) })
    serializer.release()
}

function createDefaultWriteCallback(kind: CallbackKind, callback: object) {
    return (serializer: Serializer) => {
        return serializer.holdAndWriteCallback(callback,
            nativeModule()._TestGetManagedHolder(),
            nativeModule()._TestGetManagedReleaser(),
            nativeModule()._TestGetManagedCaller(kind),
        )
    }
}

function createDefaultWritePromiseVoid(kind: CallbackKind, then_: () => void, catch_: (err: string[])=>void) {
    return (serializer: Serializer) => {
        const promiseSerialized = serializer.holdAndWriteCallbackForPromiseVoid(
            nativeModule()._TestGetManagedHolder(),
            nativeModule()._TestGetManagedReleaser(),
            nativeModule()._TestGetManagedCaller(kind),
        )
        promiseSerialized[0].then(then_).catch(catch_)
        return promiseSerialized[1]
    }
}

function enqueueCallback(
    writeCallback: (serializer: Serializer) => ResourceId,
    readAndCallCallback: (deserializer: Deserializer) => void,
) {
    const serializer = Serializer.hold()
    const resourceId = writeCallback(serializer)
    /* imitate libace holding resource */
    nativeModule()._HoldArkoalaResource(resourceId)
    /* libace stored resource somewhere */
    const buffer = new Uint8Array(serializer.asArray().buffer.byteLength)
    const bufferLength = serializer.length()
    buffer.set(serializer.asArray())
    serializer.release()

    /* libace calls stored callback */
    const deserializer = new Deserializer(buffer.buffer, bufferLength)
    readAndCallCallback(deserializer)
    /* libace released resource */
    nativeModule()._ReleaseArkoalaResource(resourceId)
}

function checkTwoSidesCallback() {
    nativeModule()._TestSetArkoalaCallbackCaller()

    let callResult1 = "NOT_CALLED"
    let callResult2 = 0
    const call2Count = 100

    enqueueCallback(
        createDefaultWriteCallback(CallbackKind.Kind_Callback_Number_Void, (value: number): void => {
            callResult1 = `CALLED, value=${value}`
        }),
        (deserializer) => {
            const callback = deserializer.readCallback_Number_Void()
            callback(194)
        },
    )
    for (let i = 0; i < call2Count; i++) {
        enqueueCallback(
            createDefaultWriteCallback(CallbackKind.Kind_Callback_Void, (): void => {
                callResult2++
            }),
            (deserializer) => {
                const callback = deserializer.readCallback_Void()
                callback()
            },
        )
    }

    assertEquals("Callback 1 enqueued", "NOT_CALLED", callResult1)
    assertEquals(`Callback 2 enqueued ${call2Count} times`, 0, callResult2)
    checkArkoalaCallbacks()
    assertEquals("Callback 1 read&called", "CALLED, value=194", callResult1)
    assertEquals(`Callback 2 read&called ${call2Count} times`, call2Count, callResult2)
}

function checkTwoSidesPromise() {
    nativeModule()._TestSetArkoalaCallbackCaller()

    let result1 = "PENDING"
    let result2 = "PENDING"

    enqueueCallback(
        createDefaultWritePromiseVoid(CallbackKind.Kind_Callback_Opt_Array_String_Void, (): void => {
            result1 = "FULFILLED"
        }, (err: string[]): void => {
            result1 = `REJECTED: ${err.join(', ')}`
        }),
        (deserializer) => {
            const callback = deserializer.readCallback_Opt_Array_String_Void()
            callback(undefined)
        },
    )

    enqueueCallback(
        createDefaultWritePromiseVoid(CallbackKind.Kind_Callback_Opt_Array_String_Void, (): void => {
            result2 = "FULFILLED"
        }, (err: string[]): void => {
            result2 = `REJECTED: ${err.join(', ')}`
        }),
        (deserializer) => {
            const callback = deserializer.readCallback_Opt_Array_String_Void()
            callback(["err line 1", "err line 2"])
        },
    )

    assertEquals("Promise 1 enqueued", "PENDING", result1)
    assertEquals("Promise 2 enqueued", "PENDING", result2)
    checkArkoalaCallbacks()
    setTimeout(() => {// Promise-continuations are activated through an event-loop, so, we also need to defer our checks
        assertEquals("Promise 1 pumped", "FULFILLED", result1)
        assertEquals("Promise 2 pumped", "REJECTED: err line 1, err line 2", result2)
    }, 0)
}

function checkWriteFunction() {
    const s = Serializer.hold()
    s.writeFunction((value: number, flag: boolean) => flag ? value + 10 : value - 10)
    // TBD: id is small number
    const id = s.asArray()[0]
    s.release()
    const args = Serializer.hold()
    args.writeNumber(20)
    args.writeBoolean(true)
    // TBD: callCallback() result should be 30
    assertEquals("Write function", 42, callCallback(id, args.asArray(), args.length()))
    args.release()
}

function checkButton() {
    startNativeTest(checkButton.name, CALL_GROUP_LOG)

    let peer = ArkButtonPeer.create(ArkUINodeType.Button)

    const lastResourceId = ResourceHolder.instance().registerAndHold({})
    ResourceHolder.instance().release(lastResourceId)

    checkResult("width", () => peer.widthAttribute("42%"),
        "width({.type=1, .value=42, .unit=3, .resource=0})")
    checkResult("height", () => peer.heightAttribute({ id: 43, bundleName: "MyApp", moduleName: "MyApp" }),
        "height({.type=2, .value=0, .unit=1, .resource=43})")
    checkResult("background", () => peer.backgroundAttribute(() => {}, {align: 4}),
        `background({.resource={.resourceId=${lastResourceId+1}, .hold=0, .release=0}, .call=0}, {.tag=ARK_TAG_OBJECT, .value={.align={.tag=ARK_TAG_OBJECT, .value=Ark_Alignment(4)}}})`)
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
        `edgeAlign(Ark_CalendarAlign(2), {.tag=ARK_TAG_OBJECT, .value={.dx={.type=1, .value=5, .unit=1, .resource=0}, .dy={.type=1, .value=6, .unit=1, .resource=0}}})`)
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
        `size({.width={.tag=103, .f32=5.5}, .height={.tag=103, .f32=6.789}})`)
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
            this.setPeer(peer)
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
        `minSideBarWidth({.type=1, .value=42, .unit=3, .resource=0})`
    )

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
        `tabBar({.selector=0, .value0={._content={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.chars="ContentResource", .length=15}}}, ._indicator={.tag=ARK_TAG_UNDEFINED, .value={}}, ._selectedMode={.tag=ARK_TAG_UNDEFINED, .value={}}, ._board={.tag=ARK_TAG_UNDEFINED, .value={}}, ._labelStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, ._padding={.tag=ARK_TAG_UNDEFINED, .value={}}, ._id={.tag=ARK_TAG_OBJECT, .value={.chars="subId", .length=5}}}})`)
    checkResult("SubTabBarStyle.of()",
        () => peer.tabBar1Attribute(SubTabBarStyle.of("content2")),
        `tabBar({.selector=0, .value0={._content={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.chars="content2", .length=8}}}, ._indicator={.tag=ARK_TAG_UNDEFINED, .value={}}, ._selectedMode={.tag=ARK_TAG_UNDEFINED, .value={}}, ._board={.tag=ARK_TAG_UNDEFINED, .value={}}, ._labelStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, ._padding={.tag=ARK_TAG_UNDEFINED, .value={}}, ._id={.tag=ARK_TAG_UNDEFINED, .value={}}}})`)

    const bottomTabBarStyle: BottomTabBarStyle = new BottomTabBarStyle("Icon", "Text").padding(10).id("bottomId")
    assertEquals("BottomTabBarStyle icon", "Icon", bottomTabBarStyle._icon)
    assertEquals("BottomTabBarStyle text", "Text", bottomTabBarStyle._text)
    assertEquals("BottomTabBarStyle id", "bottomId", bottomTabBarStyle._id)
    assertEquals("BottomTabBarStyle padding", 10, bottomTabBarStyle._padding)

    checkResult("new BottomTabBarStyle()",
        () => peer.tabBar1Attribute(bottomTabBarStyle),
        `tabBar({.selector=0, .value0={._content={.tag=ARK_TAG_UNDEFINED, .value={}}, ._indicator={.tag=ARK_TAG_UNDEFINED, .value={}}, ._selectedMode={.tag=ARK_TAG_UNDEFINED, .value={}}, ._board={.tag=ARK_TAG_UNDEFINED, .value={}}, ._labelStyle={.tag=ARK_TAG_UNDEFINED, .value={}}, ._padding={.tag=ARK_TAG_OBJECT, .value={.selector=0, .value0={.selector=1, .value1={.type=1, .value=10, .unit=1, .resource=0}}}}, ._id={.tag=ARK_TAG_OBJECT, .value={.chars="bottomId", .length=8}}}})`
    )

    stopNativeTest(CALL_GROUP_LOG)
}

// Remove it when it is possible to use CanvasRenderingContext2D
// without explicitly importing it
export function unsafeCast<T>(value: unknown): T {
    return value as unknown as T
}

function checkCanvasRenderingContext2D() {
    startNativeTest(checkCanvasRenderingContext2D.name, CALL_GROUP_LOG)

    let canvasRenderingContext2D: CanvasRenderingContext2D | undefined = undefined

    checkResult("new CanvasRenderingContext2D()",
        () => canvasRenderingContext2D = unsafeCast<CanvasRenderingContext2D>(new CanvasRenderingContext2DImpl()),
        `new CanvasPath()[return (CanvasPathPeer*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]new CanvasRenderer()[return (CanvasRendererPeer*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]new CanvasRenderingContext2D({.tag=ARK_TAG_UNDEFINED, .value={}})[return (CanvasRenderingContext2DPeer*) 100]getFinalizer()[return fnPtr<KNativePointer>(dummyClassFinalizer)]`
    )

    checkResult("CanvasRenderingContext2D width",
        () => canvasRenderingContext2D!.width,
        `getWidth()`)

    checkResult("CanvasRenderingContext2D width",
        () => canvasRenderingContext2D!.height,
        `getHeight()`)

    assertEquals("CanvasRenderingContext2D width", 0, canvasRenderingContext2D!.width)
    assertEquals("CanvasRenderingContext2D height", 0, canvasRenderingContext2D!.height)

    checkResult("CanvasRenderingContext2D peer close()",
        () => (unsafeCast<MaterializedBase>(canvasRenderingContext2D)).getPeer()!.close(),
        `dummyClassFinalizer(0x64)`)

    const ctorPtr = BigInt(123)
    const serializer = new Serializer()
    serializer.writeCanvasRenderingContext2D(unsafeCast<CanvasRenderingContext2D>(CanvasRenderingContext2DInternal.fromPtr(ctorPtr)))
    const deserializer = new Deserializer(serializer.asArray().buffer, serializer.length())
    const materializedBase = deserializer.readCanvasRenderingContext2D() as unknown as MaterializedBase
    assertEquals("Deserializer readCanvasRenderingContext2D()", ctorPtr, materializedBase.getPeer()!.ptr)

    stopNativeTest(CALL_GROUP_LOG)
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
    const serializer = Serializer.hold()
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
    const serializer = Serializer.hold()
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
    const serializer = Serializer.hold()
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

function checkArrayBuffer() {
    checkResult("ArrayBuffer", () => {
        let buffer = new ArrayBuffer(256)
        let view = new DataView(buffer)
        view.setInt8(0, 42)
        view.setInt8(100, 37)
        nativeModule()._TestWithBuffer(buffer)
    }, "42 37")
}

function main() {
    // Place where mock of ACE is located.
    process.env.ACE_LIBRARY_PATH = __dirname + "/../../../native"

    // checkArrayBuffer()

    checkSerdeLength()
    checkSerdeText()
    checkSerdePrimitive()
    checkSerdeCustomObject()

    checkPerf2(5 * 1000 * 1000)
    checkPerf3(5 * 1000 * 1000)

    startPerformanceTest()
    if (recordCallLog)
        startNativeLog(CALL_GROUP_LOG)

    checkNodeAPI()
    checkCallback()
    checkTwoSidesCallback()
    checkTwoSidesPromise()
    checkWriteFunction()
    checkButton()
    checkCalendar()
    //checkDTS()
    checkFormComponent()
    checkCommon()
    checkOverloads()
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
    // Activate on the next event-loop iteration, which is required for Promises continuations activation
    setTimeout(checkTestFailures, 0)
}

main()
