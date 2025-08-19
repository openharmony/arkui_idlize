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
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { ResourceColor, Length, ResourceStr } from "./units"
import { Color, TextDecorationType, TextDecorationStyle } from "./enums"
import { Resource } from "@global.resource"
import { DecorationStyleInterface, StyledString, MutableStyledString } from "./styledString"
import { SelectionOptions } from "./common"
export enum TextDataDetectorType {
    PHONE_NUMBER = 0,
    URL = 1,
    EMAIL = 2,
    ADDRESS = 3,
    DATE_TIME = 4
}
export declare interface TextDataDetectorConfig {
    types: Array<TextDataDetectorType>;
    onDetectResultUpdate?: ((value0: string) => void);
    color?: ResourceColor;
    decoration?: DecorationStyleInterface;
}
export declare interface TextRange {
    start?: number;
    end?: number;
}
export declare interface InsertValue {
    insertOffset: number;
    insertValue: string;
}
export enum TextDeleteDirection {
    BACKWARD = 0,
    FORWARD = 1
}
export enum MenuType {
    SELECTION_MENU = 0,
    PREVIEW_MENU = 1
}
export enum AutoCapitalizationMode {
    NONE = 0,
    WORDS = 1,
    SENTENCES = 2,
    ALL_CHARACTERS = 3
}
export declare interface DeleteValue {
    deleteOffset: number;
    direction: TextDeleteDirection;
    deleteValue: string;
}
export type OnDidChangeCallback = (rangeBefore: TextRange, rangeAfter: TextRange) => void;
export type EditableTextOnChangeCallback = (value: string, previewText?: PreviewText, options?: TextChangeOptions) => void;
export declare interface TextBaseController {
    setSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void
    closeSelectionMenu(): void
    getLayoutManager(): LayoutManager
}
export declare interface TextEditControllerEx extends TextBaseController {
    isEditing(): boolean
    stopEditing(): void
    setCaretOffset(offset: number): boolean
    getCaretOffset(): number
    getPreviewText(): PreviewText
}
export declare interface PreviewText {
    offset: number;
    value: string;
}
export declare interface StyledStringController {
    setStyledString(styledString: StyledString): void
    getStyledString(): MutableStyledString
}
export declare interface StyledStringChangedListener {
    onWillChange?: ((value0: StyledStringChangeValue) => boolean);
    onDidChange?: OnDidChangeCallback;
}
export declare interface StyledStringChangeValue {
    range: TextRange;
    replacementString: StyledString;
    previewText?: StyledString;
}
export declare interface LayoutManager {
    getLineCount(): number
    getGlyphPositionAtCoordinate(x: number, y: number): PositionWithAffinity
}
export declare interface PositionWithAffinity {
    position: number;
}
export declare interface CaretStyle {
    width?: Length;
    color?: ResourceColor;
}
export declare class TextMenuItemId {
    constructor()
    static readonly CUT: TextMenuItemId;
    static readonly COPY: TextMenuItemId;
    static readonly PASTE: TextMenuItemId;
    static readonly SELECT_ALL: TextMenuItemId;
    static readonly COLLABORATION_SERVICE: TextMenuItemId;
    static readonly CAMERA_INPUT: TextMenuItemId;
    static readonly AI_WRITER: TextMenuItemId;
    static readonly TRANSLATE: TextMenuItemId;
    static readonly SEARCH: TextMenuItemId;
    static readonly SHARE: TextMenuItemId;
    static of(id: ResourceStr): TextMenuItemId
    equals(id: TextMenuItemId): boolean
}
export declare interface TextMenuItem {
    content: ResourceStr;
    icon?: ResourceStr;
    id: TextMenuItemId;
    labelInfo?: ResourceStr;
}
export type OnCreateMenuCallback = (menuItems: Array<TextMenuItem>) => Array<TextMenuItem>;
export type OnMenuItemClickCallback = (menuItem: TextMenuItem, range: TextRange) => boolean;
export declare interface EditMenuOptions {
    onCreateMenu: OnCreateMenuCallback;
    onMenuItemClick: OnMenuItemClickCallback;
}
export declare interface DecorationStyleResult {
    type: TextDecorationType;
    color: ResourceColor;
    style?: TextDecorationStyle;
}
export declare interface FontSettingOptions {
    enableVariableFontWeight?: boolean;
}
export declare interface TextChangeOptions {
    rangeBefore: TextRange;
    rangeAfter: TextRange;
    oldContent: string;
    oldPreviewText: PreviewText;
}
export declare interface EditableTextChangeValue {
    content: string;
    previewText?: PreviewText;
    options?: TextChangeOptions;
}
export enum TextMenuShowMode {
    DEFAULT = 0,
    PREFER_WINDOW = 1
}
export declare interface TextMenuOptions {
    showMode?: TextMenuShowMode;
}
export enum KeyboardAppearance {
    NONE_IMMERSIVE = 0,
    IMMERSIVE = 1,
    LIGHT_IMMERSIVE = 2,
    DARK_IMMERSIVE = 3
}
