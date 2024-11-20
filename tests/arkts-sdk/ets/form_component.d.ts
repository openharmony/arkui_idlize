/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
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
 * Defines the FormDimension enum.
 *
 * @enum { number }
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 7
 */
declare enum FormDimension {
  /**
   * 1 x 2 cards
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  Dimension_1_2,

  /**
   * 2 x 2 cards
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  Dimension_2_2,

  /**
   * 2 x 4 cards
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  Dimension_2_4,

  /**
   * 4 x 4 cards
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  Dimension_4_4,

  /**
   * 2 x 1 cards
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  Dimension_2_1,

  /**
   * 1 x 1 cards
   * The default value is 6
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  DIMENSION_1_1 = 6,

  /**
   * 6 x 4 cards
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  DIMENSION_6_4,

  /**
   * 2 x 3 cards used for wearable devices
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  DIMENSION_2_3 = 8,

  /**
   * 3 x 3 cards used for wearable devices
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  DIMENSION_3_3 = 9,
}

/**
 * Defines the FormRenderingMode enum.
 *
 * @enum { number }
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 11
 */
declare enum FormRenderingMode {

  /**
   *  Full color mode, this is default value
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  FULL_COLOR,

  /**
   *  single color mode
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  SINGLE_COLOR,
}

/**
 * Defines the FormShape enum.
 *
 * @enum { number }
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 12
 */
declare enum FormShape {
    /**
     * The rect shape.
     *
     * @syscap SystemCapability.ArkUI.ArkUI.Full
     * @systemapi
     * @since 12
     */
    RECT = 1,

    /**
     * The circle shape.
     *
     * @syscap SystemCapability.ArkUI.ArkUI.Full
     * @systemapi
     * @since 12
     */
    CIRCLE,
}

/**
 * Defines the FormInfo.
 *
 * @interface FormInfo
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 12
 */
declare interface FormInfo {
  /**
   * The id the form.
   *
   * @type { number | string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  id: number | string;

  /**
   * The name of the form.
   *
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  name: string;

  /**
   * The bundle of the form.
   *
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  bundle: string;

  /**
   * The ability of the form.
   *
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  ability: string;

  /**
   * The module of the form.
   *
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  module: string;

  /**
   * The dimension of the form.
   *
   * @type { ?FormDimension }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  dimension?: FormDimension;

  /**
   * Whether the form is temporary.
   *
   * @type { ?boolean }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  temporary?: boolean;

  /**
   * The want of the form.
   *
   * @type { ?import('../api/@ohos.app.ability.Want').default }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  want?: import('../api/@ohos.app.ability.Want').default;

  /**
   * The renderingMode of the form.
   *
   * @type { ?FormRenderingMode }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  renderingMode?: FormRenderingMode;

  /**
   * The shape of the form.
   *
   * @type { ?FormShape }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  shape?: FormShape;
}

/**
 * Defines the FormComponent.
 *
 * @interface FormComponentInterface
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 7
 */
interface FormComponentInterface {
  /**
   * Set a new value.
   *
   * @param { {
   * id: number;
   * name: string;
   * bundle: string;
   * ability: string;
   * module: string;
   * dimension?: FormDimension;
   * temporary?: boolean;
   * want?: import('../api/@ohos.app.ability.Want').default;
   * } } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  /**
   * Set a new value.
   *
   * @param { object } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  /**
   * Set a new value.
   *
   * @param { object } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  /**
   * Set a new value of form info.
   *
   * @param { FormInfo } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  (value: FormInfo): FormComponentAttribute;
}

/**
 * Defines the FormCallbackInfo.
 *
 * @interface FormCallbackInfo
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 12
 */
interface FormCallbackInfo {
  /**
   * The id of the form.
   *
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  id: number;

  /**
   * The string id of the form.
   *
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  idString: string;
}

/**
 * @extends CommonMethod<FormComponentAttribute>
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 7
 */
declare class FormComponentAttribute extends CommonMethod<FormComponentAttribute> {
  /**
   * Sets the display area size of the card.
   *
   * @param { object } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  size(value: { width: number; height: number }): FormComponentAttribute;

  /**
   * Card module name.
   *
   * @param { string } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  moduleName(value: string): FormComponentAttribute;

  /**
   * Set the card size.
   *
   * @param { FormDimension } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  dimension(value: FormDimension): FormComponentAttribute;

  /**
   * Indicates whether to allow card update.
   *
   * @param { boolean } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  allowUpdate(value: boolean): FormComponentAttribute;

  /**
   * Whether the card is visible.
   *
   * @param { Visibility } value
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  visibility(value: Visibility): FormComponentAttribute;

  /**
   * This function is triggered after card information is obtained.
   * For details about the form information, see the definition of the original capability subsystem.
   *
   * @param { function } callback
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  /**
   * This function is triggered after card information is obtained.
   * For details about the form information, see the definition of the original capability subsystem.
   *
   * @param { Callback<FormCallbackInfo> } callback
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  onAcquired(callback: Callback<FormCallbackInfo>): FormComponentAttribute;

  /**
   * Card loading error.
   *
   * @param { function } callback
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  onError(callback: (info: { errcode: number; msg: string }) => void): FormComponentAttribute;

  /**
   * Card to be redirected.
   *
   * @param { function } callback
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  onRouter(callback: (info: any) => void): FormComponentAttribute;

  /**
   * Uninstall Card.
   *
   * @param { function } callback
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 7
   */
  /**
   * Uninstall Card.
   *
   * @param { Callback<FormCallbackInfo> } callback
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  onUninstall(callback: Callback<FormCallbackInfo>): FormComponentAttribute;

  /**
   * Card to be loaded.
   *
   * @param { function } callback
   * @returns { FormComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  onLoad(callback: () => void): FormComponentAttribute;
}

/**
 * Defines FormComponent Component.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 7
 */
declare const FormComponent: FormComponentInterface;

/**
 * Defines FormComponent Component instance.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 7
 */
declare const FormComponentInstance: FormComponentAttribute;
