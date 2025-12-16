package ohosgen_unit

import kotlin.math.pow

import external.lib.*
import internal.lib.*
import renamed.lib.RenamedModuleDataInterface

import handwritten.TransformSrcCallbackC

import synthetic_types.*
import test_any.*
import test_bigint.*
import test_buffer.*
import test_boolean.*
import test_class_props_initial_values.*
import test_const.*
import test_constructor.*
import test_data_class.*
import test_enum.*
import test_exception.*
import test_external_types.*
import test_force_callback.*
import test_hooks.*
import test_inheritance.*
import test_internal_lib.*
import test_length.*
import test_materialized_classes.*
import test_multiple_instances.*
import test_number.*
import test_return_types.*
import test_transform.*
import test_union.*

fun checkConstant() {
    // 1. Check dts const value
    // Fix boolean const type generation
    if (CONST_BOOLEAN_FALSE != false) {
        error("CONST_BOOLEAN_FALSE is not false!")
    }
    if (CONST_BOOLEAN_TRUE != true) {
        error("CONST_BOOLEAN_TRUE is not true!")
    }

    // 2. Check idl const values
    assertEQ(312, CONST_NUMBER_INT)
    assertEQ(312.415, CONST_NUMBER_FLOAT)
    assertEQ(false, CONST_BOOLEAN_FALSE)
    assertEQ(true, CONST_BOOLEAN_TRUE)
    assertEQ("hello_string", CONST_STRING)
}

fun checkBoolean() {
    assertEQ(false, and_values(false, false))
    assertEQ(false, and_values(false, true))
    assertEQ(false, and_values(true, false))
    assertEQ(true, and_values(true, true))
}

fun checkNumber() {
    // sum numbers
    var s = sum_numbers(2.0, 3.0)
    println("sum: ${s}")
    assertEQ(true, compareNumbers(s, 5.0))

    s = sum_numbers(2.3, 3.0)
    println("sum: ${s}")
    assertEQ(true, compareNumbers(s, 5.3))

    s = sum_numbers(2.0, 3.5)
    println("sum: ${s}")
    assertEQ(true, compareNumbers(s, 5.5))

    s = sum_numbers(2.3, 3.5)
    println("sum: ${s}")
    assertEQ(true, compareNumbers(s, 5.8))
}

fun checkBigInt() {
    var b = test_bigint.test(toBigInt(123))
    assertEQ("${1L shl 54}", "${b}")
    b = test_bigint.test_negative(toBigInt(-123))
    assertEQ("-${1L shl 54}", "${b}")

    var param = test_bigint.test_params(object: test_bigint.BigIntParams { override var prime = toBigInt(456) })
    assertEQ("${1L shl 52}", "${param.prime}")
    param = test_bigint.test_params_negative(object: test_bigint.BigIntParams { override var prime = toBigInt(-789) })
    assertEQ("-${1L shl 42}", "${param.prime}")
}

fun checkForceCallback() {
    val testListener = object: ForceCallbackListener {
        override var onStatus = { status: Double ->
            println("TestListener onStatus: ${status}")
            assertEQ(123456.0, status)
        }
        override var onChange = { flag: Boolean, count: Double ->
            println("OnChange called!")
            assertEQ(true, flag)
            assertEQ(78910.0, count)
            "OnChange"
        }
    }

    val forceCallbackClass = ForceCallbackClass()
    forceCallbackClass.registerListener(testListener)
    assertEQ(101.0, forceCallbackClass.callListener())

    registerForceCallbackListener(testListener)
    callForceCallbackListener()

    pullEvents()
}

