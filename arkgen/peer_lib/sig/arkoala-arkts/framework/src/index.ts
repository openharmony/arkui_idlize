import { IncrementalNode } from "@koalaui/runtime"

export * from "./generated/ArkUINativeModule"
export * from "./generated/ArkUINativeModuleEmpty"
export * from "./generated/TestNativeModule"
export * from "./generated/TestNativeModuleEmpty"
export * from "./Events"
export * from "./PeerEvents"
export * from "./PeerNode"
export * from "./NativePeerNode"

export function createUiDetachedRoot(
    peerFactory: () => any,
    /** @memo */
    builder: () => void
): any { throw new Error("Stub") }
export function destroyUiDetachedRoot(node: any): void { throw new Error("Stub") }
export const GeneratedPartialPropertiesType = -111
export const PeerNodeType = -111