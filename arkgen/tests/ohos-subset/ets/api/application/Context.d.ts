/*
 * Copyright (c) 2021-2024 Huawei Device Co., Ltd.
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

/**
 * @file
 * @kit AbilityKit
 */

// import { ApplicationInfo } from '../bundleManager/ApplicationInfo';
// import type { AsyncCallback } from '../@ohos.base';
// import resmgr from '../@ohos.resourceManager';
import BaseContext from './BaseContext';
// import EventHub from './EventHub';
// import ApplicationContext from './ApplicationContext';
// import contextConstant from '../@ohos.app.ability.contextConstant';

export default class Context extends BaseContext {

  // resourceManager: resmgr.ResourceManager;
  // applicationInfo: ApplicationInfo;
  cacheDir: string;
  tempDir: string;
  filesDir: string;
  databaseDir: string;
  preferencesDir: string;
  bundleCodeDir: string;
  distributedFilesDir: string;
  resourceDir: string;
  cloudFileDir: string;
  // eventHub: EventHub;
  // area: contextConstant.AreaMode;
  processName: string;

  createBundleContext(bundleName: string): Context;
  createModuleContext(moduleName: string): Context;
  createModuleContext(bundleName: string, moduleName: string): Context;
  // createSystemHspModuleResourceManager(bundleName: string, moduleName: string): resmgr.ResourceManager;
  getApplicationContext(): ApplicationContext;
  // getGroupDir(dataGroupID: string, callback: AsyncCallback<string>): void;
  getGroupDir(dataGroupID: string): Promise<string>;
  // createModuleResourceManager(bundleName: string, moduleName: string): resmgr.ResourceManager;
  // createAreaModeContext(areaMode: contextConstant.AreaMode): Context;
  createDisplayContext(displayId: number): Context;
}
