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
import { TextOverflow, Color, FontStyle, TextAlign, TextCase, CopyOptions, TextHeightAdaptivePolicy, WordBreak, LineBreakStrategy, EllipsisMode, TextSelectableMode, FontWeight } from "./enums"
import { CommonMethod, ShadowOptions, ArkCommonMethodStyle } from "./common"
import { ResourceColor, Length, Font } from "./units"
import { Resource } from "@global.resource"
import { LengthMetrics } from "./../Graphics"
import { DecorationStyleInterface, StyledString } from "./styledString"
import { TextDataDetectorConfig, EditMenuOptions, FontSettingOptions, LayoutManager } from "./textCommon"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
import { CustomBuilder } from "./builder"
import { SelectionMenuOptions } from "./richEditor"
export declare interface TextOverflowOptions {
    overflow: TextOverflow;
}
export interface TextAttribute extends CommonMethod {
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontSize(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    minFontSize(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method minFontSize")
    }
    maxFontSize(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method maxFontSize")
    }
    minFontScale(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method minFontScale")
    }
    maxFontScale(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method maxFontScale")
    }
    fontStyle(value: FontStyle | undefined): this {
        throw new Error("Unimplemented method fontStyle")
    }
    lineSpacing(value: LengthMetrics | undefined): this {
        throw new Error("Unimplemented method lineSpacing")
    }
    textAlign(value: TextAlign | undefined): this {
        throw new Error("Unimplemented method textAlign")
    }
    lineHeight(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method lineHeight")
    }
    textOverflow(value: TextOverflowOptions | undefined): this {
        throw new Error("Unimplemented method textOverflow")
    }
    fontFamily(value: string | Resource | undefined): this {
        throw new Error("Unimplemented method fontFamily")
    }
    maxLines(value: number | undefined): this {
        throw new Error("Unimplemented method maxLines")
    }
    decoration(value: DecorationStyleInterface | undefined): this {
        throw new Error("Unimplemented method decoration")
    }
    letterSpacing(value: number | string | undefined): this {
        throw new Error("Unimplemented method letterSpacing")
    }
    textCase(value: TextCase | undefined): this {
        throw new Error("Unimplemented method textCase")
    }
    baselineOffset(value: number | string | undefined): this {
        throw new Error("Unimplemented method baselineOffset")
    }
    copyOption(value: CopyOptions | undefined): this {
        throw new Error("Unimplemented method copyOption")
    }
    draggable(value: boolean | undefined): this
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        throw new Error("Unimplemented method textShadow")
    }
    heightAdaptivePolicy(value: TextHeightAdaptivePolicy | undefined): this {
        throw new Error("Unimplemented method heightAdaptivePolicy")
    }
    textIndent(value: Length | undefined): this {
        throw new Error("Unimplemented method textIndent")
    }
    wordBreak(value: WordBreak | undefined): this {
        throw new Error("Unimplemented method wordBreak")
    }
    lineBreakStrategy(value: LineBreakStrategy | undefined): this {
        throw new Error("Unimplemented method lineBreakStrategy")
    }
    onCopy(value: ((value: string) => void) | undefined): this {
        throw new Error("Unimplemented method onCopy")
    }
    caretColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method caretColor")
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedBackgroundColor")
    }
    ellipsisMode(value: EllipsisMode | undefined): this {
        throw new Error("Unimplemented method ellipsisMode")
    }
    enableDataDetector(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableDataDetector")
    }
    dataDetectorConfig(value: TextDataDetectorConfig | undefined): this {
        throw new Error("Unimplemented method dataDetectorConfig")
    }
    onTextSelectionChange(value: ((selectionStart: number,selectionEnd: number) => void) | undefined): this {
        throw new Error("Unimplemented method onTextSelectionChange")
    }
    fontFeature(value: string | undefined): this {
        throw new Error("Unimplemented method fontFeature")
    }
    marqueeOptions(value: TextMarqueeOptions | undefined): this {
        throw new Error("Unimplemented method marqueeOptions")
    }
    onMarqueeStateChange(value: ((value0: MarqueeState) => void) | undefined): this {
        throw new Error("Unimplemented method onMarqueeStateChange")
    }
    privacySensitive(value: boolean | undefined): this {
        throw new Error("Unimplemented method privacySensitive")
    }
    textSelectable(value: TextSelectableMode | undefined): this {
        throw new Error("Unimplemented method textSelectable")
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        throw new Error("Unimplemented method editMenuOptions")
    }
    halfLeading(value: boolean | undefined): this {
        throw new Error("Unimplemented method halfLeading")
    }
    enableHapticFeedback(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableHapticFeedback")
    }
    font(fontValue: Font | undefined, options?: FontSettingOptions): this {
        throw new Error("Unimplemented method font")
    }
    fontWeight(weight: number | FontWeight | string | undefined, options?: FontSettingOptions): this {
        throw new Error("Unimplemented method fontWeight")
    }
    selection(selectionStart: number | undefined, selectionEnd: number | undefined): this {
        throw new Error("Unimplemented method selection")
    }
    bindSelectionMenu(spanType: TextSpanType | undefined, content: CustomBuilder | undefined, responseType: TextResponseType | undefined, options?: SelectionMenuOptions): this {
        throw new Error("Unimplemented method bindSelectionMenu")
    }
    attributeModifier(value: AttributeModifier<TextAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTextStyle extends ArkCommonMethodStyle implements TextAttribute {
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: number | string | Resource | undefined
    minFontSize_value?: number | string | Resource | undefined
    maxFontSize_value?: number | string | Resource | undefined
    minFontScale_value?: number | Resource | undefined
    maxFontScale_value?: number | Resource | undefined
    fontStyle_value?: FontStyle | undefined
    lineSpacing_value?: LengthMetrics | undefined
    textAlign_value?: TextAlign | undefined
    lineHeight_value?: number | string | Resource | undefined
    textOverflow_value?: TextOverflowOptions | undefined
    fontFamily_value?: string | Resource | undefined
    maxLines_value?: number | undefined
    decoration_value?: DecorationStyleInterface | undefined
    letterSpacing_value?: number | string | undefined
    textCase_value?: TextCase | undefined
    baselineOffset_value?: number | string | undefined
    copyOption_value?: CopyOptions | undefined
    draggable_value?: boolean | undefined
    textShadow_value?: ShadowOptions | Array<ShadowOptions> | undefined
    heightAdaptivePolicy_value?: TextHeightAdaptivePolicy | undefined
    textIndent_value?: Length | undefined
    wordBreak_value?: WordBreak | undefined
    lineBreakStrategy_value?: LineBreakStrategy | undefined
    onCopy_value?: ((value: string) => void) | undefined
    caretColor_value?: ResourceColor | undefined
    selectedBackgroundColor_value?: ResourceColor | undefined
    ellipsisMode_value?: EllipsisMode | undefined
    enableDataDetector_value?: boolean | undefined
    dataDetectorConfig_value?: TextDataDetectorConfig | undefined
    onTextSelectionChange_value?: ((selectionStart: number,selectionEnd: number) => void) | undefined
    fontFeature_value?: string | undefined
    marqueeOptions_value?: TextMarqueeOptions | undefined
    onMarqueeStateChange_value?: ((value0: MarqueeState) => void) | undefined
    privacySensitive_value?: boolean | undefined
    textSelectable_value?: TextSelectableMode | undefined
    editMenuOptions_value?: EditMenuOptions | undefined
    halfLeading_value?: boolean | undefined
    enableHapticFeedback_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<TextAttribute> | AttributeModifier<CommonMethod> | undefined
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    fontSize(value: number | string | Resource | undefined): this {
        return this
    }
    minFontSize(value: number | string | Resource | undefined): this {
        return this
    }
    maxFontSize(value: number | string | Resource | undefined): this {
        return this
    }
    minFontScale(value: number | Resource | undefined): this {
        return this
    }
    maxFontScale(value: number | Resource | undefined): this {
        return this
    }
    fontStyle(value: FontStyle | undefined): this {
        return this
    }
    lineSpacing(value: LengthMetrics | undefined): this {
        return this
    }
    textAlign(value: TextAlign | undefined): this {
        return this
    }
    lineHeight(value: number | string | Resource | undefined): this {
        return this
    }
    textOverflow(value: TextOverflowOptions | undefined): this {
        return this
    }
    fontFamily(value: string | Resource | undefined): this {
        return this
    }
    maxLines(value: number | undefined): this {
        return this
    }
    decoration(value: DecorationStyleInterface | undefined): this {
        return this
    }
    letterSpacing(value: number | string | undefined): this {
        return this
    }
    textCase(value: TextCase | undefined): this {
        return this
    }
    baselineOffset(value: number | string | undefined): this {
        return this
    }
    copyOption(value: CopyOptions | undefined): this {
        return this
    }
    draggable(value: boolean | undefined): this {
        return this
    }
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        return this
    }
    heightAdaptivePolicy(value: TextHeightAdaptivePolicy | undefined): this {
        return this
    }
    textIndent(value: Length | undefined): this {
        return this
    }
    wordBreak(value: WordBreak | undefined): this {
        return this
    }
    lineBreakStrategy(value: LineBreakStrategy | undefined): this {
        return this
    }
    onCopy(value: ((value: string) => void) | undefined): this {
        return this
    }
    caretColor(value: ResourceColor | undefined): this {
        return this
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    ellipsisMode(value: EllipsisMode | undefined): this {
        return this
    }
    enableDataDetector(value: boolean | undefined): this {
        return this
    }
    dataDetectorConfig(value: TextDataDetectorConfig | undefined): this {
        return this
    }
    onTextSelectionChange(value: ((selectionStart: number,selectionEnd: number) => void) | undefined): this {
        return this
    }
    fontFeature(value: string | undefined): this {
        return this
    }
    marqueeOptions(value: TextMarqueeOptions | undefined): this {
        return this
    }
    onMarqueeStateChange(value: ((value0: MarqueeState) => void) | undefined): this {
        return this
    }
    privacySensitive(value: boolean | undefined): this {
        return this
    }
    textSelectable(value: TextSelectableMode | undefined): this {
        return this
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        return this
    }
    halfLeading(value: boolean | undefined): this {
        return this
    }
    enableHapticFeedback(value: boolean | undefined): this {
        return this
    }
    font(fontValue: Font | undefined, options?: FontSettingOptions): this {
        return this
    }
    fontWeight(weight: number | FontWeight | string | undefined, options?: FontSettingOptions): this {
        return this
    }
    selection(selectionStart: number | undefined, selectionEnd: number | undefined): this {
        return this
    }
    bindSelectionMenu(spanType: TextSpanType | undefined, content: CustomBuilder | undefined, responseType: TextResponseType | undefined, options?: SelectionMenuOptions): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TextAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export enum TextSpanType {
    TEXT = 0,
    IMAGE = 1,
    MIXED = 2,
    DEFAULT = 3
}
export enum TextResponseType {
    RIGHT_CLICK = 0,
    LONG_PRESS = 1,
    SELECT = 2,
    DEFAULT = 3
}
export enum MarqueeState {
    START = 0,
    BOUNCE = 1,
    FINISH = 2
}
export enum MarqueeStartPolicy {
    DEFAULT = 0,
    ON_FOCUS = 1
}
export declare interface TextOptions {
    controller: TextController;
}
export declare interface TextMarqueeOptions {
    start: boolean;
    step?: number;
    loop?: number;
    fromStart?: boolean;
    delay?: number;
    fadeout?: boolean;
    marqueeStartPolicy?: MarqueeStartPolicy;
}
export declare class TextController {
    constructor()
    closeSelectionMenu(): void
    setStyledString(value: StyledString): void
    getLayoutManager(): LayoutManager
}

@memo
@ComponentBuilder
export function Text(
    content?: string | Resource, value?: TextOptions,
    @memo
    content_?: () => void,
): TextAttribute { throw new Error("")}
