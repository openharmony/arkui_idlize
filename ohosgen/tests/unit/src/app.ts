import { UnitTestsuite,  checkEQ, checkNotEQ, test_ret_B, test_return_types } from '#compat'

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
import { test_bigint } from '#compat'
import { test_materialized_classes, UtilityInterface } from '#compat'
import {
  ForceCallbackListener,
  ForceCallbackClass,
  registerForceCallbackListener,
  callForceCallbackListener,
  ClassWithComplexPropertyType,
  test_any,
  OHAny
} from '#compat'

// TBD: wait for the interface FQN fix for ArkTS
import { test_buffer } from '#compat'

import {
  OrdinaryEnum,
  IntEnum,
  DuplicateIntEnum,
  StringEnum,
  checkOrdinaryEnums,
  checkIntEnums,
  checkDuplicateIntEnums,
  checkStringEnums,
  IDLOrdinaryEnum,
  IDLIntEnum,
  IDLStringEnum,
  idlCheckOrdinaryEnums,
  idlCheckIntEnums,
  idlCheckStringEnums,
  testDataClass, testDataInterface, DataClass, DataInterface,
  testIDLDataClass, testIDLDataInterface, IDLDataClass, IDLDataInterface,
} from '#compat'
import { test_ret_A } from '#compat'

import { CheckExceptionClass, CheckExceptionInterface } from '#compat'

import {
  ContentModifier,
  WrappedBuilder,
  wrapBuilder,
  CommonConfiguration,
  CustomComponentConfiguration,
  CustomComponentShape,
  CustomComponentSample,
} from '#compat'

import {
  testLength
} from '#compat'

import {DTSHookClass, DTSHookValue, hook_ns} from "#compat"

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

