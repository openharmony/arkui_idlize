import { registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestOstApiHandler } from '../../generated/arkts';

export { checkEvents } from '@koalaui/interop'
export { resize, resize3, resizeAll } from '../../generated/arkts/fqnMain'
export { resize as iresize, fp } from '../../generated/arkts/fqnDeps'
export { Buffers } from '../../generated/arkts/buffers';
export { Callbacks } from '../../generated/arkts/callbacks';

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_OSTNativeModule')
    wrapSystemApiHandlerCallback()
    registerTestOstApiHandler()
}
