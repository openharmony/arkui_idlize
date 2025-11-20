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

package koalaui.arkoala

import kotlinx.cinterop.*
import koalaui.interop.*

object NativeLog {
    private var _isStarted: Boolean = false

    fun startNativeLog(group: Int): Unit {
        _isStarted = true
        InteropNativeModule._StartGroupedLog(group)
    }

    fun stopNativeLog(group: Int): Unit {
        _isStarted = false
        InteropNativeModule._StopGroupedLog(group)
    }

    fun appendNativeLog(group: Int, message: String):  Unit {
        if (!_isStarted) {
            startNativeLog(group)
        }
        InteropNativeModule._AppendGroupedLog(group, message)
    }

    fun getNativeLog(group: Int): String {
        val ptr = InteropNativeModule._GetGroupedLog(group)
        val length = InteropNativeModule._StringLength(ptr)
        val data = KUint8ArrayPtr(length)
        InteropNativeModule._StringData(ptr, data, length)
        InteropNativeModule._InvokeFinalizer(ptr, InteropNativeModule._GetStringFinalizer())
        return data.asByteArray().toKString()
    }

    fun printNativeLog(group: Int): Unit {
        InteropNativeModule._PrintGroupedLog(group)
    }
}
