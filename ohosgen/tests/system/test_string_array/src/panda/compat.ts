import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerTestStringArrayApiHandler } from '../../generated/arkts';

export { Foo, FooResult } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_STRING_ARRAYNativeModule');
    wrapSystemApiHandlerCallback()
    registerTestStringArrayApiHandler()
}
