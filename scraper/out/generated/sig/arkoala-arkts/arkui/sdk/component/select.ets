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
import { ResourceStr, Dimension, EdgeOutlineWidths, ResourceColor, EdgeColors, Font, Length, DividerStyleOptions, Offset } from "./units"
import { Resource } from "@global.resource"
import { SymbolGlyphModifier } from "./../SymbolGlyphModifier"
import { Color, OptionWidthMode } from "./enums"
import { CommonMethod, Bindable, BlurStyle, CommonConfiguration, ArkCommonMethodStyle } from "./common"
import { ControlSize } from "./button"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { DividerOptions } from "./textPicker"
import { TextModifier } from "./../TextModifier"
export declare interface SelectOption {
    value: ResourceStr;
    icon?: ResourceStr;
    symbolIcon?: SymbolGlyphModifier;
}
export enum ArrowPosition {
    END = 0,
    START = 1
}
export enum MenuAlignType {
    START = 0,
    CENTER = 1,
    END = 2
}
export enum AvoidanceMode {
    COVER_TARGET = 0,
    AVOID_AROUND_TARGET = 1
}
export type OnSelectCallback = (index: number, selectStr: string) => void;
export declare interface MenuOutlineOptions {
    width?: Dimension | EdgeOutlineWidths;
    color?: ResourceColor | EdgeColors;
}
export interface SelectAttribute extends CommonMethod {
    selected(value: number | Resource | Bindable<number> | Bindable<Resource> | undefined): this {
        throw new Error("Unimplemented method selected")
    }
    value(value: ResourceStr | Bindable<string> | Bindable<Resource> | undefined): this {
        throw new Error("Unimplemented method value")
    }
    font(value: Font | undefined): this {
        throw new Error("Unimplemented method font")
    }
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    selectedOptionBgColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedOptionBgColor")
    }
    selectedOptionFont(value: Font | undefined): this {
        throw new Error("Unimplemented method selectedOptionFont")
    }
    selectedOptionFontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedOptionFontColor")
    }
    optionBgColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method optionBgColor")
    }
    optionFont(value: Font | undefined): this {
        throw new Error("Unimplemented method optionFont")
    }
    optionFontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method optionFontColor")
    }
    onSelect(value: OnSelectCallback | undefined): this {
        throw new Error("Unimplemented method onSelect")
    }
    space(value: Length | undefined): this {
        throw new Error("Unimplemented method space")
    }
    arrowPosition(value: ArrowPosition | undefined): this {
        throw new Error("Unimplemented method arrowPosition")
    }
    optionWidth(value: Dimension | OptionWidthMode | undefined): this {
        throw new Error("Unimplemented method optionWidth")
    }
    optionHeight(value: Dimension | undefined): this {
        throw new Error("Unimplemented method optionHeight")
    }
    menuBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method menuBackgroundColor")
    }
    menuBackgroundBlurStyle(value: BlurStyle | undefined): this {
        throw new Error("Unimplemented method menuBackgroundBlurStyle")
    }
    controlSize(value: ControlSize | undefined): this {
        throw new Error("Unimplemented method controlSize")
    }
    menuItemContentModifier(value: ContentModifier<MenuItemConfiguration> | undefined): this {
        throw new Error("Unimplemented method menuItemContentModifier")
    }
    divider(value: DividerOptions | undefined): this {
        throw new Error("Unimplemented method divider")
    }
    textModifier(value: TextModifier | undefined): this {
        throw new Error("Unimplemented method textModifier")
    }
    arrowModifier(value: SymbolGlyphModifier | undefined): this {
        throw new Error("Unimplemented method arrowModifier")
    }
    optionTextModifier(value: TextModifier | undefined): this {
        throw new Error("Unimplemented method optionTextModifier")
    }
    selectedOptionTextModifier(value: TextModifier | undefined): this {
        throw new Error("Unimplemented method selectedOptionTextModifier")
    }
    dividerStyle(value: DividerStyleOptions | undefined): this {
        throw new Error("Unimplemented method dividerStyle")
    }
    avoidance(value: AvoidanceMode | undefined): this {
        throw new Error("Unimplemented method avoidance")
    }
    menuOutline(value: MenuOutlineOptions | undefined): this {
        throw new Error("Unimplemented method menuOutline")
    }
    backgroundColor(value: ResourceColor | undefined): this
    menuAlign(alignType: MenuAlignType | undefined, offset?: Offset): this {
        throw new Error("Unimplemented method menuAlign")
    }
    attributeModifier(value: AttributeModifier<SelectAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSelectStyle extends ArkCommonMethodStyle implements SelectAttribute {
    selected_value?: number | Resource | Bindable<number> | Bindable<Resource> | undefined
    value_value?: ResourceStr | Bindable<string> | Bindable<Resource> | undefined
    font_value?: Font | undefined
    fontColor_value?: ResourceColor | undefined
    selectedOptionBgColor_value?: ResourceColor | undefined
    selectedOptionFont_value?: Font | undefined
    selectedOptionFontColor_value?: ResourceColor | undefined
    optionBgColor_value?: ResourceColor | undefined
    optionFont_value?: Font | undefined
    optionFontColor_value?: ResourceColor | undefined
    onSelect_value?: OnSelectCallback | undefined
    space_value?: Length | undefined
    arrowPosition_value?: ArrowPosition | undefined
    optionWidth_value?: Dimension | OptionWidthMode | undefined
    optionHeight_value?: Dimension | undefined
    menuBackgroundColor_value?: ResourceColor | undefined
    menuBackgroundBlurStyle_value?: BlurStyle | undefined
    controlSize_value?: ControlSize | undefined
    menuItemContentModifier_value?: ContentModifier<MenuItemConfiguration> | undefined
    divider_value?: DividerOptions | undefined
    textModifier_value?: TextModifier | undefined
    arrowModifier_value?: SymbolGlyphModifier | undefined
    optionTextModifier_value?: TextModifier | undefined
    selectedOptionTextModifier_value?: TextModifier | undefined
    dividerStyle_value?: DividerStyleOptions | undefined
    avoidance_value?: AvoidanceMode | undefined
    menuOutline_value?: MenuOutlineOptions | undefined
    attributeModifier_value?: AttributeModifier<SelectAttribute> | AttributeModifier<CommonMethod> | undefined
    backgroundColor_value?: ResourceColor | undefined
    selected(value: number | Resource | Bindable<number> | Bindable<Resource> | undefined): this {
        return this
    }
    value(value: ResourceStr | Bindable<string> | Bindable<Resource> | undefined): this {
        return this
    }
    font(value: Font | undefined): this {
        return this
    }
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    selectedOptionBgColor(value: ResourceColor | undefined): this {
        return this
    }
    selectedOptionFont(value: Font | undefined): this {
        return this
    }
    selectedOptionFontColor(value: ResourceColor | undefined): this {
        return this
    }
    optionBgColor(value: ResourceColor | undefined): this {
        return this
    }
    optionFont(value: Font | undefined): this {
        return this
    }
    optionFontColor(value: ResourceColor | undefined): this {
        return this
    }
    onSelect(value: OnSelectCallback | undefined): this {
        return this
    }
    space(value: Length | undefined): this {
        return this
    }
    arrowPosition(value: ArrowPosition | undefined): this {
        return this
    }
    optionWidth(value: Dimension | OptionWidthMode | undefined): this {
        return this
    }
    optionHeight(value: Dimension | undefined): this {
        return this
    }
    menuBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    menuBackgroundBlurStyle(value: BlurStyle | undefined): this {
        return this
    }
    controlSize(value: ControlSize | undefined): this {
        return this
    }
    menuItemContentModifier(value: ContentModifier<MenuItemConfiguration> | undefined): this {
        return this
    }
    divider(value: DividerOptions | undefined): this {
        return this
    }
    textModifier(value: TextModifier | undefined): this {
        return this
    }
    arrowModifier(value: SymbolGlyphModifier | undefined): this {
        return this
    }
    optionTextModifier(value: TextModifier | undefined): this {
        return this
    }
    selectedOptionTextModifier(value: TextModifier | undefined): this {
        return this
    }
    dividerStyle(value: DividerStyleOptions | undefined): this {
        return this
    }
    avoidance(value: AvoidanceMode | undefined): this {
        return this
    }
    menuOutline(value: MenuOutlineOptions | undefined): this {
        return this
    }
    backgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    menuAlign(alignType: MenuAlignType | undefined, offset?: Offset): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SelectAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface MenuItemConfiguration extends CommonConfiguration<MenuItemConfiguration> {
    value: ResourceStr;
    icon?: ResourceStr;
    symbolIcon?: SymbolGlyphModifier;
    selected: boolean;
    index: number;
}

@memo
@ComponentBuilder
export function Select(
    options: Array<SelectOption>,
    @memo
    content_?: () => void,
): SelectAttribute { throw new Error("")}
