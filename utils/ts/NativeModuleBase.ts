import { int32, KPointer, pointer, KStringPtr, KInt, NodePointer, KUint8ArrayPtr, KNativePointer } from "./types"

export interface NativeModuleBase {
    _GetResultString(index: KInt): pointer;
    _ClearResultString(index: KInt): void;
    _AppendResultString(string: KStringPtr): void;
    
    _GetStringFinalizer(): pointer

    _InvokeFinalizer(ptr: NodePointer, finalizer: NodePointer): void

    _StringLength(ptr: pointer): KInt;
    _StringData(ptr: pointer, buffer: KUint8ArrayPtr, length: KInt): void;
    _StringMake(value: KStringPtr): pointer;
}