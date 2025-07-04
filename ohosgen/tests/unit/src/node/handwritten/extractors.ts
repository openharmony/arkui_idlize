
import { ExternalType, ImportedHookValue, hookns } from "#external_lib"
import { SDKExternalType } from "@external.lib.sdk"

export namespace extractors {

    export function toExternalTypePtr(value: ExternalType): bigint {
        return value.nativePointer
    }

    export function fromExternalTypePtr(ptr: bigint): ExternalType {
        const result: ExternalType = { nativePointer: ptr }
        return result
    }

    export function toHooknsNSExternalTypePtr(value: hookns.NSExternalType): bigint {
        return value.nsNativePointer
    }

    export function fromHooknsNSExternalTypePtr(ptr: bigint): hookns.NSExternalType {
        const result: hookns.NSExternalType = { nsNativePointer: ptr }
        return result
    }

    export function toHooknsSubhooknsSubNSExternalTypePtr(value: hookns.subhookns.SubNSExternalType): bigint {
        return value.subnsNativePointer
    }

    export function fromHooknsSubhooknsSubNSExternalTypePtr(ptr: bigint): hookns.subhookns.SubNSExternalType {
        const result: hookns.subhookns.SubNSExternalType = { subnsNativePointer: ptr }
        return result
    }

    export function toImportedHookValuePtr(value: ImportedHookValue): bigint {
        return BigInt(8)
    }

    export function toSDKExternalTypePtr(value: SDKExternalType): bigint {
        return value.sdkNativePointer
    }

    export function fromSDKExternalTypePtr(ptr: bigint): SDKExternalType {
        const result: SDKExternalType = { sdkNativePointer: ptr }
        return result
    }
}
