import { int32 } from "@koalaui/common"
import { pointer, KPointer, registerNativeModule, registerLoadedLibrary } from "@koalaui/interop"

%NATIVE_MODULE_CONTENT%

export class %NATIVE_MODULE_NAME%NativeModule {
%NATIVE_FUNCTIONS%

%ARKUI_FUNCTIONS%
}

registerNativeModule("%NATIVE_MODULE_NAME%NativeModule", %NATIVE_MODULE_NAME%NativeModule)
registerNativeModule("ArkUINativeModule", %NATIVE_MODULE_NAME%NativeModule)
declare const LOAD_NATIVE: any
registerLoadedLibrary(LOAD_NATIVE)