function checkBigInt() {

  let b = test_bigint.test(123)
  assertEQ(`${Math.pow(2, 54)}`, `${b}`)
  b = test_bigint.test_negative(-123)
  assertEQ(`-${Math.pow(2, 54)}`, `${b}`)

  let param = test_bigint.test_params({ prime: 456 })
  assertEQ(`${Math.pow(2, 52)}`, `${param.prime}`)
  param = test_bigint.test_params_negative({ prime: -789 })
  assertEQ(`-${Math.pow(2, 42)}`, `${param.prime}`)
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
  console.log(OrdinaryEnum.E1)
  console.log(OrdinaryEnum.E2)
  console.log(IntEnum.E1)
  console.log(IntEnum.E3)
  console.log(StringEnum.E1)
  console.log(StringEnum.E2)

  // use Enum.VALUE.valueOf() as a workaround
  assertEQ(11, IntEnum.E1.valueOf())
  assertEQ(33, IntEnum.E3.valueOf())
  assertEQ(55, IntEnum.E5.valueOf())
  assertEQ("e11", StringEnum.E1.valueOf())
  assertEQ("e22", StringEnum.E2.valueOf())

  assertEQ(OrdinaryEnum.E3, checkOrdinaryEnums(OrdinaryEnum.E1, OrdinaryEnum.E2))
  assertEQ(IntEnum.E5, checkIntEnums(IntEnum.E1, IntEnum.E3))
  assertEQ(DuplicateIntEnum.THIRD, checkDuplicateIntEnums(DuplicateIntEnum.FIRST, DuplicateIntEnum.SECOND))
  assertEQ(DuplicateIntEnum.LEGACY_THIRD.valueOf(),
    checkDuplicateIntEnums(DuplicateIntEnum.LEGACY_FIRST, DuplicateIntEnum.LEGACY_SECOND).valueOf())
  assertEQ(StringEnum.E3, checkStringEnums(StringEnum.E1, StringEnum.E2))

  // .idl
  console.log(IDLOrdinaryEnum.E1)
  console.log(IDLOrdinaryEnum.E2)
  console.log(IDLIntEnum.E1)
  console.log(IDLIntEnum.E3)
  console.log(IDLStringEnum.E1)
  console.log(IDLStringEnum.E2)

  // use Enum.VALUE.valueOf() as a workaround
  assertEQ(111, IDLIntEnum.E1.valueOf())
  assertEQ(333, IDLIntEnum.E3.valueOf())
  assertEQ(555, IDLIntEnum.E5.valueOf())
  assertEQ("e111", IDLStringEnum.E1.valueOf())
  assertEQ("e222", IDLStringEnum.E2.valueOf())
  assertEQ("e333", IDLStringEnum.E3.valueOf())

  assertEQ(IDLOrdinaryEnum.E3, idlCheckOrdinaryEnums(IDLOrdinaryEnum.E1, IDLOrdinaryEnum.E2))
  assertEQ(IDLIntEnum.E5, idlCheckIntEnums(IDLIntEnum.E1, IDLIntEnum.E3))
  assertEQ(IDLStringEnum.E3, idlCheckStringEnums(IDLStringEnum.E1, IDLStringEnum.E2))
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

function checkLength() {
    let res = testLength(1, "length")
    assertEQ(true, res)
    res = testLength(1, 123)
    assertEQ(true, res)

    res = testLength(2, "")
    assertEQ(true, res)
    res = testLength(2, 456.789)
    assertEQ(true, res)
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

function checkStaticMaterialized() {
  test_materialized_classes.StaticMaterialized.method(123, "hello_message")
}

function checkMaterialized() {
  // 1. call overloaded methods
  const instance = new test_materialized_classes.MaterializedOverloadedMethods()
  instance.method1()
  instance.method1(true)
  instance.method1(false, "test_message")

  // 2. call MORE overloaded methods
  const instance2 = new test_materialized_classes.MaterializedMoreOverloadedMethods()
  instance2.method2()
  instance2.method2(321)
  instance2.method2(231, "test_message")

  // 3. check getters, setters
  const instance3 = new test_materialized_classes.MaterializedWithConstructorAndFields(12345, false)
  checkEQ(12345, instance3.valNumber)
  checkEQ(false, instance3.valBoolean)

  instance3.valNumber = 54321
  instance3.valBoolean = true
  checkEQ(54321, instance3.valNumber)
  checkEQ(true, instance3.valBoolean)

  // 4. create instance with static 'create' method
  const wrongInstance4 = new test_materialized_classes.MaterializedWithCreateMethod(/** todo: where is constructor params? */)
  const instance4 = test_materialized_classes.MaterializedWithCreateMethod.create(9876, false /** todo: params unused */)
  // assertEquals(9876, instance4.valNumber)
  // assertEquals(false, instance4.valBoolean)

  // 5. Pass struct as argument, receive struct as return value
  const instance5 = new test_materialized_classes.MaterializedComplexArguments(/** todo: where is constructor params? */)
  const utils: UtilityInterface = {
    fieldString: "test_message",
    fieldBoolean: true,
    fieldArrayNumber: new Array<number>(1, 2, 3, 4, 5)
  }

  const modifiedUtils: UtilityInterface = instance5.method3(utils)
  checkNotEQ(utils.fieldBoolean, modifiedUtils.fieldBoolean)
  checkEQ(utils.fieldBoolean, !modifiedUtils.fieldBoolean)
  checkNotEQ(utils.fieldString, modifiedUtils.fieldString)
  checkEQ(`${utils.fieldString}_modified`, modifiedUtils.fieldString)
  checkNotEQ(utils.fieldArrayNumber[0], modifiedUtils.fieldArrayNumber[0])
  checkEQ(utils.fieldArrayNumber[0], - modifiedUtils.fieldArrayNumber[0])

  // 6. Pass array as argument, receive array as return value
  const array = new Array<number>(10, 11, 12, 13, 14)
  const stringifyArray = instance5.method4(array)
  checkEQ(array[0].toString(), stringifyArray[0])
  checkEQ(array.join(","), stringifyArray.join(","))

  const utilsArray = new Array<UtilityInterface>()
  let hiUtils: UtilityInterface = {
    fieldString: "hi_message",
    fieldBoolean: true,
    fieldArrayNumber: new Array<number>(6, 7, 8, 9, 10)
  }
  let byeUtils: UtilityInterface = {
    fieldString: "bye_message",
    fieldBoolean: false,
    fieldArrayNumber: new Array<number>(5, 4, 3, 2, 1)
  }
  utilsArray.push(hiUtils)
  utilsArray.push(byeUtils)

  const modifiedUtilsArray = instance5.method5(utilsArray)
  checkEQ(`${utilsArray[0].fieldString}_modified`, modifiedUtilsArray[0].fieldString)
  checkEQ(`${utilsArray[1].fieldString}_modified`, modifiedUtilsArray[1].fieldString)
  checkEQ(utilsArray[0].fieldArrayNumber[0], - modifiedUtilsArray[0].fieldArrayNumber[0])
  checkEQ(utilsArray[1].fieldArrayNumber[0], - modifiedUtilsArray[1].fieldArrayNumber[0])
}

// TBD: fix native buffer for TS
// /*
function checkNativeBuffer() {
  const testValue: test_buffer.TestValue = test_buffer.getBuffer();
  checkEQ(123, testValue.errorCode, "Invalid value of errorCode")
  const buffer = testValue.outData;
  let text = "1234";
  checkEQ(text.length, buffer.length, "Invalid NativeBuffer length")
  for (let i = 0; i < text.length; i++) {
   checkEQ(text.charAt(i) + "", String.fromCharCode(buffer.readByte(i)), "Invalid NativeBuffer data")
  }
  text = "4321"
  for (let i = 0; i < text.length; i++) {
   buffer.writeByte(i, text.charCodeAt(i))
  }
  for (let i = 0; i < text.length; i++) {
    checkEQ(text.charAt(i) + "", String.fromCharCode(buffer.readByte(i)), "Invalid NativeBuffer data")
  }
}
// */

// function checkHandwritten() {
//   const dtsHW: HandwrittenComponent = { id: "hw", total: 0 }
//   const idlHW: IdlHandwrittenComponent = { name: "idl" + dtsHW.id, count: dtsHW.total + 1 }
//   assertEQ("idlhw", idlHW.name)
//   assertEQ(1, idlHW.count)
// }

function checkHooks() {

  const hookClass = new DTSHookClass()
  hookClass.method1({ count: 10 })
  hookClass.method2({ count: 20 })
  // hookClass.method3({ count: 30 })
}

interface TestObject { x: number }
function checkAny() {
  const obj: TestObject = { x: 10 }
  const param: test_any.WithAny = { field: obj, normal: 0 }
  test_any.test(param, (e:OHAny) => {
    console.log(e, e === obj)
  })
}

function checkReturnTypes() {
  test_return_types.returnNothing()
  assertEQ(42, test_return_types.returnNumber())
  assertEQ(true, test_return_types.returnBoolean())
  // FIXME: failed for arkts
  // assertEQ("text from native", test_return_types.returnString())
  const expectedA: test_ret_A = { field: 42 }
  assertEQ(expectedA.field, test_return_types.returnInterface().field)
  assertEQ(42, test_return_types.returnMaterialized().action())

  const numberArray = test_return_types.returnNumberArray()
  for (let i = 0; i < 10; ++i) {
    assertEQ(i, numberArray[i])
  }

  const stringArray = test_return_types.returnStringArray()
  for (let i = 0; i < 10; ++i) {
    assertEQ("123", stringArray[i])
  }

  const interfaceArray = test_return_types.returnInterfaceArray()
  for (let i = 0; i < 10; ++i) {
    assertEQ(i, interfaceArray[i].field)
  }

  const materializedArray = test_return_types.returnMaterializedArray()
  for (let i = 0; i < 10; ++i) {
    assertEQ(42 + i, materializedArray[i].action())
  }
}

function checkThrowException() {

  let catchException = false
  const checkExceptionClass = new CheckExceptionClass()

  try {
    checkExceptionClass.checkException()
  } catch (error) {
    let errObj = error as Error
    catchException = true
    console.log(`error: ${errObj.message}`)
    assertEQ("Exception from CheckExceptionClass", `${errObj.message}`)
  }

  assertEQ(true, catchException, "Exception has not been thrown!")

  catchException = false

  try {
    const checkExceptionInterface = checkExceptionClass.getInterface()
    checkExceptionInterface.checkException()
  } catch (error) {
    let errObj = error as Error
    catchException = true
    console.log(`error: ${errObj.message}`)
    assertEQ("Exception from CheckExceptionInterface", `${errObj.message}`)
  }

  assertEQ(true, catchException, "Exception has not been thrown!")
}

function buildCustomComponent(config: CommonConfiguration): void {
  const customConf = config as CustomComponentConfiguration
  console.log(`Build custom component`)
  console.log(`custom conf name: ${customConf.name}, selected: ${customConf.selected}`)
  // { shapeStyle: 111 }
}

class CustomComponentStyle implements ContentModifier {

  selectedColor: number = 0

  constructor(selectedColor: number) {
    this.selectedColor = selectedColor
  }

  applyContent(): WrappedBuilder {
    return wrapBuilder(buildCustomComponent)
  }
}

function checkContentModifier() {

  console.log(`Call checkContentModifier`)
  const customComponent = new CustomComponentSample()
  const customComponentStyle = new CustomComponentStyle(123)
  customComponent.contentModifier(customComponentStyle)
  // const result = customComponent.getContentModifier()
  // console.log(`result selectedColor: ${(result as CustomComponentStyle).selectedColor}`)

  // console.log(`customComponent: $${customComponent}`)
  // const res = customComponent.getSample("abc")
  // console.log(`after res`)
  // console.log(`res: ${res}`)
}

export function run() {
  console.log("Run common unit tests")

  const suite = new UnitTestsuite("idlize ut")

  suite.addTest("check_constants", check_constants)
  suite.addTest("check_booleans", check_booleans)
  suite.addTest("checkNumber", checkNumber)
  suite.addTest("checkBigInt", checkBigInt)
  suite.addTest("checkForceCallback", checkForceCallback)
  suite.addTest("checkEnum", checkEnum)
  suite.addTest("checkLength", checkLength)
  suite.addTest("checkClassWithComplexPropertyType", checkClassWithComplexPropertyType)
  suite.addTest("checkDataInterfaces", checkDataInterfaces)
  suite.addTest("checkStaticMaterialized", checkStaticMaterialized)
  suite.addTest("checkMaterialized", checkMaterialized)
  suite.addTest("checkAny", checkAny)
  suite.addTest("checkReturnTypes", checkReturnTypes)
  suite.addTest("checkNativeBuffer", checkNativeBuffer)
  suite.addTest("checkThrowException", checkThrowException)
  // suite.addTest("checkHandwritten", checkHandwritten)
  suite.addTest("checkHooks", checkHooks)
  suite.addTest("checkContentModifier", checkContentModifier)

  return suite.run()
}
