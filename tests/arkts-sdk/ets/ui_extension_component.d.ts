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
 * Enumeration of different types of DpiFollowStrategy.
 *
 * @enum { number }
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 12
 */
declare enum DpiFollowStrategy {
  /**
   * Followed the host DPI.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  FOLLOW_HOST_DPI = 0,

  /**
   * Followed the UIExtensionAbility.
   *
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  FOLLOW_UI_EXTENSION_ABILITY_DPI = 1,
}

/**
 * This interface is used to set the options for UIExtensionComponentAttribute during construction
 *
 * @interface UIExtensionOptions
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 11
 */
declare interface UIExtensionOptions {
  /**
   * Set whether the current capability is used as a Caller.<br/>
   * If set to true, as a Caller, the current token of UIExtensionComponent is set to rootToken.
   *
   * @type { ?boolean }
   * @default false
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  isTransferringCaller?: boolean;

  /**
   * Set placeholder.
   * If set placeholder ComponentContent, show placeholder node when connection is not established.
   *
   * @type { ?ComponentContent }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  placeholder?: ComponentContent;

  /**
   * Set Areachange placeholder.
   * If the Areachange placeholder ComponentContent is set, the placeholder node is displayed until
   * the UIExtensionComponent size change is complete.
   *
   * @type { ?Record<string, ComponentContent> }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  areaChangePlaceholder?: Record<string, ComponentContent>;

  /**
   * Set UIExtensionComponent Content Dpi Follow Strategy.
   *
   * @type { ?DpiFollowStrategy }
   * @default DpiFollowStrategy.FOLLOW_UI_EXTENSION_ABILITY_DPI
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  dpiFollowStrategy?: DpiFollowStrategy;
}

/**
 * Indicates the information when the provider of the embedded UI is terminated.
 *
 * @interface TerminationInfo
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 12
 */
declare interface TerminationInfo {
  /**
   * Defines the termination code.
   *
   * @type { number }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
   code: number;

  /**
   * Defines the additional termination information.
   *
   * @type { ?import('../api/@ohos.app.ability.Want').default }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
   want?: import('../api/@ohos.app.ability.Want').default;
}

/**
 * Get Callback from @ohos.base.
 *
 * @typedef { import('../api/@ohos.base').Callback<Record<string, Object>> }
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 14
 */
declare type ReceiveCallback = import('../api/@ohos.base').Callback<Record<string, Object>>;

/**
 * This interface is used for send data to the UIExtensionAbility.<br/>
 * It is returned from onRemoteReady callback of UIExtensionComponent<br/>
 * when UIExtensionAbility connects successfully
 *
 * @interface UIExtensionProxy
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare interface UIExtensionProxy {
  /**
   * This function is for sending data to the UIExtensionAbility.
   *
   * @param { object } data
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  /**
   * This function is for sending data to the UIExtensionAbility.
   *
   * @param { Record<string, Object> } data
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  send(data: Record<string, Object>): void;

  /**
   * This function is for sending data to the UIExtensionAbility and waiting the result in blocking mode.
   *
   * @param { object } data - data send to the UIExtensionAbility
   * @returns { object } data - data transferred from the UIExtensionAbility
   * @throws { BusinessError } 100011 - No callback has been registered to response this request.
   * @throws { BusinessError } 100012 - Transferring data failed.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  /**
   * This function is for sending data to the UIExtensionAbility and waiting the result in blocking mode.
   *
   * @param { Record<string, Object> } data - Data send to the UIExtensionAbility.
   * @returns { Record<string, Object> } data - Data transferred from the UIExtensionAbility.
   * @throws { BusinessError } 100011 - No callback has been registered to response this request.
   * @throws { BusinessError } 100012 - Transferring data failed.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  sendSync(data: Record<string, Object>): Record<string, Object>;

  /**
   * Register the listener that watches for async data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'asyncReceiverRegister' } type - Indicates the type of event.
   * @param { function } callback - callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  /**
   * Register the listener that watches for async data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'asyncReceiverRegister' } type - Indicates the type of event.
   * @param { Callback<UIExtensionProxy> } callback - Callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  on(type: 'asyncReceiverRegister', callback: Callback<UIExtensionProxy>): void;

  /**
   * Register the listener that watches for sync data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'syncReceiverRegister' } type - Indicates the type of event.
   * @param { function } callback - callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  /**
   * Register the listener that watches for sync data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'syncReceiverRegister' } type - Indicates the type of event.
   * @param { Callback<UIExtensionProxy> } callback - Callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  on(type: 'syncReceiverRegister', callback: Callback<UIExtensionProxy>): void;

  /**
   * Deregisters the listener that watches for async data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'asyncReceiverRegister' } type - type of the listened event.
   * @param { function } callback - callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  /**
   * Deregisters the listener that watches for async data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'asyncReceiverRegister' } type - Type of the listened event.
   * @param { Callback<UIExtensionProxy> } [callback] - Callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  off(type: 'asyncReceiverRegister', callback?: Callback<UIExtensionProxy>): void;

  /**
   * Deregisters the listener that watches for sync data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'syncReceiverRegister' } type - type of the listened event.
   * @param { function } callback - callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  /**
   * Deregisters the listener that watches for sync data receiver callback being registered by UIExtensionAbility.
   *
   * @param { 'syncReceiverRegister' } type - Type of the listened event.
   * @param { Callback<UIExtensionProxy> } [callback] - Callback of the listened event.
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  off(type: 'syncReceiverRegister', callback?: Callback<UIExtensionProxy>): void;
}

/**
 * Provide an interface for the UIExtensionComponent, which is used
 * <br/>to render UI of a remote UIExtensionAbility
 *
 * @interface UIExtensionComponentInterface
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
interface UIExtensionComponentInterface {
  /**
   * Construct the UIExtensionComponent.<br/>
   * Called when the UIExtensionComponent is used.
   *
   * @param { import('../api/@ohos.app.ability.Want').default } want - indicates the want of UIExtensionAbility
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  /**
   * Construct the UIExtensionComponent.<br/>
   * Called when the UIExtensionComponent is used.
   *
   * @param { import('../api/@ohos.app.ability.Want').default } want - indicates the want of UIExtensionAbility
   * @param { UIExtensionOptions } [options] - Construction configuration of UIExtensionComponentAttribute
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 11
   */
  (
    want: import('../api/@ohos.app.ability.Want').default,
    options?: UIExtensionOptions
  ): UIExtensionComponentAttribute;
}

/**
 * Define the attribute functions of UIExtensionComponent.
 *
 * @extends CommonMethod<UIExtensionComponentAttribute>
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare class UIExtensionComponentAttribute extends CommonMethod<UIExtensionComponentAttribute> {
  /**
   * @param { import('../api/@ohos.base').Callback<UIExtensionProxy> } callback
   * - callback called when remote UIExtensionAbility object is
   * <br/>ready for receive data
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  onRemoteReady(
    callback: import('../api/@ohos.base').Callback<UIExtensionProxy>
  ): UIExtensionComponentAttribute;

  /**
   * @param { import('../api/@ohos.base').Callback<{ [key: string]: Object }> } callback
   * - called when data received from UIExtensionAbility
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  /**
   * @param { ReceiveCallback } callback - Called when data received from UIExtensionAbility
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 14
   */
  onReceive(callback: ReceiveCallback): UIExtensionComponentAttribute;