fun checkEnum() {
    assertEQ(11, IntEnum.E1.value)
    assertEQ(33, IntEnum.E3.value)
    assertEQ(55, IntEnum.E5.value)
    assertEQ("e11", StringEnum.E1.value)
    assertEQ("e22", StringEnum.E2.value)

    assertEQ(OrdinaryEnum.E3, checkOrdinaryEnums(OrdinaryEnum.E1, OrdinaryEnum.E2))
    assertEQ(IntEnum.E5, checkIntEnums(IntEnum.E1, IntEnum.E3))
    assertEQ(DuplicateIntEnum.THIRD, checkDuplicateIntEnums(DuplicateIntEnum.FIRST, DuplicateIntEnum.SECOND))
    assertEQ(DuplicateIntEnum.LEGACY_THIRD.value,
        checkDuplicateIntEnums(DuplicateIntEnum.LEGACY_FIRST, DuplicateIntEnum.LEGACY_SECOND).value)
    assertEQ(StringEnum.E3, checkStringEnums(StringEnum.E1, StringEnum.E2))

    assertEQ(StringEnum.E1, checkStringEnumOrdinal(StringEnum.E1, 0))
    assertEQ(StringEnum.e1, checkStringEnumOrdinal(StringEnum.e1, 0))
    assertEQ(StringEnum.E2, checkStringEnumOrdinal(StringEnum.E2, 1))
    assertEQ(StringEnum.e2, checkStringEnumOrdinal(StringEnum.e2, 1))
    assertEQ(StringEnum.E_MIDDLE, checkStringEnumOrdinal(StringEnum.E_MIDDLE, 2))
    assertEQ(StringEnum.E3, checkStringEnumOrdinal(StringEnum.E3, 3))
    assertEQ(StringEnum.e3, checkStringEnumOrdinal(StringEnum.e3, 3))
}

fun checkLength() {
    var res = testLength(1.0, Length("length"))
    assertEQ(true, res)
    res = testLength(1.0, Length(123.0))
    assertEQ(true, res)

    res = testLength(2.0, Length(""))
    assertEQ(true, res)
    res = testLength(2.0, Length(456.789))
    assertEQ(true, res)
}

fun checkConstructors() {
    val c0 = IDLCheckConstructor(372.0)
    assertEQ(372.0, c0.count)
    val c1 = IDLCheckConstructor(true)
    assertEQ(true, c1.flag)
    val c2 = IDLCheckConstructor(483.0, true)
    assertEQ(483.0, c2.count)
    assertEQ(true, c2.flag)
}

fun checkClassWithComplexPropertyType() {
    val value = ClassWithComplexPropertyType()
    // TBD: implement constants for classes
    // "ClassWithComplexPropertyType.prop": "ClassWithPrimitivePropertyType(true, 10)",
    assertEQ(9.0, value.prop.counter)
    assertEQ(true, value.prop.flag)
    value.prop.flag = true
    value.prop.counter = 10.0
    assertEQ(10.0, value.prop.counter)
    assertEQ(true, value.prop.flag)
}

fun checkDataTestResult(msg: String, expected: DataInterface, actualBoolean: Boolean,
    actualNumber: Double, actualString: String, actualObject: Tuple_Boolean_Number_String)
{
    assertEQ(!expected.propBoolean, actualBoolean)
    assertEQ(expected.propNumber + 1.0, actualNumber)
    assertEQ(expected.propString.substring(1), actualString)
    assertEQ(!expected.propObject.component1(), actualObject.component1())
    assertEQ(-expected.propObject.component2(), actualObject.component2())
    assertEQ(expected.propObject.component3().substring(6), actualObject.component3())
}

fun checkDataInterfaces() {
    val valBoolean = true
    val valNumber = 123.0 // 0xc0ffee
    val valString = "coffee"
    val valObject = Tuple_Boolean_Number_String(false, 55.0, "fifty five")

    val dataIface = object: DataInterface {
        override var propBoolean = valBoolean
        override var propNumber = valNumber
        override var propString = valString
        override var propObject = valObject
    }

    val r1 = testDataInterface(dataIface)
    checkDataTestResult("interface", dataIface, r1.propBoolean, r1.propNumber, r1.propString, r1.propObject)

    val dataClass = DataClass()
    dataClass.propBoolean = valBoolean
    dataClass.propNumber = valNumber
    dataClass.propString = valString
    dataClass.propObject = valObject

    val r2 = testDataClass(dataClass)
    checkDataTestResult("class", dataIface, r2.propBoolean, r2.propNumber, r2.propString, r2.propObject)
}

typealias Union01 = Union_Number_Test_union_UnionSampleEnum
typealias Union02 = Union_Boolean_Number_String_Test_union_UnionSampleEnum_Array_Boolean_Array_Test_union_UnionSampleEnum
typealias Union03 = Union_Number_Array_Number
typealias Union04 = Union_Number_String_Synthetic_UnionSampleTupleNumberString_Array_Synthetic_UnionSampleTupleNumberString
typealias Union05 = Union_Number_String_Test_union_SingleGenericType_Number_Test_union_SingleGenericType_String_Test_union_DoubleGenericType_Boolean_Number_Test_union_DoubleGenericType_Number_String

