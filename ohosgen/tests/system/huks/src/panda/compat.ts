import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerHuksApiHandler } from '../../generated/arkts';

export function pullEvents() {
    checkEvents();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'HUKSNativeModule');
    wrapSystemApiHandlerCallback()
    registerHuksApiHandler()
}
