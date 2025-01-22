// Seems like we need to have some Facade to define different names for different libraries
import { NativeModuleType } from "@idlize/core"

export class NativeModule {
    static Interop = new NativeModuleType("InteropNativeModule")
    static ArkUI = new NativeModuleType("ArkUINativeModule")
    static Generated = new NativeModuleType("ArkUIGeneratedNativeModule")
    static Test = new NativeModuleType("TestNativeModule")
}