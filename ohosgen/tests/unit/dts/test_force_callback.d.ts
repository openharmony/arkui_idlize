export interface ForceCallbackListener {
    onChange(flag: boolean, count: number): string
    onStatus(status: number): void
}

export class ForceCallbackClass {
    registerListener(listener: ForceCallbackListener): void
    callListener(): number
}

export function registerForceCallbackListener(listener: ForceCallbackListener): void
export function callForceCallbackListener(): number
