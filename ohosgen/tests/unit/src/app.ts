import { test_buffer } from '#compat'
import {
  ForceCallbackListener,
  ForceCallbackClass,
  registerForceCallbackListener,
  callForceCallbackListener
} from '#compat'

function checkBuffer() {
  // sum values
  const s = test_buffer.sum(2, 3)
  console.log(`sum: ${s}`)

  if (s != 5) {
    throw new Error(`The sum ${s} is not equal to 5`)
  }
}

async function checkForceCallback() {

  const testListener: ForceCallbackListener = {
    onStatus: (status: number) => {
      const expected = 123456
      console.log(`TestListener onStatus: ${status}`)
      if (status != expected) {
        throw new Error(`ForceCallbackListener.onStatus() expected: ${expected}, status: ${status}`)
      }
    },
    onChange: (flag: boolean, count: number) => {
      console.log("OnChange called!")
      if (!flag) {
        throw Error(`The provided flag is not true`)
      }
      const expected = 78910
      if (count != expected) {
        throw new Error(`ForceCallbackListener.onStatus() expected: ${expected}, count: ${count}`)
      }
      return "OnChange"
    },
  }

  const forceCallbackClass = new ForceCallbackClass()
  forceCallbackClass.registerListener(testListener)
  const res = forceCallbackClass.callListener()
  const expected: number = 101
  if (res != expected) {
    throw new Error(`forceCallbackClass.callListener() expected: ${expected}, result: ${res}`)
  }

  registerForceCallbackListener(testListener)
  callForceCallbackListener()
}

export function run() {
  console.log("Run common unit tests")

  checkBuffer()
  checkForceCallback()
}

