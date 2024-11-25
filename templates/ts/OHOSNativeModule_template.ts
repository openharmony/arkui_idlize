import { int32 } from "@koalaui/common"
import { pointer, KPointer } from "@koalaui/interop"

%NATIVE_MODULE_CONTENT%

export interface %NATIVE_MODULE_NAME%NativeModule {
%NATIVE_FUNCTIONS%
}

type NativeModuleType = %NATIVE_MODULE_NAME%NativeModule
let theModule: NativeModuleType | undefined = undefined

declare const LOAD_NATIVE: NativeModuleType

export function get%NATIVE_MODULE_NAME%NativeModule(): NativeModuleType {
    if (theModule) return theModule
    theModule = LOAD_NATIVE as NativeModuleType
    if (!theModule)
        throw new Error("Cannot load native module")
    return theModule
}

