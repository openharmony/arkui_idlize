
import { ExternalType, ImportedHookValue } from "#external_lib"
import { SDKExternalType } from "@external.lib.sdk"

export namespace extractors {

    export function toExternalTypePtr(value: ExternalType): bigint {
        return value.nativePointer
    }

    export function fromExternalTypePtr(ptr: bigint): ExternalType {
        const result: ExternalType = { nativePointer: ptr }
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