fun checkUnions() {
    // Enum 
    checkEQ(0.0, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(0.0) }).prop.getValue0())
    checkEQ(1.0, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(1.0) }).prop.getValue0())
    checkEQ(10.0, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(10.0) }).prop.getValue0())
    checkEQ(11.0, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(11.0) }).prop.getValue0())
    checkEQ(12.0, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(12.0) }).prop.getValue0())
    checkEQ(UnionSampleEnum.A, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(UnionSampleEnum.A)}).prop.getValue1())
    checkEQ(UnionSampleEnum.B, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(UnionSampleEnum.B)}).prop.getValue1())
    checkEQ(UnionSampleEnum.C, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(UnionSampleEnum.C)}).prop.getValue1())
    checkEQ(UnionSampleEnum.D, checkUnionEnumSample(object: UnionSampleEnumInterface {
        override var prop = Union01(UnionSampleEnum.D)}).prop.getValue1())

    // Array union
    checkEQ(false, checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02(false) }).prop.getValue0())
    checkEQ(true, checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02(true) }).prop.getValue0())
    checkEQ("abc", checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02("abc") }).prop.getValue2())

    assertDoubleEQ(1.23, checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02(1.23) }).prop.getValue1())

    checkEQ(UnionSampleEnum.A, checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02(UnionSampleEnum.A) }).prop.getValue3())
    checkEQ(UnionSampleEnum.B, checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02(UnionSampleEnum.B) }).prop.getValue3())

    checkEQ(arrayOf(true, false), checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02(arrayOf(true, false)) }).prop.getValue4())
    checkEQ(arrayOf(UnionSampleEnum.A, UnionSampleEnum.B), checkUnionArraySample(object: UnionSampleArrayInterface {
        override var prop = Union02(arrayOf(UnionSampleEnum.A, UnionSampleEnum.B)) }).prop.getValue5())

    // Number Array union
    checkEQ(5.0, checkUnionNumberArraySample(object: UnionSampleNumberArrayInterface {
        override var prop = Union03(5.0) }).prop.getValue0())
    checkEQ(arrayOf(1.0, 2.0, 3.0), checkUnionNumberArraySample(object: UnionSampleNumberArrayInterface {
        override var prop = Union03(arrayOf(1.0, 2.0, 3.0)) }).prop.getValue1())

    // Tuple Array union
    checkEQ(5.0, checkUnionTupleArraySample(object: UnionSampleTupleArrayInterface {
        override var prop = Union04(5.0) }).prop.getValue0())
    checkEQ("five", checkUnionTupleArraySample(object: UnionSampleTupleArrayInterface {
        override var prop = Union04("five") }).prop.getValue1())
    val tuple = UnionSampleTupleNumberString(7.0, "seven")
    checkEQ(tuple, checkUnionTupleArraySample(object: UnionSampleTupleArrayInterface {
        override var prop = Union04(tuple) }).prop.getValue2())
    val tuples = arrayOf(UnionSampleTupleNumberString(8.0, "eight"), UnionSampleTupleNumberString(9.0, "nine"))
    checkEQ(tuples, checkUnionTupleArraySample(object: UnionSampleTupleArrayInterface {
        override var prop = Union04(tuples) }).prop.getValue3())

    // GenericType union
    checkEQ(7.0, checkUnionGenericTypeSample(object: UnionSampleGenericTypeInterface {
        override var prop = Union05(7.0) }).prop.getValue0())
    checkEQ("seven", checkUnionGenericTypeSample(object: UnionSampleGenericTypeInterface {
        override var prop = Union05("seven") }).prop.getValue1())

    val valueNumber: SingleGenericType<Double> = object: SingleGenericType<Double> { override var value = 9.0 }
    val resultNumber = checkUnionGenericTypeSample(object: UnionSampleGenericTypeInterface {
        override var prop = Union05(valueNumber) }).prop.getValue2()
    checkEQ(9.0, resultNumber.value)

    val valueString: SingleGenericType<String> = object: SingleGenericType<String> { override var value = "nine" }
    val resultString = checkUnionGenericTypeSample(object: UnionSampleGenericTypeInterface {
        override var prop = Union05(valueString) }).prop.getValue3()
    checkEQ("nine", resultString.value)

    val valueBooleanNumber: DoubleGenericType<Boolean, Double> = object: DoubleGenericType<Boolean, Double> {
        override var valueT = true; override var valueS = 11.0 }
    val resultBooleanNumber = checkUnionGenericTypeSample(object: UnionSampleGenericTypeInterface {
        override var prop = Union05(valueBooleanNumber) }).prop.getValue4()
    checkEQ(true, resultBooleanNumber.valueT)
    checkEQ(11.0, resultBooleanNumber.valueS)

    val valueNumberString: DoubleGenericType<Double, String> = object: DoubleGenericType<Double, String> {
        override var valueT = 33.0; override var valueS = "thirty three" }
    val resultNumberString = checkUnionGenericTypeSample(object: UnionSampleGenericTypeInterface {
        override var prop = Union05(valueNumberString) }).prop.getValue5()
    checkEQ(33.0, resultNumberString.valueT)
    checkEQ("thirty three", resultNumberString.valueS)
}

