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

declare enum BarMode {
  Scrollable = 0,
  Fixed = 1,
}

declare class TabsController {
  constructor();
  changeIndex(value: number): void;
  // preloadItems(indices: Optional<Array<number>>): Promise<void>;
  // setTabBarTranslate(translate: TranslateOptions): void;
  // setTabBarOpacity(opacity: number): void;
}

declare enum BarPosition {
  Start,
  End,
}

declare interface TabsOptions {
  barPosition?: BarPosition;
  index?: number;
  controller?: TabsController
}

declare interface TabsInterface {
  (options?: TabsOptions): TabsAttribute;
}

declare class TabsAttribute extends CommonMethod<TabsAttribute> {

  // TBD: Fix for the TestGeneratorVisitor
  // barMode(value: BarMode.Fixed): TabsAttribute;
  barMode(value: BarMode): TabsAttribute;
  barWidth(value: Length): TabsAttribute;
  barHeight(value: Length): TabsAttribute;
  barPosition(value: BarPosition): TabsAttribute;
  animationDuration(value: number): TabsAttribute;
  scrollable(value: boolean): TabsAttribute;

}

declare const Tabs: TabsInterface