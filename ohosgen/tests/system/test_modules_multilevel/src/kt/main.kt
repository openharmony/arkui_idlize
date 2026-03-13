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

import test_modules_multilevel.INTERNAL.registerTestModulesMultilevelApiHandler
import foo.FooInt
import bar.BarInt
import baz.BazInt
import qux.qux

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestModulesMultilevelApiHandler()
}

fun mainBody() {
    println("Starting demo: test_modules")
    println("======== Foo ========")
    val foo = FooInt(42.0)
    run {
        val res = qux.getIntWithFoo(foo)
        println("getIntWithFoo(foo) = $res") // Expected: 42
    }
    val values = arrayOf(2.25)
    for (v in values) {
        val res = foo.getInt(v)
        println("foo.getInt($v) = $res") // Expected: 44.25
    }
    println("======== Bar ========")
    val bar = BarInt(1000.0, 1500.0)
    run {
        val res = qux.getIntWithBar(bar, 17.0)
        println("getIntWithBar(bar) = $res") // Expected: 2517
    }
    for (v in values) {
        val res = bar.getInt(v)
        println("bar.getInt($v) = $res") // Expected: 2502.25
    }
    println("======== Baz ========")
    val baz = BazInt(2000.0, 2300.0, 2600.0)
    run {
        val res = qux.getIntWithBaz(baz, 34.0, "hello C++ from TS")
        println("getIntWithBaz(baz) = $res") // Expected: 6934
    }
    for (v in values) {
        val res = baz.getInt(v)
        println("baz.getInt($v) = $res") // Expected: 6902.25
    }
}

fun main() {
    init()
    mainBody()
    checkEvents()
}