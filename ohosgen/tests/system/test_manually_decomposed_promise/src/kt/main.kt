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

import test_manually_decomposed_promise.INTERNAL.registerTestManuallyDecomposedPromiseApiHandler
import foo.FooWork
import foo.FooResult

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestManuallyDecomposedPromiseApiHandler()
}

fun asyncDemo(execIndex: Int, execLimit: Int) {
    println("---- Starting demo: test_promise_idl (execIndex = $execIndex, execLimit = $execLimit) ----")
    val work = FooWork()
    work.Create()
    // Simulate taskpool.execute - we just call Execute directly
    work.Execute(42.0, "Hello world")
    println("Inner Promise r created.")
    // Simulate r.then()
    println("r.then(): e = undefined")
    val result = work.Complete()
    if (result.state) {
        println("resolve() called in r.then()")
        // resolve(result.returnValue)
    } else {
        println("reject() called in r.then()")
        // reject(result.returnValue)
    }
    println("Outer Promise p created.")
    // Simulate p.then()
    if (result.state) {
        println("Outer promise p.then() returns ${result.returnValue}")
    } else {
        println("Output promise p.catch() returns ${result.returnValue}")
    }
    if (execIndex + 1 < execLimit) {
        asyncDemo(execIndex + 1, execLimit)
    }
}

fun asyncMainBody() {
    asyncDemo(0, 2)
}

fun main() {
    init()
    asyncMainBody()
    checkEvents()
    println("main() done.")
}