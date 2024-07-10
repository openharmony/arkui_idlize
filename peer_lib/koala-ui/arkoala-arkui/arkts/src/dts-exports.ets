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

import { BlurStyle,
         GradientDirection,
         DismissReason,
         ShadowStyle,
         ShadowType,
         SheetMode,
         SheetSize,
         SheetType,
         SourceTool,
         BorderStyle,
         DragPreviewMode,
         AdaptiveColor,
         ThemeColorMode } from './ArkCommonInterfaces'
import { GestureMask,
         GesturePriority,
        GestureJudgeResult } from './ArkGestureInterfaces'
import { CalendarAlign } from './ArkCalendarPickerInterfaces'
import { EnumDTS } from './ArkTestInterfaces'
import { NavigationTitleMode } from './ArkNavigationInterfaces'
import { HorizontalAlign } from './ArkColumnInterfaces'
import { SelectedMode } from './ArkTabContentInterfaces'
import { BarMode } from './ArkTabsInterfaces'
import { TextHeightAdaptivePolicy,
         FontStyle,
         TextOverflow,
         FontWeight,
         ColoringStrategy } from './ArkEnumInterfaces'

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

export interface BindOptions {
    backgroundColor?: ResourceColor;
    onAppear?: () => void;
    onDisappear?: () => void;
    onWillAppear?: () => void;
    onWillDisappear?: () => void;
}

export interface SheetDismiss {
    dismiss: () => void;
}

export interface DismissSheetAction {
    dismiss: Callback<void>;
    reason: DismissReason;
}

export interface SpringBackAction {
    springBack: Callback<void>;
}

export interface UIContext {
}

