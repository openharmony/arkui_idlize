package idlize

%NATIVE_MODULE_CONTENT%

public class %NATIVE_MODULE_NAME%NativeModule {
    static {
        loadLibrary("%NATIVE_MODULE_NAME%_NativeBridgeArk")
        %NATIVE_MODULE_NAME%NativeModule.init()
    }

    static func native init(): Unit {}

    static func callCallbackFromNative(id: KInt, args: KPointer, length: KInt): KInt {
        // TODO implement callCallbackFromNative
        return 0
    }    

%NATIVE_FUNCTIONS%
}

let theModule: %NATIVE_MODULE_NAME%NativeModule

func function get%NATIVE_MODULE_NAME%NativeModule(): %NATIVE_MODULE_NAME%NativeModule {
    if (theModule) {
        return theModule
    }
    theModule = new %NATIVE_MODULE_NAME%NativeModule()
    return theModule
}

