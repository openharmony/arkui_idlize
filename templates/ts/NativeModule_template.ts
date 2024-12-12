import { NativeModuleEmpty } from "./NativeModuleEmpty"
import {
  NativeStringBase,
  providePlatformDefinedData,
  nullptr,
  Access,
  withByteArray,
  CallbackRegistry,
  ArrayDecoder,
} from "@koalaui/interop"
import { callCallback } from "@koalaui/interop"

type KLong = number

export type NodePointer = pointer
export type PipelineContext = pointer

let theModule: NativeModule | undefined = undefined

declare const LOAD_NATIVE: NativeModule

export function initInteropModule(nativeModule?: NativeModule) {
    if (theModule) return
    theModule = nativeModule ?? LOAD_NATIVE
    if (!theModule)
        throw new Error("Cannot load native module")
    // TODO: properly implement (or get rid of?) [NativeModule._CheckImpl()]
    // let result = theModule._CheckImpl()
    // if (result != undefined) {
    //     theModule = undefined
    //     throw new Error("Error loading native module: " + result.toString())
    // }
    theModule._SetCallbackDispatcher(callCallback)
}

export function initEmptyNativeModule() {
    initInteropModule(new NativeModuleEmpty())
}

export function nativeModule(): NativeModule {
    initInteropModule()
    return theModule!
}

class NativeString extends NativeStringBase {
    constructor(ptr: KPointer) {
        super(ptr)
    }
    protected bytesLength(): int32 {
        return nativeModule()._StringLength(this.ptr)
    }
    protected getData(data: Uint8Array): void {
        withByteArray(data, Access.WRITE, (dataPtr: KUint8ArrayPtr) => {
            nativeModule()._StringData(this.ptr, dataPtr, data.length)
        })
    }
    close(): void {
        nativeModule()._InvokeFinalizer(this.ptr, nativeModule()._GetStringFinalizer())
        this.ptr = nullptr
    }
}

providePlatformDefinedData({
    nativeString(ptr: KPointer): NativeStringBase { return new NativeString(ptr) },
    nativeStringArrayDecoder(): ArrayDecoder<NativeStringBase> { throw new Error("Not implemented") },
    callbackRegistry(): CallbackRegistry | undefined { return undefined }
})

export interface InteropOps {
    _SetCallbackDispatcher(dispatcher: (id: int32, args: Uint8Array, length: int32) => int32): void
    _CleanCallbackDispatcher(): void

%GENERATED_PREDEFINED_Interop%
}

export interface GraphicsOps {
    // TODO fill me if needed
}

export interface LoaderOps {
%GENERATED_PREDEFINED_Loader%
}

export interface NodeOps {
%GENERATED_PREDEFINED_Node%
}

export interface ComponentOps {
%GENERATED_METHODS%
}

export interface TestOps {
%GENERATED_PREDEFINED_Test%
}

export interface NativeModuleIntegrated extends InteropOps, /*GraphicsOps, NodeOps,*/ ComponentOps {}
export interface NativeModule extends InteropOps, GraphicsOps, NodeOps, ComponentOps, TestOps, LoaderOps {}