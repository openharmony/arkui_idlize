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
    func StringData(ptr: KPointer, data: CPointer<UInt8>, arg2: Int32): Unit

%GENERATED_NATIVE_FUNCTIONS%
}

public open class NativeModule {

%GENERATED_METHODS%
    
// interop
%GENERATED_PREDEFINED_Interop%
// loader
%GENERATED_PREDEFINED_Loader%
// node
%GENERATED_PREDEFINED_Node%
// test
%GENERATED_PREDEFINED_Test%

    public static func _StringData(ptr: Int64, data: ArrayList<UInt8>, arg2: Int32): ArrayList<UInt8> {
        unsafe {
            let handle_1 = acquireArrayRawData(data.toArray())
            StringData(ptr, handle_1.pointer, arg2)
            let outputData = ArrayList<UInt8>(handle_1.array)
            releaseArrayRawData(handle_1)
            return outputData
        }
    }

    // public static func _SetEventsApi(): Unit {
    //     unsafe { SetEventsApi() }
    // }
    // public static func _OnChildTouchTest(valueArray: ArrayList<UInt8>, valueSerializerLength: Int32): Unit {
    //     unsafe {
    //         let handle_1 = acquireArrayRawData(valueArray.toArray())
    //         OnChildTouchTest(handle_1.pointer, valueSerializerLength)
    //         releaseArrayRawData(handle_1)
    //     }
    // }
    // public static func _OnScrollVisibleContentChange(valueArray: ArrayList<UInt8>, valueSerializerLength: Int32): Unit {
    //     unsafe {
    //         let handle_1 = acquireArrayRawData(valueArray.toArray())
    //         OnChildTouchTest(handle_1.pointer, valueSerializerLength)
    //         releaseArrayRawData(handle_1)
    //     }
    // }
    // public static func _OnAccept(valueArray: ArrayList<UInt8>, valueSerializerLength: Int32): Unit {
    //     unsafe {
    //         let handle_1 = acquireArrayRawData(valueArray.toArray())
    //         OnChildTouchTest(handle_1.pointer, valueSerializerLength)
    //         releaseArrayRawData(handle_1)
    //     }
    // }
    // public static func _TestCallIntNoArgs(arg: Int32): Int32 {
    //     return unsafe {
    //         TestCallIntNoArgs(arg)
    //     }
    // }
    // public static func _TestCallIntIntArraySum(arg1: Int32, arg2: ArrayList<Int32>, arg3: Int32): Int32 {
    //     unsafe {
    //         let handle_1 = acquireArrayRawData(arg2.toArray())
    //         let output = TestCallIntIntArraySum(arg1, handle_1.pointer, arg3)
    //         releaseArrayRawData(handle_1)
    //         return output
    //     }
    // }
    // public static func _TestCallVoidIntArrayPrefixSum(arg1: Int32, arg2: ArrayList<Int32>, arg3: Int32): Unit {
    //     unsafe {
    //         let handle_1 = acquireArrayRawData(arg2.toArray())
    //         let output = TestCallVoidIntArrayPrefixSum(arg1, handle_1.pointer, arg3)
    //         releaseArrayRawData(handle_1)
    //         return output
    //     }
    // }
    // public static func _TestCallIntRecursiveCallback(arg1: Int32, arg2: ArrayList<UInt8>, arg3: Int32): Int32 {
    //     unsafe {
    //         let handle_1 = acquireArrayRawData(arg2.toArray())
    //         let output = TestCallIntRecursiveCallback(arg1, handle_1.pointer, arg3)
    //         releaseArrayRawData(handle_1)
    //         return output
    //     }
    // }
    // public static func _TestCallIntMemory(arg1: Int32, arg2: Int32): Int32 {
    //     return unsafe {
    //         TestCallIntMemory(arg1, arg2)
    //     }
    //     return 0
    // }

}
