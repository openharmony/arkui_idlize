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
// Shall be like this import { ArkCommonPeer } from "@arkoala/arkui/common"

import { ArkButtonPeer } from "@arkoala/arkui/ArkButtonPeer"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/ArkCalendarPickerPeer"
import { ArkFormComponentPeer } from "@arkoala/arkui/ArkFormComponentPeer"
import { withStringResult } from "./Interop"
import { nativeModule } from "@arkoala/arkui/NativeModule"

const TEST_GROUP_LOG = 1
function clearNativeLog() {
    nativeModule()._ClearGroupedLog(TEST_GROUP_LOG)
}
function getNativeLog(): string {
    return withStringResult(nativeModule()._GetGroupedLog(TEST_GROUP_LOG))!
}

let failedTestsCount = 0

// TODO: hacky way to detect subset vs full.
clearNativeLog()
new ArkButtonPeer().labelStyle({maxLines: 3})
let reportTestFailures = getNativeLog().indexOf("heightAdaptivePolicy") == -1

if (!reportTestFailures) {
    console.log("WARNING: ignore test result")
}

function checkResult(test: () => void, expected: string) {
    clearNativeLog()
    test()
    let out = getNativeLog()
    if (reportTestFailures && out != expected) {
        failedTestsCount++
        console.log(`TEST FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${out}"`)
    }
}

function checkButton() {
    let peer = new ArkButtonPeer()

    checkResult(() => peer.width("42%"),
        "width(Length {value=42.000000, unit=%, resource=0})")
    checkResult(() => peer.height({ id: 43, bundleName: "MyApp", moduleName: "MyApp" }),
        "height(Length {value=0.000000, unit=vp, resource=43})")
    checkResult(() =>
        peer.bindSheet(false, () => {}, {
            title: {
                title: { id: 43, bundleName: "MyApp", moduleName: "MyApp" }
            }
        }),
        "bindSheet(0, Custom kind=NativeErrorFunction id=0, tagged {[OBJECT]SheetOptions " +
        "{title=tagged {[OBJECT]SheetTitleOptions {title=union[1] {Custom kind=NativeErrorResource id=0}, " +
        "subtitle=tagged {[UNDEFINED]}}}, detents=tagged {[UNDEFINED]}}})")
    checkResult(() => peer.type(1),
        "type(1)")
    checkResult(() => peer.labelStyle({maxLines: 3}),
        "labelStyle(LabelStyle {maxLines=tagged {[OBJECT]3}})")
}

function checkCalendar() {
    let peer = new ArkCalendarPickerPeer()
    checkResult(() => peer.edgeAlign(2, {dx: 5, dy: 6}),
        "edgeAlign(2, tagged {[OBJECT]compound: {Length {value=5.000000, unit=vp, resource=0}, " +
        "Length {value=6.000000, unit=vp, resource=0}, }})")
    checkResult(() => peer.edgeAlign(2, undefined),
        "edgeAlign(2, tagged {[UNDEFINED]})")
}

function checkFormComponent() {
    let peer = new ArkFormComponentPeer()
    checkResult(() => peer.size({width: 5, height: 6}),
        "size(compound: {5, 6, })")
}


checkButton()
checkCalendar()
//checkDTS()
checkFormComponent()

// Report in error code.
if (reportTestFailures && failedTestsCount > 0) process.exit(1)