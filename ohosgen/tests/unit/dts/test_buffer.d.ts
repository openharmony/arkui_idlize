
import { Callback } from './@ohos.base';

declare namespace test_buffer {

  interface TestValue {
    errorCode: number
    outData: Uint8Array
  }

  function getBuffer(): TestValue

  function sum(v1: number, v2: number): number
}

