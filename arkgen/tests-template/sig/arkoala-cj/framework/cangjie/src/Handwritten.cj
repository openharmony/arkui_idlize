/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

package idlize

import Interop.*

public type CustomNodeBuilder = (parentNode: Int64) -> Int64


public interface AttributeModifier<T> {}
public interface GestureModifier {}
public interface ContentModifier<T> {}

public func hookButtonContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookCheckBoxContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookDataPanelContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookGaugeContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookLoadingProgressContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookProgressContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookRadioContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookRatingContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookSelectContentModifier(
    receiver: Object, value: ContentModifier<MenuItemConfiguration>) {}
public func hookSliderContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookTextClockContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookTextTimerContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookToggleContentModifier(
    receiver: Object, value: ContentModifier<Object>) {}
public func hookGestureModifier(receiver: Object, value: Option<GestureModifier>) {}
public func hookStateStyleImpl(receiver: Any, value: Any) {}
public func hookId(component: Object, value: Option<String>) {}

