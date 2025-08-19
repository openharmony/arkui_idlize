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
#include "ohos_web_webview.h"

OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsHandle webview_BackForwardCacheOptions_constructImpl() {
    return {};
}
void webview_BackForwardCacheOptions_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsHandle thisPtr) {
}
OH_Number webview_BackForwardCacheOptions_getSizeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_BackForwardCacheOptions_getTimeToLiveImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_BackForwardCacheOptions_setSizeImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
void webview_BackForwardCacheOptions_setTimeToLiveImpl(OH_NativePointer thisPtr, const OH_Number* value) {
}
OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesHandle webview_BackForwardCacheSupportedFeatures_constructImpl() {
    return {};
}
void webview_BackForwardCacheSupportedFeatures_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesHandle thisPtr) {
}
OH_Boolean webview_BackForwardCacheSupportedFeatures_getMediaTakeOverImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_BackForwardCacheSupportedFeatures_getNativeEmbedImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_BackForwardCacheSupportedFeatures_setMediaTakeOverImpl(OH_NativePointer thisPtr, OH_Boolean value) {
}
void webview_BackForwardCacheSupportedFeatures_setNativeEmbedImpl(OH_NativePointer thisPtr, OH_Boolean value) {
}
OH_OHOS_WEB_WEBVIEW_webview_BackForwardListHandle webview_BackForwardList_constructImpl() {
    return {};
}
void webview_BackForwardList_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_BackForwardListHandle thisPtr) {
}
OH_Int32 webview_BackForwardList_getCurrentIndexImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_HistoryItem webview_BackForwardList_getItemAtIndexImpl(OH_NativePointer thisPtr, OH_Int32 index) {
    return {};
}
OH_Int32 webview_BackForwardList_getSizeImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_BackForwardList_setCurrentIndexImpl(OH_NativePointer thisPtr, OH_Int32 value) {
}
void webview_BackForwardList_setSizeImpl(OH_NativePointer thisPtr, OH_Int32 value) {
}
OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtHandle webview_JsMessageExt_constructImpl() {
    return {};
}
void webview_JsMessageExt_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtHandle thisPtr) {
}
OH_Buffer webview_JsMessageExt_getArrayBufferImpl(OH_NativePointer thisPtr) {
    return {};
}
Array_Union_String_Number_Boolean webview_JsMessageExt_getArrayImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_JsMessageExt_getBooleanImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_JsMessageExt_getNumberImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_JsMessageExt_getStringImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_JsMessageType webview_JsMessageExt_getTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoHandle webview_MediaSourceInfo_constructImpl() {
    return {};
}
void webview_MediaSourceInfo_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoHandle thisPtr) {
}
OH_String webview_MediaSourceInfo_getFormatImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_MediaSourceInfo_getSourceImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_SourceType webview_MediaSourceInfo_getTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_MediaSourceInfo_setFormatImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
void webview_MediaSourceInfo_setSourceImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
void webview_MediaSourceInfo_setTypeImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_SourceType value) {
}
OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeHandle webview_NativeMediaPlayerBridge_constructImpl() {
    return {};
}
void webview_NativeMediaPlayerBridge_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeHandle thisPtr) {
}
void webview_NativeMediaPlayerBridge_enterFullscreenImpl(OH_NativePointer thisPtr) {
}
void webview_NativeMediaPlayerBridge_exitFullscreenImpl(OH_NativePointer thisPtr) {
}
OHOS_WEB_WEBVIEW_webview_ResumePlayerFn webview_NativeMediaPlayerBridge_getResumePlayerImpl(OH_NativePointer thisPtr) {
    return {};
}
OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn webview_NativeMediaPlayerBridge_getSuspendPlayerImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_NativeMediaPlayerBridge_pauseImpl(OH_NativePointer thisPtr) {
}
void webview_NativeMediaPlayerBridge_playImpl(OH_NativePointer thisPtr) {
}
void webview_NativeMediaPlayerBridge_releaseImpl(OH_NativePointer thisPtr) {
}
void webview_NativeMediaPlayerBridge_seekImpl(OH_NativePointer thisPtr, OH_Float64 targetTime) {
}
void webview_NativeMediaPlayerBridge_setMutedImpl(OH_NativePointer thisPtr, OH_Boolean muted) {
}
void webview_NativeMediaPlayerBridge_setPlaybackRateImpl(OH_NativePointer thisPtr, OH_Float64 playbackRate) {
}
void webview_NativeMediaPlayerBridge_setResumePlayerImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_ResumePlayerFn* value) {
}
void webview_NativeMediaPlayerBridge_setSuspendPlayerImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn* value) {
}
void webview_NativeMediaPlayerBridge_setVolumeImpl(OH_NativePointer thisPtr, OH_Float64 volume) {
}
void webview_NativeMediaPlayerBridge_updateRectImpl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, OH_Float64 width, OH_Float64 height) {
}
OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerHandle webview_NativeMediaPlayerHandler_constructImpl() {
    return {};
}
void webview_NativeMediaPlayerHandler_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerHandle thisPtr) {
}
void webview_NativeMediaPlayerHandler_handleBufferedEndTimeChangedImpl(OH_NativePointer thisPtr, OH_Float64 bufferedEndTime) {
}
void webview_NativeMediaPlayerHandler_handleDurationChangedImpl(OH_NativePointer thisPtr, OH_Float64 duration) {
}
void webview_NativeMediaPlayerHandler_handleEndedImpl(OH_NativePointer thisPtr) {
}
void webview_NativeMediaPlayerHandler_handleErrorImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_MediaError error, const OH_String* errorMessage) {
}
void webview_NativeMediaPlayerHandler_handleFullscreenChangedImpl(OH_NativePointer thisPtr, OH_Boolean fullscreen) {
}
void webview_NativeMediaPlayerHandler_handleMutedChangedImpl(OH_NativePointer thisPtr, OH_Boolean muted) {
}
void webview_NativeMediaPlayerHandler_handleNetworkStateChangedImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_NetworkState state) {
}
void webview_NativeMediaPlayerHandler_handlePlaybackRateChangedImpl(OH_NativePointer thisPtr, OH_Float64 playbackRate) {
}
void webview_NativeMediaPlayerHandler_handleReadyStateChangedImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_ReadyState state) {
}
void webview_NativeMediaPlayerHandler_handleSeekFinishedImpl(OH_NativePointer thisPtr) {
}
void webview_NativeMediaPlayerHandler_handleSeekingImpl(OH_NativePointer thisPtr) {
}
void webview_NativeMediaPlayerHandler_handleStatusChangedImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus status) {
}
void webview_NativeMediaPlayerHandler_handleTimeUpdateImpl(OH_NativePointer thisPtr, OH_Float64 currentPlayTime) {
}
void webview_NativeMediaPlayerHandler_handleVideoSizeChangedImpl(OH_NativePointer thisPtr, OH_Float64 width, OH_Float64 height) {
}
void webview_NativeMediaPlayerHandler_handleVolumeChangedImpl(OH_NativePointer thisPtr, OH_Float64 volume) {
}
OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoHandle webview_NativeMediaPlayerSurfaceInfo_constructImpl() {
    return {};
}
void webview_NativeMediaPlayerSurfaceInfo_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoHandle thisPtr) {
}
OH_String webview_NativeMediaPlayerSurfaceInfo_getIdImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_RectEvent webview_NativeMediaPlayerSurfaceInfo_getRectImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_NativeMediaPlayerSurfaceInfo_setIdImpl(OH_NativePointer thisPtr, const OH_String* value) {
}
void webview_NativeMediaPlayerSurfaceInfo_setRectImpl(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_RectEvent* value) {
}
OH_OHOS_WEB_WEBVIEW_webview_PdfDataHandle webview_PdfData_constructImpl() {
    return {};
}
void webview_PdfData_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_PdfDataHandle thisPtr) {
}
OH_Buffer webview_PdfData_pdfArrayBufferImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateHandle webview_WebDownloadDelegate_constructImpl() {
    return {};
}
void webview_WebDownloadDelegate_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateHandle thisPtr) {
}
void webview_WebDownloadDelegate_onBeforeDownloadImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_) {
}
void webview_WebDownloadDelegate_onDownloadFailedImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_) {
}
void webview_WebDownloadDelegate_onDownloadFinishImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_) {
}
void webview_WebDownloadDelegate_onDownloadUpdatedImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_) {
}
void webview_WebDownloadItem_cancelImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemHandle webview_WebDownloadItem_constructImpl() {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem webview_WebDownloadItem_deserializeImpl(const OH_Buffer* serializedData) {
    return {};
}
void webview_WebDownloadItem_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemHandle thisPtr) {
}
OH_Number webview_WebDownloadItem_getCurrentSpeedImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebDownloadItem_getFullPathImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebDownloadItem_getGuidImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode webview_WebDownloadItem_getLastErrorCodeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebDownloadItem_getMethodImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebDownloadItem_getMimeTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_WebDownloadItem_getPercentCompleteImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_WebDownloadItem_getReceivedBytesImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState webview_WebDownloadItem_getStateImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebDownloadItem_getSuggestedFileNameImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_WebDownloadItem_getTotalBytesImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebDownloadItem_getUrlImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebDownloadItem_pauseImpl(OH_NativePointer thisPtr) {
}
void webview_WebDownloadItem_resumeImpl(OH_NativePointer thisPtr) {
}
OH_Buffer webview_WebDownloadItem_serializeImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebDownloadItem_startImpl(OH_NativePointer thisPtr, const OH_String* downloadPath) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamHandle webview_WebHttpBodyStream_constructImpl() {
    return {};
}
void webview_WebHttpBodyStream_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamHandle thisPtr) {
}
OH_Number webview_WebHttpBodyStream_getPositionImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_WebHttpBodyStream_getSizeImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebHttpBodyStream_initializeImpl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_Boolean webview_WebHttpBodyStream_isChunkedImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebHttpBodyStream_isEofImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebHttpBodyStream_isInMemoryImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebHttpBodyStream_readImpl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Number* size, const OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtHandle webview_WebMessageExt_constructImpl() {
    return {};
}
void webview_WebMessageExt_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtHandle thisPtr) {
}
OH_Buffer webview_WebMessageExt_getArrayBufferImpl(OH_NativePointer thisPtr) {
    return {};
}
Array_Union_String_Number_Boolean webview_WebMessageExt_getArrayImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebMessageExt_getBooleanImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_CustomObject webview_WebMessageExt_getErrorImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_WebMessageExt_getNumberImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebMessageExt_getStringImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_WebMessageType webview_WebMessageExt_getTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebMessageExt_setArrayBufferImpl(OH_NativePointer thisPtr, const OH_Buffer* message) {
}
void webview_WebMessageExt_setArrayImpl(OH_NativePointer thisPtr, const Array_Union_String_Number_Boolean* message) {
}
void webview_WebMessageExt_setBooleanImpl(OH_NativePointer thisPtr, OH_Boolean message) {
}
void webview_WebMessageExt_setErrorImpl(OH_NativePointer thisPtr, const OH_CustomObject* message) {
}
void webview_WebMessageExt_setNumberImpl(OH_NativePointer thisPtr, const OH_Number* message) {
}
void webview_WebMessageExt_setStringImpl(OH_NativePointer thisPtr, const OH_String* message) {
}
void webview_WebMessageExt_setTypeImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebMessageType type) {
}
void webview_WebMessagePort_closeImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortHandle webview_WebMessagePort_constructImpl() {
    return {};
}
void webview_WebMessagePort_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortHandle thisPtr) {
}
OH_Boolean webview_WebMessagePort_getIsExtentionTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebMessagePort_onMessageEventExtImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void* callback_) {
}
void webview_WebMessagePort_onMessageEventImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void* callback_) {
}
void webview_WebMessagePort_postMessageEventExtImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt message) {
}
void webview_WebMessagePort_postMessageEventImpl(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_WebMessage* message) {
}
void webview_WebMessagePort_setIsExtentionTypeImpl(OH_NativePointer thisPtr, OH_Boolean value) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerHandle webview_WebResourceHandler_constructImpl() {
    return {};
}
void webview_WebResourceHandler_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerHandle thisPtr) {
}
void webview_WebResourceHandler_didFailImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_WebNetErrorList code) {
}
void webview_WebResourceHandler_didFinishImpl(OH_NativePointer thisPtr) {
}
void webview_WebResourceHandler_didReceiveResponseBodyImpl(OH_NativePointer thisPtr, const OH_Buffer* data) {
}
void webview_WebResourceHandler_didReceiveResponseImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse response) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerHandle webview_WebSchemeHandler_constructImpl() {
    return {};
}
void webview_WebSchemeHandler_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerHandle thisPtr) {
}
void webview_WebSchemeHandler_onRequestStartImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean* callback_) {
}
void webview_WebSchemeHandler_onRequestStopImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void* callback_) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestHandle webview_WebSchemeHandlerRequest_constructImpl() {
    return {};
}
void webview_WebSchemeHandlerRequest_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestHandle thisPtr) {
}
OH_String webview_WebSchemeHandlerRequest_getFrameUrlImpl(OH_NativePointer thisPtr) {
    return {};
}
Array_webview_WebHeader webview_WebSchemeHandlerRequest_getHeaderImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_webview_WebHttpBodyStream webview_WebSchemeHandlerRequest_getHttpBodyStreamImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebSchemeHandlerRequest_getReferrerImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebSchemeHandlerRequest_getRequestMethodImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_WebResourceType webview_WebSchemeHandlerRequest_getRequestResourceTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebSchemeHandlerRequest_getRequestUrlImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebSchemeHandlerRequest_hasGestureImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebSchemeHandlerRequest_isMainFrameImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseHandle webview_WebSchemeHandlerResponse_constructImpl() {
    return {};
}
void webview_WebSchemeHandlerResponse_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseHandle thisPtr) {
}
OH_String webview_WebSchemeHandlerResponse_getEncodingImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebSchemeHandlerResponse_getHeaderByNameImpl(OH_NativePointer thisPtr, const OH_String* name) {
    return {};
}
OH_String webview_WebSchemeHandlerResponse_getMimeTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_WebNetErrorList webview_WebSchemeHandlerResponse_getNetErrorCodeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number webview_WebSchemeHandlerResponse_getStatusImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebSchemeHandlerResponse_getStatusTextImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebSchemeHandlerResponse_getUrlImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebSchemeHandlerResponse_setEncodingImpl(OH_NativePointer thisPtr, const OH_String* encoding) {
}
void webview_WebSchemeHandlerResponse_setHeaderByNameImpl(OH_NativePointer thisPtr, const OH_String* name, const OH_String* value, OH_Boolean overwrite) {
}
void webview_WebSchemeHandlerResponse_setMimeTypeImpl(OH_NativePointer thisPtr, const OH_String* type) {
}
void webview_WebSchemeHandlerResponse_setNetErrorCodeImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_WebNetErrorList code) {
}
void webview_WebSchemeHandlerResponse_setStatusImpl(OH_NativePointer thisPtr, const OH_Number* code) {
}
void webview_WebSchemeHandlerResponse_setStatusTextImpl(OH_NativePointer thisPtr, const OH_String* text) {
}
void webview_WebSchemeHandlerResponse_setUrlImpl(OH_NativePointer thisPtr, const OH_String* url) {
}
OH_Boolean webview_WebviewController_accessBackwardImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebviewController_accessForwardImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebviewController_accessStepImpl(OH_NativePointer thisPtr, const OH_Number* step) {
    return {};
}
void webview_WebviewController_addIntelligentTrackingPreventionBypassingListImpl(const Array_String* hostList) {
}
void webview_WebviewController_backOrForwardImpl(OH_NativePointer thisPtr, const OH_Number* step) {
}
void webview_WebviewController_backwardImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_clearClientAuthenticationCacheImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_clearHistoryImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_clearHostIPImpl(const OH_String* hostName) {
}
void webview_WebviewController_clearIntelligentTrackingPreventionBypassingListImpl() {
}
void webview_WebviewController_clearMatchesImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_clearPrefetchedResourceImpl(const Array_String* cacheKeyList) {
}
void webview_WebviewController_clearServiceWorkerWebSchemeHandlerImpl() {
}
void webview_WebviewController_clearSslCacheImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_clearWebSchemeHandlerImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_closeAllMediaPresentationsImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_closeCameraImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerHandle webview_WebviewController_constructImpl(const Opt_String* webTag) {
    return {};
}
void webview_WebviewController_createPdf0Impl(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration* configuration, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_) {
}
void webview_WebviewController_createPdf1Impl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration* configuration, const OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
Array_webview_WebMessagePort webview_WebviewController_createWebMessagePortsImpl(OH_NativePointer thisPtr, const Opt_Boolean* isExtentionType) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter webview_WebviewController_createWebPrintDocumentAdapterImpl(OH_NativePointer thisPtr, const OH_String* jobName) {
    return {};
}
void webview_WebviewController_customizeSchemesImpl(const Array_webview_WebCustomScheme* schemes) {
}
void webview_WebviewController_deleteJavaScriptRegisterImpl(OH_NativePointer thisPtr, const OH_String* name) {
}
void webview_WebviewController_destructImpl(OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerHandle thisPtr) {
}
void webview_WebviewController_enableAdsBlockImpl(OH_NativePointer thisPtr, OH_Boolean enable) {
}
void webview_WebviewController_enableBackForwardCacheImpl(const Opt_webview_BackForwardCacheSupportedFeatures* features) {
}
void webview_WebviewController_enableIntelligentTrackingPreventionImpl(OH_NativePointer thisPtr, OH_Boolean enable) {
}
void webview_WebviewController_enableSafeBrowsingImpl(OH_NativePointer thisPtr, OH_Boolean enable) {
}
void webview_WebviewController_enableWholeWebPageDrawingImpl() {
}
void webview_WebviewController_forwardImpl(OH_NativePointer thisPtr) {
}
OH_OHOS_WEB_WEBVIEW_webview_BackForwardList webview_WebviewController_getBackForwardEntriesImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebviewController_getCertificate0Impl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void webview_WebviewController_getCertificate1Impl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_) {
}
OH_String webview_WebviewController_getCustomUserAgentImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebviewController_getDefaultUserAgentImpl() {
    return {};
}
OH_OHOS_WEB_WEBVIEW_image_PixelMap webview_WebviewController_getFaviconImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_HitTestValue webview_WebviewController_getLastHitTestImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebviewController_getLastJavascriptProxyCallingFrameUrlImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState webview_WebviewController_getMediaPlaybackStateImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebviewController_getOriginalUrlImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Int32 webview_WebviewController_getPageHeightImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebviewController_getPrintBackgroundImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode webview_WebviewController_getRenderProcessModeImpl() {
    return {};
}
OH_Boolean webview_WebviewController_getScrollableImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset webview_WebviewController_getScrollOffsetImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel webview_WebviewController_getSecurityLevelImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebviewController_getSurfaceIdImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebviewController_getTitleImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebviewController_getUrlImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String webview_WebviewController_getUserAgentImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Int32 webview_WebviewController_getWebIdImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebviewController_hasImage0Impl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void webview_WebviewController_hasImage1Impl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_) {
}
void webview_WebviewController_initializeWebEngineImpl() {
}
void webview_WebviewController_injectOfflineResourcesImpl(OH_NativePointer thisPtr, const Array_webview_OfflineResourceMap* resourceMaps) {
}
OH_Boolean webview_WebviewController_isAdsBlockEnabledForCurPageImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebviewController_isAdsBlockEnabledImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebviewController_isIncognitoModeImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebviewController_isIntelligentTrackingPreventionEnabledImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean webview_WebviewController_isSafeBrowsingEnabledImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebviewController_loadDataImpl(OH_NativePointer thisPtr, const OH_String* data, const OH_String* mimeType, const OH_String* encoding, const Opt_String* baseUrl, const Opt_String* historyUrl) {
}
void webview_WebviewController_loadUrlImpl(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_Union_String_Resource* url, const Opt_Array_webview_WebHeader* headers) {
}
void webview_WebviewController_onActiveImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_onCreateNativeMediaPlayerImpl(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback* callback_) {
}
void webview_WebviewController_onInactiveImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_pageDownImpl(OH_NativePointer thisPtr, OH_Boolean bottom) {
}
void webview_WebviewController_pageUpImpl(OH_NativePointer thisPtr, OH_Boolean top) {
}
void webview_WebviewController_pauseAllMediaImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_pauseAllTimersImpl() {
}
void webview_WebviewController_postMessageImpl(OH_NativePointer thisPtr, const OH_String* name, const Array_webview_WebMessagePort* ports, const OH_String* uri) {
}
void webview_WebviewController_postUrlImpl(OH_NativePointer thisPtr, const OH_String* url, const OH_Buffer* postData) {
}
void webview_WebviewController_precompileJavaScriptImpl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* url, const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer* script, const OH_OHOS_WEB_WEBVIEW_webview_CacheOptions* cacheOptions, const OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void webview_WebviewController_prefetchPageImpl(OH_NativePointer thisPtr, const OH_String* url, const Opt_Array_webview_WebHeader* additionalHeaders) {
}
void webview_WebviewController_prefetchResourceImpl(const OH_OHOS_WEB_WEBVIEW_webview_RequestInfo* request, const Opt_Array_webview_WebHeader* additionalHeaders, const Opt_String* cacheKey, const Opt_Int32* cacheValidTime) {
}
void webview_WebviewController_prepareForPageLoadImpl(const OH_String* url, OH_Boolean preconnectable, const OH_Number* numSockets) {
}
void webview_WebviewController_refreshImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_registerJavaScriptProxyImpl(OH_NativePointer thisPtr, const OH_Object* jsObject, const OH_String* name, const Array_String* methodList, const Opt_Array_String* asyncMethodList, const Opt_String* permission) {
}
void webview_WebviewController_removeAllCacheImpl(OH_Boolean clearRom) {
}
void webview_WebviewController_removeCacheImpl(OH_NativePointer thisPtr, OH_Boolean clearRom) {
}
void webview_WebviewController_removeIntelligentTrackingPreventionBypassingListImpl(const Array_String* hostList) {
}
void webview_WebviewController_requestFocusImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_restoreWebStateImpl(OH_NativePointer thisPtr, const OH_Buffer* state) {
}
void webview_WebviewController_resumeAllMediaImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_resumeAllTimersImpl() {
}
void webview_WebviewController_runJavaScript0Impl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* script, const OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void webview_WebviewController_runJavaScript1Impl(OH_NativePointer thisPtr, const OH_String* script, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_) {
}
void webview_WebviewController_runJavaScriptExt0Impl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer* script, const OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void webview_WebviewController_runJavaScriptExt1Impl(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer* script, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_) {
}
void webview_WebviewController_scrollByImpl(OH_NativePointer thisPtr, OH_Float64 deltaX, OH_Float64 deltaY, const Opt_Int32* duration) {
}
OH_Boolean webview_WebviewController_scrollByWithResultImpl(OH_NativePointer thisPtr, OH_Float64 deltaX, OH_Float64 deltaY) {
    return {};
}
void webview_WebviewController_scrollToImpl(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const Opt_Int32* duration) {
}
void webview_WebviewController_searchAllAsyncImpl(OH_NativePointer thisPtr, const OH_String* searchString) {
}
void webview_WebviewController_searchNextImpl(OH_NativePointer thisPtr, OH_Boolean forward) {
}
OH_Buffer webview_WebviewController_serializeWebStateImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebviewController_setAudioMutedImpl(OH_NativePointer thisPtr, OH_Boolean mute) {
}
void webview_WebviewController_setBackForwardCacheOptionsImpl(OH_NativePointer thisPtr, const Opt_webview_BackForwardCacheOptions* options) {
}
void webview_WebviewController_setConnectionTimeoutImpl(const OH_Number* timeout) {
}
void webview_WebviewController_setCustomUserAgentImpl(OH_NativePointer thisPtr, const OH_String* userAgent) {
}
void webview_WebviewController_setDownloadDelegateImpl(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate delegate) {
}
void webview_WebviewController_setHostIPImpl(const OH_String* hostName, const OH_String* address, const OH_Number* aliveTime) {
}
void webview_WebviewController_setHttpDnsImpl(OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode secureDnsMode, const OH_String* secureDnsConfig) {
}
void webview_WebviewController_setNetworkAvailableImpl(OH_NativePointer thisPtr, OH_Boolean enable) {
}
void webview_WebviewController_setPathAllowingUniversalAccessImpl(OH_NativePointer thisPtr, const Array_String* pathList) {
}
void webview_WebviewController_setPrintBackgroundImpl(OH_NativePointer thisPtr, OH_Boolean enable) {
}
void webview_WebviewController_setRenderProcessModeImpl(OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode mode) {
}
void webview_WebviewController_setScrollableImpl(OH_NativePointer thisPtr, OH_Boolean enable, const Opt_webview_ScrollType* type) {
}
void webview_WebviewController_setServiceWorkerWebSchemeHandlerImpl(const OH_String* scheme, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler handler) {
}
void webview_WebviewController_setUrlTrustListImpl(OH_NativePointer thisPtr, const OH_String* urlTrustList) {
}
void webview_WebviewController_setWebDebuggingAccess0Impl(OH_Boolean webDebuggingAccess) {
}
void webview_WebviewController_setWebDebuggingAccess1Impl(OH_Boolean webDebuggingAccess, const OH_Number* port) {
}
void webview_WebviewController_setWebSchemeHandlerImpl(OH_NativePointer thisPtr, const OH_String* scheme, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler handler) {
}
void webview_WebviewController_slideScrollImpl(OH_NativePointer thisPtr, OH_Float64 vx, OH_Float64 vy) {
}
void webview_WebviewController_startCameraImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_startDownloadImpl(OH_NativePointer thisPtr, const OH_String* url) {
}
void webview_WebviewController_stopAllMediaImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_stopCameraImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_stopImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_storeWebArchive0Impl(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* baseName, OH_Boolean autoName, const OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise) {
}
void webview_WebviewController_storeWebArchive1Impl(OH_NativePointer thisPtr, const OH_String* baseName, OH_Boolean autoName, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_) {
}
OH_Boolean webview_WebviewController_terminateRenderProcessImpl(OH_NativePointer thisPtr) {
    return {};
}
void webview_WebviewController_trimMemoryByPressureLevelImpl(OH_OHOS_WEB_WEBVIEW_webview_PressureLevel level) {
}
void webview_WebviewController_warmupServiceWorkerImpl(const OH_String* url) {
}
void webview_WebviewController_webPageSnapshotImpl(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo* info, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_) {
}
void webview_WebviewController_zoomImpl(OH_NativePointer thisPtr, OH_Float64 factor) {
}
void webview_WebviewController_zoomInImpl(OH_NativePointer thisPtr) {
}
void webview_WebviewController_zoomOutImpl(OH_NativePointer thisPtr) {
}