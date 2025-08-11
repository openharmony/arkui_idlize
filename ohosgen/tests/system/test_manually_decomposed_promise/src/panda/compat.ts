import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestManuallyDecomposedPromiseApiHandler } from '../../generated/arkts';

export { FooWork, FooResult } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MANUALLY_DECOMPOSED_PROMISENativeModule');
    wrapSystemApiHandlerCallback()
    registerTestManuallyDecomposedPromiseApiHandler()
}
