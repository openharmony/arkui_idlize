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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer, KStringPtr } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { ResourceColor, Length, ResourceStr, Font, Padding, Dimension, LocalizedPadding, VoidCallback } from "./units"
import { Color, TextOverflow, TextHeightAdaptivePolicy, VerticalAlign } from "./enums"
import { Resource } from "@global.resource"
import { SymbolGlyphModifier } from "./../SymbolGlyphModifier"
import { ComponentContent } from "./../ComponentContent"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { CustomBuilder } from "./builder"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum SelectedMode {
    INDICATOR = 0,
    BOARD = 1
}
export enum LayoutMode {
    AUTO = 0,
    VERTICAL = 1,
    HORIZONTAL = 2
}
export declare interface SubTabBarIndicatorStyle {
    color?: ResourceColor;
    height?: Length;
    width?: Length;
    borderRadius?: Length;
    marginTop?: Length;
}
export declare interface BoardStyle {
    borderRadius?: Length;
}
export declare interface TabBarLabelStyle {
    overflow?: TextOverflow;
    maxLines?: number;
    minFontSize?: number | ResourceStr;
    maxFontSize?: number | ResourceStr;
    heightAdaptivePolicy?: TextHeightAdaptivePolicy;
    font?: Font;
    selectedColor?: ResourceColor;
    unselectedColor?: ResourceColor;
}
export declare interface TabBarIconStyle {
    selectedColor?: ResourceColor;
    unselectedColor?: ResourceColor;
}
export declare class TabBarSymbol {
    constructor()
    normal: SymbolGlyphModifier;
    selected?: SymbolGlyphModifier | undefined;
}
export declare interface TabBarOptions {
    icon?: string | Resource;
    text?: string | Resource;
}
export declare class SubTabBarStyle {
}
export declare class BottomTabBarStyle {
}
export interface TabContentAttribute extends CommonMethod {
    tabBar(value: ComponentContent | SubTabBarStyle | BottomTabBarStyle | string | Resource | CustomBuilder | TabBarOptions | undefined): this {
        throw new Error("Unimplemented method tabBar")
    }
    onWillShow(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onWillShow")
    }
    onWillHide(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onWillHide")
    }
    attributeModifier(value: AttributeModifier<TabContentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTabContentStyle extends ArkCommonMethodStyle implements TabContentAttribute {
    tabBar_value?: ComponentContent | SubTabBarStyle | BottomTabBarStyle | string | Resource | CustomBuilder | TabBarOptions | undefined
    onWillShow_value?: VoidCallback | undefined
    onWillHide_value?: VoidCallback | undefined
    attributeModifier_value?: AttributeModifier<TabContentAttribute> | AttributeModifier<CommonMethod> | undefined
    tabBar(value: ComponentContent | SubTabBarStyle | BottomTabBarStyle | string | Resource | CustomBuilder | TabBarOptions | undefined): this {
        return this
    }
    onWillShow(value: VoidCallback | undefined): this {
        return this
    }
    onWillHide(value: VoidCallback | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TabContentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function TabContent(
    
    @memo
    content_?: () => void,
): TabContentAttribute { throw new Error("")}
