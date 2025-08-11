import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestModulesMultilevelPropertyApiHandler } from '../../generated/arkts';

export { FooInt, BarInt, BazInt, qux } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MODULES_MULTILEVEL_PROPERTYNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestModulesMultilevelPropertyApiHandler()
}
