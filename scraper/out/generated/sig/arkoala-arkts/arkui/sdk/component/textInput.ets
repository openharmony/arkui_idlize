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
import { ResourceColor, ResourceStr, Dimension, Font, Length } from "./units"
import { Color, TextOverflow, FontStyle, FontWeight, CopyOptions, TextAlign, TextContentStyle, BarState, WordBreak, LineBreakStrategy, TextHeightAdaptivePolicy, EllipsisMode } from "./enums"
import { Resource } from "@global.resource"
import { TextContentControllerBase, SelectionOptions, Bindable, CommonMethod, TextDecorationOptions, InputCounterOptions, ArkCommonMethodStyle } from "./common"
import { PasteEvent, KeyboardOptions } from "./richEditor"
import { InsertValue, DeleteValue, EditableTextChangeValue, EditableTextOnChangeCallback, PreviewText, TextChangeOptions, CaretStyle, EditMenuOptions, AutoCapitalizationMode, KeyboardAppearance } from "./textCommon"
import { CustomBuilder } from "./builder"
import { CancelButtonOptions, CancelButtonSymbolOptions } from "./search"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum InputType {
    NORMAL = 0,
    Normal = 0,
    NUMBER = 1,
    Number = 1,
    PHONE_NUMBER = 2,
    PhoneNumber = 2,
    EMAIL = 3,
    Email = 3,
    PASSWORD = 4,
    Password = 4,
    NUMBER_PASSWORD = 8,
    SCREEN_LOCK_PASSWORD = 9,
    USER_NAME = 10,
    NEW_PASSWORD = 11,
    NUMBER_DECIMAL = 12,
    URL = 13
}
export enum ContentType {
    USER_NAME = 0,
    PASSWORD = 1,
    NEW_PASSWORD = 2,
    FULL_STREET_ADDRESS = 3,
    HOUSE_NUMBER = 4,
    DISTRICT_ADDRESS = 5,
    CITY_ADDRESS = 6,
    PROVINCE_ADDRESS = 7,
    COUNTRY_ADDRESS = 8,
    PERSON_FULL_NAME = 9,
    PERSON_LAST_NAME = 10,
    PERSON_FIRST_NAME = 11,
    PHONE_NUMBER = 12,
    PHONE_COUNTRY_CODE = 13,
    FULL_PHONE_NUMBER = 14,
    EMAIL_ADDRESS = 15,
    BANK_CARD_NUMBER = 16,
    ID_CARD_NUMBER = 17,
    NICKNAME = 23,
    DETAIL_INFO_WITHOUT_STREET = 24,
    FORMAT_ADDRESS = 25,
    PASSPORT_NUMBER = 26,
    VALIDITY = 27,
    ISSUE_AT = 28,
    ORGANIZATION = 29,
    TAX_ID = 30,
    ADDRESS_CITY_AND_STATE = 31,
    FLIGHT_NUMBER = 32,
    LICENSE_NUMBER = 33,
    LICENSE_FILE_NUMBER = 34,
    LICENSE_PLATE = 35,
    ENGINE_NUMBER = 36,
    LICENSE_CHASSIS_NUMBER = 37
}
export enum EnterKeyType {
    GO = 2,
    Go = 2,
    SEARCH = 3,
    Search = 3,
    SEND = 4,
    Send = 4,
    NEXT = 5,
    Next = 5,
    DONE = 6,
    Done = 6,
    PREVIOUS = 7,
    NEW_LINE = 8
}
export declare interface UnderlineColor {
    typing?: ResourceColor | undefined;
    normal?: ResourceColor | undefined;
    error?: ResourceColor | undefined;
    disable?: ResourceColor | undefined;
}
export declare interface SubmitEvent {
    text: string;
    keepEditableState(): void
}
export declare class TextInputController extends TextContentControllerBase {
    constructor()
    caretPosition(value: number): void
    setTextSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void
    stopEditing(): void
}
export declare interface TextInputOptions {
    placeholder?: ResourceStr;
    text?: ResourceStr | Bindable<ResourceStr> | Bindable<Resource> | Bindable<string>;
    controller?: TextInputController;
}
export enum TextInputStyle {
    DEFAULT = 0,
    Default = 0,
    INLINE = 1,
    Inline = 1
}
export declare interface PasswordIcon {
    onIconSrc?: string | Resource;
    offIconSrc?: string | Resource;
}
export type OnSubmitCallback = (enterKey: EnterKeyType, event: SubmitEvent) => void;
export type OnTextSelectionChangeCallback = (selectionStart: number, selectionEnd: number) => void;
export type OnContentScrollCallback = (totalOffsetX: number, totalOffsetY: number) => void;
export type OnPasteCallback = (content: string, event: PasteEvent) => void;
export interface TextInputAttribute extends CommonMethod {
    type(value: InputType | undefined): this {
        throw new Error("Unimplemented method type")
    }
    contentType(value: ContentType | undefined): this {
        throw new Error("Unimplemented method contentType")
    }
    placeholderColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method placeholderColor")
    }
    textOverflow(value: TextOverflow | undefined): this {
        throw new Error("Unimplemented method textOverflow")
    }
    textIndent(value: Dimension | undefined): this {
        throw new Error("Unimplemented method textIndent")
    }
    placeholderFont(value: Font | undefined): this {
        throw new Error("Unimplemented method placeholderFont")
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        throw new Error("Unimplemented method enterKeyType")
    }
    caretColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method caretColor")
    }
    onEditChange(value: ((value0: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onEditChange")
    }
    onSubmit(value: OnSubmitCallback | undefined): this {
        throw new Error("Unimplemented method onSubmit")
    }
    onChange(value: EditableTextOnChangeCallback | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    onTextSelectionChange(value: OnTextSelectionChangeCallback | undefined): this {
        throw new Error("Unimplemented method onTextSelectionChange")
    }
    onContentScroll(value: OnContentScrollCallback | undefined): this {
        throw new Error("Unimplemented method onContentScroll")
    }
    maxLength(value: number | undefined): this {
        throw new Error("Unimplemented method maxLength")
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
    onCopy(value: ((value0: string) => void) | undefined): this {
        throw new Error("Unimplemented method onCopy")
    }
    onCut(value: ((value0: string) => void) | undefined): this {
        throw new Error("Unimplemented method onCut")
    }
    onPaste(value: OnPasteCallback | undefined): this {
        throw new Error("Unimplemented method onPaste")
    }
    copyOption(value: CopyOptions | undefined): this {
        throw new Error("Unimplemented method copyOption")
    }
    showPasswordIcon(value: boolean | undefined): this {
        throw new Error("Unimplemented method showPasswordIcon")
    }
    textAlign(value: TextAlign | undefined): this {
        throw new Error("Unimplemented method textAlign")
    }
    style(value: TextInputStyle | TextContentStyle | undefined): this {
        throw new Error("Unimplemented method style")
    }
    caretStyle(value: CaretStyle | undefined): this {
        throw new Error("Unimplemented method caretStyle")
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedBackgroundColor")
    }
    caretPosition(value: number | undefined): this {
        throw new Error("Unimplemented method caretPosition")
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableKeyboardOnFocus")
    }
    passwordIcon(value: PasswordIcon | undefined): this {
        throw new Error("Unimplemented method passwordIcon")
    }
    showError(value: ResourceStr | undefined): this {
        throw new Error("Unimplemented method showError")
    }
    showUnit(value: CustomBuilder | undefined): this {
        throw new Error("Unimplemented method showUnit")
    }
    showUnderline(value: boolean | undefined): this {
        throw new Error("Unimplemented method showUnderline")
    }
    underlineColor(value: ResourceColor | UnderlineColor | undefined): this {
        throw new Error("Unimplemented method underlineColor")
    }
    selectionMenuHidden(value: boolean | undefined): this {
        throw new Error("Unimplemented method selectionMenuHidden")
    }
    barState(value: BarState | undefined): this {
        throw new Error("Unimplemented method barState")
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
    cancelButton(value: CancelButtonOptions | CancelButtonSymbolOptions | undefined): this {
        throw new Error("Unimplemented method cancelButton")
    }
    selectAll(value: boolean | undefined): this {
        throw new Error("Unimplemented method selectAll")
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
    enableAutoFill(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableAutoFill")
    }
    decoration(value: TextDecorationOptions | undefined): this {
        throw new Error("Unimplemented method decoration")
    }
    letterSpacing(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method letterSpacing")
    }
    lineHeight(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method lineHeight")
    }
    passwordRules(value: string | undefined): this {
        throw new Error("Unimplemented method passwordRules")
    }
    fontFeature(value: string | undefined): this {
        throw new Error("Unimplemented method fontFeature")
    }
    showPassword(value: boolean | undefined): this {
        throw new Error("Unimplemented method showPassword")
    }
    onSecurityStateChange(value: ((value0: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onSecurityStateChange")
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
    inputFilter(value: ResourceStr | undefined, error?: ((value0: string) => void)): this {
        throw new Error("Unimplemented method inputFilter")
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        throw new Error("Unimplemented method customKeyboard")
    }
    showCounter(value: boolean | undefined, options?: InputCounterOptions): this {
        throw new Error("Unimplemented method showCounter")
    }
    attributeModifier(value: AttributeModifier<TextInputAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTextInputStyle extends ArkCommonMethodStyle implements TextInputAttribute {
    type_value?: InputType | undefined
    contentType_value?: ContentType | undefined
    placeholderColor_value?: ResourceColor | undefined
    textOverflow_value?: TextOverflow | undefined
    textIndent_value?: Dimension | undefined
    placeholderFont_value?: Font | undefined
    enterKeyType_value?: EnterKeyType | undefined
    caretColor_value?: ResourceColor | undefined
    onEditChange_value?: ((value0: boolean) => void) | undefined
    onSubmit_value?: OnSubmitCallback | undefined
    onChange_value?: EditableTextOnChangeCallback | undefined
    onTextSelectionChange_value?: OnTextSelectionChangeCallback | undefined
    onContentScroll_value?: OnContentScrollCallback | undefined
    maxLength_value?: number | undefined
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: Length | undefined
    fontStyle_value?: FontStyle | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    fontFamily_value?: ResourceStr | undefined
    onCopy_value?: ((value0: string) => void) | undefined
    onCut_value?: ((value0: string) => void) | undefined
    onPaste_value?: OnPasteCallback | undefined
    copyOption_value?: CopyOptions | undefined
    showPasswordIcon_value?: boolean | undefined
    textAlign_value?: TextAlign | undefined
    style_value?: TextInputStyle | TextContentStyle | undefined
    caretStyle_value?: CaretStyle | undefined
    selectedBackgroundColor_value?: ResourceColor | undefined
    caretPosition_value?: number | undefined
    enableKeyboardOnFocus_value?: boolean | undefined
    passwordIcon_value?: PasswordIcon | undefined
    showError_value?: ResourceStr | undefined
    showUnit_value?: CustomBuilder | undefined
    showUnderline_value?: boolean | undefined
    underlineColor_value?: ResourceColor | UnderlineColor | undefined
    selectionMenuHidden_value?: boolean | undefined
    barState_value?: BarState | undefined
    maxLines_value?: number | undefined
    wordBreak_value?: WordBreak | undefined
    lineBreakStrategy_value?: LineBreakStrategy | undefined
    cancelButton_value?: CancelButtonOptions | CancelButtonSymbolOptions | undefined
    selectAll_value?: boolean | undefined
    minFontSize_value?: number | string | Resource | undefined
    maxFontSize_value?: number | string | Resource | undefined
    minFontScale_value?: number | Resource | undefined
    maxFontScale_value?: number | Resource | undefined
    heightAdaptivePolicy_value?: TextHeightAdaptivePolicy | undefined
    enableAutoFill_value?: boolean | undefined
    decoration_value?: TextDecorationOptions | undefined
    letterSpacing_value?: number | string | Resource | undefined
    lineHeight_value?: number | string | Resource | undefined
    passwordRules_value?: string | undefined
    fontFeature_value?: string | undefined
    showPassword_value?: boolean | undefined
    onSecurityStateChange_value?: ((value0: boolean) => void) | undefined
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
    attributeModifier_value?: AttributeModifier<TextInputAttribute> | AttributeModifier<CommonMethod> | undefined
    type(value: InputType | undefined): this {
        return this
    }
    contentType(value: ContentType | undefined): this {
        return this
    }
    placeholderColor(value: ResourceColor | undefined): this {
        return this
    }
    textOverflow(value: TextOverflow | undefined): this {
        return this
    }
    textIndent(value: Dimension | undefined): this {
        return this
    }
    placeholderFont(value: Font | undefined): this {
        return this
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        return this
    }
    caretColor(value: ResourceColor | undefined): this {
        return this
    }
    onEditChange(value: ((value0: boolean) => void) | undefined): this {
        return this
    }
    onSubmit(value: OnSubmitCallback | undefined): this {
        return this
    }
    onChange(value: EditableTextOnChangeCallback | undefined): this {
        return this
    }
    onTextSelectionChange(value: OnTextSelectionChangeCallback | undefined): this {
        return this
    }
    onContentScroll(value: OnContentScrollCallback | undefined): this {
        return this
    }
    maxLength(value: number | undefined): this {
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
    onCopy(value: ((value0: string) => void) | undefined): this {
        return this
    }
    onCut(value: ((value0: string) => void) | undefined): this {
        return this
    }
    onPaste(value: OnPasteCallback | undefined): this {
        return this
    }
    copyOption(value: CopyOptions | undefined): this {
        return this
    }
    showPasswordIcon(value: boolean | undefined): this {
        return this
    }
    textAlign(value: TextAlign | undefined): this {
        return this
    }
    style(value: TextInputStyle | TextContentStyle | undefined): this {
        return this
    }
    caretStyle(value: CaretStyle | undefined): this {
        return this
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    caretPosition(value: number | undefined): this {
        return this
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
        return this
    }
    passwordIcon(value: PasswordIcon | undefined): this {
        return this
    }
    showError(value: ResourceStr | undefined): this {
        return this
    }
    showUnit(value: CustomBuilder | undefined): this {
        return this
    }
    showUnderline(value: boolean | undefined): this {
        return this
    }
    underlineColor(value: ResourceColor | UnderlineColor | undefined): this {
        return this
    }
    selectionMenuHidden(value: boolean | undefined): this {
        return this
    }
    barState(value: BarState | undefined): this {
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
    cancelButton(value: CancelButtonOptions | CancelButtonSymbolOptions | undefined): this {
        return this
    }
    selectAll(value: boolean | undefined): this {
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
    enableAutoFill(value: boolean | undefined): this {
        return this
    }
    decoration(value: TextDecorationOptions | undefined): this {
        return this
    }
    letterSpacing(value: number | string | Resource | undefined): this {
        return this
    }
    lineHeight(value: number | string | Resource | undefined): this {
        return this
    }
    passwordRules(value: string | undefined): this {
        return this
    }
    fontFeature(value: string | undefined): this {
        return this
    }
    showPassword(value: boolean | undefined): this {
        return this
    }
    onSecurityStateChange(value: ((value0: boolean) => void) | undefined): this {
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
    inputFilter(value: ResourceStr | undefined, error?: ((value0: string) => void)): this {
        return this
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        return this
    }
    showCounter(value: boolean | undefined, options?: InputCounterOptions): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TextInputAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function TextInput(
    value?: TextInputOptions,
    @memo
    content_?: () => void,
): TextInputAttribute { throw new Error("")}
