/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

declare class WebResourceResponse {
    setResponseData(data: string | number | Resource | ArrayBuffer): void;
}

declare interface OnHttpErrorReceiveEvent {
    response: WebResourceResponse;
}

declare interface NativeEmbedInfo {
    params?: Map<string, string>;
}

declare interface NativeEmbedDataInfo {
    info?: NativeEmbedInfo;
}

interface WebInterface {
    (): WebAttribute;
}

declare enum RenderExitReason {
    ProcessAbnormalTermination,
    ProcessWasKilled,
    ProcessCrashed,
    ProcessOom,
    ProcessExitUnknown,
}

declare interface OnRenderExitedEvent {
    renderExitReason: RenderExitReason;
}

declare class WebAttribute extends CommonMethod<WebAttribute> {
    onNativeEmbedLifecycleChange(callback: (event: NativeEmbedDataInfo) => void): WebAttribute;
    onRenderExited(callback: Callback<OnRenderExitedEvent>): WebAttribute;
    /* @deprecated */
    onRenderExited(callback: (event?: { detail: object }) => boolean): WebAttribute;
    onHttpErrorReceive(callback: Callback<OnHttpErrorReceiveEvent>): WebAttribute;
}

declare const Web: WebInterface;
declare const WebInstance: WebAttribute;