import { registerNativeModuleLibraryName } from '@koalaui/interop';
import { checkArkoalaCallbacks } from '../../generated/arkts/peers/CallbacksChecker';

export { FooInt, BarInt, BazInt, qux } from '../../generated/arkts';

export function pullEvents() {
    checkArkoalaCallbacks();
}

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_MODULES_MULTILEVEL_PROPERTYNativeModule');
}
