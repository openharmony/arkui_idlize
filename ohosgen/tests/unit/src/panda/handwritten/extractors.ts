
import { ExternalType, hookns, ImportedHookValue, ExternalClass } from "@external.lib"
import { SDKExternalType } from "@external.lib.sdk"
import { KPointer, MaterializedBaseTag } from "@koalaui/interop"
import { BaseGesture, DerivedGesture1, DerivedGesture2, GestureType, getBaseGestureType } from "#compat"

import {
    TransformSrcI,
    TransformDstI,
    TransformSrcC,
    TransformDstC,
    TransformSrcCallbackI,
    TransformDstCallbackI,
    TransformSrcCallbackC,
    TransformDstCallbackC,
    TransformMeToWithOptional,
    WithOptional,
} from "#compat"

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

    export function transform_OH_UNIT_TransformSrcI_to_OH_UNIT_TransformDstI(fromI: TransformSrcI): TransformDstI {
        const result: TransformDstI = {
            state: fromI.flag ? 1 : 0
        }
        return result
    }

    export function transform_OH_UNIT_TransformDstI_to_OH_UNIT_TransformSrcI(toI: TransformDstI): TransformSrcI {
        const result: TransformSrcI = {
            flag: toI.state > 0
        }
        return result
    }

    export function transform_OH_UNIT_TransformSrcC_to_OH_UNIT_TransformDstC(fromC: TransformSrcC): TransformDstC {
        const result = new TransformDstC();
        result.state = fromC.flag ? 1 : 0
        return result
    }

    export function transform_OH_UNIT_TransformDstC_to_OH_UNIT_TransformSrcC(toC: TransformDstC): TransformSrcC {
        const result = new TransformSrcC()
        result.flag = toC.state > 0
        return result
    }

    export function transform_OH_UNIT_TransformSrcCallbackI_to_UNIT_TransformDstCallbackI(comp: TransformSrcCallbackI): TransformDstCallbackI {
        return comp.flag ? (value: boolean) => { return !value } : (value: boolean) => { return value }
    }

    export function transform_UNIT_TransformDstCallbackI_to_OH_UNIT_TransformSrcCallbackI(callback: TransformDstCallbackI): TransformSrcCallbackI {
        const result: TransformSrcCallbackI = {
            flag: callback(true)
        }
        return result
    }

    export function transform_OH_UNIT_TransformSrcCallbackC_to_UNIT_TransformDstCallbackC(comp: TransformSrcCallbackC): TransformDstCallbackC {
        return comp.flag
            ? (value: boolean) => { return !value }
            : (value: boolean) => { return value }
    }

    export function transform_UNIT_TransformDstCallbackC_to_OH_UNIT_TransformSrcCallbackC(callback: TransformDstCallbackC): TransformSrcCallbackC {
        const result: TransformSrcCallbackC = {
            flag: callback(true)
        }
        return result
    }

    export function transform_OH_UNIT_TransformMeToWithOptional_to_Opt_String(from: TransformMeToWithOptional): WithOptional {
        return `transformed to WithOptional from ` + from
    }

    export function transform_Opt_String_to_OH_UNIT_TransformMeToWithOptional(from: WithOptional): TransformMeToWithOptional {
        return `transformed to TransformMeToWithOptional from ` + from
    }
}