/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License")
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
    func StringMake(string: CString): Int64
    func StringLength(ptr: Int32): Int32
    func StringData(ptr: Int32, data: CPointer<UInt8>, arg2: Int32): Unit
    func GetStringFinalizer(): Int32
    func GetPtrVectorSize(ptr: Int32): Int32
    func GetGroupedLog(kind: Int32): Int32
    func GetPtrVectorElement(ptr: Int32, index: Int32): Int32
    func InvokeFinalizer(fn: Int32, obj: Int32): Unit
    func GetNodeFinalizer(): Int32
    func StartGroupedLog(index: Int32): Unit
    func StopGroupedLog(index: Int32): Unit
    func TestPerfNumber(value: Int32): Int32
    func TestPerfNumberWithArray(data: CPointer<UInt8>, length: Int32): Unit
    func StartPerf(traceName: CString): Unit
    func EndPerf(traceName: CString): Unit
    func DumpPerf(options: Int32): Int32
    func ManagedStringWrite(string: CString, buffer: CPointer<UInt8>, offset: Int32): Int32
    func SetEventsApi(): Unit
    func OnChildTouchTest(valueArray: CPointer<UInt8>, valueSerializerLength: Int32): Unit
    func OnScrollVisibleContentChange(valueArray: CPointer<UInt8>, valueSerializerLength: Int32): Unit
    func OnAccept(valueArray: CPointer<UInt8>, valueSerializerLength: Int32): Unit
    func TestCallIntNoArgs(arg: Int32): Int32
    func TestCallIntIntArraySum(arg1: Int32, arg2: CPointer<Int32>, arg3: Int32): Int32
    func TestCallVoidIntArrayPrefixSum(arg1: Int32, arg2: CPointer<Int32>, arg3: Int32): Unit
    func TestCallIntRecursiveCallback(arg1: Int32, arg2: CPointer<UInt8>, arg3: Int32): Int32
    func TestCallIntMemory(arg1: Int32, arg2: Int32): Int32

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

%GENERATED_METHODS%
    public static func _StringMake(string: String): Unit {
        return unsafe {
            let value = LibC.mallocCString(string)
            StringMake(value)
            LibC.free(value)
        }
    }
    public static func _StringLength(ptr: Int32): Int32 {
        return unsafe { StringLength(ptr) }
    }
    public static func _StringData(ptr: Int32, data: ArrayList<UInt8>, arg2: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(data.toArray())
            StringData(ptr, handle_1.pointer, arg2)
            releaseArrayRawData(handle_1)
        }
    }
    public static func _GetStringFinalizer(): Int32 {
        return unsafe { GetStringFinalizer() }
    }
    public static func _GetPtrVectorSize(ptr: Int32): Int32 {
        return unsafe { GetPtrVectorSize(ptr) } 
    }
    public static func _GetGroupedLog(kind: Int32): Int32 {
        return unsafe { GetGroupedLog(kind) }
    }
    public static func _GetPtrVectorElement(ptr: Int32, index: Int32): Int32 {
        return unsafe { GetPtrVectorElement(ptr, index) }
    }
    public static func _InvokeFinalizer(fn: Int32, obj: Int32): Unit {
        return unsafe { InvokeFinalizer(fn, obj) }
    }
    public static func _GetNodeFinalizer(): Int32 {
        return unsafe { GetNodeFinalizer() }
    }
    public static func _StartGroupedLog(index: Int32): Unit {
        return unsafe { StartGroupedLog(index) }
    }
    public static func _StopGroupedLog(index: Int32): Unit {
        return unsafe { StopGroupedLog(index) }
    }
    public static func _TestPerfNumber(value: Int32): Int32 {
        return unsafe{ TestPerfNumber(value) }
    }
    public static func _TestPerfNumberWithArray(data: ArrayList<UInt8>, length: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(data.toArray())
            TestPerfNumberWithArray(handle_1.pointer, length)
            releaseArrayRawData(handle_1)
        }
    }
    public static func _StartPerf(traceName: String): Unit {
        unsafe {
            let value = LibC.mallocCString(traceName)
            StartPerf(value)
            LibC.free(value)
        }
    }
    public static func _EndPerf(traceName: String): Unit {
        unsafe {
            let value = LibC.mallocCString(traceName)
            StartPerf(value)
            LibC.free(value)
        }
    }
    public static func _DumpPerf(options: Int32): Int32 {
        return unsafe {
            DumpPerf(options)
        }
    }
    public static func _ManagedStringWrite(string: String, buffer: ArrayList<UInt8>, offset: Int32): Int32 {
        unsafe {
            let handle_1 = acquireArrayRawData(buffer.toArray())
            let value = LibC.mallocCString(string)
            let output = ManagedStringWrite(value, handle_1.pointer, offset)
            releaseArrayRawData(handle_1)
            LibC.free(value)
            return output
        }
    }
    public static func _SetEventsApi(): Unit {
        unsafe { SetEventsApi() }
    }
    public static func _OnChildTouchTest(valueArray: ArrayList<UInt8>, valueSerializerLength: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(valueArray.toArray())
            OnChildTouchTest(handle_1.pointer, valueSerializerLength)
            releaseArrayRawData(handle_1)
        }
    }
    public static func _OnScrollVisibleContentChange(valueArray: ArrayList<UInt8>, valueSerializerLength: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(valueArray.toArray())
            OnChildTouchTest(handle_1.pointer, valueSerializerLength)
            releaseArrayRawData(handle_1)
        }
    }
    public static func _OnAccept(valueArray: ArrayList<UInt8>, valueSerializerLength: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(valueArray.toArray())
            OnChildTouchTest(handle_1.pointer, valueSerializerLength)
            releaseArrayRawData(handle_1)
        }
    }
    public static func _TestCallIntNoArgs(arg: Int32): Int32 {
        return unsafe {
            TestCallIntNoArgs(arg)
        }
    }
    public static func _TestCallIntIntArraySum(arg1: Int32, arg2: ArrayList<Int32>, arg3: Int32): Int32 {
        unsafe {
            let handle_1 = acquireArrayRawData(arg2.toArray())
            let output = TestCallIntIntArraySum(arg1, handle_1.pointer, arg3)
            releaseArrayRawData(handle_1)
            return output
        }
    }
    public static func _TestCallVoidIntArrayPrefixSum(arg1: Int32, arg2: ArrayList<Int32>, arg3: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(arg2.toArray())
            let output = TestCallVoidIntArrayPrefixSum(arg1, handle_1.pointer, arg3)
            releaseArrayRawData(handle_1)
            return output
        }
    }
    public static func _TestCallIntRecursiveCallback(arg1: Int32, arg2: ArrayList<UInt8>, arg3: Int32): Int32 {
        unsafe {
            let handle_1 = acquireArrayRawData(arg2.toArray())
            let output = TestCallIntRecursiveCallback(arg1, handle_1.pointer, arg3)
            releaseArrayRawData(handle_1)
            return output
        }
    }
    public static func _TestCallIntMemory(arg1: Int32, arg2: Int32): Int32 {
        return unsafe {
            TestCallIntMemory(arg1, arg2)
        }
        return 0
    }

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
