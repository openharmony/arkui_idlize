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

declare type ComponentContent = import('../api/arkui/ComponentContent').ComponentContent;

declare type AnimationRange<T> = [from: T, to: T];

declare interface Callback<T, V = void> {
  (data: T): V;
}

declare interface BaseEvent {}

declare interface ClickEvent extends BaseEvent {
    target: EventTarget;
    timestamp: number;
    source: SourceType;
    axisHorizontal?: number;
    axisVertical?: number;
    pressure: number;
    sourceTool: SourceTool;
    deviceId?: number;
    displayX: number;
    displayY: number;
    windowX: number;
    windowY: number;
    screenX: number;
    screenY: number;
    tiltX: number;
    tiltY: number;
    x: number;
    y: number;
    preventDefault: () => void;
}

// Used for decorators
declare interface ComponentOptions {
  freezeWhenInactive : boolean,
}

// Used for decorators
declare interface PreviewParams {
    title?: string;
    width?: number;
    height?: number;
    locale?: string;
    colorMode?: string;
    deviceType?: string;
    dpi?: number;
    orientation?: string;
    roundScreen?: boolean;
}

// Used for decorators
declare type OnMoveHandler = (from: number, to: number) => void;

// Used for decorators
declare class DynamicNode<T> {

  onMove(handler: Optional<OnMoveHandler>): T;
}

// Used for decorators
declare interface AbstractProperty<T> {
  get(): T;
  set(newValue: T): void;
  info(): string;
}

declare interface CommonConfiguration<T> {

  enabled: boolean,

  contentModifier: ContentModifier<T>
}

interface ICurve {

  interpolate(fraction: number): number;
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

declare enum SheetType {
    BOTTOM = 0,
    CENTER = 1,
    POPUP = 2,
}

declare enum SheetMode {
    OVERLAY = 0,
    EMBEDDED = 1,
}

declare enum ShadowStyle {
    OUTER_DEFAULT_XS,
    OUTER_DEFAULT_SM,
    OUTER_DEFAULT_MD,
    OUTER_DEFAULT_LG,
    OUTER_FLOATING_SM,
    OUTER_FLOATING_MD,
}

declare enum ShadowType {
    COLOR,
    BLUR,
}

declare interface ShadowOptions {
    radius: number | Resource;
    type?: ShadowType;
    color?: Color | string | Resource | ColoringStrategy;
    offsetX?: number | Resource;
    offsetY?: number | Resource;
    fill?: boolean;
}

declare interface SheetDismiss {
    dismiss: () => void;
}

declare enum DismissReason {
    PRESS_BACK = 0,
    TOUCH_OUTSIDE = 1,
    CLOSE_BUTTON = 2,
    SLIDE_DOWN = 3
}

declare interface DismissSheetAction {
    dismiss: Callback<void>;
    reason: DismissReason;
}

declare interface SpringBackAction {
    springBack: Callback<void>;
}

declare type CustomBuilder = (() => any) | void;

declare interface BindOptions {
    backgroundColor?: ResourceColor;
    onAppear?: () => void;
    onDisappear?: () => void;
    onWillAppear?: () => void;
    onWillDisappear?: () => void;
}

declare type UIContext = import('../api/@ohos.arkui.UIContext').UIContext; // hack

declare enum ScrollSizeMode {
    FOLLOW_DETENT = 0,
    CONTINUOUS = 1,
}

declare enum SheetKeyboardAvoidMode {
    NONE = 0,
    TRANSLATE_AND_RESIZE = 1,
    RESIZE_ONLY = 2,
    TRANSLATE_AND_SCROLL = 3,
}

declare enum HoverModeAreaType {

    TOP_SCREEN = 0,
    BOTTOM_SCREEN = 1,
}

declare interface SheetOptions extends BindOptions {
    height?: SheetSize | Length;
    dragBar?: boolean;
    maskColor?: ResourceColor;
    detents?: [(SheetSize | Length), (SheetSize | Length)?, (SheetSize | Length)?];
    blurStyle?: BlurStyle;
    showClose?: boolean | Resource;
    preferType?: SheetType;
    title?: SheetTitleOptions | CustomBuilder;
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
    scrollSizeMode?: ScrollSizeMode;
    onDetentsDidChange?: Callback<number>;
    onWidthDidChange?: Callback<number>;
    onTypeDidChange?: Callback<SheetType>;
    uiContext?: UIContext;
    keyboardAvoidMode?: SheetKeyboardAvoidMode;
    enableHoverMode?: boolean;
    hoverModeArea?: HoverModeAreaType;
    offset?: Position;
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

declare enum BlurStyleActivePolicy {
    /**
     * The component has the blur effect only when the window is focused.
     *
     * @syscap SystemCapability.ArkUI.ArkUI.Full
     * @crossplatform
     * @atomicservice
     * @since 12
     */
    FOLLOWS_WINDOW_ACTIVE_STATE = 0,

    /**
     * The component always has the blur effect, regardless of whether the window is focused.
     *
     * @syscap SystemCapability.ArkUI.ArkUI.Full
     * @crossplatform
     * @atomicservice
     * @since 12
     */
    ALWAYS_ACTIVE = 1,

