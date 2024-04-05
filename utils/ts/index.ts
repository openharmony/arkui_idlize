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
import { ArkButtonPeer } from "@arkoala/arkui/button"
import { ArkCalendarPickerPeer } from "@arkoala/arkui/calendar_picker"
import { ArkFormComponentPeer } from "@arkoala/arkui/form_component"
import { ArkClassDTSPeer } from "@arkoala/arkui/test"

function checkButton() {
    let peer = new ArkButtonPeer()
    peer.width("42%")
    peer.type(1)
    peer.labelStyle({maxLines: 3})
}

function checkCalendar() {
    let peer = new ArkCalendarPickerPeer()
    peer.edgeAlign(0, {dx: 5, dy: 6})
    peer.edgeAlign(2, undefined)
}

function checkDTS() {
    let peer = new ArkClassDTSPeer()
    peer.testBoolean({valBool: true})
    peer.testNumber({valNumber: -1})
    peer.testString({valString: "test string"})
    peer.testEnum(1)
    peer.testTuple({tuple: [18, false]})
    peer.testArray([-2, -1, 0, 1, 2])
}

function checkFormComponent() {
    let peer = new ArkFormComponentPeer()
    peer.size({width: 5, height: 6})
}

checkButton()
checkCalendar()
checkDTS()
checkFormComponent()
