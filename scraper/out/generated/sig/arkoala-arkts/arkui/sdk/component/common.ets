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
import { TextDecorationType, Color, TextDecorationStyle, PlayMode, SharedTransitionEffectType, GradientDirection, VerticalAlign, HorizontalAlign, FontWeight, FontStyle, ColoringStrategy, InteractionHand, MouseButton, MouseAction, AccessibilityHoverType, TouchType, AxisAction, KeyType, KeySource, AxisModel, CrownAction, BorderStyle, Placement, ArrowPointPosition, ClickEffectLevel, NestedScrollMode, ImageRepeat, Alignment, HitTestMode, ImageSize, HoverEffect, Visibility, ItemAlign, Direction, ObscuredReasons, RenderFit, FocusDrawLevel, Axis, ResponseType, FunctionKey, ModifierKey, LineCapStyle, LineJoinStyle, PixelRoundCalcPolicy, BarState, CrownSensitivity, EdgeEffect, ScrollSource, IlluminatedType } from "./enums"
import { ResourceColor, Length, Bias, Area, Font, BorderRadiuses, EdgeWidths, LocalizedEdgeWidths, SizeOptions, VoidCallback, ResourceStr, Dimension, EdgeColors, LocalizedEdgeColors, EdgeStyles, Position, LocalizedBorderRadiuses, Padding, EdgeOutlineWidths, ConstraintSizeOptions, ChainWeightOptions, LocalizedPadding, BorderOptions, OutlineOptions, EdgeOutlineStyles, OutlineRadiuses, Edges, LocalizedEdges, LocalizedPosition, AccessibilityOptions, DirectionalEdgesT } from "./units"
import { Resource } from "@global.resource"
import { extractors, CustomStyles, ContentModifier, GestureModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { Context } from "@application.Context"
import { default as curves } from "@ohos.curves"
import { DrawContext, LengthMetrics } from "./../Graphics"
import { default as image } from "@ohos.multimedia.image"
import { CustomBuilder } from "./builder"
import { default as pointer } from "@ohos.multimodalInput.pointer"
import { ButtonType, ButtonStyleMode, ButtonRole } from "./button"
import { BaseGestureEvent, GestureRecognizer, GestureJudgeResult, GestureInfo, GestureType, Gesture, GestureMask } from "./gesture"
import { default as unifiedDataChannel } from "@ohos.data.unifiedDataChannel"
import { default as uniformTypeDescriptor } from "@ohos.data.uniformTypeDescriptor"
import { IntentionCode } from "@ohos.multimodalInput.intentionCode"
import { UIContext } from "@ohos.arkui.UIContext"
import { SymbolGlyphModifier } from "./../SymbolGlyphModifier"
import { StyledString } from "./styledString"
import { ResizableOptions } from "./image"
import { default as uiEffect } from "@ohos.graphics.uiEffect"
import { FocusBoxStyle, FocusPriority } from "./focus"
import { CircleShape, EllipseShape, PathShape, RectShape } from "@ohos.arkui.shape"
import { ComponentContent } from "./../ComponentContent"
import { default as uiObserver } from "@ohos.arkui.observer"
import { default as promptAction } from "@ohos.promptAction"
import { TextRange } from "./textCommon"
import { ScrollState } from "./list"
import { Want } from "@ohos.app.ability.Want"
import { default as intl } from "@ohos.intl"
export declare interface InputCounterOptions {
    thresholdPercentage?: number;
    highlightBorder?: boolean;
}
export declare interface TextDecorationOptions {
    type: TextDecorationType;
    color?: ResourceColor;
    style?: TextDecorationStyle;
}
export declare interface DividerStyle {
    strokeWidth: Length;
    color?: ResourceColor;
    startMargin?: Length;
    endMargin?: Length;
}
export type ReuseIdCallback = () => string;
export declare interface ReuseOptions {
    reuseId?: ReuseIdCallback;
}
export { Context } from "@application.Context"
export declare interface Configuration {
    readonly colorMode: string;
    readonly fontScale: number;
}
export declare interface Rectangle {
    x?: Length;
    y?: Length;
    width?: Length;
    height?: Length;
}
export declare interface ExpectedFrameRateRange {
    min: number;
    max: number;
    expected: number;
}
export enum AccessibilitySamePageMode {
    SEMI_SILENT = 0,
    FULL_SILENT = 1
}
export enum AccessibilityRoleType {
    ACTION_SHEET = 0,
    ALERT_DIALOG = 1,
    INDEXER_COMPONENT = 2,
    BADGE_COMPONENT = 3,
    BLANK = 4,
    BUTTON = 5,
    BACK_BUTTON = 6,
    SHEET_DRAG_BAR = 7,
    CALENDAR_PICKER = 8,
    CALENDAR = 9,
    CANVAS = 10,
    CANVAS_GRADIENT = 11,
    CANVAS_PATTERN = 12,
    CHECKBOX = 13,
    CHECKBOX_GROUP = 14,
    CIRCLE = 15,
    COLUMN_SPLIT = 16,
    COLUMN = 17,
    CANVAS_RENDERING_CONTEXT_2D = 18,
    CHART = 19,
    COUNTER = 20,
    CONTAINER_MODAL = 21,
    DATA_PANEL = 22,
    DATE_PICKER = 23,
    DIALOG = 24,
    DIVIDER = 25,
    DRAG_BAR = 26,
    EFFECT_COMPONENT = 27,
    ELLIPSE = 28,
    FLEX = 29,
    FLOW_ITEM = 30,
    FORM_COMPONENT = 31,
    FORM_LINK = 32,
    GAUGE = 33,
    GRID = 34,
    GRID_COL = 35,
    GRID_CONTAINER = 36,
    GRID_ITEM = 37,
    GRID_ROW = 38,
    HYPERLINK = 39,
    IMAGE = 40,
    IMAGE_ANIMATOR = 41,
    IMAGE_BITMAP = 42,
    IMAGE_DATA = 43,
    IMAGE_SPAN = 44,
    LABEL = 45,
    LINE = 46,
    LIST = 47,
    LIST_ITEM = 48,
    LIST_ITEM_GROUP = 49,
    LOADING_PROGRESS = 50,
    MARQUEE = 51,
    MATRIX2D = 52,
    MENU = 53,
    MENU_ITEM = 54,
    MENU_ITEM_GROUP = 55,
    NAV_DESTINATION = 56,
    NAV_ROUTER = 57,
    NAVIGATION = 58,
    NAVIGATION_BAR = 59,
    NAVIGATION_MENU = 60,
    NAVIGATOR = 61,
    OFFSCREEN_CANVAS = 62,
    OFFSCREEN_CANVAS_RENDERING_CONTEXT2D = 63,
    OPTION = 64,
    PANEL = 65,
    PAPER_PAGE = 66,
    PATH = 67,
    PATH2D = 68,
    PATTERN_LOCK = 69,
    PICKER = 70,
    PICKER_VIEW = 71,
    PLUGIN_COMPONENT = 72,
    POLYGON = 73,
    POLYLINE = 74,
    POPUP = 75,
    PROGRESS = 76,
    QRCODE = 77,
    RADIO = 78,
    RATING = 79,
    RECT = 80,
    REFRESH = 81,
    RELATIVE_CONTAINER = 82,
    REMOTE_WINDOW = 83,
    RICH_EDITOR = 84,
    RICH_TEXT = 85,
    ROLE_PAGER = 86,
    ROW = 87,
    ROW_SPLIT = 88,
    SCROLL = 89,
    SCROLL_BAR = 90,
    SEARCH = 91,
    SEARCH_FIELD = 92,
    SELECT = 93,
    SHAPE = 94,
    SIDEBAR_CONTAINER = 95,
    SLIDER = 96,
    SPAN = 97,
    STACK = 98,
    STEPPER = 99,
    STEPPER_ITEM = 100,
    SWIPER = 101,
    SWIPER_INDICATOR = 102,
    SWITCH = 103,
    SYMBOL_GLYPH = 104,
    TAB_CONTENT = 105,
    TAB_BAR = 106,
    TABS = 107,
    TEXT = 108,
    TEXT_CLOCK = 109,
    TEXT_ENTRY = 110,
    TEXT_INPUT = 111,
    TEXT_PICKER = 112,
    TEXT_TIMER = 113,
    TEXT_AREA = 114,
    TEXT_FIELD = 115,
    TIME_PICKER = 116,
    TITLE_BAR = 117,
    TOGGLER = 118,
    UI_EXTENSION_COMPONENT = 119,
    VIDEO = 120,
    WATER_FLOW = 121,
    WEB = 122,
    XCOMPONENT = 123,
    ROLE_NONE = 124
}
export type AccessibilityFocusCallback = (isFocus: boolean) => void;
export enum FinishCallbackType {
    REMOVED = 0,
    LOGICALLY = 1
}
export enum TouchTestStrategy {
    DEFAULT = 0,
    FORWARD_COMPETITION = 1,
    FORWARD = 2
}
export declare interface AnimateParam {
    duration?: number;
    tempo?: number;
    curve?: curves.Curve | string | curves.ICurve;
    delay?: number;
    iterations?: number;
    playMode?: PlayMode;
    onFinish?: (() => void);
    finishCallbackType?: FinishCallbackType;
    expectedFrameRateRange?: ExpectedFrameRateRange;
}
export type ICurve = curves.ICurve;
export declare interface MotionPathOptions {
    path: string;
    from?: number;
    to?: number;
    rotatable?: boolean;
}
export declare interface sharedTransitionOptions {
    duration?: number;
    curve?: curves.Curve | string | curves.ICurve;
    delay?: number;
    motionPath?: MotionPathOptions;
    zIndex?: number;
    type?: SharedTransitionEffectType;
}
export declare interface GeometryTransitionOptions {
    follow?: boolean;
    hierarchyStrategy?: TransitionHierarchyStrategy;
}
export declare interface LinearGradientOptions {
    angle?: number | string;
    direction?: GradientDirection;
    colors: Array<[ ResourceColor, number ]>;
    repeating?: boolean;
}
export enum TransitionHierarchyStrategy {
    NONE = 0,
    ADAPTIVE = 1
}
export declare interface SweepGradientOptions {
    center: [ Length, Length ];
    start?: number | string;
    end?: number | string;
    rotation?: number | string;
    colors: Array<[ ResourceColor, number ]>;
    repeating?: boolean;
}
export declare interface RadialGradientOptions {
    center: [ Length, Length ];
    radius: Length;
    colors: Array<[ ResourceColor, number ]>;
    repeating?: boolean;
}
export declare interface TranslateOptions {
    x?: number | string;
    y?: number | string;
    z?: number | string;
}
export declare interface ScaleOptions {
    x?: number;
    y?: number;
    z?: number;
    centerX?: number | string;
    centerY?: number | string;
}
export declare interface VerticalAlignParam {
    anchor: string;
    align: VerticalAlign;
}
export declare interface HorizontalAlignParam {
    anchor: string;
    align: HorizontalAlign;
}
export declare interface AlignRuleOption {
    _stub: int32;
}
export declare interface LocalizedHorizontalAlignParam {
    anchor: string;
    align: HorizontalAlign;
}
export declare interface LocalizedVerticalAlignParam {
    anchor: string;
    align: VerticalAlign;
}
export declare interface LocalizedAlignRuleOptions {
    start?: LocalizedHorizontalAlignParam;
    end?: LocalizedHorizontalAlignParam;
    middle?: LocalizedHorizontalAlignParam;
    top?: LocalizedVerticalAlignParam;
    bottom?: LocalizedVerticalAlignParam;
    center?: LocalizedVerticalAlignParam;
    bias?: Bias;
}
export enum ChainStyle {
    SPREAD = 0,
    SPREAD_INSIDE = 1,
    PACKED = 2
}
export declare interface RotateOptions {
    x?: number;
    y?: number;
    z?: number;
    centerX?: number | string;
    centerY?: number | string;
    centerZ?: number;
    perspective?: number;
    angle: number | string;
}
export enum TransitionEdge {
    TOP = 0,
    BOTTOM = 1,
    START = 2,
    END = 3
}
export declare interface AsymmetricTransitionOption {
    appear: TransitionEffect;
    disappear: TransitionEffect;
}
export declare class DrawModifier {
    constructor()
    drawBehind_callback: ((drawContext: DrawContext) => void);
    drawBehind(drawContext: DrawContext): void
    drawContent_callback: ((drawContext: DrawContext) => void);
    drawContent(drawContext: DrawContext): void
    invalidate(): void
}
export declare class TransitionEffect {
    constructor(type: string)
    constructor(effect: number)
    constructor(effect: TransitionEdge)
    constructor(effect: TranslateOptions)
    constructor(effect: RotateOptions)
    constructor(effect: ScaleOptions)
    constructor(effect: AsymmetricTransitionOption)
    get IDENTITY():TransitionEffect;
    get OPACITY():TransitionEffect;
    get SLIDE():TransitionEffect;
    get SLIDE_SWITCH():TransitionEffect;
    static translate(options: TranslateOptions): TransitionEffect
    static rotate(options: RotateOptions): TransitionEffect
    static scale(options: ScaleOptions): TransitionEffect
    static opacity(alpha: number): TransitionEffect
    static move(edge: TransitionEdge): TransitionEffect
    static asymmetric(appear: TransitionEffect, disappear: TransitionEffect): TransitionEffect
    animation(value: AnimateParam): TransitionEffect
    combine(transitionEffect: TransitionEffect): TransitionEffect
}
export declare interface ItemDragInfo {
    x: number;
    y: number;
}
export enum EffectType {
    DEFAULT = 0,
    WINDOW_EFFECT = 1
}
export enum PreDragStatus {
    ACTION_DETECTING_STATUS = 0,
    READY_TO_TRIGGER_DRAG_ACTION = 1,
    PREVIEW_LIFT_STARTED = 2,
    PREVIEW_LIFT_FINISHED = 3,
    PREVIEW_LANDING_STARTED = 4,
    PREVIEW_LANDING_FINISHED = 5,
    ACTION_CANCELED_BEFORE_DRAG = 6,
    PREPARING_FOR_DRAG_DETECTION = 7
}
export declare interface DragItemInfo {
    pixelMap?: image.PixelMap;
    builder?: CustomBuilder;
    extraInfo?: string;
}
export type PointerStyle = pointer.PointerStyle;
export declare interface EventTarget {
    area: Area;
    id?: string;
}
export enum SourceType {
    UNKNOWN = 0,
    Unknown = 0,
    MOUSE = 1,
    Mouse = 1,
    TOUCH_SCREEN = 2,
    TouchScreen = 2
}
export enum SourceTool {
    UNKNOWN = 0,
    Unknown = 0,
    FINGER = 1,
    Finger = 1,
    PEN = 2,
    Pen = 2,
    MOUSE = 3,
    TOUCHPAD = 4,
    JOYSTICK = 5
}
export enum RepeatMode {
    REPEAT = 0,
    Repeat = 0,
    STRETCH = 1,
    Stretch = 1,
    ROUND = 2,
    Round = 2,
    SPACE = 3,
    Space = 3
}
export enum BlurStyle {
    THIN = 0,
    Thin = 0,
    REGULAR = 1,
    Regular = 1,
    THICK = 2,
    Thick = 2,
    BACKGROUND_THIN = 3,
    BACKGROUND_REGULAR = 4,
    BACKGROUND_THICK = 5,
    BACKGROUND_ULTRA_THICK = 6,
    NONE = 7,
    COMPONENT_ULTRA_THIN = 8,
    COMPONENT_THIN = 9,
    COMPONENT_REGULAR = 10,
    COMPONENT_THICK = 11,
    COMPONENT_ULTRA_THICK = 12
}
export enum BlurStyleActivePolicy {
    FOLLOWS_WINDOW_ACTIVE_STATE = 0,
    ALWAYS_ACTIVE = 1,
    ALWAYS_INACTIVE = 2
}
export enum ThemeColorMode {
    SYSTEM = 0,
    LIGHT = 1,
    DARK = 2
}
export enum AdaptiveColor {
    DEFAULT = 0,
    AVERAGE = 1
}
export enum ModalTransition {
    DEFAULT = 0,
    NONE = 1,
    ALPHA = 2
}
export declare interface BackgroundBlurStyleOptions extends BlurStyleOptions {
    policy?: BlurStyleActivePolicy;
    inactiveColor?: ResourceColor;
}
export declare interface ForegroundBlurStyleOptions extends BlurStyleOptions {
}
export declare interface BlurOptions {
    grayscale: [ number, number ];
}
export declare interface SystemAdaptiveOptions {
    disableSystemAdaptation?: boolean;
}
export declare interface BlurStyleOptions {
    colorMode?: ThemeColorMode;
    adaptiveColor?: AdaptiveColor;
    scale?: number;
    blurOptions?: BlurOptions;
}
export declare interface BackgroundEffectOptions {
    radius: number;
    saturation?: number;
    brightness?: number;
    color?: ResourceColor;
    adaptiveColor?: AdaptiveColor;
    blurOptions?: BlurOptions;
    policy?: BlurStyleActivePolicy;
    inactiveColor?: ResourceColor;
}
export declare interface ForegroundEffectOptions {
    radius: number;
}
export declare interface PickerTextStyle {
    color?: ResourceColor;
    font?: Font;
}
export declare interface PickerDialogButtonStyle {
    type?: ButtonType;
    style?: ButtonStyleMode;
    role?: ButtonRole;
    fontSize?: Length;
    fontColor?: ResourceColor;
    fontWeight?: FontWeight | number | string;
    fontStyle?: FontStyle;
    fontFamily?: Resource | string;
    backgroundColor?: ResourceColor;
    borderRadius?: Length | BorderRadiuses;
    primary?: boolean;
}
export enum ShadowType {
    COLOR = 0,
    BLUR = 1
}
export declare interface ShadowOptions {
    radius: number | Resource;
    type?: ShadowType;
    color?: Color | string | Resource | ColoringStrategy;
    offsetX?: number | Resource;
    offsetY?: number | Resource;
    fill?: boolean;
}
export enum ShadowStyle {
    OUTER_DEFAULT_XS = 0,
    OUTER_DEFAULT_SM = 1,
    OUTER_DEFAULT_MD = 2,
    OUTER_DEFAULT_LG = 3,
    OUTER_FLOATING_SM = 4,
    OUTER_FLOATING_MD = 5
}
export declare interface MultiShadowOptions {
    radius?: number | Resource;
    offsetX?: number | Resource;
    offsetY?: number | Resource;
}
export enum SafeAreaType {
    SYSTEM = 0,
    CUTOUT = 1,
    KEYBOARD = 2
}
export enum SafeAreaEdge {
    TOP = 0,
    BOTTOM = 1,
    START = 2,
    END = 3
}
export enum LayoutSafeAreaType {
    SYSTEM = 0
}
export enum LayoutSafeAreaEdge {
    TOP = 0,
    BOTTOM = 1
}
export enum SheetSize {
    MEDIUM = 0,
    LARGE = 1,
    FIT_CONTENT = 2
}
export type ModifierKeyStateGetter = (keys: Array<string>) => boolean;
export declare interface BaseEvent {
    target: EventTarget;
    timestamp: number;
    source: SourceType;
    axisHorizontal?: number;
    axisVertical?: number;
    pressure: number;
    tiltX: number;
    tiltY: number;
    rollAngle?: number;
    sourceTool: SourceTool;
    getModifierKeyState?: ModifierKeyStateGetter;
    deviceId?: number;
    targetDisplayId?: number;
}
export declare interface BorderImageOption {
    slice?: Length | EdgeWidths | LocalizedEdgeWidths;
    repeat?: RepeatMode;
    source?: string | Resource | LinearGradientOptions;
    width?: Length | EdgeWidths | LocalizedEdgeWidths;
    outset?: Length | EdgeWidths | LocalizedEdgeWidths;
    fill?: boolean;
}
export declare class LayoutPolicy {
    constructor()
    static readonly matchParent: LayoutPolicy;
}
export declare interface ClickEvent extends BaseEvent {
    displayX: number;
    displayY: number;
    windowX: number;
    windowY: number;
    x: number;
    y: number;
    hand?: InteractionHand;
    preventDefault: (() => void);
}
export declare interface HoverEvent extends BaseEvent {
    x?: number;
    y?: number;
    windowX?: number;
    windowY?: number;
    displayX?: number;
    displayY?: number;
    stopPropagation: (() => void);
}
export declare interface MouseEvent extends BaseEvent {
    button: MouseButton;
    action: MouseAction;
    displayX: number;
    displayY: number;
    windowX: number;
    windowY: number;
    x: number;
    y: number;
    stopPropagation: (() => void);
    rawDeltaX?: number;
    rawDeltaY?: number;
    pressedButtons?: Array<MouseButton>;
}
export declare interface AccessibilityHoverEvent extends BaseEvent {
    type: AccessibilityHoverType;
    x: number;
    y: number;
    displayX: number;
    displayY: number;
    windowX: number;
    windowY: number;
}
export declare interface TouchObject {
    type: TouchType;
    id: number;
    displayX: number;
    displayY: number;
    windowX: number;
    windowY: number;
    x: number;
    y: number;
    hand?: InteractionHand;
    pressedTime?: number;
    pressure?: number;
    width?: number;
    height?: number;
}
export declare interface HistoricalPoint {
    touchObject: TouchObject;
    size: number;
    force: number;
    timestamp: number;
}
export declare interface TouchEvent extends BaseEvent {
    type: TouchType;
    touches: Array<TouchObject>;
    changedTouches: Array<TouchObject>;
    stopPropagation: (() => void);
    preventDefault: (() => void);
    getHistoricalPoints(): Array<HistoricalPoint>
}
export declare interface AxisEvent extends BaseEvent {
    action: AxisAction;
    displayX: number;
    displayY: number;
    windowX: number;
    windowY: number;
    x: number;
    y: number;
    scrollStep?: number;
    propagation: (() => void);
    getHorizontalAxisValue(): number
    getVerticalAxisValue(): number
}
export type SizeChangeCallback = (oldValue: SizeOptions, newValue: SizeOptions) => void;
export type GestureRecognizerJudgeBeginCallback = (event: BaseGestureEvent, current: GestureRecognizer, recognizers: Array<GestureRecognizer>) => GestureJudgeResult;
export type ShouldBuiltInRecognizerParallelWithCallback = (current: GestureRecognizer, others: Array<GestureRecognizer>) => GestureRecognizer;
export type TransitionFinishCallback = (transitionIn: boolean) => void;
export type PixelMap = image.PixelMap;
export declare interface PixelMapMock {
    release(): void
}
export enum DragBehavior {
    COPY = 0,
    MOVE = 1
}
export type UnifiedData = unifiedDataChannel.UnifiedData;
export type Summary = unifiedDataChannel.Summary;
export type UniformDataType = uniformTypeDescriptor.UniformDataType;
export enum DragResult {
    DRAG_SUCCESSFUL = 0,
    DRAG_FAILED = 1,
    DRAG_CANCELED = 2,
    DROP_ENABLED = 3,
    DROP_DISABLED = 4
}
export enum BlendMode {
    NONE = 0,
    CLEAR = 1,
    SRC = 2,
    DST = 3,
    SRC_OVER = 4,
    DST_OVER = 5,
    SRC_IN = 6,
    DST_IN = 7,
    SRC_OUT = 8,
    DST_OUT = 9,
    SRC_ATOP = 10,
    DST_ATOP = 11,
    XOR = 12,
    PLUS = 13,
    MODULATE = 14,
    SCREEN = 15,
    OVERLAY = 16,
    DARKEN = 17,
    LIGHTEN = 18,
    COLOR_DODGE = 19,
    COLOR_BURN = 20,
    HARD_LIGHT = 21,
    SOFT_LIGHT = 22,
    DIFFERENCE = 23,
    EXCLUSION = 24,
    MULTIPLY = 25,
    HUE = 26,
    SATURATION = 27,
    COLOR = 28,
    LUMINOSITY = 29
}
export enum BlendApplyType {
    FAST = 0,
    OFFSCREEN = 1
}
export declare interface DragEvent {
    dragBehavior: DragBehavior;
    useCustomDropAnimation: boolean;
    getModifierKeyState?: ModifierKeyStateGetter;
    getDisplayX(): number
    getDisplayY(): number
    getWindowX(): number
    getWindowY(): number
    setData(unifiedData: unifiedDataChannel.UnifiedData): void
    getData(): unifiedDataChannel.UnifiedData
    getSummary(): unifiedDataChannel.Summary
    setResult(dragResult: DragResult): void
    getResult(): DragResult
    getPreviewRect(): Rectangle
    getVelocityX(): number
    getVelocityY(): number
    getVelocity(): number
    executeDropAnimation(customDropAnimation: (() => void)): void
    enableInternalDropAnimation(configuration: string): void
}
export type OnDragEventCallback = (event: DragEvent, extraParams?: string) => void;
export declare interface DropOptions {
    disableDataPrefetch?: boolean;
}
export declare interface KeyEvent {
    type: KeyType;
    keyCode: number;
    keyText: string;
    keySource: KeySource;
    deviceId: number;
    metaKey: number;
    timestamp: number;
    stopPropagation: (() => void);
    intentionCode: IntentionCode;
    getModifierKeyState?: ModifierKeyStateGetter;
    unicode?: number;
}
export declare interface FocusAxisEvent extends BaseEvent {
    axisMap: Map<AxisModel, number>;
    stopPropagation: (() => void);
}
export declare interface CrownEvent {
    timestamp: number;
    angularVelocity: number;
    degree: number;
    action: CrownAction;
    stopPropagation: (() => void);
}
export declare interface BindOptions {
    backgroundColor?: ResourceColor;
    onAppear?: (() => void);
    onDisappear?: (() => void);
    onWillAppear?: (() => void);
    onWillDisappear?: (() => void);
}
export declare interface DismissContentCoverAction {
    dismiss: VoidCallback;
    reason: DismissReason;
}
export declare interface ContentCoverOptions extends BindOptions {
    modalTransition?: ModalTransition;
    onWillDismiss?: ((value0: DismissContentCoverAction) => void);
    transition?: TransitionEffect;
}
export declare interface SheetTitleOptions {
    title: ResourceStr;
    subtitle?: ResourceStr;
}
export enum SheetType {
    BOTTOM = 0,
    CENTER = 1,
    POPUP = 2
}
export enum SheetMode {
    OVERLAY = 0,
    EMBEDDED = 1
}
export enum ScrollSizeMode {
    FOLLOW_DETENT = 0,
    CONTINUOUS = 1
}
export enum SheetKeyboardAvoidMode {
    NONE = 0,
    TRANSLATE_AND_RESIZE = 1,
    RESIZE_ONLY = 2,
    TRANSLATE_AND_SCROLL = 3
}
export declare interface SheetDismiss {
    dismiss: VoidCallback;
}
export declare interface DismissSheetAction {
    dismiss: VoidCallback;
    reason: DismissReason;
}
export declare interface SpringBackAction {
    springBack: VoidCallback;
}
export type SingleLengthDetent = [
    SheetSize | Length
]
export type DoubleLengthDetents = [
    SheetSize | Length,
    SheetSize | Length | undefined
]
export type TripleLengthDetents = [
    SheetSize | Length,
    SheetSize | Length | undefined,
    SheetSize | Length | undefined
]
export declare interface SheetOptions extends BindOptions {
    height?: SheetSize | Length;
    dragBar?: boolean;
    maskColor?: ResourceColor;
    detents?: TripleLengthDetents;
    blurStyle?: BlurStyle;
    showClose?: boolean | Resource;
    preferType?: SheetType;
    title?: SheetTitleOptions | CustomBuilder;
    shouldDismiss?: ((sheetDismiss: SheetDismiss) => void);
    onWillDismiss?: ((value0: DismissSheetAction) => void);
    onWillSpringBackWhenDismiss?: ((value0: SpringBackAction) => void);
    enableOutsideInteractive?: boolean;
    width?: Dimension;
    borderWidth?: Dimension | EdgeWidths | LocalizedEdgeWidths;
    borderColor?: ResourceColor | EdgeColors | LocalizedEdgeColors;
    borderStyle?: BorderStyle | EdgeStyles;
    shadow?: ShadowOptions | ShadowStyle;
    onHeightDidChange?: ((value0: number) => void);
    mode?: SheetMode;
    scrollSizeMode?: ScrollSizeMode;
    onDetentsDidChange?: ((value0: number) => void);
    onWidthDidChange?: ((value0: number) => void);
    onTypeDidChange?: ((value0: SheetType) => void);
    uiContext?: UIContext;
    keyboardAvoidMode?: SheetKeyboardAvoidMode;
    enableHoverMode?: boolean;
    hoverModeArea?: HoverModeAreaType;
    offset?: Position;
    effectEdge?: number;
    radius?: LengthMetrics | BorderRadiuses | LocalizedBorderRadiuses;
    detentSelection?: SheetSize | Length;
    showInSubWindow?: boolean;
    placement?: Placement;
    placementOnTarget?: boolean;
}
export declare interface StateStyles {
    normal?: CustomStyles;
    pressed?: CustomStyles;
    disabled?: CustomStyles;
    focused?: CustomStyles;
    clicked?: CustomStyles;
    selected?: CustomStyles;
}
export declare interface PopupMessageOptions {
    textColor?: ResourceColor;
    font?: Font;
}
export enum DismissReason {
    PRESS_BACK = 0,
    TOUCH_OUTSIDE = 1,
    CLOSE_BUTTON = 2,
    SLIDE_DOWN = 3
}
export declare interface DismissPopupAction {
    reason: DismissReason;
    dismiss(): void
}
export declare interface PopupStateChangeParam {
    isVisible: boolean;
}
export type PopupStateChangeCallback = (event: PopupStateChangeParam) => void;
export declare interface PopupMaskType {
    color: ResourceColor;
}
export declare interface PopupCommonOptions {
    placement?: Placement;
    popupColor?: ResourceColor;
    enableArrow?: boolean;
    autoCancel?: boolean;
    onStateChange?: PopupStateChangeCallback;
    arrowOffset?: Length;
    showInSubWindow?: boolean;
    mask?: boolean | PopupMaskType;
    targetSpace?: Length;
    offset?: Position;
    width?: Dimension;
    arrowPointPosition?: ArrowPointPosition;
    arrowWidth?: Dimension;
    arrowHeight?: Dimension;
    radius?: Dimension;
    shadow?: ShadowOptions | ShadowStyle;
    backgroundBlurStyle?: BlurStyle;
    focusable?: boolean;
    transition?: TransitionEffect;
    onWillDismiss?: boolean | ((value0: DismissPopupAction) => void);
    enableHoverMode?: boolean;
    followTransformOfTarget?: boolean;
}
export declare interface TipsOptions {
    appearingTime?: number;
    disappearingTime?: number;
    appearingTimeWithContinuousOperation?: number;
    disappearingTimeWithContinuousOperation?: number;
    enableArrow?: boolean;
    arrowPointPosition?: ArrowPointPosition;
    arrowWidth?: Dimension;
    arrowHeight?: Dimension;
}
export declare interface PopupButton {
    value: string;
    action: VoidCallback;
}
export declare interface PopupOptions {
    message: string;
    placement?: Placement;
    primaryButton?: PopupButton;
    secondaryButton?: PopupButton;
    onStateChange?: PopupStateChangeCallback;
    arrowOffset?: Length;
    showInSubWindow?: boolean;
    mask?: boolean | PopupMaskType;
    messageOptions?: PopupMessageOptions;
    targetSpace?: Length;
    enableArrow?: boolean;
    offset?: Position;
    popupColor?: Color | string | Resource | number;
    autoCancel?: boolean;
    width?: Dimension;
    arrowPointPosition?: ArrowPointPosition;
    arrowWidth?: Dimension;
    arrowHeight?: Dimension;
    radius?: Dimension;
    shadow?: ShadowOptions | ShadowStyle;
    backgroundBlurStyle?: BlurStyle;
    transition?: TransitionEffect;
    onWillDismiss?: boolean | ((value0: DismissPopupAction) => void);
    enableHoverMode?: boolean;
    followTransformOfTarget?: boolean;
    keyboardAvoidMode?: KeyboardAvoidMode;
}
export declare interface CustomPopupOptions {
    builder: CustomBuilder;
    placement?: Placement;
    popupColor?: Color | string | Resource | number;
    enableArrow?: boolean;
    autoCancel?: boolean;
    onStateChange?: PopupStateChangeCallback;
    arrowOffset?: Length;
    showInSubWindow?: boolean;
    mask?: boolean | PopupMaskType;
    targetSpace?: Length;
    offset?: Position;
    width?: Dimension;
    arrowPointPosition?: ArrowPointPosition;
    arrowWidth?: Dimension;
    arrowHeight?: Dimension;
    radius?: Dimension;
    shadow?: ShadowOptions | ShadowStyle;
    backgroundBlurStyle?: BlurStyle;
    focusable?: boolean;
    transition?: TransitionEffect;
    onWillDismiss?: boolean | ((value0: DismissPopupAction) => void);
    enableHoverMode?: boolean;
    followTransformOfTarget?: boolean;
    keyboardAvoidMode?: KeyboardAvoidMode;
}
export enum MenuPreviewMode {
    NONE = 0,
    IMAGE = 1
}
export type AnimationNumberRange = [
    number,
    number
]
export declare interface ContextMenuAnimationOptions {
    scale?: AnimationNumberRange;
    transition?: TransitionEffect;
    hoverScale?: AnimationNumberRange;
}
export type BorderRadiusType = Length | BorderRadiuses | LocalizedBorderRadiuses;
export enum HapticFeedbackMode {
    DISABLED = 0,
    ENABLED = 1,
    AUTO = 2
}
export declare interface ContextMenuOptions {
    offset?: Position;
    placement?: Placement;
    enableArrow?: boolean;
    arrowOffset?: Length;
    preview?: MenuPreviewMode | CustomBuilder;
    previewBorderRadius?: BorderRadiusType;
    borderRadius?: Length | BorderRadiuses | LocalizedBorderRadiuses;
    onAppear?: (() => void);
    onDisappear?: (() => void);
    aboutToAppear?: (() => void);
    aboutToDisappear?: (() => void);
    layoutRegionMargin?: Padding;
    previewAnimationOptions?: ContextMenuAnimationOptions;
    backgroundColor?: ResourceColor;
    backgroundBlurStyle?: BlurStyle;
    backgroundBlurStyleOptions?: BackgroundBlurStyleOptions;
    backgroundEffect?: BackgroundEffectOptions;
    transition?: TransitionEffect;
    enableHoverMode?: boolean;
    outlineColor?: ResourceColor | EdgeColors;
    outlineWidth?: Dimension | EdgeOutlineWidths;
    hapticFeedbackMode?: HapticFeedbackMode;
}
export declare interface MenuOptions extends ContextMenuOptions {
    title?: ResourceStr;
    showInSubWindow?: boolean;
}
export declare class ProgressMask {
    constructor(value: number, total: number, color: ResourceColor)
    updateProgress(value: number): void
    updateColor(value: ResourceColor): void
    enableBreathingAnimation(value: boolean): void
}
export declare interface TouchTestInfo {
    windowX: number;
    windowY: number;
    parentX: number;
    parentY: number;
    x: number;
    y: number;
    rect: RectResult;
    id: string;
}
export declare interface TouchResult {
    strategy: TouchTestStrategy;
    id?: string | undefined;
}
export declare interface PixelStretchEffectOptions {
    top?: Length;
    bottom?: Length;
    left?: Length;
    right?: Length;
}
export declare interface ClickEffect {
    level: ClickEffectLevel;
    scale?: number;
}
export declare interface FadingEdgeOptions {
    fadingEdgeLength?: LengthMetrics;
}
export declare interface NestedScrollOptions {
    scrollForward: NestedScrollMode;
    scrollBackward: NestedScrollMode;
}
export declare interface MenuElement {
    value: ResourceStr;
    icon?: ResourceStr;
    symbolIcon?: SymbolGlyphModifier;
    enabled?: boolean;
    action: (() => void);
}
export declare interface CommonConfiguration<T = void> {
    enabled: boolean;
    contentModifier: ContentModifier<T>;
}
export enum OutlineStyle {
    SOLID = 0,
    DASHED = 1,
    DOTTED = 2
}
export enum DragPreviewMode {
    AUTO = 1,
    DISABLE_SCALE = 2,
    ENABLE_DEFAULT_SHADOW = 3,
    ENABLE_DEFAULT_RADIUS = 4,
    ENABLE_DRAG_ITEM_GRAY_EFFECT = 5,
    ENABLE_MULTI_TILE_EFFECT = 6,
    ENABLE_TOUCH_POINT_CALCULATION_BASED_ON_FINAL_PREVIEW = 7
}
export enum DraggingSizeChangeEffect {
    DEFAULT = 0,
    SIZE_TRANSITION = 1,
    SIZE_CONTENT_TRANSITION = 2
}
export enum MenuPolicy {
    DEFAULT = 0,
    HIDE = 1,
    SHOW = 2
}
export declare interface DragPreviewOptions {
    mode?: DragPreviewMode | Array<DragPreviewMode>;
    numberBadge?: boolean | number;
    sizeChangeEffect?: DraggingSizeChangeEffect;
}
export declare interface DragInteractionOptions {
    isMultiSelectionEnabled?: boolean;
    defaultAnimationBeforeLifting?: boolean;
    enableEdgeAutoScroll?: boolean;
    enableHapticFeedback?: boolean;
    isLiftingDisabled?: boolean;
}
export declare interface PreviewConfiguration {
    onlyForLifting?: boolean;
    delayCreating?: boolean;
}
export declare interface InvertOptions {
    low: number;
    high: number;
    threshold: number;
    thresholdRange: number;
}
export type TipsMessageType = ResourceStr | StyledString;
export declare interface BackgroundImageOptions {
    syncLoad?: boolean;
    repeat?: ImageRepeat;
}
export declare interface BackgroundOptions {
    align?: Alignment;
}
export type CustomProperty = Object | undefined;
export interface CommonMethod {
    width(value: Length | LayoutPolicy | undefined): this {
        throw new Error("Unimplemented method width")
    }
    height(value: Length | LayoutPolicy | undefined): this {
        throw new Error("Unimplemented method height")
    }
    drawModifier(value: DrawModifier | undefined): this {
        throw new Error("Unimplemented method drawModifier")
    }
    responseRegion(value: Array<Rectangle> | Rectangle | undefined): this {
        throw new Error("Unimplemented method responseRegion")
    }
    mouseResponseRegion(value: Array<Rectangle> | Rectangle | undefined): this {
        throw new Error("Unimplemented method mouseResponseRegion")
    }
    size(value: SizeOptions | undefined): this {
        throw new Error("Unimplemented method size")
    }
    constraintSize(value: ConstraintSizeOptions | undefined): this {
        throw new Error("Unimplemented method constraintSize")
    }
    hitTestBehavior(value: HitTestMode | undefined): this {
        throw new Error("Unimplemented method hitTestBehavior")
    }
    onChildTouchTest(value: ((value: Array<TouchTestInfo>) => TouchResult) | undefined): this {
        throw new Error("Unimplemented method onChildTouchTest")
    }
    layoutWeight(value: number | string | undefined): this {
        throw new Error("Unimplemented method layoutWeight")
    }
    chainWeight(value: ChainWeightOptions | undefined): this {
        throw new Error("Unimplemented method chainWeight")
    }
    padding(value: Padding | Length | LocalizedPadding | undefined): this {
        throw new Error("Unimplemented method padding")
    }
    safeAreaPadding(value: Padding | LengthMetrics | LocalizedPadding | undefined): this {
        throw new Error("Unimplemented method safeAreaPadding")
    }
    margin(value: Padding | Length | LocalizedPadding | undefined): this {
        throw new Error("Unimplemented method margin")
    }
    backgroundColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method backgroundColor")
    }
    pixelRound(value: PixelRoundPolicy | undefined): this {
        throw new Error("Unimplemented method pixelRound")
    }
    backgroundImageSize(value: SizeOptions | ImageSize | undefined): this {
        throw new Error("Unimplemented method backgroundImageSize")
    }
    backgroundImagePosition(value: Position | Alignment | undefined): this {
        throw new Error("Unimplemented method backgroundImagePosition")
    }
    backgroundEffect(value: BackgroundEffectOptions | undefined): this {
        throw new Error("Unimplemented method backgroundEffect")
    }
    backgroundImageResizable(value: ResizableOptions | undefined): this {
        throw new Error("Unimplemented method backgroundImageResizable")
    }
    foregroundEffect(value: ForegroundEffectOptions | undefined): this {
        throw new Error("Unimplemented method foregroundEffect")
    }
    visualEffect(value: uiEffect.VisualEffect | undefined): this {
        throw new Error("Unimplemented method visualEffect")
    }
    backgroundFilter(value: uiEffect.Filter | undefined): this {
        throw new Error("Unimplemented method backgroundFilter")
    }
    foregroundFilter(value: uiEffect.Filter | undefined): this {
        throw new Error("Unimplemented method foregroundFilter")
    }
    compositingFilter(value: uiEffect.Filter | undefined): this {
        throw new Error("Unimplemented method compositingFilter")
    }
    opacity(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method opacity")
    }
    border(value: BorderOptions | undefined): this {
        throw new Error("Unimplemented method border")
    }
    borderStyle(value: BorderStyle | EdgeStyles | undefined): this {
        throw new Error("Unimplemented method borderStyle")
    }
    borderWidth(value: Length | EdgeWidths | LocalizedEdgeWidths | undefined): this {
        throw new Error("Unimplemented method borderWidth")
    }
    borderColor(value: ResourceColor | EdgeColors | LocalizedEdgeColors | undefined): this {
        throw new Error("Unimplemented method borderColor")
    }
    borderRadius(value: Length | BorderRadiuses | LocalizedBorderRadiuses | undefined): this {
        throw new Error("Unimplemented method borderRadius")
    }
    borderImage(value: BorderImageOption | undefined): this {
        throw new Error("Unimplemented method borderImage")
    }
    outline(value: OutlineOptions | undefined): this {
        throw new Error("Unimplemented method outline")
    }
    outlineStyle(value: OutlineStyle | EdgeOutlineStyles | undefined): this {
        throw new Error("Unimplemented method outlineStyle")
    }
    outlineWidth(value: Dimension | EdgeOutlineWidths | undefined): this {
        throw new Error("Unimplemented method outlineWidth")
    }
    outlineColor(value: ResourceColor | EdgeColors | LocalizedEdgeColors | undefined): this {
        throw new Error("Unimplemented method outlineColor")
    }
    outlineRadius(value: Dimension | OutlineRadiuses | undefined): this {
        throw new Error("Unimplemented method outlineRadius")
    }
    foregroundColor(value: ResourceColor | ColoringStrategy | undefined): this {
        throw new Error("Unimplemented method foregroundColor")
    }
    onClick(value: ((event: ClickEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onClick")
    }
    onHover(value: ((isHover: boolean,event: HoverEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onHover")
    }
    onHoverMove(value: ((value0: HoverEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onHoverMove")
    }
    onAccessibilityHover(value: AccessibilityCallback | undefined): this {
        throw new Error("Unimplemented method onAccessibilityHover")
    }
    hoverEffect(value: HoverEffect | undefined): this {
        throw new Error("Unimplemented method hoverEffect")
    }
    onMouse(value: ((event: MouseEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onMouse")
    }
    onTouch(value: ((event: TouchEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onTouch")
    }
    onKeyEvent(value: ((event: KeyEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onKeyEvent")
    }
    onDigitalCrown(value: ((value0: CrownEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onDigitalCrown")
    }
    onKeyPreIme(value: ((value0: KeyEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onKeyPreIme")
    }
    onKeyEventDispatch(value: ((value0: KeyEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onKeyEventDispatch")
    }
    onFocusAxisEvent(value: ((value0: FocusAxisEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onFocusAxisEvent")
    }
    onAxisEvent(value: ((value0: AxisEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onAxisEvent")
    }
    focusable(value: boolean | undefined): this {
        throw new Error("Unimplemented method focusable")
    }
    nextFocus(value: FocusMovement | undefined): this {
        throw new Error("Unimplemented method nextFocus")
    }
    tabStop(value: boolean | undefined): this {
        throw new Error("Unimplemented method tabStop")
    }
    onFocus(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onFocus")
    }
    onBlur(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onBlur")
    }
    tabIndex(value: number | undefined): this {
        throw new Error("Unimplemented method tabIndex")
    }
    defaultFocus(value: boolean | undefined): this {
        throw new Error("Unimplemented method defaultFocus")
    }
    groupDefaultFocus(value: boolean | undefined): this {
        throw new Error("Unimplemented method groupDefaultFocus")
    }
    focusOnTouch(value: boolean | undefined): this {
        throw new Error("Unimplemented method focusOnTouch")
    }
    focusBox(value: FocusBoxStyle | undefined): this {
        throw new Error("Unimplemented method focusBox")
    }
    animation(value: AnimateParam | undefined): this {
        throw new Error("Unimplemented method animation")
    }
    transition(value: TransitionEffect | undefined): this {
        throw new Error("Unimplemented method transition")
    }
    motionBlur(value: MotionBlurOptions | undefined): this {
        throw new Error("Unimplemented method motionBlur")
    }
    brightness(value: number | undefined): this {
        throw new Error("Unimplemented method brightness")
    }
    contrast(value: number | undefined): this {
        throw new Error("Unimplemented method contrast")
    }
    grayscale(value: number | undefined): this {
        throw new Error("Unimplemented method grayscale")
    }
    colorBlend(value: Color | string | Resource | undefined): this {
        throw new Error("Unimplemented method colorBlend")
    }
    saturate(value: number | undefined): this {
        throw new Error("Unimplemented method saturate")
    }
    sepia(value: number | undefined): this {
        throw new Error("Unimplemented method sepia")
    }
    invert(value: number | InvertOptions | undefined): this {
        throw new Error("Unimplemented method invert")
    }
    hueRotate(value: number | string | undefined): this {
        throw new Error("Unimplemented method hueRotate")
    }
    useShadowBatching(value: boolean | undefined): this {
        throw new Error("Unimplemented method useShadowBatching")
    }
    useEffect(value: boolean | undefined): this {
        throw new Error("Unimplemented method useEffect")
    }
    renderGroup(value: boolean | undefined): this {
        throw new Error("Unimplemented method renderGroup")
    }
    freeze(value: boolean | undefined): this {
        throw new Error("Unimplemented method freeze")
    }
    translate(value: TranslateOptions | undefined): this {
        throw new Error("Unimplemented method translate")
    }
    scale(value: ScaleOptions | undefined): this {
        throw new Error("Unimplemented method scale")
    }
    rotate(value: RotateOptions | undefined): this {
        throw new Error("Unimplemented method rotate")
    }
    transform(value: Object | undefined): this {
        throw new Error("Unimplemented method transform")
    }
    onAppear(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onAppear")
    }
    onDisAppear(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onDisAppear")
    }
    onAttach(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onAttach")
    }
    onDetach(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onDetach")
    }
    onAreaChange(value: ((oldValue: Area,newValue: Area) => void) | undefined): this {
        throw new Error("Unimplemented method onAreaChange")
    }
    visibility(value: Visibility | undefined): this {
        throw new Error("Unimplemented method visibility")
    }
    flexGrow(value: number | undefined): this {
        throw new Error("Unimplemented method flexGrow")
    }
    flexShrink(value: number | undefined): this {
        throw new Error("Unimplemented method flexShrink")
    }
    flexBasis(value: number | string | undefined): this {
        throw new Error("Unimplemented method flexBasis")
    }
    alignSelf(value: ItemAlign | undefined): this {
        throw new Error("Unimplemented method alignSelf")
    }
    displayPriority(value: number | undefined): this {
        throw new Error("Unimplemented method displayPriority")
    }
    zIndex(value: number | undefined): this {
        throw new Error("Unimplemented method zIndex")
    }
    direction(value: Direction | undefined): this {
        throw new Error("Unimplemented method direction")
    }
    align(value: Alignment | undefined): this {
        throw new Error("Unimplemented method align")
    }
    position(value: Position | Edges | LocalizedEdges | undefined): this {
        throw new Error("Unimplemented method position")
    }
    markAnchor(value: Position | LocalizedPosition | undefined): this {
        throw new Error("Unimplemented method markAnchor")
    }
    offset(value: Position | Edges | LocalizedEdges | undefined): this {
        throw new Error("Unimplemented method offset")
    }
    enabled(value: boolean | undefined): this {
        throw new Error("Unimplemented method enabled")
    }
    alignRulesWithAlignRuleOptionTypedValue(value: AlignRuleOption | undefined): this {
        throw new Error("Unimplemented method alignRules")
    }
    alignRulesWithLocalizedAlignRuleOptionsTypedValue(value: LocalizedAlignRuleOptions | undefined): this {
        throw new Error("Unimplemented method alignRules")
    }
    aspectRatio(value: number | undefined): this {
        throw new Error("Unimplemented method aspectRatio")
    }
    clickEffect(value: ClickEffect | undefined): this {
        throw new Error("Unimplemented method clickEffect")
    }
    onDragStart(value: ((event: DragEvent,extraParams?: string) => CustomBuilder | DragItemInfo) | undefined): this {
        throw new Error("Unimplemented method onDragStart")
    }
    onDragEnter(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        throw new Error("Unimplemented method onDragEnter")
    }
    onDragMove(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        throw new Error("Unimplemented method onDragMove")
    }
    onDragLeave(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        throw new Error("Unimplemented method onDragLeave")
    }
    onDrop(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        throw new Error("Unimplemented method onDrop")
    }
    onDragEnd(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        throw new Error("Unimplemented method onDragEnd")
    }
    allowDrop(value: Array<uniformTypeDescriptor.UniformDataType> | undefined): this {
        throw new Error("Unimplemented method allowDrop")
    }
    draggable(value: boolean | undefined): this {
        throw new Error("Unimplemented method draggable")
    }
    dragPreview(value: CustomBuilder | DragItemInfo | string | undefined): this {
        throw new Error("Unimplemented method dragPreview")
    }
    onPreDrag(value: ((value0: PreDragStatus) => void) | undefined): this {
        throw new Error("Unimplemented method onPreDrag")
    }
    linearGradient(value: LinearGradientOptions | undefined): this {
        throw new Error("Unimplemented method linearGradient")
    }
    sweepGradient(value: SweepGradientOptions | undefined): this {
        throw new Error("Unimplemented method sweepGradient")
    }
    radialGradient(value: RadialGradientOptions | undefined): this {
        throw new Error("Unimplemented method radialGradient")
    }
    motionPath(value: MotionPathOptions | undefined): this {
        throw new Error("Unimplemented method motionPath")
    }
    shadow(value: ShadowOptions | ShadowStyle | undefined): this {
        throw new Error("Unimplemented method shadow")
    }
    clip(value: boolean | undefined): this {
        throw new Error("Unimplemented method clip")
    }
    clipShape(value: CircleShape | EllipseShape | PathShape | RectShape | undefined): this {
        throw new Error("Unimplemented method clipShape")
    }
    mask(value: ProgressMask | undefined): this {
        throw new Error("Unimplemented method mask")
    }
    maskShape(value: CircleShape | EllipseShape | PathShape | RectShape | undefined): this {
        throw new Error("Unimplemented method maskShape")
    }
    key(value: string | undefined): this {
        throw new Error("Unimplemented method key")
    }
    id(value: string | undefined): this {
        throw new Error("Unimplemented method id")
    }
    geometryTransition(value: string | undefined): this {
        throw new Error("Unimplemented method geometryTransition")
    }
    stateStyles(value: StateStyles | undefined): this {
        throw new Error("Unimplemented method stateStyles")
    }
    restoreId(value: number | undefined): this {
        throw new Error("Unimplemented method restoreId")
    }
    sphericalEffect(value: number | undefined): this {
        throw new Error("Unimplemented method sphericalEffect")
    }
    lightUpEffect(value: number | undefined): this {
        throw new Error("Unimplemented method lightUpEffect")
    }
    pixelStretchEffect(value: PixelStretchEffectOptions | undefined): this {
        throw new Error("Unimplemented method pixelStretchEffect")
    }
    accessibilityGroupWithValue(value: boolean | undefined): this {
        throw new Error("Unimplemented method accessibilityGroup")
    }
    accessibilityTextOfStringType(value: string | undefined): this {
        throw new Error("Unimplemented method accessibilityText")
    }
    accessibilityNextFocusId(value: string | undefined): this {
        throw new Error("Unimplemented method accessibilityNextFocusId")
    }
    accessibilityDefaultFocus(value: boolean | undefined): this {
        throw new Error("Unimplemented method accessibilityDefaultFocus")
    }
    accessibilityUseSamePage(value: AccessibilitySamePageMode | undefined): this {
        throw new Error("Unimplemented method accessibilityUseSamePage")
    }
    accessibilityScrollTriggerable(value: boolean | undefined): this {
        throw new Error("Unimplemented method accessibilityScrollTriggerable")
    }
    accessibilityTextOfResourceType(value: Resource | undefined): this {
        throw new Error("Unimplemented method accessibilityText")
    }
    accessibilityRole(value: AccessibilityRoleType | undefined): this {
        throw new Error("Unimplemented method accessibilityRole")
    }
    onAccessibilityFocus(value: AccessibilityFocusCallback | undefined): this {
        throw new Error("Unimplemented method onAccessibilityFocus")
    }
    accessibilityTextHint(value: string | undefined): this {
        throw new Error("Unimplemented method accessibilityTextHint")
    }
    accessibilityDescriptionOfStringType(value: string | undefined): this {
        throw new Error("Unimplemented method accessibilityDescription")
    }
    accessibilityDescriptionOfResourceType(value: Resource | undefined): this {
        throw new Error("Unimplemented method accessibilityDescription")
    }
    accessibilityLevel(value: string | undefined): this {
        throw new Error("Unimplemented method accessibilityLevel")
    }
    accessibilityVirtualNode(value: CustomBuilder | undefined): this {
        throw new Error("Unimplemented method accessibilityVirtualNode")
    }
    accessibilityChecked(value: boolean | undefined): this {
        throw new Error("Unimplemented method accessibilityChecked")
    }
    accessibilitySelected(value: boolean | undefined): this {
        throw new Error("Unimplemented method accessibilitySelected")
    }
    obscured(value: Array<ObscuredReasons> | undefined): this {
        throw new Error("Unimplemented method obscured")
    }
    reuseId(value: string | undefined): this {
        throw new Error("Unimplemented method reuseId")
    }
    reuse(value: ReuseOptions | undefined): this {
        throw new Error("Unimplemented method reuse")
    }
    renderFit(value: RenderFit | undefined): this {
        throw new Error("Unimplemented method renderFit")
    }
    gestureModifier(value: GestureModifier | undefined): this {
        throw new Error("Unimplemented method gestureModifier")
    }
    backgroundBrightness(value: BackgroundBrightnessOptions | undefined): this {
        throw new Error("Unimplemented method backgroundBrightness")
    }
    onGestureJudgeBegin(value: ((gestureInfo: GestureInfo,event: BaseGestureEvent) => GestureJudgeResult) | undefined): this {
        throw new Error("Unimplemented method onGestureJudgeBegin")
    }
    onGestureRecognizerJudgeBegin(value: GestureRecognizerJudgeBeginCallback | undefined): this {
        throw new Error("Unimplemented method onGestureRecognizerJudgeBegin")
    }
    shouldBuiltInRecognizerParallelWith(value: ShouldBuiltInRecognizerParallelWithCallback | undefined): this {
        throw new Error("Unimplemented method shouldBuiltInRecognizerParallelWith")
    }
    monopolizeEvents(value: boolean | undefined): this {
        throw new Error("Unimplemented method monopolizeEvents")
    }
    onTouchIntercept(value: ((value0: TouchEvent) => HitTestMode) | undefined): this {
        throw new Error("Unimplemented method onTouchIntercept")
    }
    onSizeChange(value: SizeChangeCallback | undefined): this {
        throw new Error("Unimplemented method onSizeChange")
    }
    accessibilityFocusDrawLevel(value: FocusDrawLevel | undefined): this {
        throw new Error("Unimplemented method accessibilityFocusDrawLevel")
    }
    customProperty(name: string, value: CustomProperty): this {
        throw new Error("Unimplemented method customProperty")
    }
    expandSafeArea(types?: Array<SafeAreaType>, edges?: Array<SafeAreaEdge>): this {
        throw new Error("Unimplemented method expandSafeArea")
    }
    background(builder: CustomBuilder | undefined, options?: BackgroundOptions): this {
        throw new Error("Unimplemented method background")
    }
    backgroundImage(src: ResourceStr | image.PixelMap | undefined, repeat?: ImageRepeat): this {
        throw new Error("Unimplemented method backgroundImage")
    }
    backgroundImage(src: ResourceStr | image.PixelMap | undefined, options?: BackgroundImageOptions): this {
        throw new Error("Unimplemented method backgroundImage")
    }
    backgroundBlurStyle(style: BlurStyle | undefined, options?: BackgroundBlurStyleOptions, sysOptions?: SystemAdaptiveOptions): this {
        throw new Error("Unimplemented method backgroundBlurStyle")
    }
    backgroundEffect(options: BackgroundEffectOptions | undefined, sysOptions?: SystemAdaptiveOptions): this {
        throw new Error("Unimplemented method backgroundEffect")
    }
    foregroundBlurStyle(style: BlurStyle | undefined, options?: ForegroundBlurStyleOptions, sysOptions?: SystemAdaptiveOptions): this {
        throw new Error("Unimplemented method foregroundBlurStyle")
    }
    onClick(event: ((event: ClickEvent) => void) | undefined, distanceThreshold: number | undefined): this {
        throw new Error("Unimplemented method onClick")
    }
    focusScopeId(id: string | undefined, isGroup?: boolean, arrowStepOut?: boolean): this {
        throw new Error("Unimplemented method focusScopeId")
    }
    focusScopePriority(scopeId: string | undefined, priority?: FocusPriority): this {
        throw new Error("Unimplemented method focusScopePriority")
    }
    transition(effect: TransitionEffect | undefined, onFinish: TransitionFinishCallback | undefined): this {
        throw new Error("Unimplemented method transition")
    }
    gesture(gesture: GestureType | undefined, mask?: GestureMask): this {
        throw new Error("Unimplemented method gesture")
    }
    priorityGesture(gesture: GestureType | undefined, mask?: GestureMask): this {
        throw new Error("Unimplemented method priorityGesture")
    }
    parallelGesture(gesture: GestureType | undefined, mask?: GestureMask): this {
        throw new Error("Unimplemented method parallelGesture")
    }
    blur(blurRadius: number | undefined, options?: BlurOptions, sysOptions?: SystemAdaptiveOptions): this {
        throw new Error("Unimplemented method blur")
    }
    linearGradientBlur(value: number | undefined, options: LinearGradientBlurOptions | undefined): this {
        throw new Error("Unimplemented method linearGradientBlur")
    }
    systemBarEffect(): this {
        throw new Error("Unimplemented method systemBarEffect")
    }
    useEffect(useEffect: boolean | undefined, effectType: EffectType | undefined): this {
        throw new Error("Unimplemented method useEffect")
    }
    backdropBlur(radius: number | undefined, options?: BlurOptions, sysOptions?: SystemAdaptiveOptions): this {
        throw new Error("Unimplemented method backdropBlur")
    }
    sharedTransition(id: string | undefined, options?: sharedTransitionOptions): this {
        throw new Error("Unimplemented method sharedTransition")
    }
    chainMode(direction: Axis | undefined, style: ChainStyle | undefined): this {
        throw new Error("Unimplemented method chainMode")
    }
    onDrop(eventCallback: OnDragEventCallback | undefined, dropOptions?: DropOptions): this {
        throw new Error("Unimplemented method onDrop")
    }
    dragPreview(preview: CustomBuilder | DragItemInfo | string | undefined, config?: PreviewConfiguration): this {
        throw new Error("Unimplemented method dragPreview")
    }
    dragPreviewOptions(value: DragPreviewOptions | undefined, options?: DragInteractionOptions): this {
        throw new Error("Unimplemented method dragPreviewOptions")
    }
    overlay(value: string | CustomBuilder | ComponentContent | undefined, options?: OverlayOptions): this {
        throw new Error("Unimplemented method overlay")
    }
    blendMode(value: BlendMode | undefined, type?: BlendApplyType): this {
        throw new Error("Unimplemented method blendMode")
    }
    advancedBlendMode(effect: BlendMode | uiEffect.Blender, type?: BlendApplyType): this {
        throw new Error("Unimplemented method advancedBlendMode")
    }
    geometryTransition(id: string | undefined, options?: GeometryTransitionOptions): this {
        throw new Error("Unimplemented method geometryTransition")
    }
    bindTips(message: TipsMessageType | undefined, options?: TipsOptions): this {
        throw new Error("Unimplemented method bindTips")
    }
    bindPopup(show: boolean | undefined, popup: PopupOptions | CustomPopupOptions | undefined): this {
        throw new Error("Unimplemented method bindPopup")
    }
    bindMenu(content: Array<MenuElement> | CustomBuilder | undefined, options?: MenuOptions): this {
        throw new Error("Unimplemented method bindMenu")
    }
    bindMenu(isShow: boolean | undefined, content: Array<MenuElement> | CustomBuilder | undefined, options?: MenuOptions): this {
        throw new Error("Unimplemented method bindMenu")
    }
    bindContextMenu(content: CustomBuilder | undefined, responseType: ResponseType | undefined, options?: ContextMenuOptions): this {
        throw new Error("Unimplemented method bindContextMenu")
    }
    bindContextMenu(isShown: boolean | undefined, content: CustomBuilder | undefined, options?: ContextMenuOptions): this {
        throw new Error("Unimplemented method bindContextMenu")
    }
    bindContentCover(isShow: boolean | Bindable<boolean> | undefined, builder: CustomBuilder | undefined, type?: ModalTransition): this {
        throw new Error("Unimplemented method bindContentCover")
    }
    bindContentCover(isShow: boolean | Bindable<boolean> | undefined, builder: CustomBuilder | undefined, options?: ContentCoverOptions): this {
        throw new Error("Unimplemented method bindContentCover")
    }
    bindSheet(isShow: boolean | Bindable<boolean> | undefined, builder: CustomBuilder | undefined, options?: SheetOptions): this {
        throw new Error("Unimplemented method bindSheet")
    }
    onVisibleAreaChange(ratios: Array<number> | undefined, event: VisibleAreaChangeCallback | undefined): this {
        throw new Error("Unimplemented method onVisibleAreaChange")
    }
    onVisibleAreaApproximateChange(options: VisibleAreaEventOptions | undefined, event: VisibleAreaChangeCallback | undefined): this {
        throw new Error("Unimplemented method onVisibleAreaApproximateChange")
    }
    keyboardShortcut(value: string | FunctionKey | undefined, keys: Array<ModifierKey> | undefined, action?: (() => void)): this {
        throw new Error("Unimplemented method keyboardShortcut")
    }
    accessibilityGroupWithConfig(isGroup: boolean | undefined, config: AccessibilityOptions | undefined): this {
        throw new Error("Unimplemented method accessibilityGroup")
    }
    onGestureRecognizerJudgeBegin(callback_: GestureRecognizerJudgeBeginCallback | undefined, exposeInnerGesture: boolean | undefined): this {
        throw new Error("Unimplemented method onGestureRecognizerJudgeBegin")
    }
    overload alignRules { alignRulesWithAlignRuleOptionTypedValue, alignRulesWithLocalizedAlignRuleOptionsTypedValue }
    overload accessibilityGroup { accessibilityGroupWithValue, accessibilityGroupWithConfig }
    overload accessibilityText { accessibilityTextOfStringType, accessibilityTextOfResourceType }
    overload accessibilityDescription { accessibilityDescriptionOfStringType, accessibilityDescriptionOfResourceType }
    attributeModifier(value: AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCommonMethodStyle implements CommonMethod {
    width_value?: Length | LayoutPolicy | undefined
    height_value?: Length | LayoutPolicy | undefined
    drawModifier_value?: DrawModifier | undefined
    responseRegion_value?: Array<Rectangle> | Rectangle | undefined
    mouseResponseRegion_value?: Array<Rectangle> | Rectangle | undefined
    size_value?: SizeOptions | undefined
    constraintSize_value?: ConstraintSizeOptions | undefined
    hitTestBehavior_value?: HitTestMode | undefined
    onChildTouchTest_value?: ((value: Array<TouchTestInfo>) => TouchResult) | undefined
    layoutWeight_value?: number | string | undefined
    chainWeight_value?: ChainWeightOptions | undefined
    padding_value?: Padding | Length | LocalizedPadding | undefined
    safeAreaPadding_value?: Padding | LengthMetrics | LocalizedPadding | undefined
    margin_value?: Padding | Length | LocalizedPadding | undefined
    backgroundColor_value?: ResourceColor | undefined
    pixelRound_value?: PixelRoundPolicy | undefined
    backgroundImageSize_value?: SizeOptions | ImageSize | undefined
    backgroundImagePosition_value?: Position | Alignment | undefined
    backgroundEffect_value?: BackgroundEffectOptions | undefined
    backgroundImageResizable_value?: ResizableOptions | undefined
    foregroundEffect_value?: ForegroundEffectOptions | undefined
    visualEffect_value?: uiEffect.VisualEffect | undefined
    backgroundFilter_value?: uiEffect.Filter | undefined
    foregroundFilter_value?: uiEffect.Filter | undefined
    compositingFilter_value?: uiEffect.Filter | undefined
    opacity_value?: number | Resource | undefined
    border_value?: BorderOptions | undefined
    borderStyle_value?: BorderStyle | EdgeStyles | undefined
    borderWidth_value?: Length | EdgeWidths | LocalizedEdgeWidths | undefined
    borderColor_value?: ResourceColor | EdgeColors | LocalizedEdgeColors | undefined
    borderRadius_value?: Length | BorderRadiuses | LocalizedBorderRadiuses | undefined
    borderImage_value?: BorderImageOption | undefined
    outline_value?: OutlineOptions | undefined
    outlineStyle_value?: OutlineStyle | EdgeOutlineStyles | undefined
    outlineWidth_value?: Dimension | EdgeOutlineWidths | undefined
    outlineColor_value?: ResourceColor | EdgeColors | LocalizedEdgeColors | undefined
    outlineRadius_value?: Dimension | OutlineRadiuses | undefined
    foregroundColor_value?: ResourceColor | ColoringStrategy | undefined
    onClick_value?: ((event: ClickEvent) => void) | undefined
    onHover_value?: ((isHover: boolean,event: HoverEvent) => void) | undefined
    onHoverMove_value?: ((value0: HoverEvent) => void) | undefined
    onAccessibilityHover_value?: AccessibilityCallback | undefined
    hoverEffect_value?: HoverEffect | undefined
    onMouse_value?: ((event: MouseEvent) => void) | undefined
    onTouch_value?: ((event: TouchEvent) => void) | undefined
    onKeyEvent_value?: ((event: KeyEvent) => void) | undefined
    onDigitalCrown_value?: ((value0: CrownEvent) => void) | undefined
    onKeyPreIme_value?: ((value0: KeyEvent) => boolean) | undefined
    onKeyEventDispatch_value?: ((value0: KeyEvent) => boolean) | undefined
    onFocusAxisEvent_value?: ((value0: FocusAxisEvent) => void) | undefined
    onAxisEvent_value?: ((value0: AxisEvent) => void) | undefined
    focusable_value?: boolean | undefined
    nextFocus_value?: FocusMovement | undefined
    tabStop_value?: boolean | undefined
    onFocus_value?: (() => void) | undefined
    onBlur_value?: (() => void) | undefined
    tabIndex_value?: number | undefined
    defaultFocus_value?: boolean | undefined
    groupDefaultFocus_value?: boolean | undefined
    focusOnTouch_value?: boolean | undefined
    focusBox_value?: FocusBoxStyle | undefined
    animation_value?: AnimateParam | undefined
    transition_value?: TransitionEffect | undefined
    motionBlur_value?: MotionBlurOptions | undefined
    brightness_value?: number | undefined
    contrast_value?: number | undefined
    grayscale_value?: number | undefined
    colorBlend_value?: Color | string | Resource | undefined
    saturate_value?: number | undefined
    sepia_value?: number | undefined
    invert_value?: number | InvertOptions | undefined
    hueRotate_value?: number | string | undefined
    useShadowBatching_value?: boolean | undefined
    useEffect_value?: boolean | undefined
    renderGroup_value?: boolean | undefined
    freeze_value?: boolean | undefined
    translate_value?: TranslateOptions | undefined
    scale_value?: ScaleOptions | undefined
    rotate_value?: RotateOptions | undefined
    transform_value?: Object | undefined
    onAppear_value?: (() => void) | undefined
    onDisAppear_value?: (() => void) | undefined
    onAttach_value?: VoidCallback | undefined
    onDetach_value?: VoidCallback | undefined
    onAreaChange_value?: ((oldValue: Area,newValue: Area) => void) | undefined
    visibility_value?: Visibility | undefined
    flexGrow_value?: number | undefined
    flexShrink_value?: number | undefined
    flexBasis_value?: number | string | undefined
    alignSelf_value?: ItemAlign | undefined
    displayPriority_value?: number | undefined
    zIndex_value?: number | undefined
    direction_value?: Direction | undefined
    align_value?: Alignment | undefined
    position_value?: Position | Edges | LocalizedEdges | undefined
    markAnchor_value?: Position | LocalizedPosition | undefined
    offset_value?: Position | Edges | LocalizedEdges | undefined
    enabled_value?: boolean | undefined
    alignRules_value?: AlignRuleOption | undefined
    aspectRatio_value?: number | undefined
    clickEffect_value?: ClickEffect | undefined
    onDragStart_value?: ((event: DragEvent,extraParams?: string) => CustomBuilder | DragItemInfo) | undefined
    onDragEnter_value?: ((event: DragEvent,extraParams?: string) => void) | undefined
    onDragMove_value?: ((event: DragEvent,extraParams?: string) => void) | undefined
    onDragLeave_value?: ((event: DragEvent,extraParams?: string) => void) | undefined
    onDrop_value?: ((event: DragEvent,extraParams?: string) => void) | undefined
    onDragEnd_value?: ((event: DragEvent,extraParams?: string) => void) | undefined
    allowDrop_value?: Array<uniformTypeDescriptor.UniformDataType> | undefined
    draggable_value?: boolean | undefined
    dragPreview_value?: CustomBuilder | DragItemInfo | string | undefined
    onPreDrag_value?: ((value0: PreDragStatus) => void) | undefined
    linearGradient_value?: LinearGradientOptions | undefined
    sweepGradient_value?: SweepGradientOptions | undefined
    radialGradient_value?: RadialGradientOptions | undefined
    motionPath_value?: MotionPathOptions | undefined
    shadow_value?: ShadowOptions | ShadowStyle | undefined
    clip_value?: boolean | undefined
    clipShape_value?: CircleShape | EllipseShape | PathShape | RectShape | undefined
    mask_value?: ProgressMask | undefined
    maskShape_value?: CircleShape | EllipseShape | PathShape | RectShape | undefined
    key_value?: string | undefined
    id_value?: string | undefined
    geometryTransition_value?: string | undefined
    stateStyles_value?: StateStyles | undefined
    restoreId_value?: number | undefined
    sphericalEffect_value?: number | undefined
    lightUpEffect_value?: number | undefined
    pixelStretchEffect_value?: PixelStretchEffectOptions | undefined
    accessibilityGroup_value?: boolean | undefined
    accessibilityText_value?: string | undefined
    accessibilityNextFocusId_value?: string | undefined
    accessibilityDefaultFocus_value?: boolean | undefined
    accessibilityUseSamePage_value?: AccessibilitySamePageMode | undefined
    accessibilityScrollTriggerable_value?: boolean | undefined
    accessibilityRole_value?: AccessibilityRoleType | undefined
    onAccessibilityFocus_value?: AccessibilityFocusCallback | undefined
    accessibilityTextHint_value?: string | undefined
    accessibilityDescription_value?: string | undefined
    accessibilityLevel_value?: string | undefined
    accessibilityVirtualNode_value?: CustomBuilder | undefined
    accessibilityChecked_value?: boolean | undefined
    accessibilitySelected_value?: boolean | undefined
    obscured_value?: Array<ObscuredReasons> | undefined
    reuseId_value?: string | undefined
    reuse_value?: ReuseOptions | undefined
    renderFit_value?: RenderFit | undefined
    gestureModifier_value?: GestureModifier | undefined
    backgroundBrightness_value?: BackgroundBrightnessOptions | undefined
    onGestureJudgeBegin_value?: ((gestureInfo: GestureInfo,event: BaseGestureEvent) => GestureJudgeResult) | undefined
    onGestureRecognizerJudgeBegin_value?: GestureRecognizerJudgeBeginCallback | undefined
    shouldBuiltInRecognizerParallelWith_value?: ShouldBuiltInRecognizerParallelWithCallback | undefined
    monopolizeEvents_value?: boolean | undefined
    onTouchIntercept_value?: ((value0: TouchEvent) => HitTestMode) | undefined
    onSizeChange_value?: SizeChangeCallback | undefined
    accessibilityFocusDrawLevel_value?: FocusDrawLevel | undefined
    width(value: Length | LayoutPolicy | undefined): this {
        return this
    }
    height(value: Length | LayoutPolicy | undefined): this {
        return this
    }
    drawModifier(value: DrawModifier | undefined): this {
        return this
    }
    responseRegion(value: Array<Rectangle> | Rectangle | undefined): this {
        return this
    }
    mouseResponseRegion(value: Array<Rectangle> | Rectangle | undefined): this {
        return this
    }
    size(value: SizeOptions | undefined): this {
        return this
    }
    constraintSize(value: ConstraintSizeOptions | undefined): this {
        return this
    }
    hitTestBehavior(value: HitTestMode | undefined): this {
        return this
    }
    onChildTouchTest(value: ((value: Array<TouchTestInfo>) => TouchResult) | undefined): this {
        return this
    }
    layoutWeight(value: number | string | undefined): this {
        return this
    }
    chainWeight(value: ChainWeightOptions | undefined): this {
        return this
    }
    padding(value: Padding | Length | LocalizedPadding | undefined): this {
        return this
    }
    safeAreaPadding(value: Padding | LengthMetrics | LocalizedPadding | undefined): this {
        return this
    }
    margin(value: Padding | Length | LocalizedPadding | undefined): this {
        return this
    }
    backgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    pixelRound(value: PixelRoundPolicy | undefined): this {
        return this
    }
    backgroundImageSize(value: SizeOptions | ImageSize | undefined): this {
        return this
    }
    backgroundImagePosition(value: Position | Alignment | undefined): this {
        return this
    }
    backgroundEffect(value: BackgroundEffectOptions | undefined): this {
        return this
    }
    backgroundImageResizable(value: ResizableOptions | undefined): this {
        return this
    }
    foregroundEffect(value: ForegroundEffectOptions | undefined): this {
        return this
    }
    visualEffect(value: uiEffect.VisualEffect | undefined): this {
        return this
    }
    backgroundFilter(value: uiEffect.Filter | undefined): this {
        return this
    }
    foregroundFilter(value: uiEffect.Filter | undefined): this {
        return this
    }
    compositingFilter(value: uiEffect.Filter | undefined): this {
        return this
    }
    opacity(value: number | Resource | undefined): this {
        return this
    }
    border(value: BorderOptions | undefined): this {
        return this
    }
    borderStyle(value: BorderStyle | EdgeStyles | undefined): this {
        return this
    }
    borderWidth(value: Length | EdgeWidths | LocalizedEdgeWidths | undefined): this {
        return this
    }
    borderColor(value: ResourceColor | EdgeColors | LocalizedEdgeColors | undefined): this {
        return this
    }
    borderRadius(value: Length | BorderRadiuses | LocalizedBorderRadiuses | undefined): this {
        return this
    }
    borderImage(value: BorderImageOption | undefined): this {
        return this
    }
    outline(value: OutlineOptions | undefined): this {
        return this
    }
    outlineStyle(value: OutlineStyle | EdgeOutlineStyles | undefined): this {
        return this
    }
    outlineWidth(value: Dimension | EdgeOutlineWidths | undefined): this {
        return this
    }
    outlineColor(value: ResourceColor | EdgeColors | LocalizedEdgeColors | undefined): this {
        return this
    }
    outlineRadius(value: Dimension | OutlineRadiuses | undefined): this {
        return this
    }
    foregroundColor(value: ResourceColor | ColoringStrategy | undefined): this {
        return this
    }
    onClick(value: ((event: ClickEvent) => void) | undefined): this {
        return this
    }
    onHover(value: ((isHover: boolean,event: HoverEvent) => void) | undefined): this {
        return this
    }
    onHoverMove(value: ((value0: HoverEvent) => void) | undefined): this {
        return this
    }
    onAccessibilityHover(value: AccessibilityCallback | undefined): this {
        return this
    }
    hoverEffect(value: HoverEffect | undefined): this {
        return this
    }
    onMouse(value: ((event: MouseEvent) => void) | undefined): this {
        return this
    }
    onTouch(value: ((event: TouchEvent) => void) | undefined): this {
        return this
    }
    onKeyEvent(value: ((event: KeyEvent) => void) | undefined): this {
        return this
    }
    onDigitalCrown(value: ((value0: CrownEvent) => void) | undefined): this {
        return this
    }
    onKeyPreIme(value: ((value0: KeyEvent) => boolean) | undefined): this {
        return this
    }
    onKeyEventDispatch(value: ((value0: KeyEvent) => boolean) | undefined): this {
        return this
    }
    onFocusAxisEvent(value: ((value0: FocusAxisEvent) => void) | undefined): this {
        return this
    }
    onAxisEvent(value: ((value0: AxisEvent) => void) | undefined): this {
        return this
    }
    focusable(value: boolean | undefined): this {
        return this
    }
    nextFocus(value: FocusMovement | undefined): this {
        return this
    }
    tabStop(value: boolean | undefined): this {
        return this
    }
    onFocus(value: (() => void) | undefined): this {
        return this
    }
    onBlur(value: (() => void) | undefined): this {
        return this
    }
    tabIndex(value: number | undefined): this {
        return this
    }
    defaultFocus(value: boolean | undefined): this {
        return this
    }
    groupDefaultFocus(value: boolean | undefined): this {
        return this
    }
    focusOnTouch(value: boolean | undefined): this {
        return this
    }
    focusBox(value: FocusBoxStyle | undefined): this {
        return this
    }
    animation(value: AnimateParam | undefined): this {
        return this
    }
    transition(value: TransitionEffect | undefined): this {
        return this
    }
    motionBlur(value: MotionBlurOptions | undefined): this {
        return this
    }
    brightness(value: number | undefined): this {
        return this
    }
    contrast(value: number | undefined): this {
        return this
    }
    grayscale(value: number | undefined): this {
        return this
    }
    colorBlend(value: Color | string | Resource | undefined): this {
        return this
    }
    saturate(value: number | undefined): this {
        return this
    }
    sepia(value: number | undefined): this {
        return this
    }
    invert(value: number | InvertOptions | undefined): this {
        return this
    }
    hueRotate(value: number | string | undefined): this {
        return this
    }
    useShadowBatching(value: boolean | undefined): this {
        return this
    }
    useEffect(value: boolean | undefined): this {
        return this
    }
    renderGroup(value: boolean | undefined): this {
        return this
    }
    freeze(value: boolean | undefined): this {
        return this
    }
    translate(value: TranslateOptions | undefined): this {
        return this
    }
    scale(value: ScaleOptions | undefined): this {
        return this
    }
    rotate(value: RotateOptions | undefined): this {
        return this
    }
    transform(value: Object | undefined): this {
        return this
    }
    onAppear(value: (() => void) | undefined): this {
        return this
    }
    onDisAppear(value: (() => void) | undefined): this {
        return this
    }
    onAttach(value: VoidCallback | undefined): this {
        return this
    }
    onDetach(value: VoidCallback | undefined): this {
        return this
    }
    onAreaChange(value: ((oldValue: Area,newValue: Area) => void) | undefined): this {
        return this
    }
    visibility(value: Visibility | undefined): this {
        return this
    }
    flexGrow(value: number | undefined): this {
        return this
    }
    flexShrink(value: number | undefined): this {
        return this
    }
    flexBasis(value: number | string | undefined): this {
        return this
    }
    alignSelf(value: ItemAlign | undefined): this {
        return this
    }
    displayPriority(value: number | undefined): this {
        return this
    }
    zIndex(value: number | undefined): this {
        return this
    }
    direction(value: Direction | undefined): this {
        return this
    }
    align(value: Alignment | undefined): this {
        return this
    }
    position(value: Position | Edges | LocalizedEdges | undefined): this {
        return this
    }
    markAnchor(value: Position | LocalizedPosition | undefined): this {
        return this
    }
    offset(value: Position | Edges | LocalizedEdges | undefined): this {
        return this
    }
    enabled(value: boolean | undefined): this {
        return this
    }
    alignRules(value: AlignRuleOption | undefined): this {
        return this
    }
    alignRules(value: LocalizedAlignRuleOptions | undefined): this {
        return this
    }
    aspectRatio(value: number | undefined): this {
        return this
    }
    clickEffect(value: ClickEffect | undefined): this {
        return this
    }
    onDragStart(value: ((event: DragEvent,extraParams?: string) => CustomBuilder | DragItemInfo) | undefined): this {
        return this
    }
    onDragEnter(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        return this
    }
    onDragMove(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        return this
    }
    onDragLeave(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        return this
    }
    onDrop(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        return this
    }
    onDragEnd(value: ((event: DragEvent,extraParams?: string) => void) | undefined): this {
        return this
    }
    allowDrop(value: Array<uniformTypeDescriptor.UniformDataType> | undefined): this {
        return this
    }
    draggable(value: boolean | undefined): this {
        return this
    }
    dragPreview(value: CustomBuilder | DragItemInfo | string | undefined): this {
        return this
    }
    onPreDrag(value: ((value0: PreDragStatus) => void) | undefined): this {
        return this
    }
    linearGradient(value: LinearGradientOptions | undefined): this {
        return this
    }
    sweepGradient(value: SweepGradientOptions | undefined): this {
        return this
    }
    radialGradient(value: RadialGradientOptions | undefined): this {
        return this
    }
    motionPath(value: MotionPathOptions | undefined): this {
        return this
    }
    shadow(value: ShadowOptions | ShadowStyle | undefined): this {
        return this
    }
    clip(value: boolean | undefined): this {
        return this
    }
    clipShape(value: CircleShape | EllipseShape | PathShape | RectShape | undefined): this {
        return this
    }
    mask(value: ProgressMask | undefined): this {
        return this
    }
    maskShape(value: CircleShape | EllipseShape | PathShape | RectShape | undefined): this {
        return this
    }
    key(value: string | undefined): this {
        return this
    }
    id(value: string | undefined): this {
        return this
    }
    geometryTransition(value: string | undefined): this {
        return this
    }
    stateStyles(value: StateStyles | undefined): this {
        return this
    }
    restoreId(value: number | undefined): this {
        return this
    }
    sphericalEffect(value: number | undefined): this {
        return this
    }
    lightUpEffect(value: number | undefined): this {
        return this
    }
    pixelStretchEffect(value: PixelStretchEffectOptions | undefined): this {
        return this
    }
    accessibilityGroup(value: boolean | undefined): this {
        return this
    }
    accessibilityText(value: string | undefined): this {
        return this
    }
    accessibilityNextFocusId(value: string | undefined): this {
        return this
    }
    accessibilityDefaultFocus(value: boolean | undefined): this {
        return this
    }
    accessibilityUseSamePage(value: AccessibilitySamePageMode | undefined): this {
        return this
    }
    accessibilityScrollTriggerable(value: boolean | undefined): this {
        return this
    }
    accessibilityText(value: Resource | undefined): this {
        return this
    }
    accessibilityRole(value: AccessibilityRoleType | undefined): this {
        return this
    }
    onAccessibilityFocus(value: AccessibilityFocusCallback | undefined): this {
        return this
    }
    accessibilityTextHint(value: string | undefined): this {
        return this
    }
    accessibilityDescription(value: string | undefined): this {
        return this
    }
    accessibilityDescription(value: Resource | undefined): this {
        return this
    }
    accessibilityLevel(value: string | undefined): this {
        return this
    }
    accessibilityVirtualNode(value: CustomBuilder | undefined): this {
        return this
    }
    accessibilityChecked(value: boolean | undefined): this {
        return this
    }
    accessibilitySelected(value: boolean | undefined): this {
        return this
    }
    obscured(value: Array<ObscuredReasons> | undefined): this {
        return this
    }
    reuseId(value: string | undefined): this {
        return this
    }
    reuse(value: ReuseOptions | undefined): this {
        return this
    }
    renderFit(value: RenderFit | undefined): this {
        return this
    }
    gestureModifier(value: GestureModifier | undefined): this {
        return this
    }
    backgroundBrightness(value: BackgroundBrightnessOptions | undefined): this {
        return this
    }
    onGestureJudgeBegin(value: ((gestureInfo: GestureInfo,event: BaseGestureEvent) => GestureJudgeResult) | undefined): this {
        return this
    }
    onGestureRecognizerJudgeBegin(value: GestureRecognizerJudgeBeginCallback | undefined): this {
        return this
    }
    shouldBuiltInRecognizerParallelWith(value: ShouldBuiltInRecognizerParallelWithCallback | undefined): this {
        return this
    }
    monopolizeEvents(value: boolean | undefined): this {
        return this
    }
    onTouchIntercept(value: ((value0: TouchEvent) => HitTestMode) | undefined): this {
        return this
    }
    onSizeChange(value: SizeChangeCallback | undefined): this {
        return this
    }
    accessibilityFocusDrawLevel(value: FocusDrawLevel | undefined): this {
        return this
    }
    customProperty(name: string, value: CustomProperty): this {
        return this
    }
    expandSafeArea(types?: Array<SafeAreaType>, edges?: Array<SafeAreaEdge>): this {
        return this
    }
    background(builder: CustomBuilder | undefined, options?: BackgroundOptions): this {
        return this
    }
    backgroundImage(src: ResourceStr | image.PixelMap | undefined, repeat?: ImageRepeat): this {
        return this
    }
    backgroundImage(src: ResourceStr | image.PixelMap | undefined, options?: BackgroundImageOptions): this {
        return this
    }
    backgroundBlurStyle(style: BlurStyle | undefined, options?: BackgroundBlurStyleOptions, sysOptions?: SystemAdaptiveOptions): this {
        return this
    }
    backgroundEffect(options: BackgroundEffectOptions | undefined, sysOptions?: SystemAdaptiveOptions): this {
        return this
    }
    foregroundBlurStyle(style: BlurStyle | undefined, options?: ForegroundBlurStyleOptions, sysOptions?: SystemAdaptiveOptions): this {
        return this
    }
    onClick(event: ((event: ClickEvent) => void) | undefined, distanceThreshold: number | undefined): this {
        return this
    }
    focusScopeId(id: string | undefined, isGroup?: boolean, arrowStepOut?: boolean): this {
        return this
    }
    focusScopePriority(scopeId: string | undefined, priority?: FocusPriority): this {
        return this
    }
    transition(effect: TransitionEffect | undefined, onFinish: TransitionFinishCallback | undefined): this {
        return this
    }
    gesture(gesture: GestureType | undefined, mask?: GestureMask): this {
        return this
    }
    priorityGesture(gesture: GestureType | undefined, mask?: GestureMask): this {
        return this
    }
    parallelGesture(gesture: GestureType | undefined, mask?: GestureMask): this {
        return this
    }
    blur(blurRadius: number | undefined, options?: BlurOptions, sysOptions?: SystemAdaptiveOptions): this {
        return this
    }
    linearGradientBlur(value: number | undefined, options: LinearGradientBlurOptions | undefined): this {
        return this
    }
    systemBarEffect(): this {
        return this
    }
    useEffect(useEffect: boolean | undefined, effectType: EffectType | undefined): this {
        return this
    }
    backdropBlur(radius: number | undefined, options?: BlurOptions, sysOptions?: SystemAdaptiveOptions): this {
        return this
    }
    sharedTransition(id: string | undefined, options?: sharedTransitionOptions): this {
        return this
    }
    chainMode(direction: Axis | undefined, style: ChainStyle | undefined): this {
        return this
    }
    onDrop(eventCallback: OnDragEventCallback | undefined, dropOptions?: DropOptions): this {
        return this
    }
    dragPreview(preview: CustomBuilder | DragItemInfo | string | undefined, config?: PreviewConfiguration): this {
        return this
    }
    dragPreviewOptions(value: DragPreviewOptions | undefined, options?: DragInteractionOptions): this {
        return this
    }
    overlay(value: string | CustomBuilder | ComponentContent | undefined, options?: OverlayOptions): this {
        return this
    }
    blendMode(value: BlendMode | undefined, type?: BlendApplyType): this {
        return this
    }
    advancedBlendMode(effect: BlendMode | uiEffect.Blender, type?: BlendApplyType): this {
        return this
    }
    geometryTransition(id: string | undefined, options?: GeometryTransitionOptions): this {
        return this
    }
    bindTips(message: TipsMessageType | undefined, options?: TipsOptions): this {
        return this
    }
    bindPopup(show: boolean | undefined, popup: PopupOptions | CustomPopupOptions | undefined): this {
        return this
    }
    bindMenu(content: Array<MenuElement> | CustomBuilder | undefined, options?: MenuOptions): this {
        return this
    }
    bindMenu(isShow: boolean | undefined, content: Array<MenuElement> | CustomBuilder | undefined, options?: MenuOptions): this {
        return this
    }
    bindContextMenu(content: CustomBuilder | undefined, responseType: ResponseType | undefined, options?: ContextMenuOptions): this {
        return this
    }
    bindContextMenu(isShown: boolean | undefined, content: CustomBuilder | undefined, options?: ContextMenuOptions): this {
        return this
    }
    bindContentCover(isShow: boolean | Bindable<boolean> | undefined, builder: CustomBuilder | undefined, type?: ModalTransition): this {
        return this
    }
    bindContentCover(isShow: boolean | Bindable<boolean> | undefined, builder: CustomBuilder | undefined, options?: ContentCoverOptions): this {
        return this
    }
    bindSheet(isShow: boolean | Bindable<boolean> | undefined, builder: CustomBuilder | undefined, options?: SheetOptions): this {
        return this
    }
    onVisibleAreaChange(ratios: Array<number> | undefined, event: VisibleAreaChangeCallback | undefined): this {
        return this
    }
    onVisibleAreaApproximateChange(options: VisibleAreaEventOptions | undefined, event: VisibleAreaChangeCallback | undefined): this {
        return this
    }
    keyboardShortcut(value: string | FunctionKey | undefined, keys: Array<ModifierKey> | undefined, action?: (() => void)): this {
        return this
    }
    accessibilityGroup(isGroup: boolean | undefined, config: AccessibilityOptions | undefined): this {
        return this
    }
    onGestureRecognizerJudgeBegin(callback_: GestureRecognizerJudgeBeginCallback | undefined, exposeInnerGesture: boolean | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export type CommonAttribute = CommonMethod;
export declare interface OverlayOptions {
    align?: Alignment;
    offset?: OverlayOffset;
}
export declare interface OverlayOffset {
    x?: number;
    y?: number;
}
export type FractionStop = [
    number,
    number
]
export interface CommonShapeMethod extends CommonMethod {
    stroke(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method stroke")
    }
    fill(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fill")
    }
    strokeDashOffset(value: number | string | undefined): this {
        throw new Error("Unimplemented method strokeDashOffset")
    }
    strokeLineCap(value: LineCapStyle | undefined): this {
        throw new Error("Unimplemented method strokeLineCap")
    }
    strokeLineJoin(value: LineJoinStyle | undefined): this {
        throw new Error("Unimplemented method strokeLineJoin")
    }
    strokeMiterLimit(value: number | string | undefined): this {
        throw new Error("Unimplemented method strokeMiterLimit")
    }
    strokeOpacity(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method strokeOpacity")
    }
    fillOpacity(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method fillOpacity")
    }
    strokeWidth(value: Length | undefined): this {
        throw new Error("Unimplemented method strokeWidth")
    }
    antiAlias(value: boolean | undefined): this {
        throw new Error("Unimplemented method antiAlias")
    }
    strokeDashArray(value: Array<Length> | undefined): this {
        throw new Error("Unimplemented method strokeDashArray")
    }
    attributeModifier(value: AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCommonShapeMethodStyle extends ArkCommonMethodStyle implements CommonShapeMethod {
    stroke_value?: ResourceColor | undefined
    fill_value?: ResourceColor | undefined
    strokeDashOffset_value?: number | string | undefined
    strokeLineCap_value?: LineCapStyle | undefined
    strokeLineJoin_value?: LineJoinStyle | undefined
    strokeMiterLimit_value?: number | string | undefined
    strokeOpacity_value?: number | string | Resource | undefined
    fillOpacity_value?: number | string | Resource | undefined
    strokeWidth_value?: Length | undefined
    antiAlias_value?: boolean | undefined
    strokeDashArray_value?: Array<Length> | undefined
    stroke(value: ResourceColor | undefined): this {
        return this
    }
    fill(value: ResourceColor | undefined): this {
        return this
    }
    strokeDashOffset(value: number | string | undefined): this {
        return this
    }
    strokeLineCap(value: LineCapStyle | undefined): this {
        return this
    }
    strokeLineJoin(value: LineJoinStyle | undefined): this {
        return this
    }
    strokeMiterLimit(value: number | string | undefined): this {
        return this
    }
    strokeOpacity(value: number | string | Resource | undefined): this {
        return this
    }
    fillOpacity(value: number | string | Resource | undefined): this {
        return this
    }
    strokeWidth(value: Length | undefined): this {
        return this
    }
    antiAlias(value: boolean | undefined): this {
        return this
    }
    strokeDashArray(value: Array<Length> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface PixelRoundPolicy {
    start?: PixelRoundCalcPolicy;
    top?: PixelRoundCalcPolicy;
    end?: PixelRoundCalcPolicy;
    bottom?: PixelRoundCalcPolicy;
}
export declare interface LinearGradientBlurOptions {
    fractionStops: Array<FractionStop>;
    direction: GradientDirection;
}
export declare interface MotionBlurAnchor {
    x: number;
    y: number;
}
export declare interface MotionBlurOptions {
    radius: number;
    anchor: MotionBlurAnchor;
}
export declare interface GeometryInfo extends SizeResult {
    borderWidth: EdgeWidths;
    margin: Padding;
    padding: Padding;
}
export declare interface Layoutable {
    measureResult: MeasureResult;
    uniqueId?: number;
    layout(position: Position): void
    getMargin(): DirectionalEdgesT
    getPadding(): DirectionalEdgesT
    getBorderWidth(): DirectionalEdgesT
}
export declare interface Measurable {
    uniqueId?: number;
    measure(constraint: ConstraintSizeOptions): MeasureResult
    getMargin(): DirectionalEdgesT
    getPadding(): DirectionalEdgesT
    getBorderWidth(): DirectionalEdgesT
}
export declare interface SizeResult {
    width: number;
    height: number;
}
export declare interface MeasureResult extends SizeResult {
}
export type NavDestinationInfo = uiObserver.NavDestinationInfo;
export type NavigationInfo = uiObserver.NavigationInfo;
export type RouterPageInfo = uiObserver.RouterPageInfo;
export { UIContext } from "@ohos.arkui.UIContext"
export { DrawContext } from "./../Graphics"
export type VisualEffect = uiEffect.VisualEffect;
export type Filter = uiEffect.Filter;
export type Blender = uiEffect.Blender;
export type PromptActionDialogController = promptAction.DialogController;
export declare interface RectResult {
    x: number;
    y: number;
    width: number;
    height: number;
}
export declare interface CaretOffset {
    index: number;
    x: number;
    y: number;
}
export declare interface TextContentControllerOptions {
    offset?: number;
}
export declare abstract class TextContentControllerBase {
    constructor()
    getCaretOffset(): CaretOffset
    getTextContentRect(): RectResult
    getTextContentLineCount(): number
    addText(text: string, textOperationOptions?: TextContentControllerOptions): number
    deleteText(range?: TextRange): void
    getSelection(): TextRange
    clearPreviewText(): void
    getText(range?: TextRange): string
}
export enum ContentClipMode {
    CONTENT_ONLY = 0,
    BOUNDARY = 1,
    SAFE_AREA = 2
}
export interface ScrollableCommonMethod extends CommonMethod {
    scrollBar(value: BarState | undefined): this {
        throw new Error("Unimplemented method scrollBar")
    }
    scrollBarColor(value: Color | number | string | undefined): this {
        throw new Error("Unimplemented method scrollBarColor")
    }
    scrollBarWidth(value: number | string | undefined): this {
        throw new Error("Unimplemented method scrollBarWidth")
    }
    nestedScroll(value: NestedScrollOptions | undefined): this {
        throw new Error("Unimplemented method nestedScroll")
    }
    enableScrollInteraction(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableScrollInteraction")
    }
    friction(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method friction")
    }
    onReachStart(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onReachStart")
    }
    onReachEnd(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onReachEnd")
    }
    onScrollStart(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onScrollStart")
    }
    onScrollStop(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onScrollStop")
    }
    flingSpeedLimit(value: number | undefined): this {
        throw new Error("Unimplemented method flingSpeedLimit")
    }
    clipContent(value: ContentClipMode | RectShape | undefined): this {
        throw new Error("Unimplemented method clipContent")
    }
    digitalCrownSensitivity(value: CrownSensitivity | undefined): this {
        throw new Error("Unimplemented method digitalCrownSensitivity")
    }
    backToTop(value: boolean | undefined): this {
        throw new Error("Unimplemented method backToTop")
    }
    edgeEffect(edgeEffect: EdgeEffect | undefined, options?: EdgeEffectOptions): this {
        throw new Error("Unimplemented method edgeEffect")
    }
    fadingEdge(enabled: boolean | undefined, options?: FadingEdgeOptions): this {
        throw new Error("Unimplemented method fadingEdge")
    }
    attributeModifier(value: AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkScrollableCommonMethodStyle extends ArkCommonMethodStyle implements ScrollableCommonMethod {
    scrollBar(value: BarState | undefined): this {
        return this
    }
    scrollBarColor(value: Color | number | string | undefined): this {
        return this
    }
    scrollBarWidth(value: number | string | undefined): this {
        return this
    }
    nestedScroll(value: NestedScrollOptions | undefined): this {
        return this
    }
    enableScrollInteraction(value: boolean | undefined): this {
        return this
    }
    friction(value: number | Resource | undefined): this {
        return this
    }
    onReachStart(value: (() => void) | undefined): this {
        return this
    }
    onReachEnd(value: (() => void) | undefined): this {
        return this
    }
    onScrollStart(value: (() => void) | undefined): this {
        return this
    }
    onScrollStop(value: (() => void) | undefined): this {
        return this
    }
    flingSpeedLimit(value: number | undefined): this {
        return this
    }
    clipContent(value: ContentClipMode | RectShape | undefined): this {
        return this
    }
    digitalCrownSensitivity(value: CrownSensitivity | undefined): this {
        return this
    }
    backToTop(value: boolean | undefined): this {
        return this
    }
    edgeEffect(edgeEffect: EdgeEffect | undefined, options?: EdgeEffectOptions): this {
        return this
    }
    fadingEdge(enabled: boolean | undefined, options?: FadingEdgeOptions): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ScrollableCommonMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare class ScrollResult {
    constructor()
    offsetRemain: number;
}
export type OnWillScrollCallback = (scrollOffset: number, scrollState: ScrollState, scrollSource: ScrollSource) => ScrollResult | undefined;
export type OnScrollCallback = (scrollOffset: number, scrollState: ScrollState) => void;
export type OnItemDragStartCallback = (event: ItemDragInfo, itemIndex: number) => CustomBuilder | undefined;
export type OnMoveHandler = (from: number, to: number) => void;
export declare interface ItemDragEventHandler {
    onLongPress?: ((value0: number) => void);
    onDragStart?: ((value0: number) => void);
    onMoveThrough?: OnMoveHandler;
    onDrop?: ((value0: number) => void);
}
export declare interface DynamicNode {
}
export declare interface EdgeEffectOptions {
    alwaysEnabled: boolean;
    effectEdge?: number;
}
export enum EffectEdge {
    START = 1,
    END = 2
}
export declare class ChildrenMainSize {
    constructor(childDefaultSize: number)
    set childDefaultSize(val:number);
    get childDefaultSize():number;
    splice(start: number, deleteCount?: number, childrenSize?: Array<number>): void
    update(index: number, childSize: number): void
}
export declare interface BackgroundBrightnessOptions {
    rate: number;
    lightUpDegree: number;
}
export declare interface PointLightStyle {
    lightSource?: LightSource;
    illuminated?: IlluminatedType;
    bloom?: number;
}
export declare interface LightSource {
    positionX: Dimension;
    positionY: Dimension;
    intensity: number;
    color?: ResourceColor;
}
export declare interface KeyframeAnimateParam {
    delay?: number;
    iterations?: number;
    onFinish?: (() => void);
    expectedFrameRateRange?: ExpectedFrameRateRange;
}
export declare interface KeyframeState {
    duration: number;
    curve?: curves.Curve | string | curves.ICurve;
    event: (() => void);
}
export type Callback<T = void,V = void> = (data: T) => V;
export type HoverCallback = (isHover: boolean, event: HoverEvent) => void;
export type AccessibilityCallback = (isHover: boolean, event: AccessibilityHoverEvent) => void;
export declare interface VisibleAreaEventOptions {
    ratios: Array<number>;
    expectedUpdateInterval?: number;
}
export type VisibleAreaChangeCallback = (isExpanding: boolean, currentRatio: number) => void;
export declare interface UICommonEvent {
    setOnClick(callback_: ((event: ClickEvent) => void) | undefined): void
    setOnTouch(callback_: ((event: TouchEvent) => void) | undefined): void
    setOnAppear(callback_: (() => void) | undefined): void
    setOnDisappear(callback_: (() => void) | undefined): void
    setOnKeyEvent(callback_: ((event: KeyEvent) => void) | undefined): void
    setOnFocus(callback_: (() => void) | undefined): void
    setOnBlur(callback_: (() => void) | undefined): void
    setOnHover(callback_: HoverCallback | undefined): void
    setOnMouse(callback_: ((event: MouseEvent) => void) | undefined): void
    setOnSizeChange(callback_: SizeChangeCallback | undefined): void
    setOnVisibleAreaApproximateChange(options: VisibleAreaEventOptions, event: VisibleAreaChangeCallback | undefined): void
}
export declare interface SelectionOptions {
    menuPolicy?: MenuPolicy;
}
export declare interface FocusMovement {
    forward?: string;
    backward?: string;
    up?: string;
    down?: string;
    left?: string;
    right?: string;
}
export enum KeyboardAvoidMode {
    DEFAULT = 0,
    NONE = 1
}
export enum HoverModeAreaType {
    TOP_SCREEN = 0,
    BOTTOM_SCREEN = 1
}
export declare interface DateRange {
    start?: Date;
    end?: Date;
}
export declare interface TerminationInfo {
    code: int32;
    want?: Want;
}
export type DateTimeOptions = intl.DateTimeOptions;
export declare interface Bindable<T = void> {
    readonly value: T;
    readonly onChange: ((value0: T) => void);
}
export type BindableResourceStr = ResourceStr | Bindable<ResourceStr> | Bindable<Resource> | Bindable<string>;
export type BindableResourceStrArray = Array<ResourceStr> | Bindable<Array<ResourceStr>> | Bindable<Array<Resource>> | Bindable<Array<string>>;
