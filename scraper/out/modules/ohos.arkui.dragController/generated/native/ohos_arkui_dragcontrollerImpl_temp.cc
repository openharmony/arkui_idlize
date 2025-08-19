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
#include "ohos_arkui_dragcontroller.h"

OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionHandle dragController_DragAction_constructImpl() {
    return {};
}
void dragController_DragAction_destructImpl(OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragActionHandle thisPtr) {
}
void dragController_DragAction_offStatusChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void* callback_) {
}
void dragController_DragAction_onStatusChangeImpl(OH_NativePointer thisPtr, const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void* callback_) {
}
void dragController_DragAction_startDragImpl(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, OH_OHOS_ARKUI_DRAGCONTROLLER_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void dragController_DragPreview_animateImpl(OH_NativePointer thisPtr, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions* options, const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void* handler) {
}
OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewHandle dragController_DragPreview_constructImpl() {
    return {};
}
void dragController_DragPreview_destructImpl(OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreviewHandle thisPtr) {
}
void dragController_DragPreview_setForegroundColorImpl(OH_NativePointer thisPtr, const OH_CustomObject* color) {
}