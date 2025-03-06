import { test_buffer } from '#compat'

// Panda specific code
function checkNativeBuffer() {
  let rlt: test_buffer.TestValue = test_buffer.getBuffer();
  console.log(rlt.errorCode);

  const buffer = rlt.outData;
  console.log(buffer)
  console.log(`buffer length: ${buffer.length}`)
  for (let i = 0; i < buffer.length; i++) {
    console.log(`read value by index ${i} from the buffer`)
    console.log(`buffer elem[${i}]: ${buffer.readByte(i)}`)
    const value = 100 + i
    console.log(`write value ${value} to the buffer with index ${i}`)
    buffer.writeByte(i, 100 + i)
    console.log(`buffer elem[${i}]: ${buffer.readByte(i)}`)
    console.log()
  }
}
export function runPanda() {
  console.log("Run ArkTS specific unit tests")

  checkNativeBuffer()
}

