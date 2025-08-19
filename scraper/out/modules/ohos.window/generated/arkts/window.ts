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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { window_Rect_serializer, window_WindowProperties_serializer, window_AvoidArea_serializer, window_SystemBarProperties_serializer, window_ScaleOptions_serializer, window_RotateOptions_serializer, window_TranslateOptions_serializer, window_DecorButtonStyle_serializer, TypeChecker, OHOS_WINDOWNativeModule } from "./ohos.window.INTERNAL"
import { AsyncCallback, BusinessError } from "@ohos.base"
import { extractors } from "#handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { default as image } from "@ohos.multimedia.image"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { default as ConfigurationConstant } from "@ohos.app.ability.ConfigurationConstant"
export default window
export namespace window {
    export interface Window {
        hideWithAnimation(callback_: AsyncCallback<void>): void
        hideWithAnimation(): Promise<void>
        showWindow(callback_: AsyncCallback<void>): void
        showWindow(): Promise<void>
        showWithAnimation(callback_: AsyncCallback<void>): void
        showWithAnimation(): Promise<void>
        destroyWindow(callback_: AsyncCallback<void>): void
        destroyWindow(): Promise<void>
        moveWindowTo(x: int32, y: int32): Promise<void>
        moveWindowTo(x: int32, y: int32, callback_: AsyncCallback<void>): void
        resize(width: int32, height: int32): Promise<void>
        resize(width: int32, height: int32, callback_: AsyncCallback<void>): void
        getGlobalRect(): Rect
        getWindowProperties(): WindowProperties
        getWindowAvoidArea(type: AvoidAreaType): AvoidArea
        setWindowLayoutFullScreen(isLayoutFullScreen: boolean): Promise<void>
        setWindowSystemBarEnable(names: Array<string>): Promise<void>
        setSpecificSystemBarEnabled(name: SpecificSystemBar, enable: boolean, enableAnimation: boolean | undefined): Promise<void>
        setWindowSystemBarProperties(systemBarProperties: SystemBarProperties): Promise<void>
        setPreferredOrientation(orientation: Orientation): Promise<void>
        setPreferredOrientation(orientation: Orientation, callback_: AsyncCallback<void>): void
        loadContent(path: string, storage: object, callback_: AsyncCallback<void>): void
        loadContent(path: string, storage: object): Promise<void>
        getUIContext(): UIContext
        setUIContent(path: string, callback_: AsyncCallback<void>): void
        setUIContent(path: string): Promise<void>
        isWindowShowing(): boolean
        onWindowSizeChange(callback_: ((value0: Size) => void)): void
        offWindowSizeChange(callback_: ((value0: Size) => void) | undefined): void
        onAvoidAreaChange(callback_: ((value0: AvoidAreaOptions) => void)): void
        offAvoidAreaChange(callback_: ((value0: AvoidAreaOptions) => void) | undefined): void
        onKeyboardHeightChange(callback_: ((value0: int32) => void)): void
        offKeyboardHeightChange(callback_: ((value0: int32) => void) | undefined): void
        onKeyboardDidShow(callback_: ((value0: KeyboardInfo) => void)): void
        offKeyboardDidShow(callback_: ((value0: KeyboardInfo) => void) | undefined): void
        onKeyboardDidHide(callback_: ((value0: KeyboardInfo) => void)): void
        offKeyboardDidHide(callback_: ((value0: KeyboardInfo) => void) | undefined): void
        onTouchOutside(callback_: (() => void)): void
        offTouchOutside(callback_: (() => void) | undefined): void
        onDisplayIdChange(callback_: ((value0: int64) => void)): void
        offDisplayIdChange(callback_: ((value0: int64) => void) | undefined): void
        onWindowVisibilityChange(callback_: ((value0: boolean) => void)): void
        offWindowVisibilityChange(callback_: ((value0: boolean) => void) | undefined): void
        onSystemDensityChange(callback_: ((value0: double) => void)): void
        offSystemDensityChange(callback_: ((value0: double) => void) | undefined): void
        onNoInteractionDetected(timeout: int64, callback_: (() => void)): void
        offNoInteractionDetected(callback_: (() => void) | undefined): void
        onScreenshot(callback_: (() => void)): void
        offScreenshot(callback_: (() => void) | undefined): void
        onDialogTargetTouch(callback_: (() => void)): void
        offDialogTargetTouch(callback_: (() => void) | undefined): void
        onWindowEvent(callback_: ((value0: WindowEventType) => void)): void
        offWindowEvent(callback_: ((value0: WindowEventType) => void) | undefined): void
        onWindowStatusChange(callback_: ((value0: WindowStatusType) => void)): void
        offWindowStatusChange(callback_: ((value0: WindowStatusType) => void) | undefined): void
        onSubWindowClose(callback_: (() => void)): void
        offSubWindowClose(callback_: (() => void) | undefined): void
        onWindowWillClose(callback_: (() => Promise<boolean>)): void
        offWindowWillClose(callback_: (() => Promise<boolean>) | undefined): void
        onWindowHighlightChange(callback_: ((value0: boolean) => void)): void
        offWindowHighlightChange(callback_: ((value0: boolean) => void) | undefined): void
        isWindowSupportWideGamut(): Promise<boolean>
        isWindowSupportWideGamut(callback_: AsyncCallback<boolean>): void
        setWindowColorSpace(colorSpace: ColorSpace): Promise<void>
        setWindowColorSpace(colorSpace: ColorSpace, callback_: AsyncCallback<void>): void
        setWindowBackgroundColor(color: string | object): void
        setWindowFocusable(isFocusable: boolean): Promise<void>
        setWindowFocusable(isFocusable: boolean, callback_: AsyncCallback<void>): void
        setWindowKeepScreenOn(isKeepScreenOn: boolean): Promise<void>
        setWindowKeepScreenOn(isKeepScreenOn: boolean, callback_: AsyncCallback<void>): void
        setWindowPrivacyMode(isPrivacyMode: boolean): Promise<void>
        setWindowPrivacyMode(isPrivacyMode: boolean, callback_: AsyncCallback<void>): void
        setWindowTouchable(isTouchable: boolean): Promise<void>
        setWindowTouchable(isTouchable: boolean, callback_: AsyncCallback<void>): void
        snapshot(callback_: AsyncCallback<image.PixelMap>): void
        snapshot(): Promise<image.PixelMap>
        opacity(opacity: double): void
        scale(scaleOptions: ScaleOptions): void
        rotate(rotateOptions: RotateOptions): void
        translate(translateOptions: TranslateOptions): void
        setShadow(radius: double, color: string | undefined, offsetX: double | undefined, offsetY: double | undefined): void
        setWaterMarkFlag(enable: boolean, callback_: AsyncCallback<void>): void
        setWaterMarkFlag(enable: boolean): Promise<void>
        minimize(callback_: AsyncCallback<void>): void
        minimize(): Promise<void>
        maximize(presentation: MaximizePresentation | undefined): Promise<void>
        hideNonSystemFloatingWindows(shouldHide: boolean, callback_: AsyncCallback<void>): void
        hideNonSystemFloatingWindows(shouldHide: boolean): Promise<void>
        keepKeyboardOnFocus(keepKeyboardFlag: boolean): void
        recover(): Promise<void>
        setWindowDecorVisible(isVisible: boolean): void
        setWindowDecorHeight(height: int32): void
        getWindowDecorHeight(): int32
        setDecorButtonStyle(dectorStyle: DecorButtonStyle): void
        setWindowTitleButtonVisible(isMaximizeButtonVisible: boolean, isMinimizeButtonVisible: boolean, isCloseButtonVisible: boolean | undefined): void
        startMoving(): Promise<void>
        startMoving(offsetX: int32, offsetY: int32): Promise<void>
        onWindowTitleButtonRectChange(callback_: ((value0: TitleButtonRect) => void)): void
        offWindowTitleButtonRectChange(callback_: ((value0: TitleButtonRect) => void) | undefined): void
        onWindowRectChange(callback_: ((value0: RectChangeOptions) => void)): void
        offWindowRectChange(callback_: ((value0: RectChangeOptions) => void) | undefined): void
        setImmersiveModeEnabledState(enabled: boolean): void
        getWindowStatus(): WindowStatusType
    }
    export class WindowInternal implements MaterializedBase,Window {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WindowInternal.getFinalizer())
        }
        constructor() {
            this(WindowInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WINDOWNativeModule._window_Window_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WINDOWNativeModule._window_Window_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): WindowInternal {
            return new WindowInternal(ptr)
        }
        public hideWithAnimation(callback_: AsyncCallback<void>): void {
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.hideWithAnimation0_serialize(callback__casted)
            return
        }
        public hideWithAnimation(): Promise<void> {
            return this.hideWithAnimation1_serialize()
        }
        public showWindow(callback_: AsyncCallback<void>): void {
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.showWindow0_serialize(callback__casted)
            return
        }
        public showWindow(): Promise<void> {
            return this.showWindow1_serialize()
        }
        public showWithAnimation(callback_: AsyncCallback<void>): void {
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.showWithAnimation0_serialize(callback__casted)
            return
        }
        public showWithAnimation(): Promise<void> {
            return this.showWithAnimation1_serialize()
        }
        public destroyWindow(callback_: AsyncCallback<void>): void {
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.destroyWindow0_serialize(callback__casted)
            return
        }
        public destroyWindow(): Promise<void> {
            return this.destroyWindow1_serialize()
        }
        public moveWindowTo(x: int32, y: int32): Promise<void> {
            const x_casted = x as (int32)
            const y_casted = y as (int32)
            return this.moveWindowTo0_serialize(x_casted, y_casted)
        }
        public moveWindowTo(x: int32, y: int32, callback_: AsyncCallback<void>): void {
            const x_casted = x as (int32)
            const y_casted = y as (int32)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.moveWindowTo1_serialize(x_casted, y_casted, callback__casted)
            return
        }
        public resize(width: int32, height: int32): Promise<void> {
            const width_casted = width as (int32)
            const height_casted = height as (int32)
            return this.resize0_serialize(width_casted, height_casted)
        }
        public resize(width: int32, height: int32, callback_: AsyncCallback<void>): void {
            const width_casted = width as (int32)
            const height_casted = height as (int32)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.resize1_serialize(width_casted, height_casted, callback__casted)
            return
        }
        public getGlobalRect(): Rect {
            return this.getGlobalRect_serialize()
        }
        public getWindowProperties(): WindowProperties {
            return this.getWindowProperties_serialize()
        }
        public getWindowAvoidArea(type: AvoidAreaType): AvoidArea {
            const type_casted = type as (AvoidAreaType)
            return this.getWindowAvoidArea_serialize(type_casted)
        }
        public setWindowLayoutFullScreen(isLayoutFullScreen: boolean): Promise<void> {
            const isLayoutFullScreen_casted = isLayoutFullScreen as (boolean)
            return this.setWindowLayoutFullScreen_serialize(isLayoutFullScreen_casted)
        }
        public setWindowSystemBarEnable(names: Array<string>): Promise<void> {
            const names_casted = names as (Array<string>)
            return this.setWindowSystemBarEnable_serialize(names_casted)
        }
        public setSpecificSystemBarEnabled(name: SpecificSystemBar, enable: boolean, enableAnimation?: boolean): Promise<void> {
            const name_casted = name as (SpecificSystemBar)
            const enable_casted = enable as (boolean)
            const enableAnimation_casted = enableAnimation as (boolean | undefined)
            return this.setSpecificSystemBarEnabled_serialize(name_casted, enable_casted, enableAnimation_casted)
        }
        public setWindowSystemBarProperties(systemBarProperties: SystemBarProperties): Promise<void> {
            const systemBarProperties_casted = systemBarProperties as (SystemBarProperties)
            return this.setWindowSystemBarProperties_serialize(systemBarProperties_casted)
        }
        public setPreferredOrientation(orientation: Orientation): Promise<void> {
            const orientation_casted = orientation as (Orientation)
            return this.setPreferredOrientation0_serialize(orientation_casted)
        }
        public setPreferredOrientation(orientation: Orientation, callback_: AsyncCallback<void>): void {
            const orientation_casted = orientation as (Orientation)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setPreferredOrientation1_serialize(orientation_casted, callback__casted)
            return
        }
        public loadContent(path: string, storage: object, callback_: AsyncCallback<void>): void {
            const path_casted = path as (string)
            const storage_casted = storage as (object)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.loadContent0_serialize(path_casted, storage_casted, callback__casted)
            return
        }
        public loadContent(path: string, storage: object): Promise<void> {
            const path_casted = path as (string)
            const storage_casted = storage as (object)
            return this.loadContent1_serialize(path_casted, storage_casted)
        }
        public getUIContext(): UIContext {
            return this.getUIContext_serialize()
        }
        public setUIContent(path: string, callback_: AsyncCallback<void>): void {
            const path_casted = path as (string)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setUIContent0_serialize(path_casted, callback__casted)
            return
        }
        public setUIContent(path: string): Promise<void> {
            const path_casted = path as (string)
            return this.setUIContent1_serialize(path_casted)
        }
        public isWindowShowing(): boolean {
            return this.isWindowShowing_serialize()
        }
        public onWindowSizeChange(callback_: ((value0: Size) => void)): void {
            const callback__casted = callback_ as (((value0: Size) => void))
            this.onWindowSizeChange_serialize(callback__casted)
            return
        }
        public offWindowSizeChange(callback_?: ((value0: Size) => void)): void {
            const callback__casted = callback_ as (((value0: Size) => void) | undefined)
            this.offWindowSizeChange_serialize(callback__casted)
            return
        }
        public onAvoidAreaChange(callback_: ((value0: AvoidAreaOptions) => void)): void {
            const callback__casted = callback_ as (((value0: AvoidAreaOptions) => void))
            this.onAvoidAreaChange_serialize(callback__casted)
            return
        }
        public offAvoidAreaChange(callback_?: ((value0: AvoidAreaOptions) => void)): void {
            const callback__casted = callback_ as (((value0: AvoidAreaOptions) => void) | undefined)
            this.offAvoidAreaChange_serialize(callback__casted)
            return
        }
        public onKeyboardHeightChange(callback_: ((value0: int32) => void)): void {
            const callback__casted = callback_ as (((value0: int32) => void))
            this.onKeyboardHeightChange_serialize(callback__casted)
            return
        }
        public offKeyboardHeightChange(callback_?: ((value0: int32) => void)): void {
            const callback__casted = callback_ as (((value0: int32) => void) | undefined)
            this.offKeyboardHeightChange_serialize(callback__casted)
            return
        }
        public onKeyboardDidShow(callback_: ((value0: KeyboardInfo) => void)): void {
            const callback__casted = callback_ as (((value0: KeyboardInfo) => void))
            this.onKeyboardDidShow_serialize(callback__casted)
            return
        }
        public offKeyboardDidShow(callback_?: ((value0: KeyboardInfo) => void)): void {
            const callback__casted = callback_ as (((value0: KeyboardInfo) => void) | undefined)
            this.offKeyboardDidShow_serialize(callback__casted)
            return
        }
        public onKeyboardDidHide(callback_: ((value0: KeyboardInfo) => void)): void {
            const callback__casted = callback_ as (((value0: KeyboardInfo) => void))
            this.onKeyboardDidHide_serialize(callback__casted)
            return
        }
        public offKeyboardDidHide(callback_?: ((value0: KeyboardInfo) => void)): void {
            const callback__casted = callback_ as (((value0: KeyboardInfo) => void) | undefined)
            this.offKeyboardDidHide_serialize(callback__casted)
            return
        }
        public onTouchOutside(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onTouchOutside_serialize(callback__casted)
            return
        }
        public offTouchOutside(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offTouchOutside_serialize(callback__casted)
            return
        }
        public onDisplayIdChange(callback_: ((value0: int64) => void)): void {
            const callback__casted = callback_ as (((value0: int64) => void))
            this.onDisplayIdChange_serialize(callback__casted)
            return
        }
        public offDisplayIdChange(callback_?: ((value0: int64) => void)): void {
            const callback__casted = callback_ as (((value0: int64) => void) | undefined)
            this.offDisplayIdChange_serialize(callback__casted)
            return
        }
        public onWindowVisibilityChange(callback_: ((value0: boolean) => void)): void {
            const callback__casted = callback_ as (((value0: boolean) => void))
            this.onWindowVisibilityChange_serialize(callback__casted)
            return
        }
        public offWindowVisibilityChange(callback_?: ((value0: boolean) => void)): void {
            const callback__casted = callback_ as (((value0: boolean) => void) | undefined)
            this.offWindowVisibilityChange_serialize(callback__casted)
            return
        }
        public onSystemDensityChange(callback_: ((value0: double) => void)): void {
            const callback__casted = callback_ as (((value0: double) => void))
            this.onSystemDensityChange_serialize(callback__casted)
            return
        }
        public offSystemDensityChange(callback_?: ((value0: double) => void)): void {
            const callback__casted = callback_ as (((value0: double) => void) | undefined)
            this.offSystemDensityChange_serialize(callback__casted)
            return
        }
        public onNoInteractionDetected(timeout: int64, callback_: (() => void)): void {
            const timeout_casted = timeout as (int64)
            const callback__casted = callback_ as ((() => void))
            this.onNoInteractionDetected_serialize(timeout_casted, callback__casted)
            return
        }
        public offNoInteractionDetected(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offNoInteractionDetected_serialize(callback__casted)
            return
        }
        public onScreenshot(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onScreenshot_serialize(callback__casted)
            return
        }
        public offScreenshot(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offScreenshot_serialize(callback__casted)
            return
        }
        public onDialogTargetTouch(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onDialogTargetTouch_serialize(callback__casted)
            return
        }
        public offDialogTargetTouch(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offDialogTargetTouch_serialize(callback__casted)
            return
        }
        public onWindowEvent(callback_: ((value0: WindowEventType) => void)): void {
            const callback__casted = callback_ as (((value0: WindowEventType) => void))
            this.onWindowEvent_serialize(callback__casted)
            return
        }
        public offWindowEvent(callback_?: ((value0: WindowEventType) => void)): void {
            const callback__casted = callback_ as (((value0: WindowEventType) => void) | undefined)
            this.offWindowEvent_serialize(callback__casted)
            return
        }
        public onWindowStatusChange(callback_: ((value0: WindowStatusType) => void)): void {
            const callback__casted = callback_ as (((value0: WindowStatusType) => void))
            this.onWindowStatusChange_serialize(callback__casted)
            return
        }
        public offWindowStatusChange(callback_?: ((value0: WindowStatusType) => void)): void {
            const callback__casted = callback_ as (((value0: WindowStatusType) => void) | undefined)
            this.offWindowStatusChange_serialize(callback__casted)
            return
        }
        public onSubWindowClose(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onSubWindowClose_serialize(callback__casted)
            return
        }
        public offSubWindowClose(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offSubWindowClose_serialize(callback__casted)
            return
        }
        public onWindowWillClose(callback_: (() => Promise<boolean>)): void {
            const callback__casted = callback_ as ((() => Promise<boolean>))
            this.onWindowWillClose_serialize(callback__casted)
            return
        }
        public offWindowWillClose(callback_?: (() => Promise<boolean>)): void {
            const callback__casted = callback_ as ((() => Promise<boolean>) | undefined)
            this.offWindowWillClose_serialize(callback__casted)
            return
        }
        public onWindowHighlightChange(callback_: ((value0: boolean) => void)): void {
            const callback__casted = callback_ as (((value0: boolean) => void))
            this.onWindowHighlightChange_serialize(callback__casted)
            return
        }
        public offWindowHighlightChange(callback_?: ((value0: boolean) => void)): void {
            const callback__casted = callback_ as (((value0: boolean) => void) | undefined)
            this.offWindowHighlightChange_serialize(callback__casted)
            return
        }
        public isWindowSupportWideGamut(): Promise<boolean> {
            return this.isWindowSupportWideGamut0_serialize()
        }
        public isWindowSupportWideGamut(callback_: AsyncCallback<boolean>): void {
            const callback__casted = callback_ as (AsyncCallback<boolean>)
            this.isWindowSupportWideGamut1_serialize(callback__casted)
            return
        }
        public setWindowColorSpace(colorSpace: ColorSpace): Promise<void> {
            const colorSpace_casted = colorSpace as (ColorSpace)
            return this.setWindowColorSpace0_serialize(colorSpace_casted)
        }
        public setWindowColorSpace(colorSpace: ColorSpace, callback_: AsyncCallback<void>): void {
            const colorSpace_casted = colorSpace as (ColorSpace)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setWindowColorSpace1_serialize(colorSpace_casted, callback__casted)
            return
        }
        public setWindowBackgroundColor(color: string | object): void {
            const color_casted = color as (string | object)
            this.setWindowBackgroundColor_serialize(color_casted)
            return
        }
        public setWindowFocusable(isFocusable: boolean): Promise<void> {
            const isFocusable_casted = isFocusable as (boolean)
            return this.setWindowFocusable0_serialize(isFocusable_casted)
        }
        public setWindowFocusable(isFocusable: boolean, callback_: AsyncCallback<void>): void {
            const isFocusable_casted = isFocusable as (boolean)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setWindowFocusable1_serialize(isFocusable_casted, callback__casted)
            return
        }
        public setWindowKeepScreenOn(isKeepScreenOn: boolean): Promise<void> {
            const isKeepScreenOn_casted = isKeepScreenOn as (boolean)
            return this.setWindowKeepScreenOn0_serialize(isKeepScreenOn_casted)
        }
        public setWindowKeepScreenOn(isKeepScreenOn: boolean, callback_: AsyncCallback<void>): void {
            const isKeepScreenOn_casted = isKeepScreenOn as (boolean)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setWindowKeepScreenOn1_serialize(isKeepScreenOn_casted, callback__casted)
            return
        }
        public setWindowPrivacyMode(isPrivacyMode: boolean): Promise<void> {
            const isPrivacyMode_casted = isPrivacyMode as (boolean)
            return this.setWindowPrivacyMode0_serialize(isPrivacyMode_casted)
        }
        public setWindowPrivacyMode(isPrivacyMode: boolean, callback_: AsyncCallback<void>): void {
            const isPrivacyMode_casted = isPrivacyMode as (boolean)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setWindowPrivacyMode1_serialize(isPrivacyMode_casted, callback__casted)
            return
        }
        public setWindowTouchable(isTouchable: boolean): Promise<void> {
            const isTouchable_casted = isTouchable as (boolean)
            return this.setWindowTouchable0_serialize(isTouchable_casted)
        }
        public setWindowTouchable(isTouchable: boolean, callback_: AsyncCallback<void>): void {
            const isTouchable_casted = isTouchable as (boolean)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setWindowTouchable1_serialize(isTouchable_casted, callback__casted)
            return
        }
        public snapshot(callback_: AsyncCallback<image.PixelMap>): void {
            const callback__casted = callback_ as (AsyncCallback<image.PixelMap>)
            this.snapshot0_serialize(callback__casted)
            return
        }
        public snapshot(): Promise<image.PixelMap> {
            return this.snapshot1_serialize()
        }
        public opacity(opacity: double): void {
            const opacity_casted = opacity as (double)
            this.opacity_serialize(opacity_casted)
            return
        }
        public scale(scaleOptions: ScaleOptions): void {
            const scaleOptions_casted = scaleOptions as (ScaleOptions)
            this.scale_serialize(scaleOptions_casted)
            return
        }
        public rotate(rotateOptions: RotateOptions): void {
            const rotateOptions_casted = rotateOptions as (RotateOptions)
            this.rotate_serialize(rotateOptions_casted)
            return
        }
        public translate(translateOptions: TranslateOptions): void {
            const translateOptions_casted = translateOptions as (TranslateOptions)
            this.translate_serialize(translateOptions_casted)
            return
        }
        public setShadow(radius: double, color?: string, offsetX?: double, offsetY?: double): void {
            const radius_casted = radius as (double)
            const color_casted = color as (string | undefined)
            const offsetX_casted = offsetX as (double | undefined)
            const offsetY_casted = offsetY as (double | undefined)
            this.setShadow_serialize(radius_casted, color_casted, offsetX_casted, offsetY_casted)
            return
        }
        public setWaterMarkFlag(enable: boolean, callback_: AsyncCallback<void>): void {
            const enable_casted = enable as (boolean)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.setWaterMarkFlag0_serialize(enable_casted, callback__casted)
            return
        }
        public setWaterMarkFlag(enable: boolean): Promise<void> {
            const enable_casted = enable as (boolean)
            return this.setWaterMarkFlag1_serialize(enable_casted)
        }
        public minimize(callback_: AsyncCallback<void>): void {
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.minimize0_serialize(callback__casted)
            return
        }
        public minimize(): Promise<void> {
            return this.minimize1_serialize()
        }
        public maximize(presentation?: MaximizePresentation): Promise<void> {
            const presentation_casted = presentation as (MaximizePresentation | undefined)
            return this.maximize_serialize(presentation_casted)
        }
        public hideNonSystemFloatingWindows(shouldHide: boolean, callback_: AsyncCallback<void>): void {
            const shouldHide_casted = shouldHide as (boolean)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.hideNonSystemFloatingWindows0_serialize(shouldHide_casted, callback__casted)
            return
        }
        public hideNonSystemFloatingWindows(shouldHide: boolean): Promise<void> {
            const shouldHide_casted = shouldHide as (boolean)
            return this.hideNonSystemFloatingWindows1_serialize(shouldHide_casted)
        }
        public keepKeyboardOnFocus(keepKeyboardFlag: boolean): void {
            const keepKeyboardFlag_casted = keepKeyboardFlag as (boolean)
            this.keepKeyboardOnFocus_serialize(keepKeyboardFlag_casted)
            return
        }
        public recover(): Promise<void> {
            return this.recover_serialize()
        }
        public setWindowDecorVisible(isVisible: boolean): void {
            const isVisible_casted = isVisible as (boolean)
            this.setWindowDecorVisible_serialize(isVisible_casted)
            return
        }
        public setWindowDecorHeight(height: int32): void {
            const height_casted = height as (int32)
            this.setWindowDecorHeight_serialize(height_casted)
            return
        }
        public getWindowDecorHeight(): int32 {
            return this.getWindowDecorHeight_serialize()
        }
        public setDecorButtonStyle(dectorStyle: DecorButtonStyle): void {
            const dectorStyle_casted = dectorStyle as (DecorButtonStyle)
            this.setDecorButtonStyle_serialize(dectorStyle_casted)
            return
        }
        public setWindowTitleButtonVisible(isMaximizeButtonVisible: boolean, isMinimizeButtonVisible: boolean, isCloseButtonVisible?: boolean): void {
            const isMaximizeButtonVisible_casted = isMaximizeButtonVisible as (boolean)
            const isMinimizeButtonVisible_casted = isMinimizeButtonVisible as (boolean)
            const isCloseButtonVisible_casted = isCloseButtonVisible as (boolean | undefined)
            this.setWindowTitleButtonVisible_serialize(isMaximizeButtonVisible_casted, isMinimizeButtonVisible_casted, isCloseButtonVisible_casted)
            return
        }
        public startMoving(): Promise<void> {
            return this.startMoving0_serialize()
        }
        public startMoving(offsetX: int32, offsetY: int32): Promise<void> {
            const offsetX_casted = offsetX as (int32)
            const offsetY_casted = offsetY as (int32)
            return this.startMoving1_serialize(offsetX_casted, offsetY_casted)
        }
        public onWindowTitleButtonRectChange(callback_: ((value0: TitleButtonRect) => void)): void {
            const callback__casted = callback_ as (((value0: TitleButtonRect) => void))
            this.onWindowTitleButtonRectChange_serialize(callback__casted)
            return
        }
        public offWindowTitleButtonRectChange(callback_?: ((value0: TitleButtonRect) => void)): void {
            const callback__casted = callback_ as (((value0: TitleButtonRect) => void) | undefined)
            this.offWindowTitleButtonRectChange_serialize(callback__casted)
            return
        }
        public onWindowRectChange(callback_: ((value0: RectChangeOptions) => void)): void {
            const callback__casted = callback_ as (((value0: RectChangeOptions) => void))
            this.onWindowRectChange_serialize(callback__casted)
            return
        }
        public offWindowRectChange(callback_?: ((value0: RectChangeOptions) => void)): void {
            const callback__casted = callback_ as (((value0: RectChangeOptions) => void) | undefined)
            this.offWindowRectChange_serialize(callback__casted)
            return
        }
        public setImmersiveModeEnabledState(enabled: boolean): void {
            const enabled_casted = enabled as (boolean)
            this.setImmersiveModeEnabledState_serialize(enabled_casted)
            return
        }
        public getWindowStatus(): WindowStatusType {
            return this.getWindowStatus_serialize()
        }
        on(type: string, callback_: ((value0: Size) => void)): void {
            throw new Error("Improve")
        }
        off(type: string, callback_: ((value0: Size) => void)): void {
            throw new Error("Improve")
        }
        hideWithAnimation0_serialize(callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_hideWithAnimation0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        hideWithAnimation1_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_hideWithAnimation1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        showWindow0_serialize(callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_showWindow0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        showWindow1_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_showWindow1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        showWithAnimation0_serialize(callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_showWithAnimation0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        showWithAnimation1_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_showWithAnimation1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        destroyWindow0_serialize(callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_destroyWindow0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        destroyWindow1_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_destroyWindow1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        moveWindowTo0_serialize(x: int32, y: int32): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_moveWindowTo0(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        moveWindowTo1_serialize(x: int32, y: int32, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_moveWindowTo1(this.peer!.ptr, x, y, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        resize0_serialize(width: int32, height: int32): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_resize0(this.peer!.ptr, width, height, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        resize1_serialize(width: int32, height: int32, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_resize1(this.peer!.ptr, width, height, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getGlobalRect_serialize(): Rect {
            const retval  = OHOS_WINDOWNativeModule._window_Window_getGlobalRect(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : Rect = window_Rect_serializer.read(retvalDeserializer)
            return returnResult
        }
        getWindowProperties_serialize(): WindowProperties {
            const retval  = OHOS_WINDOWNativeModule._window_Window_getWindowProperties(this.peer!.ptr)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : WindowProperties = window_WindowProperties_serializer.read(retvalDeserializer)
            return returnResult
        }
        getWindowAvoidArea_serialize(type: AvoidAreaType): AvoidArea {
            const retval  = OHOS_WINDOWNativeModule._window_Window_getWindowAvoidArea(this.peer!.ptr, TypeChecker.window_AvoidAreaType_ToNumeric(type))
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const returnResult : AvoidArea = window_AvoidArea_serializer.read(retvalDeserializer)
            return returnResult
        }
        setWindowLayoutFullScreen_serialize(isLayoutFullScreen: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowLayoutFullScreen(this.peer!.ptr, isLayoutFullScreen ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowSystemBarEnable_serialize(names: Array<string>): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((names.length).toInt())
            for (let namesCounterI = 0; namesCounterI < names.length; namesCounterI++) {
                const namesTmpElement : string = names[namesCounterI]
                thisSerializer.writeString(namesTmpElement)
            }
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowSystemBarEnable(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setSpecificSystemBarEnabled_serialize(name: SpecificSystemBar, enable: boolean, enableAnimation?: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (enableAnimation !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const enableAnimationTmpValue  = enableAnimation!
                thisSerializer.writeBoolean(enableAnimationTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setSpecificSystemBarEnabled(this.peer!.ptr, name, enable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowSystemBarProperties_serialize(systemBarProperties: SystemBarProperties): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            window_SystemBarProperties_serializer.write(thisSerializer, systemBarProperties)
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowSystemBarProperties(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setPreferredOrientation0_serialize(orientation: Orientation): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setPreferredOrientation0(this.peer!.ptr, TypeChecker.window_Orientation_ToNumeric(orientation), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setPreferredOrientation1_serialize(orientation: Orientation, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setPreferredOrientation1(this.peer!.ptr, TypeChecker.window_Orientation_ToNumeric(orientation), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadContent0_serialize(path: string, storage: object, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeCustomObject('object', storage)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_loadContent0(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadContent1_serialize(path: string, storage: object): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeCustomObject('object', storage)
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_loadContent1(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getUIContext_serialize(): UIContext {
            const retval  = OHOS_WINDOWNativeModule._window_Window_getUIContext(this.peer!.ptr)
            const obj : UIContext = extractors.fromUIContextPtr(retval)
            return obj
        }
        setUIContent0_serialize(path: string, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setUIContent0(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setUIContent1_serialize(path: string): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setUIContent1(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        isWindowShowing_serialize(): boolean {
            const retval  = OHOS_WINDOWNativeModule._window_Window_isWindowShowing(this.peer!.ptr)
            return retval
        }
        onWindowSizeChange_serialize(callback_: ((value0: Size) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowSizeChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowSizeChange_serialize(callback_?: ((value0: Size) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowSizeChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onAvoidAreaChange_serialize(callback_: ((value0: AvoidAreaOptions) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onAvoidAreaChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offAvoidAreaChange_serialize(callback_?: ((value0: AvoidAreaOptions) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offAvoidAreaChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onKeyboardHeightChange_serialize(callback_: ((value0: int32) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onKeyboardHeightChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offKeyboardHeightChange_serialize(callback_?: ((value0: int32) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offKeyboardHeightChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onKeyboardDidShow_serialize(callback_: ((value0: KeyboardInfo) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onKeyboardDidShow(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offKeyboardDidShow_serialize(callback_?: ((value0: KeyboardInfo) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offKeyboardDidShow(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onKeyboardDidHide_serialize(callback_: ((value0: KeyboardInfo) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onKeyboardDidHide(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offKeyboardDidHide_serialize(callback_?: ((value0: KeyboardInfo) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offKeyboardDidHide(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onTouchOutside_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onTouchOutside(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offTouchOutside_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offTouchOutside(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onDisplayIdChange_serialize(callback_: ((value0: int64) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onDisplayIdChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offDisplayIdChange_serialize(callback_?: ((value0: int64) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offDisplayIdChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onWindowVisibilityChange_serialize(callback_: ((value0: boolean) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowVisibilityChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowVisibilityChange_serialize(callback_?: ((value0: boolean) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowVisibilityChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onSystemDensityChange_serialize(callback_: ((value0: double) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onSystemDensityChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offSystemDensityChange_serialize(callback_?: ((value0: double) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offSystemDensityChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onNoInteractionDetected_serialize(timeout: int64, callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onNoInteractionDetected(this.peer!.ptr, timeout, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offNoInteractionDetected_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offNoInteractionDetected(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onScreenshot_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onScreenshot(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offScreenshot_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offScreenshot(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onDialogTargetTouch_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onDialogTargetTouch(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offDialogTargetTouch_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offDialogTargetTouch(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onWindowEvent_serialize(callback_: ((value0: WindowEventType) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowEvent_serialize(callback_?: ((value0: WindowEventType) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onWindowStatusChange_serialize(callback_: ((value0: WindowStatusType) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowStatusChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowStatusChange_serialize(callback_?: ((value0: WindowStatusType) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowStatusChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onSubWindowClose_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onSubWindowClose(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offSubWindowClose_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offSubWindowClose(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onWindowWillClose_serialize(callback_: (() => Promise<boolean>)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowWillClose(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowWillClose_serialize(callback_?: (() => Promise<boolean>)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowWillClose(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onWindowHighlightChange_serialize(callback_: ((value0: boolean) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowHighlightChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowHighlightChange_serialize(callback_?: ((value0: boolean) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowHighlightChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        isWindowSupportWideGamut0_serialize(): Promise<boolean> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<boolean>()[0]
            OHOS_WINDOWNativeModule._window_Window_isWindowSupportWideGamut0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        isWindowSupportWideGamut1_serialize(callback_: AsyncCallback<boolean>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_isWindowSupportWideGamut1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWindowColorSpace0_serialize(colorSpace: ColorSpace): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowColorSpace0(this.peer!.ptr, TypeChecker.window_ColorSpace_ToNumeric(colorSpace), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowColorSpace1_serialize(colorSpace: ColorSpace, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setWindowColorSpace1(this.peer!.ptr, TypeChecker.window_ColorSpace_ToNumeric(colorSpace), thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWindowBackgroundColor_serialize(color: string | object): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (color instanceof string) {
                thisSerializer.writeInt8((0).toChar())
                const colorForIdx0  = color as string
                thisSerializer.writeString(colorForIdx0)
            } else if (color instanceof object) {
                thisSerializer.writeInt8((1).toChar())
                const colorForIdx1  = color as object
                thisSerializer.writeCustomObject('object', colorForIdx1)
            }
            OHOS_WINDOWNativeModule._window_Window_setWindowBackgroundColor(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWindowFocusable0_serialize(isFocusable: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowFocusable0(this.peer!.ptr, isFocusable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowFocusable1_serialize(isFocusable: boolean, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setWindowFocusable1(this.peer!.ptr, isFocusable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWindowKeepScreenOn0_serialize(isKeepScreenOn: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowKeepScreenOn0(this.peer!.ptr, isKeepScreenOn ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowKeepScreenOn1_serialize(isKeepScreenOn: boolean, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setWindowKeepScreenOn1(this.peer!.ptr, isKeepScreenOn ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWindowPrivacyMode0_serialize(isPrivacyMode: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowPrivacyMode0(this.peer!.ptr, isPrivacyMode ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowPrivacyMode1_serialize(isPrivacyMode: boolean, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setWindowPrivacyMode1(this.peer!.ptr, isPrivacyMode ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWindowTouchable0_serialize(isTouchable: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWindowTouchable0(this.peer!.ptr, isTouchable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowTouchable1_serialize(isTouchable: boolean, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setWindowTouchable1(this.peer!.ptr, isTouchable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        snapshot0_serialize(callback_: AsyncCallback<image.PixelMap>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_snapshot0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        snapshot1_serialize(): Promise<image.PixelMap> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<image.PixelMap>()[0]
            OHOS_WINDOWNativeModule._window_Window_snapshot1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        opacity_serialize(opacity: double): void {
            OHOS_WINDOWNativeModule._window_Window_opacity(this.peer!.ptr, opacity)
        }
        scale_serialize(scaleOptions: ScaleOptions): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            window_ScaleOptions_serializer.write(thisSerializer, scaleOptions)
            OHOS_WINDOWNativeModule._window_Window_scale(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        rotate_serialize(rotateOptions: RotateOptions): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            window_RotateOptions_serializer.write(thisSerializer, rotateOptions)
            OHOS_WINDOWNativeModule._window_Window_rotate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        translate_serialize(translateOptions: TranslateOptions): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            window_TranslateOptions_serializer.write(thisSerializer, translateOptions)
            OHOS_WINDOWNativeModule._window_Window_translate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setShadow_serialize(radius: double, color?: string, offsetX?: double, offsetY?: double): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (color !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const colorTmpValue  = color!
                thisSerializer.writeString(colorTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (offsetX !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const offsetXTmpValue  = offsetX!
                thisSerializer.writeFloat64(offsetXTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (offsetY !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const offsetYTmpValue  = offsetY!
                thisSerializer.writeFloat64(offsetYTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_setShadow(this.peer!.ptr, radius, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWaterMarkFlag0_serialize(enable: boolean, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_setWaterMarkFlag0(this.peer!.ptr, enable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWaterMarkFlag1_serialize(enable: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_setWaterMarkFlag1(this.peer!.ptr, enable ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        minimize0_serialize(callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_minimize0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        minimize1_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_minimize1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        maximize_serialize(presentation?: MaximizePresentation): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (presentation !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const presentationTmpValue  = (presentation as window.MaximizePresentation)
                thisSerializer.writeInt32(TypeChecker.window_MaximizePresentation_ToNumeric(presentationTmpValue))
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_maximize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        hideNonSystemFloatingWindows0_serialize(shouldHide: boolean, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_hideNonSystemFloatingWindows0(this.peer!.ptr, shouldHide ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        hideNonSystemFloatingWindows1_serialize(shouldHide: boolean): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_hideNonSystemFloatingWindows1(this.peer!.ptr, shouldHide ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        keepKeyboardOnFocus_serialize(keepKeyboardFlag: boolean): void {
            OHOS_WINDOWNativeModule._window_Window_keepKeyboardOnFocus(this.peer!.ptr, keepKeyboardFlag ? 1 : 0)
        }
        recover_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_recover(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        setWindowDecorVisible_serialize(isVisible: boolean): void {
            OHOS_WINDOWNativeModule._window_Window_setWindowDecorVisible(this.peer!.ptr, isVisible ? 1 : 0)
        }
        setWindowDecorHeight_serialize(height: int32): void {
            OHOS_WINDOWNativeModule._window_Window_setWindowDecorHeight(this.peer!.ptr, height)
        }
        getWindowDecorHeight_serialize(): int32 {
            const retval  = OHOS_WINDOWNativeModule._window_Window_getWindowDecorHeight(this.peer!.ptr)
            return retval
        }
        setDecorButtonStyle_serialize(dectorStyle: DecorButtonStyle): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            window_DecorButtonStyle_serializer.write(thisSerializer, dectorStyle)
            OHOS_WINDOWNativeModule._window_Window_setDecorButtonStyle(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setWindowTitleButtonVisible_serialize(isMaximizeButtonVisible: boolean, isMinimizeButtonVisible: boolean, isCloseButtonVisible?: boolean): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (isCloseButtonVisible !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const isCloseButtonVisibleTmpValue  = isCloseButtonVisible!
                thisSerializer.writeBoolean(isCloseButtonVisibleTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_setWindowTitleButtonVisible(this.peer!.ptr, isMaximizeButtonVisible ? 1 : 0, isMinimizeButtonVisible ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        startMoving0_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_startMoving0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        startMoving1_serialize(offsetX: int32, offsetY: int32): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_Window_startMoving1(this.peer!.ptr, offsetX, offsetY, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        onWindowTitleButtonRectChange_serialize(callback_: ((value0: TitleButtonRect) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowTitleButtonRectChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowTitleButtonRectChange_serialize(callback_?: ((value0: TitleButtonRect) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowTitleButtonRectChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onWindowRectChange_serialize(callback_: ((value0: RectChangeOptions) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_Window_onWindowRectChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowRectChange_serialize(callback_?: ((value0: RectChangeOptions) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_Window_offWindowRectChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        setImmersiveModeEnabledState_serialize(enabled: boolean): void {
            OHOS_WINDOWNativeModule._window_Window_setImmersiveModeEnabledState(this.peer!.ptr, enabled ? 1 : 0)
        }
        getWindowStatus_serialize(): WindowStatusType {
            const retval  = OHOS_WINDOWNativeModule._window_Window_getWindowStatus(this.peer!.ptr)
            return TypeChecker.window_WindowStatusType_FromNumeric(retval)
        }
    }
    export interface WindowStage {
        getMainWindow(): Promise<Window>
        getMainWindow(callback_: AsyncCallback<Window>): void
        getMainWindowSync(): Window
        createSubWindow(name: string): Promise<Window>
        createSubWindow(name: string, callback_: AsyncCallback<Window>): void
        loadContent(path: string, storage: object, callback_: AsyncCallback<void>): void
        loadContent(path: string, storage: object | undefined): Promise<void>
        loadContent(path: string, callback_: AsyncCallback<void>): void
        loadContentByName(name: string, storage: object, callback_: AsyncCallback<void>): void
        loadContentByName(name: string, callback_: AsyncCallback<void>): void
        loadContentByName(name: string, storage: object | undefined): Promise<void>
        onWindowStageEvent(callback_: ((value0: WindowStageEventType) => void)): void
        offWindowStageEvent(callback_: ((value0: WindowStageEventType) => void) | undefined): void
        onWindowStageClose(callback_: (() => void)): void
        offWindowStageClose(callback_: (() => void) | undefined): void
        disableWindowDecor(): void
        setShowOnLockScreen(showOnLockScreen: boolean): void
    }
    export class WindowStageInternal implements MaterializedBase,WindowStage {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, WindowStageInternal.getFinalizer())
        }
        constructor() {
            this(WindowStageInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_WINDOWNativeModule._window_WindowStage_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_WINDOWNativeModule._window_WindowStage_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): WindowStageInternal {
            return new WindowStageInternal(ptr)
        }
        public getMainWindow(): Promise<Window> {
            return this.getMainWindow0_serialize()
        }
        public getMainWindow(callback_: AsyncCallback<Window>): void {
            const callback__casted = callback_ as (AsyncCallback<Window>)
            this.getMainWindow1_serialize(callback__casted)
            return
        }
        public getMainWindowSync(): Window {
            return this.getMainWindowSync_serialize()
        }
        public createSubWindow(name: string): Promise<Window> {
            const name_casted = name as (string)
            return this.createSubWindow0_serialize(name_casted)
        }
        public createSubWindow(name: string, callback_: AsyncCallback<Window>): void {
            const name_casted = name as (string)
            const callback__casted = callback_ as (AsyncCallback<Window>)
            this.createSubWindow1_serialize(name_casted, callback__casted)
            return
        }
        public loadContent(path: string, storage: object, callback_: AsyncCallback<void>): void {
            const path_casted = path as (string)
            const storage_casted = storage as (object)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.loadContent0_serialize(path_casted, storage_casted, callback__casted)
            return
        }
        public loadContent(path: string, storage?: object): Promise<void> {
            const path_casted = path as (string)
            const storage_casted = storage as (object | undefined)
            return this.loadContent1_serialize(path_casted, storage_casted)
        }
        public loadContent(path: string, callback_: AsyncCallback<void>): void {
            const path_casted = path as (string)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.loadContent2_serialize(path_casted, callback__casted)
            return
        }
        public loadContentByName(name: string, storage: object, callback_: AsyncCallback<void>): void {
            const name_casted = name as (string)
            const storage_casted = storage as (object)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.loadContentByName0_serialize(name_casted, storage_casted, callback__casted)
            return
        }
        public loadContentByName(name: string, callback_: AsyncCallback<void>): void {
            const name_casted = name as (string)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.loadContentByName1_serialize(name_casted, callback__casted)
            return
        }
        public loadContentByName(name: string, storage?: object): Promise<void> {
            const name_casted = name as (string)
            const storage_casted = storage as (object | undefined)
            return this.loadContentByName2_serialize(name_casted, storage_casted)
        }
        public onWindowStageEvent(callback_: ((value0: WindowStageEventType) => void)): void {
            const callback__casted = callback_ as (((value0: WindowStageEventType) => void))
            this.onWindowStageEvent_serialize(callback__casted)
            return
        }
        public offWindowStageEvent(callback_?: ((value0: WindowStageEventType) => void)): void {
            const callback__casted = callback_ as (((value0: WindowStageEventType) => void) | undefined)
            this.offWindowStageEvent_serialize(callback__casted)
            return
        }
        public onWindowStageClose(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onWindowStageClose_serialize(callback__casted)
            return
        }
        public offWindowStageClose(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offWindowStageClose_serialize(callback__casted)
            return
        }
        public disableWindowDecor(): void {
            this.disableWindowDecor_serialize()
            return
        }
        public setShowOnLockScreen(showOnLockScreen: boolean): void {
            const showOnLockScreen_casted = showOnLockScreen as (boolean)
            this.setShowOnLockScreen_serialize(showOnLockScreen_casted)
            return
        }
        on(eventType: string, callback_: ((value0: WindowStageEventType) => void)): void {
            throw new Error("Improve")
        }
        off(eventType: string, callback_: ((value0: WindowStageEventType) => void)): void {
            throw new Error("Improve")
        }
        getMainWindow0_serialize(): Promise<Window> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<Window>()[0]
            OHOS_WINDOWNativeModule._window_WindowStage_getMainWindow0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMainWindow1_serialize(callback_: AsyncCallback<Window>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_getMainWindow1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMainWindowSync_serialize(): Window {
            const retval  = OHOS_WINDOWNativeModule._window_WindowStage_getMainWindowSync(this.peer!.ptr)
            const obj : Window = extractors.fromWindowWindowPtr(retval)
            return obj
        }
        createSubWindow0_serialize(name: string): Promise<Window> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<Window>()[0]
            OHOS_WINDOWNativeModule._window_WindowStage_createSubWindow0(this.peer!.ptr, name, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        createSubWindow1_serialize(name: string, callback_: AsyncCallback<Window>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_createSubWindow1(this.peer!.ptr, name, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadContent0_serialize(path: string, storage: object, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeCustomObject('object', storage)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_loadContent0(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadContent1_serialize(path: string, storage?: object): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (storage !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const storageTmpValue  = storage!
                thisSerializer.writeCustomObject('object', storageTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_WindowStage_loadContent1(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        loadContent2_serialize(path: string, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_loadContent2(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadContentByName0_serialize(name: string, storage: object, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeCustomObject('object', storage)
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_loadContentByName0(this.peer!.ptr, name, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadContentByName1_serialize(name: string, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_loadContentByName1(this.peer!.ptr, name, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        loadContentByName2_serialize(name: string, storage?: object): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (storage !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const storageTmpValue  = storage!
                thisSerializer.writeCustomObject('object', storageTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_WINDOWNativeModule._window_WindowStage_loadContentByName2(this.peer!.ptr, name, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        onWindowStageEvent_serialize(callback_: ((value0: WindowStageEventType) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_onWindowStageEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowStageEvent_serialize(callback_?: ((value0: WindowStageEventType) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_WindowStage_offWindowStageEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onWindowStageClose_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_WINDOWNativeModule._window_WindowStage_onWindowStageClose(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offWindowStageClose_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_WINDOWNativeModule._window_WindowStage_offWindowStageClose(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        disableWindowDecor_serialize(): void {
            OHOS_WINDOWNativeModule._window_WindowStage_disableWindowDecor(this.peer!.ptr)
        }
        setShowOnLockScreen_serialize(showOnLockScreen: boolean): void {
            OHOS_WINDOWNativeModule._window_WindowStage_setShowOnLockScreen(this.peer!.ptr, showOnLockScreen ? 1 : 0)
        }
    }
    export enum WindowType {
        TYPE_APP = 0,
        TYPE_STATUS_BAR = 3,
        TYPE_PANEL = 4,
        TYPE_KEYGUARD = 5,
        TYPE_VOLUME_OVERLAY = 6,
        TYPE_NAVIGATION_BAR = 7,
        TYPE_FLOAT = 8,
        TYPE_WALLPAPER = 9,
        TYPE_DESKTOP = 10,
        TYPE_LAUNCHER_RECENT = 11,
        TYPE_LAUNCHER_DOCK = 12,
        TYPE_VOICE_INTERACTION = 13,
        TYPE_POINTER = 14,
        TYPE_FLOAT_CAMERA = 15,
        TYPE_DIALOG = 16,
        TYPE_SCREENSHOT = 17,
        TYPE_SYSTEM_TOAST = 18,
        TYPE_DIVIDER = 19,
        TYPE_GLOBAL_SEARCH = 20,
        TYPE_HANDWRITE = 21,
        TYPE_WALLET_SWIPE_CARD = 22,
        TYPE_SCREEN_CONTROL = 23,
        TYPE_FLOAT_NAVIGATION = 24
    }
    export enum AvoidAreaType {
        TYPE_SYSTEM = 0,
        TYPE_CUTOUT = 1,
        TYPE_SYSTEM_GESTURE = 2,
        TYPE_KEYBOARD = 3,
        TYPE_NAVIGATION_INDICATOR = 4
    }
    export enum WindowStatusType {
        UNDEFINED = 0,
        FULL_SCREEN = 1,
        MAXIMIZE = 2,
        MINIMIZE = 3,
        FLOATING = 4,
        SPLIT_SCREEN = 5
    }
    export interface SystemBarProperties {
        statusBarColor?: string;
        isStatusBarLightIcon?: boolean;
        statusBarContentColor?: string;
        navigationBarColor?: string;
        isNavigationBarLightIcon?: boolean;
        navigationBarContentColor?: string;
        enableStatusBarAnimation?: boolean;
        enableNavigationBarAnimation?: boolean;
    }
    export interface SystemBarStyle {
        statusBarContentColor?: string;
    }
    export interface Rect {
        left: int32;
        top: int32;
        width: int32;
        height: int32;
    }
    export interface AvoidArea {
        visible: boolean;
        leftRect: window.Rect;
        topRect: window.Rect;
        rightRect: window.Rect;
        bottomRect: window.Rect;
    }
    export interface Size {
        width: int32;
        height: int32;
    }
    export interface WindowProperties {
        windowRect: window.Rect;
        drawableRect: window.Rect;
        type: window.WindowType;
        isFullScreen: boolean;
        isLayoutFullScreen: boolean;
        focusable: boolean;
        touchable: boolean;
        brightness: double;
        isKeepScreenOn: boolean;
        isPrivacyMode: boolean;
        isTransparent: boolean;
        id: int32;
        displayId?: int64;
        name?: string;
    }
    export interface DecorButtonStyle {
        colorMode?: ConfigurationConstant.ColorMode;
        buttonBackgroundSize?: number;
        spacingBetweenButtons?: number;
        closeButtonRightMargin?: number;
    }
    export enum ColorSpace {
        DEFAULT = 0,
        WIDE_GAMUT = 1
    }
    export interface ScaleOptions {
        x?: double;
        y?: double;
        pivotX?: double;
        pivotY?: double;
    }
    export interface RotateOptions {
        x?: double;
        y?: double;
        z?: double;
        pivotX?: double;
        pivotY?: double;
    }
    export interface TranslateOptions {
        x?: double;
        y?: double;
        z?: double;
    }
    export interface TitleButtonRect {
        width: number;
    }
    export interface RectChangeOptions {
        rect: window.Rect;
        reason: window.RectChangeReason;
    }
    export interface AvoidAreaOptions {
        type: window.AvoidAreaType;
        area: window.AvoidArea;
    }
    export enum RectChangeReason {
        UNDEFINED = 0,
        MAXIMIZE = 1,
        RECOVER = 2,
        MOVE = 3,
        DRAG = 4,
        DRAG_START = 5,
        DRAG_END = 6
    }
    export enum Orientation {
        UNSPECIFIED = 0,
        PORTRAIT = 1,
        LANDSCAPE = 2,
        PORTRAIT_INVERTED = 3,
        LANDSCAPE_INVERTED = 4,
        AUTO_ROTATION = 5,
        AUTO_ROTATION_PORTRAIT = 6,
        AUTO_ROTATION_LANDSCAPE = 7,
        AUTO_ROTATION_RESTRICTED = 8,
        AUTO_ROTATION_PORTRAIT_RESTRICTED = 9,
        AUTO_ROTATION_LANDSCAPE_RESTRICTED = 10,
        LOCKED = 11,
        AUTO_ROTATION_UNSPECIFIED = 12,
        USER_ROTATION_PORTRAIT = 13,
        USER_ROTATION_LANDSCAPE = 14,
        USER_ROTATION_PORTRAIT_INVERTED = 15,
        USER_ROTATION_LANDSCAPE_INVERTED = 16,
        FOLLOW_DESKTOP = 17
    }
    export enum WindowEventType {
        WINDOW_SHOWN = 1,
        WINDOW_ACTIVE = 2,
        WINDOW_INACTIVE = 3,
        WINDOW_HIDDEN = 4,
        WINDOW_DESTROYED = 7
    }
    export enum MaximizePresentation {
        FOLLOW_APP_IMMERSIVE_SETTING = 0,
        EXIT_IMMERSIVE = 1,
        ENTER_IMMERSIVE = 2
    }
    export type SpecificSystemBar = string;
    export interface KeyboardInfo {
        beginRect: window.Rect;
        endRect: window.Rect;
    }
    export enum WindowStageEventType {
        SHOWN = 1,
        ACTIVE = 2,
        INACTIVE = 3,
        HIDDEN = 4,
        RESUMED = 5,
        PAUSED = 6
    }
}
