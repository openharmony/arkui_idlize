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

import test_package.INTERNAL.registerTestPackageApiHandler
import foo.FooObject
import bar.BarObject

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestPackageApiHandler()
}

fun testBar(prompt: String, bar: BarObject) {
    println("testBar(prompt=\"$prompt\")")
    bar.echo("Hello C++ from bar")
    println("bar.toInt32() = ${bar.toInt32()}")
}

fun mainBody() {
    println("Starting demo: test_package")
    val foo = FooObject()
    foo.echo("Hello C++ from foo")
    println("foo.toInt32() = ${foo.toInt32()}")

    val bar = BarObject()
    testBar("Initial", bar)
    bar.fooObj = FooObject()
    testBar("After assigning bar.fooObj to new value", bar)
}

fun main() {
    init()
    mainBody()
    checkEvents()
}