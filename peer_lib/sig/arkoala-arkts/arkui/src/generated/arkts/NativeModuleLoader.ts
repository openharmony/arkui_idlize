
import { KInt, KUint8ArrayPtr } from "@koalaui/interop"
import { callCallback } from "../CallbackRegistry"

export class NativeModuleLoader {
    static callCallbackFromNative(id: KInt, args: KUint8ArrayPtr, length: KInt): KInt {
        return callCallback(id, args, length)
    }

    native static init(modules: string[]): void
}