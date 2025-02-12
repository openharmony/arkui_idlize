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

foreign {
        func XmlSerializer_ctor(thisArray: CPointer<UInt8>, thisLength: Int32): UInt64
        func XmlSerializer_getFinalizer(): UInt64
        func XmlSerializer_setAttributes(ptr: KPointer, name: CString, value: CString): Unit
        func XmlSerializer_addEmptyElement(ptr: KPointer, name: CString): Unit
        func XmlSerializer_setDeclaration(ptr: KPointer): Unit
        func XmlSerializer_startElement(ptr: KPointer, name: CString): Unit
        func XmlSerializer_endElement(ptr: KPointer): Unit
        func XmlSerializer_setNamespace(ptr: KPointer, prefix: CString, namespace: CString): Unit
        func XmlSerializer_setComment(ptr: KPointer, text: CString): Unit
        func XmlSerializer_setCDATA(ptr: KPointer, text: CString): Unit
        func XmlSerializer_setText(ptr: KPointer, text: CString): Unit
        func XmlSerializer_setDocType(ptr: KPointer, text: CString): Unit
        func ParseInfo_ctor(): UInt64
        func ParseInfo_getFinalizer(): UInt64
        func ParseInfo_getColumnNumber(ptr: KPointer): Float64
        func ParseInfo_getDepth(ptr: KPointer): Float64
        func ParseInfo_getLineNumber(ptr: KPointer): Float64
        func ParseInfo_getName(ptr: KPointer): CString
        func ParseInfo_getNamespace(ptr: KPointer): CString
        func ParseInfo_getPrefix(ptr: KPointer): CString
        func ParseInfo_getText(ptr: KPointer): CString
        func ParseInfo_isEmptyElementTag(ptr: KPointer): Bool
        func ParseInfo_isWhitespace(ptr: KPointer): Bool
        func ParseInfo_getAttributeCount(ptr: KPointer): Float64
        func XmlPullParser_ctor(thisArray: CPointer<UInt8>, thisLength: Int32): UInt64
        func XmlPullParser_getFinalizer(): UInt64
        func XmlPullParser_parse(ptr: KPointer, thisArray: CPointer<UInt8>, thisLength: Int32): Unit
        func XmlPullParser_parseXml(ptr: KPointer, thisArray: CPointer<UInt8>, thisLength: Int32): Unit
}

