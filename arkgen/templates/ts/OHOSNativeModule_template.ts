import { int32 } from "@koalaui/common"
import { pointer, KPointer, loadNativeModuleLibrary } from "@koalaui/interop"

%NATIVE_MODULE_CONTENT%

export class %NATIVE_MODULE_NAME%NativeModule {
    private static _isLoaded: boolean = false
    private static _LoadOnce(): boolean {
        if ((this._isLoaded) == (false))
        {
            this._isLoaded = true
            loadNativeModuleLibrary("%NATIVE_MODULE_NAME%NativeModule", %NATIVE_MODULE_NAME%NativeModule)
            return true
        }
        return false
    }
%NATIVE_FUNCTIONS%

%ARKUI_FUNCTIONS%
}