export interface SheetOptions extends BindOptions {
    title?: SheetTitleOptions | CustomBuilder;
    detents?: [(SheetSize | Length | undefined), (SheetSize | Length | undefined), (SheetSize | Length | undefined)] | undefined;
    height?: SheetSize | Length;
    dragBar?: boolean;
    maskColor?: ResourceColor;
    blurStyle?: BlurStyle;
    showClose?: boolean | Resource;
    preferType?: SheetType;
    shouldDismiss?: (sheetDismiss: SheetDismiss) => void;
    onWillDismiss?: Callback<DismissSheetAction>;
    onWillSpringBackWhenDismiss?: Callback<SpringBackAction>;
    enableOutsideInteractive?: boolean;
    width?: Dimension;
    borderWidth?: Dimension | EdgeWidths | LocalizedEdgeWidths;
    borderColor?: ResourceColor | EdgeColors | LocalizedEdgeColors;
    borderStyle?: BorderStyle | EdgeStyles;
    shadow?: ShadowOptions | ShadowStyle;
    onHeightDidChange?: Callback<number>;
    mode?: SheetMode;
    onDetentsDidChange?: Callback<number>;
    onWidthDidChange?: Callback<number>;
    onTypeDidChange?: Callback<int>;
    uiContext?: UIContext;
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

export enum BlurStyleActivePolicy {
    FOLLOWS_WINDOW_ACTIVE_STATE = 0,
    ALWAYS_ACTIVE = 1,
    ALWAYS_INACTIVE = 2,
}

declare enum BlurType {
    WITHIN_WINDOW = 0,
    BEHIND_WINDOW = 1
}

export interface BackgroundBlurStyleOptions extends BlurStyleOptions {
    policy?: BlurStyleActivePolicy;
    inactiveColor?: ResourceColor;
    type?: BlurType;
}

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

export class ImageModifier {
}

export interface DragPreviewOptions {
    mode?: DragPreviewMode | Array<int>;
    modifier?: ImageModifier;
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
    overflow?: TextOverflow;
    maxLines?: number;
    minFontSize?: number | ResourceStr;
    maxFontSize?: number | ResourceStr;
    heightAdaptivePolicy?: TextHeightAdaptivePolicy;
    font?: Font;
}
export declare type Dimension = string | Resource;
export interface OnScrollVisibleContentChangeCallback {}
export interface Vector1 {
    x0: number;
    x1: number;
    x2: number;
    x3: number;
}
export interface Vector2 {
    t: number;
    x: number;
    y: number;
    z: number;
}
export interface PixelMap {}

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


export type CustomBuilder = (() => Object | void)

export interface ShadowOptions {
    radius: number | Resource;
    type?: ShadowType;
    color?: Color | string | Resource | ColoringStrategy;
    offsetX?: number | Resource;
    offsetY?: number | Resource;
    fill?: boolean;
}

export interface LocalizedEdgeColors  {
  top?: ResourceColor;
  end?: ResourceColor;
  bottom?: ResourceColor;
  start?: ResourceColor;
}

export interface LocalizedEdgeWidths {
    top?: LengthMetrics;
    end?: LengthMetrics;
    bottom?: LengthMetrics;
    start?: LengthMetrics;
}

export interface Font {
  size?: Length;
  weight?: FontWeight | number | string;
  family?: string | Resource;
  style?: FontStyle;
}

export interface EdgeColors {
    top?: ResourceColor;
    right?: ResourceColor;
    bottom?: ResourceColor;
    left?: ResourceColor;
}

export interface EdgeStyles {
  top?: BorderStyle;
  right?: BorderStyle;
  bottom?: BorderStyle;
  left?: BorderStyle;
};

export interface BaseEvent {}

export interface FingerInfo {
  id: number;
  globalX: number;
  globalY: number;
  localX: number;
  localY: number;
  displayX: number;
  displayY: number;
}

export interface BaseGestureEvent extends BaseEvent {
  fingerList: FingerInfo[];
}

export enum LengthMetricsUnit {
  DEFAULT = 0,
  PX = 1
}

export class ImageData {
  readonly data: Uint8ClampedArray;
  readonly height?: number;
  readonly width?: number;
  constructor(width: number, height: number, data?: Uint8ClampedArray, unit?: LengthMetricsUnit) {
    this.width = width
    this.height = height
    this.data = data ?? new Uint8ClampedArray(0)
  }
}

export interface GestureInterface<T> {
  tag(tag: string): T;
  allowedTypes(value: Array<int>): T;
}

export abstract class GestureHandler<T> implements GestureInterface<T> {
  abstract tag(tag: string): T;
  abstract allowedTypes(types: Array<int>): T;
}

export interface UIGestureEvent {
  addGesture<T>(gesture: GestureHandler<T>, priority?: GesturePriority, mask?: GestureMask): void;
}

export interface GestureModifier {
  applyGesture(): void;
  applyGesture(event: UIGestureEvent): void;
}

declare namespace GestureControl {
  enum GestureType {
    TAP_GESTURE = 0,
    LONG_PRESS_GESTURE = 1,
    PAN_GESTURE = 2,
    PINCH_GESTURE = 3,
    SWIPE_GESTURE = 4,
    ROTATION_GESTURE = 5,
    DRAG = 6,
    CLICK = 7,
  }
}

enum GestureRecognizerState {
  READY = 0,
  DETECTING = 1,
  PENDING = 2,
  BLOCKED = 3,
  SUCCESSFUL = 4,
  FAILED = 5,
}

abstract class EventTargetInfo {
  abstract getId(): string;
}

interface GestureRecognizer {
  getTag(): string;

  getType(): GestureControl.GestureType;

  isBuiltIn(): boolean;

  setEnabled(isEnabled: boolean): void;

  isEnabled(): boolean;

  getState(): GestureRecognizerState;

  getEventTargetInfo(): EventTargetInfo;
}

export type GestureRecognizerJudgeBeginCallback = (event: BaseGestureEvent, current: GestureRecognizer, recognizers: Array<GestureRecognizer>) => GestureJudgeResult;

export class CanvasRenderingContext2D implements CanvasRenderer {
  readonly height: number;
  readonly width: number;
  globalAlpha: number;
  globalCompositeOperation: string;
  stopImageAnalyzer(): void {}
  constructor(settings?: RenderingContextSettings) {}
  static of(height: number, width: number): CanvasRenderingContext2D {
    return new CanvasRenderingContext2D()
  }
  rect(x: number, y: number, w: number, h: number): void {}
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {}
  closePath(): void {}
}

interface DrawingCanvas {}

interface Size {
  width: number
  height: number
}

export class DrawingRenderingContext {
  // get size(): Size
  // get canvas(): DrawingCanvas;
  invalidate(): void {}
  constructor(unit?: LengthMetricsUnit) {}
}

export interface BoardStyle {
  borderRadius?: Length;
}

export interface ComponentContent {}

declare class Indicator<T> {}

export class DotIndicator extends Indicator<DotIndicator> {
  constructor() {}
  itemWidth(value: Length): DotIndicator {
    return this;
  }
  itemHeight(value: Length): DotIndicator {
    return this;
  }
}
