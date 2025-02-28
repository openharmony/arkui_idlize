/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare enum StyledStringKey {

    FONT = 0,
    DECORATION = 1,
    BASELINE_OFFSET = 2,
    LETTER_SPACING = 3,
    TEXT_SHADOW = 4,
    LINE_HEIGHT = 5,
    URL = 7,
    GESTURE = 100,
    PARAGRAPH_STYLE = 200,
    IMAGE = 300,
    CUSTOM_SPAN = 400,
    USER_DATA = 500,
}

declare class TextStyle {

    constructor(value?: TextStyleInterface);

    readonly fontColor?: ResourceColor;

    readonly fontFamily?: string;

    readonly fontSize?: number;

    readonly fontWeight?: number;

    readonly fontStyle?: FontStyle;
}

declare interface TextStyleInterface {

    fontColor?: ResourceColor;

    fontFamily?: ResourceStr;

    fontSize?: LengthMetrics;

    fontWeight?: number | FontWeight | string;

    fontStyle?: FontStyle;
}

declare class UrlStyle {

    constructor(url: string);

    readonly url: string;
}


declare type StyledStringValue = TextStyle | DecorationStyle | BaselineOffsetStyle | LetterSpacingStyle | TextShadowStyle | GestureStyle | ImageAttachment | ParagraphStyle | LineHeightStyle | UrlStyle | CustomSpan | UserDataSpan | BackgroundColorStyle;

declare class StyledString {

    //    constructor(value: string | ImageAttachment | CustomSpan, styles?: Array<StyleOptions>);

    readonly length: number;

    getString(): string;

    //    getStyles(start: number, length: number, styledKey?: StyledStringKey): Array<SpanStyle>;

    equals(other: StyledString): boolean;

    subStyledString(start: number, length?: number): StyledString;

    // static fromHtml(html: string): Promise<StyledString>;

    static marshalling(styledString: StyledString): ArrayBuffer;

    // static unmarshalling(buffer: ArrayBuffer): Promise<StyledString>;
}

declare interface StyleOptions {

    start?: number;

    length?: number;

    styledKey: StyledStringKey;

    styledValue: StyledStringValue;
}

declare abstract class UserDataSpan { }

declare interface DecorationStyle {}
declare interface BaselineOffsetStyle {}
declare interface LetterSpacingStyle {}
declare interface TextShadowStyle {}
declare interface GestureStyle {}
declare interface ImageAttachment {}
declare interface ParagraphStyle {}
declare interface LineHeightStyle {}
declare interface CustomSpan {}
declare interface BackgroundColorStyle {}