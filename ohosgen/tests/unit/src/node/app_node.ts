import { test_buffer } from '#compat'

// Node specific code
export function runNode() {
  console.log("Run Node specific unit tests")


  // Add node specific buffer data read
  // let rlt: test_buffer.TestValue = test_buffer.getBuffer();
  // console.log(rlt.errorCode);

  // const buffer = rlt.outData;
  // console.log(buffer)
  // console.log(`buffer length: ${buffer.length}`)
  // TBD: add NativeBuffer.readByte(...) method
  // for (let i = 0; i < buffer.length; i++) {
  //   console.log(`buffer elem[${i}]: ${buffer.readByte(i)}`)
  // }
}

