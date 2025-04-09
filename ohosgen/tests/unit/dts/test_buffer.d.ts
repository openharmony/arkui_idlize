
// TBD: wait for the interface FQN fix for ArkTS
// import { Callback } from './@ohos.base';

export namespace test_buffer {

  export interface TestValue {
    errorCode: number
    outData: Uint8Array
  }

  export function getBuffer(): TestValue
}
