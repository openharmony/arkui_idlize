import { checkEvents, registerNativeModuleLibraryName, wrapSystemApiHandlerCallback } from '@koalaui/interop';
import { registerHuksWithClassApiHandler } from '../../generated/arkts/huks_with_class.INTERNAL';

export function pullEvents(): void {
    checkEvents();
}

export function init(): void {
    registerNativeModuleLibraryName('InteropNativeModule', 'HUKS_WITH_CLASSNativeModule');
    wrapSystemApiHandlerCallback()
    registerHuksWithClassApiHandler()
}
