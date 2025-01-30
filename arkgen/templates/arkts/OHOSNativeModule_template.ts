import { int32 } from "@koalaui/common"
import { pointer, KPointer, KInt, KStringPtr, KUint8ArrayPtr, loadNativeModuleLibrary } from "@koalaui/interop"

%NATIVE_MODULE_CONTENT%

export class %NATIVE_MODULE_NAME%NativeModule {
    static {
        loadNativeModuleLibrary("%NATIVE_MODULE_NAME%_NativeBridgeArk")
    }

    static native init(modules: string[]): void

    static callCallbackFromNative(id: KInt, args: KUint8ArrayPtr, length: KInt): KInt {
        // TODO implement callCallbackFromNative
        return 0
    }    

    // demo
    native static _AllocateNativeBuffer(length: KInt, retBuffer: KUint8ArrayPtr, init:KUint8ArrayPtr): void;

%NATIVE_FUNCTIONS%

%ARKUI_FUNCTIONS%
}
