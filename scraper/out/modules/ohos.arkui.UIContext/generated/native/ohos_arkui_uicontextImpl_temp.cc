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
#include "ohos_arkui_uicontext.h"

OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshotHandle ComponentSnapshot_constructImpl() {
    return {};
}
void ComponentSnapshot_createFromBuilder0Impl(OH_NativePointer thisPtr, const OH_CustomObject* builder, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_, const Opt_Number* delay, const Opt_Boolean* checkImageStatus, const Opt_componentSnapshot_SnapshotOptions* options) {
}
void ComponentSnapshot_createFromBuilder1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* builder, const Opt_Number* delay, const Opt_Boolean* checkImageStatus, const Opt_componentSnapshot_SnapshotOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ComponentSnapshot_createFromComponentImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, const Opt_Number* delay, const Opt_Boolean* checkImageStatus, const Opt_componentSnapshot_SnapshotOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ComponentSnapshot_destructImpl(OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshotHandle thisPtr) {
}
void ComponentSnapshot_get0Impl(OH_NativePointer thisPtr, const OH_String* id, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_, const Opt_componentSnapshot_SnapshotOptions* options) {
}
void ComponentSnapshot_get1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* id, const Opt_componentSnapshot_SnapshotOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_OHOS_ARKUI_UICONTEXT_image_PixelMap ComponentSnapshot_getSyncImpl(OH_NativePointer thisPtr, const OH_String* id, const Opt_componentSnapshot_SnapshotOptions* options) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_image_PixelMap ComponentSnapshot_getSyncWithUniqueIdImpl(OH_NativePointer thisPtr, const OH_Number* uniqueId, const Opt_componentSnapshot_SnapshotOptions* options) {
    return {};
}
void ComponentSnapshot_getWithRangeImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_NodeIdentity* start, const OH_OHOS_ARKUI_UICONTEXT_NodeIdentity* end, OH_Boolean isStartRect, const Opt_componentSnapshot_SnapshotOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void ComponentSnapshot_getWithUniqueIdImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Number* uniqueId, const Opt_componentSnapshot_SnapshotOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_OHOS_ARKUI_UICONTEXT_ComponentUtilsHandle ComponentUtils_constructImpl() {
    return {};
}
void ComponentUtils_destructImpl(OH_OHOS_ARKUI_UICONTEXT_ComponentUtilsHandle thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo ComponentUtils_getRectangleByIdImpl(OH_NativePointer thisPtr, const OH_String* id) {
    return {};
}
void ContentCoverController_closeImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_ContentCoverControllerHandle ContentCoverController_constructImpl() {
    return {};
}
void ContentCoverController_destructImpl(OH_OHOS_ARKUI_UICONTEXT_ContentCoverControllerHandle thisPtr) {
}
void ContentCoverController_updateImpl(OH_NativePointer thisPtr, const OH_CustomObject* contentCoverOptions, const Opt_Boolean* partialUpdate) {
}
void ContextMenuController_closeImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_ContextMenuControllerHandle ContextMenuController_constructImpl() {
    return {};
}
void ContextMenuController_destructImpl(OH_OHOS_ARKUI_UICONTEXT_ContextMenuControllerHandle thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_CursorControllerHandle CursorController_constructImpl() {
    return {};
}
void CursorController_destructImpl(OH_OHOS_ARKUI_UICONTEXT_CursorControllerHandle thisPtr) {
}
void CursorController_restoreDefaultImpl(OH_NativePointer thisPtr) {
}
void CursorController_setCursorImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_UICONTEXT_pointer_PointerStyle value) {
}
void DragController_cancelDataLoadingImpl(OH_NativePointer thisPtr, const OH_String* key) {
}
OH_OHOS_ARKUI_UICONTEXT_DragControllerHandle DragController_constructImpl() {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction DragController_createDragActionImpl(OH_NativePointer thisPtr, const Array_Union_CustomBuilder_DragItemInfo* customArray, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo* dragInfo) {
    return {};
}
void DragController_destructImpl(OH_OHOS_ARKUI_UICONTEXT_DragControllerHandle thisPtr) {
}
void DragController_enableDropDisallowedBadgeImpl(OH_NativePointer thisPtr, OH_Boolean enabled) {
}
void DragController_executeDrag0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo* custom, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo* dragInfo, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void DragController_executeDrag1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo* custom, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo* dragInfo, const OHOS_ARKUI_UICONTEXT_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview DragController_getDragPreviewImpl(OH_NativePointer thisPtr) {
    return {};
}
void DragController_notifyDragStartRequestImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_UICONTEXT_dragController_DragStartRequestStatus requestStatus) {
}
void DragController_setDragEventStrictReportingEnabledImpl(OH_NativePointer thisPtr, OH_Boolean enable) {
}
OH_OHOS_ARKUI_UICONTEXT_DynamicSyncSceneHandle DynamicSyncScene_constructImpl() {
    return {};
}
void DynamicSyncScene_destructImpl(OH_OHOS_ARKUI_UICONTEXT_DynamicSyncSceneHandle thisPtr) {
}
OH_CustomObject DynamicSyncScene_getFrameRateRangeImpl(OH_NativePointer thisPtr) {
    return {};
}
void DynamicSyncScene_setFrameRateRangeImpl(OH_NativePointer thisPtr, const OH_CustomObject* range) {
}
void FocusController_activateImpl(OH_NativePointer thisPtr, OH_Boolean isActive, const Opt_Boolean* autoInactive) {
}
void FocusController_clearFocusImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_FocusControllerHandle FocusController_constructImpl() {
    return {};
}
void FocusController_destructImpl(OH_OHOS_ARKUI_UICONTEXT_FocusControllerHandle thisPtr) {
}
OH_Boolean FocusController_isActiveImpl(OH_NativePointer thisPtr) {
    return {};
}
void FocusController_requestFocusImpl(OH_NativePointer thisPtr, const OH_String* key) {
}
void FocusController_setAutoFocusTransferImpl(OH_NativePointer thisPtr, OH_Boolean isAutoFocusTransfer) {
}
void FocusController_setKeyProcessingModeImpl(OH_NativePointer thisPtr, const OH_CustomObject* mode) {
}
OH_OHOS_ARKUI_UICONTEXT_FontHandle Font_constructImpl() {
    return {};
}
void Font_destructImpl(OH_OHOS_ARKUI_UICONTEXT_FontHandle thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_font_FontInfo Font_getFontByNameImpl(OH_NativePointer thisPtr, const OH_String* fontName) {
    return {};
}
Array_String Font_getSystemFontListImpl(OH_NativePointer thisPtr) {
    return {};
}
void Font_registerFontImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_font_FontOptions* options) {
}
OH_OHOS_ARKUI_UICONTEXT_FrameCallbackHandle FrameCallback_constructImpl() {
    return {};
}
void FrameCallback_destructImpl(OH_OHOS_ARKUI_UICONTEXT_FrameCallbackHandle thisPtr) {
}
void FrameCallback_onFrameImpl(OH_NativePointer thisPtr, const OH_Number* frameTimeInNano) {
}
void FrameCallback_onIdleImpl(OH_NativePointer thisPtr, const OH_Number* timeLeftInNano) {
}
OH_OHOS_ARKUI_UICONTEXT_MeasureUtilsHandle MeasureUtils_constructImpl() {
    return {};
}
void MeasureUtils_destructImpl(OH_OHOS_ARKUI_UICONTEXT_MeasureUtilsHandle thisPtr) {
}
OH_Number MeasureUtils_measureTextImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_MeasureOptions* options) {
    return {};
}
OH_CustomObject MeasureUtils_measureTextSizeImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_MeasureOptions* options) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_MediaQueryHandle MediaQuery_constructImpl() {
    return {};
}
void MediaQuery_destructImpl(OH_OHOS_ARKUI_UICONTEXT_MediaQueryHandle thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener MediaQuery_matchMediaSyncImpl(OH_NativePointer thisPtr, const OH_String* condition) {
    return {};
}
void OverlayManager_addComponentContentImpl(OH_NativePointer thisPtr, const OH_CustomObject* content, const Opt_Number* index) {
}
void OverlayManager_addComponentContentWithOrderImpl(OH_NativePointer thisPtr, const OH_CustomObject* content, const Opt_LevelOrder* levelOrder) {
}
OH_OHOS_ARKUI_UICONTEXT_OverlayManagerHandle OverlayManager_constructImpl() {
    return {};
}
void OverlayManager_destructImpl(OH_OHOS_ARKUI_UICONTEXT_OverlayManagerHandle thisPtr) {
}
void OverlayManager_hideAllComponentContentsImpl(OH_NativePointer thisPtr) {
}
void OverlayManager_hideComponentContentImpl(OH_NativePointer thisPtr, const OH_CustomObject* content) {
}
void OverlayManager_removeComponentContentImpl(OH_NativePointer thisPtr, const OH_CustomObject* content) {
}
void OverlayManager_showAllComponentContentsImpl(OH_NativePointer thisPtr) {
}
void OverlayManager_showComponentContentImpl(OH_NativePointer thisPtr, const OH_CustomObject* content) {
}
void PromptAction_closeCustomDialog0Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* dialogContent, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_closeCustomDialog1Impl(OH_NativePointer thisPtr, const OH_Number* dialogId) {
}
void PromptAction_closeMenuImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_closePopupImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_closeToastImpl(OH_NativePointer thisPtr, const OH_Number* toastId) {
}
OH_OHOS_ARKUI_UICONTEXT_PromptActionHandle PromptAction_constructImpl() {
    return {};
}
void PromptAction_destructImpl(OH_OHOS_ARKUI_UICONTEXT_PromptActionHandle thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_LevelOrder PromptAction_getBottomOrderImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_LevelOrder PromptAction_getTopOrderImpl(OH_NativePointer thisPtr) {
    return {};
}
void PromptAction_openCustomDialog0Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* dialogContent, const Opt_promptAction_BaseDialogOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_openCustomDialog1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_openCustomDialogWithControllerImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* dialogContent, OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController controller, const Opt_promptAction_BaseDialogOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_openMenuImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, const OH_OHOS_ARKUI_UICONTEXT_TargetInfo* target, const Opt_CustomObject* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_openPopupImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, const OH_OHOS_ARKUI_UICONTEXT_TargetInfo* target, const Opt_CustomObject* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_openToastImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_presentCustomDialogImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT* builder, const Opt_promptAction_DialogController* controller, const Opt_promptAction_DialogOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_showActionMenu0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions* options, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void PromptAction_showActionMenu1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_showDialog0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions* options, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void PromptAction_showDialog1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_showToastImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions* options) {
}
void PromptAction_updateCustomDialogImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* dialogContent, const OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_updateMenuImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, const OH_CustomObject* options, const Opt_Boolean* partialUpdate, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void PromptAction_updatePopupImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, const OH_CustomObject* options, const Opt_Boolean* partialUpdate, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_back0Impl(OH_NativePointer thisPtr, const Opt_router_RouterOptions* options) {
}
void Router_back1Impl(OH_NativePointer thisPtr, const OH_Number* index, const Opt_Object* params) {
}
void Router_clearImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_ARKUI_UICONTEXT_RouterHandle Router_constructImpl() {
    return {};
}
void Router_destructImpl(OH_OHOS_ARKUI_UICONTEXT_RouterHandle thisPtr) {
}
OH_String Router_getLengthImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Object Router_getParamsImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_router_RouterState Router_getStateByIndexImpl(OH_NativePointer thisPtr, const OH_Number* index) {
    return {};
}
Array_router_RouterState Router_getStateByUrlImpl(OH_NativePointer thisPtr, const OH_String* url) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_router_RouterState Router_getStateImpl(OH_NativePointer thisPtr) {
    return {};
}
void Router_hideAlertBeforeBackPageImpl(OH_NativePointer thisPtr) {
}
void Router_pushNamedRoute0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_pushNamedRoute1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_pushNamedRoute2Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_pushNamedRoute3Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_pushUrl0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_pushUrl1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_pushUrl2Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_pushUrl3Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_replaceNamedRoute0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_replaceNamedRoute1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_replaceNamedRoute2Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_replaceNamedRoute3Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_replaceUrl0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_replaceUrl1Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_replaceUrl2Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_AsyncCallback* callback_) {
}
void Router_replaceUrl3Impl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* options, OH_OHOS_ARKUI_UICONTEXT_router_RouterMode mode, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void Router_showAlertBeforeBackPageImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions* options) {
}
OH_OHOS_ARKUI_UICONTEXT_TextMenuControllerHandle TextMenuController_constructImpl() {
    return {};
}
void TextMenuController_destructImpl(OH_OHOS_ARKUI_UICONTEXT_TextMenuControllerHandle thisPtr) {
}
void TextMenuController_disableSystemServiceMenuItemsImpl(OH_Boolean disable) {
}
void TextMenuController_setMenuOptionsImpl(OH_NativePointer thisPtr, const OH_CustomObject* options) {
}
void UIContext_animateToImmediatelyImpl(OH_NativePointer thisPtr, const OH_CustomObject* param, const OHOS_ARKUI_UICONTEXT_Callback_Void* event) {
}
void UIContext_animateToImpl(OH_NativePointer thisPtr, const OH_CustomObject* value, const OHOS_ARKUI_UICONTEXT_Callback_Void* event) {
}
void UIContext_bindTabsToNestedScrollableImpl(OH_NativePointer thisPtr, const OH_CustomObject* tabsController, const OH_CustomObject* parentScroller, const OH_CustomObject* childScroller) {
}
void UIContext_bindTabsToScrollableImpl(OH_NativePointer thisPtr, const OH_CustomObject* tabsController, const OH_CustomObject* scroller) {
}
void UIContext_clearResourceCacheImpl(OH_NativePointer thisPtr) {
}
void UIContext_closeBindSheetImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* bindSheetContent, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_OHOS_ARKUI_UICONTEXT_UIContextHandle UIContext_constructImpl() {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_AnimatorResult UIContext_createAnimatorImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions* options) {
    return {};
}
Opt_UIContext UIContext_createUIContextWithoutWindowImpl(const OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext* context) {
    return {};
}
void UIContext_destroyUIContextWithoutWindowImpl() {
}
void UIContext_destructImpl(OH_OHOS_ARKUI_UICONTEXT_UIContextHandle thisPtr) {
}
OH_Boolean UIContext_dispatchKeyEventImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_String* node, const OH_CustomObject* event) {
    return {};
}
void UIContext_enableSwipeBackImpl(OH_NativePointer thisPtr, const Opt_Boolean* enabled) {
}
OH_Number UIContext_fp2pxImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    return {};
}
void UIContext_freezeUINode0Impl(OH_NativePointer thisPtr, const OH_String* id, OH_Boolean isFrozen) {
}
void UIContext_freezeUINode1Impl(OH_NativePointer thisPtr, const OH_Number* uniqueId, OH_Boolean isFrozen) {
}
OH_CustomObject UIContext_getAtomicServiceBarImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_CustomObject UIContext_getAttachedFrameNodeByIdImpl(OH_NativePointer thisPtr, const OH_String* id) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot UIContext_getComponentSnapshotImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_ComponentUtils UIContext_getComponentUtilsImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_ContextMenuController UIContext_getContextMenuControllerImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_CursorController UIContext_getCursorControllerImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_DragController UIContext_getDragControllerImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String UIContext_getFilteredInspectorTreeByIdImpl(OH_NativePointer thisPtr, const OH_String* id, const OH_Number* depth, const Opt_Array_String* filters) {
    return {};
}
OH_String UIContext_getFilteredInspectorTreeImpl(OH_NativePointer thisPtr, const Opt_Array_String* filters) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_FocusController UIContext_getFocusControllerImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_UIContext UIContext_getFocusedUIContextImpl() {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_Font UIContext_getFontImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_CustomObject UIContext_getFrameNodeByIdImpl(OH_NativePointer thisPtr, const OH_String* id) {
    return {};
}
Opt_CustomObject UIContext_getFrameNodeByUniqueIdImpl(OH_NativePointer thisPtr, const OH_Number* id) {
    return {};
}
Opt_CustomObject UIContext_getHostContextImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode UIContext_getKeyboardAvoidModeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number UIContext_getMaxFontScaleImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_MeasureUtils UIContext_getMeasureUtilsImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_MediaQuery UIContext_getMediaQueryImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_uiObserver_NavigationInfo UIContext_getNavigationInfoByUniqueIdImpl(OH_NativePointer thisPtr, const OH_Number* id) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_OverlayManager UIContext_getOverlayManagerImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions UIContext_getOverlayManagerOptionsImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_PageInfo UIContext_getPageInfoByUniqueIdImpl(OH_NativePointer thisPtr, const OH_Number* id) {
    return {};
}
OH_CustomObject UIContext_getPixelRoundModeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_PromptAction UIContext_getPromptActionImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_Router UIContext_getRouterImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_CustomObject UIContext_getSharedLocalStorageImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_TextMenuController UIContext_getTextMenuControllerImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_UIInspector UIContext_getUIInspectorImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_UIObserver UIContext_getUIObserverImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_CustomObject UIContext_getWindowHeightBreakpointImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_String UIContext_getWindowNameImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_CustomObject UIContext_getWindowWidthBreakpointImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean UIContext_isAvailableImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean UIContext_isFollowingSystemFontScaleImpl(OH_NativePointer thisPtr) {
    return {};
}
void UIContext_keyframeAnimateToImpl(OH_NativePointer thisPtr, const OH_CustomObject* param, const Array_CustomObject* keyframes) {
}
OH_Number UIContext_lpx2pxImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    return {};
}
void UIContext_openBindContentCoverImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* content, OH_OHOS_ARKUI_UICONTEXT_ContentCoverController controller, const Opt_CustomObject* contentCoverOptions, const Opt_Number* targetId, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void UIContext_openBindSheetImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* bindSheetContent, const Opt_CustomObject* sheetOptions, const Opt_Number* targetId, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void UIContext_postDelayedFrameCallbackImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_UICONTEXT_FrameCallback frameCallback, const OH_Number* delayTime) {
}
void UIContext_postFrameCallbackImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_UICONTEXT_FrameCallback frameCallback) {
}
OH_Number UIContext_px2fpImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    return {};
}
OH_Number UIContext_px2lpxImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    return {};
}
OH_Number UIContext_px2vpImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    return {};
}
Array_DynamicSyncScene UIContext_requireDynamicSyncSceneImpl(OH_NativePointer thisPtr, const OH_String* id) {
    return {};
}
void UIContext_runScopedTaskImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Void* callback_) {
}
void UIContext_setDynamicDimmingImpl(OH_NativePointer thisPtr, const OH_String* id, const OH_Number* value) {
}
void UIContext_setKeyboardAvoidModeImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode value) {
}
OH_Boolean UIContext_setOverlayManagerOptionsImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions* options) {
    return {};
}
void UIContext_setPixelRoundModeImpl(OH_NativePointer thisPtr, const OH_CustomObject* mode) {
}
void UIContext_setUIStatesImpl(OH_NativePointer thisPtr, const OH_CustomObject* callback_) {
}
void UIContext_showActionSheetImpl(OH_NativePointer thisPtr, const OH_CustomObject* value) {
}
void UIContext_showAlertDialogImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions* options) {
}
void UIContext_showDatePickerDialogImpl(OH_NativePointer thisPtr, const OH_CustomObject* options) {
}
void UIContext_showTextPickerDialogImpl(OH_NativePointer thisPtr, const OH_CustomObject* options) {
}
void UIContext_showTimePickerDialogImpl(OH_NativePointer thisPtr, const OH_CustomObject* options) {
}
void UIContext_unbindTabsFromNestedScrollableImpl(OH_NativePointer thisPtr, const OH_CustomObject* tabsController, const OH_CustomObject* parentScroller, const OH_CustomObject* childScroller) {
}
void UIContext_unbindTabsFromScrollableImpl(OH_NativePointer thisPtr, const OH_CustomObject* tabsController, const OH_CustomObject* scroller) {
}
void UIContext_updateBindSheetImpl(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_OHOS_ARKUI_UICONTEXT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_CustomObject* bindSheetContent, const OH_CustomObject* sheetOptions, const Opt_Boolean* partialUpdate, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_Number UIContext_vp2pxImpl(OH_NativePointer thisPtr, const OH_Number* value) {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_UIInspectorHandle UIInspector_constructImpl() {
    return {};
}
OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver UIInspector_createComponentObserverImpl(OH_NativePointer thisPtr, const OH_String* id) {
    return {};
}
void UIInspector_destructImpl(OH_OHOS_ARKUI_UICONTEXT_UIInspectorHandle thisPtr) {
}
void UIObserver_addGlobalGestureListenerImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_UICONTEXT_GestureListenerType type, const OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs* option, const OHOS_ARKUI_UICONTEXT_GestureListenerCallback* callback_) {
}
OH_OHOS_ARKUI_UICONTEXT_UIObserverHandle UIObserver_constructImpl() {
    return {};
}
void UIObserver_destructImpl(OH_OHOS_ARKUI_UICONTEXT_UIObserverHandle thisPtr) {
}
void UIObserver_offAfterPanEndImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_offAfterPanStartImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_offBeforePanEndImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_offBeforePanStartImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_offDensityUpdateImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void* callback_) {
}
void UIObserver_offDidClick0Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback* callback_) {
}
void UIObserver_offDidClick1Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback* callback_) {
}
void UIObserver_offDidLayoutImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Void* callback_) {
}
void UIObserver_offNavDestinationSwitch0Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void* callback_) {
}
void UIObserver_offNavDestinationSwitch1Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions* observerOptions, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void* callback_) {
}
void UIObserver_offNavDestinationUpdate0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions* options, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void* callback_) {
}
void UIObserver_offNavDestinationUpdate1Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void* callback_) {
}
void UIObserver_offNodeRenderStateImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_NodeIdentity* nodeIdentity, const Opt_OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback* callback_) {
}
void UIObserver_offRouterPageUpdateImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void* callback_) {
}
void UIObserver_offScrollEvent0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions* options, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void* callback_) {
}
void UIObserver_offScrollEvent1Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void* callback_) {
}
void UIObserver_offTabContentUpdate0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions* options, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void* callback_) {
}
void UIObserver_offTabContentUpdate1Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void* callback_) {
}
void UIObserver_offWillClick0Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback* callback_) {
}
void UIObserver_offWillClick1Impl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback* callback_) {
}
void UIObserver_offWillDrawImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Void* callback_) {
}
void UIObserver_onAfterPanEndImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_onAfterPanStartImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_onBeforePanEndImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_onBeforePanStartImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_PanListenerCallback* callback_) {
}
void UIObserver_onDensityUpdateImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void* callback_) {
}
void UIObserver_onDidClick0Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback* callback_) {
}
void UIObserver_onDidClick1Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback* callback_) {
}
void UIObserver_onDidLayoutImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Void* callback_) {
}
void UIObserver_onNavDestinationSwitch0Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void* callback_) {
}
void UIObserver_onNavDestinationSwitch1Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions* observerOptions, const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void* callback_) {
}
void UIObserver_onNavDestinationUpdate0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void* callback_) {
}
void UIObserver_onNavDestinationUpdate1Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void* callback_) {
}
void UIObserver_onNodeRenderStateImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_NodeIdentity* nodeIdentity, const OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback* callback_) {
}
void UIObserver_onRouterPageUpdateImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void* callback_) {
}
void UIObserver_onScrollEvent0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void* callback_) {
}
void UIObserver_onScrollEvent1Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void* callback_) {
}
void UIObserver_onTabContentUpdate0Impl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions* options, const OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void* callback_) {
}
void UIObserver_onTabContentUpdate1Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void* callback_) {
}
void UIObserver_onWillClick0Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback* callback_) {
}
void UIObserver_onWillClick1Impl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback* callback_) {
}
void UIObserver_onWillDrawImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_UICONTEXT_Callback_Void* callback_) {
}
void UIObserver_removeGlobalGestureListenerImpl(OH_NativePointer thisPtr, OH_OHOS_ARKUI_UICONTEXT_GestureListenerType type, const Opt_OHOS_ARKUI_UICONTEXT_GestureListenerCallback* callback_) {
}