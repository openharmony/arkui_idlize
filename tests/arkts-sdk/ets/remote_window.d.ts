/*
 * Copyright (c) 2022 Huawei Device Co., Ltd.
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
 * Round rect.
 *
 * @interface RRect
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
interface RRect {
  /**
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  left: number;

  /**
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  top: number;

  /**
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  width: number;

  /**
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  height: number;

  /**
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  radius: number;
}

/**
 * Window animation target.
 *
 * @interface WindowAnimationTarget
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
interface WindowAnimationTarget {
  /**
   * @type { string }
   * @readonly
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  readonly bundleName: string;

  /**
   * @type { string }
   * @readonly
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  readonly abilityName: string;

  /**
   * @type { RRect }
   * @readonly
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  readonly windowBounds: RRect;

  /**
   * @type { number }
   * @readonly
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  readonly missionId: number;
}

/**
 * Provides an interface for controlling the remote window.
 *
 * @interface RemoteWindowInterface
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
interface RemoteWindowInterface {
  /**
   * Called when the remote window interface is used.
   *
   * @param { WindowAnimationTarget } target
   * @returns { RemoteWindowAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  (target: WindowAnimationTarget): RemoteWindowAttribute;
}

/**
 * Inheritance CommonMethod Set Styles
 *
 * @extends CommonMethod<RemoteWindowAttribute>
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
declare class RemoteWindowAttribute extends CommonMethod<RemoteWindowAttribute> {}

/**
 * Defines RemoteWindow Component.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
declare const RemoteWindow: RemoteWindowInterface;

/**
 * Defines RemoteWindow Component instance.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
declare const RemoteWindowInstance: RemoteWindowAttribute;
