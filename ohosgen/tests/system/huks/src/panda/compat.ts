import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerHuksApiHandler } from '../../generated/arkts';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'HUKSNativeModule');
    wrapSystemApiHandlerCallback()
    registerHuksApiHandler()
}
