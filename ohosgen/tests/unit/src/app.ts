import {
  // .d.ts
  CONST_BOOLEAN_FALSE,
  CONST_BOOLEAN_TRUE,
  CONST_NUMBER_INT,
  CONST_NUMBER_FLOAT,
  CONST_STRING,
  // .idl
  IDL_CONST_BOOLEAN_FALSE,
  IDL_CONST_BOOLEAN_TRUE,
  IDL_CONST_NUMBER_INT,
  IDL_CONST_NUMBER_FLOAT,
  IDL_CONST_STRING
} from '#compat'

import { and_values } from '#compat'
import { sum_numbers } from '#compat'
import {
  ForceCallbackListener,
  ForceCallbackClass,
  registerForceCallbackListener,
  callForceCallbackListener,
  ClassWithComplexPropertyType
} from '#compat'
import {
  OrdinaryEnum,
  IntEnum,
  StringEnum,
  checkOrdinaryEnums,
  IDLOrdinaryEnum,
  IDLIntEnum,
  IDLStringEnum,
  idlCheckOrdinaryEnums,
  testDataClass, testDataInterface, DataClass, DataInterface,
  testIDLDataClass, testIDLDataInterface, IDLDataClass, IDLDataInterface
} from '#compat'

function assertEquals(expected: boolean | number | string, actual: boolean | number | string, msg?: string) {
  if (typeof expected !== typeof actual || expected !== actual) {
    msg = msg ? `"${msg}" ` : ""
    const q = typeof expected === "string" ? "'" : ""
    throw new Error(`ASSERT ${msg}failed: expected ${q}${expected}${q}, actual ${q}${actual}${q}`)
  }
}

function compareNumbers(v1: number, v2: number): boolean {
  return Math.abs(v2 - v1) < 0.1
}

function check_constants() {
  // 1. Check dts const value
  // Fix boolean const type generation
  // if (CONST_BOOLEAN_FALSE != false)
  //   throw new Error(`CONST_BOOLEAN_FALSE is not false!`)
  // if (CONST_BOOLEAN_TRUE != true)
  //   throw new Error(`CONST_BOOLEAN_FALSE is not true!`)

  assertEquals(312, CONST_NUMBER_INT, "CONST_NUMBER_INT")

  // Fix float const value
  // if (CONST_NUMBER_FLOAT != 312.415) {
  //   throw new Error(`CONST_NUMBER_FLOAT is not 312.415!`)
  // }

  // 2. Check idl const values
  assertEquals(312, IDL_CONST_NUMBER_INT, "IDL_CONST_NUMBER_INT")
  assertEquals(312.415, IDL_CONST_NUMBER_FLOAT, "IDL_CONST_NUMBER_FLOAT")
  assertEquals(false, IDL_CONST_BOOLEAN_FALSE, "IDL_CONST_BOOLEAN_FALSE")
  assertEquals(true, IDL_CONST_BOOLEAN_TRUE, "IDL_CONST_BOOLEAN_TRUE");
  assertEquals("hello_string", IDL_CONST_STRING, "IDL_CONST_STRING");
}

function check_booleans() {
  assertEquals(false, and_values(false, false), "and(false, false)")
  assertEquals(false, and_values(false, true), "and(false, true)")
  assertEquals(false, and_values(true, false), "and(true, false)")
  assertEquals(true, and_values(true, true), "and(true, true)")
}

function checkNumber() {
  // sum numbers
  let s = sum_numbers(2, 3)
  console.log(`sum: ${s}`)
  assertEquals(true, compareNumbers(s, 5), "2+3")

  s = sum_numbers(2.3, 3)
  console.log(`sum: ${s}`)
  assertEquals(true, compareNumbers(s, 5.3), "2.3+3")

  s = sum_numbers(2, 3.5)
  console.log(`sum: ${s}`)
  assertEquals(true, compareNumbers(s, 5.5), "2+3.5")

  s = sum_numbers(2.3, 3.5)
  console.log(`sum: ${s}`)
  assertEquals(true, compareNumbers(s, 5.8), "2.3+3.5")
}

function checkForceCallback() {

  const testListener: ForceCallbackListener = {
    onStatus: (status: number) => {
      console.log(`TestListener onStatus: ${status}`)
      assertEquals(123456, status, "ForceCallbackListener.onStatus()")
    },
    onChange: (flag: boolean, count: number) => {
      console.log("OnChange called!")
      assertEquals(true, flag, "flag")
      assertEquals(78910, count, "ForceCallbackListener.onStatus()")
      return "OnChange"
    },
  }

  const forceCallbackClass = new ForceCallbackClass()
  forceCallbackClass.registerListener(testListener)
  assertEquals(101, forceCallbackClass.callListener(), "forceCallbackClass.callListener()")

  registerForceCallbackListener(testListener)
  callForceCallbackListener()
}

