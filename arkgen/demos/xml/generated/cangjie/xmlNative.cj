package idlize

public open class CallbackKind {
    public static var Kind_Callback_Boolean_Void: CallbackKind = CallbackKind(313269291)
    public static var Kind_Callback_EventType_ParseInfo_Boolean: CallbackKind = CallbackKind(240036623)
    public static var Kind_Callback_String_String_Boolean: CallbackKind = CallbackKind(923368928)
    public var value: Int32
    CallbackKind(arg0: Int32) {
        value = arg0
    }
}

public class XMLNativeModule {
    static func callCallbackFromNative(id: KInt, args: KPointer, length: KInt): KInt {
        // TODO implement callCallbackFromNative
        return 0
    }    

    func _XmlSerializer_ctor(thisArray: CPointer<UInt8>, thisLength: Int32): UInt64
    func _XmlSerializer_getFinalizer(): UInt64
    func _XmlSerializer_setAttributes(self: UInt64, name: CString, value: CString): Unit
    func _XmlSerializer_addEmptyElement(self: UInt64, name: CString): Unit
    func _XmlSerializer_setDeclaration(self: UInt64): Unit
    func _XmlSerializer_startElement(self: UInt64, name: CString): Unit
    func _XmlSerializer_endElement(self: UInt64): Unit
    func _XmlSerializer_setNamespace(self: UInt64, prefix: CString, namespace: CString): Unit
    func _XmlSerializer_setComment(self: UInt64, text: CString): Unit
    func _XmlSerializer_setCDATA(self: UInt64, text: CString): Unit
    func _XmlSerializer_setText(self: UInt64, text: CString): Unit
    func _XmlSerializer_setDocType(self: UInt64, text: CString): Unit
    func _ParseInfo_ctor(): UInt64
    func _ParseInfo_getFinalizer(): UInt64
    func _ParseInfo_getColumnNumber(self: UInt64): Float64
    func _ParseInfo_getDepth(self: UInt64): Float64
    func _ParseInfo_getLineNumber(self: UInt64): Float64
    func _ParseInfo_getName(self: UInt64): CString
    func _ParseInfo_getNamespace(self: UInt64): CString
    func _ParseInfo_getPrefix(self: UInt64): CString
    func _ParseInfo_getText(self: UInt64): CString
    func _ParseInfo_isEmptyElementTag(self: UInt64): Bool
    func _ParseInfo_isWhitespace(self: UInt64): Bool
    func _ParseInfo_getAttributeCount(self: UInt64): Float64
    func _XmlPullParser_ctor(thisArray: CPointer<UInt8>, thisLength: Int32): UInt64
    func _XmlPullParser_getFinalizer(): UInt64
    func _XmlPullParser_parse(self: UInt64, thisArray: CPointer<UInt8>, thisLength: Int32): Unit
    func _XmlPullParser_parseXml(self: UInt64, thisArray: CPointer<UInt8>, thisLength: Int32): Unit
}

let theModule: XMLNativeModule

func function getXMLNativeModule(): XMLNativeModule {
    if (theModule) {
        return theModule
    }
    theModule = new XMLNativeModule()
    return theModule
}

