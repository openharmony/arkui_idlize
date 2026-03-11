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

import test_generic_callback.INTERNAL.registerTestGenericCallbackApiHandler
import foo.Foo

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestGenericCallbackApiHandler()
}

fun mainBody() {
    println("Starting demo: test_generic_callback")
    val cb = { x: Double ->
        println("Callback invoked From TS: x = $x")
    }
    val cbVoid = { x: Unit ->
        println("Void callback invoked From TS")
    }
    val foo = Foo()
    println("foo.getX() = ${foo.getX()}")

    foo.callCB(42.0, cb)
    foo.callCBVoid(cbVoid)
}

fun main() {
    init()
    mainBody()
    checkEvents()
}