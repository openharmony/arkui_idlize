import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestPackageApiHandler } from '../../generated/arkts';

export { FooObject, BarObject } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_PACKAGENativeModule');
    wrapSystemApiHandlerCallback()
    registerTestPackageApiHandler()
}
