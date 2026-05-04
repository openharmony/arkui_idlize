import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestManuallyDecomposedPromiseApiHandler } from '../../generated/arkts';

export { FooWork, FooResult } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MANUALLY_DECOMPOSED_PROMISENativeModule');
    wrapSystemApiHandlerCallback()
    registerTestManuallyDecomposedPromiseApiHandler()
}