  /**
   * @param { import('../api/@ohos.base').Callback<{code: number;want?: import('../api/@ohos.app.ability.Want').default;}> } callback 
   * - called when the UIExtensionAbility is terminated with result data.
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   * @deprecated since 12
   * @useinstead UIExtensionComponentAttribute#onTerminated
   */
  onResult(
    callback: import('../api/@ohos.base').Callback<{
      code: number;
      want?: import('../api/@ohos.app.ability.Want').default;
    }>
  ): UIExtensionComponentAttribute;

  /**
   * @param { import('../api/@ohos.base').Callback<number> } callback
   * - number returned from callback function if disconnected from UIExtensionAbility, 0 means the
   * <br/>UIExtensionAbility is terminate by itself, otherwise the connect is broken abnormal.
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   * @deprecated since 12
   * @useinstead UIExtensionComponentAttribute#onTerminated or UIExtensionComponentAttribute#onError
   */
  onRelease(
    callback: import('../api/@ohos.base').Callback<number>
  ): UIExtensionComponentAttribute;

  /**
   * @param { import('../api/@ohos.base').ErrorCallback } callback
   * - called when some error occurred except disconnected from UIExtensionAbility.
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 10
   */
  onError(
    callback: import('../api/@ohos.base').ErrorCallback
  ): UIExtensionComponentAttribute;

  /**
   * Called when the provider of the embedded UI is terminated.
   *
   * @param { Callback<TerminationInfo> } callback
   * @returns { UIExtensionComponentAttribute }
   * @syscap SystemCapability.ArkUI.ArkUI.Full
   * @systemapi
   * @since 12
   */
  onTerminated(callback: Callback<TerminationInfo>): UIExtensionComponentAttribute;
}

/**
 * Defines UIExtensionComponent Component.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare const UIExtensionComponent: UIExtensionComponentInterface;

/**
 * Defines UIExtensionComponent Component instance.
 *
 * @syscap SystemCapability.ArkUI.ArkUI.Full
 * @systemapi
 * @since 10
 */
declare const UIExtensionComponentInstance: UIExtensionComponentAttribute;
