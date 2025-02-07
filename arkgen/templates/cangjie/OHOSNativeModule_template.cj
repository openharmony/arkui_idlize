package idlize

import Interop.*
import std.collection.*

%NATIVE_MODULE_CONTENT%

foreign {
%NATIVE_FUNCTIONS%
}

public class %NATIVE_MODULE_NAME%NativeModule {
    static func callCallbackFromNative(id: KInt, args: KPointer, length: KInt): KInt {
        // TODO implement callCallbackFromNative
        return 0
    }    

%CJ_NATIVE_FUNCTIONS%
}
