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

    static func getRuntimeType(object: ?String): RuntimeType {
        if(let Some(object) <- object) {
            return RuntimeType.STRING
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }

    static func getRuntimeType(object: ?Float64): RuntimeType {
        if(let Some(object) <- object) {
            return RuntimeType.NUMBER
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }

    static func getRuntimeType(object: ?Float32): RuntimeType {
        if(let Some(object) <- object) {
            return RuntimeType.NUMBER
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }

    static func getRuntimeType(object: ?Int64): RuntimeType {
        if(let Some(object) <- object) {
            return RuntimeType.NUMBER
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }

    static func getRuntimeType(object: ?Int32): RuntimeType {
        if(let Some(object) <- object) {
            return RuntimeType.NUMBER
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }

    static func getRuntimeType(object: ?Bool): RuntimeType {
        if(let Some(object) <- object) {
            return RuntimeType.BOOLEAN
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }

    static func getRuntimeType<T>(object: T): RuntimeType where T <: Ark_Object {
        return object.runtimeType()
    }

    static func getRuntimeType<T>(object: ArrayList<T>): RuntimeType {
        return RuntimeType.OBJECT
    }

    static func getRuntimeType<T>(object: ?ArrayList<T>): RuntimeType {
        if(let Some(obj) <- object) {
            return Ark_Object.getRuntimeType(object as ArrayList<T>)
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }
    
    static func getRuntimeType<T>(object: ?T): RuntimeType where T <: Ark_Object {
        if(let Some(obj) <- object) {
            let object = match (object) {
                case Some(object) => object
                case _ => throw Exception("Failed to case child class of Ark_Object to Ark_Object")
            }
            return object.runtimeType()
        }
        else {
            return RuntimeType.UNDEFINED
        }
    }

    public open func runtimeType(): RuntimeType {
        throw Exception("Runtimetime type has to be called by chiled class of Ark_Object")
    }
}
