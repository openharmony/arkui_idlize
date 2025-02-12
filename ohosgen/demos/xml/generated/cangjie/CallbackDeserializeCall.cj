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

package idlize

import std.collection.*
import Interop.*

public func deserializeAndCallCallback_Boolean_Void(thisDeserializer: Deserializer): Unit {
    let _resourceId: Int32 = thisDeserializer.readInt32()
    let _call = match (ResourceHolder.instance().get(_resourceId) as ((value: Bool) -> Unit)) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var value: Bool = thisDeserializer.readBoolean()
    _call(value);
}
public type Callback_Boolean_Void = (value: Bool) -> Unit
public func deserializeAndCallCallback_EventType_ParseInfo_Boolean(thisDeserializer: Deserializer): Unit {
    let _resourceId: Int32 = thisDeserializer.readInt32()
    let _call = match (ResourceHolder.instance().get(_resourceId) as ((eventType: EventType, value: ParseInfo) -> Bool)) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var eventType: EventType = match (thisDeserializer.readInt32() as EventType) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var value: ParseInfo = match (thisDeserializer.readParseInfo() as ParseInfo) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var _continuation: ((value: Bool) -> Unit) = thisDeserializer.readXML_Callback_Boolean_Void(true)
    let _callResult = _call(eventType, value)
    _continuation(_callResult);
}
public type Callback_EventType_ParseInfo_Boolean = (eventType: EventType, value: ParseInfo) -> Bool
public func deserializeAndCallCallback_String_String_Boolean(thisDeserializer: Deserializer): Unit {
    let _resourceId: Int32 = thisDeserializer.readInt32()
    let _call = match (ResourceHolder.instance().get(_resourceId) as ((name: String, value: String) -> Bool)) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var name: String = match (thisDeserializer.readString() as String) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var value: String = match (thisDeserializer.readString() as String) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}
    var _continuation: ((value: Bool) -> Unit) = thisDeserializer.readXML_Callback_Boolean_Void(true)
    let _callResult = _call(name, value)
    _continuation(_callResult);
}
public type Callback_String_String_Boolean = (name: String, value: String) -> Bool
public func deserializeAndCallCallback(thisDeserializer: Deserializer): Unit {
    let kind: Int32 = thisDeserializer.readInt32()
    match (kind) {
        case 313269291/*CallbackKind.Kind_Callback_Boolean_Void*/ => return deserializeAndCallCallback_Boolean_Void(thisDeserializer);
        case 240036623/*CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean*/ => return deserializeAndCallCallback_EventType_ParseInfo_Boolean(thisDeserializer);
        case 923368928/*CallbackKind.Kind_Callback_String_String_Boolean*/ => return deserializeAndCallCallback_String_String_Boolean(thisDeserializer);
        case _ => throw Exception()
    }
    throw Exception("Unknown callback kind")
}

