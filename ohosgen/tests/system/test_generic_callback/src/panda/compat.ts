import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestGenericCallbackApiHandler } from '../../generated/arkts';

export { Foo } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_GENERIC_CALLBACKNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestGenericCallbackApiHandler()
}
