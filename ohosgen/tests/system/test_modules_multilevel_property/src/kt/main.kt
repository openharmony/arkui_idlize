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

import test_modules_multilevel_property.INTERNAL.registerTestModulesMultilevelPropertyApiHandler
import foo.FooInt
import bar.BarInt
import baz.BazInt
import qux.*

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestModulesMultilevelPropertyApiHandler()
}

fun mainBody() {
    println("Starting demo: test_modules_multilevel_property")
    val bar = BarInt(1000.0, 1500.0)
    val baz = BazInt(2000.0, 2300.0, 2600.0)
    val v = 2.25
    run {
        bar.x = FooInt(10000.0)
        println("Set property bar.x done.")
        println("bar.getInt($v) after setting bar.x = ${bar.getInt(v)}") // Expected: 11502.25
        val barX = bar.x
        println("Get property bar.x done.")
        val resX = barX.getInt(v)
        println("bar.x.getInt($v) = $resX") // Expected: 10002.25
        val resY = bar.y.getInt(v)
        println("bar.y.getInt($v) = $resY") // Expected: 1502.25
    }
    run {
        val resFoo = baz.foo.getInt(v)
        println("baz.foo.getInt($v) = $resFoo") // Expected: 2002.25
        val resBar = baz.bar.getInt(v)
        println("baz.bar.getInt($v) = $resBar") // Expected: 4902.25
    }
    run {
        val resX = baz.bar.x.getInt(v)
        println("baz.bar.x.getInt($v) = $resX") // Expected: 2302.25
        val resY = baz.bar.y.getInt(v)
        println("baz.bar.y.getInt($v) = $resY") // Expected: 2602.25
    }
}

fun main() {
    init()
    mainBody()
    checkEvents()
}