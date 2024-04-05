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

function checkButton() {
    let peer = new ArkButtonPeer()
    peer.width("42%")
    peer.type(1)
    peer.labelStyle({maxLines: 3})
}

function checkCalendar() {
    let peer = new ArkCalendarPickerPeer()
    peer.edgeAlign(2, {dx: 5, dy: 6})
    peer.edgeAlign(2, undefined)
}

checkButton()
checkCalendar()
