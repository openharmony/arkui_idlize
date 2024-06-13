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

export interface CustomComponent extends CommonAttribute {
    build(): void;
    aboutToAppear(): void;
    aboutToDisappear(): void;
    aboutToReuse(params: object): void;
    aboutToRecycle(): void;
}

export interface Resource {

  bundleName: string;

  moduleName: string;

  id: number;

  params?: object[];

  type?: number;
}

export class Color {
    White = 0
    Black = 1
}

export type Length = string | number | Resource

export type ResourceColor = Color | number | string

export type ResourceStr = string

export interface Offset {
    dx: Length;

    dy: Length;
};

export interface AltOffset {
    dx1: Length;
    dy2: Length;
};

export interface Position {
    x: Length;
    y: Length;
}

export type AnimationRange<T> = [from: T, to: T];

export interface Callback<T> {}

export interface ClickEvent {

    displayX: number;

    displayY: number;
}

export interface StateStyles {

    normal?: object;
}

export interface AttributeModifier<T>{}
export interface ContentModifier<T>{}

export interface SheetTitleOptions {
    title: ResourceStr;
    subtitle?: ResourceStr;
}

export interface UICommonEvent {
    setOnClick(callback: Callback<ClickEvent> | undefined): void;
}

export class SheetSize {
    MEDIUM = 0
    LARGE = 1
    FIT_CONTENT = 2
}

export interface BindOptions {
    backgroundColor?: ResourceColor;
}

export interface SheetOptions extends BindOptions {
    title?: SheetTitleOptions;
    detents?: [(SheetSize | Length | undefined), (SheetSize | Length | undefined), (SheetSize | Length | undefined)] | undefined;
}

export class BlurStyle {
    Thin = 0
}

export class ThemeColorMode {
    SYSTEM = 0
    LIGHT = 1
    DARK = 2
}

export class AdaptiveColor {
    DEFAULT = 0
}

export interface BlurOptions {
    grayscale: [number, number];
}

export interface BlurStyleOptions {
    colorMode?: ThemeColorMode;
    adaptiveColor?: AdaptiveColor;
    scale?: number;
    blurOptions?: BlurOptions;
}

export interface BackgroundBlurStyleOptions extends BlurStyleOptions {}

export interface SizeResult {
    width: number,
    height: number,
}

export interface EdgeWidths {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
};

export type EdgeWidth = EdgeWidths;

export interface Padding  {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
};

export interface DragPreviewOptions {
    numberBadge?: boolean | number;
}

export interface DragInteractionOptions {

    isMultiSelectionEnabled?: boolean;

    defaultAnimationBeforeLifting?: boolean;
}

export interface CommonMethod<T> {
    stateStyles(value: StateStyles): this;

    backdropBlur(value: number, options?: BlurOptions): this;

    width(value: Length): this;

    height(value: Length): this;

    bindSheet(isShow: boolean, builder: () => void, options?: SheetOptions): this;

    backgroundBlurStyle(value: BlurStyle, options?: BackgroundBlurStyleOptions): this;

    dragPreviewOptions(value: DragPreviewOptions, options?: DragInteractionOptions): this;
}

export interface CommonAttribute extends CommonMethod<CommonAttribute> {
}


export interface CanvasPath {

    rect(x: number, y: number, w: number, h: number): void;
  
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void;
  
    closePath(): void;
}

export interface CanvasRenderer extends CanvasPath {

    globalAlpha: number;
  
    globalCompositeOperation: string;
  
    // drawImage(image: ImageBitmap | PixelMap, dx: number, dy: number): void;
}
export type LengthMetrics = string

export interface NativeEmbedInfo {
    params?: Map<string, string>
}
export interface NativeEmbedDataInfo {
    info?: NativeEmbedInfo;
}

export interface DividerOptions {
    strokeWidth?: Dimension
    color?: ResourceColor
    startMargin?: Dimension
    endMargin?: Dimension
}
export interface LocalizedPadding {
    top?: LengthMetrics
    end?: LengthMetrics
    bottom?: LengthMetrics
    start?: LengthMetrics
}
export type SymbolGlyphModifier = string
export class TabBarSymbol {
    normal: SymbolGlyphModifier
    selected?: SymbolGlyphModifier
}
export interface VisibleListContentInfo {
    index: number
    itemIndexInGroup?: number
}
export interface TextCascadePickerRangeContent {
    text: string | Resource
    children?: TextCascadePickerRangeContent[]
}
export interface TextPickerRangeContent {
    icon: string | Resource
    text?: string | Resource
}
export interface TextPickerOptions {
    range: string[] | string[][] | Resource | TextPickerRangeContent[] | TextCascadePickerRangeContent[]
    value?: string | string[]
    selected?: number | number[]
}
export interface IndicatorStyle {
    color?: ResourceColor
}
export interface EmitterProperty {
    index: number
    emitRate?: number
}
export interface BorderOptions {

}
export class RenderingContextSettings {
    antialias?: boolean;

