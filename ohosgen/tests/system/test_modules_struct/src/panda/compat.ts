import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestModulesStructApiHandler } from '../../generated/arkts';

export { baz } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MODULES_STRUCTNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestModulesStructApiHandler()
}
