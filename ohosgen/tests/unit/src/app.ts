import { and_values } from '#compat'
import { sum_numbers } from '#compat'
import {
  ForceCallbackListener,
  ForceCallbackClass,
  registerForceCallbackListener,
  callForceCallbackListener,
  ClassWithComplexPropertyType
} from '#compat'
import { OrdinaryEnum, IntEnum, StringEnum } from '#compat'


function compareNumbers(v1: number, v2: number): boolean {
  return Math.abs(v2 - v1) < 0.1
}

function check_booleans() {
  if (and_values(false, false))
    throw new Error(`and(false, false) returns true!`)
  if (and_values(false, true))
    throw new Error(`and(false, true) returns true!`)
  if (and_values(true, false))
    throw new Error(`and(true, false) returns true!`)
  if (!and_values(true, true))
    throw new Error(`and(true, true) returns false!`)
}

function checkNumber() {
  // sum numbers
  let s = sum_numbers(2, 3)
  console.log(`sum: ${s}`)
  if (!compareNumbers(s, 5))
    throw new Error(`The sum ${s} is not equal to 5`)

  s = sum_numbers(2.3, 3)
  console.log(`sum: ${s}`)
  if (!compareNumbers(s, 5.3))
    throw new Error(`The sum ${s} is not equal to 5.3`)

  s = sum_numbers(2, 3.5)
  console.log(`sum: ${s}`)
  if (!compareNumbers(s, 5.5))
    throw new Error(`The sum ${s} is not equal to 5.3`)

  s = sum_numbers(2.3, 3.5)
  console.log(`sum: ${s}`)
  if (!compareNumbers(s, 5.8))
    throw new Error(`The sum ${s} is not equal to 5.3`)
}

function checkForceCallback() {

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

function checkEnum() {

  console.log(OrdinaryEnum.E1.valueOf())
  console.log(OrdinaryEnum.E2.valueOf())
  console.log(IntEnum.E1.valueOf())
  console.log(IntEnum.E2.valueOf())
  console.log(StringEnum.E1.valueOf())
  console.log(StringEnum.E2.valueOf())

  // use Enum.VALUE.valueOf() as a workaround
  if (IntEnum.E1.valueOf() != 11)
    throw new Error(`Enum value is ${IntEnum.E1.valueOf()} instead of 11`)
  if (IntEnum.E2.valueOf() != 12)
    throw new Error(`Enum value is ${IntEnum.E2.valueOf()} instead of 12`)
  if (StringEnum.E1.valueOf() != "e1")
    throw new Error(`Enum value is ${StringEnum.E1.valueOf()} instead of e1`)
  if (StringEnum.E2.valueOf() != "e2")
    throw new Error(`Enum value is ${StringEnum.E2.valueOf()} instead of e2`)
}

function checkClassWithComplexPropertyType() {
  let value = new ClassWithComplexPropertyType()
  const expectedCounter: number = 10
  if (value.prop.counter != expectedCounter) {
    throw new Error(`checkClassWithComplexPropertyType.counter expected: ${expectedCounter}, result: ${value.prop.counter}`)
  }
  const expectedFlag = true
  if (value.prop.flag != expectedFlag) {
    throw new Error(`checkClassWithComplexPropertyType.flag expected: ${expectedCounter}, result: ${value.prop.counter}`)
  }
}

export function run() {
  console.log("Run common unit tests")

  check_booleans()
  checkNumber()
  checkForceCallback()
  checkEnum()
  checkClassWithComplexPropertyType()
}

