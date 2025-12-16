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

package handwritten

import kotlin.test.assertEquals

import test_hooks.HookClass
import test_hooks.HookValue
import test_hooks.HookInterface

import external.lib.ImportedHookValue

// HookInterface hooks
fun customHookInterfaceMethod(receiver: HookInterface) {
}

fun customHookInterfaceMethodArg(receiver: HookInterface, value: HookValue) {
    println("[managed] [1] call customHookInterfaceMethodArg(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(701.0, value.count, 1e-5)
}

fun hookHookInterfaceMethodReturn(receiver: HookInterface): HookValue {
    val value = object: HookValue { override var count = 702.0 }
    println("[managed] [2] call hookHookInterfaceMethodReturn(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(702.0, value.count, 1e-5)
    return value
}

fun hookHookInterfaceImportedArg(receiver: HookInterface, value: ImportedHookValue) {
    println("[managed] [3] call hookHookInterfaceImportedArg(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(703.0, value.count, 1e-5)
}

fun customHookInterfaceMethodImportedReturn(receiver: HookInterface): ImportedHookValue {
    val value = object: ImportedHookValue { override var count = 704.0 }
    println("[managed] [4] call customHookInterfaceMethodImportedReturn(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(704.0, value.count, 1e-5)
    return value
}

// HookClass hooks

fun customHookClassMethod(receiver: HookClass) {
    println("[managed] [0] call hook_HookClass_methodArg(receiver = ${receiver}")
}

fun customHookClassMethodArg(receiver: HookClass, value: HookValue) {
    println("[managed] [1] call hook_HookClass_methodArg(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(901.0, value.count, 1e-5)
}

fun hookHookClassMethodReturn(receiver: HookClass): HookValue {
    val value = object: HookValue { override var count = 902.0 }
    println("[managed] [2] call hook_HookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(902.0, value.count, 1e-5)
    return value
}

fun hookHookClassImportedArg(receiver: HookClass, value: ImportedHookValue) {
    println("[managed] [3] call hook_HookClass_methodImportedArg(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(903.0, value.count, 1e-5)
}

fun customHookClassMethodImportedReturn(receiver: HookClass): ImportedHookValue {
    val value = object: ImportedHookValue { override var count = 904.0 }
    println("[managed] [4] call hook_HookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})")
    assertEquals(904.0, value.count, 1e-5)
    return value
}
