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

import std.collection.*
import std.reflect.*

public abstract class Ark_Object {
    static func getRuntimeType(object: String): RuntimeType {
        return RuntimeType.STRING
    }

    static func getRuntimeType(object: Object): RuntimeType {
        return RuntimeType.OBJECT
    }

    static func getRuntimeType<T>(object: ArrayList<T>): RuntimeType {
        return RuntimeType.OBJECT
    }
    
    static func getRuntimeType<T>(object: Option<T>): RuntimeType {
        if(object.isNone()) {
            return RuntimeType.UNDEFINED
        }
        else {
            throw Exception("Wrong overload of getRuntimeType() has been used for the type ${TypeInfo.of(object)}")
        }
    }
}
