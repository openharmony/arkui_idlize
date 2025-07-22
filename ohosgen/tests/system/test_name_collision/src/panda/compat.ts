import { registerNativeModuleLibraryName } from '@koalaui/interop';
export { resize, image, window } from '../../generated/arkts';

export function init() {
    registerNativeModuleLibraryName('InteropNativeModule', 'TEST_NAME_COLLISIONNativeModule');
}
