export * from "./generated/NativeModule"
export * from "./generated/NativeModuleEmpty"

export function createUiDetachedRoot(
    peerFactory: () => any,
    /** @memo */
    builder: () => void
): any { throw new Error("Stub") }
export function destroyUiDetachedRoot(node: any): void { throw new Error("Stub") }