fun checkStaticMaterialized() {
    test_materialized_classes.StaticMaterialized.method(123.0, "hello_message")
}

fun checkMaterialized() {
    // 1. call overloaded methods
    val instance = test_materialized_classes.MaterializedOverloadedMethods()
    instance.method1()
    instance.method1(true)
    instance.method1(false, "test_message")

    // 2. call MORE overloaded methods
    val instance2 = test_materialized_classes.MaterializedMoreOverloadedMethods()
    instance2.method2()
    instance2.method2(321.0)
    instance2.method2(231.0, "test_message")

    // 3. check getters, setters
    val instance3 = test_materialized_classes.MaterializedWithConstructorAndFields(12345.0, false)
    checkEQ(12345.0, instance3.valNumber)
    checkEQ(false, instance3.valBoolean)

    instance3.valNumber = 54321.0
    instance3.valBoolean = true
    checkEQ(54321.0, instance3.valNumber)
    checkEQ(true, instance3.valBoolean)

    // 4. create instance with static 'create' method
    val wrongInstance4 = test_materialized_classes.MaterializedWithCreateMethod(/** todo: where is constructor params? */)
    val instance4 = test_materialized_classes.MaterializedWithCreateMethod.create(9876.0, false /** todo: params unused */)
    // assertEquals(9876, instance4.valNumber)
    // assertEquals(false, instance4.valBoolean)

    // 5. Pass struct as argument, receive struct as return value
    val instance5 = test_materialized_classes.MaterializedComplexArguments(/** todo: where is constructor params? */)
    val utils = object: UtilityInterface {
        override var fieldString = "test_message"
        override var fieldBoolean = true
        override var fieldArrayNumber = arrayOf(1.0, 2.0, 3.0, 4.0, 5.0)
    }

    val modifiedUtils: UtilityInterface = instance5.method3(utils)
    checkNotEQ(utils.fieldBoolean, modifiedUtils.fieldBoolean)
    checkEQ(utils.fieldBoolean, !modifiedUtils.fieldBoolean)
    checkNotEQ(utils.fieldString, modifiedUtils.fieldString)
    checkEQ("${utils.fieldString}_modified", modifiedUtils.fieldString)
    checkNotEQ(utils.fieldArrayNumber[0], modifiedUtils.fieldArrayNumber[0])
    checkEQ(utils.fieldArrayNumber[0], - modifiedUtils.fieldArrayNumber[0])

    // 6. Pass array as argument, receive array as return value
    val array = arrayOf(10.0, 11.0, 12.0, 13.0, 14.0)
    val intArray = arrayOf(10, 11, 12, 13, 14) // remove when number type is gone
    val stringifyArray = instance5.method4(array)
    checkEQ(intArray[0].toString(), stringifyArray[0])
    checkEQ(intArray.joinToString(","), stringifyArray.joinToString(","))

    val hiUtils = object: UtilityInterface {
        override var fieldString = "hi_message"
        override var fieldBoolean = true
        override var fieldArrayNumber = arrayOf(6.0, 7.0, 8.0, 9.0, 10.0)
    }
    val byeUtils = object: UtilityInterface {
        override var fieldString = "bye_message"
        override var fieldBoolean = false
        override var fieldArrayNumber = arrayOf(5.0, 4.0, 3.0, 2.0, 1.0)
    }
    val utilsArray = arrayOf(hiUtils, byeUtils)

    val modifiedUtilsArray = instance5.method5(utilsArray)
    checkEQ("${utilsArray[0].fieldString}_modified", modifiedUtilsArray[0].fieldString)
    checkEQ("${utilsArray[1].fieldString}_modified", modifiedUtilsArray[1].fieldString)
    checkEQ(utilsArray[0].fieldArrayNumber[0], -modifiedUtilsArray[0].fieldArrayNumber[0])
    checkEQ(utilsArray[1].fieldArrayNumber[0], -modifiedUtilsArray[1].fieldArrayNumber[0])
}

