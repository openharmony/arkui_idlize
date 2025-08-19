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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "ohos_window.h"

OH_OHOS_WINDOW_window_WindowHandle window_Window_constructImpl();
void window_Window_destroyWindow0Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_destroyWindow1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_destructImpl(OH_OHOS_WINDOW_window_WindowHandle thisPtr);
OH_OHOS_WINDOW_window_Rect window_Window_getGlobalRectImpl(OH_NativePointer thisPtr);
OH_OHOS_WINDOW_UIContext window_Window_getUIContextImpl(OH_NativePointer thisPtr);
OH_OHOS_WINDOW_window_AvoidArea window_Window_getWindowAvoidAreaImpl(OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_AvoidAreaType type);
OH_Int32 window_Window_getWindowDecorHeightImpl(OH_NativePointer thisPtr);
OH_OHOS_WINDOW_window_WindowProperties window_Window_getWindowPropertiesImpl(OH_NativePointer thisPtr);
OH_OHOS_WINDOW_window_WindowStatusType window_Window_getWindowStatusImpl(OH_NativePointer thisPtr);
void window_Window_hideNonSystemFloatingWindows0Impl(OH_NativePointer thisPtr, OH_Boolean shouldHide, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_hideNonSystemFloatingWindows1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean shouldHide, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_hideWithAnimation0Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_hideWithAnimation1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
OH_Boolean window_Window_isWindowShowingImpl(OH_NativePointer thisPtr);
void window_Window_isWindowSupportWideGamut0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_isWindowSupportWideGamut1Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_keepKeyboardOnFocusImpl(OH_NativePointer thisPtr, OH_Boolean keepKeyboardFlag);
void window_Window_loadContent0Impl(OH_NativePointer thisPtr, const OH_String* path, const OH_CustomObject* storage, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_loadContent1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OH_CustomObject* storage, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_maximizeImpl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const Opt_window_MaximizePresentation* presentation, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_minimize0Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_minimize1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_moveWindowTo0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 x, OH_Int32 y, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_moveWindowTo1Impl(OH_NativePointer thisPtr, OH_Int32 x, OH_Int32 y, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_offAvoidAreaChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void* callback_);
void window_Window_offDialogTargetTouchImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_offDisplayIdChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_I64_Void* callback_);
void window_Window_offKeyboardDidHideImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
void window_Window_offKeyboardDidShowImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
void window_Window_offKeyboardHeightChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_I32_Void* callback_);
void window_Window_offNoInteractionDetectedImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_offScreenshotImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_offSubWindowCloseImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_offSystemDensityChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_F64_Void* callback_);
void window_Window_offTouchOutsideImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_offWindowEventImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void* callback_);
void window_Window_offWindowHighlightChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
void window_Window_offWindowRectChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void* callback_);
void window_Window_offWindowSizeChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Size_Void* callback_);
void window_Window_offWindowStatusChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void* callback_);
void window_Window_offWindowTitleButtonRectChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void* callback_);
void window_Window_offWindowVisibilityChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
void window_Window_offWindowWillCloseImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Promise_Boolean* callback_);
void window_Window_onAvoidAreaChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void* callback_);
void window_Window_onDialogTargetTouchImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_onDisplayIdChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_I64_Void* callback_);
void window_Window_onKeyboardDidHideImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
void window_Window_onKeyboardDidShowImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_KeyboardInfo_Void* callback_);
void window_Window_onKeyboardHeightChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_I32_Void* callback_);
void window_Window_onNoInteractionDetectedImpl(OH_NativePointer thisPtr, OH_Int64 timeout, const OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_onScreenshotImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_onSubWindowCloseImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_onSystemDensityChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_F64_Void* callback_);
void window_Window_onTouchOutsideImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
void window_Window_onWindowEventImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_WindowEventType_Void* callback_);
void window_Window_onWindowHighlightChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
void window_Window_onWindowRectChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_RectChangeOptions_Void* callback_);
void window_Window_onWindowSizeChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Size_Void* callback_);
void window_Window_onWindowStatusChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_WindowStatusType_Void* callback_);
void window_Window_onWindowTitleButtonRectChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_TitleButtonRect_Void* callback_);
void window_Window_onWindowVisibilityChangeImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Boolean_Void* callback_);
void window_Window_onWindowWillCloseImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Promise_Boolean* callback_);
void window_Window_opacityImpl(OH_NativePointer thisPtr, OH_Float64 opacity);
void window_Window_recoverImpl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_resize0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 width, OH_Int32 height, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_resize1Impl(OH_NativePointer thisPtr, OH_Int32 width, OH_Int32 height, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_rotateImpl(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_RotateOptions* rotateOptions);
void window_Window_scaleImpl(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_ScaleOptions* scaleOptions);
void window_Window_setDecorButtonStyleImpl(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_DecorButtonStyle* dectorStyle);
void window_Window_setImmersiveModeEnabledStateImpl(OH_NativePointer thisPtr, OH_Boolean enabled);
void window_Window_setPreferredOrientation0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_Orientation orientation, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setPreferredOrientation1Impl(OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_Orientation orientation, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_setShadowImpl(OH_NativePointer thisPtr, OH_Float64 radius, const Opt_String* color, const Opt_Float64* offsetX, const Opt_Float64* offsetY);
void window_Window_setSpecificSystemBarEnabledImpl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* name, OH_Boolean enable, const Opt_Boolean* enableAnimation, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setUIContent0Impl(OH_NativePointer thisPtr, const OH_String* path, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_setUIContent1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWaterMarkFlag0Impl(OH_NativePointer thisPtr, OH_Boolean enable, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_setWaterMarkFlag1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean enable, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowBackgroundColorImpl(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_Union_String_ColorMetrics* color);
void window_Window_setWindowColorSpace0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_ColorSpace colorSpace, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowColorSpace1Impl(OH_NativePointer thisPtr, OH_OHOS_WINDOW_window_ColorSpace colorSpace, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_setWindowDecorHeightImpl(OH_NativePointer thisPtr, OH_Int32 height);
void window_Window_setWindowDecorVisibleImpl(OH_NativePointer thisPtr, OH_Boolean isVisible);
void window_Window_setWindowFocusable0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isFocusable, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowFocusable1Impl(OH_NativePointer thisPtr, OH_Boolean isFocusable, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_setWindowKeepScreenOn0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isKeepScreenOn, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowKeepScreenOn1Impl(OH_NativePointer thisPtr, OH_Boolean isKeepScreenOn, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_setWindowLayoutFullScreenImpl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isLayoutFullScreen, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowPrivacyMode0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isPrivacyMode, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowPrivacyMode1Impl(OH_NativePointer thisPtr, OH_Boolean isPrivacyMode, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_setWindowSystemBarEnableImpl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const Array_String* names, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowSystemBarPropertiesImpl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_SystemBarProperties* systemBarProperties, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowTitleButtonVisibleImpl(OH_NativePointer thisPtr, OH_Boolean isMaximizeButtonVisible, OH_Boolean isMinimizeButtonVisible, const Opt_Boolean* isCloseButtonVisible);
void window_Window_setWindowTouchable0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Boolean isTouchable, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_setWindowTouchable1Impl(OH_NativePointer thisPtr, OH_Boolean isTouchable, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_showWindow0Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_showWindow1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_showWithAnimation0Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_showWithAnimation1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_snapshot0Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
void window_Window_snapshot1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_startMoving0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_startMoving1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_Int32 offsetX, OH_Int32 offsetY, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_Window_translateImpl(OH_NativePointer thisPtr, const OH_OHOS_WINDOW_window_TranslateOptions* translateOptions);
OH_OHOS_WINDOW_window_WindowStageHandle window_WindowStage_constructImpl();
void window_WindowStage_createSubWindow0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* name, const OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_WindowStage_createSubWindow1Impl(OH_NativePointer thisPtr, const OH_String* name, const OHOS_WINDOW_AsyncCallback* callback_);
void window_WindowStage_destructImpl(OH_OHOS_WINDOW_window_WindowStageHandle thisPtr);
void window_WindowStage_disableWindowDecorImpl(OH_NativePointer thisPtr);
void window_WindowStage_getMainWindow0Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_WindowStage_getMainWindow1Impl(OH_NativePointer thisPtr, const OHOS_WINDOW_AsyncCallback* callback_);
OH_OHOS_WINDOW_window_Window window_WindowStage_getMainWindowSyncImpl(OH_NativePointer thisPtr);
void window_WindowStage_loadContent0Impl(OH_NativePointer thisPtr, const OH_String* path, const OH_CustomObject* storage, const OHOS_WINDOW_AsyncCallback* callback_);
void window_WindowStage_loadContent1Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* path, const Opt_CustomObject* storage, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_WindowStage_loadContent2Impl(OH_NativePointer thisPtr, const OH_String* path, const OHOS_WINDOW_AsyncCallback* callback_);
void window_WindowStage_loadContentByName0Impl(OH_NativePointer thisPtr, const OH_String* name, const OH_CustomObject* storage, const OHOS_WINDOW_AsyncCallback* callback_);
void window_WindowStage_loadContentByName1Impl(OH_NativePointer thisPtr, const OH_String* name, const OHOS_WINDOW_AsyncCallback* callback_);
void window_WindowStage_loadContentByName2Impl(OH_OHOS_WINDOW_VMContext vmContext, OH_OHOS_WINDOW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* name, const Opt_CustomObject* storage, const OHOS_WINDOW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
void window_WindowStage_offWindowStageCloseImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_Void* callback_);
void window_WindowStage_offWindowStageEventImpl(OH_NativePointer thisPtr, const Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void* callback_);
void window_WindowStage_onWindowStageCloseImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_Void* callback_);
void window_WindowStage_onWindowStageEventImpl(OH_NativePointer thisPtr, const OHOS_WINDOW_window_Callback_WindowStageEventType_Void* callback_);
void window_WindowStage_setShowOnLockScreenImpl(OH_NativePointer thisPtr, OH_Boolean showOnLockScreen);
const OH_OHOS_WINDOW_window_WindowModifier* OH_OHOS_WINDOW_window_WindowModifierImpl() {
    const static OH_OHOS_WINDOW_window_WindowModifier instance = {
        &window_Window_constructImpl,
        &window_Window_destructImpl,
        &window_Window_hideWithAnimation0Impl,
        &window_Window_hideWithAnimation1Impl,
        &window_Window_showWindow0Impl,
        &window_Window_showWindow1Impl,
        &window_Window_showWithAnimation0Impl,
        &window_Window_showWithAnimation1Impl,
        &window_Window_destroyWindow0Impl,
        &window_Window_destroyWindow1Impl,
        &window_Window_moveWindowTo0Impl,
        &window_Window_moveWindowTo1Impl,
        &window_Window_resize0Impl,
        &window_Window_resize1Impl,
        &window_Window_getGlobalRectImpl,
        &window_Window_getWindowPropertiesImpl,
        &window_Window_getWindowAvoidAreaImpl,
        &window_Window_setWindowLayoutFullScreenImpl,
        &window_Window_setWindowSystemBarEnableImpl,
        &window_Window_setSpecificSystemBarEnabledImpl,
        &window_Window_setWindowSystemBarPropertiesImpl,
        &window_Window_setPreferredOrientation0Impl,
        &window_Window_setPreferredOrientation1Impl,
        &window_Window_loadContent0Impl,
        &window_Window_loadContent1Impl,
        &window_Window_getUIContextImpl,
        &window_Window_setUIContent0Impl,
        &window_Window_setUIContent1Impl,
        &window_Window_isWindowShowingImpl,
        &window_Window_onWindowSizeChangeImpl,
        &window_Window_offWindowSizeChangeImpl,
        &window_Window_onAvoidAreaChangeImpl,
        &window_Window_offAvoidAreaChangeImpl,
        &window_Window_onKeyboardHeightChangeImpl,
        &window_Window_offKeyboardHeightChangeImpl,
        &window_Window_onKeyboardDidShowImpl,
        &window_Window_offKeyboardDidShowImpl,
        &window_Window_onKeyboardDidHideImpl,
        &window_Window_offKeyboardDidHideImpl,
        &window_Window_onTouchOutsideImpl,
        &window_Window_offTouchOutsideImpl,
        &window_Window_onDisplayIdChangeImpl,
        &window_Window_offDisplayIdChangeImpl,
        &window_Window_onWindowVisibilityChangeImpl,
        &window_Window_offWindowVisibilityChangeImpl,
        &window_Window_onSystemDensityChangeImpl,
        &window_Window_offSystemDensityChangeImpl,
        &window_Window_onNoInteractionDetectedImpl,
        &window_Window_offNoInteractionDetectedImpl,
        &window_Window_onScreenshotImpl,
        &window_Window_offScreenshotImpl,
        &window_Window_onDialogTargetTouchImpl,
        &window_Window_offDialogTargetTouchImpl,
        &window_Window_onWindowEventImpl,
        &window_Window_offWindowEventImpl,
        &window_Window_onWindowStatusChangeImpl,
        &window_Window_offWindowStatusChangeImpl,
        &window_Window_onSubWindowCloseImpl,
        &window_Window_offSubWindowCloseImpl,
        &window_Window_onWindowWillCloseImpl,
        &window_Window_offWindowWillCloseImpl,
        &window_Window_onWindowHighlightChangeImpl,
        &window_Window_offWindowHighlightChangeImpl,
        &window_Window_isWindowSupportWideGamut0Impl,
        &window_Window_isWindowSupportWideGamut1Impl,
        &window_Window_setWindowColorSpace0Impl,
        &window_Window_setWindowColorSpace1Impl,
        &window_Window_setWindowBackgroundColorImpl,
        &window_Window_setWindowFocusable0Impl,
        &window_Window_setWindowFocusable1Impl,
        &window_Window_setWindowKeepScreenOn0Impl,
        &window_Window_setWindowKeepScreenOn1Impl,
        &window_Window_setWindowPrivacyMode0Impl,
        &window_Window_setWindowPrivacyMode1Impl,
        &window_Window_setWindowTouchable0Impl,
        &window_Window_setWindowTouchable1Impl,
        &window_Window_snapshot0Impl,
        &window_Window_snapshot1Impl,
        &window_Window_opacityImpl,
        &window_Window_scaleImpl,
        &window_Window_rotateImpl,
        &window_Window_translateImpl,
        &window_Window_setShadowImpl,
        &window_Window_setWaterMarkFlag0Impl,
        &window_Window_setWaterMarkFlag1Impl,
        &window_Window_minimize0Impl,
        &window_Window_minimize1Impl,
        &window_Window_maximizeImpl,
        &window_Window_hideNonSystemFloatingWindows0Impl,
        &window_Window_hideNonSystemFloatingWindows1Impl,
        &window_Window_keepKeyboardOnFocusImpl,
        &window_Window_recoverImpl,
        &window_Window_setWindowDecorVisibleImpl,
        &window_Window_setWindowDecorHeightImpl,
        &window_Window_getWindowDecorHeightImpl,
        &window_Window_setDecorButtonStyleImpl,
        &window_Window_setWindowTitleButtonVisibleImpl,
        &window_Window_startMoving0Impl,
        &window_Window_startMoving1Impl,
        &window_Window_onWindowTitleButtonRectChangeImpl,
        &window_Window_offWindowTitleButtonRectChangeImpl,
        &window_Window_onWindowRectChangeImpl,
        &window_Window_offWindowRectChangeImpl,
        &window_Window_setImmersiveModeEnabledStateImpl,
        &window_Window_getWindowStatusImpl,
    };
    return &instance;
}
const OH_OHOS_WINDOW_window_WindowStageModifier* OH_OHOS_WINDOW_window_WindowStageModifierImpl() {
    const static OH_OHOS_WINDOW_window_WindowStageModifier instance = {
        &window_WindowStage_constructImpl,
        &window_WindowStage_destructImpl,
        &window_WindowStage_getMainWindow0Impl,
        &window_WindowStage_getMainWindow1Impl,
        &window_WindowStage_getMainWindowSyncImpl,
        &window_WindowStage_createSubWindow0Impl,
        &window_WindowStage_createSubWindow1Impl,
        &window_WindowStage_loadContent0Impl,
        &window_WindowStage_loadContent1Impl,
        &window_WindowStage_loadContent2Impl,
        &window_WindowStage_loadContentByName0Impl,
        &window_WindowStage_loadContentByName1Impl,
        &window_WindowStage_loadContentByName2Impl,
        &window_WindowStage_onWindowStageEventImpl,
        &window_WindowStage_offWindowStageEventImpl,
        &window_WindowStage_onWindowStageCloseImpl,
        &window_WindowStage_offWindowStageCloseImpl,
        &window_WindowStage_disableWindowDecorImpl,
        &window_WindowStage_setShowOnLockScreenImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_WINDOW_API* GetOHOS_WINDOWAPIImpl(int version) {
    const static OH_OHOS_WINDOW_API api = {
        1, // version
        &OH_OHOS_WINDOW_window_WindowModifierImpl,
        &OH_OHOS_WINDOW_window_WindowStageModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_WINDOW_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_WINDOWAPIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version) {
    if (kind < 0 || kind > 15) return nullptr;
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}
