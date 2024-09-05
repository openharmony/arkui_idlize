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
}

declare const Web: WebInterface;
declare const WebInstance: WebAttribute;