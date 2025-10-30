import { PromiseTester, UnitTestsuite,  checkEQ, assertDoubleEQ, checkNotEQ, test_ret_B, test_return_types } from '#compat'

import {
  toBigInt
} from "#compat"

import {
  // .d.ts
  CONST_BOOLEAN_FALSE,
  CONST_BOOLEAN_TRUE,
  CONST_NUMBER_INT,
  CONST_NUMBER_FLOAT,
  CONST_STRING,
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
  checkStringEnumOrdinal,
  testDataClass, testDataInterface, DataClass, DataInterface,
} from '#compat'
import { test_ret_A } from '#compat'

import { CheckExceptionClass, CheckExceptionInterface } from '#compat'

import {
  testLength
} from '#compat'

import {
  UnionSampleEnum,
  checkUnionEnumSample,
  checkUnionArraySample,
  checkUnionNumberArraySample,
  checkUnionTupleArraySample,
} from '#compat'

import { IDLCheckConstructor } from '#compat'

import { InternalModuleDataInterface, RenamedModuleDataInterface, DTSCheckInternalLib } from "#compat"

import { ImportedHookValue } from "#compat"
import { DTSHookClass, DTSHookValue, DTSHookInterfaceInternal } from "#compat"

import { ExternalModuleDataInterface } from "@external.lib"

import { ExternalType, hookns } from "@external.lib"
import { SDKExternalType } from "@external.lib.sdk"
import { DTSCheckExternalLib, InternalType } from "#compat"

export function assertEQ<T1, T2>(value1: T1, value2: T2, comment?: string): void {
  checkEQ(value1, value2, comment)
}

function compareNumbers(v1: number, v2: number): boolean {
  return Math.abs(v2 - v1) < 0.1
}

function checkConstant() {
  // 1. Check dts const value
  // Fix boolean const type generation
  if (CONST_BOOLEAN_FALSE != false)
    throw new Error(`CONST_BOOLEAN_FALSE is not false!`)
  if (CONST_BOOLEAN_TRUE != true)
    throw new Error(`CONST_BOOLEAN_FALSE is not true!`)

  // 2. Check idl const values
  assertEQ(312, CONST_NUMBER_INT)
  assertEQ(312.415, CONST_NUMBER_FLOAT)
  assertEQ(false, CONST_BOOLEAN_FALSE)
  assertEQ(true, CONST_BOOLEAN_TRUE);
  assertEQ("hello_string", CONST_STRING);
}

function checkBoolean() {
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

  let b = test_bigint.test(toBigInt(123))
  assertEQ(`${Math.pow(2, 54)}`, `${b}`)
  b = test_bigint.test_negative(toBigInt(-123))
  assertEQ(`-${Math.pow(2, 54)}`, `${b}`)

  let param = test_bigint.test_params({ prime: toBigInt(456) })
  assertEQ(`${Math.pow(2, 52)}`, `${param.prime}`)
  param = test_bigint.test_params_negative({ prime: toBigInt(-789) })
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

  assertEQ(StringEnum.E1, checkStringEnumOrdinal(StringEnum.E1, 0))
  assertEQ(StringEnum.e1, checkStringEnumOrdinal(StringEnum.e1, 0))
  assertEQ(StringEnum.E2, checkStringEnumOrdinal(StringEnum.E2, 1))
  assertEQ(StringEnum.e2, checkStringEnumOrdinal(StringEnum.e2, 1))
  assertEQ(StringEnum.E_MIDDLE, checkStringEnumOrdinal(StringEnum.E_MIDDLE, 2))
  assertEQ(StringEnum.E3, checkStringEnumOrdinal(StringEnum.E3, 3))
  assertEQ(StringEnum.e3, checkStringEnumOrdinal(StringEnum.e3, 3))
}

