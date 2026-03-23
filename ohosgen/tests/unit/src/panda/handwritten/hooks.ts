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

import { HookClass, HookValue, HookInterface } from "#compat"
import { ImportedHookValue } from "@external.lib"

// HookInterface hooks
export function customHookInterfaceMethod(receiver: HookInterface) {
}

export function customHookInterfaceMethodArg(receiver: HookInterface, value: HookValue) {
    console.log(`[managed] [1] call customHookInterfaceMethodArg(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(701, value.count)
}

export function hookHookInterfaceMethodReturn(receiver: HookInterface): HookValue {
    const value: HookValue = { count: 702 }
    console.log(`[managed] [2] call hookHookInterfaceMethodReturn(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(702, value.count)
    return value
}

export function hookHookInterfaceImportedArg(receiver: HookInterface, value: ImportedHookValue) {
    console.log(`[managed] [3] call hookHookInterfaceImportedArg(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(703, value.count)
}

export function customHookInterfaceMethodImportedReturn(receiver: HookInterface): ImportedHookValue {
    const value: ImportedHookValue = { count: 704 }
    console.log(`[managed] [4] call customHookInterfaceMethodImportedReturn(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(704, value.count)
    return value
}

// HookClass hooks

export function customHookClassMethod(receiver: HookClass) {
    console.log(`[managed] [0] call hook_HookClass_methodArg(receiver = ${receiver}`)
}

export function customHookClassMethodArg(receiver: HookClass, value: HookValue) {
    console.log(`[managed] [1] call hook_HookClass_methodArg(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(901, value.count)
}

export function hookHookClassMethodReturn(receiver: HookClass): HookValue {
    const value: HookValue = { count: 902 }
    console.log(`[managed] [2] call hook_HookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(902, value.count)
    return value
}

export function hookHookClassImportedArg(receiver: HookClass, value: ImportedHookValue) {
    console.log(`[managed] [3] call hook_HookClass_methodImportedArg(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(903, value.count)
}

export function customHookClassMethodImportedReturn(receiver: HookClass): ImportedHookValue {
    const value: ImportedHookValue = { count: 904 }
    console.log(`[managed] [4] call hook_HookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    arktest.assertEQ(904, value.count)
    return value
}