    constructor(antialias?: boolean) {}
}
export interface LabelStyle {
    maxLines?: number
}
export declare type Dimension = string | Resource;
export class BarMode {}
export class ButtonType {}
export interface SubTabBarStyle {}
export interface HorizontalAlign {}
export interface OnScrollVisibleContentChangeCallback {}
export interface Vector1 {}
export interface Vector2 {}
export interface PixelMap {}
export interface GradientDirection {}
export interface NavigationTitleMode {}

export interface RectResult {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class TouchTestInfo {
    windowX: number;
    windowY: number;
    parentX: number;
    parentY: number;
    x: number;
    y: number;
    rect: RectResult;
    id: string;
}

export enum EnumDTS {
    ELEM_0 = 0,
    ELEM_1 = 1,
    ELEM_2 = 2,
}

export interface  BooleanInterfaceDTS {
    valBool: boolean
}

export interface NumberInterfaceDTS {
    valNumber: number
}

export interface StringInterfaceDTS {
    valString: string
}

export interface UnionInterfaceDTS {

    unionProp: number | boolean
}

export interface UnionOptionalInterfaceDTS {

    unionProp: string | undefined
}

export interface TupleInterfaceDTS {

    tuple: [number, boolean]
}

export interface OptionInterfaceDTS {

    tuple: [boolean|undefined, number|undefined]
}

export interface ArrayRefNumberInterfaceDTS {

    tuple: Array<number>
}

export interface ArrayRefTuplesInterfaceDTS {

    tuple: Array<[boolean, number]>
}

export interface ClassDTS {

    valBoolean: boolean
}

// Non materialized class
export class ClassWithConstructorDTS {

    constructor(valNumber: number, valString: string) {}
}

// Non materialized class
export class ClassWithConstructorAndFieldsDTS {

    valNumber: number
    valBoolean: boolean

    constructor(valNumber: number, valBoolean: boolean) {}
}

// Materialized class
export class ClassWithConstructorAndMethodsDTS {

    constructor(valNumber: number, valString: string) {}

    method(valNumber: number, valString: string): void {}
}

// Materialized class
export class ClassWithConstructorAndStaticMethodsDTS {

    constructor(valNumber: number, valString: string) {}

    static of(valNumber: number, valString: string): ClassWithConstructorAndStaticMethodsDTS {
        return new ClassWithConstructorAndStaticMethodsDTS(valNumber, valString)
    }
}

// Materialized class
export class ClassWithConstructorAndFieldsAndMethodsDTS {

    valNumber: number
    valBoolean: boolean

    constructor(valNumber: number, valBoolean: boolean) {}

    method(valNumber: number, valString: string): void {}
}


// Materialized class
export class ClassWithConstructorAndWithoutParamsDTS {

    constructor() {}

    static of(): ClassWithConstructorAndWithoutParamsDTS {
        return new ClassWithConstructorAndWithoutParamsDTS()
    }

    method(): void {}
}

export class ClassWithConstructorAndNonOptionalParamsDTS {

    constructor(valNumber: number, valString: string) {}

    static of(valNumber: number, valString: string): ClassWithConstructorAndNonOptionalParamsDTS {
        return new ClassWithConstructorAndNonOptionalParamsDTS(valNumber, valString)
    }

    method(valBoolean: boolean, valString: string): void {}
}

// Materialized class
export class  ClassWithConstructorAndSomeOptionalParamsDTS {

    constructor(valNumber: number, valString?: string) {}

    static of(valNumber: number, valString?: string): ClassWithConstructorAndSomeOptionalParamsDTS {
        return new ClassWithConstructorAndSomeOptionalParamsDTS(valNumber, valString)
    }

    method(valBoolean: boolean, valString?: string): void {}
}

// Materialized class
export class ClassWithConstructorAndAllOptionalParamsDTS {

    constructor(valNumber?: number, valString?: string) {}

    static of(valNumber?: number, valString?: string): ClassWithConstructorAndAllOptionalParamsDTS {
        return new ClassWithConstructorAndAllOptionalParamsDTS(valNumber, valString)
    }

    method(valBoolean?: boolean, valString?: string): void {}
}