interface TestObject { var x: Int }
fun checkAny() {
    val obj = object: TestObject { override var x = 10 }
    val param = object: test_any.WithAny {
        override var field = obj as Any
        override var normal = 0.0
    }
    test_any.test(param, { e ->
        println("$e, ${e === obj}")
    })
    pullEvents()
}

fun checkReturnTypes() {
    test_return_types.returnNothing()
    assertEQ(42.0, test_return_types.returnNumber())
    assertEQ(true, test_return_types.returnBoolean())
    assertEQ("text from native", test_return_types.returnString())
    val expectedA = object: test_ret_A { override var field = 42.0 }
    assertEQ(expectedA.field, test_return_types.returnInterface().field)
    assertEQ(42.0, test_return_types.returnMaterialized().action())

    val numberArray = test_return_types.returnNumberArray()
    for (i in 0..<10) {
        assertEQ(i.toDouble(), numberArray[i])
    }

    val stringArray = test_return_types.returnStringArray()
    for (i in 0..<10) {
        assertEQ("123", stringArray[i])
    }

    val interfaceArray = test_return_types.returnInterfaceArray()
    for (i in 0..<10) {
        assertEQ(i.toDouble(), interfaceArray[i].field)
    }

    val materializedArray = test_return_types.returnMaterializedArray()
    for (i in 0..<10) {
        assertEQ(42.0 + i, materializedArray[i].action())
    }
}

fun checkNativeBuffer() {
    val buffer = test_buffer.create(10U)
    val reversedBuffer = test_buffer.reverse(buffer)
    checkReversedBuffer(buffer, reversedBuffer)
}

fun checkThrowException() {
    var catchException = false
    val checkExceptionClass = CheckExceptionClass()

    try {
        checkExceptionClass.checkException()
    }
    catch (error: Throwable) {
        val errObj = error as Exception
        catchException = true
        println("error: ${errObj.message}")
        assertEQ("Exception from CheckExceptionClass", "${errObj.message}")
    }
    assertEQ(true, catchException, "Exception has not been thrown!")

    catchException = false
    try {
        val checkExceptionInterface = checkExceptionClass.getInterface()
        checkExceptionInterface.checkException()
    }
    catch (error: Throwable) {
        val errObj = error as Exception
        catchException = true
        println("error: ${errObj.message}")
        assertEQ("Exception from CheckExceptionInterface", "${errObj.message}")
    }
    assertEQ(true, catchException, "Exception has not been thrown!")

//   Promises are not supported
//   catchException = false
//   try {
//     await checkExceptionClass.getPromiseInterface()
//   } catch (error) {
//     let errObj = error as Error
//     catchException = true
//     console.log(`promise error: ${errObj.message}`)
//     assertEQ("(Test passed) Promise for @throw annotated method was rejected", `${errObj.message}`)
//   }
//   assertEQ(true, catchException, "Exception has not been thrown!")

    catchException = false
    try {
        checkExceptionClass.getThis()
    }
    catch (error: Throwable) {
        val errObj = error as Exception
        catchException = true
        println("promise error: ${errObj.message}")
        assertEQ("(Test passed) Promise for @throw annotated method with `this` return type was rejected", "${errObj.message}")
    }
    assertEQ(true, catchException, "Exception has not been thrown!")

    val checkCallbackExceptions = CheckCallbackExceptions()
    assertEQ(true, checkCallbackExceptions.checkThrowableCallbackI32({
        throw Exception("Test exception")
    }), "Exception for ThrowableCallbackI32 was not thrown")
    assertEQ(true, checkCallbackExceptions.checkThrowableCallbackI32_withParameter({ value: Int ->
        if (value == 1) {
            throw Exception("Test exception")
        }
        println("expected to have value 1 in parameter, got ${value}")
        0
    }), "Exception for ThrowableCallbackI32_withParameter was not thrown")
    assertEQ(true, checkCallbackExceptions.checkThrowableCallbackVoid({
        throw Exception("Test exception")
    }), "Exception for ThrowableCallbackVoid was not thrown")

    catchException = false
    try {
        checkCallbackExceptions.checkRethrow({
            throw Exception("Exception thrown from callback and rethrown with method")
        })
    } catch (error: Exception) {
        val errObj = error
        catchException = true
        println("promise error: ${errObj.message}")
        assertEQ("Exception thrown from callback and rethrown with method", "${errObj.message}")
    }
    assertEQ(true, catchException, "Exception has not been thrown!")

    catchException = false
    try {
        val lambda = checkCallbackExceptions.checkThrowFromNative()
        lambda()
    } catch (error: Exception) {
        val errObj = error
        catchException = true
        println("promise error: ${errObj.message}")
        assertEQ("Exception thrown from callback created in native CheckCallbackExceptions_checkThrowFromNative", "${errObj.message}")
    }
    assertEQ(true, catchException, "Exception has not been thrown!")
}

