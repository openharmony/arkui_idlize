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
import { Resource } from "@global.resource"
import { ResourceStr, Dimension, ResourceColor, Offset } from "./units"
import { Bindable, PickerTextStyle, CommonMethod, PickerDialogButtonStyle, Rectangle, BlurStyle, BackgroundBlurStyleOptions, BackgroundEffectOptions, ShadowOptions, ShadowStyle, HoverModeAreaType, ArkCommonMethodStyle } from "./common"
import { LengthMetrics } from "./../Graphics"
import { Color, TextOverflow, CrownSensitivity } from "./enums"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
import { DialogAlignment } from "./alertDialog"
export declare interface TextPickerRangeContent {
    icon: string | Resource;
    text?: string | Resource;
}
export declare interface TextCascadePickerRangeContent {
    text: string | Resource;
    children?: Array<TextCascadePickerRangeContent>;
}
export declare interface TextPickerOptions {
    range: Array<string> | Array<Array<string>> | Resource | Array<TextPickerRangeContent> | Array<TextCascadePickerRangeContent>;
    value?: ResourceStr | Array<ResourceStr> | Bindable<ResourceStr> | Bindable<Array<ResourceStr>>;
    selected?: number | Array<number> | Bindable<number> | Bindable<Array<number>>;
    columnWidths?: Array<LengthMetrics>;
}
export declare interface DividerOptions {
    strokeWidth?: Dimension;
    color?: ResourceColor;
    startMargin?: Dimension;
    endMargin?: Dimension;
}
export declare interface TextPickerTextStyle extends PickerTextStyle {
    minFontSize?: number | string | Resource;
    maxFontSize?: number | string | Resource;
    overflow?: TextOverflow;
}
export type TextPickerScrollStopCallback = (value: string | Array<string>, index: number | Array<number>) => void;
export type OnTextPickerChangeCallback = (selectItem: string | Array<string>, index: number | Array<number>) => void;
export type TextPickerEnterSelectedAreaCallback = (value: string | Array<string>, index: number | Array<number>) => void;
export interface TextPickerAttribute extends CommonMethod {
    defaultPickerItemHeight(value: number | string | undefined): this {
        throw new Error("Unimplemented method defaultPickerItemHeight")
    }
    canLoop(value: boolean | undefined): this {
        throw new Error("Unimplemented method canLoop")
    }
    disappearTextStyle(value: PickerTextStyle | undefined): this {
        throw new Error("Unimplemented method disappearTextStyle")
    }
    textStyle(value: PickerTextStyle | undefined): this {
        throw new Error("Unimplemented method textStyle")
    }
    selectedTextStyle(value: PickerTextStyle | undefined): this {
        throw new Error("Unimplemented method selectedTextStyle")
    }
    disableTextStyleAnimation(value: boolean | undefined): this {
        throw new Error("Unimplemented method disableTextStyleAnimation")
    }
    defaultTextStyle(value: TextPickerTextStyle | undefined): this {
        throw new Error("Unimplemented method defaultTextStyle")
    }
    onChange(value: OnTextPickerChangeCallback | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    onScrollStop(value: TextPickerScrollStopCallback | undefined): this {
        throw new Error("Unimplemented method onScrollStop")
    }
    onEnterSelectedArea(value: TextPickerEnterSelectedAreaCallback | undefined): this {
        throw new Error("Unimplemented method onEnterSelectedArea")
    }
    selectedIndex(value: number | Array<number> | undefined): this {
        throw new Error("Unimplemented method selectedIndex")
    }
    divider(value: DividerOptions | undefined): this {
        throw new Error("Unimplemented method divider")
    }
    gradientHeight(value: Dimension | undefined): this {
        throw new Error("Unimplemented method gradientHeight")
    }
    enableHapticFeedback(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableHapticFeedback")
    }
    digitalCrownSensitivity(value: CrownSensitivity | undefined): this {
        throw new Error("Unimplemented method digitalCrownSensitivity")
    }
    attributeModifier(value: AttributeModifier<TextPickerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTextPickerStyle extends ArkCommonMethodStyle implements TextPickerAttribute {
    defaultPickerItemHeight_value?: number | string | undefined
    canLoop_value?: boolean | undefined
    disappearTextStyle_value?: PickerTextStyle | undefined
    textStyle_value?: PickerTextStyle | undefined
    selectedTextStyle_value?: PickerTextStyle | undefined
    disableTextStyleAnimation_value?: boolean | undefined
    defaultTextStyle_value?: TextPickerTextStyle | undefined
    onChange_value?: OnTextPickerChangeCallback | undefined
    onScrollStop_value?: TextPickerScrollStopCallback | undefined
    onEnterSelectedArea_value?: TextPickerEnterSelectedAreaCallback | undefined
    selectedIndex_value?: number | Array<number> | undefined
    divider_value?: DividerOptions | undefined
    gradientHeight_value?: Dimension | undefined
    enableHapticFeedback_value?: boolean | undefined
    digitalCrownSensitivity_value?: CrownSensitivity | undefined
    attributeModifier_value?: AttributeModifier<TextPickerAttribute> | AttributeModifier<CommonMethod> | undefined
    defaultPickerItemHeight(value: number | string | undefined): this {
        return this
    }
    canLoop(value: boolean | undefined): this {
        return this
    }
    disappearTextStyle(value: PickerTextStyle | undefined): this {
        return this
    }
    textStyle(value: PickerTextStyle | undefined): this {
        return this
    }
    selectedTextStyle(value: PickerTextStyle | undefined): this {
        return this
    }
    disableTextStyleAnimation(value: boolean | undefined): this {
        return this
    }
    defaultTextStyle(value: TextPickerTextStyle | undefined): this {
        return this
    }
    onChange(value: OnTextPickerChangeCallback | undefined): this {
        return this
    }
    onScrollStop(value: TextPickerScrollStopCallback | undefined): this {
        return this
    }
    onEnterSelectedArea(value: TextPickerEnterSelectedAreaCallback | undefined): this {
        return this
    }
    selectedIndex(value: number | Array<number> | undefined): this {
        return this
    }
    divider(value: DividerOptions | undefined): this {
        return this
    }
    gradientHeight(value: Dimension | undefined): this {
        return this
    }
    enableHapticFeedback(value: boolean | undefined): this {
        return this
    }
    digitalCrownSensitivity(value: CrownSensitivity | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TextPickerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface TextPickerResult {
    value: string | Array<string>;
    index: number | Array<number>;
}
export declare interface TextPickerDialogOptions extends TextPickerOptions {
    defaultPickerItemHeight?: number | string;
    canLoop?: boolean;
    disappearTextStyle?: PickerTextStyle;
    textStyle?: PickerTextStyle;
    acceptButtonStyle?: PickerDialogButtonStyle;
    cancelButtonStyle?: PickerDialogButtonStyle;
    selectedTextStyle?: PickerTextStyle;
    disableTextStyleAnimation?: boolean;
    defaultTextStyle?: TextPickerTextStyle;
    onAccept?: ((value: TextPickerResult) => void);
    onCancel?: (() => void);
    onChange?: ((value: TextPickerResult) => void);
    onScrollStop?: ((value: TextPickerResult) => void);
    onEnterSelectedArea?: ((value: TextPickerResult) => void);
    maskRect?: Rectangle;
    alignment?: DialogAlignment;
    offset?: Offset;
    backgroundColor?: ResourceColor;
    backgroundBlurStyle?: BlurStyle;
    backgroundBlurStyleOptions?: BackgroundBlurStyleOptions;
    backgroundEffect?: BackgroundEffectOptions;
    onDidAppear?: (() => void);
    onDidDisappear?: (() => void);
    onWillAppear?: (() => void);
    onWillDisappear?: (() => void);
    shadow?: ShadowOptions | ShadowStyle;
    enableHoverMode?: boolean;
    hoverModeArea?: HoverModeAreaType;
    enableHapticFeedback?: boolean;
}
export declare class TextPickerDialog {
    constructor()
}

@memo
@ComponentBuilder
export function TextPicker(
    options?: TextPickerOptions,
    @memo
    content_?: () => void,
): TextPickerAttribute { throw new Error("")}
