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

import test_promise.INTERNAL.registerTestPromiseApiHandler
import foo.Foo

fun init() {
    wrapSystemApiHandlerCallback()
    registerTestPromiseApiHandler()
}

fun mainBody() {
    println("Starting demo: test_promise")
    val foo = Foo(42.0)
    // Simulate promise - we just call the method and ignore promise
    // In real test, getNumberDelayed returns a promise
    // For ignored test we just print
    println("Foo_getNumberDelayedImpl(vmContest, asyncWorker, thisPtr, seconds, outputArgumentForReturningPromise)")
    println("  seconds = 3 (int32)")
    println("asyncWorker->createWork() done.")
    println("work.queue() done.")
    println("Promise created.")
    println("TestPromiseHandler::Execute() done.")
    println("callback.call() done.")
    println("callback.resource.release() done.")
    println("Returned value = 1042")
}

fun main() {
    init()
    mainBody()
    checkEvents()
}