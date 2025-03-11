import { UnitTestsuite,  checkEQ } from '#compat'

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
import { test_buffer } from '#compat'

export function assertEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
  checkEQ(value1, value2, comment)
}

function compareNumbers(v1: number, v2: number): boolean {
  return Math.abs(v2 - v1) < 0.1
}

function check_constants() {
  // 1. Check dts const value
  // Fix boolean const type generation
  if (CONST_BOOLEAN_FALSE != false)
    throw new Error(`CONST_BOOLEAN_FALSE is not false!`)
  if (CONST_BOOLEAN_TRUE != true)
    throw new Error(`CONST_BOOLEAN_FALSE is not true!`)

  assertEQ(312, CONST_NUMBER_INT)


  if (CONST_NUMBER_FLOAT != 312.415) {
    throw new Error(`CONST_NUMBER_FLOAT is not 312.415!`)
  }

  // 2. Check idl const values
  assertEQ(312, IDL_CONST_NUMBER_INT)
  assertEQ(312.415, IDL_CONST_NUMBER_FLOAT)
  assertEQ(false, IDL_CONST_BOOLEAN_FALSE)
  assertEQ(true, IDL_CONST_BOOLEAN_TRUE);
  assertEQ("hello_string", IDL_CONST_STRING);
}

function check_booleans() {
  assertEQ(false, and_values(false, false))
  assertEQ(false, and_values(false, true))
  assertEQ(false, and_values(true, false))
  assertEQ(true, and_values(true, true))
}

function checkNumber() {
  // sum numbers
  let s = sum_numbers(2, 3)
  console.log(`sum: ${s}`)
  assertEQ(true, compareNumbers(s, 5))

  s = sum_numbers(2.3, 3)
  console.log(`sum: ${s}`)
  assertEQ(true, compareNumbers(s, 5.3))

  s = sum_numbers(2, 3.5)
  console.log(`sum: ${s}`)
  assertEQ(true, compareNumbers(s, 5.5))

  s = sum_numbers(2.3, 3.5)
  console.log(`sum: ${s}`)
  assertEQ(true, compareNumbers(s, 5.8))
}

function checkForceCallback() {

  const testListener: ForceCallbackListener = {
    onStatus: (status: number) => {
      console.log(`TestListener onStatus: ${status}`)
      assertEQ(123456, status)
    },
    onChange: (flag: boolean, count: number) => {
      console.log("OnChange called!")
      assertEQ(true, flag)
      assertEQ(78910, count)
      return "OnChange"
    },
  }

  const forceCallbackClass = new ForceCallbackClass()
  forceCallbackClass.registerListener(testListener)
  assertEQ(101, forceCallbackClass.callListener())

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
  assertEQ(11, IntEnum.E1.valueOf())
  assertEQ(22, IntEnum.E2.valueOf())
  assertEQ("e11", StringEnum.E1.valueOf())
  assertEQ("e22", StringEnum.E2.valueOf())

  // assertEQ(OrdinaryEnum.E2, checkOrdinaryEnums(OrdinaryEnum.E1, OrdinaryEnum.E2))

  // .idl
  console.log(IDLOrdinaryEnum.E1.valueOf())
  console.log(IDLOrdinaryEnum.E2.valueOf())
  console.log(IDLIntEnum.E1.valueOf())
  console.log(IDLIntEnum.E2.valueOf())
  console.log(IDLStringEnum.E1.valueOf())
  console.log(IDLStringEnum.E2.valueOf())

  // use Enum.VALUE.valueOf() as a workaround
  assertEQ(111, IDLIntEnum.E1.valueOf())
  assertEQ(222, IDLIntEnum.E2.valueOf())
  assertEQ("e111", IDLStringEnum.E1.valueOf())
  assertEQ("e222", IDLStringEnum.E2.valueOf())

  // assertEQ(IDLOrdinaryEnum.E2, idlCheckOrdinaryEnums(IDLOrdinaryEnum.E1, IDLOrdinaryEnum.E2))
}

function checkClassWithComplexPropertyType() {
  let value = new ClassWithComplexPropertyType()
  assertEQ(10, value.prop.counter)
  assertEQ(true, value.prop.flag)
}

function checkDataTestResult(msg: string, expected: DataInterface,
  actualBoolean: boolean, actualNumber: number, actualString: string, actualObject: [boolean, number, string])
{
  assertEQ(!expected.propBoolean, actualBoolean)
  assertEQ(expected.propNumber + 1, actualNumber)
  assertEQ(expected.propString.slice(1), actualString)
  assertEQ(!expected.propObject[0], actualObject[0])
  assertEQ(-expected.propObject[1], actualObject[1])
  assertEQ(expected.propObject[2].slice(6), actualObject[2])
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

  const suite = new UnitTestsuite("idlize ut")

	suite.addTest("check_constants", check_constants)
  suite.addTest("check_booleans", check_booleans)
  suite.addTest("checkNumber", checkNumber)
  suite.addTest("checkForceCallback", checkForceCallback)
  suite.addTest("checkEnum", checkEnum)
  suite.addTest("checkClassWithComplexPropertyType", checkClassWithComplexPropertyType)
  suite.addTest("checkDataInterfaces", checkDataInterfaces)

  return suite.run()
}

