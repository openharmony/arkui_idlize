import { registerNativeModuleLibraryName } from '@koalaui/interop';
import { checkArkoalaCallbacks } from '../../generated/arkts/peers/CallbacksChecker';
import * as huks from '../../generated/arkts/GlobalScope';

export function pullEvents() {
    checkArkoalaCallbacks();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'HUKSNativeModule');
}
