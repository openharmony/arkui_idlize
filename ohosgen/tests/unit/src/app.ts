import { test_buffer } from '#compat'
import {
  ForceCallbackListener,
  ForceCallbackClass,
  registerForceCallbackListener,
  callForceCallbackListener
} from '#compat'

export function run() {
  console.log("Run common unit tests")

  // sum values
  const s = test_buffer.sum(2, 3)
  console.log(`sum: ${s}`)

  if (s != 5) {
    throw new Error(`The sum ${s} is not equal to 5`)
  }

  // Force callback
  const testListener: ForceCallbackListener = {
    onChange: (flag: boolean, count: number) => {
      return "OnChange"
    },
    onStatus: (status: number) => {
      console.log(`TestListener onStatus: ${status}`)
    }
  }

  const forceCallbackClass = new ForceCallbackClass()
  forceCallbackClass.registerListener(testListener)
  forceCallbackClass.callListener()

  registerForceCallbackListener(testListener)
  callForceCallbackListener()

}

