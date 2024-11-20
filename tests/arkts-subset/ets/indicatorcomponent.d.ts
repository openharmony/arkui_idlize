/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
 * Provides methods for switching components.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @crossplatform
 * @form
 * @atomicservice
 * @since 16
 */
declare class IndicatorComponentController {
  /**
   * constructor.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  constructor();

  /**
   * Called when the next child component is displayed.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  showNext():void;

  /**
   * Called when the previous subcomponent is displayed.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  showPrevious():void;

   /**
   * Controlling IndicatorComponent to change to the specified subcomponent.
   *
   * @param { number } index - The index of item to be redirected.
   * @param { boolean } [useAnimation] - If true, swipe to index item with animation. If false, swipe to index item without animation. 
   *      The default value is false.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  changeIndex(index: number, useAnimation?: boolean):void;
}

/**
 * Provides an interface for indicator.
 *
 * @interface IndicatorComponentInterface
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @crossplatform
 * @form
 * @atomicservice
 * @since 16
 */
interface IndicatorComponentInterface {
   
  /**
   * Called when a indicator is set.
   *
   * @param { IndicatorComponentController } controller - indicator component controller.
   * @returns { IndicatorComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  (controller?: IndicatorComponentController): IndicatorComponentAttribute;
}

/**
 * Defines the IndicatorComponent attribute functions.
 *
 * @extends CommonMethod<IndicatorComponentAttribute>
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @crossplatform
 * @form
 * @atomicservice
 * @since 16
 */
declare class IndicatorComponentAttribute extends CommonMethod<IndicatorComponentAttribute> {
 /**
   * Called when the index value of the displayed subcomponent is set in the container.
   *
   * @param { number } index
   * @returns { IndicatorComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  initialIndex(index: number): IndicatorComponentAttribute;

  /**
   * Sets the total number of indicator.
   *
   * @param { number } totalCount
   * @returns { IndicatorComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  count(totalCount: number): IndicatorComponentAttribute;

  /**
   * Sets the indicator style.
   *
   * @param { DotIndicator | DigitIndicator } indicatorStyle - the style value
   * @returns { IndicatorComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  style(indicatorStyle: DotIndicator | DigitIndicator): IndicatorComponentAttribute;

  /**
   * Called when setting whether to turn on cyclic sliding.
   *
   * @param { boolean } isLoop
   * @returns { IndicatorComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  loop(isLoop: boolean): IndicatorComponentAttribute;

  /**
   * Called when setting whether to slide vertically.
   *
   * @param { boolean } isVertical
   * @returns { IndicatorComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  vertical(isVertical: boolean): IndicatorComponentAttribute;

  /**
   * Called when the index value changes.
   *
   * @param { Callback<number> } event
   * @returns { IndicatorComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @crossplatform
   * @form
   * @atomicservice
   * @since 16
   */
  onChange(event: Callback<number>): IndicatorComponentAttribute;
}

/**
 * Defines IndicatorComponent.
 *
 * @constant
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @crossplatform
 * @form
 * @atomicservice
 * @since 16
 */
declare const IndicatorComponent: IndicatorComponentInterface;

/**
 * Defines IndicatorComponent instance.
 *
 * @constant
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @crossplatform
 * @form
 * @atomicservice
 * @since 16
 */
declare const IndicatorComponentInstance: IndicatorComponentAttribute;
