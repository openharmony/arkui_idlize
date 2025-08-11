import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestModulesSimpleApiHandler } from '../../generated/arkts';

export { FooInt } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MODULES_SIMPLENativeModule');
    wrapSystemApiHandlerCallback()
    registerTestModulesSimpleApiHandler()
}
