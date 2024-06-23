import { NativeModuleEmpty } from "./NativeModuleEmpty"
import { NativeModuleBase } from "./NativeModuleBase"
import {
  NativeStringBase,
  providePlatformDefinedData,
  nullptr,
  Access,
  withByteArray,
  CallbackRegistry,
  ArrayDecoder
} from "@koalaui/interop"

export type NodePointer = pointer
export type PipelineContext = pointer

let theModule: NativeModule | undefined = undefined

declare const LOAD_NATIVE: NativeModule

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    if (%USE_EMPTY%)
        theModule = new NativeModuleEmpty()
    else
        theModule = LOAD_NATIVE as NativeModule
    return theModule
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

export interface NativeModule extends NativeModuleBase {