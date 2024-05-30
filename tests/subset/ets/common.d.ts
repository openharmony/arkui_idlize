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

declare type PixelMap = import('../resource/image').default.PixelMap;

declare type SymbolGlyphModifier = import('../../resource/symbol').SymbolGlyphModifier;

declare type AnimationRange<T> = [from: T, to: T];

declare interface Callback<T> {}

declare interface ClickEvent extends BaseEvent {

    displayX: number;

    displayY: number;
}

declare interface StateStyles {

    normal?: any;
}

declare interface AttributeModifier<T>{}
declare interface ContentModifier<T>{}

declare interface SheetTitleOptions {
    title: ResourceStr;
    subtitle?: ResourceStr;
}

declare interface UICommonEvent {
    setOnClick(callback: Callback<ClickEvent> | undefined): void;
}

declare enum SheetSize {
    MEDIUM,
    LARGE,
    FIT_CONTENT = 2,
}

declare type CustomBuilder = (() => any) | void;

declare interface BindOptions {
    backgroundColor?: ResourceColor;
}

declare interface SheetOptions extends BindOptions {
    title?: SheetTitleOptions | CustomBuilder;
    detents?: [(SheetSize | Length), (SheetSize | Length)?, (SheetSize | Length)?];
}

declare enum BlurStyle {
    Thin = 0,
}

declare enum ThemeColorMode {
    SYSTEM = 0,
    LIGHT = 1,
    DARK = 2
}

declare enum AdaptiveColor {
    DEFAULT = 0,
}

declare interface BlurOptions {
    grayscale: [number, number];
}

declare interface BlurStyleOptions {
    colorMode?: ThemeColorMode;
    adaptiveColor?: AdaptiveColor;
    scale?: number;
    blurOptions?: BlurOptions;
}

declare interface BackgroundBlurStyleOptions extends BlurStyleOptions {}

declare interface SizeResult {
    width: number,
    height: number,
}

declare type EdgeWidths = {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
};

declare type EdgeWidth = EdgeWidths;

declare type Padding = {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
};

declare interface LocalizedEdgeWidths {
    top?: LengthMetrics;
    end?: LengthMetrics;
    bottom?: LengthMetrics;
    start?: LengthMetrics;
};

declare type EdgeColors = {
    top?: ResourceColor;
    right?: ResourceColor;
    bottom?: ResourceColor;
    left?: ResourceColor;
};

declare interface LocalizedEdgeColors  {
    top?: ResourceColor;
    end?: ResourceColor;
    bottom?: ResourceColor;
    start?: ResourceColor;
};

declare type BorderRadiuses = {
    topLeft?: Length;
    topRight?: Length;
    bottomLeft?: Length;
    bottomRight?: Length;
};

declare interface LocalizedBorderRadiuses  {
    topStart?: LengthMetrics;
    topEnd?: LengthMetrics;
    bottomStart?: LengthMetrics;
    bottomEnd?: LengthMetrics;
};

declare enum BorderStyle {
    Dotted,
    Dashed,
    Solid,
}

declare type EdgeStyles = {
    top?: BorderStyle;
    right?: BorderStyle;
    bottom?: BorderStyle;
    left?: BorderStyle;
};

declare interface BorderOptions {
    width?: EdgeWidths | Length | LocalizedEdgeWidths;
    color?: EdgeColors | ResourceColor | LocalizedEdgeColors;
    radius?: BorderRadiuses | Length | LocalizedBorderRadiuses;
    style?: EdgeStyles | BorderStyle;
}

declare interface DragPreviewOptions {
    numberBadge?: boolean | number;
}

declare interface DragInteractionOptions {

    isMultiSelectionEnabled?: boolean;

    defaultAnimationBeforeLifting?: boolean;
}

declare enum GradientDirection {
    Left,
    Top,
    Right,
    Bottom,
    LeftTop,
    LeftBottom,
    RightTop,
    RightBottom,
    None,
}

declare class CommonMethod<T> {

    constructor();

    stateStyles(value: StateStyles): T;

    backdropBlur(value: number, options?: BlurOptions): T;

    width(value: Length): T;

    height(value: Length): T;

    key(value: string): T;

    restoreId(value: number): T;

    padding(value: Padding | Dimension): T;

    bindSheet(isShow: boolean, builder: () => void, options?: SheetOptions): T;

    backgroundBlurStyle(value: BlurStyle, options?: BackgroundBlurStyleOptions): T;

    dragPreviewOptions(value: DragPreviewOptions, options?: DragInteractionOptions): T;

    linearGradient(value: {
        angle?: number | string;
        direction?: GradientDirection;
        colors: Array<[ResourceColor, number]>;
        repeating?: boolean;
    }): T;

    border(value: BorderOptions): T;
}

declare interface Rectangle {

    x?: Length;

    y?: Length;

    width?: Length;

    height?: Length;
}

declare class CommonAttribute extends CommonMethod<CommonAttribute> {
}

declare class CustomComponent extends CommonAttribute {
    build(): void;
    aboutToAppear?(): void;
    aboutToDisappear?(): void;
    aboutToReuse?(params: { [key: string]: unknown }): void;
    aboutToRecycle?(): void;
}

declare class CommonShapeMethod<T> extends CommonMethod<T> {
    constructor();

    stroke(value: ResourceColor): T;
}

declare class ScrollableCommonMethod<T> extends CommonMethod<T> {
    scrollBarWidth(value: number | string): T;
}

declare module 'commonEvent' {
    module 'commonEvent' {
        // @ts-ignore
        export { UICommonEvent };
    }
}

declare module 'commonAttribute'{
    module 'commonAttribute' {
        // @ts-ignore
        export { CommonAttribute };
    }
}
