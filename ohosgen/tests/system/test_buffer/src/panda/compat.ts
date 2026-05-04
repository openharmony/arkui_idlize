import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestBufferApiHandler } from '../../generated/arkts';

export { Foo, FooResult } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_BUFFERNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestBufferApiHandler()
}
