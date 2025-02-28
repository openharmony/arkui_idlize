
import { Callback } from './@ohos.base';

declare namespace test_buffer {

  interface TestResult {
    readonly flag: boolean;
  }

    interface TestListener  {
      on(type: 'update', callback: Callback<TestResult>): void;
  }

  interface TestValue {
    errorCode: number
    outData: Uint8Array
  }

  function getBuffer(): TestValue

  function sum(v1: number, v2: number): number
}

