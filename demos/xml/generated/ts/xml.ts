import { int32 } from "@koalaui/common"
import { KPointer, pointer } from "@koalaui/interop"
import { RuntimeType, runtimeType, unsafeCast } from "./SerializerBase"
import { Serializer } from "./xmlSerializer"
import { Finalizable } from "./xmlFinalizable"

import {
    XMLNativeModule,
    getXMLNativeModule,
} from './xmlNative'
export interface ParseOptions {
     supportDoctype?: boolean
     ignoreNameSpace?: boolean
     tagValueCallbackFunction?: ((name: string, value: string) => boolean)
     attributeValueCallbackFunction?: ((name: string, value: string) => boolean)
     tokenValueCallbackFunction?: ((eventType: xml.EventType, value: ParseInfo) => boolean)
}
export namespace xml {
    export enum EventType {
        START_DOCUMENT = 0,
        END_DOCUMENT = 1,
        START_TAG = 2,
        END_TAG = 3,
        TEXT = 4,
        CDSECT = 5,
        COMMENT = 6,
        DOCDECL = 7,
        INSTRUCTION = 8,
        ENTITY_REFERENCE = 9,
        WHITESPACE = 10,
    }
}
export interface XmlSerializerInterface {
    setAttributes(name: string, value: string): void 
    addEmptyElement(name: string): void 
    setDeclaration(): void 
    startElement(name: string): void 
    endElement(): void 
    setNamespace(prefix: string, namespace: string): void 
    setComment(text: string): void 
    setCDATA(text: string): void 
    setText(text: string): void 
    setDocType(text: string): void 
}
export interface ParseInfoInterface {
    getColumnNumber(): number 
    getDepth(): number 
    getLineNumber(): number 
    getName(): string 
    getNamespace(): string 
    getPrefix(): string 
    getText(): string 
    isEmptyElementTag(): boolean 
    isWhitespace(): boolean 
    getAttributeCount(): number 
}
export interface XmlPullParserInterface {
    parse(option: ParseOptions): void 
}
export class XmlSerializer implements XmlSerializerInterface {
    private peer: Finalizable
     constructor(buffer: ArrayBuffer | DataView, encoding?: string | undefined) {
        const thisSerializer: Serializer = Serializer.hold()
        let buffer_type: int32 = RuntimeType.UNDEFINED
        buffer_type = runtimeType(buffer)
        if (((RuntimeType.OBJECT) == (buffer_type)) && (((buffer!.hasOwnProperty("byteLength"))))) {
            thisSerializer.writeInt8(0)
            const buffer_0 = unsafeCast<ArrayBuffer>(buffer)
            thisSerializer.writeArrayBuffer(buffer_0)
        }
        else if (((RuntimeType.OBJECT == buffer_type))) {
            thisSerializer.writeInt8(1)
            const buffer_1 = unsafeCast<DataView>(buffer)
            thisSerializer.writeCustomObject("DataView", buffer_1)
        }
        let encoding_type: int32 = RuntimeType.UNDEFINED
        encoding_type = runtimeType(encoding)
        thisSerializer.writeInt8(encoding_type)
        if ((RuntimeType.UNDEFINED) != (encoding_type)) {
            const encoding_value = encoding!
            thisSerializer.writeString(encoding_value)
        }
        this.peer = new Finalizable(getXMLNativeModule()._XmlSerializer_ctor(thisSerializer.asArray(), thisSerializer.length()), XmlSerializer.getFinalizer())
        thisSerializer.release();
    }
    static getFinalizer(): KPointer {
        return getXMLNativeModule()._XmlSerializer_getFinalizer()
    }
    getPeer(): Finalizable | undefined {
        return this.peer
    }
    setAttributes(name: string, value: string): void {
        getXMLNativeModule()._XmlSerializer_setAttributes(this.peer.ptr, name, value);
    }
    addEmptyElement(name: string): void {
        getXMLNativeModule()._XmlSerializer_addEmptyElement(this.peer.ptr, name);
    }
    setDeclaration(): void {
        getXMLNativeModule()._XmlSerializer_setDeclaration(this.peer.ptr);
    }
    startElement(name: string): void {
        getXMLNativeModule()._XmlSerializer_startElement(this.peer.ptr, name);
    }
    endElement(): void {
        getXMLNativeModule()._XmlSerializer_endElement(this.peer.ptr);
    }
    setNamespace(prefix: string, namespace: string): void {
        getXMLNativeModule()._XmlSerializer_setNamespace(this.peer.ptr, prefix, namespace);
    }
    setComment(text: string): void {
        getXMLNativeModule()._XmlSerializer_setComment(this.peer.ptr, text);
    }
    setCDATA(text: string): void {
        getXMLNativeModule()._XmlSerializer_setCDATA(this.peer.ptr, text);
    }
    setText(text: string): void {
        getXMLNativeModule()._XmlSerializer_setText(this.peer.ptr, text);
    }
    setDocType(text: string): void {
        getXMLNativeModule()._XmlSerializer_setDocType(this.peer.ptr, text);
    }
}
export class ParseInfo implements ParseInfoInterface {
    private peer: Finalizable
    static getFinalizer(): KPointer {
        return getXMLNativeModule()._ParseInfo_getFinalizer()
    }
    getPeer(): Finalizable | undefined {
        return this.peer
    }
    static construct(ptr: KPointer): ParseInfo {
        const objParseInfo: ParseInfo = new ParseInfo()
        objParseInfo.peer = new Finalizable(ptr, ParseInfo.getFinalizer())
        return objParseInfo
    }
    getColumnNumber(): number {
        const result = getXMLNativeModule()._ParseInfo_getColumnNumber(this.peer.ptr)
        return result
    }
    getDepth(): number {
        const result = getXMLNativeModule()._ParseInfo_getDepth(this.peer.ptr)
        return result
    }
    getLineNumber(): number {
        const result = getXMLNativeModule()._ParseInfo_getLineNumber(this.peer.ptr)
        return result
    }
    getName(): string {
        const result = getXMLNativeModule()._ParseInfo_getName(this.peer.ptr)
        return result
    }
    getNamespace(): string {
        const result = getXMLNativeModule()._ParseInfo_getNamespace(this.peer.ptr)
        return result
    }
    getPrefix(): string {
        const result = getXMLNativeModule()._ParseInfo_getPrefix(this.peer.ptr)
        return result
    }
    getText(): string {
        const result = getXMLNativeModule()._ParseInfo_getText(this.peer.ptr)
        return result
    }
    isEmptyElementTag(): boolean {
        const result = getXMLNativeModule()._ParseInfo_isEmptyElementTag(this.peer.ptr)
        return result
    }
    isWhitespace(): boolean {
        const result = getXMLNativeModule()._ParseInfo_isWhitespace(this.peer.ptr)
        return result
    }
    getAttributeCount(): number {
        const result = getXMLNativeModule()._ParseInfo_getAttributeCount(this.peer.ptr)
        return result
    }
}
export class XmlPullParser implements XmlPullParserInterface {
    private peer: Finalizable
     constructor(buffer: string, encoding?: string | undefined) {
        const thisSerializer: Serializer = Serializer.hold()
        let encoding_type: int32 = RuntimeType.UNDEFINED
        encoding_type = runtimeType(encoding)
        thisSerializer.writeInt8(encoding_type)
        if ((RuntimeType.UNDEFINED) != (encoding_type)) {
            const encoding_value = encoding!
            thisSerializer.writeString(encoding_value)
        }
        this.peer = new Finalizable(getXMLNativeModule()._XmlPullParser_ctor(buffer, thisSerializer.asArray(), thisSerializer.length()), XmlPullParser.getFinalizer())
        thisSerializer.release();
    }
    static getFinalizer(): KPointer {
        return getXMLNativeModule()._XmlPullParser_getFinalizer()
    }
    getPeer(): Finalizable | undefined {
        return this.peer
    }
    parse(option: ParseOptions): void {
        const thisSerializer: Serializer = Serializer.hold()
        thisSerializer.writeParseOptions(option)
        getXMLNativeModule()._XmlPullParser_parse(this.peer.ptr, thisSerializer.asArray(), thisSerializer.length());
        thisSerializer.release();
    }
}
