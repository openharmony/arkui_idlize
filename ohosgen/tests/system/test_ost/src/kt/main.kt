/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import koalaui.interop.checkEvents
import koalaui.interop.NativeBuffer
import koalaui.interop.wrapSystemApiHandlerCallback

import test_ost.INTERNAL.registerTestOstApiHandler
import buffers.Buffers
import callbacks.Callbacks
import fqnMain.*
import fqnDeps.*

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestOstApiHandler()
}

fun testBuffers() {
    println("==== Buffers")
    val test = Buffers()

    val res = test.getResult()
    println("Buffers.getResult():")
    println("  .index = ${res.index}")
    println("  .inData.length = ${res.data?.byteLength}")

    val buf = test.getData()
    println("foo.getData():")
    println("  .length = ${buf?.byteLength}")
}

fun testCallbacks() {
    println("==== Callbacks")
    val test = Callbacks()
    println("foo.getX() = ${test.getX()}")

    test.callNumber(42.0,
        { n -> println("Callback invoked with arg $n") })
    test.callVoid(
        { println("Void callback invoked") })
    checkEvents()
}

fun testFqn() {
    println("==== FQN")
    iresize(
        object : fqnDeps.IntSize {
            override var intWidth: Double = 21.0
            override var intHeight: Double = 11.0
        }
    )
    fp.resize(
        object : fqnDeps.FloatSize {
            override var floatWidth: Double = 0.26
            override var floatHeight: Double = 0.23
        }
    )
    resize(
        object : fqnMain.NumSize {
            override var numWidth: Double = 6.0
            override var numHeight: Double = 3.0
        }
    )
    resizeAll(object : fqnMain.AllSizes {
        override var numSize: fqnMain.NumSize = object : fqnMain.NumSize {
            override var numWidth: Double = 4.0
            override var numHeight: Double = 8.0
        }
        override var intSize: fqnDeps.IntSize = object : fqnDeps.IntSize {
            override var intWidth: Double = 14.0
            override var intHeight: Double = 18.0
        }
        override var floatSize: fqnDeps.FloatSize = object : fqnDeps.FloatSize {
            override var floatWidth: Double = 24.0
            override var floatHeight: Double = 28.0
        }
    })
    resize3(
        object : fqnMain.NumSize {
            override var numWidth: Double = 6.0
            override var numHeight: Double = 3.0
        },
        object : fqnDeps.IntSize {
            override var intWidth: Double = 16.0
            override var intHeight: Double = 13.0
        },
        object : fqnDeps.FloatSize {
            override var floatWidth: Double = 0.26
            override var floatHeight: Double = 0.23
        }
    )
}

fun main() {
    println("Starting demo: test_ost")
    init()
    testBuffers()
    testCallbacks()
    testFqn()
}