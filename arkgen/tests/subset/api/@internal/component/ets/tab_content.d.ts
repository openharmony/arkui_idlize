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

declare enum SelectedMode {

  INDICATOR,
  BOARD
}

interface BoardStyle {

  borderRadius?: Length;
}

declare class TabBarSymbol {

    normal: SymbolGlyphModifier;

    selected?: SymbolGlyphModifier;
}

declare enum LayoutMode {
  AUTO = 0,
  VERTICAL = 1,
  HORIZONTAL = 2
}

declare interface TabBarIconStyle {

  selectedColor?: ResourceColor;
  unselectedColor?: ResourceColor;
}

declare class SubTabBarStyle {

    constructor(content: ResourceStr);

    constructor(content: ResourceStr);

    static of(content: ResourceStr): SubTabBarStyle;

    static of(content: ResourceStr): SubTabBarStyle;

    indicator(value: IndicatorStyle): SubTabBarStyle;

    selectedMode(value: SelectedMode): SubTabBarStyle;

    board(value: BoardStyle): SubTabBarStyle;

    labelStyle(value: LabelStyle): SubTabBarStyle;

    padding(value: Padding | Dimension): SubTabBarStyle;

    padding(padding: LocalizedPadding): SubTabBarStyle;

    id(value: string): SubTabBarStyle;
}

declare class BottomTabBarStyle {

  constructor(icon: ResourceStr | TabBarSymbol, text: ResourceStr);

  static of(icon: ResourceStr | TabBarSymbol, text: ResourceStr): BottomTabBarStyle;

  labelStyle(value: LabelStyle): BottomTabBarStyle;

  padding(value: Padding | Dimension | LocalizedPadding): BottomTabBarStyle;

  layoutMode(value: LayoutMode): BottomTabBarStyle;

  verticalAlign(value: VerticalAlign): BottomTabBarStyle;

  symmetricExtensible(value: boolean): BottomTabBarStyle;

  id(value: string): BottomTabBarStyle;

  iconStyle(style: TabBarIconStyle): BottomTabBarStyle;
}

declare interface  TabContentInterface { 
    ():  TabContentAttribute
}

declare class TabContentAttribute extends CommonMethod<TabContentAttribute> {

    tabBar(value: string | Resource | CustomBuilder | { icon?: string | Resource; text?: string | Resource }): TabContentAttribute;

    tabBar(value: SubTabBarStyle | BottomTabBarStyle): TabContentAttribute;
}

declare const TabContent: TabContentInterface
