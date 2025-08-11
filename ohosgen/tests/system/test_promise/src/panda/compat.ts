import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestPromiseApiHandler } from '../../generated/arkts';

export { Foo } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_PROMISENativeModule');
    wrapSystemApiHandlerCallback()
    registerTestPromiseApiHandler()
}
