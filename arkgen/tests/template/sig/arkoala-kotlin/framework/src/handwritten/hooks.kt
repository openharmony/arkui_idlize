/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

package handwritten

import koalaui.arkoala.ArkButtonComponent
import koalaui.arkoala.ArkButtonPeer
import koalaui.arkoala.ButtonConfiguration

import koalaui.arkoala.ArkCheckboxComponent
import koalaui.arkoala.ArkCheckboxPeer
import koalaui.arkoala.CheckBoxConfiguration

import koalaui.arkoala.ArkDataPanelComponent
import koalaui.arkoala.ArkDataPanelPeer
import koalaui.arkoala.DataPanelConfiguration

import koalaui.arkoala.ArkGaugeComponent
import koalaui.arkoala.ArkGaugePeer
import koalaui.arkoala.GaugeConfiguration

import koalaui.arkoala.ArkLoadingProgressComponent
import koalaui.arkoala.ArkLoadingProgressPeer
import koalaui.arkoala.LoadingProgressConfiguration

import koalaui.arkoala.ArkProgressComponent
import koalaui.arkoala.ArkProgressPeer
import koalaui.arkoala.ProgressConfiguration

import koalaui.arkoala.ArkRadioComponent
import koalaui.arkoala.ArkRadioPeer
import koalaui.arkoala.RadioConfiguration

import koalaui.arkoala.ArkRatingComponent
import koalaui.arkoala.ArkRatingPeer
import koalaui.arkoala.RatingConfiguration

import koalaui.arkoala.ArkSelectComponent
import koalaui.arkoala.ArkSelectPeer
import koalaui.arkoala.MenuItemConfiguration

import koalaui.arkoala.ArkSliderComponent
import koalaui.arkoala.ArkSliderPeer
import koalaui.arkoala.SliderConfiguration

import koalaui.arkoala.ArkTextClockComponent
import koalaui.arkoala.ArkTextClockPeer
import koalaui.arkoala.TextClockConfiguration

import koalaui.arkoala.ArkTextTimerComponent
import koalaui.arkoala.ArkTextTimerPeer
import koalaui.arkoala.TextTimerConfiguration

import koalaui.arkoala.ArkToggleComponent
import koalaui.arkoala.ArkTogglePeer
import koalaui.arkoala.ToggleConfiguration

import koalaui.arkoala.CommonMethod
import koalaui.arkoala.ArkCommonMethodPeer
import koalaui.arkoala.StateStyles

interface ContentModifier<T> {}

fun hookButtonContentModifier(
    receiver: ArkButtonComponent, value: ContentModifier<ButtonConfiguration>? = null) {}
fun hookCheckBoxContentModifier(
    receiver: ArkCheckboxComponent, value: ContentModifier<CheckBoxConfiguration>? = null) {}
fun hookDataPanelContentModifier(
    receiver: ArkDataPanelComponent, value: ContentModifier<DataPanelConfiguration>? = null) {}
fun hookGaugeContentModifier(
    receiver: ArkGaugeComponent, value: ContentModifier<GaugeConfiguration>? = null) {}
fun hookLoadingProgressContentModifier(
    receiver: ArkLoadingProgressComponent, value: ContentModifier<LoadingProgressConfiguration>? = null) {}
fun hookProgressContentModifier(
    receiver: ArkProgressComponent, value: ContentModifier<ProgressConfiguration>? = null) {}
fun hookRadioContentModifier(
    receiver: ArkRadioComponent, value: ContentModifier<RadioConfiguration>? = null) {}
fun hookRatingContentModifier(
    receiver: ArkRatingComponent, value: ContentModifier<RatingConfiguration>? = null) {}
fun hookSelectContentModifier(
    receiver: ArkSelectComponent, value: ContentModifier<MenuItemConfiguration>? = null) {}
fun hookSliderContentModifier(
    receiver: ArkSliderComponent, value: ContentModifier<SliderConfiguration>? = null) {}
fun hookTextClockContentModifier(
    receiver: ArkTextClockComponent, value: ContentModifier<TextClockConfiguration>? = null) {}
fun hookTextTimerContentModifier(
    receiver: ArkTextTimerComponent, value: ContentModifier<TextTimerConfiguration>? = null) {}
fun hookToggleContentModifier(
    receiver: ArkToggleComponent, value: ContentModifier<ToggleConfiguration>? = null) {}

fun hookButtonContentModifier(
    receiver: ArkButtonPeer, value: ContentModifier<ButtonConfiguration>? = null) {}
fun hookCheckBoxContentModifier(
    receiver: ArkCheckboxPeer, value: ContentModifier<CheckBoxConfiguration>? = null) {}
fun hookDataPanelContentModifier(
    receiver: ArkDataPanelPeer, value: ContentModifier<DataPanelConfiguration>? = null) {}
fun hookGaugeContentModifier(
    receiver: ArkGaugePeer, value: ContentModifier<GaugeConfiguration>? = null) {}
fun hookLoadingProgressContentModifier(
    receiver: ArkLoadingProgressPeer, value: ContentModifier<LoadingProgressConfiguration>? = null) {}
fun hookProgressContentModifier(
    receiver: ArkProgressPeer, value: ContentModifier<ProgressConfiguration>? = null) {}
fun hookRadioContentModifier(
    receiver: ArkRadioPeer, value: ContentModifier<RadioConfiguration>? = null) {}
fun hookRatingContentModifier(
    receiver: ArkRatingPeer, value: ContentModifier<RatingConfiguration>? = null) {}
fun hookSelectContentModifier(
    receiver: ArkSelectPeer, value: ContentModifier<MenuItemConfiguration>? = null) {}
fun hookSliderContentModifier(
    receiver: ArkSliderPeer, value: ContentModifier<SliderConfiguration>? = null) {}
fun hookTextClockContentModifier(
    receiver: ArkTextClockPeer, value: ContentModifier<TextClockConfiguration>? = null) {}
fun hookTextTimerContentModifier(
    receiver: ArkTextTimerPeer, value: ContentModifier<TextTimerConfiguration>? = null) {}
fun hookToggleContentModifier(
    receiver: ArkTogglePeer, value: ContentModifier<ToggleConfiguration>? = null) {}

fun hookId(component: Any, value: String? = null) {}

interface GestureModifier {}

fun hookGestureModifier(receiver: CommonMethod, value: GestureModifier? = null) {}
fun hookGestureModifier(receiver: ArkCommonMethodPeer, value: GestureModifier? = null) {}

fun hookStateStyleImpl(receiver: CommonMethod, value: StateStyles? = null) {}
fun hookStateStyleImpl(receiver: ArkCommonMethodPeer, value: StateStyles? = null) {}
