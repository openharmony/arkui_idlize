
import { ExternalType, ImportedHookValue } from "#external_lib"

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
}
