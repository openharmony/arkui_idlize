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

import huks_with_class.INTERNAL.registerHuksWithClassApiHandler
import huks_with_class.HuksClass
import huks_with_class.HuksOptions

fun init() {
    wrapSystemApiHandlerCallback()
    registerHuksWithClassApiHandler()
}

class HuksOptionsImpl: HuksOptions {
    override var properties: Array<huks_with_class.HuksParam>? = null
    override var inData: NativeBuffer? = null
}

fun mainBody() {
    println("Starting demo: huks")
    val huks = HuksClass()
    huks.fooVoidVoid()
    huks.fooVoidNumber(100.0)
    println("huks.fooNumberVoid() = ${huks.fooNumberVoid()}")
    println("huks.fooNumberNumber(200) = ${huks.fooNumberNumber(200.0)}")

    println("---- Begin: huks.fooResultNumber(300) ----")
    huks.fooResultNumber(300.0)
    println("---- Begin: huks.fooNumberOptions({}) ----")
    huks.fooNumberOptions(HuksOptionsImpl())
    println("---- Begin: huks.generateKeyItemSync(\"ASDF\", {}) ----")
    HuksClass.generateKeyItemSync("ASDF", HuksOptionsImpl())

    println("All cases done.")
}

fun main() {
    init()
    mainBody()
    checkEvents()
}