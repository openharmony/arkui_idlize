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

import { ArkButtonPeer } from "@arkoala/arkui/ArkButtonPeer"
import { ArkCommonPeer } from "@arkoala/arkui/ArkCommonPeer"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/ArkCalendarPickerPeer"
import { ArkFormComponentPeer } from "@arkoala/arkui/ArkFormComponentPeer"
import { ArkNavigationPeer } from "@arkoala/arkui/ArkNavigationPeer"
import { ArkUINodeType } from "@arkoala/arkui/ArkUINodeType"

import {
    clearNativeLog,
    getNativeLog,
    reportTestFailures,
    setReportTestFailures,
    checkResult,
    checkTestFailures
} from "./test_utils"

// TODO: hacky way to detect subset vs full.
clearNativeLog()
new ArkButtonPeer(0).labelStyleAttribute({maxLines: 3})
setReportTestFailures(getNativeLog().indexOf("heightAdaptivePolicy") == -1)

if (!reportTestFailures) {
    console.log("WARNING: ignore test result")
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
        "bindSheet(false, Function 42, {backgroundColor: undefined, title: {title: Custom kind=NativeErrorResource id=0, subtitle: undefined}, detents: undefined})"
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
    checkResult("size", () => peer.sizeAttribute({width: 5, height: 6}),
        `size({width: 5, height: 6})`)
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

function checkNavigation() {
    let peer = new ArkNavigationPeer(ArkUINodeType.Navigation)
    checkResult("backButtonIcon", () => peer.backButtonIconAttribute("attr"),
        `backButtonIcon("attr")`)
}

checkButton()
checkCalendar()
//checkDTS()
checkFormComponent()
checkCommon()
checkNavigation()

// Report in error code.
checkTestFailures()
