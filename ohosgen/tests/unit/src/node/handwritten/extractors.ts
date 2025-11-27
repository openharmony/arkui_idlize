
import { KPointer } from "@koalaui/interop"

import { ExternalType, hookns, ImportedHookValue, ExternalClass } from "@external.lib"
import { SDKExternalType } from "@external.lib.sdk"

import { BaseGesture, DerivedGesture1, DerivedGesture2, GestureType, getBaseGestureType } from "#compat"


class ExternalClassImpl implements ExternalClass {

    ptr: KPointer

    constructor(ptr: KPointer) {
        this.ptr = ptr
    }
    externalMethod(value: number): boolean {
        return true
    }
}

export namespace extractors {

    export function toExternalTypePtr(value: ExternalType): KPointer {
        return value.nativePointer
    }

    export function fromExternalTypePtr(ptr: KPointer): ExternalType {
        const result: ExternalType = { nativePointer: ptr }
        return result
    }

    export function toHooknsNSExternalTypePtr(value: hookns.NSExternalType): KPointer {
        return value.nsNativePointer
    }

    export function fromHooknsNSExternalTypePtr(ptr: KPointer): hookns.NSExternalType {
        const result: hookns.NSExternalType = { nsNativePointer: ptr }
        return result
    }

    export function toHooknsSubhooknsSubNSExternalTypePtr(value: hookns.subhookns.SubNSExternalType): KPointer {
        return value.subnsNativePointer
    }

    export function fromHooknsSubhooknsSubNSExternalTypePtr(ptr: KPointer): hookns.subhookns.SubNSExternalType {
        const result: hookns.subhookns.SubNSExternalType = { subnsNativePointer: ptr }
        return result
    }

    export function toExternalClassPtr(value: ExternalClass): KPointer {
        return value.ptr
    }

    export function fromExternalClassPtr(ptr: KPointer): ExternalClass {
        return new ExternalClassImpl(ptr)
    }

    export function toImportedHookValuePtr(value: ImportedHookValue): KPointer {
        return BigInt(8)
    }

    export function toSDKExternalTypePtr(value: SDKExternalType): KPointer {
        return value.sdkNativePointer
    }

    export function fromSDKExternalTypePtr(ptr: KPointer): SDKExternalType {
        const result: SDKExternalType = { sdkNativePointer: ptr }
        return result
    }

    export function deserialize_test_inheritance_BaseGesture(ptr: KPointer): BaseGesture {
        const gestureType = getBaseGestureType(ptr)
        switch (gestureType) {
            case GestureType.First: return new DerivedGesture1(ptr)
            default: return new DerivedGesture2(ptr)
        }
    }
}
