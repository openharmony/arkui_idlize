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
import { SerializerBase } from "@arkoala/arkui/SerializerBase"
import { DeserializerBase } from "@arkoala/arkui/DeserializerBase"
import { ArkButtonPeer } from "@arkoala/arkui/ArkButtonPeer"
import { ArkCommonPeer } from "@arkoala/arkui/ArkCommonPeer"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/ArkCalendarPickerPeer"
import { ArkFormComponentPeer } from "@arkoala/arkui/ArkFormComponentPeer"
import { ArkNavigationPeer } from "@arkoala/arkui/ArkNavigationPeer"
import { ArkParticlePeer } from "@arkoala/arkui/ArkParticlePeer"
import { ArkSideBarContainerPeer } from "@arkoala/arkui/ArkSidebarPeer"
import { ArkSideBarContainerComponent } from "@arkoala/arkui/ArkSidebar"
import { ArkTabContentPeer } from "@arkoala/arkui/ArkTabContentPeer"
import { SubTabBarStyle } from "@arkoala/arkui/ArkSubTabBarStyleMaterialized"
import { ArkUINodeType } from "@arkoala/arkui/ArkUINodeType"
import { startPerformanceTest } from "@arkoala/arkui/test_performance"
import { testString1000 } from "@arkoala/arkui/test_data"

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
    assertEquals
} from "./test_utils"
import { nativeModule } from "@arkoala/arkui//NativeModule"

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
    const ser = new SerializerBase(12)
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
    ser.close()
}

function checkSerdeBaseText() {
    const ser = new SerializerBase(12)
    const text = "test text serialization/deserialization"
    ser.writeString(text)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readString", des.readString(), text)
    ser.close()
}

function checkSerdeBasePrimitive() {
    const ser = new SerializerBase(12)
    ser.writeNumber(10)
    ser.writeNumber(10.5)
    ser.writeNumber(undefined)
    const des = new DeserializerBase(ser.asArray().buffer, ser.length())
    checkSerdeResult("DeserializerBase.readNumber, int", des.readNumber(), 10)
    checkSerdeResult("DeserializerBase.readNumber, float", des.readNumber(), 10.5)
    checkSerdeResult("DeserializerBase.readNumber, undefined", des.readNumber(), undefined)
    ser.close()
}

function checkSerdeBaseCustomObject() {
    const ser = new SerializerBase(12)
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

function checkButton() {
    let peer = new ArkButtonPeer(ArkUINodeType.Button)

    checkResult("width", () => peer.widthAttribute("42%"),
        "width(Length {value=42.000000, unit=%, resource=0})")
    checkResult("height", () => peer.heightAttribute({ id: 43, bundleName: "MyApp", moduleName: "MyApp" }),
        "height(Length {value=0.000000, unit=vp, resource=43})")
    checkResult("bindSheet", () =>
        peer.bindSheetAttribute(false, () => {}, {
            title: {
                title: { id: 43, bundleName: "MyApp", moduleName: "MyApp" }
            }
        }),
        `bindSheet(false, "Function 42", {backgroundColor: undefined, title: {title: Custom kind=NativeErrorResource id=0, subtitle: undefined}, detents: undefined})`
    )
    checkResult("type", () => peer.typeAttribute(1), "type(1)")
    checkResult("labelStyle", () => peer.labelStyleAttribute({maxLines: 3}),
        "labelStyle({maxLines: 3})")
    checkResult("labelStyle2", () => peer.labelStyleAttribute({}),
        "labelStyle({maxLines: undefined})")
}

function checkCalendar() {
    let peer = new ArkCalendarPickerPeer(ArkUINodeType.CalendarPicker)
    checkResult("edgeAlign1", () => peer.edgeAlignAttribute(2, {dx: 5, dy: 6}),
        `edgeAlign(2, {dx: Length {value=5.000000, unit=vp, resource=0}, dy: Length {value=6.000000, unit=vp, resource=0}})`)
    checkResult("edgeAlign2", () => peer.edgeAlignAttribute(2),
        `edgeAlign(2, undefined)`)
}

function checkFormComponent() {
    let peer = new ArkFormComponentPeer(ArkUINodeType.FormComponent)
    checkResult("size int", () => peer.sizeAttribute({width: 5, height: 6}),
        `size({width: 5, height: 6})`)
    checkResult("size float", () => peer.sizeAttribute({width: 5.5, height: 6.789}),
        `size({width: 5.50, height: 6.78})`)
    checkResult("size zero", () => peer.sizeAttribute({width: 0.0, height: 0.0}),
        `size({width: 0, height: 0})`)
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
        `backgroundBlurStyle(0, {colorMode: 0, adaptiveColor: 0, scale: 1, blurOptions: {grayscale: [1, 1]}})`
    )

    checkResult("Test dragPreviewOptions numberBadge with number",
        () => peer.dragPreviewOptionsAttribute({numberBadge: 10}, {isMultiSelectionEnabled: true}),
        `dragPreviewOptions({numberBadge: 10}, {isMultiSelectionEnabled: true, defaultAnimationBeforeLifting: undefined})`
    )

    checkResult("Test dragPreviewOptions numberBadge with boolean",
        () => peer.dragPreviewOptionsAttribute({numberBadge: true}, {defaultAnimationBeforeLifting: false}),
        `dragPreviewOptions({numberBadge: true}, {isMultiSelectionEnabled: undefined, defaultAnimationBeforeLifting: false})`
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
        `minSideBarWidth(11)`
    )
    checkResult("Test string implementation for SideBarContainer.minSideBarWidth",
        () => component.minSideBarWidth("42%"),
        `minSideBarWidth("42%")`
    )
}

