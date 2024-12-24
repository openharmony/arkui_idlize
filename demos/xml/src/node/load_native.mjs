import { registerNativeModule } from "@koalaui/interop"

const NativeModule = {}
registerNativeModule("NativeModule", NativeModule)
registerNativeModule("InteropNativeModule", NativeModule)

export default NativeModule