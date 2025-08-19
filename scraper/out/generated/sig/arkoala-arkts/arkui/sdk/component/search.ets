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
import { TextContentControllerBase, SelectionOptions, Bindable, CommonMethod, TextDecorationOptions, ArkCommonMethodStyle } from "./common"
import { ResourceStr, Length, ResourceColor, Dimension, Font } from "./units"
import { Resource } from "@global.resource"
import { Color, CopyOptions, TextAlign } from "./enums"
import { SymbolGlyphModifier } from "./../SymbolGlyphModifier"
import { SubmitEvent, EnterKeyType, OnTextSelectionChangeCallback, OnContentScrollCallback, OnPasteCallback } from "./textInput"
import { InsertValue, DeleteValue, EditableTextChangeValue, CaretStyle, EditableTextOnChangeCallback, PreviewText, TextChangeOptions, EditMenuOptions, AutoCapitalizationMode, KeyboardAppearance } from "./textCommon"
import { PasteEvent, KeyboardOptions } from "./richEditor"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
import { CustomBuilder } from "./builder"
export declare class SearchController extends TextContentControllerBase {
    constructor()
    caretPosition(value: number): void
    stopEditing(): void
    setTextSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void
}
export enum CancelButtonStyle {
    CONSTANT = 0,
    INVISIBLE = 1,
    INPUT = 2
}
export enum SearchType {
    NORMAL = 0,
    NUMBER = 2,
    PHONE_NUMBER = 3,
    EMAIL = 5,
    NUMBER_DECIMAL = 12,
    URL = 13
}
export declare interface SearchOptions {
    value?: string | Bindable<string>;
    placeholder?: ResourceStr;
    icon?: string;
    controller?: SearchController;
}
export declare interface IconOptions {
    size?: Length;
    color?: ResourceColor;
    src?: ResourceStr;
}
export declare interface SearchButtonOptions {
    fontSize?: Length;
    fontColor?: ResourceColor;
    autoDisable?: boolean;
}
export declare interface CancelButtonOptions {
    style?: CancelButtonStyle;
    icon?: IconOptions;
}
export declare interface CancelButtonSymbolOptions {
    style?: CancelButtonStyle;
    icon?: SymbolGlyphModifier;
}
export type SearchSubmitCallback = (searchContent: string, event?: SubmitEvent) => void;
export interface SearchAttribute extends CommonMethod {
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    searchIcon(value: IconOptions | SymbolGlyphModifier | undefined): this {
        throw new Error("Unimplemented method searchIcon")
    }
    cancelButton(value: CancelButtonOptions | CancelButtonSymbolOptions | undefined): this {
        throw new Error("Unimplemented method cancelButton")
    }
    textIndent(value: Dimension | undefined): this {
        throw new Error("Unimplemented method textIndent")
    }
    onEditChange(value: ((value0: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onEditChange")
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedBackgroundColor")
    }
    caretStyle(value: CaretStyle | undefined): this {
        throw new Error("Unimplemented method caretStyle")
    }
    placeholderColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method placeholderColor")
    }
    placeholderFont(value: Font | undefined): this {
        throw new Error("Unimplemented method placeholderFont")
    }
    textFont(value: Font | undefined): this {
        throw new Error("Unimplemented method textFont")
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        throw new Error("Unimplemented method enterKeyType")
    }
    onSubmit(value: ((value0: string) => void) | SearchSubmitCallback | undefined): this {
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
    maxLength(value: number | undefined): this {
        throw new Error("Unimplemented method maxLength")
    }
    textAlign(value: TextAlign | undefined): this {
        throw new Error("Unimplemented method textAlign")
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableKeyboardOnFocus")
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
    decoration(value: TextDecorationOptions | undefined): this {
        throw new Error("Unimplemented method decoration")
    }
    letterSpacing(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method letterSpacing")
    }
    lineHeight(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method lineHeight")
    }
    type(value: SearchType | undefined): this {
        throw new Error("Unimplemented method type")
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
    stopBackPress(value: boolean | undefined): this {
        throw new Error("Unimplemented method stopBackPress")
    }
    onWillChange(value: ((value0: EditableTextChangeValue) => boolean) | undefined): this {
        throw new Error("Unimplemented method onWillChange")
    }
    keyboardAppearance(value: KeyboardAppearance | undefined): this {
        throw new Error("Unimplemented method keyboardAppearance")
    }
    searchButton(value: string | undefined, option?: SearchButtonOptions): this {
        throw new Error("Unimplemented method searchButton")
    }
    inputFilter(value: ResourceStr | undefined, error?: ((value0: string) => void)): this {
        throw new Error("Unimplemented method inputFilter")
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        throw new Error("Unimplemented method customKeyboard")
    }
    attributeModifier(value: AttributeModifier<SearchAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSearchStyle extends ArkCommonMethodStyle implements SearchAttribute {
    fontColor_value?: ResourceColor | undefined
    searchIcon_value?: IconOptions | SymbolGlyphModifier | undefined
    cancelButton_value?: CancelButtonOptions | CancelButtonSymbolOptions | undefined
    textIndent_value?: Dimension | undefined
    onEditChange_value?: ((value0: boolean) => void) | undefined
    selectedBackgroundColor_value?: ResourceColor | undefined
    caretStyle_value?: CaretStyle | undefined
    placeholderColor_value?: ResourceColor | undefined
    placeholderFont_value?: Font | undefined
    textFont_value?: Font | undefined
    enterKeyType_value?: EnterKeyType | undefined
    onSubmit_value?: ((value0: string) => void) | SearchSubmitCallback | undefined
    onChange_value?: EditableTextOnChangeCallback | undefined
    onTextSelectionChange_value?: OnTextSelectionChangeCallback | undefined
    onContentScroll_value?: OnContentScrollCallback | undefined
    onCopy_value?: ((value0: string) => void) | undefined
    onCut_value?: ((value0: string) => void) | undefined
    onPaste_value?: OnPasteCallback | undefined
    copyOption_value?: CopyOptions | undefined
    maxLength_value?: number | undefined
    textAlign_value?: TextAlign | undefined
    enableKeyboardOnFocus_value?: boolean | undefined
    selectionMenuHidden_value?: boolean | undefined
    minFontSize_value?: number | string | Resource | undefined
    maxFontSize_value?: number | string | Resource | undefined
    minFontScale_value?: number | Resource | undefined
    maxFontScale_value?: number | Resource | undefined
    decoration_value?: TextDecorationOptions | undefined
    letterSpacing_value?: number | string | Resource | undefined
    lineHeight_value?: number | string | Resource | undefined
    type_value?: SearchType | undefined
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
    stopBackPress_value?: boolean | undefined
    onWillChange_value?: ((value0: EditableTextChangeValue) => boolean) | undefined
    keyboardAppearance_value?: KeyboardAppearance | undefined
    attributeModifier_value?: AttributeModifier<SearchAttribute> | AttributeModifier<CommonMethod> | undefined
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    searchIcon(value: IconOptions | SymbolGlyphModifier | undefined): this {
        return this
    }
    cancelButton(value: CancelButtonOptions | CancelButtonSymbolOptions | undefined): this {
        return this
    }
    textIndent(value: Dimension | undefined): this {
        return this
    }
    onEditChange(value: ((value0: boolean) => void) | undefined): this {
        return this
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    caretStyle(value: CaretStyle | undefined): this {
        return this
    }
    placeholderColor(value: ResourceColor | undefined): this {
        return this
    }
    placeholderFont(value: Font | undefined): this {
        return this
    }
    textFont(value: Font | undefined): this {
        return this
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        return this
    }
    onSubmit(value: ((value0: string) => void) | SearchSubmitCallback | undefined): this {
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
    maxLength(value: number | undefined): this {
        return this
    }
    textAlign(value: TextAlign | undefined): this {
        return this
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
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
    decoration(value: TextDecorationOptions | undefined): this {
        return this
    }
    letterSpacing(value: number | string | Resource | undefined): this {
        return this
    }
    lineHeight(value: number | string | Resource | undefined): this {
        return this
    }
    type(value: SearchType | undefined): this {
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
    stopBackPress(value: boolean | undefined): this {
        return this
    }
    onWillChange(value: ((value0: EditableTextChangeValue) => boolean) | undefined): this {
        return this
    }
    keyboardAppearance(value: KeyboardAppearance | undefined): this {
        return this
    }
    searchButton(value: string | undefined, option?: SearchButtonOptions): this {
        return this
    }
    inputFilter(value: ResourceStr | undefined, error?: ((value0: string) => void)): this {
        return this
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SearchAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Search(
    options?: SearchOptions,
    @memo
    content_?: () => void,
): SearchAttribute { throw new Error("")}
