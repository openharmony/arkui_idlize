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
import { Bindable, CommonMethod, BlurStyle, ArkCommonMethodStyle } from "./common"
import { ResourceColor, Font, Position, Length } from "./units"
import { Color } from "./enums"
import { Resource } from "@global.resource"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum IndexerAlign {
    LEFT = 0,
    Left = 0,
    RIGHT = 1,
    Right = 1,
    START = 2,
    END = 3
}
export declare interface AlphabetIndexerOptions {
    arrayValue: Array<string>;
    selected: number | Bindable<number>;
}
export type OnAlphabetIndexerSelectCallback = (index: number) => void;
export type OnAlphabetIndexerPopupSelectCallback = (index: number) => void;
export type OnAlphabetIndexerRequestPopupDataCallback = (index: number) => Array<string>;
export interface AlphabetIndexerAttribute extends CommonMethod {
    color(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method color")
    }
    selectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedColor")
    }
    popupColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method popupColor")
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedBackgroundColor")
    }
    popupBackground(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method popupBackground")
    }
    popupSelectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method popupSelectedColor")
    }
    popupUnselectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method popupUnselectedColor")
    }
    popupItemBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method popupItemBackgroundColor")
    }
    usingPopup(value: boolean | undefined): this {
        throw new Error("Unimplemented method usingPopup")
    }
    selectedFont(value: Font | undefined): this {
        throw new Error("Unimplemented method selectedFont")
    }
    popupFont(value: Font | undefined): this {
        throw new Error("Unimplemented method popupFont")
    }
    popupItemFont(value: Font | undefined): this {
        throw new Error("Unimplemented method popupItemFont")
    }
    itemSize(value: string | number | undefined): this {
        throw new Error("Unimplemented method itemSize")
    }
    font(value: Font | undefined): this {
        throw new Error("Unimplemented method font")
    }
    onSelect(value: OnAlphabetIndexerSelectCallback | undefined): this {
        throw new Error("Unimplemented method onSelect")
    }
    onRequestPopupData(value: OnAlphabetIndexerRequestPopupDataCallback | undefined): this {
        throw new Error("Unimplemented method onRequestPopupData")
    }
    onPopupSelect(value: OnAlphabetIndexerPopupSelectCallback | undefined): this {
        throw new Error("Unimplemented method onPopupSelect")
    }
    selected(value: number | Bindable<number> | undefined): this {
        throw new Error("Unimplemented method selected")
    }
    popupPosition(value: Position | undefined): this {
        throw new Error("Unimplemented method popupPosition")
    }
    autoCollapse(value: boolean | undefined): this {
        throw new Error("Unimplemented method autoCollapse")
    }
    popupItemBorderRadius(value: number | undefined): this {
        throw new Error("Unimplemented method popupItemBorderRadius")
    }
    itemBorderRadius(value: number | undefined): this {
        throw new Error("Unimplemented method itemBorderRadius")
    }
    popupBackgroundBlurStyle(value: BlurStyle | undefined): this {
        throw new Error("Unimplemented method popupBackgroundBlurStyle")
    }
    popupTitleBackground(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method popupTitleBackground")
    }
    enableHapticFeedback(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableHapticFeedback")
    }
    alignStyle(value: IndexerAlign | undefined, offset?: Length): this {
        throw new Error("Unimplemented method alignStyle")
    }
    attributeModifier(value: AttributeModifier<AlphabetIndexerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkAlphabetIndexerStyle extends ArkCommonMethodStyle implements AlphabetIndexerAttribute {
    color_value?: ResourceColor | undefined
    selectedColor_value?: ResourceColor | undefined
    popupColor_value?: ResourceColor | undefined
    selectedBackgroundColor_value?: ResourceColor | undefined
    popupBackground_value?: ResourceColor | undefined
    popupSelectedColor_value?: ResourceColor | undefined
    popupUnselectedColor_value?: ResourceColor | undefined
    popupItemBackgroundColor_value?: ResourceColor | undefined
    usingPopup_value?: boolean | undefined
    selectedFont_value?: Font | undefined
    popupFont_value?: Font | undefined
    popupItemFont_value?: Font | undefined
    itemSize_value?: string | number | undefined
    font_value?: Font | undefined
    onSelect_value?: OnAlphabetIndexerSelectCallback | undefined
    onRequestPopupData_value?: OnAlphabetIndexerRequestPopupDataCallback | undefined
    onPopupSelect_value?: OnAlphabetIndexerPopupSelectCallback | undefined
    selected_value?: number | Bindable<number> | undefined
    popupPosition_value?: Position | undefined
    autoCollapse_value?: boolean | undefined
    popupItemBorderRadius_value?: number | undefined
    itemBorderRadius_value?: number | undefined
    popupBackgroundBlurStyle_value?: BlurStyle | undefined
    popupTitleBackground_value?: ResourceColor | undefined
    enableHapticFeedback_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<AlphabetIndexerAttribute> | AttributeModifier<CommonMethod> | undefined
    color(value: ResourceColor | undefined): this {
        return this
    }
    selectedColor(value: ResourceColor | undefined): this {
        return this
    }
    popupColor(value: ResourceColor | undefined): this {
        return this
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    popupBackground(value: ResourceColor | undefined): this {
        return this
    }
    popupSelectedColor(value: ResourceColor | undefined): this {
        return this
    }
    popupUnselectedColor(value: ResourceColor | undefined): this {
        return this
    }
    popupItemBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    usingPopup(value: boolean | undefined): this {
        return this
    }
    selectedFont(value: Font | undefined): this {
        return this
    }
    popupFont(value: Font | undefined): this {
        return this
    }
    popupItemFont(value: Font | undefined): this {
        return this
    }
    itemSize(value: string | number | undefined): this {
        return this
    }
    font(value: Font | undefined): this {
        return this
    }
    onSelect(value: OnAlphabetIndexerSelectCallback | undefined): this {
        return this
    }
    onRequestPopupData(value: OnAlphabetIndexerRequestPopupDataCallback | undefined): this {
        return this
    }
    onPopupSelect(value: OnAlphabetIndexerPopupSelectCallback | undefined): this {
        return this
    }
    selected(value: number | Bindable<number> | undefined): this {
        return this
    }
    popupPosition(value: Position | undefined): this {
        return this
    }
    autoCollapse(value: boolean | undefined): this {
        return this
    }
    popupItemBorderRadius(value: number | undefined): this {
        return this
    }
    itemBorderRadius(value: number | undefined): this {
        return this
    }
    popupBackgroundBlurStyle(value: BlurStyle | undefined): this {
        return this
    }
    popupTitleBackground(value: ResourceColor | undefined): this {
        return this
    }
    enableHapticFeedback(value: boolean | undefined): this {
        return this
    }
    alignStyle(value: IndexerAlign | undefined, offset?: Length): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<AlphabetIndexerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function AlphabetIndexer(
    options: AlphabetIndexerOptions,
    @memo
    content_?: () => void,
): AlphabetIndexerAttribute { throw new Error("")}