function checkClassWithComplexPropertyType() {
  let value = new ClassWithComplexPropertyType()
  // TBD: implement constants for classes
  // "ClassWithComplexPropertyType.prop": "new ClassWithPrimitivePropertyType(true, 10)",
  assertEQ(9, value.prop.counter)
  assertEQ(true, value.prop.flag)
  value.prop.flag = true
  value.prop.counter = 10
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

function checkConstructors() {
  const c0 = new IDLCheckConstructor(372)
  assertEQ(372, c0.count)
  const c1 = new IDLCheckConstructor(true)
  assertEQ(true, c1.flag)
  const c2 = new IDLCheckConstructor(483, true)
  assertEQ(483, c2.count)
  assertEQ(true, c2.flag)
}

function checkDataInterfaces() {
  const valBoolean = true
  const valNumber = 0xc0ffee
  const valString = "coffee"
  const valObject: [boolean, number, string] = [false, 55, "fifty five"]

  const dataIface: DataInterface = { propBoolean: valBoolean, propNumber: valNumber, propString: valString, propObject: valObject }

  const r1 = testDataInterface(dataIface)
  checkDataTestResult("interface", dataIface, r1.propBoolean, r1.propNumber, r1.propString, r1.propObject)

  const dataClass = new DataClass()
  dataClass.propBoolean = valBoolean
  dataClass.propNumber = valNumber
  dataClass.propString = valString
  dataClass.propObject = valObject

  const r2 = testDataClass(dataClass)
  checkDataTestResult("class", dataIface, r2.propBoolean, r2.propNumber, r2.propString, r2.propObject)
}

function checkUnions() {

  // Enum union
  checkEQ(0, checkUnionEnumSample({prop: 0}).prop)
  checkEQ(1, checkUnionEnumSample({prop: 1}).prop)
  checkEQ(10, checkUnionEnumSample({prop: 10}).prop)
  checkEQ(11, checkUnionEnumSample({prop: 11}).prop)
  checkEQ(12, checkUnionEnumSample({prop: 12}).prop)
  checkEQ(UnionSampleEnum.A, checkUnionEnumSample({prop: UnionSampleEnum.A}).prop)
  checkEQ(UnionSampleEnum.B, checkUnionEnumSample({prop: UnionSampleEnum.B}).prop)
  checkEQ(UnionSampleEnum.C, checkUnionEnumSample({prop: UnionSampleEnum.C}).prop)
  checkEQ(UnionSampleEnum.D, checkUnionEnumSample({prop: UnionSampleEnum.D}).prop)

  // Array union
  checkEQ(false, checkUnionArraySample({prop: false}).prop)
  checkEQ(true, checkUnionArraySample({prop: true}).prop)
  checkEQ("abc", checkUnionArraySample({prop: "abc"}).prop)

  assertDoubleEQ(1.23, checkUnionArraySample({prop: 1.23}).prop as number)

  checkEQ(UnionSampleEnum.A, checkUnionArraySample({prop: UnionSampleEnum.A}).prop)
  checkEQ(UnionSampleEnum.B, checkUnionArraySample({prop: UnionSampleEnum.B}).prop)

  checkEQ([true, false], checkUnionArraySample({prop: [true, false]}).prop)
  checkEQ([UnionSampleEnum.A, UnionSampleEnum.B], checkUnionArraySample({prop: [UnionSampleEnum.A, UnionSampleEnum.B]}).prop)

  // Number Array union
  checkEQ(5, checkUnionNumberArraySample({ prop: 5 }).prop)
  checkEQ([1, 2, 3], checkUnionNumberArraySample({ prop: [1, 2, 3] }).prop)

  // Tuple Array union
  checkEQ(5, checkUnionTupleArraySample({ prop: 5 }).prop)
  checkEQ("five", checkUnionTupleArraySample({ prop: "five" }).prop)
  // TBD: Fix Tuple serialization for TS
  // const tuple: [number, string] = [7, "seven"]
  // checkEQ(tuple, checkUnionTupleArraySample({ prop: tuple }).prop)
  // const tuples: [number, string][] = [[8, "eight"], [9, "nine"]]
  // checkEQ(tuples, checkUnionTupleArraySample({ prop: tuples }).prop)
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

function _checkReversedBuffer(buffer: ArrayBuffer, reversedBuffer: ArrayBuffer) {
  checkEQ(buffer.byteLength, reversedBuffer.byteLength, "ArrayBuffer sizes do not match")
  const indexableA = new Uint8Array(buffer)
  const indexableB = new Uint8Array(reversedBuffer)
  for (let i = 0; i < indexableA.length; i++) {
    checkEQ(indexableA[i], indexableB[indexableB.length - i - 1])
  }
}

function checkNativeBuffer() {
  const buffer = test_buffer.create(10)
  const reversedBuffer = test_buffer.reverse(buffer)
  _checkReversedBuffer(buffer, reversedBuffer)
}

// function checkHandwritten() {
//   const dtsHW: HandwrittenComponent = { id: "hw", total: 0 }
//   const idlHW: IdlHandwrittenComponent = { name: "idl" + dtsHW.id, count: dtsHW.total + 1 }
//   assertEQ("idlhw", idlHW.name)
//   assertEQ(1, idlHW.count)
// }

function checkHooks() {
  const hookClass = new DTSHookClass()
  hookClass.method({ count: 900 })
  hookClass.methodArg({ count: 901 })
  const hookValue = hookClass.methodReturn()
  console.log(`  hook return value: ${hookValue.count}`)
  hookClass.methodImportedArg({ count: 903 })
  const importedHookValue = hookClass.methodImportedReturn()
  console.log(`  hook return value: ${importedHookValue.count}`)
  
  const hookInterface = new DTSHookInterfaceInternal()
  hookInterface.method({ count: 900 })
  hookInterface.methodArg({ count: 901 })
  const hookInterfaceValue = hookInterface.methodReturn()
  console.log(`  hook return value: ${hookInterfaceValue.count}`)
  hookInterface.methodImportedArg({ count: 903 })
  const importedHookInterfaceValue = hookInterface.methodImportedReturn()
  console.log(`  hook return value: ${importedHookInterfaceValue.count}`)
}

function checkInternalLib() {
  const check = new DTSCheckInternalLib()

  const internalDataInterface: InternalModuleDataInterface = { count: 31 }
  assertEQ(31, check.checkInternalDataInterface(internalDataInterface))

  const renamedModuleDataInterface: RenamedModuleDataInterface = { count: 32 }
  assertEQ(32, check.checkRenamedModuleDataInterface(renamedModuleDataInterface))
}

function checkExternalTypes() {

  const check = new DTSCheckExternalLib()
  const externalDataInterface: ExternalModuleDataInterface = { count: 32 }
  assertEQ(32, check.checkExternalDataInterface(externalDataInterface))

  const externalType: ExternalType = { nativePointer: toBigInt(3) }
  const nsExternalType: hookns.NSExternalType = { nsNativePointer: toBigInt(5) }
  const subnsExternalType: hookns.subhookns.SubNSExternalType = { subnsNativePointer: toBigInt(7) }
  // const internalType: InternalType = {
  //   index: 123,
  //   // TBD:
  //   // external: { nativePointer: toBigInt(9) }
  // }
  check.checkExternalType(externalType)
  check.checkNSExternalType(nsExternalType)
  check.checkSubNSExternalType(subnsExternalType)
  // check.checkInternalTypeWithExternalType(internalType)

  // const sdkExternalType: SDKExternalType = { sdkNativePointer: toBigInt(9) }
  // check.checkSDKExternalType(sdkExternalType)
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

function checkPromiseRejected() {
  PromiseTester.wait(200)
    .then(() => assertEQ(false, true, "Should not be called"))
    .catch((e:object) => { console.log(e.toString()) })
}

export function run() {
  console.log("Run common unit tests")

  const suite = new UnitTestsuite("idlize ut")

  suite.addTest("checkConstant", checkConstant)
  suite.addTest("checkBoolean", checkBoolean)
  suite.addTest("checkNumber", checkNumber)
  suite.addTest("checkBigInt", checkBigInt)
  suite.addTest("checkForceCallback", checkForceCallback)
  suite.addTest("checkEnum", checkEnum)
  suite.addTest("checkLength", checkLength)
  suite.addTest("checkConstructors", checkConstructors)
  suite.addTest("checkClassWithComplexPropertyType", checkClassWithComplexPropertyType)
  suite.addTest("checkDataInterfaces", checkDataInterfaces)
  suite.addTest("checkUnions", checkUnions)
  suite.addTest("checkStaticMaterialized", checkStaticMaterialized)
  suite.addTest("checkMaterialized", checkMaterialized)
  suite.addTest("checkAny", checkAny)
  suite.addTest("checkReturnTypes", checkReturnTypes)
  suite.addTest("checkNativeBuffer", checkNativeBuffer)
  suite.addTest("checkThrowException", checkThrowException)
  // suite.addTest("checkHandwritten", checkHandwritten)
  suite.addTest("checkHooks", checkHooks)
  suite.addTest("checkInternalLib", checkInternalLib)
  suite.addTest("checkExternalTypes", checkExternalTypes)
  suite.addTest("checkPromiseRejected", checkPromiseRejected)

  return suite.run()
}
