import { int32 } from "@koalaui/common"
import { KPointer, KInt, KStringPtr, pointer } from "@koalaui/interop"
import { RuntimeType, runtimeType } from "./SerializerBase"
import { Serializer } from "./xmlSerializer"
import { Finalizable } from "./xmlFinalizable"

import {
    XMLNativeModule,
} from './xmlNative'
export interface ParseOptions {
    supportDoctype?: boolean
    ignoreNameSpace?: boolean
    tagValueCallbackFunction?: Function2<KStringPtr,KStringPtr,boolean>
    attributeValueCallbackFunction?: Function2<KStringPtr,KStringPtr,boolean>
    tokenValueCallbackFunction?: Function2<xml_EventType,ParseInfo,boolean>
}
export class xml_EventType {
    static readonly START_DOCUMENT: xml_EventType = new xml_EventType(0,0)
    static readonly END_DOCUMENT: xml_EventType = new xml_EventType(1,1)
    static readonly START_TAG: xml_EventType = new xml_EventType(2,2)
    static readonly END_TAG: xml_EventType = new xml_EventType(3,3)
    static readonly TEXT: xml_EventType = new xml_EventType(4,4)
    static readonly CDSECT: xml_EventType = new xml_EventType(5,5)
    static readonly COMMENT: xml_EventType = new xml_EventType(6,6)
    static readonly DOCDECL: xml_EventType = new xml_EventType(7,7)
    static readonly INSTRUCTION: xml_EventType = new xml_EventType(8,8)
    static readonly ENTITY_REFERENCE: xml_EventType = new xml_EventType(9,9)
    static readonly WHITESPACE: xml_EventType = new xml_EventType(10,10)
     constructor(value: KInt, ordinal: KInt) {
        this.value = value
        this.ordinal = ordinal
    }
    public readonly value: KInt
    public readonly ordinal: KInt
    public static of(arg0: KInt): xml_EventType {
        if ((arg0) == (xml_EventType.START_DOCUMENT.value))
            return xml_EventType.START_DOCUMENT
        if ((arg0) == (xml_EventType.END_DOCUMENT.value))
            return xml_EventType.END_DOCUMENT
        if ((arg0) == (xml_EventType.START_TAG.value))
            return xml_EventType.START_TAG
        if ((arg0) == (xml_EventType.END_TAG.value))
            return xml_EventType.END_TAG
        if ((arg0) == (xml_EventType.TEXT.value))
            return xml_EventType.TEXT
        if ((arg0) == (xml_EventType.CDSECT.value))
            return xml_EventType.CDSECT
        if ((arg0) == (xml_EventType.COMMENT.value))
            return xml_EventType.COMMENT
        if ((arg0) == (xml_EventType.DOCDECL.value))
            return xml_EventType.DOCDECL
        if ((arg0) == (xml_EventType.INSTRUCTION.value))
            return xml_EventType.INSTRUCTION
        if ((arg0) == (xml_EventType.ENTITY_REFERENCE.value))
            return xml_EventType.ENTITY_REFERENCE
        if ((arg0) == (xml_EventType.WHITESPACE.value))
            return xml_EventType.WHITESPACE
        throw new Error(`Enum member '${arg0}' not found`)
    }
    public static ofOrdinal(arg0: KInt): xml_EventType {
        if ((arg0) == (xml_EventType.START_DOCUMENT.ordinal))
            return xml_EventType.START_DOCUMENT
        if ((arg0) == (xml_EventType.END_DOCUMENT.ordinal))
            return xml_EventType.END_DOCUMENT
        if ((arg0) == (xml_EventType.START_TAG.ordinal))
            return xml_EventType.START_TAG
        if ((arg0) == (xml_EventType.END_TAG.ordinal))
            return xml_EventType.END_TAG
        if ((arg0) == (xml_EventType.TEXT.ordinal))
            return xml_EventType.TEXT
        if ((arg0) == (xml_EventType.CDSECT.ordinal))
            return xml_EventType.CDSECT
        if ((arg0) == (xml_EventType.COMMENT.ordinal))
            return xml_EventType.COMMENT
        if ((arg0) == (xml_EventType.DOCDECL.ordinal))
            return xml_EventType.DOCDECL
        if ((arg0) == (xml_EventType.INSTRUCTION.ordinal))
            return xml_EventType.INSTRUCTION
        if ((arg0) == (xml_EventType.ENTITY_REFERENCE.ordinal))
            return xml_EventType.ENTITY_REFERENCE
        if ((arg0) == (xml_EventType.WHITESPACE.ordinal))
            return xml_EventType.WHITESPACE
        throw new Error(`Enum member '${arg0}' not found`)
    }
}
export interface XmlSerializerInterface {
    setAttributes(name: KStringPtr, value: KStringPtr): void 
    addEmptyElement(name: KStringPtr): void 
    setDeclaration(): void 
    startElement(name: KStringPtr): void 
    endElement(): void 
    setNamespace(prefix: KStringPtr, namespace_: KStringPtr): void 
    setComment(text: KStringPtr): void 
    setCDATA(text: KStringPtr): void 
    setText(text: KStringPtr): void 
    setDocType(text: KStringPtr): void 
}
export interface ParseInfoInterface {
    getColumnNumber(): number 
    getDepth(): number 
    getLineNumber(): number 
    getName(): KStringPtr 
    getNamespace(): KStringPtr 
    getPrefix(): KStringPtr 
    getText(): KStringPtr 
    isEmptyElementTag(): boolean 
    isWhitespace(): boolean 
    getAttributeCount(): number 
}
export interface XmlPullParserInterface {
    parse(option: ParseOptions): void 
}
export class XmlSerializer implements XmlSerializerInterface {
    peer: Finalizable
     constructor(buffer: ArrayBuffer | DataView, encoding?: KStringPtr) {
        const thisSerializer : Serializer = Serializer.hold()
        let buffer_type : KInt = RuntimeType.UNDEFINED
        buffer_type = runtimeType(buffer)
        if (buffer instanceof ArrayBuffer) {
            thisSerializer.writeInt8(0 as int32)
            const buffer_0  = buffer as ArrayBuffer
            thisSerializer.writeBuffer(buffer_0)
        }
        else if (((RuntimeType.OBJECT == buffer_type))) {
            thisSerializer.writeInt8(1 as int32)
            const buffer_1  = buffer as DataView
            thisSerializer.writeCustomObject("DataView", buffer_1)
        }
        let encoding_type : KInt = RuntimeType.UNDEFINED
        encoding_type = runtimeType(encoding)
        thisSerializer.writeInt8(encoding_type as int32)
        if ((RuntimeType.UNDEFINED) != (encoding_type)) {
            const encoding_value  = encoding!
            thisSerializer.writeString(encoding_value)
        }
        this.peer = new Finalizable(XMLNativeModule._XmlSerializer_ctor(thisSerializer.asArray(), thisSerializer.length()), XmlSerializer.getFinalizer())
        thisSerializer.release();
    }
    static getFinalizer(): KPointer {
        return XMLNativeModule._XmlSerializer_getFinalizer()
    }
    getPeer(): Finalizable | undefined {
        return this.peer
    }
    setAttributes(name: KStringPtr, value: KStringPtr): void {
        XMLNativeModule._XmlSerializer_setAttributes(this.peer.ptr, name, value);
    }
    addEmptyElement(name: KStringPtr): void {
        XMLNativeModule._XmlSerializer_addEmptyElement(this.peer.ptr, name);
    }
    setDeclaration(): void {
        XMLNativeModule._XmlSerializer_setDeclaration(this.peer.ptr);
    }
    startElement(name: KStringPtr): void {
        XMLNativeModule._XmlSerializer_startElement(this.peer.ptr, name);
    }
    endElement(): void {
        XMLNativeModule._XmlSerializer_endElement(this.peer.ptr);
    }
    setNamespace(prefix: KStringPtr, namespace_: KStringPtr): void {
        XMLNativeModule._XmlSerializer_setNamespace(this.peer.ptr, prefix, namespace_);
    }
    setComment(text: KStringPtr): void {
        XMLNativeModule._XmlSerializer_setComment(this.peer.ptr, text);
    }
    setCDATA(text: KStringPtr): void {
        XMLNativeModule._XmlSerializer_setCDATA(this.peer.ptr, text);
    }
    setText(text: KStringPtr): void {
        XMLNativeModule._XmlSerializer_setText(this.peer.ptr, text);
    }
    setDocType(text: KStringPtr): void {
        XMLNativeModule._XmlSerializer_setDocType(this.peer.ptr, text);
    }
}
export class ParseInfo implements ParseInfoInterface {
    peer: Finalizable = Finalizable.Empty
    static getFinalizer(): KPointer {
        return XMLNativeModule._ParseInfo_getFinalizer()
    }
    getPeer(): Finalizable | undefined {
        return this.peer
    }
    static construct(ptr: KPointer): ParseInfo {
        const objParseInfo : ParseInfo = new ParseInfo()
        objParseInfo.peer = new Finalizable(ptr, ParseInfo.getFinalizer())
        return objParseInfo
    }
    getColumnNumber(): number {
        const result  = XMLNativeModule._ParseInfo_getColumnNumber(this.peer.ptr)
        return result
    }
    getDepth(): number {
        const result  = XMLNativeModule._ParseInfo_getDepth(this.peer.ptr)
        return result
    }
    getLineNumber(): number {
        const result  = XMLNativeModule._ParseInfo_getLineNumber(this.peer.ptr)
        return result
    }
    getName(): KStringPtr {
        const result  = XMLNativeModule._ParseInfo_getName(this.peer.ptr)
        return result
    }
    getNamespace(): KStringPtr {
        const result  = XMLNativeModule._ParseInfo_getNamespace(this.peer.ptr)
        return result
    }
    getPrefix(): KStringPtr {
        const result  = XMLNativeModule._ParseInfo_getPrefix(this.peer.ptr)
        return result
    }
    getText(): KStringPtr {
        const result  = XMLNativeModule._ParseInfo_getText(this.peer.ptr)
        return result
    }
    isEmptyElementTag(): boolean {
        const result  = XMLNativeModule._ParseInfo_isEmptyElementTag(this.peer.ptr)
        return result
    }
    isWhitespace(): boolean {
        const result  = XMLNativeModule._ParseInfo_isWhitespace(this.peer.ptr)
        return result
    }
    getAttributeCount(): number {
        const result  = XMLNativeModule._ParseInfo_getAttributeCount(this.peer.ptr)
        return result
    }
}
export class ParseInfoInternal {
    public static fromPtr(ptr: KPointer): ParseInfo {
        const obj : ParseInfo = new ParseInfo()
        obj.peer = new Finalizable(ptr, ParseInfo.getFinalizer())
        return obj
    }
}
export class XmlPullParser implements XmlPullParserInterface {
    peer: Finalizable
     constructor(buffer: KStringPtr, encoding?: KStringPtr) {
        const thisSerializer : Serializer = Serializer.hold()
        let encoding_type : KInt = RuntimeType.UNDEFINED
        encoding_type = runtimeType(encoding)
        thisSerializer.writeInt8(encoding_type as int32)
        if ((RuntimeType.UNDEFINED) != (encoding_type)) {
            const encoding_value  = encoding!
            thisSerializer.writeString(encoding_value)
        }
        this.peer = new Finalizable(XMLNativeModule._XmlPullParser_ctor(buffer, thisSerializer.asArray(), thisSerializer.length()), XmlPullParser.getFinalizer())
        thisSerializer.release();
    }
    static getFinalizer(): KPointer {
        return XMLNativeModule._XmlPullParser_getFinalizer()
    }
    getPeer(): Finalizable | undefined {
        return this.peer
    }
    parse(option: ParseOptions): void {
        const thisSerializer : Serializer = Serializer.hold()
        thisSerializer.writeParseOptions(option)
        XMLNativeModule._XmlPullParser_parse(this.peer.ptr, thisSerializer.asArray(), thisSerializer.length());
        thisSerializer.release();
    }
}
