import { registerNativeModuleLibraryName } from '@koalaui/interop';
export { resize, resize3 } from '../../generated/arkts';

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_FQNNativeModule');
}
