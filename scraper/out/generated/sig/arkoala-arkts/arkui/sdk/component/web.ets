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
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as webview } from "@ohos.web.webview"
import { CustomBuilder } from "./builder"
import { Resource } from "@global.resource"
import { Position } from "./units"
import { TouchEvent, KeyEvent, CommonMethod, NestedScrollOptions, ArkCommonMethodStyle } from "./common"
import { default as image } from "@ohos.multimedia.image"
import { MenuType, EditMenuOptions } from "./textCommon"
import { CopyOptions, NestedScrollMode } from "./enums"
export type WebviewController = webview.WebviewController;
export type OnNavigationEntryCommittedCallback = (loadCommittedDetails: LoadCommittedDetails) => void;
export type OnSslErrorEventCallback = (sslErrorEvent: SslErrorEvent) => void;
export type OnLargestContentfulPaintCallback = (largestContentfulPaint: LargestContentfulPaint) => void;
export type OnFirstMeaningfulPaintCallback = (firstMeaningfulPaint: FirstMeaningfulPaint) => void;
export type OnOverrideUrlLoadingCallback = (webResourceRequest: WebResourceRequest) => boolean;
export type OnIntelligentTrackingPreventionCallback = (details: IntelligentTrackingPreventionDetails) => void;
export type OnNativeEmbedVisibilityChangeCallback = (nativeEmbedVisibilityInfo: NativeEmbedVisibilityInfo) => void;
export declare interface NativeMediaPlayerConfig {
    enable: boolean;
    shouldOverlay: boolean;
}
export type OnRenderProcessNotRespondingCallback = (data: RenderProcessNotRespondingData) => void;
export type OnRenderProcessRespondingCallback = () => void;
export type OnViewportFitChangedCallback = (viewportFit: ViewportFit) => void;
export type OnAdsBlockedCallback = (details: AdsBlockedDetails) => void;
export declare interface AdsBlockedDetails {
    url: string;
    adsBlocked: Array<string>;
}
export declare interface WebKeyboardOptions {
    useSystemKeyboard: boolean;
    enterKeyType?: int32;
    customKeyboard?: CustomBuilder;
}
export declare class WebKeyboardController {
    constructor()
    insertText(text: string): void
    deleteForward(length: int32): void
    deleteBackward(length: int32): void
    sendFunctionKey(key: int32): void
    close(): void
}
export declare interface WebKeyboardCallbackInfo {
    controller: WebKeyboardController;
    attributes: Map<string, string>;
}
export type WebKeyboardCallback = (keyboardCallbackInfo: WebKeyboardCallbackInfo) => WebKeyboardOptions;
export enum MessageLevel {
    DEBUG = 0,
    Debug = 0,
    ERROR = 1,
    Error = 1,
    INFO = 2,
    Info = 2,
    LOG = 3,
    Log = 3,
    WARN = 4,
    Warn = 4
}
export enum MixedMode {
    ALL = 0,
    All = 0,
    COMPATIBLE = 1,
    Compatible = 1,
    NONE = 2,
    None = 2
}
export type OnSafeBrowsingCheckResultCallback = (threatType: ThreatType) => void;
export enum HitTestType {
    EDIT_TEXT = 0,
    EditText = 0,
    EMAIL = 1,
    Email = 1,
    HTTP_ANCHOR = 2,
    HttpAnchor = 2,
    HTTP_ANCHOR_IMG = 3,
    HttpAnchorImg = 3,
    IMG = 4,
    Img = 4,
    MAP = 5,
    Map = 5,
    PHONE = 6,
    Phone = 6,
    UNKNOWN = 7,
    Unknown = 7
}
export enum CacheMode {
    DEFAULT = 0,
    Default = 0,
    NONE = 1,
    None = 1,
    ONLINE = 2,
    Online = 2,
    ONLY = 3,
    Only = 3
}
export enum OverScrollMode {
    NEVER = 0,
    ALWAYS = 1
}
export enum BlurOnKeyboardHideMode {
    SILENT = 0,
    BLUR = 1
}
export enum WebDarkMode {
    OFF = 0,
    Off = 0,
    ON = 1,
    On = 1,
    AUTO = 2,
    Auto = 2
}
export enum WebCaptureMode {
    HOME_SCREEN = 0
}
export enum ThreatType {
    THREAT_ILLEGAL = 0,
    THREAT_FRAUD = 1,
    THREAT_RISK = 2,
    THREAT_WARNING = 3
}
export declare interface WebMediaOptions {
    resumeInterval?: int32;
    audioExclusive?: boolean;
    audioSessionType?: AudioSessionType;
}
export declare interface ScreenCaptureConfig {
    captureMode: WebCaptureMode;
}
export declare class FullScreenExitHandler {
    constructor()
    exitFullScreen(): void
}
export declare interface FullScreenEnterEvent {
    handler: FullScreenExitHandler;
    videoWidth?: number;
    videoHeight?: number;
}
export type OnFullScreenEnterCallback = (event: FullScreenEnterEvent) => void;
export enum RenderExitReason {
    PROCESS_ABNORMAL_TERMINATION = 0,
    ProcessAbnormalTermination = 0,
    PROCESS_WAS_KILLED = 1,
    ProcessWasKilled = 1,
    PROCESS_CRASHED = 2,
    ProcessCrashed = 2,
    PROCESS_OOM = 3,
    ProcessOom = 3,
    PROCESS_EXIT_UNKNOWN = 4,
    ProcessExitUnknown = 4
}
export type OnContextMenuHideCallback = () => void;
export enum SslError {
    INVALID = 0,
    Invalid = 0,
    HOST_MISMATCH = 1,
    HostMismatch = 1,
    DATE_INVALID = 2,
    DateInvalid = 2,
    UNTRUSTED = 3,
    Untrusted = 3
}
export enum FileSelectorMode {
    FILE_OPEN_MODE = 0,
    FileOpenMode = 0,
    FILE_OPEN_MULTIPLE_MODE = 1,
    FileOpenMultipleMode = 1,
    FILE_OPEN_FOLDER_MODE = 2,
    FileOpenFolderMode = 2,
    FILE_SAVE_MODE = 3,
    FileSaveMode = 3
}
export enum WebLayoutMode {
    NONE = 0,
    FIT_CONTENT = 1
}
export enum RenderProcessNotRespondingReason {
    INPUT_TIMEOUT = 0,
    NAVIGATION_COMMIT_TIMEOUT = 1
}
export declare class FileSelectorParam {
    constructor()
    getTitle(): string
    getMode(): FileSelectorMode
    getAcceptType(): Array<string>
    isCapture(): boolean
    getMimeTypes(): Array<string>
}
export declare class JsResult {
    constructor()
    handleCancel(): void
    handleConfirm(): void
    handlePromptConfirm(result: string): void
}
export declare class FileSelectorResult {
    constructor()
    handleFileList(fileList: Array<string>): void
}
export declare class HttpAuthHandler {
    constructor()
    confirm(userName: string, password: string): boolean
    cancel(): void
    isHttpAuthInfoSaved(): boolean
}
export declare class SslErrorHandler {
    constructor()
    handleConfirm(): void
    handleCancel(): void
}
export declare class ClientAuthenticationHandler {
    constructor()
    confirm(priKeyFile_authUri: string, certChainFile?: string): void
    cancel(): void
    ignore(): void
}
export enum ProtectedResourceType {
    MIDI_SYSEX = "'TYPE_MIDI_SYSEX'",
    MidiSysex = "'TYPE_MIDI_SYSEX'",
    VIDEO_CAPTURE = "'TYPE_VIDEO_CAPTURE'",
    AUDIO_CAPTURE = "'TYPE_AUDIO_CAPTURE'",
    SENSOR = "'TYPE_SENSOR'"
}
export declare class PermissionRequest {
    constructor()
    deny(): void
    getOrigin(): string
    getAccessibleResource(): Array<string>
    grant(resources: Array<string>): void
}
export declare class ScreenCaptureHandler {
    constructor()
    getOrigin(): string
    grant(config: ScreenCaptureConfig): void
    deny(): void
}
export declare class DataResubmissionHandler {
    constructor()
    resend(): void
    cancel(): void
}
export declare class ControllerHandler {
    constructor()
    setWebController(controller: webview.WebviewController): void
}
export enum ContextMenuSourceType {
    NONE = 0,
    None = 0,
    MOUSE = 1,
    Mouse = 1,
    LONG_PRESS = 2,
    LongPress = 2
}
export enum ContextMenuMediaType {
    NONE = 0,
    None = 0,
    IMAGE = 1,
    Image = 1
}
export enum ContextMenuInputFieldType {
    NONE = 0,
    None = 0,
    PLAIN_TEXT = 1,
    PlainText = 1,
    PASSWORD = 2,
    Password = 2,
    NUMBER = 3,
    Number = 3,
    TELEPHONE = 4,
    Telephone = 4,
    OTHER = 5,
    Other = 5
}
export enum NativeEmbedStatus {
    CREATE = 0,
    UPDATE = 1,
    DESTROY = 2,
    ENTER_BFCACHE = 3,
    LEAVE_BFCACHE = 4
}
export enum ContextMenuEditStateFlags {
    NONE = 0,
    CAN_CUT = 1,
    CAN_COPY = 2,
    CAN_PASTE = 3,
    CAN_SELECT_ALL = 4
}
export enum WebNavigationType {
    UNKNOWN = 0,
    MAIN_FRAME_NEW_ENTRY = 1,
    MAIN_FRAME_EXISTING_ENTRY = 2,
    NAVIGATION_TYPE_NEW_SUBFRAME = 4,
    NAVIGATION_TYPE_AUTO_SUBFRAME = 5
}
export enum RenderMode {
    ASYNC_RENDER = 0,
    SYNC_RENDER = 1
}
export enum ViewportFit {
    AUTO = 0,
    CONTAINS = 1,
    COVER = 2
}
export declare class WebContextMenuParam {
    constructor()
    x(): int32
    y(): int32
    getLinkUrl(): string
    getUnfilteredLinkUrl(): string
    getSourceUrl(): string
    existsImageContents(): boolean
    getMediaType(): ContextMenuMediaType
    getSelectionText(): string
    getSourceType(): ContextMenuSourceType
    getInputFieldType(): ContextMenuInputFieldType
    isEditable(): boolean
    getEditStateFlags(): int32
    getPreviewWidth(): int32
    getPreviewHeight(): int32
}
export declare class WebContextMenuResult {
    constructor()
    closeContextMenu(): void
    copyImage(): void
    copy(): void
    paste(): void
    cut(): void
    selectAll(): void
}
export declare class ConsoleMessage {
    constructor()
    getMessage(): string
    getSourceId(): string
    getLineNumber(): number
    getMessageLevel(): MessageLevel
}
export declare class WebResourceRequest {
    constructor()
    getRequestHeader(): Array<Header>
    getRequestUrl(): string
    isRequestGesture(): boolean
    isMainFrame(): boolean
    isRedirect(): boolean
    getRequestMethod(): string
}
export declare class WebResourceResponse {
    constructor()
    getResponseData(): string
    getResponseDataEx(): string | number | ArrayBuffer | Resource | undefined
    getResponseEncoding(): string
    getResponseMimeType(): string
    getReasonMessage(): string
    getResponseHeader(): Array<Header>
    getResponseCode(): number
    setResponseData(data: string | number | Resource | ArrayBuffer): void
    setResponseEncoding(encoding: string): void
    setResponseMimeType(mimeType: string): void
    setReasonMessage(reason: string): void
    setResponseHeader(header: Array<Header>): void
    setResponseCode(code: number): void
    setResponseIsReady(IsReady: boolean): void
    getResponseIsReady(): boolean
}
export declare interface Header {
    headerKey: string;
    headerValue: string;
}
export declare class WebResourceError {
    constructor()
    getErrorInfo(): string
    getErrorCode(): number
}
export declare class JsGeolocation {
    constructor()
    invoke(origin: string, allow: boolean, retain: boolean): void
}
export declare class EventResult {
    constructor()
    setGestureEventResult(result: boolean, stopPropagation?: boolean): void
}
export declare interface WebOptions {
    src: string | Resource;
    controller: webview.WebviewController;
    renderMode?: RenderMode;
    incognitoMode?: boolean;
    sharedRenderProcessToken?: string;
}
export declare interface ScriptItem {
    script: string;
    scriptRules: Array<string>;
}
export declare interface LoadCommittedDetails {
    isMainFrame: boolean;
    isSameDocument: boolean;
    didReplaceEntry: boolean;
    navigationType: WebNavigationType;
    url: string;
}
export declare interface IntelligentTrackingPreventionDetails {
    host: string;
    trackerHost: string;
}
export declare interface NativeEmbedInfo {
    id?: string;
    type?: string;
    src?: string;
    position?: Position;
    width?: int32;
    height?: int32;
    url?: string;
    tag?: string;
    params?: Map<string, string>;
}
export declare interface NativeEmbedDataInfo {
    status?: NativeEmbedStatus;
    surfaceId?: string;
    embedId?: string;
    info?: NativeEmbedInfo;
}
export declare interface NativeEmbedVisibilityInfo {
    visibility: boolean;
    embedId: string;
}
export declare interface NativeEmbedTouchInfo {
    embedId?: string;
    touchEvent?: TouchEvent;
    result?: EventResult;
}
export declare interface FirstMeaningfulPaint {
    navigationStartTime?: int64;
    firstMeaningfulPaintTime?: int64;
}
export declare interface LargestContentfulPaint {
    navigationStartTime?: int64;
    largestImagePaintTime?: int64;
    largestTextPaintTime?: int64;
    imageBPP?: double;
    largestImageLoadStartTime?: int64;
    largestImageLoadEndTime?: int64;
}
export declare interface RenderProcessNotRespondingData {
    jsStack: string;
    pid: int32;
    reason: RenderProcessNotRespondingReason;
}
export declare interface OnPageEndEvent {
    url: string;
}
export declare interface OnPageBeginEvent {
    url: string;
}
export declare interface OnProgressChangeEvent {
    newProgress: int32;
}
export declare interface OnTitleReceiveEvent {
    title: string;
}
export declare interface OnGeolocationShowEvent {
    origin: string;
    geolocation: JsGeolocation;
}
export declare interface OnAlertEvent {
    url: string;
    message: string;
    result: JsResult;
}
export declare interface OnBeforeUnloadEvent {
    url: string;
    message: string;
    result: JsResult;
}
export declare interface OnConfirmEvent {
    url: string;
    message: string;
    result: JsResult;
}
export declare interface OnPromptEvent {
    url: string;
    message: string;
    value: string;
    result: JsResult;
}
export declare interface OnConsoleEvent {
    message: ConsoleMessage;
}
export declare interface OnErrorReceiveEvent {
    request: WebResourceRequest;
    error: WebResourceError;
}
export declare interface OnHttpErrorReceiveEvent {
    request: WebResourceRequest;
    response: WebResourceResponse;
}
export declare interface OnDownloadStartEvent {
    url: string;
    userAgent: string;
    contentDisposition: string;
    mimetype: string;
    contentLength: number;
}
export declare interface OnRefreshAccessedHistoryEvent {
    url: string;
    isRefreshed: boolean;
}
export declare interface OnRenderExitedEvent {
    renderExitReason: RenderExitReason;
}
export declare interface OnShowFileSelectorEvent {
    result: FileSelectorResult;
    fileSelector: FileSelectorParam;
}
export declare interface OnResourceLoadEvent {
    url: string;
}
export declare interface OnScaleChangeEvent {
    oldScale: double;
    newScale: double;
}
export declare interface OnHttpAuthRequestEvent {
    handler: HttpAuthHandler;
    host: string;
    realm: string;
}
export declare interface OnInterceptRequestEvent {
    request: WebResourceRequest;
}
export declare interface OnPermissionRequestEvent {
    request: PermissionRequest;
}
export declare interface OnScreenCaptureRequestEvent {
    handler: ScreenCaptureHandler;
}
export declare interface OnContextMenuShowEvent {
    param: WebContextMenuParam;
    result: WebContextMenuResult;
}
export declare interface OnSearchResultReceiveEvent {
    activeMatchOrdinal: number;
    numberOfMatches: number;
    isDoneCounting: boolean;
}
export declare interface OnScrollEvent {
    xOffset: double;
    yOffset: double;
}
export declare interface OnSslErrorEventReceiveEvent {
    handler: SslErrorHandler;
    error: SslError;
    certChainData?: Array<ArrayBuffer>;
}
export declare interface OnClientAuthenticationEvent {
    handler: ClientAuthenticationHandler;
    host: string;
    port: number;
    keyTypes: Array<string>;
    issuers: Array<string>;
}
export declare interface OnWindowNewEvent {
    isAlert: boolean;
    isUserTrigger: boolean;
    targetUrl: string;
    handler: ControllerHandler;
}
export declare interface OnTouchIconUrlReceivedEvent {
    url: string;
    precomposed: boolean;
}
export declare interface OnFaviconReceivedEvent {
    favicon: image.PixelMap;
}
export declare interface OnPageVisibleEvent {
    url: string;
}
export declare interface OnDataResubmittedEvent {
    handler: DataResubmissionHandler;
}
export declare interface OnAudioStateChangedEvent {
    playing: boolean;
}
export declare interface OnFirstContentfulPaintEvent {
    navigationStartTick: int64;
    firstContentfulPaintMs: int64;
}
export declare interface OnLoadInterceptEvent {
    data: WebResourceRequest;
}
export declare interface OnOverScrollEvent {
    xOffset: double;
    yOffset: double;
}
export declare interface JavaScriptProxy {
    jsObject: Object;
    name: string;
    methodList: Array<string>;
    controller: webview.WebviewController;
    asyncMethodList?: Array<string>;
    permission?: string;
}
export enum WebKeyboardAvoidMode {
    RESIZE_VISUAL = 0,
    RESIZE_CONTENT = 1,
    OVERLAYS_CONTENT = 2
}
export enum WebElementType {
    IMAGE = 1
}
export enum WebResponseType {
    LONG_PRESS = 1
}
export enum AudioSessionType {
    AMBIENT = 3
}
export declare interface SelectionMenuOptionsExt {
    onAppear?: (() => void);
    onDisappear?: (() => void);
    preview?: CustomBuilder;
    menuType?: MenuType;
}
export interface WebAttribute extends CommonMethod {
    javaScriptAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method javaScriptAccess")
    }
    fileAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method fileAccess")
    }
    onlineImageAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method onlineImageAccess")
    }
    domStorageAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method domStorageAccess")
    }
    imageAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method imageAccess")
    }
    mixedMode(value: MixedMode | undefined): this {
        throw new Error("Unimplemented method mixedMode")
    }
    zoomAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method zoomAccess")
    }
    geolocationAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method geolocationAccess")
    }
    javaScriptProxy(value: JavaScriptProxy | undefined): this {
        throw new Error("Unimplemented method javaScriptProxy")
    }
    cacheMode(value: CacheMode | undefined): this {
        throw new Error("Unimplemented method cacheMode")
    }
    darkMode(value: WebDarkMode | undefined): this {
        throw new Error("Unimplemented method darkMode")
    }
    forceDarkAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method forceDarkAccess")
    }
    mediaOptions(value: WebMediaOptions | undefined): this {
        throw new Error("Unimplemented method mediaOptions")
    }
    overviewModeAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method overviewModeAccess")
    }
    overScrollMode(value: OverScrollMode | undefined): this {
        throw new Error("Unimplemented method overScrollMode")
    }
    blurOnKeyboardHideMode(value: BlurOnKeyboardHideMode | undefined): this {
        throw new Error("Unimplemented method blurOnKeyboardHideMode")
    }
    textZoomRatio(value: int32 | undefined): this {
        throw new Error("Unimplemented method textZoomRatio")
    }
    databaseAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method databaseAccess")
    }
    initialScale(value: double | undefined): this {
        throw new Error("Unimplemented method initialScale")
    }
    metaViewport(value: boolean | undefined): this {
        throw new Error("Unimplemented method metaViewport")
    }
    onPageEnd(value: ((value0: OnPageEndEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onPageEnd")
    }
    onPageBegin(value: ((value0: OnPageBeginEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onPageBegin")
    }
    onProgressChange(value: ((value0: OnProgressChangeEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onProgressChange")
    }
    onTitleReceive(value: ((value0: OnTitleReceiveEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onTitleReceive")
    }
    onGeolocationHide(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onGeolocationHide")
    }
    onGeolocationShow(value: ((value0: OnGeolocationShowEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onGeolocationShow")
    }
    onRequestSelected(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onRequestSelected")
    }
    onAlert(value: ((value0: OnAlertEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onAlert")
    }
    onBeforeUnload(value: ((value0: OnBeforeUnloadEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onBeforeUnload")
    }
    onConfirm(value: ((value0: OnConfirmEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onConfirm")
    }
    onPrompt(value: ((value0: OnPromptEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onPrompt")
    }
    onConsole(value: ((value0: OnConsoleEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onConsole")
    }
    onErrorReceive(value: ((value0: OnErrorReceiveEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onErrorReceive")
    }
    onHttpErrorReceive(value: ((value0: OnHttpErrorReceiveEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onHttpErrorReceive")
    }
    onDownloadStart(value: ((value0: OnDownloadStartEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onDownloadStart")
    }
    onRefreshAccessedHistory(value: ((value0: OnRefreshAccessedHistoryEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onRefreshAccessedHistory")
    }
    onRenderExited(value: ((value0: OnRenderExitedEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onRenderExited")
    }
    onShowFileSelector(value: ((value0: OnShowFileSelectorEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onShowFileSelector")
    }
    onResourceLoad(value: ((value0: OnResourceLoadEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onResourceLoad")
    }
    onFullScreenExit(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onFullScreenExit")
    }
    onFullScreenEnter(value: OnFullScreenEnterCallback | undefined): this {
        throw new Error("Unimplemented method onFullScreenEnter")
    }
    onScaleChange(value: ((value0: OnScaleChangeEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onScaleChange")
    }
    onHttpAuthRequest(value: ((value0: OnHttpAuthRequestEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onHttpAuthRequest")
    }
    onInterceptRequest(value: ((value0: OnInterceptRequestEvent) => WebResourceResponse) | undefined): this {
        throw new Error("Unimplemented method onInterceptRequest")
    }
    onPermissionRequest(value: ((value0: OnPermissionRequestEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onPermissionRequest")
    }
    onScreenCaptureRequest(value: ((value0: OnScreenCaptureRequestEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onScreenCaptureRequest")
    }
    onContextMenuShow(value: ((value0: OnContextMenuShowEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onContextMenuShow")
    }
    onContextMenuHide(value: OnContextMenuHideCallback | undefined): this {
        throw new Error("Unimplemented method onContextMenuHide")
    }
    mediaPlayGestureAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method mediaPlayGestureAccess")
    }
    onSearchResultReceive(value: ((value0: OnSearchResultReceiveEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onSearchResultReceive")
    }
    onScroll(value: ((value0: OnScrollEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onScroll")
    }
    onSslErrorEventReceive(value: ((value0: OnSslErrorEventReceiveEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onSslErrorEventReceive")
    }
    onSslErrorEvent(value: OnSslErrorEventCallback | undefined): this {
        throw new Error("Unimplemented method onSslErrorEvent")
    }
    onClientAuthenticationRequest(value: ((value0: OnClientAuthenticationEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onClientAuthenticationRequest")
    }
    onWindowNew(value: ((value0: OnWindowNewEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onWindowNew")
    }
    onWindowExit(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onWindowExit")
    }
    multiWindowAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method multiWindowAccess")
    }
    onInterceptKeyEvent(value: ((event: KeyEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onInterceptKeyEvent")
    }
    webStandardFont(value: string | undefined): this {
        throw new Error("Unimplemented method webStandardFont")
    }
    webSerifFont(value: string | undefined): this {
        throw new Error("Unimplemented method webSerifFont")
    }
    webSansSerifFont(value: string | undefined): this {
        throw new Error("Unimplemented method webSansSerifFont")
    }
    webFixedFont(value: string | undefined): this {
        throw new Error("Unimplemented method webFixedFont")
    }
    webFantasyFont(value: string | undefined): this {
        throw new Error("Unimplemented method webFantasyFont")
    }
    webCursiveFont(value: string | undefined): this {
        throw new Error("Unimplemented method webCursiveFont")
    }
    defaultFixedFontSize(value: int32 | undefined): this {
        throw new Error("Unimplemented method defaultFixedFontSize")
    }
    defaultFontSize(value: int32 | undefined): this {
        throw new Error("Unimplemented method defaultFontSize")
    }
    minFontSize(value: int32 | undefined): this {
        throw new Error("Unimplemented method minFontSize")
    }
    minLogicalFontSize(value: int32 | undefined): this {
        throw new Error("Unimplemented method minLogicalFontSize")
    }
    defaultTextEncodingFormat(value: string | undefined): this {
        throw new Error("Unimplemented method defaultTextEncodingFormat")
    }
    forceDisplayScrollBar(value: boolean | undefined): this {
        throw new Error("Unimplemented method forceDisplayScrollBar")
    }
    blockNetwork(value: boolean | undefined): this {
        throw new Error("Unimplemented method blockNetwork")
    }
    horizontalScrollBarAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method horizontalScrollBarAccess")
    }
    verticalScrollBarAccess(value: boolean | undefined): this {
        throw new Error("Unimplemented method verticalScrollBarAccess")
    }
    onTouchIconUrlReceived(value: ((value0: OnTouchIconUrlReceivedEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onTouchIconUrlReceived")
    }
    onFaviconReceived(value: ((value0: OnFaviconReceivedEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onFaviconReceived")
    }
    onPageVisible(value: ((value0: OnPageVisibleEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onPageVisible")
    }
    onDataResubmitted(value: ((value0: OnDataResubmittedEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onDataResubmitted")
    }
    pinchSmooth(value: boolean | undefined): this {
        throw new Error("Unimplemented method pinchSmooth")
    }
    allowWindowOpenMethod(value: boolean | undefined): this {
        throw new Error("Unimplemented method allowWindowOpenMethod")
    }
    onAudioStateChanged(value: ((value0: OnAudioStateChangedEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onAudioStateChanged")
    }
    onFirstContentfulPaint(value: ((value0: OnFirstContentfulPaintEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onFirstContentfulPaint")
    }
    onFirstMeaningfulPaint(value: OnFirstMeaningfulPaintCallback | undefined): this {
        throw new Error("Unimplemented method onFirstMeaningfulPaint")
    }
    onLargestContentfulPaint(value: OnLargestContentfulPaintCallback | undefined): this {
        throw new Error("Unimplemented method onLargestContentfulPaint")
    }
    onLoadIntercept(value: ((value0: OnLoadInterceptEvent) => boolean) | undefined): this {
        throw new Error("Unimplemented method onLoadIntercept")
    }
    onControllerAttached(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onControllerAttached")
    }
    onOverScroll(value: ((value0: OnOverScrollEvent) => void) | undefined): this {
        throw new Error("Unimplemented method onOverScroll")
    }
    onSafeBrowsingCheckResult(value: OnSafeBrowsingCheckResultCallback | undefined): this {
        throw new Error("Unimplemented method onSafeBrowsingCheckResult")
    }
    onNavigationEntryCommitted(value: OnNavigationEntryCommittedCallback | undefined): this {
        throw new Error("Unimplemented method onNavigationEntryCommitted")
    }
    onIntelligentTrackingPreventionResult(value: OnIntelligentTrackingPreventionCallback | undefined): this {
        throw new Error("Unimplemented method onIntelligentTrackingPreventionResult")
    }
    javaScriptOnDocumentStart(value: Array<ScriptItem> | undefined): this {
        throw new Error("Unimplemented method javaScriptOnDocumentStart")
    }
    javaScriptOnDocumentEnd(value: Array<ScriptItem> | undefined): this {
        throw new Error("Unimplemented method javaScriptOnDocumentEnd")
    }
    layoutMode(value: WebLayoutMode | undefined): this {
        throw new Error("Unimplemented method layoutMode")
    }
    nestedScroll(value: NestedScrollOptions | NestedScrollOptionsExt | undefined): this {
        throw new Error("Unimplemented method nestedScroll")
    }
    enableNativeEmbedMode(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableNativeEmbedMode")
    }
    onNativeEmbedLifecycleChange(value: ((event: NativeEmbedDataInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onNativeEmbedLifecycleChange")
    }
    onNativeEmbedVisibilityChange(value: OnNativeEmbedVisibilityChangeCallback | undefined): this {
        throw new Error("Unimplemented method onNativeEmbedVisibilityChange")
    }
    onNativeEmbedGestureEvent(value: ((event: NativeEmbedTouchInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onNativeEmbedGestureEvent")
    }
    copyOptions(value: CopyOptions | undefined): this {
        throw new Error("Unimplemented method copyOptions")
    }
    onOverrideUrlLoading(value: OnOverrideUrlLoadingCallback | undefined): this {
        throw new Error("Unimplemented method onOverrideUrlLoading")
    }
    textAutosizing(value: boolean | undefined): this {
        throw new Error("Unimplemented method textAutosizing")
    }
    enableNativeMediaPlayer(value: NativeMediaPlayerConfig | undefined): this {
        throw new Error("Unimplemented method enableNativeMediaPlayer")
    }
    onRenderProcessNotResponding(value: OnRenderProcessNotRespondingCallback | undefined): this {
        throw new Error("Unimplemented method onRenderProcessNotResponding")
    }
    onRenderProcessResponding(value: OnRenderProcessRespondingCallback | undefined): this {
        throw new Error("Unimplemented method onRenderProcessResponding")
    }
    onViewportFitChanged(value: OnViewportFitChangedCallback | undefined): this {
        throw new Error("Unimplemented method onViewportFitChanged")
    }
    onInterceptKeyboardAttach(value: WebKeyboardCallback | undefined): this {
        throw new Error("Unimplemented method onInterceptKeyboardAttach")
    }
    onAdsBlocked(value: OnAdsBlockedCallback | undefined): this {
        throw new Error("Unimplemented method onAdsBlocked")
    }
    keyboardAvoidMode(value: WebKeyboardAvoidMode | undefined): this {
        throw new Error("Unimplemented method keyboardAvoidMode")
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        throw new Error("Unimplemented method editMenuOptions")
    }
    enableHapticFeedback(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableHapticFeedback")
    }
    optimizeParserBudget(value: boolean | undefined): this {
        throw new Error("Unimplemented method optimizeParserBudget")
    }
    enableFollowSystemFontWeight(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableFollowSystemFontWeight")
    }
    enableWebAVSession(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableWebAVSession")
    }
    runJavaScriptOnDocumentStart(value: Array<ScriptItem> | undefined): this {
        throw new Error("Unimplemented method runJavaScriptOnDocumentStart")
    }
    runJavaScriptOnDocumentEnd(value: Array<ScriptItem> | undefined): this {
        throw new Error("Unimplemented method runJavaScriptOnDocumentEnd")
    }
    runJavaScriptOnHeadEnd(value: Array<ScriptItem> | undefined): this {
        throw new Error("Unimplemented method runJavaScriptOnHeadEnd")
    }
    nativeEmbedOptions(value: EmbedOptions | undefined): this {
        throw new Error("Unimplemented method nativeEmbedOptions")
    }
    registerNativeEmbedRule(tag: string | undefined, type: string | undefined): this {
        throw new Error("Unimplemented method registerNativeEmbedRule")
    }
    bindSelectionMenu(elementType: WebElementType | undefined, content: CustomBuilder | undefined, responseType: WebResponseType | undefined, options?: SelectionMenuOptionsExt): this {
        throw new Error("Unimplemented method bindSelectionMenu")
    }
    attributeModifier(value: AttributeModifier<WebAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkWebStyle extends ArkCommonMethodStyle implements WebAttribute {
    javaScriptAccess_value?: boolean | undefined
    fileAccess_value?: boolean | undefined
    onlineImageAccess_value?: boolean | undefined
    domStorageAccess_value?: boolean | undefined
    imageAccess_value?: boolean | undefined
    mixedMode_value?: MixedMode | undefined
    zoomAccess_value?: boolean | undefined
    geolocationAccess_value?: boolean | undefined
    javaScriptProxy_value?: JavaScriptProxy | undefined
    cacheMode_value?: CacheMode | undefined
    darkMode_value?: WebDarkMode | undefined
    forceDarkAccess_value?: boolean | undefined
    mediaOptions_value?: WebMediaOptions | undefined
    overviewModeAccess_value?: boolean | undefined
    overScrollMode_value?: OverScrollMode | undefined
    blurOnKeyboardHideMode_value?: BlurOnKeyboardHideMode | undefined
    textZoomRatio_value?: int32 | undefined
    databaseAccess_value?: boolean | undefined
    initialScale_value?: double | undefined
    metaViewport_value?: boolean | undefined
    onPageEnd_value?: ((value0: OnPageEndEvent) => void) | undefined
    onPageBegin_value?: ((value0: OnPageBeginEvent) => void) | undefined
    onProgressChange_value?: ((value0: OnProgressChangeEvent) => void) | undefined
    onTitleReceive_value?: ((value0: OnTitleReceiveEvent) => void) | undefined
    onGeolocationHide_value?: (() => void) | undefined
    onGeolocationShow_value?: ((value0: OnGeolocationShowEvent) => void) | undefined
    onRequestSelected_value?: (() => void) | undefined
    onAlert_value?: ((value0: OnAlertEvent) => boolean) | undefined
    onBeforeUnload_value?: ((value0: OnBeforeUnloadEvent) => boolean) | undefined
    onConfirm_value?: ((value0: OnConfirmEvent) => boolean) | undefined
    onPrompt_value?: ((value0: OnPromptEvent) => boolean) | undefined
    onConsole_value?: ((value0: OnConsoleEvent) => boolean) | undefined
    onErrorReceive_value?: ((value0: OnErrorReceiveEvent) => void) | undefined
    onHttpErrorReceive_value?: ((value0: OnHttpErrorReceiveEvent) => void) | undefined
    onDownloadStart_value?: ((value0: OnDownloadStartEvent) => void) | undefined
    onRefreshAccessedHistory_value?: ((value0: OnRefreshAccessedHistoryEvent) => void) | undefined
    onRenderExited_value?: ((value0: OnRenderExitedEvent) => void) | undefined
    onShowFileSelector_value?: ((value0: OnShowFileSelectorEvent) => boolean) | undefined
    onResourceLoad_value?: ((value0: OnResourceLoadEvent) => void) | undefined
    onFullScreenExit_value?: (() => void) | undefined
    onFullScreenEnter_value?: OnFullScreenEnterCallback | undefined
    onScaleChange_value?: ((value0: OnScaleChangeEvent) => void) | undefined
    onHttpAuthRequest_value?: ((value0: OnHttpAuthRequestEvent) => boolean) | undefined
    onInterceptRequest_value?: ((value0: OnInterceptRequestEvent) => WebResourceResponse) | undefined
    onPermissionRequest_value?: ((value0: OnPermissionRequestEvent) => void) | undefined
    onScreenCaptureRequest_value?: ((value0: OnScreenCaptureRequestEvent) => void) | undefined
    onContextMenuShow_value?: ((value0: OnContextMenuShowEvent) => boolean) | undefined
    onContextMenuHide_value?: OnContextMenuHideCallback | undefined
    mediaPlayGestureAccess_value?: boolean | undefined
    onSearchResultReceive_value?: ((value0: OnSearchResultReceiveEvent) => void) | undefined
    onScroll_value?: ((value0: OnScrollEvent) => void) | undefined
    onSslErrorEventReceive_value?: ((value0: OnSslErrorEventReceiveEvent) => void) | undefined
    onSslErrorEvent_value?: OnSslErrorEventCallback | undefined
    onClientAuthenticationRequest_value?: ((value0: OnClientAuthenticationEvent) => void) | undefined
    onWindowNew_value?: ((value0: OnWindowNewEvent) => void) | undefined
    onWindowExit_value?: (() => void) | undefined
    multiWindowAccess_value?: boolean | undefined
    onInterceptKeyEvent_value?: ((event: KeyEvent) => boolean) | undefined
    webStandardFont_value?: string | undefined
    webSerifFont_value?: string | undefined
    webSansSerifFont_value?: string | undefined
    webFixedFont_value?: string | undefined
    webFantasyFont_value?: string | undefined
    webCursiveFont_value?: string | undefined
    defaultFixedFontSize_value?: int32 | undefined
    defaultFontSize_value?: int32 | undefined
    minFontSize_value?: int32 | undefined
    minLogicalFontSize_value?: int32 | undefined
    defaultTextEncodingFormat_value?: string | undefined
    forceDisplayScrollBar_value?: boolean | undefined
    blockNetwork_value?: boolean | undefined
    horizontalScrollBarAccess_value?: boolean | undefined
    verticalScrollBarAccess_value?: boolean | undefined
    onTouchIconUrlReceived_value?: ((value0: OnTouchIconUrlReceivedEvent) => void) | undefined
    onFaviconReceived_value?: ((value0: OnFaviconReceivedEvent) => void) | undefined
    onPageVisible_value?: ((value0: OnPageVisibleEvent) => void) | undefined
    onDataResubmitted_value?: ((value0: OnDataResubmittedEvent) => void) | undefined
    pinchSmooth_value?: boolean | undefined
    allowWindowOpenMethod_value?: boolean | undefined
    onAudioStateChanged_value?: ((value0: OnAudioStateChangedEvent) => void) | undefined
    onFirstContentfulPaint_value?: ((value0: OnFirstContentfulPaintEvent) => void) | undefined
    onFirstMeaningfulPaint_value?: OnFirstMeaningfulPaintCallback | undefined
    onLargestContentfulPaint_value?: OnLargestContentfulPaintCallback | undefined
    onLoadIntercept_value?: ((value0: OnLoadInterceptEvent) => boolean) | undefined
    onControllerAttached_value?: (() => void) | undefined
    onOverScroll_value?: ((value0: OnOverScrollEvent) => void) | undefined
    onSafeBrowsingCheckResult_value?: OnSafeBrowsingCheckResultCallback | undefined
    onNavigationEntryCommitted_value?: OnNavigationEntryCommittedCallback | undefined
    onIntelligentTrackingPreventionResult_value?: OnIntelligentTrackingPreventionCallback | undefined
    javaScriptOnDocumentStart_value?: Array<ScriptItem> | undefined
    javaScriptOnDocumentEnd_value?: Array<ScriptItem> | undefined
    layoutMode_value?: WebLayoutMode | undefined
    nestedScroll_value?: NestedScrollOptions | NestedScrollOptionsExt | undefined
    enableNativeEmbedMode_value?: boolean | undefined
    onNativeEmbedLifecycleChange_value?: ((event: NativeEmbedDataInfo) => void) | undefined
    onNativeEmbedVisibilityChange_value?: OnNativeEmbedVisibilityChangeCallback | undefined
    onNativeEmbedGestureEvent_value?: ((event: NativeEmbedTouchInfo) => void) | undefined
    copyOptions_value?: CopyOptions | undefined
    onOverrideUrlLoading_value?: OnOverrideUrlLoadingCallback | undefined
    textAutosizing_value?: boolean | undefined
    enableNativeMediaPlayer_value?: NativeMediaPlayerConfig | undefined
    onRenderProcessNotResponding_value?: OnRenderProcessNotRespondingCallback | undefined
    onRenderProcessResponding_value?: OnRenderProcessRespondingCallback | undefined
    onViewportFitChanged_value?: OnViewportFitChangedCallback | undefined
    onInterceptKeyboardAttach_value?: WebKeyboardCallback | undefined
    onAdsBlocked_value?: OnAdsBlockedCallback | undefined
    keyboardAvoidMode_value?: WebKeyboardAvoidMode | undefined
    editMenuOptions_value?: EditMenuOptions | undefined
    enableHapticFeedback_value?: boolean | undefined
    optimizeParserBudget_value?: boolean | undefined
    enableFollowSystemFontWeight_value?: boolean | undefined
    enableWebAVSession_value?: boolean | undefined
    runJavaScriptOnDocumentStart_value?: Array<ScriptItem> | undefined
    runJavaScriptOnDocumentEnd_value?: Array<ScriptItem> | undefined
    runJavaScriptOnHeadEnd_value?: Array<ScriptItem> | undefined
    nativeEmbedOptions_value?: EmbedOptions | undefined
    attributeModifier_value?: AttributeModifier<WebAttribute> | AttributeModifier<CommonMethod> | undefined
    javaScriptAccess(value: boolean | undefined): this {
        return this
    }
    fileAccess(value: boolean | undefined): this {
        return this
    }
    onlineImageAccess(value: boolean | undefined): this {
        return this
    }
    domStorageAccess(value: boolean | undefined): this {
        return this
    }
    imageAccess(value: boolean | undefined): this {
        return this
    }
    mixedMode(value: MixedMode | undefined): this {
        return this
    }
    zoomAccess(value: boolean | undefined): this {
        return this
    }
    geolocationAccess(value: boolean | undefined): this {
        return this
    }
    javaScriptProxy(value: JavaScriptProxy | undefined): this {
        return this
    }
    cacheMode(value: CacheMode | undefined): this {
        return this
    }
    darkMode(value: WebDarkMode | undefined): this {
        return this
    }
    forceDarkAccess(value: boolean | undefined): this {
        return this
    }
    mediaOptions(value: WebMediaOptions | undefined): this {
        return this
    }
    overviewModeAccess(value: boolean | undefined): this {
        return this
    }
    overScrollMode(value: OverScrollMode | undefined): this {
        return this
    }
    blurOnKeyboardHideMode(value: BlurOnKeyboardHideMode | undefined): this {
        return this
    }
    textZoomRatio(value: int32 | undefined): this {
        return this
    }
    databaseAccess(value: boolean | undefined): this {
        return this
    }
    initialScale(value: double | undefined): this {
        return this
    }
    metaViewport(value: boolean | undefined): this {
        return this
    }
    onPageEnd(value: ((value0: OnPageEndEvent) => void) | undefined): this {
        return this
    }
    onPageBegin(value: ((value0: OnPageBeginEvent) => void) | undefined): this {
        return this
    }
    onProgressChange(value: ((value0: OnProgressChangeEvent) => void) | undefined): this {
        return this
    }
    onTitleReceive(value: ((value0: OnTitleReceiveEvent) => void) | undefined): this {
        return this
    }
    onGeolocationHide(value: (() => void) | undefined): this {
        return this
    }
    onGeolocationShow(value: ((value0: OnGeolocationShowEvent) => void) | undefined): this {
        return this
    }
    onRequestSelected(value: (() => void) | undefined): this {
        return this
    }
    onAlert(value: ((value0: OnAlertEvent) => boolean) | undefined): this {
        return this
    }
    onBeforeUnload(value: ((value0: OnBeforeUnloadEvent) => boolean) | undefined): this {
        return this
    }
    onConfirm(value: ((value0: OnConfirmEvent) => boolean) | undefined): this {
        return this
    }
    onPrompt(value: ((value0: OnPromptEvent) => boolean) | undefined): this {
        return this
    }
    onConsole(value: ((value0: OnConsoleEvent) => boolean) | undefined): this {
        return this
    }
    onErrorReceive(value: ((value0: OnErrorReceiveEvent) => void) | undefined): this {
        return this
    }
    onHttpErrorReceive(value: ((value0: OnHttpErrorReceiveEvent) => void) | undefined): this {
        return this
    }
    onDownloadStart(value: ((value0: OnDownloadStartEvent) => void) | undefined): this {
        return this
    }
    onRefreshAccessedHistory(value: ((value0: OnRefreshAccessedHistoryEvent) => void) | undefined): this {
        return this
    }
    onRenderExited(value: ((value0: OnRenderExitedEvent) => void) | undefined): this {
        return this
    }
    onShowFileSelector(value: ((value0: OnShowFileSelectorEvent) => boolean) | undefined): this {
        return this
    }
    onResourceLoad(value: ((value0: OnResourceLoadEvent) => void) | undefined): this {
        return this
    }
    onFullScreenExit(value: (() => void) | undefined): this {
        return this
    }
    onFullScreenEnter(value: OnFullScreenEnterCallback | undefined): this {
        return this
    }
    onScaleChange(value: ((value0: OnScaleChangeEvent) => void) | undefined): this {
        return this
    }
    onHttpAuthRequest(value: ((value0: OnHttpAuthRequestEvent) => boolean) | undefined): this {
        return this
    }
    onInterceptRequest(value: ((value0: OnInterceptRequestEvent) => WebResourceResponse) | undefined): this {
        return this
    }
    onPermissionRequest(value: ((value0: OnPermissionRequestEvent) => void) | undefined): this {
        return this
    }
    onScreenCaptureRequest(value: ((value0: OnScreenCaptureRequestEvent) => void) | undefined): this {
        return this
    }
    onContextMenuShow(value: ((value0: OnContextMenuShowEvent) => boolean) | undefined): this {
        return this
    }
    onContextMenuHide(value: OnContextMenuHideCallback | undefined): this {
        return this
    }
    mediaPlayGestureAccess(value: boolean | undefined): this {
        return this
    }
    onSearchResultReceive(value: ((value0: OnSearchResultReceiveEvent) => void) | undefined): this {
        return this
    }
    onScroll(value: ((value0: OnScrollEvent) => void) | undefined): this {
        return this
    }
    onSslErrorEventReceive(value: ((value0: OnSslErrorEventReceiveEvent) => void) | undefined): this {
        return this
    }
    onSslErrorEvent(value: OnSslErrorEventCallback | undefined): this {
        return this
    }
    onClientAuthenticationRequest(value: ((value0: OnClientAuthenticationEvent) => void) | undefined): this {
        return this
    }
    onWindowNew(value: ((value0: OnWindowNewEvent) => void) | undefined): this {
        return this
    }
    onWindowExit(value: (() => void) | undefined): this {
        return this
    }
    multiWindowAccess(value: boolean | undefined): this {
        return this
    }
    onInterceptKeyEvent(value: ((event: KeyEvent) => boolean) | undefined): this {
        return this
    }
    webStandardFont(value: string | undefined): this {
        return this
    }
    webSerifFont(value: string | undefined): this {
        return this
    }
    webSansSerifFont(value: string | undefined): this {
        return this
    }
    webFixedFont(value: string | undefined): this {
        return this
    }
    webFantasyFont(value: string | undefined): this {
        return this
    }
    webCursiveFont(value: string | undefined): this {
        return this
    }
    defaultFixedFontSize(value: int32 | undefined): this {
        return this
    }
    defaultFontSize(value: int32 | undefined): this {
        return this
    }
    minFontSize(value: int32 | undefined): this {
        return this
    }
    minLogicalFontSize(value: int32 | undefined): this {
        return this
    }
    defaultTextEncodingFormat(value: string | undefined): this {
        return this
    }
    forceDisplayScrollBar(value: boolean | undefined): this {
        return this
    }
    blockNetwork(value: boolean | undefined): this {
        return this
    }
    horizontalScrollBarAccess(value: boolean | undefined): this {
        return this
    }
    verticalScrollBarAccess(value: boolean | undefined): this {
        return this
    }
    onTouchIconUrlReceived(value: ((value0: OnTouchIconUrlReceivedEvent) => void) | undefined): this {
        return this
    }
    onFaviconReceived(value: ((value0: OnFaviconReceivedEvent) => void) | undefined): this {
        return this
    }
    onPageVisible(value: ((value0: OnPageVisibleEvent) => void) | undefined): this {
        return this
    }
    onDataResubmitted(value: ((value0: OnDataResubmittedEvent) => void) | undefined): this {
        return this
    }
    pinchSmooth(value: boolean | undefined): this {
        return this
    }
    allowWindowOpenMethod(value: boolean | undefined): this {
        return this
    }
    onAudioStateChanged(value: ((value0: OnAudioStateChangedEvent) => void) | undefined): this {
        return this
    }
    onFirstContentfulPaint(value: ((value0: OnFirstContentfulPaintEvent) => void) | undefined): this {
        return this
    }
    onFirstMeaningfulPaint(value: OnFirstMeaningfulPaintCallback | undefined): this {
        return this
    }
    onLargestContentfulPaint(value: OnLargestContentfulPaintCallback | undefined): this {
        return this
    }
    onLoadIntercept(value: ((value0: OnLoadInterceptEvent) => boolean) | undefined): this {
        return this
    }
    onControllerAttached(value: (() => void) | undefined): this {
        return this
    }
    onOverScroll(value: ((value0: OnOverScrollEvent) => void) | undefined): this {
        return this
    }
    onSafeBrowsingCheckResult(value: OnSafeBrowsingCheckResultCallback | undefined): this {
        return this
    }
    onNavigationEntryCommitted(value: OnNavigationEntryCommittedCallback | undefined): this {
        return this
    }
    onIntelligentTrackingPreventionResult(value: OnIntelligentTrackingPreventionCallback | undefined): this {
        return this
    }
    javaScriptOnDocumentStart(value: Array<ScriptItem> | undefined): this {
        return this
    }
    javaScriptOnDocumentEnd(value: Array<ScriptItem> | undefined): this {
        return this
    }
    layoutMode(value: WebLayoutMode | undefined): this {
        return this
    }
    nestedScroll(value: NestedScrollOptions | NestedScrollOptionsExt | undefined): this {
        return this
    }
    enableNativeEmbedMode(value: boolean | undefined): this {
        return this
    }
    onNativeEmbedLifecycleChange(value: ((event: NativeEmbedDataInfo) => void) | undefined): this {
        return this
    }
    onNativeEmbedVisibilityChange(value: OnNativeEmbedVisibilityChangeCallback | undefined): this {
        return this
    }
    onNativeEmbedGestureEvent(value: ((event: NativeEmbedTouchInfo) => void) | undefined): this {
        return this
    }
    copyOptions(value: CopyOptions | undefined): this {
        return this
    }
    onOverrideUrlLoading(value: OnOverrideUrlLoadingCallback | undefined): this {
        return this
    }
    textAutosizing(value: boolean | undefined): this {
        return this
    }
    enableNativeMediaPlayer(value: NativeMediaPlayerConfig | undefined): this {
        return this
    }
    onRenderProcessNotResponding(value: OnRenderProcessNotRespondingCallback | undefined): this {
        return this
    }
    onRenderProcessResponding(value: OnRenderProcessRespondingCallback | undefined): this {
        return this
    }
    onViewportFitChanged(value: OnViewportFitChangedCallback | undefined): this {
        return this
    }
    onInterceptKeyboardAttach(value: WebKeyboardCallback | undefined): this {
        return this
    }
    onAdsBlocked(value: OnAdsBlockedCallback | undefined): this {
        return this
    }
    keyboardAvoidMode(value: WebKeyboardAvoidMode | undefined): this {
        return this
    }
    editMenuOptions(value: EditMenuOptions | undefined): this {
        return this
    }
    enableHapticFeedback(value: boolean | undefined): this {
        return this
    }
    optimizeParserBudget(value: boolean | undefined): this {
        return this
    }
    enableFollowSystemFontWeight(value: boolean | undefined): this {
        return this
    }
    enableWebAVSession(value: boolean | undefined): this {
        return this
    }
    runJavaScriptOnDocumentStart(value: Array<ScriptItem> | undefined): this {
        return this
    }
    runJavaScriptOnDocumentEnd(value: Array<ScriptItem> | undefined): this {
        return this
    }
    runJavaScriptOnHeadEnd(value: Array<ScriptItem> | undefined): this {
        return this
    }
    nativeEmbedOptions(value: EmbedOptions | undefined): this {
        return this
    }
    registerNativeEmbedRule(tag: string | undefined, type: string | undefined): this {
        return this
    }
    bindSelectionMenu(elementType: WebElementType | undefined, content: CustomBuilder | undefined, responseType: WebResponseType | undefined, options?: SelectionMenuOptionsExt): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<WebAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface SslErrorEvent {
    handler: SslErrorHandler;
    error: SslError;
    url: string;
    originalUrl: string;
    referrer: string;
    isFatalError: boolean;
    isMainFrame: boolean;
}
export declare interface NestedScrollOptionsExt {
    scrollUp?: NestedScrollMode;
    scrollDown?: NestedScrollMode;
    scrollRight?: NestedScrollMode;
    scrollLeft?: NestedScrollMode;
}
export declare interface EmbedOptions {
    supportDefaultIntrinsicSize?: boolean;
}

@memo
@ComponentBuilder
export function Web(
    value: WebOptions,
    @memo
    content_?: () => void,
): WebAttribute { throw new Error("")}
