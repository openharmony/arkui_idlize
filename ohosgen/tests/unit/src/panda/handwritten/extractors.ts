
import { ExternalType, hookns, ImportedHookValue, ExternalClass } from "@external.lib"
import { SDKExternalType } from "@external.lib.sdk"
import { KPointer, MaterializedBaseTag } from "@koalaui/interop"
import { BaseGesture, DerivedGesture1, DerivedGesture2, GestureType, getBaseGestureType } from "#compat"

class ExternalClassImpl implements ExternalClass {

    ptr: long

    constructor(ptr: long) {
        this.ptr = ptr
    }
    externalMethod(value: number): boolean {
        return true
    }
}

export namespace extractors {

    export function toExternalTypePtr(value: ExternalType): long {
        return value.nativePointer
    }

    export function fromExternalTypePtr(ptr: long): ExternalType {
        const result: ExternalType = { nativePointer: ptr }
        return result
    }

    export function toHooknsNSExternalTypePtr(value: hookns.NSExternalType): long {
        return value.nsNativePointer
    }

    export function fromHooknsNSExternalTypePtr(ptr: long): hookns.NSExternalType {
        const result: hookns.NSExternalType = { nsNativePointer: ptr }
        return result
    }

    export function toHooknsSubhooknsSubNSExternalTypePtr(value: hookns.subhookns.SubNSExternalType): long {
        return value.subnsNativePointer
    }

    export function fromHooknsSubhooknsSubNSExternalTypePtr(ptr: long): hookns.subhookns.SubNSExternalType {
        const result: hookns.subhookns.SubNSExternalType = { subnsNativePointer: ptr }
        return result
    }

    export function toImportedHookValuePtr(value: ImportedHookValue): long {
        return 12
    }

    export function fromImportedHookValuePtr(value: long): ImportedHookValue {
        const result: ImportedHookValue = { count: 22 }
        return result
    }

    export function toExternalClassPtr(value: ExternalClass): long {
        return value.ptr
    }

    export function fromExternalClassPtr(ptr: long): ExternalClass {
        return new ExternalClassImpl(ptr)
    }

    export function toSDKExternalTypePtr(value: SDKExternalType): long {
        return value.sdkNativePointer
    }

    export function fromSDKExternalTypePtr(ptr: long): SDKExternalType {
        const result: SDKExternalType = { sdkNativePointer: ptr }
        return result
    }

    export function deserialize_test_inheritance_BaseGesture(ptr: KPointer): BaseGesture {
        const gestureType = getBaseGestureType(ptr)
        switch (gestureType) {
            case GestureType.First: return new DerivedGesture1(MaterializedBaseTag.NOP, ptr)
            default: return new DerivedGesture2(MaterializedBaseTag.NOP, ptr)
        }
    }
}