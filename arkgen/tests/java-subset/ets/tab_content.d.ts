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

interface IndicatorStyle {

    color?: ResourceColor;
}

declare class TabBarSymbol {

    normal: SymbolGlyphModifier;

    selected?: SymbolGlyphModifier;
}

declare class BottomTabBarStyle {

    constructor(icon: ResourceStr | TabBarSymbol, text: ResourceStr);

    id(value: string): BottomTabBarStyle;

    static of(icon: ResourceStr | TabBarSymbol, text: ResourceStr): BottomTabBarStyle;

    labelStyle(value: LabelStyle): BottomTabBarStyle;

    padding(value: Padding | Dimension | LocalizedPadding): BottomTabBarStyle;
}

// declare class SubTabBarStyle {

//     constructor(content: ResourceStr);

//     constructor(content: ResourceStr | ComponentContent);

//     static of(content: ResourceStr): SubTabBarStyle;

//     static of(content: ResourceStr | ComponentContent): SubTabBarStyle;

//     indicator(value: IndicatorStyle): SubTabBarStyle;

//     selectedMode(value: SelectedMode): SubTabBarStyle;

//     board(value: BoardStyle): SubTabBarStyle;

//     labelStyle(value: LabelStyle): SubTabBarStyle;

//     padding(value: Padding | Dimension): SubTabBarStyle;

//     padding(padding: LocalizedPadding): SubTabBarStyle;

//     id(value: string): SubTabBarStyle;
// }

declare interface  TabContentInterface { 
    ():  TabContentAttribute
}

declare class TabContentAttribute extends CommonMethod<TabContentAttribute> {

    /*~tabBar(value: SubTabBarStyle): TabContentAttribute;
    tabBar(value: SubTabBarStyle | BottomTabBarStyle): TabContentAttribute;*/
}

declare const TabContent: TabContentInterface
