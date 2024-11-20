/*
 * Copyright (c) 2023 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @file
 * @kit ArkUI
 */

/**
 * Defines the interface of Screen.
 *
 * @interface ScreenInterface
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
interface ScreenInterface {
  /**
   * Called when the Screen is used.
   *
   * @param { number } screenId - indicates the identifier of a screen.
   * @returns { ScreenAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  (screenId: number): ScreenAttribute;
}

/**
 * Defines the attribute functions of Screen.
 *
 * @extends CommonMethod<ScreenAttribute>
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare class ScreenAttribute extends CommonMethod<ScreenAttribute> {
}

/**
 * Defines the Screen component.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare const Screen: ScreenInterface;

/**
 * Defines the Screen instance.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare const ScreenInstance: ScreenAttribute;
