export * from "./generated/ArkUINativeModule"
export * from "./generated/ArkUINativeModuleEmpty"
export * from "./generated/TestNativeModule"
export * from "./generated/TestNativeModuleEmpty"

export function createUiDetachedRoot(
    peerFactory: () => any,
    /** @memo */
    builder: () => void
): any { throw new Error("Stub") }
export function destroyUiDetachedRoot(node: any): void { throw new Error("Stub") }