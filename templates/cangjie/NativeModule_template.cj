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

foreign {
    func TestPerfNumber(value: Int32): Int32

    // Node API
    func CreateNode(type_: Int32, id: Int32, flags: Int32): Int64
    func DisposeNode(ptr: Int64): Unit
    func DumpTreeNode(ptr: Int64): Unit
    func AddChild(ptr: Int64, node: Int64): Unit
    func RemoveChild(ptr: Int64, node: Int64): Unit
    func InsertChildAfter(ptr: Int64, node: Int64, sibling: Int64): Int32
    func InsertChildBefore(ptr: Int64, node: Int64, sibling: Int64): Int32
    func InsertChildAt(ptr: Int64, node: Int64, position: Int32): Int32
    func MeasureNode(ptr: Int64, data: CPointer<Float32>): Int32
    func LayoutNode(ptr: Int64, data: CPointer<Float32>): Int32
    func DrawNode(ptr: Int64, data: CPointer<Float32>): Int32
    func MeasureLayoutAndDraw(ptr: Int64): Unit
%GENERATED_NATIVE_FUNCTIONS%
}

public open class NativeModule {
    public static func _TestPerfNumber(arg1: Int32): Int32 {
        return unsafe{ TestPerfNumber(arg1) }
    }

%GENERATED_METHODS%

    // Node API
    public static func _CreateNode(type_: Int32, id: Int32, flags: Int32): Int64 {
        return unsafe{ CreateNode(type_, id, flags) }
    }
    public static func _DisposeNode(ptr: Int64): Unit {
        unsafe{ DisposeNode(ptr) }
    }
    public static func _DumpTreeNode(ptr: Int64): Unit {
        unsafe{ DumpTreeNode(ptr) }
    }
    public static func _AddChild(ptr: Int64, node: Int64): Unit {
        unsafe{ AddChild(ptr, node) }
    }
    public static func _RemoveChild(ptr: Int64, node: Int64): Unit {
        unsafe{ RemoveChild(ptr, node) }
    }
    public static func _InsertChildAfter(ptr: Int64, node: Int64, sibling: Int64): Int32 {
        return unsafe{ InsertChildAfter(ptr, node, sibling) }
    }
    public static func _InsertChildBefore(ptr: Int64, node: Int64, sibling: Int64): Int32 {
        return unsafe{ InsertChildBefore(ptr, node, sibling) }
    }
    public static func _InsertChildAt(ptr: Int64, node: Int64, position: Int32): Int32 {
        return unsafe{ InsertChildAt(ptr, node, position) }
    }
    public static func _MeasureNode(ptr: Int64, data: ArrayList<Float32>): Int32 {
        return unsafe{
            let handle_1 = acquireArrayRawData(data.toArray())
            let output = MeasureNode(ptr, handle_1.pointer)
            releaseArrayRawData(handle_1)
            return output
        }
    }
    public static func _LayoutNode(ptr: Int64, data: ArrayList<Float32>): Int32 {
        return unsafe{
            let handle_1 = acquireArrayRawData(data.toArray())
            let output = LayoutNode(ptr, handle_1.pointer)
            releaseArrayRawData(handle_1)
            return output
        }
    }
    public static func _DrawNode(ptr: Int64, data: ArrayList<Float32>): Int32 {
        unsafe {
            let handle_1 = acquireArrayRawData(data.toArray())
            let output = DrawNode(ptr, handle_1.pointer)
            releaseArrayRawData(handle_1)
            return output
        }
    }
    public static func _MeasureLayoutAndDraw(ptr: Int64): Unit {
        unsafe{ MeasureLayoutAndDraw(ptr) }
    }
}
