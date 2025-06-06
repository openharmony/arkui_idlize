import { registerNativeModuleLibraryName } from '@koalaui/interop';
import { checkArkoalaCallbacks } from '../../generated/arkts';

export function pullEvents() {
    checkArkoalaCallbacks();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'HUKS_WITH_CLASSNativeModule');
}
