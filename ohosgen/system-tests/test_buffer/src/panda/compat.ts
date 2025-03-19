import { registerNativeModuleLibraryName } from '@koalaui/interop';
import { checkArkoalaCallbacks } from '../../generated/arkts';

export { Foo, FooResult } from '../../generated/arkts';

export function pullEvents() {
    checkArkoalaCallbacks();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_BUFFERNativeModule');
}
