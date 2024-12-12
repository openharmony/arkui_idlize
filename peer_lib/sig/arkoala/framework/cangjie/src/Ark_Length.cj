/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
package idlize

public class Ark_Length <: Ark_ObjectBase {
    private var selector: Int32
    public func getSelector(): Int32 {
        return selector
    }
    private var value0: Option<Float32> = None<Float32>
    init(param: Float32) {
        value0 = param
        selector = 0
    }
    public func getValue0(): Float32 {
        if (let Some(value0) <- value0) {
            return value0
            } else { throw Exception("Wrong selector value inside Ark_Length") }
    }
    private var value1: Option<String> = None<String>
    init(param: String) {
        value1 = param
        selector = 1
    }
    public func getValue1(): String {
        if (let Some(value1) <- value1) {
            return value1
            } else { throw Exception("Wrong selector value inside Ark_Length") }
    }
    private var value2: Option<Resource> = None<Resource>
    init(param: Resource) {
        value2 = param
        selector = 2
    }
    public func getValue2(): Resource {
        if (let Some(value2) <- value2) {
            return value2
            } else { throw Exception("Wrong selector value inside Ark_Length") }
    }
}
