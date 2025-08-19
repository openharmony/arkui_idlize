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
import { default as curves } from "@ohos.curves"
import { extractors, ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { AnimateParam, TranslateOptions, TouchEvent, GeometryInfo, Measurable, SizeResult, Layoutable, ClickEvent } from "./common"
import { Size, Frame } from "./../Graphics"
import { ButtonConfiguration } from "./button"
import { CheckBoxConfiguration } from "./checkbox"
import { DataPanelConfiguration } from "./dataPanel"
import { GaugeConfiguration } from "./gauge"
import { LoadingProgressConfiguration } from "./loadingProgress"
import { ProgressConfiguration } from "./progress"
import { RadioConfiguration } from "./radio"
import { RatingConfiguration } from "./rating"
import { MenuItemConfiguration } from "./select"
import { SliderConfiguration } from "./slider"
import { TextClockConfiguration } from "./textClock"
import { TextTimerConfiguration } from "./textTimer"
import { ToggleConfiguration } from "./toggle"
import { CustomDialogController } from "./customDialogController"
import { CustomBuilder } from "./builder"
import { Resource } from "@global.resource"
import { ResourceStr, ResourceColor, Position, Length, SizeOptions, ConstraintSizeOptions } from "./units"
import { Color } from "./enums"
import { default as image } from "@ohos.multimedia.image"
import { MeasureOptions } from "@ohos.measure"
import { NavPathStack, NavPathInfo, NavigationOptions } from "./navigation"
export type Callback_Extender_OnProgress = (value: float) => void;
export type Callback_Extender_OnFinish = () => void;
export declare interface DoubleAnimationParam {
    propertyName: string;
    startValue: float;
    endValue: float;
    duration: int32;
    delay: int32;
    curve: curves.Curve | string | curves.ICurve;
    onProgress?: Callback_Extender_OnProgress;
    onFinish?: Callback_Extender_OnFinish;
}
export declare class AnimationExtender {
    static SetClipRect(node: KPointer, x: float, y: float, width: float, height: float): void
    static OpenImplicitAnimation(param: AnimateParam): void
    static CloseImplicitAnimation(): void
    static StartDoubleAnimation(node: KPointer, param: DoubleAnimationParam): void
    static AnimationTranslate(node: KPointer, options: TranslateOptions): void
}
export declare interface ComponentInfo {
    size: Size;
    localOffset: Offset_componentutils;
    windowOffset: Offset_componentutils;
    screenOffset: Offset_componentutils;
    translate: TranslateResult;
    scale: ScaleResult;
    rotate: RotateResult;
    transform: Matrix4Result;
}
export declare interface Offset_componentutils {
    x: number;
    y: number;
}
export declare interface TranslateResult {
    x: number;
    y: number;
    z: number;
}
export declare interface ScaleResult {
    x: number;
    y: number;
    z: number;
    centerX: number;
    centerY: number;
}
export declare interface RotateResult {
    x: number;
    y: number;
    z: number;
    centerX: number;
    centerY: number;
    angle: number;
}
export type Matrix4Result = [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number
]
export declare class ContentModifierHelper {
    static contentModifierButton(node: KPointer, contentModifier: ContentModifier<ButtonConfiguration>, builder: ((parentNode: KPointer,config: ButtonConfiguration) => KPointer)): void
    static resetContentModifierButton(node: KPointer): void
    static contentModifierCheckBox(node: KPointer, contentModifier: ContentModifier<CheckBoxConfiguration>, builder: ((parentNode: KPointer,config: CheckBoxConfiguration) => KPointer)): void
    static resetContentModifierCheckBox(node: KPointer): void
    static contentModifierDataPanel(node: KPointer, contentModifier: ContentModifier<DataPanelConfiguration>, builder: ((parentNode: KPointer,config: DataPanelConfiguration) => KPointer)): void
    static resetContentModifierDataPanel(node: KPointer): void
    static contentModifierGauge(node: KPointer, contentModifier: ContentModifier<GaugeConfiguration>, builder: ((parentNode: KPointer,config: GaugeConfiguration) => KPointer)): void
    static resetContentModifierGauge(node: KPointer): void
    static contentModifierLoadingProgress(node: KPointer, contentModifier: ContentModifier<LoadingProgressConfiguration>, builder: ((parentNode: KPointer,config: LoadingProgressConfiguration) => KPointer)): void
    static resetContentModifierLoadingProgress(node: KPointer): void
    static contentModifierProgress(node: KPointer, contentModifier: ContentModifier<ProgressConfiguration>, builder: ((parentNode: KPointer,config: ProgressConfiguration) => KPointer)): void
    static resetContentModifierProgress(node: KPointer): void
    static contentModifierRadio(node: KPointer, contentModifier: ContentModifier<RadioConfiguration>, builder: ((parentNode: KPointer,config: RadioConfiguration) => KPointer)): void
    static resetContentModifierRadio(node: KPointer): void
    static contentModifierRating(node: KPointer, contentModifier: ContentModifier<RatingConfiguration>, builder: ((parentNode: KPointer,config: RatingConfiguration) => KPointer)): void
    static resetContentModifierRating(node: KPointer): void
    static contentModifierMenuItem(node: KPointer, contentModifier: ContentModifier<MenuItemConfiguration>, builder: ((parentNode: KPointer,config: MenuItemConfiguration) => KPointer)): void
    static resetContentModifierMenuItem(node: KPointer): void
    static contentModifierSlider(node: KPointer, contentModifier: ContentModifier<SliderConfiguration>, builder: ((parentNode: KPointer,config: SliderConfiguration) => KPointer)): void
    static resetContentModifierSlider(node: KPointer): void
    static contentModifierTextClock(node: KPointer, contentModifier: ContentModifier<TextClockConfiguration>, builder: ((parentNode: KPointer,config: TextClockConfiguration) => KPointer)): void
    static resetContentModifierTextClock(node: KPointer): void
    static contentModifierTextTimer(node: KPointer, contentModifier: ContentModifier<TextTimerConfiguration>, builder: ((parentNode: KPointer,config: TextTimerConfiguration) => KPointer)): void
    static resetContentModifierTextTimer(node: KPointer): void
    static contentModifierToggle(node: KPointer, contentModifier: ContentModifier<ToggleConfiguration>, builder: ((parentNode: KPointer,config: ToggleConfiguration) => KPointer)): void
    static resetContentModifierToggle(node: KPointer): void
}
export declare interface CustomDialogBuildOptions {
    controller?: CustomDialogController;
}
export declare interface CustomDialogControllerBuilder {
    buildOptions: CustomDialogBuildOptions;
    build: CustomBuilder;
}
export type Callback_RangeUpdate = (start: int32, end: int32) => void;
export type Callback_CreateItem = (index: int32) => KPointer;
export declare class LazyForEachOps {
    static Sync(node: KPointer, totalCount: int32, creator: Callback_CreateItem, updater: Callback_RangeUpdate): void
}
export declare class SystemOps {
    static StartFrame(): KPointer
    static EndFrame(root: KPointer): void
    static syncInstanceId(instanceId: int32): void
    static restoreInstanceId(): void
    static getResourceId(bundleName: string, moduleName: string, params: Array<string>): int32
    static resourceManagerReset(): void
    static setFrameCallback(onFrameCallback: ((value0: number) => void), onIdleCallback: ((value0: number) => void), delayTime: number): void
    static colorMetricsResourceColor(color: Resource): Array<number>
}
export declare class FocusController {
    static requestFocus(key: string): void
}
export declare class Scene {
    static load(uri?: ResourceStr): Promise<Scene>
    destroy(): void
}
export declare interface CustomColors {
    brand?: ResourceColor;
    warning?: ResourceColor;
    alert?: ResourceColor;
    confirm?: ResourceColor;
    fontPrimary?: ResourceColor;
    fontSecondary?: ResourceColor;
    fontTertiary?: ResourceColor;
    fontFourth?: ResourceColor;
    fontEmphasize?: ResourceColor;
    fontOnPrimary?: ResourceColor;
    fontOnSecondary?: ResourceColor;
    fontOnTertiary?: ResourceColor;
    fontOnFourth?: ResourceColor;
    iconPrimary?: ResourceColor;
    iconSecondary?: ResourceColor;
    iconTertiary?: ResourceColor;
    iconFourth?: ResourceColor;
    iconEmphasize?: ResourceColor;
    iconSubEmphasize?: ResourceColor;
    iconOnPrimary?: ResourceColor;
    iconOnSecondary?: ResourceColor;
    iconOnTertiary?: ResourceColor;
    iconOnFourth?: ResourceColor;
    backgroundPrimary?: ResourceColor;
    backgroundSecondary?: ResourceColor;
    backgroundTertiary?: ResourceColor;
    backgroundFourth?: ResourceColor;
    backgroundEmphasize?: ResourceColor;
    compForegroundPrimary?: ResourceColor;
    compBackgroundPrimary?: ResourceColor;
    compBackgroundPrimaryTran?: ResourceColor;
    compBackgroundPrimaryContrary?: ResourceColor;
    compBackgroundGray?: ResourceColor;
    compBackgroundSecondary?: ResourceColor;
    compBackgroundTertiary?: ResourceColor;
    compBackgroundEmphasize?: ResourceColor;
    compBackgroundNeutral?: ResourceColor;
    compEmphasizeSecondary?: ResourceColor;
    compEmphasizeTertiary?: ResourceColor;
    compDivider?: ResourceColor;
    compCommonContrary?: ResourceColor;
    compBackgroundFocus?: ResourceColor;
    compFocusedPrimary?: ResourceColor;
    compFocusedSecondary?: ResourceColor;
    compFocusedTertiary?: ResourceColor;
    interactiveHover?: ResourceColor;
    interactivePressed?: ResourceColor;
    interactiveFocus?: ResourceColor;
    interactiveActive?: ResourceColor;
    interactiveSelect?: ResourceColor;
    interactiveClick?: ResourceColor;
}
export declare interface WorkerOptions {
    type?: string;
    name?: string;
    shared?: boolean;
}
export declare interface Event {
    readonly type: string;
    readonly timeStamp: int64;
}
export declare interface ErrorEvent extends Event {
    readonly message: string;
    readonly filename: string;
    readonly lineno: number;
    readonly colno: number;
    readonly error: Object;
}
export declare interface MessageEvents extends Event {
    readonly data: object;
}
export type WorkerEventListener = (event: Event) => void;
export declare interface PostMessageOptions {
    transfer?: Array<Object>;
}
export type RestrictedWorker_onexit_Callback = (code: number) => void;
export type RestrictedWorker_onerror_Callback = (ev: ErrorEvent) => void;
export type RestrictedWorker_onmessage_Callback = (event: MessageEvents) => void;
export declare class RestrictedWorker {
    constructor(scriptURL: string, options: WorkerOptions | undefined)
    onexit?: RestrictedWorker_onexit_Callback;
    onerror?: RestrictedWorker_onerror_Callback;
    onmessage?: RestrictedWorker_onmessage_Callback;
    onmessageerror?: RestrictedWorker_onmessage_Callback;
    postMessage(message: Object, transfer: Array<ArrayBuffer>): void
    postMessage(message: Object, options?: PostMessageOptions): void
    postMessageWithSharedSendable(message: Object, transfer?: Array<ArrayBuffer>): void
    on(Type: string, listener: WorkerEventListener): void
    once(Type: string, listener: WorkerEventListener): void
    off(Type: string, listener?: WorkerEventListener): void
    terminate(): void
    addEventListener(Type: string, listener: WorkerEventListener): void
    dispatchEvent(event: Event): boolean
    removeEventListener(Type: string, callback_?: WorkerEventListener): void
    removeAllListener(): void
    registerGlobalCallObject(instanceName: string, globalCallObject: Object): void
    unregisterGlobalCallObject(instanceName?: string): void
}
export type Callback_StateStylesChange = (currentState: int32) => void;
export declare class StateStylesOps {
    static onStateStyleChange(node: KPointer, stateStyleChange: Callback_StateStylesChange): void
}
export declare class UIContextAtomicServiceBar {
    static getBarRect(): Frame
}
export declare interface BuilderNodeOptions {
    selfIdealSize?: Size;
    type?: number;
    surfaceId?: string;
}
export declare class BuilderNodeOps {
    constructor()
    create(buildFunc: (() => void)): void
    disposeNode(): void
    setUpdateConfigurationCallback(configurationUpdateFunc: (() => void)): void
    setOptions(options: BuilderNodeOptions): void
    postTouchEvent(event: TouchEvent): boolean
    setRootFrameNodeInBuilderNode(node: KPointer): KPointer
}
export declare interface WebHeader {
    headerKey: string;
    headerValue: string;
}
export declare interface SnapshotOptions {
    scale?: number;
    waitUntilRenderFinished?: boolean;
}
export declare class GlobalScope_ohos_arkui_componentSnapshot {
    static get(id: string, callback_: ((result: image.PixelMap) => void), options?: SnapshotOptions): void
}
export enum PerfMonitorActionType {
    LAST_DOWN = 0,
    LAST_UP = 1,
    FIRST_MOVE = 2
}
export enum PerfMonitorSourceType {
    PERF_TOUCH_EVENT = 0,
    PERF_MOUSE_EVENT = 1,
    PERF_TOUCHPAD_EVENT = 2,
    PERF_JOYSTICK_EVENT = 3,
    PERF_KEY_EVENT = 4
}
export declare class GlobalScope_ohos_arkui_performanceMonitor {
    static begin(scene: string, startInputType: PerfMonitorActionType, note?: string): void
    static end(scene: string): void
    static recordInputEventTime(actionType: PerfMonitorActionType, sourceType: PerfMonitorSourceType, time: int64): void
}
export declare class CommonShape {
    offset(offset: Position): CommonShape
    fill(color: ResourceColor): CommonShape
    position(position: Position): CommonShape
}
export declare class BaseShape {
    width(width: Length): BaseShape
    height(height: Length): BaseShape
    size(size: SizeOptions): BaseShape
}
export declare class GlobalScope_ohos_font {
    static registerFont(options: object): void
    static getSystemFontList(): Array<string>
    static getFontByName(fontName: string): object
}
export declare class GlobalScope_ohos_measure_utils {
    static measureText(options: MeasureOptions): number
    static measureTextSize(options: MeasureOptions): SizeOptions
}
export declare interface IndicatorStyle {
    height?: Length;
    width?: Length;
    borderRadius?: Length;
    marginTop?: Length;
    color?: ResourceColor;
    selectedColor?: ResourceColor;
    left?: Length;
    top?: Length;
    right?: Length;
    bottom?: Length;
    size?: Length;
    mask?: boolean;
}
export declare class IUIContext {
    static freezeUINode(id: string, isFrozen: boolean): void
    static freezeUINode(id: number, isFrozen: boolean): void
}
export type CustomNodeBuilder = (parentNode: KPointer) => KPointer;
export type NavExtender_OnUpdateStack = () => void;
export declare class NavExtender {
    static setNavigationOptions(ptr: KPointer, pathStack: NavPathStack): void
    static setUpdateStackCallback(peer: NavPathStack, callback_: NavExtender_OnUpdateStack): void
    static syncStack(peer: NavPathStack): void
    static checkNeedCreate(navigation: KPointer, index: int32): boolean
    static setNavDestinationNode(peer: NavPathStack, index: int32, node: KPointer): void
    static pushPath(pathStack: NavPathStack, info: NavPathInfo, options: NavigationOptions): void
    static replacePath(pathStack: NavPathStack, info: NavPathInfo, options: NavigationOptions): void
    static pop(pathStack: NavPathStack, animated: boolean): string
    static setOnPopCallback(pathStack: NavPathStack, popCallback: ((breakpoints: string) => void)): void
    static getIdByIndex(pathStack: NavPathStack, index: int32): string
    static getIdByName(pathStack: NavPathStack, name: string): Array<string>
    static popToIndex(pathStack: NavPathStack, index: int32, animated: boolean): void
    static popToName(pathStack: NavPathStack, name: string, animated: boolean): number
}
export interface Root {
    attributeModifier(value: AttributeModifier<Root> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkRootStyle implements Root {
    public attributeModifier(value: AttributeModifier<Root> | undefined): this {
        throw new Error("Not implemented")
    }
}
export interface ComponentRoot {
    attributeModifier(value: AttributeModifier<ComponentRoot> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkComponentRootStyle implements ComponentRoot {
    public attributeModifier(value: AttributeModifier<ComponentRoot> | undefined): this {
        throw new Error("Not implemented")
    }
}
export interface CustomBuilderRoot {
    attributeModifier(value: AttributeModifier<CustomBuilderRoot> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCustomBuilderRootStyle implements CustomBuilderRoot {
    public attributeModifier(value: AttributeModifier<CustomBuilderRoot> | undefined): this {
        throw new Error("Not implemented")
    }
}
export type Callback_onMeasureSize_SizeResult = (selfLayoutInfo: GeometryInfo, children: Array<Measurable>, constraint: ConstraintSizeOptions) => SizeResult;
export type Callback_onPlaceChildren_Void = (selfLayoutInfo: GeometryInfo, children: Array<Layoutable>, constraint: ConstraintSizeOptions) => void;
export interface CustomLayoutRoot {
    subscribeOnMeasureSize(value: Callback_onMeasureSize_SizeResult): this {
        throw new Error("Unimplemented method subscribeOnMeasureSize")
    }
    subscribeOnPlaceChildren(value: Callback_onPlaceChildren_Void): this {
        throw new Error("Unimplemented method subscribeOnPlaceChildren")
    }
    attributeModifier(value: AttributeModifier<CustomLayoutRoot> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCustomLayoutRootStyle implements CustomLayoutRoot {
    subscribeOnMeasureSize_value?: Callback_onMeasureSize_SizeResult
    subscribeOnPlaceChildren_value?: Callback_onPlaceChildren_Void
    subscribeOnMeasureSize(value: Callback_onMeasureSize_SizeResult): this {
        return this
    }
    subscribeOnPlaceChildren(value: Callback_onPlaceChildren_Void): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<CustomLayoutRoot> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare class EventEmulator {
    static emitClickEvent(node: KPointer, event: ClickEvent): void
    static emitTextInputEvent(node: KPointer, text: string): void
}
export declare class RenderServiceNode {
    static getNodeId(nodeId: string): int32
}
export declare class ScreenshotService {
    static requestScreenshot(target: string, name: string): boolean
}
export declare interface TransformationMatrix {
    matrix4x4: Array<number>;
}