public open class XMLNativeModule {
    public static func _XmlSerializer_ctor(thisArray: ArrayList<UInt8>, thisLength: Int32): UInt64 {
        unsafe {
            let handle_0 = acquireArrayRawData(thisArray.toArray())
            let result = XmlSerializer_ctor(handle_0.pointer, thisLength)
            releaseArrayRawData(handle_0)
            return result
        }
    }
    public static func _XmlSerializer_getFinalizer(): UInt64 {
        unsafe {
            let result = XmlSerializer_getFinalizer()
            return result
        }
    }
    public static func _XmlSerializer_setAttributes(ptr: KPointer, name: KStringPtr, value: KStringPtr): Unit {
        unsafe {
            let name =  LibC.mallocCString(name)
            let value =  LibC.mallocCString(value)
            XmlSerializer_setAttributes(ptr, name, value)
            LibC.free(name)
            LibC.free(value)
        }
    }
    public static func _XmlSerializer_addEmptyElement(ptr: KPointer, name: KStringPtr): Unit {
        unsafe {
            let name =  LibC.mallocCString(name)
            XmlSerializer_addEmptyElement(ptr, name)
            LibC.free(name)
        }
    }
    public static func _XmlSerializer_setDeclaration(ptr: KPointer): Unit {
        unsafe {
            XmlSerializer_setDeclaration(ptr)
        }
    }
    public static func _XmlSerializer_startElement(ptr: KPointer, name: KStringPtr): Unit {
        unsafe {
            let name =  LibC.mallocCString(name)
            XmlSerializer_startElement(ptr, name)
            LibC.free(name)
        }
    }
    public static func _XmlSerializer_endElement(ptr: KPointer): Unit {
        unsafe {
            XmlSerializer_endElement(ptr)
        }
    }
    public static func _XmlSerializer_setNamespace(ptr: KPointer, prefix: KStringPtr, namespace: KStringPtr): Unit {
        unsafe {
            let prefix =  LibC.mallocCString(prefix)
            let namespace =  LibC.mallocCString(namespace)
            XmlSerializer_setNamespace(ptr, prefix, namespace)
            LibC.free(prefix)
            LibC.free(namespace)
        }
    }
    public static func _XmlSerializer_setComment(ptr: KPointer, text: KStringPtr): Unit {
        unsafe {
            let text =  LibC.mallocCString(text)
            XmlSerializer_setComment(ptr, text)
            LibC.free(text)
        }
    }
    public static func _XmlSerializer_setCDATA(ptr: KPointer, text: KStringPtr): Unit {
        unsafe {
            let text =  LibC.mallocCString(text)
            XmlSerializer_setCDATA(ptr, text)
            LibC.free(text)
        }
    }
    public static func _XmlSerializer_setText(ptr: KPointer, text: KStringPtr): Unit {
        unsafe {
            let text =  LibC.mallocCString(text)
            XmlSerializer_setText(ptr, text)
            LibC.free(text)
        }
    }
    public static func _XmlSerializer_setDocType(ptr: KPointer, text: KStringPtr): Unit {
        unsafe {
            let text =  LibC.mallocCString(text)
            XmlSerializer_setDocType(ptr, text)
            LibC.free(text)
        }
    }
    public static func _ParseInfo_ctor(): UInt64 {
        unsafe {
            let result = ParseInfo_ctor()
            return result
        }
    }
    public static func _ParseInfo_getFinalizer(): UInt64 {
        unsafe {
            let result = ParseInfo_getFinalizer()
            return result
        }
    }
    public static func _ParseInfo_getColumnNumber(ptr: KPointer): Float64 {
        unsafe {
            let result = ParseInfo_getColumnNumber(ptr)
            return result
        }
    }
    public static func _ParseInfo_getDepth(ptr: KPointer): Float64 {
        unsafe {
            let result = ParseInfo_getDepth(ptr)
            return result
        }
    }
    public static func _ParseInfo_getLineNumber(ptr: KPointer): Float64 {
        unsafe {
            let result = ParseInfo_getLineNumber(ptr)
            return result
        }
    }
    public static func _ParseInfo_getName(ptr: KPointer): String {
        unsafe {
            let result = ParseInfo_getName(ptr)
            return result.toString()
        }
    }
    public static func _ParseInfo_getNamespace(ptr: KPointer): String {
        unsafe {
            let result = ParseInfo_getNamespace(ptr)
            return result.toString()
        }
    }
    public static func _ParseInfo_getPrefix(ptr: KPointer): String {
        unsafe {
            let result = ParseInfo_getPrefix(ptr)
            return result.toString()
        }
    }
    public static func _ParseInfo_getText(ptr: KPointer): String {
        unsafe {
            let result = ParseInfo_getText(ptr)
            return result.toString()
        }
    }
    public static func _ParseInfo_isEmptyElementTag(ptr: KPointer): Bool {
        unsafe {
            let result = ParseInfo_isEmptyElementTag(ptr)
            return result
        }
    }
    public static func _ParseInfo_isWhitespace(ptr: KPointer): Bool {
        unsafe {
            let result = ParseInfo_isWhitespace(ptr)
            return result
        }
    }
    public static func _ParseInfo_getAttributeCount(ptr: KPointer): Float64 {
        unsafe {
            let result = ParseInfo_getAttributeCount(ptr)
            return result
        }
    }
    public static func _XmlPullParser_ctor(thisArray: ArrayList<UInt8>, thisLength: Int32): UInt64 {
        unsafe {
            let handle_0 = acquireArrayRawData(thisArray.toArray())
            let result = XmlPullParser_ctor(handle_0.pointer, thisLength)
            releaseArrayRawData(handle_0)
            return result
        }
    }
    public static func _XmlPullParser_getFinalizer(): UInt64 {
        unsafe {
            let result = XmlPullParser_getFinalizer()
            return result
        }
    }
    public static func _XmlPullParser_parse(ptr: KPointer, thisArray: ArrayList<UInt8>, thisLength: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(thisArray.toArray())
            XmlPullParser_parse(ptr, handle_1.pointer, thisLength)
            releaseArrayRawData(handle_1)
        }
    }
    public static func _XmlPullParser_parseXml(ptr: KPointer, thisArray: ArrayList<UInt8>, thisLength: Int32): Unit {
        unsafe {
            let handle_1 = acquireArrayRawData(thisArray.toArray())
            XmlPullParser_parseXml(ptr, handle_1.pointer, thisLength)
            releaseArrayRawData(handle_1)
        }
    }
}