/*
 * Copyright (c) 2021-2023 Huawei Device Co., Ltd.
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
 * PluginComponentTemplate
 *
 * @interface PluginComponentTemplate
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
interface PluginComponentTemplate {
  /**
   * Defines the plugin source name.
   *
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  source: string;
  /**
   * Defines the bundle name of the Template.
   *
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  bundleName: string;
}

/**
 * Define options used to construct a plugin component.
 *
 * @interface PluginComponentOptions
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 14
 */
declare interface PluginComponentOptions {
  /**
   * Plugin component template.
   * @type { PluginComponentTemplate }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  template: PluginComponentTemplate;

  /**
   * Plugin component data.
   * @type { any }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  data: any
}

/**
 * Data provided when an error occurs.
 *
 * @interface PluginErrorData
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 14
 */
declare interface PluginErrorData {
  /**
   * Error code.
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  errcode: number;

  /**
   * Error message.
   * @type { string }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  msg: string;
}

/**
 * Callback invoked when an error occurs.
 *
 * @typedef { function } PluginErrorCallback
 * @param { PluginErrorData } info - Plugin error data
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 14
 */
declare type PluginErrorCallback = (info: PluginErrorData) => void

/**
 * Provides plugin component.
 *
 * @interface PluginComponentInterface
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
interface PluginComponentInterface {
  /**
   * Called when setting the plugin.
   *
   * @param { object } value
   * @returns { PluginComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  /**
   * Called when setting the plugin.
   *
   * @param { PluginComponentOptions } options - Plugin component options
   * @returns { PluginComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  (options: PluginComponentOptions): PluginComponentAttribute;
}

/**
 * Defines the plugin component attribute functions.
 *
 * @extends CommonMethod<PluginComponentAttribute>
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
declare class PluginComponentAttribute extends CommonMethod<PluginComponentAttribute> {
  /**
   * pluginComponent onComplete callback,
   *
   * @param { function } callback
   * @returns { PluginComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  /**
   * PluginComponent onComplete callback
   *
   * @param { VoidCallback } callback
   * @returns { PluginComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  onComplete(callback: VoidCallback): PluginComponentAttribute;

  /**
   * pluginComponent onError callback,
   *
   * @param { function } callback
   * @returns { PluginComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 9
   */
  /**
   * PluginComponent onError callback
   *
   * @param { PluginErrorCallback } callback
   * @returns { PluginComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  onError(callback: PluginErrorCallback): PluginComponentAttribute;
}

/**
 * Defines PluginComponent Component.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
declare const PluginComponent: PluginComponentInterface;

/**
 * Defines PluginComponent Component instance.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 9
 */
declare const PluginComponentInstance: PluginComponentAttribute;
