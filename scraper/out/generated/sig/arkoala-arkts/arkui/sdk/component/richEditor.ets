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
import { ResourceColor, Length, ResourceStr, Dimension, VoidCallback, Padding, BorderRadiuses, Font } from "./units"
import { Color, FontStyle, FontWeight, TextAlign, WordBreak, LineBreakStrategy, ImageSpanAlignment, ImageFit, CopyOptions, BarState, ResponseType } from "./enums"
import { Resource } from "@global.resource"
import { DecorationStyleInterface, StyledString, MutableStyledString } from "./styledString"
import { ShadowOptions, ClickEvent, HoverEvent, HapticFeedbackMode, SelectionOptions, RectResult, CommonMethod, ArkCommonMethodStyle } from "./common"
import { TextBackgroundStyle } from "./span"
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
import { SymbolEffectStrategy, SymbolRenderingStrategy } from "./symbolglyph"
import { DecorationStyleResult, TextRange, MenuType, TextEditControllerEx, LayoutManager, PreviewText, StyledStringController, StyledStringChangedListener, TextDataDetectorConfig, OnDidChangeCallback, EditMenuOptions, KeyboardAppearance } from "./textCommon"
import { GestureEvent } from "./gesture"
import { ColorMetrics } from "./../Graphics"
import { CustomBuilder } from "./builder"
import { EnterKeyType, SubmitEvent } from "./textInput"
export enum RichEditorDeleteDirection {
    BACKWARD = 0,
    FORWARD = 1
}
export enum RichEditorSpanType {
    TEXT = 0,
    IMAGE = 1,
    MIXED = 2,
    BUILDER = 3,
    DEFAULT = 4
}
export enum RichEditorResponseType {
    RIGHT_CLICK = 0,
    LONG_PRESS = 1,
    SELECT = 2,
    DEFAULT = 3
}
export declare interface RichEditorSpanPosition {
    spanIndex: number;
    spanRange: [ number, number ];
}
export declare interface RichEditorTextStyle {
    fontColor?: ResourceColor;
    fontSize?: Length | number;
    fontStyle?: FontStyle;
    fontWeight?: number | FontWeight | string;
    fontFamily?: ResourceStr;
    decoration?: DecorationStyleInterface;
    textShadow?: ShadowOptions | Array<ShadowOptions>;
    letterSpacing?: number | string;
    lineHeight?: number | string | Resource;
    halfLeading?: boolean;
    fontFeature?: string;
    textBackgroundStyle?: TextBackgroundStyle;
}
export declare interface LeadingMarginPlaceholder {
    pixelMap: image.PixelMap;
    size: [ Dimension, Dimension ];
}
export declare interface RichEditorParagraphStyle {
    textAlign?: TextAlign;
    leadingMargin?: Dimension | LeadingMarginPlaceholder;
    wordBreak?: WordBreak;
    lineBreakStrategy?: LineBreakStrategy;
    paragraphSpacing?: number;
}
export declare interface PasteEvent {
    preventDefault?: VoidCallback;
}
export declare interface RichEditorTextSpan {
    spanPosition: RichEditorSpanPosition;
    value: string;
    textStyle?: RichEditorTextStyle;
}
export declare interface RichEditorLayoutStyle {
    margin?: Dimension | Padding;
    borderRadius?: Dimension | BorderRadiuses;
}
export declare interface RichEditorImageSpanStyle {
    size?: [ Dimension, Dimension ];
    verticalAlign?: ImageSpanAlignment;
    objectFit?: ImageFit;
    layoutStyle?: RichEditorLayoutStyle;
}
export declare interface RichEditorSymbolSpanStyle {
    fontSize?: number | string | Resource;
    fontColor?: Array<ResourceColor>;
    fontWeight?: number | FontWeight | string;
    effectStrategy?: SymbolEffectStrategy;
    renderingStrategy?: SymbolRenderingStrategy;
}
export declare interface RichEditorTextStyleResult {
    fontColor: ResourceColor;
    fontSize: number;
    fontStyle: FontStyle;
    fontWeight: number;
    fontFamily: string;
    decoration: DecorationStyleResult;
    textShadow?: Array<ShadowOptions>;
    letterSpacing?: number;
    lineHeight?: number;
    halfLeading?: boolean;
    fontFeature?: string;
    textBackgroundStyle?: TextBackgroundStyle;
}
export declare interface RichEditorParagraphResult {
    style: RichEditorParagraphStyle;
    range: [ number, number ];
}
export declare interface RichEditorSymbolSpanStyleResult {
    fontSize: number | string | Resource;
    fontColor: Array<ResourceColor>;
    fontWeight: number | FontWeight | string;
    effectStrategy: SymbolEffectStrategy;
    renderingStrategy: SymbolRenderingStrategy;
}
export declare interface RichEditorTextSpanResult {
    spanPosition: RichEditorSpanPosition;
    value: string;
    textStyle: RichEditorTextStyleResult;
    offsetInSpan: [ number, number ];
    symbolSpanStyle?: RichEditorSymbolSpanStyle;
    valueResource?: Resource;
    paragraphStyle?: RichEditorParagraphStyle;
    previewText?: string;
    urlStyle?: RichEditorUrlStyle;
}
export declare interface RichEditorImageSpanStyleResult {
    size: [ number, number ];
    verticalAlign: ImageSpanAlignment;
    objectFit: ImageFit;
    layoutStyle?: RichEditorLayoutStyle;
}
export declare interface RichEditorImageSpanResult {
    spanPosition: RichEditorSpanPosition;
    valuePixelMap?: image.PixelMap;
    valueResourceStr?: ResourceStr;
    imageStyle: RichEditorImageSpanStyleResult;
    offsetInSpan: [ number, number ];
}
export declare interface RichEditorImageSpan {
    spanPosition: RichEditorSpanPosition;
    value: image.PixelMap | ResourceStr;
    imageStyle?: RichEditorImageSpanStyle;
}
export declare interface RichEditorRange {
    start?: number;
    end?: number;
}
export declare interface RichEditorGesture {
    onClick?: ((value0: ClickEvent) => void);
    onLongPress?: ((value0: GestureEvent) => void);
    onDoubleClick?: ((value0: GestureEvent) => void);
}
export declare interface RichEditorTextSpanOptions {
    offset?: number;
    style?: RichEditorTextStyle;
    paragraphStyle?: RichEditorParagraphStyle;
    gesture?: RichEditorGesture;
    urlStyle?: RichEditorUrlStyle;
}
export declare interface KeyboardOptions {
    supportAvoidance?: boolean;
}
export declare interface RichEditorImageSpanOptions {
    offset?: number;
    imageStyle?: RichEditorImageSpanStyle;
    gesture?: RichEditorGesture;
    onHover?: OnHoverCallback;
}
export declare interface RichEditorBuilderSpanOptions {
    offset?: number;
    dragBackgroundColor?: ColorMetrics;
    isDragShadowNeeded?: boolean;
}
export declare interface PlaceholderStyle {
    font?: Font;
    fontColor?: ResourceColor;
}
export declare interface RichEditorSpanStyleOptions extends RichEditorRange {
}
export declare interface RichEditorParagraphStyleOptions extends RichEditorRange {
    style: RichEditorParagraphStyle;
}
export declare interface RichEditorUpdateTextSpanStyleOptions extends RichEditorSpanStyleOptions {
    textStyle: RichEditorTextStyle;
    urlStyle?: RichEditorUrlStyle;
}
export declare interface RichEditorUpdateImageSpanStyleOptions extends RichEditorSpanStyleOptions {
    imageStyle: RichEditorImageSpanStyle;
}
export declare interface RichEditorUpdateSymbolSpanStyleOptions extends RichEditorSpanStyleOptions {
    symbolStyle: RichEditorSymbolSpanStyle;
}
export declare interface RichEditorSymbolSpanOptions {
    offset?: number;
    style?: RichEditorSymbolSpanStyle;
}
export declare interface RichEditorSelection {
    selection: [ number, number ];
    spans: Array<RichEditorTextSpanResult | RichEditorImageSpanResult>;
}
export declare interface RichEditorInsertValue {
    insertOffset: number;
    insertValue: string;
    previewText?: string;
}
export declare interface RichEditorDeleteValue {
    offset: number;
    direction: RichEditorDeleteDirection;
    length: number;
    richEditorDeleteSpans: Array<RichEditorTextSpanResult | RichEditorImageSpanResult>;
}
export declare interface RichEditorChangeValue {
    rangeBefore: TextRange;
    replacedSpans: Array<RichEditorTextSpanResult>;
    replacedImageSpans: Array<RichEditorImageSpanResult>;
    replacedSymbolSpans: Array<RichEditorTextSpanResult>;
}
export declare interface RichEditorOptions {
    controller: RichEditorController;
}
export declare interface RichEditorStyledStringOptions {
    controller: RichEditorStyledStringController;
}
export declare interface SelectionMenuOptions {
    onAppear?: MenuOnAppearCallback;
    onDisappear?: VoidCallback;
    menuType?: MenuType;
    onMenuShow?: MenuCallback;
    onMenuHide?: MenuCallback;
    previewMenuOptions?: PreviewMenuOptions;
}
export declare interface PreviewMenuOptions {
    hapticFeedbackMode?: HapticFeedbackMode;
}
export declare class RichEditorBaseController implements TextEditControllerEx {
    constructor()
    getCaretOffset(): number
    setCaretOffset(offset: number): boolean
    closeSelectionMenu(): void
    getTypingStyle(): RichEditorTextStyle
    setTypingStyle(value: RichEditorTextStyle): void
    setSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void
    isEditing(): boolean
    stopEditing(): void
    getLayoutManager(): LayoutManager
    getPreviewText(): PreviewText
    getCaretRect(): RectResult | undefined
}
export declare class RichEditorController extends RichEditorBaseController {
    constructor()
    addTextSpan(content: ResourceStr, options?: RichEditorTextSpanOptions): number
    addImageSpan(value: image.PixelMap | ResourceStr, options?: RichEditorImageSpanOptions): number
    addBuilderSpan(value: CustomBuilder, options?: RichEditorBuilderSpanOptions): number
    addSymbolSpan(value: Resource, options?: RichEditorSymbolSpanOptions): number
    updateSpanStyle(value: RichEditorUpdateTextSpanStyleOptions | RichEditorUpdateImageSpanStyleOptions | RichEditorUpdateSymbolSpanStyleOptions): void
    updateParagraphStyle(value: RichEditorParagraphStyleOptions): void
    deleteSpans(value?: RichEditorRange): void
    getSpans(value?: RichEditorRange): Array<RichEditorImageSpanResult | RichEditorTextSpanResult>
    getParagraphs(value?: RichEditorRange): Array<RichEditorParagraphResult>
    getSelection(): RichEditorSelection
    fromStyledString(value: StyledString): Array<RichEditorSpan>
    toStyledString(value: RichEditorRange): StyledString
}
export type RichEditorSpan = RichEditorImageSpanResult | RichEditorTextSpanResult;
export declare class RichEditorStyledStringController extends RichEditorBaseController implements StyledStringController {
    constructor()
    setStyledString(styledString: StyledString): void
    getStyledString(): MutableStyledString
    getSelection(): RichEditorRange
    onContentChanged(listener: StyledStringChangedListener): void
}
export interface RichEditorAttribute extends CommonMethod {
    onReady(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onReady")
    }
    onSelect(value: ((value0: RichEditorSelection) => void) | undefined): this {
        throw new Error("Unimplemented method onSelect")
    }
    onSelectionChange(value: ((value0: RichEditorRange) => void) | undefined): this {
        throw new Error("Unimplemented method onSelectionChange")
    }
    aboutToIMEInput(value: ((value0: RichEditorInsertValue) => boolean) | undefined): this {
        throw new Error("Unimplemented method aboutToIMEInput")
    }
    onIMEInputComplete(value: ((value0: RichEditorTextSpanResult) => void) | undefined): this {
        throw new Error("Unimplemented method onIMEInputComplete")
    }
    onDidIMEInput(value: ((value0: TextRange) => void) | undefined): this {
        throw new Error("Unimplemented method onDidIMEInput")
    }
    aboutToDelete(value: ((value0: RichEditorDeleteValue) => boolean) | undefined): this {
        throw new Error("Unimplemented method aboutToDelete")
    }
    onDeleteComplete(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onDeleteComplete")
    }
    copyOptions(value: CopyOptions | undefined): this {
        throw new Error("Unimplemented method copyOptions")
    }
    onPaste(value: PasteEventCallback | undefined): this {
        throw new Error("Unimplemented method onPaste")
    }
    enableDataDetector(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableDataDetector")
    }
    enablePreviewText(value: boolean | undefined): this {
        throw new Error("Unimplemented method enablePreviewText")
    }
    dataDetectorConfig(value: TextDataDetectorConfig | undefined): this {
        throw new Error("Unimplemented method dataDetectorConfig")
    }
    caretColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method caretColor")
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedBackgroundColor")
    }
    onEditingChange(value: ((value0: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onEditingChange")
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        throw new Error("Unimplemented method enterKeyType")
    }
    onSubmit(value: SubmitCallback | undefined): this {
        throw new Error("Unimplemented method onSubmit")
    }
    onWillChange(value: ((value0: RichEditorChangeValue) => boolean) | undefined): this {
        throw new Error("Unimplemented method onWillChange")
    }
    onDidChange(value: OnDidChangeCallback | undefined): this {
        throw new Error("Unimplemented method onDidChange")
    }
    onCut(value: ((value0: CutEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onCut")
    }
    onCopy(value: ((value0: CopyEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onCopy")
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        throw new Error("Unimplemented method editMenuOptions")
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableKeyboardOnFocus")
    }
    enableHapticFeedback(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableHapticFeedback")
    }
    barState(value: BarState | undefined): this {
        throw new Error("Unimplemented method barState")
    }
    maxLength(value: number | undefined): this {
        throw new Error("Unimplemented method maxLength")
    }
    maxLines(value: number | undefined): this {
        throw new Error("Unimplemented method maxLines")
    }
    keyboardAppearance(value: KeyboardAppearance | undefined): this {
        throw new Error("Unimplemented method keyboardAppearance")
    }
    stopBackPress(value: boolean | undefined): this {
        throw new Error("Unimplemented method stopBackPress")
    }
    bindSelectionMenu(spanType: RichEditorSpanType | undefined, content: CustomBuilder | undefined, responseType: ResponseType | RichEditorResponseType | undefined, options?: SelectionMenuOptions): this {
        throw new Error("Unimplemented method bindSelectionMenu")
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        throw new Error("Unimplemented method customKeyboard")
    }
    placeholder(value: ResourceStr | undefined, style?: PlaceholderStyle): this {
        throw new Error("Unimplemented method placeholder")
    }
    attributeModifier(value: AttributeModifier<RichEditorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkRichEditorStyle extends ArkCommonMethodStyle implements RichEditorAttribute {
    onReady_value?: VoidCallback | undefined
    onSelect_value?: ((value0: RichEditorSelection) => void) | undefined
    onSelectionChange_value?: ((value0: RichEditorRange) => void) | undefined
    aboutToIMEInput_value?: ((value0: RichEditorInsertValue) => boolean) | undefined
    onIMEInputComplete_value?: ((value0: RichEditorTextSpanResult) => void) | undefined
    onDidIMEInput_value?: ((value0: TextRange) => void) | undefined
    aboutToDelete_value?: ((value0: RichEditorDeleteValue) => boolean) | undefined
    onDeleteComplete_value?: VoidCallback | undefined
    copyOptions_value?: CopyOptions | undefined
    onPaste_value?: PasteEventCallback | undefined
    enableDataDetector_value?: boolean | undefined
    enablePreviewText_value?: boolean | undefined
    dataDetectorConfig_value?: TextDataDetectorConfig | undefined
    caretColor_value?: ResourceColor | undefined
    selectedBackgroundColor_value?: ResourceColor | undefined
    onEditingChange_value?: ((value0: boolean) => void) | undefined
    enterKeyType_value?: EnterKeyType | undefined
    onSubmit_value?: SubmitCallback | undefined
    onWillChange_value?: ((value0: RichEditorChangeValue) => boolean) | undefined
    onDidChange_value?: OnDidChangeCallback | undefined
    onCut_value?: ((value0: CutEvent) => void) | undefined
    onCopy_value?: ((value0: CopyEvent) => void) | undefined
    editMenuOptions_value?: EditMenuOptions | undefined
    enableKeyboardOnFocus_value?: boolean | undefined
    enableHapticFeedback_value?: boolean | undefined
    barState_value?: BarState | undefined
    maxLength_value?: number | undefined
    maxLines_value?: number | undefined
    keyboardAppearance_value?: KeyboardAppearance | undefined
    stopBackPress_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<RichEditorAttribute> | AttributeModifier<CommonMethod> | undefined
    onReady(value: VoidCallback | undefined): this {
        return this
    }
    onSelect(value: ((value0: RichEditorSelection) => void) | undefined): this {
        return this
    }
    onSelectionChange(value: ((value0: RichEditorRange) => void) | undefined): this {
        return this
    }
    aboutToIMEInput(value: ((value0: RichEditorInsertValue) => boolean) | undefined): this {
        return this
    }
    onIMEInputComplete(value: ((value0: RichEditorTextSpanResult) => void) | undefined): this {
        return this
    }
    onDidIMEInput(value: ((value0: TextRange) => void) | undefined): this {
        return this
    }
    aboutToDelete(value: ((value0: RichEditorDeleteValue) => boolean) | undefined): this {
        return this
    }
    onDeleteComplete(value: VoidCallback | undefined): this {
        return this
    }
    copyOptions(value: CopyOptions | undefined): this {
        return this
    }
    onPaste(value: PasteEventCallback | undefined): this {
        return this
    }
    enableDataDetector(value: boolean | undefined): this {
        return this
    }
    enablePreviewText(value: boolean | undefined): this {
        return this
    }
    dataDetectorConfig(value: TextDataDetectorConfig | undefined): this {
        return this
    }
    caretColor(value: ResourceColor | undefined): this {
        return this
    }
    selectedBackgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    onEditingChange(value: ((value0: boolean) => void) | undefined): this {
        return this
    }
    enterKeyType(value: EnterKeyType | undefined): this {
        return this
    }
    onSubmit(value: SubmitCallback | undefined): this {
        return this
    }
    onWillChange(value: ((value0: RichEditorChangeValue) => boolean) | undefined): this {
        return this
    }
    onDidChange(value: OnDidChangeCallback | undefined): this {
        return this
    }
    onCut(value: ((value0: CutEvent) => void) | undefined): this {
        return this
    }
    onCopy(value: ((value0: CopyEvent) => void) | undefined): this {
        return this
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        return this
    }
    enableKeyboardOnFocus(value: boolean | undefined): this {
        return this
    }
    enableHapticFeedback(value: boolean | undefined): this {
        return this
    }
    barState(value: BarState | undefined): this {
        return this
    }
    maxLength(value: number | undefined): this {
        return this
    }
    maxLines(value: number | undefined): this {
        return this
    }
    keyboardAppearance(value: KeyboardAppearance | undefined): this {
        return this
    }
    stopBackPress(value: boolean | undefined): this {
        return this
    }
    bindSelectionMenu(spanType: RichEditorSpanType | undefined, content: CustomBuilder | undefined, responseType: ResponseType | RichEditorResponseType | undefined, options?: SelectionMenuOptions): this {
        return this
    }
    customKeyboard(value: CustomBuilder | undefined, options?: KeyboardOptions): this {
        return this
    }
    placeholder(value: ResourceStr | undefined, style?: PlaceholderStyle): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<RichEditorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface CutEvent {
    preventDefault?: VoidCallback;
}
export declare interface CopyEvent {
    preventDefault?: VoidCallback;
}
export declare interface RichEditorUrlStyle {
    url?: ResourceStr;
}
export type SubmitCallback = (enterKey: EnterKeyType, event: SubmitEvent) => void;
export type MenuOnAppearCallback = (start: number, end: number) => void;
export type MenuCallback = (start: number, end: number) => void;
export type PasteEventCallback = (event?: PasteEvent) => void;
export type OnHoverCallback = (status: boolean, event: HoverEvent) => void;

@memo
@ComponentBuilder
export function RichEditor(
    options: RichEditorOptions | RichEditorStyledStringOptions,
    @memo
    content_?: () => void,
): RichEditorAttribute { throw new Error("")}
