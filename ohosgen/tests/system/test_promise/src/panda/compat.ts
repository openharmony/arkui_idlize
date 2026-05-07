import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestPromiseApiHandler } from '../../generated/arkts';

export { Foo } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_PROMISENativeModule');
    wrapSystemApiHandlerCallback()
    registerTestPromiseApiHandler()
}
