import { int32 } from "@koalaui/common"
import { KPointer, KInt, KStringPtr, pointer } from "@koalaui/interop"
import { RuntimeType, runtimeType, NativeBuffer } from "./SerializerBase"
import { Serializer } from "./xmlSerializer"
import { Finalizable } from "./xmlFinalizable"

import { TypeChecker } from "./type_check"
import {
    XMLNativeModule,
} from './xmlNative'
export namespace xml {
    export interface ParseOptions {
        supportDoctype?: boolean
        ignoreNameSpace?: boolean
        tagValueCallbackFunction?: ((name: string,value: string) => boolean)
        attributeValueCallbackFunction?: ((name: string,value: string) => boolean)
        tokenValueCallbackFunction?: ((eventType: xml_EventType,value: xml.ParseInfo) => boolean)
    }
}
export enum xml_EventType {
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
    WHITESPACE = 10
}
export interface XmlSerializerInterface {
    setAttributes(name: string, value: string): void 
    addEmptyElement(name: string): void 
    setDeclaration(): void 
    startElement(name: string): void 
    endElement(): void 
    setNamespace(prefix: string, namespace_: string): void 
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
    parse(option: xml.ParseOptions): void 
    parseXml(option: xml.ParseOptions): void 
}
export namespace xml {
    export class XmlSerializer implements XmlSerializerInterface {
        peer: Finalizable
         constructor(buffer: NativeBuffer, encoding?: string) {
            const thisSerializer : Serializer = Serializer.hold()
            thisSerializer.writeBuffer(buffer)
            let encoding_type : int32 = RuntimeType.UNDEFINED
            encoding_type = runtimeType(encoding)
            thisSerializer.writeInt8(encoding_type as int32)
            if ((RuntimeType.UNDEFINED) != (encoding_type)) {
                const encoding_value  = encoding!
                thisSerializer.writeString(encoding_value)
            }
            this.peer = new Finalizable(XMLNativeModule._XmlSerializer_ctor(thisSerializer.asArray(), thisSerializer.length()), XmlSerializer.getFinalizer())
            thisSerializer.release()
        }
        static getFinalizer(): KPointer {
            return XMLNativeModule._XmlSerializer_getFinalizer()
        }
        getPeer(): Finalizable | undefined {
            return this.peer
        }
        setAttributes(name: string, value: string): void {
            const name_casted = name as (string)
            const value_casted = value as (string)
            this.setAttributes_serialize(name_casted, value_casted)
            return
        }
        addEmptyElement(name: string): void {
            const name_casted = name as (string)
            this.addEmptyElement_serialize(name_casted)
            return
        }
        setDeclaration(): void {
            this.setDeclaration_serialize()
            return
        }
        startElement(name: string): void {
            const name_casted = name as (string)
            this.startElement_serialize(name_casted)
            return
        }
        endElement(): void {
            this.endElement_serialize()
            return
        }
        setNamespace(prefix: string, namespace_: string): void {
            const prefix_casted = prefix as (string)
            const namespace__casted = namespace_ as (string)
            this.setNamespace_serialize(prefix_casted, namespace__casted)
            return
        }
        setComment(text: string): void {
            const text_casted = text as (string)
            this.setComment_serialize(text_casted)
            return
        }
        setCDATA(text: string): void {
            const text_casted = text as (string)
            this.setCDATA_serialize(text_casted)
            return
        }
        setText(text: string): void {
            const text_casted = text as (string)
            this.setText_serialize(text_casted)
            return
        }
        setDocType(text: string): void {
            const text_casted = text as (string)
            this.setDocType_serialize(text_casted)
            return
        }
        private setAttributes_serialize(name: string, value: string): void {
            XMLNativeModule._XmlSerializer_setAttributes(this.peer!.ptr, name, value)
        }
        private addEmptyElement_serialize(name: string): void {
            XMLNativeModule._XmlSerializer_addEmptyElement(this.peer!.ptr, name)
        }
        private setDeclaration_serialize(): void {
            XMLNativeModule._XmlSerializer_setDeclaration(this.peer!.ptr)
        }
        private startElement_serialize(name: string): void {
            XMLNativeModule._XmlSerializer_startElement(this.peer!.ptr, name)
        }
        private endElement_serialize(): void {
            XMLNativeModule._XmlSerializer_endElement(this.peer!.ptr)
        }
        private setNamespace_serialize(prefix: string, namespace_: string): void {
            XMLNativeModule._XmlSerializer_setNamespace(this.peer!.ptr, prefix, namespace_)
        }
        private setComment_serialize(text: string): void {
            XMLNativeModule._XmlSerializer_setComment(this.peer!.ptr, text)
        }
        private setCDATA_serialize(text: string): void {
            XMLNativeModule._XmlSerializer_setCDATA(this.peer!.ptr, text)
        }
        private setText_serialize(text: string): void {
            XMLNativeModule._XmlSerializer_setText(this.peer!.ptr, text)
        }
        private setDocType_serialize(text: string): void {
            XMLNativeModule._XmlSerializer_setDocType(this.peer!.ptr, text)
        }
    }
}
export namespace xml {
    export class ParseInfo implements ParseInfoInterface {
        peer: Finalizable = Finalizable.Empty
         constructor() {
            this.peer = new Finalizable(XMLNativeModule._ParseInfo_ctor(), ParseInfo.getFinalizer())
        }
        static getFinalizer(): KPointer {
            return XMLNativeModule._ParseInfo_getFinalizer()
        }
        getPeer(): Finalizable | undefined {
            return this.peer
        }
        getColumnNumber(): number {
            return this.getColumnNumber_serialize()
        }
        getDepth(): number {
            return this.getDepth_serialize()
        }
        getLineNumber(): number {
            return this.getLineNumber_serialize()
        }
        getName(): string {
            return this.getName_serialize()
        }
        getNamespace(): string {
            return this.getNamespace_serialize()
        }
        getPrefix(): string {
            return this.getPrefix_serialize()
        }
        getText(): string {
            return this.getText_serialize()
        }
        isEmptyElementTag(): boolean {
            return this.isEmptyElementTag_serialize()
        }
        isWhitespace(): boolean {
            return this.isWhitespace_serialize()
        }
        getAttributeCount(): number {
            return this.getAttributeCount_serialize()
        }
        private getColumnNumber_serialize(): number {
            const retval  = XMLNativeModule._ParseInfo_getColumnNumber(this.peer!.ptr)
            return retval
        }
        private getDepth_serialize(): number {
            const retval  = XMLNativeModule._ParseInfo_getDepth(this.peer!.ptr)
            return retval
        }
        private getLineNumber_serialize(): number {
            const retval  = XMLNativeModule._ParseInfo_getLineNumber(this.peer!.ptr)
            return retval
        }
        private getName_serialize(): string {
            const retval  = XMLNativeModule._ParseInfo_getName(this.peer!.ptr)
            return retval
        }
        private getNamespace_serialize(): string {
            const retval  = XMLNativeModule._ParseInfo_getNamespace(this.peer!.ptr)
            return retval
        }
        private getPrefix_serialize(): string {
            const retval  = XMLNativeModule._ParseInfo_getPrefix(this.peer!.ptr)
            return retval
        }
        private getText_serialize(): string {
            const retval  = XMLNativeModule._ParseInfo_getText(this.peer!.ptr)
            return retval
        }
        private isEmptyElementTag_serialize(): boolean {
            const retval  = XMLNativeModule._ParseInfo_isEmptyElementTag(this.peer!.ptr)
            return retval
        }
        private isWhitespace_serialize(): boolean {
            const retval  = XMLNativeModule._ParseInfo_isWhitespace(this.peer!.ptr)
            return retval
        }
        private getAttributeCount_serialize(): number {
            const retval  = XMLNativeModule._ParseInfo_getAttributeCount(this.peer!.ptr)
            return retval
        }
    }
    export class ParseInfoInternal {
        public static fromPtr(ptr: KPointer): xml.ParseInfo {
            const obj : xml.ParseInfo = new xml.ParseInfo()
            obj.peer = new Finalizable(ptr, ParseInfo.getFinalizer())
            return obj
        }
    }
}
export namespace xml {
    export class XmlPullParser implements XmlPullParserInterface {
        peer: Finalizable
         constructor(buffer: NativeBuffer, encoding?: string) {
            const thisSerializer : Serializer = Serializer.hold()
            thisSerializer.writeBuffer(buffer)
            let encoding_type : int32 = RuntimeType.UNDEFINED
            encoding_type = runtimeType(encoding)
            thisSerializer.writeInt8(encoding_type as int32)
            if ((RuntimeType.UNDEFINED) != (encoding_type)) {
                const encoding_value  = encoding!
                thisSerializer.writeString(encoding_value)
            }
            this.peer = new Finalizable(XMLNativeModule._XmlPullParser_ctor(thisSerializer.asArray(), thisSerializer.length()), XmlPullParser.getFinalizer())
            thisSerializer.release()
        }
        static getFinalizer(): KPointer {
            return XMLNativeModule._XmlPullParser_getFinalizer()
        }
        getPeer(): Finalizable | undefined {
            return this.peer
        }
        parse(option: xml.ParseOptions): void {
            const option_casted = option as (xml.ParseOptions)
            this.parse_serialize(option_casted)
            return
        }
        parseXml(option: xml.ParseOptions): void {
            const option_casted = option as (xml.ParseOptions)
            this.parseXml_serialize(option_casted)
            return
        }
        private parse_serialize(option: xml.ParseOptions): void {
            const thisSerializer : Serializer = Serializer.hold()
            thisSerializer.writeParseOptions(option)
            XMLNativeModule._XmlPullParser_parse(this.peer!.ptr, thisSerializer.asArray(), thisSerializer.length())
            thisSerializer.release()
        }
        private parseXml_serialize(option: xml.ParseOptions): void {
            const thisSerializer : Serializer = Serializer.hold()
            thisSerializer.writeParseOptions(option)
            XMLNativeModule._XmlPullParser_parseXml(this.peer!.ptr, thisSerializer.asArray(), thisSerializer.length())
            thisSerializer.release()
        }
    }
}
