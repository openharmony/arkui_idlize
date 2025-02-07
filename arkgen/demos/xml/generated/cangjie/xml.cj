package idlize

import Interop.*
import std.collection.*

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
public open class XmlSerializer {
    var peer: Finalizable
    XmlSerializer(buffer: Array<UInt8>, encoding: Option<String>) {
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
        this.peer = Finalizable(XMLNativeModule._XmlSerializer_ctor(thisSerializer.asArray(), thisSerializer.length()), XmlSerializer.getFinalizer())
        thisSerializer.release();
    }
    static func getFinalizer(): UInt64 {
        return XMLNativeModule._XmlSerializer_getFinalizer()
    }
    func getPeer(): Option<Finalizable> {
        return this.peer
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
        XMLNativeModule._XmlSerializer_setAttributes(this.peer.ptr, name, value);
    }
    private func addEmptyElement_serialize(name: String): Unit {
        XMLNativeModule._XmlSerializer_addEmptyElement(this.peer.ptr, name);
    }
    private func setDeclaration_serialize(): Unit {
        XMLNativeModule._XmlSerializer_setDeclaration(this.peer.ptr);
    }
    private func startElement_serialize(name: String): Unit {
        XMLNativeModule._XmlSerializer_startElement(this.peer.ptr, name);
    }
    private func endElement_serialize(): Unit {
        XMLNativeModule._XmlSerializer_endElement(this.peer.ptr);
    }
    private func setNamespace_serialize(prefix: String, namespace: String): Unit {
        XMLNativeModule._XmlSerializer_setNamespace(this.peer.ptr, prefix, namespace);
    }
    private func setComment_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setComment(this.peer.ptr, text);
    }
    private func setCDATA_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setCDATA(this.peer.ptr, text);
    }
    private func setText_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setText(this.peer.ptr, text);
    }
    private func setDocType_serialize(text: String): Unit {
        XMLNativeModule._XmlSerializer_setDocType(this.peer.ptr, text);
    }
}
public open class ParseInfo {
    var peer: Finalizable
    ParseInfo() {
        this.peer = Finalizable(XMLNativeModule._ParseInfo_ctor(), ParseInfo.getFinalizer())
    }
    static func getFinalizer(): UInt64 {
        return XMLNativeModule._ParseInfo_getFinalizer()
    }
    func getPeer(): Option<Finalizable> {
        return this.peer
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
        let retval = XMLNativeModule._ParseInfo_getColumnNumber(this.peer.ptr)
        return retval
    }
    private func getDepth_serialize(): Float64 {
        let retval = XMLNativeModule._ParseInfo_getDepth(this.peer.ptr)
        return retval
    }
    private func getLineNumber_serialize(): Float64 {
        let retval = XMLNativeModule._ParseInfo_getLineNumber(this.peer.ptr)
        return retval
    }
    private func getName_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getName(this.peer.ptr)
        return retval
    }
    private func getNamespace_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getNamespace(this.peer.ptr)
        return retval
    }
    private func getPrefix_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getPrefix(this.peer.ptr)
        return retval
    }
    private func getText_serialize(): String {
        let retval = XMLNativeModule._ParseInfo_getText(this.peer.ptr)
        return retval
    }
    private func isEmptyElementTag_serialize(): Bool {
        let retval = XMLNativeModule._ParseInfo_isEmptyElementTag(this.peer.ptr)
        return retval
    }
    private func isWhitespace_serialize(): Bool {
        let retval = XMLNativeModule._ParseInfo_isWhitespace(this.peer.ptr)
        return retval
    }
    private func getAttributeCount_serialize(): Float64 {
        let retval = XMLNativeModule._ParseInfo_getAttributeCount(this.peer.ptr)
        return retval
    }
}
public open class ParseInfoInternal {
    public static func fromPtr(ptr: UInt64): ParseInfo {
        let obj: ParseInfo = ParseInfo()
        obj.peer = Finalizable(ptr, ParseInfo.getFinalizer())
        return obj
    }
}
public open class XmlPullParser {
    var peer: Finalizable
    XmlPullParser(buffer: Array<UInt8>, encoding: Option<String>) {
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
        this.peer = Finalizable(XMLNativeModule._XmlPullParser_ctor(thisSerializer.asArray(), thisSerializer.length()), XmlPullParser.getFinalizer())
        thisSerializer.release();
    }
    static func getFinalizer(): UInt64 {
        return XMLNativeModule._XmlPullParser_getFinalizer()
    }
    func getPeer(): Option<Finalizable> {
        return this.peer
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
        XMLNativeModule._XmlPullParser_parse(this.peer.ptr, thisSerializer.asArray(), thisSerializer.length());
        thisSerializer.release();
    }
    private func parseXml_serialize(option: ParseOptions): Unit {
        let thisSerializer: Serializer = Serializer.hold()
        thisSerializer.writeParseOptions(option)
        XMLNativeModule._XmlPullParser_parseXml(this.peer.ptr, thisSerializer.asArray(), thisSerializer.length());
        thisSerializer.release();
    }
}
