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

import test_record.INTERNAL.registerTestRecordApiHandler
import foo.Foo
import foo.FooResult

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestRecordApiHandler()
}

fun mainBody() {
    val foo: Foo = Foo()
    val props = foo.getProps()
    println("foo.getProps() done. Let props be the result:")
    for ((key, value) in props) {
        println("  props[\"$key\"] = $value")
    }

    val res = foo.getResult()
    println("foo.getResult() done with res.index = ${res.index}. Let res be the result:")
    for ((key, value) in res.props) {
        println("  res.props[\"$key\"] = $value")
    }
}

fun main() {
    init()
    mainBody()
    checkEvents()
}