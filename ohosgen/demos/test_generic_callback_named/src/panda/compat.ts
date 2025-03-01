import { registerNativeModuleLibraryName } from '@koalaui/interop';
import { checkArkoalaCallbacks } from '../../generated/arkts/peers/CallbacksChecker';

export { Foo, OHOSCallback_string } from '../../generated/arkts';

export function pullEvents() {
    checkArkoalaCallbacks();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_GENERIC_CALLBACK_NAMEDNativeModule');
}
