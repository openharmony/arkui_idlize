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
new ArkButtonPeer().labelStyleAttribute({maxLines: 3})
let reportTestFailures = getNativeLog().indexOf("heightAdaptivePolicy") == -1

if (!reportTestFailures) {
    console.log("WARNING: ignore test result")
}

function checkResult(name: string, test: () => void, expected: string) {
    clearNativeLog()
    test()
    let out = getNativeLog()
    if (reportTestFailures) {
        if (out != expected) {
            failedTestsCount++
            console.log(`TEST ${name} FAIL:\n  EXPECTED "${expected}"\n  ACTUAL   "${out}"`)
        } else {
            console.log(`TEST ${name} PASS`)
        }
    }
}

function checkButton() {
    let peer = new ArkButtonPeer()

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
        "bindSheet(false, Custom kind=NativeErrorFunction id=0, Optional_SheetOptions " +
        "{tag=OBJECT value=SheetOptions {title=Optional_SheetTitleOptions {tag=OBJECT value=SheetTitleOptions " +
        "{title=Union_String_Resource [variant 1] value1=Custom kind=NativeErrorResource id=0, " +
        "subtitle=Optional_Union_String_Resource {tag=UNDEFINED}}}, " +
        "detents=Optional_Tuple_Union_SheetSize_Length_Optional_Union_SheetSize_Length_Optional_Union_SheetSize_Length {tag=UNDEFINED}}})"
        )
    checkResult("type", () => peer.typeAttribute(1), "type(1)")
    checkResult("labelStyle", () => peer.labelStyleAttribute({maxLines: 3}),
        "labelStyle(LabelStyle {maxLines=Optional_Number {tag=OBJECT value=3}})")
    checkResult("labelStyle2", () => peer.labelStyleAttribute({}),
        "labelStyle(LabelStyle {maxLines=Optional_Number {tag=UNDEFINED}})")
}

function checkCalendar() {
    let peer = new ArkCalendarPickerPeer()
    checkResult("edgeAlign1", () => peer.edgeAlignAttribute(2, {dx: 5, dy: 6}),
        "edgeAlign(2, Optional_Literal_Length_Length_0 {tag=OBJECT value=Literal_Length_Length_0 " +
        "{dx=Length {value=5.000000, unit=vp, resource=0}, dy=Length {value=6.000000, unit=vp, resource=0}}})")
    checkResult("edgeAlign2", () => peer.edgeAlignAttribute(2),
        "edgeAlign(2, Optional_Literal_Length_Length_0 {tag=UNDEFINED})")
}

function checkFormComponent() {
    let peer = new ArkFormComponentPeer()
    checkResult("size", () => peer.sizeAttribute({width: 5, height: 6}),
        "size(Literal_Number_Number {width=5, height=6})")
}


checkButton()
checkCalendar()
//checkDTS()
checkFormComponent()

// Report in error code.
if (reportTestFailures && failedTestsCount > 0) process.exit(1)