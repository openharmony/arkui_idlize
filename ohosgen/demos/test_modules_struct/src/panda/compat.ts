import { registerNativeModuleLibraryName } from '@koalaui/interop';
import { checkArkoalaCallbacks } from '../../generated/arkts/peers/CallbacksChecker';

export { baz } from '../../generated/arkts';

export function pullEvents() {
    checkArkoalaCallbacks();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MODULES_STRUCTNativeModule');
}
