/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

package synthetic_types

import global.resource.Resource

public open class Union_String_I32_I64_F64_Global_Resource_Resource {
    private var selector: Int
    public fun getSelector(): Int {
        return selector
    }
    private var value0: String? = null
    constructor(param: String) {
        value0 = param
        selector = 0
    }
    public fun getValue0(): String {
        return requireNotNull(value0)
    }
    private var value1: Int? = null
    constructor(param: Int) {
        value1 = param
        selector = 1
    }
    public fun getValue1(): Int {
        return requireNotNull(value1)
    }
    private var value2: Long? = null
    constructor(param: Long) {
        value2 = param
        selector = 2
    }
    public fun getValue2(): Long {
        return requireNotNull(value2)
    }
    private var value3: Double? = null
    constructor(param: Double) {
        value3 = param
        selector = 3
    }
    public fun getValue3(): Double {
        return requireNotNull(value3)
    }
    private var value4: Resource? = null
    constructor(param: Resource) {
        value4 = param
        selector = 4
    }
    public fun getValue4(): Resource {
        return requireNotNull(value4)
    }
}
