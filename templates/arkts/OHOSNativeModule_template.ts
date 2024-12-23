import { int32 } from "@koalaui/common"
import { pointer, KPointer, KInt, KStringPtr, KUint8ArrayPtr } from "@koalaui/interop"

%NATIVE_MODULE_CONTENT%

export class %NATIVE_MODULE_NAME%NativeModule {
    static {
        loadLibrary("%NATIVE_MODULE_NAME%_NativeBridgeArk")
        %NATIVE_MODULE_NAME%NativeModule.init()
    }

    static native init(): void;

    static callCallbackFromNative(id: KInt, args: KUint8ArrayPtr, length: KInt): KInt {
        // TODO implement callCallbackFromNative
        return 0
    }    

    // demo
    native static _AllocateNativeBuffer(length: KInt, retBuffer: KUint8ArrayPtr, init:KUint8ArrayPtr): void;

%NATIVE_FUNCTIONS%
}

let theModule: %NATIVE_MODULE_NAME%NativeModule

export function get%NATIVE_MODULE_NAME%NativeModule(): %NATIVE_MODULE_NAME%NativeModule {
    if (theModule) return theModule
    theModule = new %NATIVE_MODULE_NAME%NativeModule()
    return theModule
}

