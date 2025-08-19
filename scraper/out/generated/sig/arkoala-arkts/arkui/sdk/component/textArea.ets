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
import { TextContentControllerBase, SelectionOptions, Bindable, CommonMethod, TextDecorationOptions, InputCounterOptions, ArkCommonMethodStyle } from "./common"
import { ResourceStr, ResourceColor, Font, Length, Dimension } from "./units"
import { Resource } from "@global.resource"
import { EnterKeyType, SubmitEvent, ContentType } from "./textInput"
import { PasteEvent, KeyboardOptions } from "./richEditor"
import { InsertValue, DeleteValue, EditableTextChangeValue, CaretStyle, EditableTextOnChangeCallback, PreviewText, TextChangeOptions, EditMenuOptions, AutoCapitalizationMode, KeyboardAppearance } from "./textCommon"
import { Color, TextAlign, FontStyle, FontWeight, TextOverflow, CopyOptions, TextContentStyle, BarState, TextHeightAdaptivePolicy, WordBreak, LineBreakStrategy, EllipsisMode } from "./enums"
import { LengthMetrics } from "./../Graphics"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
import { CustomBuilder } from "./builder"
export declare class TextAreaController extends TextContentControllerBase {
    constructor()
    caretPosition(value: number): void
    setTextSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void
    stopEditing(): void
}
export declare interface TextAreaOptions {
    placeholder?: ResourceStr;
    text?: ResourceStr | Bindable<ResourceStr> | Bindable<Resource> | Bindable<string>;
    controller?: TextAreaController;
}
export enum TextAreaType {
    NORMAL = 0,
    NUMBER = 2,
    PHONE_NUMBER = 3,
    EMAIL = 5,
    NUMBER_DECIMAL = 12,
    URL = 13
}
export type TextAreaSubmitCallback = (enterKeyType: EnterKeyType, event?: SubmitEvent) => void;
export interface TextAreaAttribute extends CommonMethod {
    placeholderColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method placeholderColor")
    }
    placeholderFont(value: Font | undefined): this {
        throw new Error("Unimplemented method placeholderFont")
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        throw new Error("Unimplemented method enterKeyType")
    }
    textAlign(value: TextAlign | undefined): this {
        throw new Error("Unimplemented method textAlign")
    }
    caretColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method caretColor")
    }
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontSize(value: Length | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    fontStyle(value: FontStyle | undefined): this {
        throw new Error("Unimplemented method fontStyle")
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    fontFamily(value: ResourceStr | undefined): this {
        throw new Error("Unimplemented method fontFamily")
    }
    textOverflow(value: TextOverflow | undefined): this {
        throw new Error("Unimplemented method textOverflow")
    }
    textIndent(value: Dimension | undefined): this {
        throw new Error("Unimplemented method textIndent")
    }
    caretStyle(value: CaretStyle | undefined): this {
        throw new Error("Unimplemented method caretStyle")
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedBackgroundColor")
    }
    onSubmit(value: ((enterKey: EnterKeyType) => void) | TextAreaSubmitCallback | undefined): this {
        throw new Error("Unimplemented method onSubmit")
    }
    onChange(value: EditableTextOnChangeCallback | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    onTextSelectionChange(value: ((selectionStart: number,selectionEnd: number) => void) | undefined): this {
        throw new Error("Unimplemented method onTextSelectionChange")
    }
    onContentScroll(value: ((selectionStart: number,selectionEnd: number) => void) | undefined): this {
        throw new Error("Unimplemented method onContentScroll")
    }
    onEditChange(value: ((isEditing: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onEditChange")
    }
    onCopy(value: ((value: string) => void) | undefined): this {
        throw new Error("Unimplemented method onCopy")
    }
    onCut(value: ((value: string) => void) | undefined): this {
        throw new Error("Unimplemented method onCut")
    }
    onPaste(value: ((value: string,event: PasteEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onPaste")
    }
    copyOption(value: CopyOptions | undefined): this {
        throw new Error("Unimplemented method copyOption")
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableKeyboardOnFocus")
    }
    maxLength(value: number | undefined): this {
        throw new Error("Unimplemented method maxLength")
    }
    style(value: TextContentStyle | undefined): this {
        throw new Error("Unimplemented method style")
    }
    barState(value: BarState | undefined): this {
        throw new Error("Unimplemented method barState")
    }
    selectionMenuHidden(value: boolean | undefined): this {
        throw new Error("Unimplemented method selectionMenuHidden")
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
    heightAdaptivePolicy(value: TextHeightAdaptivePolicy | undefined): this {
        throw new Error("Unimplemented method heightAdaptivePolicy")
    }
    maxLines(value: number | undefined): this {
        throw new Error("Unimplemented method maxLines")
    }
    wordBreak(value: WordBreak | undefined): this {
        throw new Error("Unimplemented method wordBreak")
    }
    lineBreakStrategy(value: LineBreakStrategy | undefined): this {
        throw new Error("Unimplemented method lineBreakStrategy")
    }
    decoration(value: TextDecorationOptions | undefined): this {
        throw new Error("Unimplemented method decoration")
    }
    letterSpacing(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method letterSpacing")
    }
    lineSpacing(value: LengthMetrics | undefined): this {
        throw new Error("Unimplemented method lineSpacing")
    }
    lineHeight(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method lineHeight")
    }
    type(value: TextAreaType | undefined): this {
        throw new Error("Unimplemented method type")
    }
    enableAutoFill(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableAutoFill")
    }
    contentType(value: ContentType | undefined): this {
        throw new Error("Unimplemented method contentType")
    }
    fontFeature(value: string | undefined): this {
        throw new Error("Unimplemented method fontFeature")
    }
    onWillInsert(value: ((value0: InsertValue) => boolean) | undefined): this {
        throw new Error("Unimplemented method onWillInsert")
    }
    onDidInsert(value: ((value0: InsertValue) => void) | undefined): this {
        throw new Error("Unimplemented method onDidInsert")
    }
    onWillDelete(value: ((value0: DeleteValue) => boolean) | undefined): this {
        throw new Error("Unimplemented method onWillDelete")
    }
    onDidDelete(value: ((value0: DeleteValue) => void) | undefined): this {
        throw new Error("Unimplemented method onDidDelete")
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        throw new Error("Unimplemented method editMenuOptions")
    }
    enablePreviewText(value: boolean | undefined): this {
        throw new Error("Unimplemented method enablePreviewText")
    }
    enableHapticFeedback(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableHapticFeedback")
    }
    autoCapitalizationMode(value: AutoCapitalizationMode | undefined): this {
        throw new Error("Unimplemented method autoCapitalizationMode")
    }
    halfLeading(value: boolean | undefined): this {
        throw new Error("Unimplemented method halfLeading")
    }
    ellipsisMode(value: EllipsisMode | undefined): this {
        throw new Error("Unimplemented method ellipsisMode")
    }
    stopBackPress(value: boolean | undefined): this {
        throw new Error("Unimplemented method stopBackPress")
    }
    onWillChange(value: ((value0: EditableTextChangeValue) => boolean) | undefined): this {
        throw new Error("Unimplemented method onWillChange")
    }
    keyboardAppearance(value: KeyboardAppearance | undefined): this {
        throw new Error("Unimplemented method keyboardAppearance")
    }
    inputFilter(value: ResourceStr | undefined, error?: ((value: string) => void)): this {
        throw new Error("Unimplemented method inputFilter")
    }
    showCounter(value: boolean | undefined, options?: InputCounterOptions): this {
        throw new Error("Unimplemented method showCounter")
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        throw new Error("Unimplemented method customKeyboard")
    }
    attributeModifier(value: AttributeModifier<TextAreaAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTextAreaStyle extends ArkCommonMethodStyle implements TextAreaAttribute {
    placeholderColor_value?: ResourceColor | undefined
    placeholderFont_value?: Font | undefined
    enterKeyType_value?: EnterKeyType | undefined
    textAlign_value?: TextAlign | undefined
    caretColor_value?: ResourceColor | undefined
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: Length | undefined
    fontStyle_value?: FontStyle | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    fontFamily_value?: ResourceStr | undefined
    textOverflow_value?: TextOverflow | undefined
    textIndent_value?: Dimension | undefined
    caretStyle_value?: CaretStyle | undefined
    selectedBackgroundColor_value?: ResourceColor | undefined
    onSubmit_value?: ((enterKey: EnterKeyType) => void) | TextAreaSubmitCallback | undefined
    onChange_value?: EditableTextOnChangeCallback | undefined
    onTextSelectionChange_value?: ((selectionStart: number,selectionEnd: number) => void) | undefined
    onContentScroll_value?: ((selectionStart: number,selectionEnd: number) => void) | undefined
    onEditChange_value?: ((isEditing: boolean) => void) | undefined
    onCopy_value?: ((value: string) => void) | undefined
    onCut_value?: ((value: string) => void) | undefined
    onPaste_value?: ((value: string,event: PasteEvent) => void) | undefined
    copyOption_value?: CopyOptions | undefined
    enableKeyboardOnFocus_value?: boolean | undefined
    maxLength_value?: number | undefined
    style_value?: TextContentStyle | undefined
    barState_value?: BarState | undefined
    selectionMenuHidden_value?: boolean | undefined
    minFontSize_value?: number | string | Resource | undefined
    maxFontSize_value?: number | string | Resource | undefined
    minFontScale_value?: number | Resource | undefined
    maxFontScale_value?: number | Resource | undefined
    heightAdaptivePolicy_value?: TextHeightAdaptivePolicy | undefined
    maxLines_value?: number | undefined
    wordBreak_value?: WordBreak | undefined
    lineBreakStrategy_value?: LineBreakStrategy | undefined
    decoration_value?: TextDecorationOptions | undefined
    letterSpacing_value?: number | string | Resource | undefined
    lineSpacing_value?: LengthMetrics | undefined
    lineHeight_value?: number | string | Resource | undefined
    type_value?: TextAreaType | undefined
    enableAutoFill_value?: boolean | undefined
    contentType_value?: ContentType | undefined
    fontFeature_value?: string | undefined
    onWillInsert_value?: ((value0: InsertValue) => boolean) | undefined
    onDidInsert_value?: ((value0: InsertValue) => void) | undefined
    onWillDelete_value?: ((value0: DeleteValue) => boolean) | undefined
    onDidDelete_value?: ((value0: DeleteValue) => void) | undefined
    editMenuOptions_value?: EditMenuOptions | undefined
    enablePreviewText_value?: boolean | undefined
    enableHapticFeedback_value?: boolean | undefined
    autoCapitalizationMode_value?: AutoCapitalizationMode | undefined
    halfLeading_value?: boolean | undefined
    ellipsisMode_value?: EllipsisMode | undefined
    stopBackPress_value?: boolean | undefined
    onWillChange_value?: ((value0: EditableTextChangeValue) => boolean) | undefined
    keyboardAppearance_value?: KeyboardAppearance | undefined
    attributeModifier_value?: AttributeModifier<TextAreaAttribute> | AttributeModifier<CommonMethod> | undefined
    placeholderColor(value: ResourceColor | undefined): this {
        return this
    }
    placeholderFont(value: Font | undefined): this {
        return this
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        return this
    }
    textAlign(value: TextAlign | undefined): this {
        return this
    }
    caretColor(value: ResourceColor | undefined): this {
        return this
    }
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    fontSize(value: Length | undefined): this {
        return this
    }
    fontStyle(value: FontStyle | undefined): this {
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        return this
    }
    fontFamily(value: ResourceStr | undefined): this {
        return this
    }
    textOverflow(value: TextOverflow | undefined): this {
        return this
    }
    textIndent(value: Dimension | undefined): this {
        return this
    }
    caretStyle(value: CaretStyle | undefined): this {
        return this
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    onSubmit(value: ((enterKey: EnterKeyType) => void) | TextAreaSubmitCallback | undefined): this {
        return this
    }
    onChange(value: EditableTextOnChangeCallback | undefined): this {
        return this
    }
    onTextSelectionChange(value: ((selectionStart: number,selectionEnd: number) => void) | undefined): this {
        return this
    }
    onContentScroll(value: ((selectionStart: number,selectionEnd: number) => void) | undefined): this {
        return this
    }
    onEditChange(value: ((isEditing: boolean) => void) | undefined): this {
        return this
    }
    onCopy(value: ((value: string) => void) | undefined): this {
        return this
    }
    onCut(value: ((value: string) => void) | undefined): this {
        return this
    }
    onPaste(value: ((value: string,event: PasteEvent) => void) | undefined): this {
        return this
    }
    copyOption(value: CopyOptions | undefined): this {
        return this
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
        return this
    }
    maxLength(value: number | undefined): this {
        return this
    }
    style(value: TextContentStyle | undefined): this {
        return this
    }
    barState(value: BarState | undefined): this {
        return this
    }
    selectionMenuHidden(value: boolean | undefined): this {
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
    heightAdaptivePolicy(value: TextHeightAdaptivePolicy | undefined): this {
        return this
    }
    maxLines(value: number | undefined): this {
        return this
    }
    wordBreak(value: WordBreak | undefined): this {
        return this
    }
    lineBreakStrategy(value: LineBreakStrategy | undefined): this {
        return this
    }
    decoration(value: TextDecorationOptions | undefined): this {
        return this
    }
    letterSpacing(value: number | string | Resource | undefined): this {
        return this
    }
    lineSpacing(value: LengthMetrics | undefined): this {
        return this
    }
    lineHeight(value: number | string | Resource | undefined): this {
        return this
    }
    type(value: TextAreaType | undefined): this {
        return this
    }
    enableAutoFill(value: boolean | undefined): this {
        return this
    }
    contentType(value: ContentType | undefined): this {
        return this
    }
    fontFeature(value: string | undefined): this {
        return this
    }
    onWillInsert(value: ((value0: InsertValue) => boolean) | undefined): this {
        return this
    }
    onDidInsert(value: ((value0: InsertValue) => void) | undefined): this {
        return this
    }
    onWillDelete(value: ((value0: DeleteValue) => boolean) | undefined): this {
        return this
    }
    onDidDelete(value: ((value0: DeleteValue) => void) | undefined): this {
        return this
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        return this
    }
    enablePreviewText(value: boolean | undefined): this {
        return this
    }
    enableHapticFeedback(value: boolean | undefined): this {
        return this
    }
    autoCapitalizationMode(value: AutoCapitalizationMode | undefined): this {
        return this
    }
    halfLeading(value: boolean | undefined): this {
        return this
    }
    ellipsisMode(value: EllipsisMode | undefined): this {
        return this
    }
    stopBackPress(value: boolean | undefined): this {
        return this
    }
    onWillChange(value: ((value0: EditableTextChangeValue) => boolean) | undefined): this {
        return this
    }
    keyboardAppearance(value: KeyboardAppearance | undefined): this {
        return this
    }
    inputFilter(value: ResourceStr | undefined, error?: ((value: string) => void)): this {
        return this
    }
    showCounter(value: boolean | undefined, options?: InputCounterOptions): this {
        return this
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TextAreaAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function TextArea(
    value?: TextAreaOptions,
    @memo
    content_?: () => void,
): TextAreaAttribute { throw new Error("")}
