/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
declare enum NavigationTitleMode {
    Free = 0,
    Full,
    Mini,
}

declare interface NavigationInterface { 
    (): NavigationAttribute
}

declare class NavigationAttribute extends CommonMethod<NavigationAttribute> {

    // backButtonIcon(value: string | PixelMap | Resource): NavigationAttribute;
    // backButtonIcon(value: string | PixelMap ): NavigationAttribute;

    // TBD: Fix TestGeneratorVisitor to not generate undefined values
    // navBarWidthRange(value: [Dimension, Dimension]): NavigationAttribute;

    // testTuple(value: [boolean, number]): NavigationAttribute;
    // titleMode(value: NavigationTitleMode): NavigationAttribute;

    // testTuple(value: [boolean, number]): NavigationAttribute;
    // testArray1(value: Array<boolean>): NavigationAttribute;
    // testArray2(value: Array<number>): NavigationAttribute;
    // testBoolean(value: boolean): NavigationAttribute;
    // testNumber(value: number): NavigationAttribute;

  onTitleModeChange(callback: (titleMode: NavigationTitleMode) => void): NavigationAttribute;
}

declare const Navigation: NavigationInterface

declare interface NavPathStack { 
    (): NavigationAttribute
}

declare enum NavigationMode {
    Stack,
    Split,
    Auto,
  }