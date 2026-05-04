import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestModulesStructApiHandler } from '../../generated/arkts';

export { baz } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MODULES_STRUCTNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestModulesStructApiHandler()
}
