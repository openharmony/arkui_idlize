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

declare enum DpiFollowStrategy {
   FOLLOW_HOST_DPI = 0,
   FOLLOW_UI_EXTENSION_ABILITY_DPI = 1,
}

declare interface UIExtensionOptions {
   isTransferringCaller?: boolean;
   placeholder?: ComponentContent;
   dpiFollowStrategy?: DpiFollowStrategy;
}

declare interface TerminationInfo {
   code: number;
   want?: import('../api/@ohos.app.ability.Want').default;
}

declare interface UIExtensionProxy {
   send(data: Record<string, Object>): void;
   sendSync(data: Record<string, Object>): Record<string, Object>;
   on(type: 'asyncReceiverRegister', callback: (proxy: UIExtensionProxy) => void): void;
   on(type: 'syncReceiverRegister', callback: (proxy: UIExtensionProxy) => void): void;
   off(type: 'asyncReceiverRegister', callback?: (proxy: UIExtensionProxy) => void): void;
   off(type: 'syncReceiverRegister', callback?: (proxy: UIExtensionProxy) => void): void;
}

interface UIExtensionComponentInterface {
   (
       want: import('../api/@ohos.app.ability.Want').default,
       options?: UIExtensionOptions
   ): UIExtensionComponentAttribute;
}

declare class UIExtensionComponentAttribute extends CommonMethod<UIExtensionComponentAttribute> {
   onRemoteReady(
       callback: import('../api/@ohos.base').Callback<UIExtensionProxy>
   ): UIExtensionComponentAttribute;
   onReceive(
       callback: import('../api/@ohos.base').Callback<{ [key: string]: Object }>
   ): UIExtensionComponentAttribute;
   onResult(
       callback: import('../api/@ohos.base').Callback<{
          code: number;
          want?: import('../api/@ohos.app.ability.Want').default;
       }>
   ): UIExtensionComponentAttribute;
   onRelease(
       callback: import('../api/@ohos.base').Callback<number>
   ): UIExtensionComponentAttribute;
   onError(
       callback: import('../api/@ohos.base').ErrorCallback
   ): UIExtensionComponentAttribute;
   onTerminated(callback: Callback<TerminationInfo>): UIExtensionComponentAttribute;
}

declare const UIExtensionComponent: UIExtensionComponentInterface;

declare const UIExtensionComponentInstance: UIExtensionComponentAttribute;