// fun checkHandwritten() {
//     val dtsHW = object: HandwrittenComponent {
//         override var id = "hw"
//         override var total = 0.0
//     }
//     val idlHW = object: IdlHandwrittenComponent {
//         override var name = "idl" + dtsHW.id
//         override var count = dtsHW.total + 1
//     }
//     assertEQ("idlhw", idlHW.name)
//     assertEQ(1, idlHW.count)
// }

fun checkHooks() {
    val hookInterface = getHookInterface()
    hookInterface.method()
    hookInterface.methodArg(object: HookValue { override var count = 701.0 })
    val hookValue1 = hookInterface.methodReturn()
    checkEQ(702.0, hookValue1.count)
    hookInterface.methodImportedArg(object: ImportedHookValue { override var count = 703.0 })
    val importedHookValue1 = hookInterface.methodImportedReturn()
    checkEQ(704.0, importedHookValue1.count)

    val hookClass = HookClass()
    hookClass.method()
    hookClass.methodArg(object: HookValue { override var count = 901.0 })
    val hookValue = hookClass.methodReturn()
    checkEQ(902.0, hookValue.count)
    hookClass.methodImportedArg(object: ImportedHookValue { override var count = 903.0 })
    val importedHookValue = hookClass.methodImportedReturn()
    checkEQ(904.0, importedHookValue.count)
}

fun checkInternalLib() {
    val check = DTSCheckInternalLib()

    val internalDataInterface = object: InternalModuleDataInterface { override var count = 31.0 }
    assertEQ(31.0, check.checkInternalDataInterface(internalDataInterface))

    val renamedModuleDataInterface = object: RenamedModuleDataInterface { override var count = 32.0 }
    assertEQ(32.0, check.checkRenamedModuleDataInterface(renamedModuleDataInterface))
}

fun checkExternalTypes() {
    val check = DTSCheckExternalLib()
    val externalDataInterface = object: ExternalModuleDataInterface { override var count = 32.0 }
    assertEQ(32.0, check.checkExternalDataInterface(externalDataInterface))

    val externalType = object: ExternalType { override var nativePointer = toBigInt(3) }
    val nsExternalType = object: hookns.NSExternalType { override var nsNativePointer = toBigInt(5) }
    val subnsExternalType = object: hookns.subhookns.SubNSExternalType { override var subnsNativePointer = toBigInt(7) }
    // val internalType: InternalType = {
    //   index: 123,
    //   // TBD:
    //   // external: { nativePointer: toBigInt(9) }
    // }
    check.checkExternalType(externalType)
    check.checkNSExternalType(nsExternalType)
    check.checkSubNSExternalType(subnsExternalType)
    // check.checkInternalTypeWithExternalType(internalType)

    // val sdkExternalType: SDKExternalType = { sdkNativePointer: toBigInt(9) }
    // check.checkSDKExternalType(sdkExternalType)
}

// Promises are not supported
// fun checkPromiseRejected() {
//   return PromiseTester.wait(200)
//     .then(() => assertEQ(false, true, "Should not be called"))
//     .catch((e:object): void => { console.log(e.toString()) })
// }

fun checkHandwrittenDeserializer() {
  val gesture = BaseGesture.createGesture2()
  assertEQ(gesture.getType(), GestureType.Second)
  assertEQ(gesture is DerivedGesture2, true)
}

