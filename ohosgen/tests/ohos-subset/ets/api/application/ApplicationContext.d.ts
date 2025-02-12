/*
 * Copyright (c) 2022-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License"),
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

// import { AsyncCallback } from '../@ohos.base';
import Context from './Context';
// import AbilityLifecycleCallback from '../@ohos.app.ability.AbilityLifecycleCallback';
// import EnvironmentCallback from '../@ohos.app.ability.EnvironmentCallback';
// import type ApplicationStateChangeCallback from '../@ohos.app.ability.ApplicationStateChangeCallback';
// import { ProcessInformation } from './ProcessInformation';
// import type ConfigurationConstant from '../@ohos.app.ability.ConfigurationConstant';
// import Want from '../@ohos.app.ability.Want';

export default class ApplicationContext extends Context {

  // on(type: 'abilityLifecycle', callback: AbilityLifecycleCallback): number;
  // off(type: 'abilityLifecycle', callbackId: number, callback: AsyncCallback<void>): void;
  off(type: 'abilityLifecycle', callbackId: number): Promise<void>;
  // on(type: 'environment', callback: EnvironmentCallback): number;
  // off(type: 'environment', callbackId: number, callback: AsyncCallback<void>): void;
  off(type: 'environment', callbackId: number): Promise<void>;
  // on(type: 'applicationStateChange', callback: ApplicationStateChangeCallback): void;
  // off(type: 'applicationStateChange', callback?: ApplicationStateChangeCallback): void;
  // getRunningProcessInformation(): Promise<Array<ProcessInformation>>;
  // getRunningProcessInformation(callback: AsyncCallback<Array<ProcessInformation>>): void;
  killAllProcesses(): Promise<void>;
  killAllProcesses(clearPageStack: boolean): Promise<void>;
  killAllProcesses(callback: AsyncCallback<void>);
  // setColorMode(colorMode: ConfigurationConstant.ColorMode): void;
  setLanguage(language: string): void;
  clearUpApplicationData(): Promise<void>;
  // clearUpApplicationData(callback: AsyncCallback<void>): void;
  // restartApp(want: Want): void;
  // preloadUIExtensionAbility(want: Want): Promise<void>;
  setSupportedProcessCache(isSupported : boolean): void;
  setFont(font: string): void;
  getCurrentAppCloneIndex(): number;
  setFontSizeScale(fontSizeScale: number): void;
  getCurrentInstanceKey(): string;
  getAllRunningInstanceKeys(): Promise<Array<string>>;
}
