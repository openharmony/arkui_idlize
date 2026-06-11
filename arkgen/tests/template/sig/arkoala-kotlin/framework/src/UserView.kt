/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
package koalaui.arkoala

typealias UserViewBuilder = () -> ComponentBase

interface UserApplicationControl {
    fun params(): String
    fun startLog(): UserApplicationControl
    fun getLog(): String
    fun stopLog(): UserApplicationControl
    fun emitTask(type: Int, target: String, arg0: Int?, arg1: Int?): UserApplicationControl
    //fun nextFrame(): Promise<UserApplicationControl>
    fun reloadView(): UserApplicationControl
    fun requestStopApp(crash: String?): Unit
}

open class UserView {
    protected var control: UserApplicationControl? = null
    final fun provideControl(control: UserApplicationControl): Unit {
        this.control = control
    }
    open fun getBuilder(): UserViewBuilder {
        error("User must override this method");
    }
}