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

#include "core/components_ng/base/frame_node.h"
#include "core/interfaces/native/utility/converter.h"
#include "arkoala_api_generated.h"

namespace OHOS::Ace::NG::GeneratedModifier {
namespace WebModifier {
Ark_NativePointer ConstructImpl(Ark_Int32 id,
                                Ark_Int32 flags)
{
    return {};
}
} // WebModifier
namespace WebInterfaceModifier {
void SetWebOptionsImpl(Ark_NativePointer node,
                       const Ark_WebOptions* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    CHECK_NULL_VOID(value);
    //auto convValue = Converter::OptConvert<type_name>(*value);
    // WebModelNG::SetSetWebOptions(frameNode, convValue);
}
} // WebInterfaceModifier
namespace WebAttributeModifier {
void SetJavaScriptAccessImpl(Ark_NativePointer node,
                             const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetJavaScriptAccess(frameNode, convValue);
}
void SetFileAccessImpl(Ark_NativePointer node,
                       const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetFileAccess(frameNode, convValue);
}
void SetOnlineImageAccessImpl(Ark_NativePointer node,
                              const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnlineImageAccess(frameNode, convValue);
}
void SetDomStorageAccessImpl(Ark_NativePointer node,
                             const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetDomStorageAccess(frameNode, convValue);
}
void SetImageAccessImpl(Ark_NativePointer node,
                        const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetImageAccess(frameNode, convValue);
}
void SetMixedModeImpl(Ark_NativePointer node,
                      const Opt_MixedMode* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetMixedMode(frameNode, convValue);
}
void SetZoomAccessImpl(Ark_NativePointer node,
                       const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetZoomAccess(frameNode, convValue);
}
void SetGeolocationAccessImpl(Ark_NativePointer node,
                              const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetGeolocationAccess(frameNode, convValue);
}
void SetJavaScriptProxyImpl(Ark_NativePointer node,
                            const Opt_JavaScriptProxy* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetJavaScriptProxy(frameNode, convValue);
}
void SetCacheModeImpl(Ark_NativePointer node,
                      const Opt_CacheMode* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetCacheMode(frameNode, convValue);
}
void SetDarkModeImpl(Ark_NativePointer node,
                     const Opt_WebDarkMode* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetDarkMode(frameNode, convValue);
}
void SetForceDarkAccessImpl(Ark_NativePointer node,
                            const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetForceDarkAccess(frameNode, convValue);
}
void SetMediaOptionsImpl(Ark_NativePointer node,
                         const Opt_WebMediaOptions* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetMediaOptions(frameNode, convValue);
}
void SetOverviewModeAccessImpl(Ark_NativePointer node,
                               const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOverviewModeAccess(frameNode, convValue);
}
void SetOverScrollModeImpl(Ark_NativePointer node,
                           const Opt_OverScrollMode* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOverScrollMode(frameNode, convValue);
}
void SetBlurOnKeyboardHideModeImpl(Ark_NativePointer node,
                                   const Opt_BlurOnKeyboardHideMode* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetBlurOnKeyboardHideMode(frameNode, convValue);
}
void SetTextZoomRatioImpl(Ark_NativePointer node,
                          const Opt_Int32* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetTextZoomRatio(frameNode, convValue);
}
void SetDatabaseAccessImpl(Ark_NativePointer node,
                           const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetDatabaseAccess(frameNode, convValue);
}
void SetInitialScaleImpl(Ark_NativePointer node,
                         const Opt_Float64* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetInitialScale(frameNode, convValue);
}
void SetMetaViewportImpl(Ark_NativePointer node,
                         const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetMetaViewport(frameNode, convValue);
}
void SetOnPageEndImpl(Ark_NativePointer node,
                      const Opt_Callback_OnPageEndEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnPageEnd(frameNode, convValue);
}
void SetOnPageBeginImpl(Ark_NativePointer node,
                        const Opt_Callback_OnPageBeginEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnPageBegin(frameNode, convValue);
}
void SetOnProgressChangeImpl(Ark_NativePointer node,
                             const Opt_Callback_OnProgressChangeEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnProgressChange(frameNode, convValue);
}
void SetOnTitleReceiveImpl(Ark_NativePointer node,
                           const Opt_Callback_OnTitleReceiveEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnTitleReceive(frameNode, convValue);
}
void SetOnGeolocationHideImpl(Ark_NativePointer node,
                              const Opt_Callback_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnGeolocationHide(frameNode, convValue);
}
void SetOnGeolocationShowImpl(Ark_NativePointer node,
                              const Opt_Callback_OnGeolocationShowEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnGeolocationShow(frameNode, convValue);
}
void SetOnRequestSelectedImpl(Ark_NativePointer node,
                              const Opt_Callback_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnRequestSelected(frameNode, convValue);
}
void SetOnAlertImpl(Ark_NativePointer node,
                    const Opt_Callback_OnAlertEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnAlert(frameNode, convValue);
}
void SetOnBeforeUnloadImpl(Ark_NativePointer node,
                           const Opt_Callback_OnBeforeUnloadEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnBeforeUnload(frameNode, convValue);
}
void SetOnConfirmImpl(Ark_NativePointer node,
                      const Opt_Callback_OnConfirmEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnConfirm(frameNode, convValue);
}
void SetOnPromptImpl(Ark_NativePointer node,
                     const Opt_Callback_OnPromptEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnPrompt(frameNode, convValue);
}
void SetOnConsoleImpl(Ark_NativePointer node,
                      const Opt_Callback_OnConsoleEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnConsole(frameNode, convValue);
}
void SetOnErrorReceiveImpl(Ark_NativePointer node,
                           const Opt_Callback_OnErrorReceiveEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnErrorReceive(frameNode, convValue);
}
void SetOnHttpErrorReceiveImpl(Ark_NativePointer node,
                               const Opt_Callback_OnHttpErrorReceiveEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnHttpErrorReceive(frameNode, convValue);
}
void SetOnDownloadStartImpl(Ark_NativePointer node,
                            const Opt_Callback_OnDownloadStartEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnDownloadStart(frameNode, convValue);
}
void SetOnRefreshAccessedHistoryImpl(Ark_NativePointer node,
                                     const Opt_Callback_OnRefreshAccessedHistoryEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnRefreshAccessedHistory(frameNode, convValue);
}
void SetOnRenderExitedImpl(Ark_NativePointer node,
                           const Opt_Callback_OnRenderExitedEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnRenderExited(frameNode, convValue);
}
void SetOnShowFileSelectorImpl(Ark_NativePointer node,
                               const Opt_Callback_OnShowFileSelectorEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnShowFileSelector(frameNode, convValue);
}
void SetOnResourceLoadImpl(Ark_NativePointer node,
                           const Opt_Callback_OnResourceLoadEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnResourceLoad(frameNode, convValue);
}
void SetOnFullScreenExitImpl(Ark_NativePointer node,
                             const Opt_Callback_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnFullScreenExit(frameNode, convValue);
}
void SetOnFullScreenEnterImpl(Ark_NativePointer node,
                              const Opt_OnFullScreenEnterCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnFullScreenEnter(frameNode, convValue);
}
void SetOnScaleChangeImpl(Ark_NativePointer node,
                          const Opt_Callback_OnScaleChangeEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnScaleChange(frameNode, convValue);
}
void SetOnHttpAuthRequestImpl(Ark_NativePointer node,
                              const Opt_Callback_OnHttpAuthRequestEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnHttpAuthRequest(frameNode, convValue);
}
void SetOnInterceptRequestImpl(Ark_NativePointer node,
                               const Opt_Callback_OnInterceptRequestEvent_WebResourceResponse* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnInterceptRequest(frameNode, convValue);
}
void SetOnPermissionRequestImpl(Ark_NativePointer node,
                                const Opt_Callback_OnPermissionRequestEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnPermissionRequest(frameNode, convValue);
}
void SetOnScreenCaptureRequestImpl(Ark_NativePointer node,
                                   const Opt_Callback_OnScreenCaptureRequestEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnScreenCaptureRequest(frameNode, convValue);
}
void SetOnContextMenuShowImpl(Ark_NativePointer node,
                              const Opt_Callback_OnContextMenuShowEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnContextMenuShow(frameNode, convValue);
}
void SetOnContextMenuHideImpl(Ark_NativePointer node,
                              const Opt_OnContextMenuHideCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnContextMenuHide(frameNode, convValue);
}
void SetMediaPlayGestureAccessImpl(Ark_NativePointer node,
                                   const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetMediaPlayGestureAccess(frameNode, convValue);
}
void SetOnSearchResultReceiveImpl(Ark_NativePointer node,
                                  const Opt_Callback_OnSearchResultReceiveEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnSearchResultReceive(frameNode, convValue);
}
void SetOnScrollImpl(Ark_NativePointer node,
                     const Opt_Callback_OnScrollEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnScroll(frameNode, convValue);
}
void SetOnSslErrorEventReceiveImpl(Ark_NativePointer node,
                                   const Opt_Callback_OnSslErrorEventReceiveEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnSslErrorEventReceive(frameNode, convValue);
}
void SetOnSslErrorEventImpl(Ark_NativePointer node,
                            const Opt_OnSslErrorEventCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnSslErrorEvent(frameNode, convValue);
}
void SetOnClientAuthenticationRequestImpl(Ark_NativePointer node,
                                          const Opt_Callback_OnClientAuthenticationEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnClientAuthenticationRequest(frameNode, convValue);
}
void SetOnWindowNewImpl(Ark_NativePointer node,
                        const Opt_Callback_OnWindowNewEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnWindowNew(frameNode, convValue);
}
void SetOnWindowExitImpl(Ark_NativePointer node,
                         const Opt_Callback_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnWindowExit(frameNode, convValue);
}
void SetMultiWindowAccessImpl(Ark_NativePointer node,
                              const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetMultiWindowAccess(frameNode, convValue);
}
void SetOnInterceptKeyEventImpl(Ark_NativePointer node,
                                const Opt_Callback_KeyEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnInterceptKeyEvent(frameNode, convValue);
}
void SetWebStandardFontImpl(Ark_NativePointer node,
                            const Opt_String* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetWebStandardFont(frameNode, convValue);
}
void SetWebSerifFontImpl(Ark_NativePointer node,
                         const Opt_String* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetWebSerifFont(frameNode, convValue);
}
void SetWebSansSerifFontImpl(Ark_NativePointer node,
                             const Opt_String* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetWebSansSerifFont(frameNode, convValue);
}
void SetWebFixedFontImpl(Ark_NativePointer node,
                         const Opt_String* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetWebFixedFont(frameNode, convValue);
}
void SetWebFantasyFontImpl(Ark_NativePointer node,
                           const Opt_String* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetWebFantasyFont(frameNode, convValue);
}
void SetWebCursiveFontImpl(Ark_NativePointer node,
                           const Opt_String* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetWebCursiveFont(frameNode, convValue);
}
void SetDefaultFixedFontSizeImpl(Ark_NativePointer node,
                                 const Opt_Int32* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetDefaultFixedFontSize(frameNode, convValue);
}
void SetDefaultFontSizeImpl(Ark_NativePointer node,
                            const Opt_Int32* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetDefaultFontSize(frameNode, convValue);
}
void SetMinFontSizeImpl(Ark_NativePointer node,
                        const Opt_Int32* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetMinFontSize(frameNode, convValue);
}
void SetMinLogicalFontSizeImpl(Ark_NativePointer node,
                               const Opt_Int32* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetMinLogicalFontSize(frameNode, convValue);
}
void SetDefaultTextEncodingFormatImpl(Ark_NativePointer node,
                                      const Opt_String* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetDefaultTextEncodingFormat(frameNode, convValue);
}
void SetForceDisplayScrollBarImpl(Ark_NativePointer node,
                                  const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetForceDisplayScrollBar(frameNode, convValue);
}
void SetBlockNetworkImpl(Ark_NativePointer node,
                         const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetBlockNetwork(frameNode, convValue);
}
void SetHorizontalScrollBarAccessImpl(Ark_NativePointer node,
                                      const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetHorizontalScrollBarAccess(frameNode, convValue);
}
void SetVerticalScrollBarAccessImpl(Ark_NativePointer node,
                                    const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetVerticalScrollBarAccess(frameNode, convValue);
}
void SetOnTouchIconUrlReceivedImpl(Ark_NativePointer node,
                                   const Opt_Callback_OnTouchIconUrlReceivedEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnTouchIconUrlReceived(frameNode, convValue);
}
void SetOnFaviconReceivedImpl(Ark_NativePointer node,
                              const Opt_Callback_OnFaviconReceivedEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnFaviconReceived(frameNode, convValue);
}
void SetOnPageVisibleImpl(Ark_NativePointer node,
                          const Opt_Callback_OnPageVisibleEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnPageVisible(frameNode, convValue);
}
void SetOnDataResubmittedImpl(Ark_NativePointer node,
                              const Opt_Callback_OnDataResubmittedEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnDataResubmitted(frameNode, convValue);
}
void SetPinchSmoothImpl(Ark_NativePointer node,
                        const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetPinchSmooth(frameNode, convValue);
}
void SetAllowWindowOpenMethodImpl(Ark_NativePointer node,
                                  const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetAllowWindowOpenMethod(frameNode, convValue);
}
void SetOnAudioStateChangedImpl(Ark_NativePointer node,
                                const Opt_Callback_OnAudioStateChangedEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnAudioStateChanged(frameNode, convValue);
}
void SetOnFirstContentfulPaintImpl(Ark_NativePointer node,
                                   const Opt_Callback_OnFirstContentfulPaintEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnFirstContentfulPaint(frameNode, convValue);
}
void SetOnFirstMeaningfulPaintImpl(Ark_NativePointer node,
                                   const Opt_OnFirstMeaningfulPaintCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnFirstMeaningfulPaint(frameNode, convValue);
}
void SetOnLargestContentfulPaintImpl(Ark_NativePointer node,
                                     const Opt_OnLargestContentfulPaintCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnLargestContentfulPaint(frameNode, convValue);
}
void SetOnLoadInterceptImpl(Ark_NativePointer node,
                            const Opt_Callback_OnLoadInterceptEvent_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnLoadIntercept(frameNode, convValue);
}
void SetOnControllerAttachedImpl(Ark_NativePointer node,
                                 const Opt_Callback_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnControllerAttached(frameNode, convValue);
}
void SetOnOverScrollImpl(Ark_NativePointer node,
                         const Opt_Callback_OnOverScrollEvent_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnOverScroll(frameNode, convValue);
}
void SetOnSafeBrowsingCheckResultImpl(Ark_NativePointer node,
                                      const Opt_OnSafeBrowsingCheckResultCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnSafeBrowsingCheckResult(frameNode, convValue);
}
void SetOnNavigationEntryCommittedImpl(Ark_NativePointer node,
                                       const Opt_OnNavigationEntryCommittedCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnNavigationEntryCommitted(frameNode, convValue);
}
void SetOnIntelligentTrackingPreventionResultImpl(Ark_NativePointer node,
                                                  const Opt_OnIntelligentTrackingPreventionCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnIntelligentTrackingPreventionResult(frameNode, convValue);
}
void SetJavaScriptOnDocumentStartImpl(Ark_NativePointer node,
                                      const Opt_Array_ScriptItem* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetJavaScriptOnDocumentStart(frameNode, convValue);
}
void SetJavaScriptOnDocumentEndImpl(Ark_NativePointer node,
                                    const Opt_Array_ScriptItem* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetJavaScriptOnDocumentEnd(frameNode, convValue);
}
void SetLayoutModeImpl(Ark_NativePointer node,
                       const Opt_WebLayoutMode* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetLayoutMode(frameNode, convValue);
}
void SetNestedScrollImpl(Ark_NativePointer node,
                         const Opt_Union_NestedScrollOptions_NestedScrollOptionsExt* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetNestedScroll(frameNode, convValue);
}
void SetEnableNativeEmbedModeImpl(Ark_NativePointer node,
                                  const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetEnableNativeEmbedMode(frameNode, convValue);
}
void SetOnNativeEmbedLifecycleChangeImpl(Ark_NativePointer node,
                                         const Opt_Callback_NativeEmbedDataInfo_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnNativeEmbedLifecycleChange(frameNode, convValue);
}
void SetOnNativeEmbedVisibilityChangeImpl(Ark_NativePointer node,
                                          const Opt_OnNativeEmbedVisibilityChangeCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnNativeEmbedVisibilityChange(frameNode, convValue);
}
void SetOnNativeEmbedGestureEventImpl(Ark_NativePointer node,
                                      const Opt_Callback_NativeEmbedTouchInfo_Void* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnNativeEmbedGestureEvent(frameNode, convValue);
}
void SetCopyOptionsImpl(Ark_NativePointer node,
                        const Opt_CopyOptions* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetCopyOptions(frameNode, convValue);
}
void SetOnOverrideUrlLoadingImpl(Ark_NativePointer node,
                                 const Opt_OnOverrideUrlLoadingCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnOverrideUrlLoading(frameNode, convValue);
}
void SetTextAutosizingImpl(Ark_NativePointer node,
                           const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetTextAutosizing(frameNode, convValue);
}
void SetEnableNativeMediaPlayerImpl(Ark_NativePointer node,
                                    const Opt_NativeMediaPlayerConfig* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetEnableNativeMediaPlayer(frameNode, convValue);
}
void SetOnRenderProcessNotRespondingImpl(Ark_NativePointer node,
                                         const Opt_OnRenderProcessNotRespondingCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnRenderProcessNotResponding(frameNode, convValue);
}
void SetOnRenderProcessRespondingImpl(Ark_NativePointer node,
                                      const Opt_OnRenderProcessRespondingCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnRenderProcessResponding(frameNode, convValue);
}
void SetOnViewportFitChangedImpl(Ark_NativePointer node,
                                 const Opt_OnViewportFitChangedCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnViewportFitChanged(frameNode, convValue);
}
void SetOnInterceptKeyboardAttachImpl(Ark_NativePointer node,
                                      const Opt_WebKeyboardCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnInterceptKeyboardAttach(frameNode, convValue);
}
void SetOnAdsBlockedImpl(Ark_NativePointer node,
                         const Opt_OnAdsBlockedCallback* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOnAdsBlocked(frameNode, convValue);
}
void SetKeyboardAvoidModeImpl(Ark_NativePointer node,
                              const Opt_WebKeyboardAvoidMode* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetKeyboardAvoidMode(frameNode, convValue);
}
void SetEditMenuOptionsImpl(Ark_NativePointer node,
                            const Opt_EditMenuOptions* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetEditMenuOptions(frameNode, convValue);
}
void SetEnableHapticFeedbackImpl(Ark_NativePointer node,
                                 const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetEnableHapticFeedback(frameNode, convValue);
}
void SetOptimizeParserBudgetImpl(Ark_NativePointer node,
                                 const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetOptimizeParserBudget(frameNode, convValue);
}
void SetEnableFollowSystemFontWeightImpl(Ark_NativePointer node,
                                         const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetEnableFollowSystemFontWeight(frameNode, convValue);
}
void SetEnableWebAVSessionImpl(Ark_NativePointer node,
                               const Opt_Boolean* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetEnableWebAVSession(frameNode, convValue);
}
void SetRunJavaScriptOnDocumentStartImpl(Ark_NativePointer node,
                                         const Opt_Array_ScriptItem* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetRunJavaScriptOnDocumentStart(frameNode, convValue);
}
void SetRunJavaScriptOnDocumentEndImpl(Ark_NativePointer node,
                                       const Opt_Array_ScriptItem* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetRunJavaScriptOnDocumentEnd(frameNode, convValue);
}
void SetRunJavaScriptOnHeadEndImpl(Ark_NativePointer node,
                                   const Opt_Array_ScriptItem* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetRunJavaScriptOnHeadEnd(frameNode, convValue);
}
void SetNativeEmbedOptionsImpl(Ark_NativePointer node,
                               const Opt_EmbedOptions* value)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = value ? Converter::OptConvert<type>(*value) : std::nullopt;
    // WebModelNG::SetSetNativeEmbedOptions(frameNode, convValue);
}
void SetRegisterNativeEmbedRuleImpl(Ark_NativePointer node,
                                    const Opt_String* tag,
                                    const Opt_String* type)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = Converter::Convert<type>(tag);
    //auto convValue = Converter::OptConvert<type>(tag); // for enums
    // WebModelNG::SetSetRegisterNativeEmbedRule(frameNode, convValue);
}
void SetBindSelectionMenuImpl(Ark_NativePointer node,
                              const Opt_WebElementType* elementType,
                              const Opt_CustomNodeBuilder* content,
                              const Opt_WebResponseType* responseType,
                              const Opt_SelectionMenuOptionsExt* options)
{
    auto frameNode = reinterpret_cast<FrameNode *>(node);
    CHECK_NULL_VOID(frameNode);
    //auto convValue = Converter::Convert<type>(elementType);
    //auto convValue = Converter::OptConvert<type>(elementType); // for enums
    // WebModelNG::SetSetBindSelectionMenu(frameNode, convValue);
}
} // WebAttributeModifier
const GENERATED_ArkUIWebModifier* GetWebModifier()
{
    static const GENERATED_ArkUIWebModifier ArkUIWebModifierImpl {
        WebModifier::ConstructImpl,
        WebInterfaceModifier::SetWebOptionsImpl,
        WebAttributeModifier::SetJavaScriptAccessImpl,
        WebAttributeModifier::SetFileAccessImpl,
        WebAttributeModifier::SetOnlineImageAccessImpl,
        WebAttributeModifier::SetDomStorageAccessImpl,
        WebAttributeModifier::SetImageAccessImpl,
        WebAttributeModifier::SetMixedModeImpl,
        WebAttributeModifier::SetZoomAccessImpl,
        WebAttributeModifier::SetGeolocationAccessImpl,
        WebAttributeModifier::SetJavaScriptProxyImpl,
        WebAttributeModifier::SetCacheModeImpl,
        WebAttributeModifier::SetDarkModeImpl,
        WebAttributeModifier::SetForceDarkAccessImpl,
        WebAttributeModifier::SetMediaOptionsImpl,
        WebAttributeModifier::SetOverviewModeAccessImpl,
        WebAttributeModifier::SetOverScrollModeImpl,
        WebAttributeModifier::SetBlurOnKeyboardHideModeImpl,
        WebAttributeModifier::SetTextZoomRatioImpl,
        WebAttributeModifier::SetDatabaseAccessImpl,
        WebAttributeModifier::SetInitialScaleImpl,
        WebAttributeModifier::SetMetaViewportImpl,
        WebAttributeModifier::SetOnPageEndImpl,
        WebAttributeModifier::SetOnPageBeginImpl,
        WebAttributeModifier::SetOnProgressChangeImpl,
        WebAttributeModifier::SetOnTitleReceiveImpl,
        WebAttributeModifier::SetOnGeolocationHideImpl,
        WebAttributeModifier::SetOnGeolocationShowImpl,
        WebAttributeModifier::SetOnRequestSelectedImpl,
        WebAttributeModifier::SetOnAlertImpl,
        WebAttributeModifier::SetOnBeforeUnloadImpl,
        WebAttributeModifier::SetOnConfirmImpl,
        WebAttributeModifier::SetOnPromptImpl,
        WebAttributeModifier::SetOnConsoleImpl,
        WebAttributeModifier::SetOnErrorReceiveImpl,
        WebAttributeModifier::SetOnHttpErrorReceiveImpl,
        WebAttributeModifier::SetOnDownloadStartImpl,
        WebAttributeModifier::SetOnRefreshAccessedHistoryImpl,
        WebAttributeModifier::SetOnRenderExitedImpl,
        WebAttributeModifier::SetOnShowFileSelectorImpl,
        WebAttributeModifier::SetOnResourceLoadImpl,
        WebAttributeModifier::SetOnFullScreenExitImpl,
        WebAttributeModifier::SetOnFullScreenEnterImpl,
        WebAttributeModifier::SetOnScaleChangeImpl,
        WebAttributeModifier::SetOnHttpAuthRequestImpl,
        WebAttributeModifier::SetOnInterceptRequestImpl,
        WebAttributeModifier::SetOnPermissionRequestImpl,
        WebAttributeModifier::SetOnScreenCaptureRequestImpl,
        WebAttributeModifier::SetOnContextMenuShowImpl,
        WebAttributeModifier::SetOnContextMenuHideImpl,
        WebAttributeModifier::SetMediaPlayGestureAccessImpl,
        WebAttributeModifier::SetOnSearchResultReceiveImpl,
        WebAttributeModifier::SetOnScrollImpl,
        WebAttributeModifier::SetOnSslErrorEventReceiveImpl,
        WebAttributeModifier::SetOnSslErrorEventImpl,
        WebAttributeModifier::SetOnClientAuthenticationRequestImpl,
        WebAttributeModifier::SetOnWindowNewImpl,
        WebAttributeModifier::SetOnWindowExitImpl,
        WebAttributeModifier::SetMultiWindowAccessImpl,
        WebAttributeModifier::SetOnInterceptKeyEventImpl,
        WebAttributeModifier::SetWebStandardFontImpl,
        WebAttributeModifier::SetWebSerifFontImpl,
        WebAttributeModifier::SetWebSansSerifFontImpl,
        WebAttributeModifier::SetWebFixedFontImpl,
        WebAttributeModifier::SetWebFantasyFontImpl,
        WebAttributeModifier::SetWebCursiveFontImpl,
        WebAttributeModifier::SetDefaultFixedFontSizeImpl,
        WebAttributeModifier::SetDefaultFontSizeImpl,
        WebAttributeModifier::SetMinFontSizeImpl,
        WebAttributeModifier::SetMinLogicalFontSizeImpl,
        WebAttributeModifier::SetDefaultTextEncodingFormatImpl,
        WebAttributeModifier::SetForceDisplayScrollBarImpl,
        WebAttributeModifier::SetBlockNetworkImpl,
        WebAttributeModifier::SetHorizontalScrollBarAccessImpl,
        WebAttributeModifier::SetVerticalScrollBarAccessImpl,
        WebAttributeModifier::SetOnTouchIconUrlReceivedImpl,
        WebAttributeModifier::SetOnFaviconReceivedImpl,
        WebAttributeModifier::SetOnPageVisibleImpl,
        WebAttributeModifier::SetOnDataResubmittedImpl,
        WebAttributeModifier::SetPinchSmoothImpl,
        WebAttributeModifier::SetAllowWindowOpenMethodImpl,
        WebAttributeModifier::SetOnAudioStateChangedImpl,
        WebAttributeModifier::SetOnFirstContentfulPaintImpl,
        WebAttributeModifier::SetOnFirstMeaningfulPaintImpl,
        WebAttributeModifier::SetOnLargestContentfulPaintImpl,
        WebAttributeModifier::SetOnLoadInterceptImpl,
        WebAttributeModifier::SetOnControllerAttachedImpl,
        WebAttributeModifier::SetOnOverScrollImpl,
        WebAttributeModifier::SetOnSafeBrowsingCheckResultImpl,
        WebAttributeModifier::SetOnNavigationEntryCommittedImpl,
        WebAttributeModifier::SetOnIntelligentTrackingPreventionResultImpl,
        WebAttributeModifier::SetJavaScriptOnDocumentStartImpl,
        WebAttributeModifier::SetJavaScriptOnDocumentEndImpl,
        WebAttributeModifier::SetLayoutModeImpl,
        WebAttributeModifier::SetNestedScrollImpl,
        WebAttributeModifier::SetEnableNativeEmbedModeImpl,
        WebAttributeModifier::SetOnNativeEmbedLifecycleChangeImpl,
        WebAttributeModifier::SetOnNativeEmbedVisibilityChangeImpl,
        WebAttributeModifier::SetOnNativeEmbedGestureEventImpl,
        WebAttributeModifier::SetCopyOptionsImpl,
        WebAttributeModifier::SetOnOverrideUrlLoadingImpl,
        WebAttributeModifier::SetTextAutosizingImpl,
        WebAttributeModifier::SetEnableNativeMediaPlayerImpl,
        WebAttributeModifier::SetOnRenderProcessNotRespondingImpl,
        WebAttributeModifier::SetOnRenderProcessRespondingImpl,
        WebAttributeModifier::SetOnViewportFitChangedImpl,
        WebAttributeModifier::SetOnInterceptKeyboardAttachImpl,
        WebAttributeModifier::SetOnAdsBlockedImpl,
        WebAttributeModifier::SetKeyboardAvoidModeImpl,
        WebAttributeModifier::SetEditMenuOptionsImpl,
        WebAttributeModifier::SetEnableHapticFeedbackImpl,
        WebAttributeModifier::SetOptimizeParserBudgetImpl,
        WebAttributeModifier::SetEnableFollowSystemFontWeightImpl,
        WebAttributeModifier::SetEnableWebAVSessionImpl,
        WebAttributeModifier::SetRunJavaScriptOnDocumentStartImpl,
        WebAttributeModifier::SetRunJavaScriptOnDocumentEndImpl,
        WebAttributeModifier::SetRunJavaScriptOnHeadEndImpl,
        WebAttributeModifier::SetNativeEmbedOptionsImpl,
        WebAttributeModifier::SetRegisterNativeEmbedRuleImpl,
        WebAttributeModifier::SetBindSelectionMenuImpl,
    };
    return &ArkUIWebModifierImpl;
}

}
