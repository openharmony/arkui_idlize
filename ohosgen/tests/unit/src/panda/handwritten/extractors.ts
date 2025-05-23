
import { ExternalType, ImportedHookValue } from "#external_lib"
import { SDKExternalType } from "@external.lib.sdk"

export namespace extractors {

    export function toExternalTypePtr(value: ExternalType): long {
        return value.nativePointer
    }

    export function fromExternalTypePtr(ptr: long): ExternalType {
        const result: ExternalType = { nativePointer: ptr }
        return result
    }

    export function toImportedHookValuePtr(value: ImportedHookValue): long {
        return 12
    }

    export function fromImportedHookValuePtr(value: long): ImportedHookValue {
        const result: ImportedHookValue = { count: 22 }
        return result
    }

    export function toSDKExternalTypePtr(value: SDKExternalType): long {
        return value.sdkNativePointer
    }

    export function fromSDKExternalTypePtr(ptr: long): SDKExternalType {
        const result: SDKExternalType = { sdkNativePointer: ptr }
        return result
    }
}