function checkNavigation() {
    let peer = new ArkNavigationPeer(ArkUINodeType.Navigation)
    checkResult("backButtonIcon", () => peer.backButtonIconAttribute("attr"),
        `backButtonIcon("attr")`)
}

function checkParticle() {
    let peer = new ArkParticlePeer(ArkUINodeType.Particle)
    checkResult("emitter", () => peer.emitterAttribute([]), `emitter([])`)
    checkResult("emitter", () => peer.emitterAttribute([{index: 1, emitRate: 2}, {index: 3, emitRate: 4}]),
        `emitter([{index: 1, emitRate: 2}, {index: 3, emitRate: 4}])`)
}

function checkTabContent() {
    let peer = new ArkTabContentPeer(ArkUINodeType.TabContent)
    let subTabBarStyle: SubTabBarStyle| undefined = undefined

    checkResult("new SubTabBarStyle()",
        () => peer.tabBar_SubTabBarStyleBottomTabBarStyleAttribute(subTabBarStyle = new SubTabBarStyle("abc")),
        `new SubTabBarStyle("abc")[return (void*) 100]tabBar("Materialized 0x2a")`)
    assertEquals("new SubTabBarStyle() ptr", 100, subTabBarStyle!.peer!.ptr) // constructor ptr is 100

    checkResult("new SubTabBarStyle()",
        () => peer.tabBar_SubTabBarStyleBottomTabBarStyleAttribute(subTabBarStyle = SubTabBarStyle.of_ResourceStr("ABC")),
        `of("ABC")[return (void*) 200]tabBar("Materialized 0x2a")`)
    assertEquals("SubTabBarStyle.of_ResourceStr() ptr", 200, subTabBarStyle!.peer!.ptr) // static method ptr is 200
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
        let serializer = new SerializerBase(5)
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

checkSerdeBaseLength()
checkSerdeBaseText()
checkSerdeBasePrimitive()
checkSerdeBaseCustomObject()

checkPerf2(200 * 1000)
checkPerf3(200 * 1000)

startPerformanceTest()

startNativeLog(CALL_GROUP_LOG)
checkButton()
checkCalendar()
//checkDTS()
checkFormComponent()
checkCommon()
checkOverloads()
checkNavigation()
checkParticle()
stopNativeLog(CALL_GROUP_LOG)

const callLog = getNativeLog(CALL_GROUP_LOG)
if (callLog.length > 0) {
    console.log(`
#include "arkoala_api.h"

int main(int argc, const char** argv) {
${callLog}
  return 0;
}`)
}
checkTabContent()

// Report in error code.
checkTestFailures()
