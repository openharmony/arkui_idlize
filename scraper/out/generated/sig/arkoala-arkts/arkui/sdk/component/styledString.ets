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
import { ResourceColor, ResourceStr, SizeOptions, ColorFilter, Padding, BorderRadiuses } from "./units"
import { Color, FontStyle, FontWeight, TextDecorationType, TextDecorationStyle, TextAlign, TextOverflow, WordBreak, ImageSpanAlignment, ImageFit } from "./enums"
import { Resource } from "@global.resource"
import { LengthMetrics, DrawContext } from "./../Graphics"
import { ShadowOptions, ClickEvent } from "./common"
import { TextBackgroundStyle } from "./span"
import { GestureEvent } from "./gesture"
import { LeadingMarginPlaceholder } from "./richEditor"
import { extractors } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
import { default as drawing } from "@ohos.graphics.drawing"
export type StyledStringMarshallingValue = UserDataSpan;
export type StyledStringMarshallCallback = (marshallableVal: UserDataSpan) => ArrayBuffer;
export type StyledStringUnmarshallCallback = (buf: ArrayBuffer) => UserDataSpan;
export declare class StyledString {
    constructor(value: string | ImageAttachment | CustomSpan, styles: Array<StyleOptions> | undefined)
    readonly length: number;
    getString(): string
    getStyles(start: number, length: number, styledKey?: StyledStringKey): Array<SpanStyle>
    equals(other: StyledString): boolean
    subStyledString(start: number, length?: number): StyledString
    static fromHtml(html: string): Promise<StyledString>
    static toHtml(styledString: StyledString): string
    static marshalling(styledString: StyledString, callback_?: StyledStringMarshallCallback): ArrayBuffer
    static unmarshalling(buffer: ArrayBuffer, callback_?: StyledStringUnmarshallCallback): Promise<StyledString>
}
export declare interface StyleOptions {
    start?: int32;
    length?: int32;
    styledKey: StyledStringKey;
    styledValue: StyledStringValue;
}
export declare interface SpanStyle {
    start: number;
    length: number;
    styledKey: StyledStringKey;
    styledValue: StyledStringValue;
}
export declare class TextStyle {
    constructor(value: TextStyleInterface | undefined)
    readonly fontColor?: ResourceColor | undefined;
    readonly fontFamily?: string | undefined;
    readonly fontSize?: number | undefined;
    readonly fontWeight?: number | undefined;
    readonly fontStyle?: FontStyle | undefined;
}
export declare interface TextStyleInterface {
    fontColor?: ResourceColor;
    fontFamily?: ResourceStr;
    fontSize?: LengthMetrics;
    fontWeight?: number | FontWeight | string;
    fontStyle?: FontStyle;
}
export declare class DecorationStyle {
    constructor(value: DecorationStyleInterface)
    readonly type: TextDecorationType;
    readonly color?: ResourceColor | undefined;
    readonly style?: TextDecorationStyle | undefined;
}
export declare interface DecorationStyleInterface {
    type: TextDecorationType;
    color?: ResourceColor;
    style?: TextDecorationStyle;
}
export declare class BaselineOffsetStyle {
    constructor(value: LengthMetrics)
    readonly baselineOffset: number;
}
export declare class LetterSpacingStyle {
    constructor(value: LengthMetrics)
    readonly letterSpacing: number;
}
export declare class TextShadowStyle {
    constructor(value: ShadowOptions | Array<ShadowOptions>)
    readonly textShadow: Array<ShadowOptions>;
}
export declare class BackgroundColorStyle {
    constructor(textBackgroundStyle: TextBackgroundStyle)
    readonly textBackgroundStyle: TextBackgroundStyle;
}
export declare class GestureStyle {
    constructor(value: GestureStyleInterface | undefined)
}
export declare interface GestureStyleInterface {
    onClick?: ((value0: ClickEvent) => void);
    onLongPress?: ((value0: GestureEvent) => void);
}
export declare class ParagraphStyle {
    constructor(value: ParagraphStyleInterface | undefined)
    readonly textAlign?: TextAlign | undefined;
    readonly textIndent?: number | undefined;
    readonly maxLines?: number | undefined;
    readonly overflow?: TextOverflow | undefined;
    readonly wordBreak?: WordBreak | undefined;
    readonly leadingMargin?: number | LeadingMarginPlaceholder | undefined;
    readonly paragraphSpacing?: number | undefined;
}
export declare interface ParagraphStyleInterface {
    textAlign?: TextAlign;
    textIndent?: LengthMetrics;
    maxLines?: number;
    overflow?: TextOverflow;
    wordBreak?: WordBreak;
    leadingMargin?: LengthMetrics | LeadingMarginPlaceholder;
    paragraphSpacing?: LengthMetrics;
}
export declare class LineHeightStyle {
    constructor(lineHeight: LengthMetrics)
    readonly lineHeight: number;
}
export declare class UrlStyle {
    constructor(url: string)
    readonly url: string;
}
export type StyledStringValue = TextStyle | DecorationStyle | BaselineOffsetStyle | LetterSpacingStyle | TextShadowStyle | GestureStyle | ImageAttachment | ParagraphStyle | LineHeightStyle | UrlStyle | CustomSpan | UserDataSpan | BackgroundColorStyle;
export declare class MutableStyledString extends StyledString {
    constructor(value: string | ImageAttachment | CustomSpan, styles: Array<StyleOptions> | undefined)
    replaceString(start: number, length: number, other: string): void
    insertString(start: number, other: string): void
    removeString(start: number, length: number): void
    replaceStyle(spanStyle: SpanStyle): void
    setStyle(spanStyle: SpanStyle): void
    removeStyle(start: number, length: number, styledKey: StyledStringKey): void
    removeStyles(start: number, length: number): void
    clearStyles(): void
    replaceStyledString(start: number, length: number, other: StyledString): void
    insertStyledString(start: number, other: StyledString): void
    appendStyledString(other: StyledString): void
}
export enum StyledStringKey {
    FONT = 0,
    DECORATION = 1,
    BASELINE_OFFSET = 2,
    LETTER_SPACING = 3,
    TEXT_SHADOW = 4,
    LINE_HEIGHT = 5,
    BACKGROUND_COLOR = 6,
    URL = 7,
    GESTURE = 100,
    PARAGRAPH_STYLE = 200,
    IMAGE = 300,
    CUSTOM_SPAN = 400,
    USER_DATA = 500
}
export declare class ImageAttachment {
    constructor(value: ImageAttachmentInterface | AttachmentType | undefined)
    readonly value: image.PixelMap;
    readonly size?: SizeOptions | undefined;
    readonly verticalAlign?: ImageSpanAlignment | undefined;
    readonly objectFit?: ImageFit | undefined;
    readonly layoutStyle?: ImageAttachmentLayoutStyle | undefined;
    readonly colorFilter?: ColorFilterType | undefined;
}
export declare interface ResourceImageAttachmentOptions {
    resourceValue: ResourceStr | undefined;
    size?: SizeOptions;
    verticalAlign?: ImageSpanAlignment;
    objectFit?: ImageFit;
    layoutStyle?: ImageAttachmentLayoutStyle;
    colorFilter?: ColorFilterType;
    syncLoad?: boolean;
}
export declare interface ImageAttachmentInterface {
    value: image.PixelMap;
    size?: SizeOptions;
    verticalAlign?: ImageSpanAlignment;
    objectFit?: ImageFit;
    layoutStyle?: ImageAttachmentLayoutStyle;
    colorFilter?: ColorFilterType;
}
export type AttachmentType = ImageAttachmentInterface | ResourceImageAttachmentOptions;
export type ColorFilterType = ColorFilter | drawing.ColorFilter;
export declare interface ImageAttachmentLayoutStyle {
    margin?: LengthMetrics | Padding;
    padding?: LengthMetrics | Padding;
    borderRadius?: LengthMetrics | BorderRadiuses;
}
export declare interface CustomSpanMetrics {
    width: number;
    height?: number;
}
export declare interface CustomSpanDrawInfo {
    x: number;
    lineTop: number;
    lineBottom: number;
    baseline: number;
}
export declare interface CustomSpanMeasureInfo {
    fontSize: number;
}
export declare abstract class CustomSpan {
    constructor()
    onMeasure: ((measureInfo: CustomSpanMeasureInfo) => CustomSpanMetrics);
    onDraw: ((context: DrawContext,drawInfo: CustomSpanDrawInfo) => void);
    invalidate(): void
}
export declare abstract class UserDataSpan {
    constructor()
}