function checkEnum() {

  // .d.ts
  console.log(OrdinaryEnum.E1.valueOf())
  console.log(OrdinaryEnum.E2.valueOf())
  console.log(IntEnum.E1.valueOf())
  console.log(IntEnum.E2.valueOf())
  console.log(StringEnum.E1.valueOf())
  console.log(StringEnum.E2.valueOf())

  // use Enum.VALUE.valueOf() as a workaround
  assertEquals(11, IntEnum.E1.valueOf(), "IntEnum.E1")
  assertEquals(22, IntEnum.E2.valueOf(), "IntEnum.E2")
  assertEquals("e11", StringEnum.E1.valueOf(), "StringEnum.E1")
  assertEquals("e22", StringEnum.E2.valueOf(), "StringEnum.E2.valueOf()")

  // assertEquals(OrdinaryEnum.E2, checkOrdinaryEnums(OrdinaryEnum.E1, OrdinaryEnum.E2), "OrdinaryEnum.E2")

  // .idl
  console.log(IDLOrdinaryEnum.E1.valueOf())
  console.log(IDLOrdinaryEnum.E2.valueOf())
  console.log(IDLIntEnum.E1.valueOf())
  console.log(IDLIntEnum.E2.valueOf())
  console.log(IDLStringEnum.E1.valueOf())
  console.log(IDLStringEnum.E2.valueOf())

  // use Enum.VALUE.valueOf() as a workaround
  assertEquals(111, IDLIntEnum.E1.valueOf(), "IDLIntEnum.E1")
  assertEquals(222, IDLIntEnum.E2.valueOf(), "IDLIntEnum.E2")
  assertEquals("e111", IDLStringEnum.E1.valueOf(), "IDLStringEnum.E1")
  assertEquals("e222", IDLStringEnum.E2.valueOf(), "IDLStringEnum.E2")

  // assertEquals(IDLOrdinaryEnum.E2, idlCheckOrdinaryEnums(IDLOrdinaryEnum.E1, IDLOrdinaryEnum.E2), "IDLOrdinaryEnum.E2")
}

function checkClassWithComplexPropertyType() {
  let value = new ClassWithComplexPropertyType()
  assertEquals(10, value.prop.counter, "checkClassWithComplexPropertyType.counter")
  assertEquals(true, value.prop.flag, "checkClassWithComplexPropertyType.flag")
}

function checkDataTestResult(msg: string, expected: DataInterface,
  actualBoolean: boolean, actualNumber: number, actualString: string, actualObject: [boolean, number, string])
{
  assertEquals(!expected.propBoolean, actualBoolean, msg)
  assertEquals(expected.propNumber + 1, actualNumber, msg)
  assertEquals(expected.propString.slice(1), actualString, msg)
  assertEquals(!expected.propObject[0], actualObject[0], msg)
  assertEquals(-expected.propObject[1], actualObject[1], msg)
  assertEquals(expected.propObject[2].slice(6), actualObject[2], msg)
}

function checkDataInterfaces() {
  const propBoolean = true
  const propNumber = 0xc0ffee
  const propString = "coffee"
  const propObject: [boolean, number, string] = [false, 55, "fifty five"]

  const dataIface: DataInterface = { propBoolean, propNumber, propString, propObject }
  const r1 = testDataInterface(dataIface)
  checkDataTestResult("interface", dataIface, r1.propBoolean, r1.propNumber, r1.propString, r1.propObject)

  const dataClass: DataClass = { propBoolean, propNumber, propString, propObject }
  const r2 = testDataClass(dataClass)
  checkDataTestResult("class", dataIface, r2.propBoolean, r2.propNumber, r2.propString, r2.propObject)

  const idlIface: IDLDataInterface = { propBoolean, propNumber, propString, propObject }
  const r3 = testIDLDataInterface(idlIface)
  checkDataTestResult("interface", dataIface, r3.propBoolean, r3.propNumber, r3.propString, r3.propObject)

  const idlClass: IDLDataClass = { propBoolean, propNumber, propString, propObject }
  const r4 = testIDLDataClass(idlClass)
  checkDataTestResult("class", dataIface, r4.propBoolean, r4.propNumber, r4.propString, r4.propObject)
}

export function run() {
  console.log("Run common unit tests")

  check_constants()
  check_booleans()
  checkNumber()
  checkForceCallback()
  checkEnum()
  checkClassWithComplexPropertyType()
  checkDataInterfaces()
}

