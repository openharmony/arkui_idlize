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

interface IndicatorStyle {

    color?: ResourceColor;
}

declare class SubTabBarStyle {

    constructor(content: ResourceStr);

    // constructor(content: ResourceStr | ComponentContent);

    // static of(content: ResourceStr): SubTabBarStyle;

    // static of(content: ResourceStr | ComponentContent): SubTabBarStyle;

    indicator(value: IndicatorStyle): SubTabBarStyle;

    id(value: string): SubTabBarStyle;
}

declare class BottomTabBarStyle {

    id(value: string): BottomTabBarStyle;
}

declare class TabContentAttribute extends CommonMethod<TabContentAttribute> {

    tabBar(value: SubTabBarStyle): TabContentAttribute;
//     tabBar(value: SubTabBarStyle | BottomTabBarStyle): TabContentAttribute;
}
