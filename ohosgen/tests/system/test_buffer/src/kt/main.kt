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
import koalaui.interop.NativeBuffer
import koalaui.interop.wrapSystemApiHandlerCallback

import test_buffer.INTERNAL.registerTestBufferApiHandler
import test_buffer.Foo
import test_buffer.FooResult

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestBufferApiHandler()
}

fun mainBody() {
    println("Starting demo: test_buffer")
    val foo: Foo = Foo()

    val res: FooResult = foo.getResult()
    println("foo.getResult() done. Let res be the result:")
    println("  res.index = ${res.index}")
    println("  res.inData.length = ${res.inData?.length}")

    val buf: NativeBuffer? = foo.getInData()
    println("foo.getInData() done. Let buf be the result:")
    println("  buf.length = ${buf?.length}")
}

fun main() {
    init()
    mainBody()
    checkEvents()
}