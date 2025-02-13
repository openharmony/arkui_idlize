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

package idlize
import std.collection.*
import Interop.*
public open class XmlSerializerInternal {
    public static func fromPtr(ptr: UInt64): XmlSerializer {
        let obj: XmlSerializer = XmlSerializer(Option.None, Option.None)
        obj.peer = Finalizable(ptr, XmlSerializer.getFinalizer())
        return obj
    }
}
public open class XmlSerializer <: MaterializedBase {
    static func ctor(buffer: Array<UInt8>, encoding: Option<String>): UInt64 {
        let thisSerializer: Serializer = Serializer.hold()
        thisSerializer.writeBuffer(buffer)
        var encoding_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(encoding) <- encoding) {
            thisSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let encoding_value = encoding
            thisSerializer.writeString(encoding_value)
        }
        else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let retval = XMLNativeModule._XmlSerializer_ctor(thisSerializer.asArray(), thisSerializer.length())
        thisSerializer.release();
        return retval
    }
    XmlSerializer(buffer: Option<Array<UInt8>>, encoding: Option<String>) {
        if ((let Some(buffer) <- buffer) && (let Some(encoding) <- encoding))
        {
            let ctorPtr: UInt64 = XmlSerializer.ctor(buffer, encoding)
            this.peer = Finalizable(ctorPtr, XmlSerializer.getFinalizer())
        }
    }
    static func getFinalizer(): UInt64 {
        return XMLNativeModule._XmlSerializer_getFinalizer()
    }
    public func setAttributes(name: String, value: String): Unit {
        let name_casted: String = name
        let value_casted: String = value
        let thisObj = this
        thisObj.setAttributes_serialize(name_casted, value_casted)
        return
    }
    public func addEmptyElement(name: String): Unit {
        let name_casted: String = name
        let thisObj = this
        thisObj.addEmptyElement_serialize(name_casted)
        return
    }
    public func setDeclaration(): Unit {
        let thisObj = this
        thisObj.setDeclaration_serialize()
        return
    }
    public func startElement(name: String): Unit {
        let name_casted: String = name
        let thisObj = this
        thisObj.startElement_serialize(name_casted)
        return
    }
    public func endElement(): Unit {
        let thisObj = this
        thisObj.endElement_serialize()
        return
    }
    public func setNamespace(prefix: String, namespace: String): Unit {
        let prefix_casted: String = prefix
        let namespace_casted: String = namespace
        let thisObj = this
        thisObj.setNamespace_serialize(prefix_casted, namespace_casted)
        return
    }
    public func setComment(text: String): Unit {
        let text_casted: String = text
        let thisObj = this
        thisObj.setComment_serialize(text_casted)
        return
    }
    public func setCDATA(text: String): Unit {
        let text_casted: String = text
        let thisObj = this
        thisObj.setCDATA_serialize(text_casted)
        return
    }
    public func setText(text: String): Unit {
        let text_casted: String = text
        let thisObj = this
        thisObj.setText_serialize(text_casted)
        return
    }
    public func setDocType(text: String): Unit {
        let text_casted: String = text
        let thisObj = this
        thisObj.setDocType_serialize(text_casted)
        return
    }
    private func setAttributes_serialize(name: String, value: String): Unit {
        XMLNativeModule._XmlSerializer_setAttributes(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, name, value);
    }
    private func addEmptyElement_serialize(name: String): Unit {
        XMLNativeModule._XmlSerializer_addEmptyElement(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, name);
    }
    private func setDeclaration_serialize(): Unit {
        XMLNativeModule._XmlSerializer_setDeclaration(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")});
    }
    private func startElement_serialize(name: String): Unit {
        XMLNativeModule._XmlSerializer_startElement(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, name);
    }
    private func endElement_serialize(): Unit {
        XMLNativeModule._XmlSerializer_endElement(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")});
    }
    private func setNamespace_serialize(prefix: String, namespace: String): Unit {
        XMLNativeModule._XmlSerializer_setNamespace(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, prefix, namespace);
    }
    private func setComment_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setComment(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, text);
    }
    private func setCDATA_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setCDATA(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, text);
    }
    private func setText_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setText(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, text);
    }
    private func setDocType_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setDocType(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, text);
    }
}
public interface ParseInfo {
}
public open class ParseInfoInternal <: MaterializedBase & ParseInfo {
    static func ctor(): UInt64 {
        let retval = XMLNativeModule._ParseInfo_ctor()
        return retval
    }
    ParseInfoInternal() {
        let ctorPtr: UInt64 = ParseInfoInternal.ctor()
        this.peer = Finalizable(ctorPtr, ParseInfoInternal.getFinalizer())
    }
    static func getFinalizer(): UInt64 {
        return XMLNativeModule._ParseInfo_getFinalizer()
    }
    public func getColumnNumber(): Float64 {
        return this.getColumnNumber_serialize()
    }
    public func getDepth(): Float64 {
        return this.getDepth_serialize()
    }
    public func getLineNumber(): Float64 {
        return this.getLineNumber_serialize()
    }
    public func getName(): String {
        return this.getName_serialize()
    }
    public func getNamespace(): String {
        return this.getNamespace_serialize()
    }
    public func getPrefix(): String {
        return this.getPrefix_serialize()
    }
    public func getText(): String {
        return this.getText_serialize()
    }
    public func isEmptyElementTag(): Bool {
        return this.isEmptyElementTag_serialize()
    }
    public func isWhitespace(): Bool {
        return this.isWhitespace_serialize()
    }
    public func getAttributeCount(): Float64 {
        return this.getAttributeCount_serialize()
    }
    private func getColumnNumber_serialize(): Float64 {
        let retval = XMLNativeModule._ParseInfo_getColumnNumber(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func getDepth_serialize(): Float64 {
        let retval = XMLNativeModule._ParseInfo_getDepth(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func getLineNumber_serialize(): Float64 {
        let retval = XMLNativeModule._ParseInfo_getLineNumber(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func getName_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getName(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func getNamespace_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getNamespace(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func getPrefix_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getPrefix(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func getText_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getText(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func isEmptyElementTag_serialize(): Bool {
        let retval = XMLNativeModule._ParseInfo_isEmptyElementTag(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func isWhitespace_serialize(): Bool {
        let retval = XMLNativeModule._ParseInfo_isWhitespace(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    private func getAttributeCount_serialize(): Float64 {
        let retval = XMLNativeModule._ParseInfo_getAttributeCount(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")})
        return retval
    }
    public static func fromPtr(ptr: UInt64): ParseInfoInternal {
        let obj: ParseInfoInternal = ParseInfoInternal()
        obj.peer = Finalizable(ptr, ParseInfoInternal.getFinalizer())
        return obj
    }
}
public open class XmlPullParserInternal {
    public static func fromPtr(ptr: UInt64): XmlPullParser {
        let obj: XmlPullParser = XmlPullParser(Option.None, Option.None)
        obj.peer = Finalizable(ptr, XmlPullParser.getFinalizer())
        return obj
    }
}
public open class XmlPullParser <: MaterializedBase {
    static func ctor(buffer: Array<UInt8>, encoding: Option<String>): UInt64 {
        let thisSerializer: Serializer = Serializer.hold()
        thisSerializer.writeBuffer(buffer)
        var encoding_type: Int32 = RuntimeType.UNDEFINED.ordinal
        if (let Some(encoding) <- encoding) {
            thisSerializer.writeInt8(RuntimeType.OBJECT.ordinal)
            let encoding_value = encoding
            thisSerializer.writeString(encoding_value)
        }
        else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED.ordinal)
        }
        let retval = XMLNativeModule._XmlPullParser_ctor(thisSerializer.asArray(), thisSerializer.length())
        thisSerializer.release();
        return retval
    }
    XmlPullParser(buffer: Option<Array<UInt8>>, encoding: Option<String>) {
        if ((let Some(buffer) <- buffer) && (let Some(encoding) <- encoding))
        {
            let ctorPtr: UInt64 = XmlPullParser.ctor(buffer, encoding)
            this.peer = Finalizable(ctorPtr, XmlPullParser.getFinalizer())
        }
    }
    static func getFinalizer(): UInt64 {
        return XMLNativeModule._XmlPullParser_getFinalizer()
    }
    public func parse(option: ParseOptions): Unit {
        let option_casted: ParseOptions = option
        let thisObj = this
        thisObj.parse_serialize(option_casted)
        return
    }
    public func parseXml(option: ParseOptions): Unit {
        let option_casted: ParseOptions = option
        let thisObj = this
        thisObj.parseXml_serialize(option_casted)
        return
    }
    private func parse_serialize(option: ParseOptions): Unit {
        let thisSerializer: Serializer = Serializer.hold()
        thisSerializer.writeParseOptions(option)
        XMLNativeModule._XmlPullParser_parse(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, thisSerializer.asArray(), thisSerializer.length());
        thisSerializer.release();
    }
    private func parseXml_serialize(option: ParseOptions): Unit {
        let thisSerializer: Serializer = Serializer.hold()
        thisSerializer.writeParseOptions(option)
        XMLNativeModule._XmlPullParser_parseXml(if (let Some(peer) <- this.peer) { peer.ptr } else {throw Exception("")}, thisSerializer.asArray(), thisSerializer.length());
        thisSerializer.release();
    }
}
public open class EventType {
    public static var START_DOCUMENT: EventType = EventType(0)
    public static var END_DOCUMENT: EventType = EventType(1)
    public static var START_TAG: EventType = EventType(2)
    public static var END_TAG: EventType = EventType(3)
    public static var TEXT: EventType = EventType(4)
    public static var CDSECT: EventType = EventType(5)
    public static var COMMENT: EventType = EventType(6)
    public static var DOCDECL: EventType = EventType(7)
    public static var INSTRUCTION: EventType = EventType(8)
    public static var ENTITY_REFERENCE: EventType = EventType(9)
    public static var WHITESPACE: EventType = EventType(10)
    public var value: Int32
    EventType(arg0: Int32) {
        value = arg0
    }
}
public open class ParseOptions {
    private var supportDoctype_container: Option<Bool>
    mut prop supportDoctype: Option<Bool> {
        get() {
            return supportDoctype_container
        }
        set(x) { supportDoctype_container = x }
    }
    private var ignoreNameSpace_container: Option<Bool>
    mut prop ignoreNameSpace: Option<Bool> {
        get() {
            return ignoreNameSpace_container
        }
        set(x) { ignoreNameSpace_container = x }
    }
    private var tagValueCallbackFunction_container: Option<((name: String, value: String) -> Bool)>
    mut prop tagValueCallbackFunction: Option<((name: String, value: String) -> Bool)> {
        get() {
            return tagValueCallbackFunction_container
        }
        set(x) { tagValueCallbackFunction_container = x }
    }
    private var attributeValueCallbackFunction_container: Option<((name: String, value: String) -> Bool)>
    mut prop attributeValueCallbackFunction: Option<((name: String, value: String) -> Bool)> {
        get() {
            return attributeValueCallbackFunction_container
        }
        set(x) { attributeValueCallbackFunction_container = x }
    }
    private var tokenValueCallbackFunction_container: Option<((eventType: EventType, value: ParseInfo) -> Bool)>
    mut prop tokenValueCallbackFunction: Option<((eventType: EventType, value: ParseInfo) -> Bool)> {
        get() {
            return tokenValueCallbackFunction_container
        }
        set(x) { tokenValueCallbackFunction_container = x }
    }
    ParseOptions(supportDoctype: Option<Bool>, ignoreNameSpace: Option<Bool>, tagValueCallbackFunction: Option<((name: String, value: String) -> Bool)>, attributeValueCallbackFunction: Option<((name: String, value: String) -> Bool)>, tokenValueCallbackFunction: Option<((eventType: EventType, value: ParseInfo) -> Bool)>) {
        super()
        this.supportDoctype_container = supportDoctype
        this.ignoreNameSpace_container = ignoreNameSpace
        this.tagValueCallbackFunction_container = tagValueCallbackFunction
        this.attributeValueCallbackFunction_container = attributeValueCallbackFunction
        this.tokenValueCallbackFunction_container = tokenValueCallbackFunction
    }
}
