import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestPackageApiHandler } from '../../generated/arkts';

export { FooObject, BarObject } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_PACKAGENativeModule');
    wrapSystemApiHandlerCallback()
    registerTestPackageApiHandler()
}
