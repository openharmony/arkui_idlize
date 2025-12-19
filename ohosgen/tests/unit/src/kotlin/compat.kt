package ohosgen_unit

import kotlin.AssertionError
import kotlin.math.abs
import kotlin.system.exitProcess
import kotlin.test.assertContentEquals
import kotlin.test.assertEquals
import kotlin.test.assertNotEquals

import koalaui.interop.checkEvents
import koalaui.interop.NativeBuffer
import koalaui.interop.wrapSystemApiHandlerCallback
import unit.INTERNAL.registerUnitApiHandler

fun <T> checkEQ(expected: T, actual: T, comment: String? = null): Unit {
    assertEquals(expected, actual, comment)
}

fun <T> checkEQ(expected: Array<T>, actual: Array<T>, comment: String? = null): Unit {
    assertContentEquals(expected, actual, comment)
}

fun <T> assertEQ(expected: T, actual: T, comment: String? = null): Unit {
    assertEquals(expected, actual, comment)
}

fun assertDoubleEQ(expected: Float, actual: Float, absError: Float = 0.001f, comment: String? = null): Unit {
    assertEquals(expected, actual, absError, comment)
}

fun assertDoubleEQ(expected: Double, actual: Double, absError: Double = 0.001, comment: String? = null): Unit {
    assertEquals(expected, actual, absError, comment)
}

fun <T> checkNotEQ(expected: T, actual: T, comment: String? = null): Unit {
    assertNotEquals(expected, actual, comment)
}

fun compareNumbers(v1: Float, v2: Float): Boolean {
  return abs(v2 - v1) < 0.1f
}
fun compareNumbers(v1: Double, v2: Double): Boolean {
  return abs(v2 - v1) < 0.1
}

fun toBigInt(value: Long): Long {
    return value
}

fun checkReversedBuffer(buffer: NativeBuffer, reversedBuffer: NativeBuffer) {
    checkEQ(buffer.length, reversedBuffer.length, "ArrayBuffer sizes do not match")
    for (i in 0..<buffer.length) {
        checkEQ(buffer.readByte(i), reversedBuffer.readByte(buffer.length - i - 1))
    }
}

class Test(val name: String, val test: suspend () -> Unit) {}

class UnitTestsuite(val name: String) {

    private val tests = mutableListOf<Test>()

    fun addTest(testName: String, test: () -> Unit): Unit {
        tests.add(Test(testName, test))
    }

    fun addAsyncTest(testName: String, test: suspend () -> Unit): Unit {
        tests.add(Test(testName, test))
    }

    suspend fun run(): Unit {
        val failedTests = mutableListOf<String>()
        for (t in tests) {
            try {
                t.test()
                println("[ \u001b[32mPASSED\u001b[0m ] ${t.name}")
            }
            catch (e: AssertionError) {
                failedTests.add(t.name)
                println("[ \u001b[31mFAILED\u001b[0m ] ${t.name}")
                println("... ${e.message}")
            }
        }
        if (!failedTests.isEmpty()) {
            println("Tests failed!")
            exitProcess(1)
        }
    }
}

public fun init() {
    wrapSystemApiHandlerCallback()
    registerUnitApiHandler()
}

public fun pullEvents() {
    checkEvents()
}
