import { test_buffer } from '#compat'

// Panda specific code
export function runPanda() {
  console.log("Run ArkTS specific unit tests")

  let rlt: test_buffer.TestValue = test_buffer.getBuffer();
  console.log(rlt.errorCode);

  const buffer = rlt.outData;
  console.log(buffer)
  console.log(`buffer length: ${buffer.length}`)
  // TBD: add NativeBuffer.readByte(...) method
  // for (let i = 0; i < buffer.length; i++) {
  //   console.log(`buffer elem[${i}]: ${buffer.readByte(i)}`)
  // }
}

