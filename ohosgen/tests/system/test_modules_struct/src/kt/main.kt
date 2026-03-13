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
import koalaui.interop.wrapSystemApiHandlerCallback

import test_modules_struct.INTERNAL.registerTestModulesStructApiHandler
import foo.FooInt
import bar.BarInt
import baz.*

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestModulesStructApiHandler()
}

fun mainBody() {
    println("Starting demo: test_modules_struct")
    val foo = FooInt(42.0)
    run {
        val res = getIntWithFoo(foo)
        println("getNumberWithFoo(foo) = $res") // Expected: 42
    }
    val values = arrayOf(1.0, 2.25)
    for (v in values) {
        val res = foo.getInt(v)
        println("getNumber($v) = $res") // Expected: 43, 45.25
    }
    // The following line fails as well:
    // const bar: BarInt = { fooA: new FooInt(142), fooB: new FooInt(242) };
    val bar = BarInt()
    bar.fooA = FooInt(142.0)
    bar.fooB = FooInt(242.0)
    val resBar = getIntWithBar(bar)
    println("getIntWithBar(bar) = $resBar")
}

fun main() {
    init()
    mainBody()
    checkEvents()
}