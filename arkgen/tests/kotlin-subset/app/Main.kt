/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

@file:OptIn(ExperimentalForeignApi::class)

import kotlin.math.round
import kotlin.system.exitProcess
import kotlin.time.measureTimedValue
import kotlinx.cinterop.*

import koalaui.arkoala.*
import koalaui.interop.*

import arkui.component.button.ArkButtonPeer
import arkui.component.button.ButtonType
import arkui.component.units.Length

var hasTestErrors = false

fun checkResult(name: String, test: () -> Unit, expected: String) {
    NativeLog.startNativeLog(1)
    test()
    NativeLog.stopNativeLog(1)
    val actual = NativeLog.getNativeLog(1).replace(" \n", "")
    if (actual != expected) {
        println("TEST ${name} FAIL:\n  EXPECTED \"${expected}\"\n  ACTUAL   \"${actual}\"")
        hasTestErrors = true
    }
    else {
        println("TEST ${name} PASS")
    }
}

fun checkPerf3(count: Int): Unit {
    val peer = ArkButtonPeer.create(null)
    val length = Length.create0("10lpx")
    val (_, duration) = measureTimedValue {
        for (i in 0..<count) {
            peer.setWidthAttribute(length)
        }
    }
    val millis = duration.inWholeMilliseconds
    println("widthAttributeString: ${millis}ms for ${count} iteration, ${round(millis.toDouble() / count * 1_000_000)}ms per 1M iterations")
}

fun checkButton(): Unit {
    val peer = ArkButtonPeer.create(null)
    checkResult("type", { peer.setTypeAttribute(ButtonType.Circle) }, "setType(Ark_ButtonType(1))")
}

public fun main() {
    checkPerf3(5 * 1000 * 1000)
    checkButton()

    if (hasTestErrors) {
        println("Tests failed!")
        exitProcess(1)
    }
}