    /**
     * The component does not have the blur effect, regardless of whether the window is focused.
     *
     * @syscap SystemCapability.ArkUI.ArkUI.Full
     * @crossplatform
     * @atomicservice
     * @since 12
     */
    ALWAYS_INACTIVE = 2,
}

declare enum BlurType {
    /**
     * The blur is applied within the window.
     *
     * @syscap SystemCapability.ArkUI.ArkUI.Full
     * @crossplatform
     * @atomicservice
     * @since 12
     */
    WITHIN_WINDOW = 0,
    /**
     * The blur is applied behind the window.
     *
     * @syscap SystemCapability.ArkUI.ArkUI.Full
     * @crossplatform
     * @atomicservice
     * @since 12
     */
    BEHIND_WINDOW = 1
}

declare interface BackgroundBlurStyleOptions extends BlurStyleOptions {
    policy?: BlurStyleActivePolicy;
    inactiveColor?: ResourceColor;
}

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
    //width?: EdgeWidths | Length | LocalizedEdgeWidths;
    //color?: EdgeColors | ResourceColor | LocalizedEdgeColors;
    //radius?: BorderRadiuses | Length | LocalizedBorderRadiuses;
    //style?: EdgeStyles | BorderStyle;
}

declare enum DragPreviewMode {
  AUTO = 1,
  DISABLE_SCALE = 2,
  ENABLE_DEFAULT_SHADOW = 3,
  ENABLE_DEFAULT_RADIUS = 4,
}

declare type ImageModifier = import('../api/arkui/ImageModifier').ImageModifier; // hack

declare interface DragPreviewOptions {
    mode?: DragPreviewMode | Array<DragPreviewMode>;
    modifier?: ImageModifier;
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

declare enum Alignment {
    TopStart,
    Top,
    TopEnd,
    Start,
    Center,
    End,
    BottomStart,
    Bottom,
    BottomEnd,
}

declare interface LinearGradient {
    angle?: number | string;
    direction?: GradientDirection;
    colors: Array<[ResourceColor, number]>;
    repeating?: boolean;
}

declare class AttributeModifier<T> {}

declare class CommonMethod<T> {

    constructor();

    stateStyles(value: StateStyles): T;

    backdropBlur(value: number, options?: BlurOptions): T;

    width(value: Length): T;

    height(value: Length): T;

    key(value: string): T;

    restoreId(value: number): T;

    padding(value: Padding | Dimension): T;

    background(builder: CustomBuilder, options?: { align?: Alignment }): T;

    bindSheet(isShow: Optional<boolean>, builder: CustomBuilder, options?: SheetOptions): T;

    backgroundBlurStyle(value: BlurStyle, options?: BackgroundBlurStyleOptions): T;

    dragPreviewOptions(value: DragPreviewOptions, options?: DragInteractionOptions): T;

    linearGradient(value: {
        angle?: number | string;
        direction?: GradientDirection;
        colors: Array<[ResourceColor, number]>;
        repeating?: boolean;
    }): T;

    border(value: BorderOptions): T;

    size(value: SizeOptions): T;

    onChildTouchTest(event: (value: Array<TouchTestInfo>) => string): T;

    attributeModifier(modifier: AttributeModifier<T>): T

    gestureModifier(modifier: GestureModifier): T;

    onGestureRecognizerJudgeBegin(callback: GestureRecognizerJudgeBeginCallback): T;

    onClick(event: (event?: ClickEvent) => void): T;
    onClick(event: Callback<ClickEvent>, distanceThreshold: number): T;

    backgroundColor(value: ResourceColor): T;
}

declare interface Rectangle {

    x?: Length;

    y?: Length;

    width?: Length;

    height?: Length;
}

declare interface RectResult {
    x: number;
    y: number;
    width: number;
    height: number;
}

declare class TouchTestInfo {
    windowX: number;
    windowY: number;
    parentX: number;
    parentY: number;
    x: number;
    y: number;
    rect: RectResult;
    id: string;
}
declare interface CommonInterface {
    (): CommonAttribute
}

declare class CommonAttribute extends CommonMethod<CommonAttribute> {
}

declare const Common: CommonInterface

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

declare interface EventTarget {
    area: Area;
}

declare interface Area {
    width: Length;
    height: Length;
    position: Position;
    globalPosition: Position;
}

declare interface Position {
    x?: Length;
    y?: Length;
}

declare enum SourceTool {
    Unknown,
    Finger,
    Pen,
    MOUSE,
    TOUCHPAD,
    JOYSTICK,
}

declare enum SourceType {
    Unknown,
    Mouse,
    TouchScreen,
}

declare interface UIGestureEvent {

  addGesture<T>(gesture: GestureHandler<T>, priority?: GesturePriority, mask?: GestureMask): void;
}

declare interface GestureModifier {
  applyGesture(): void;
  applyGesture(event: UIGestureEvent): void;
}

declare type GestureRecognizerJudgeBeginCallback = (event: BaseGestureEvent, current: GestureRecognizer, recognizers: Array<GestureRecognizer>) => GestureJudgeResult;


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
