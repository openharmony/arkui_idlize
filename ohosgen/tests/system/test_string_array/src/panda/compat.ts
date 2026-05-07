import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestStringArrayApiHandler } from '../../generated/arkts';

export { Foo, FooResult } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_STRING_ARRAYNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestStringArrayApiHandler()
}
