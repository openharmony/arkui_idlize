declare interface ForceCallbackListener {
    onChange(flag: boolean, count: number): string
    onStatus(status: number): void
}

declare class ForceCallbackClass {
    registerListener(listener: ForceCallbackListener): void
    callListener(): void
}

declare function registerForceCallbackListener(listener: ForceCallbackListener): void
declare function callForceCallbackListener(): void
