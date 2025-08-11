import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestModulesMultilevelApiHandler } from '../../generated/arkts';

export { FooInt, BarInt, BazInt, qux } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MODULES_MULTILEVELNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestModulesMultilevelApiHandler()
}
