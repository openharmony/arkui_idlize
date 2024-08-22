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
    func _TestPerfNumber(value: Int32): Int32

    // Node API
    func _CreateNode(type_: Int32, id: Int32, flags: Int32): Int64
    func _DisposeNode(ptr: Int64): Unit
    func _DumpTreeNode(ptr: Int64): Unit
    func _AddChild(ptr: Int64, node: Int64): Unit
    func _RemoveChild(ptr: Int64, node: Int64): Unit
    func _InsertChildAfter(ptr: Int64, node: Int64, sibling: Int64): Int32
    func _InsertChildBefore(ptr: Int64, node: Int64, sibling: Int64): Int32
    func _InsertChildAt(ptr: Int64, node: Int64, position: Int32): Int32
    // func _MeasureNode(ptr: Int64, data: ArrayList<Float32>): Int32
    // func _LayoutNode(ptr: Int64, data: ArrayList<Float32>): Int32
    // func _DrawNode(ptr: Int64, data: ArrayList<Float32>): Int32
    func _MeasureLayoutAndDraw(ptr: Int64): Unit
}

public open class NativeModule {
    public static func TestPerfNumber(arg1: Int32): Int32 {
        return unsafe{_TestPerfNumber(arg1)}
    }
    public static func hello(): String {
        return "hello"
    }

    // Node API
    public static func _CreateNode(type_: Int32, id: Int32, flags: Int32): Int64 {
        return unsafe{_CreateNode(type_, id, flags)}
    }
    public static func _DisposeNode(ptr: Int64): Unit {
        unsafe{_DisposeNode(ptr)}
    }
    public static func _DumpTreeNode(ptr: Int64): Unit {
        unsafe{_DumpTreeNode(ptr)}
    }
    public static func _AddChild(ptr: Int64, node: Int64): Unit {
        unsafe{_AddChild(ptr, node)}
    }
    public static func _RemoveChild(ptr: Int64, node: Int64): Unit {
        unsafe{_RemoveChild(ptr, node)}
    }
    public static func _InsertChildAfter(ptr: Int64, node: Int64, sibling: Int64): Int32 {
        return unsafe{_InsertChildAfter(ptr, node, sibling)}
    }
    public static func _InsertChildBefore(ptr: Int64, node: Int64, sibling: Int64): Int32 {
        return unsafe{_InsertChildBefore(ptr, node, sibling)}
    }
    public static func _InsertChildAt(ptr: Int64, node: Int64, position: Int32): Int32 {
        return unsafe{_InsertChildAt(ptr, node, position)}
    }
    public static func _MeasureNode(ptr: Int64, data: ArrayList<Float32>): Int32 {
        return unsafe{_MeasureNode(ptr, data)}
    }
    public static func _LayoutNode(ptr: Int64, data: ArrayList<Float32>): Int32 {
        return unsafe{_LayoutNode(ptr, data)}
    }
    public static func _DrawNode(ptr: Int64, data: ArrayList<Float32>): Int32 {
        return unsafe{_DrawNode(ptr, data)}
    }
    public static func _MeasureLayoutAndDraw(ptr: Int64): Unit {
        unsafe{_MeasureLayoutAndDraw(ptr)}
    }
}