fun checkTransformOnSerialize() {
    var transformSrcI: TransformSrcI = object: TransformSrcI { override var flag = false }
    var resultTransformSrcI: TransformSrcI = checkTransformDstI(transformSrcI, false)
    assertEQ(false, resultTransformSrcI.flag)

    transformSrcI = object: TransformSrcI { override var flag = true }
    resultTransformSrcI = checkTransformDstI(transformSrcI, true)
    assertEQ(true, resultTransformSrcI.flag)

    var transformSrcC: TransformSrcC = TransformSrcC()
    transformSrcC.flag = false
    var resultTransformSrcC: TransformSrcC = checkTransformDstC(transformSrcC, false)
    assertEQ(false, resultTransformSrcC.flag)

    transformSrcC.flag = true
    resultTransformSrcC = checkTransformDstC(transformSrcC, true)
    assertEQ(true, resultTransformSrcC.flag)

    var transformSrcCallbackI: TransformSrcCallbackI = object: TransformSrcCallbackI { override var flag = false }
    var resultTransformSrcCallbackI: TransformSrcCallbackI = checkTransformSrcIToCallback(transformSrcCallbackI, false)
    assertEQ(true, resultTransformSrcCallbackI.flag)

    transformSrcCallbackI = object: TransformSrcCallbackI { override var flag = true }
    resultTransformSrcCallbackI = checkTransformSrcIToCallback(transformSrcCallbackI, true)
    assertEQ(false, resultTransformSrcCallbackI.flag)

    var transformSrcCallbackC: TransformSrcCallbackC = TransformSrcCallbackC()
    transformSrcCallbackC.flag = false
    var resultTransformSrcCallbackC: TransformSrcCallbackC = checkTransformSrcCToCallback(transformSrcCallbackC, false)
    assertEQ(true, resultTransformSrcCallbackC.flag)

    transformSrcCallbackC.flag = true
    resultTransformSrcCallbackC = checkTransformSrcCToCallback(transformSrcCallbackC, true)
    assertEQ(false, resultTransformSrcCallbackC.flag)
}

fun checkMultipleInstances() {
    // getSomeClassInstance returns the same object every time
    // check that destructing of local wrappers does not destroy
    // native object while global wrapper exists.
    // Local wrappers destruction is not guaranteed here since
    // GC is not called directly
    val obj = getSomeClassInstance()
    assertEQ(obj.getValue(), 5.0)
    for (i in 0..<10) {
        val localObj = getSomeClassInstance()
        assertEQ(localObj.getValue(), 5.0)
    }
    assertEQ(obj.getValue(), 5.0)
}

fun run(): Unit {
    println("Run common unit tests")

    val suite = UnitTestsuite("idlize ut")

    suite.addTest("checkConstant", ::checkConstant)
    suite.addTest("checkBoolean", ::checkBoolean)
    suite.addTest("checkNumber", ::checkNumber)
    suite.addTest("checkBigInt", ::checkBigInt)
    suite.addTest("checkForceCallback", ::checkForceCallback)
    suite.addTest("checkEnum", ::checkEnum)
    suite.addTest("checkLength", ::checkLength)
    suite.addTest("checkConstructors", ::checkConstructors)
    suite.addTest("checkClassWithComplexPropertyType", ::checkClassWithComplexPropertyType)
    suite.addTest("checkDataInterfaces", ::checkDataInterfaces)
    suite.addTest("checkUnions", ::checkUnions)
    suite.addTest("checkStaticMaterialized", ::checkStaticMaterialized)
    suite.addTest("checkMaterialized", ::checkMaterialized)
    suite.addTest("checkAny", ::checkAny)
    suite.addTest("checkReturnTypes", ::checkReturnTypes)
    suite.addTest("checkNativeBuffer", ::checkNativeBuffer)
    suite.addAsyncTest("checkThrowException", ::checkThrowException)
    // suite.addTest("checkHandwritten", ::checkHandwritten)
    suite.addTest("checkHooks", ::checkHooks)
    suite.addTest("checkInternalLib", ::checkInternalLib)
    suite.addTest("checkExternalTypes", ::checkExternalTypes)
    // suite.addAsyncTest("checkPromiseRejected", ::checkPromiseRejected)
    suite.addTest("checkHandwrittenDeserializer", ::checkHandwrittenDeserializer)
    suite.addTest("checkTransformOnSerialize", ::checkTransformOnSerialize)
    suite.addTest("checkMultipleInstances", ::checkMultipleInstances)

    suite.run()
}
