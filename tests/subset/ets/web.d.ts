declare interface NativeEmbedInfo {
    params?: Map<string, string>;
}

declare interface NativeEmbedDataInfo {
    info?: NativeEmbedInfo;
}

interface WebInterface {
    (): WebAttribute;
}

declare class WebAttribute extends CommonMethod<WebAttribute> {
    onNativeEmbedLifecycleChange(callback: (event: NativeEmbedDataInfo) => void): WebAttribute;
}

declare const Web: WebInterface;
declare const WebInstance: WebAttribute;