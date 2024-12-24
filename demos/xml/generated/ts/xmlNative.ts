import { int32 } from "@koalaui/common"
import { pointer, KPointer, registerNativeModule } from "@koalaui/interop"

export enum CallbackKind {
    Kind_Callback_Boolean_Void = 313269291,
    Kind_Callback_EventType_ParseInfo_Boolean = 240036623,
    Kind_Callback_String_String_Boolean = 923368928,
}

export class XMLNativeModule {
    static _XmlSerializer_ctor(thisArray: Uint8Array, thisLength: int32): KPointer {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_getFinalizer(): KPointer {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setAttributes(self: KPointer, name: string, value: string): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_addEmptyElement(self: KPointer, name: string): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setDeclaration(self: KPointer): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_startElement(self: KPointer, name: string): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_endElement(self: KPointer): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setNamespace(self: KPointer, prefix: string, namespace_: string): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setComment(self: KPointer, text: string): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setCDATA(self: KPointer, text: string): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setText(self: KPointer, text: string): void {
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setDocType(self: KPointer, text: string): void {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getFinalizer(): KPointer {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getColumnNumber(self: KPointer): number {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getDepth(self: KPointer): number {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getLineNumber(self: KPointer): number {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getName(self: KPointer): string {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getNamespace(self: KPointer): string {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getPrefix(self: KPointer): string {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getText(self: KPointer): string {
        throw new Error("Not implemented")
    }
    static _ParseInfo_isEmptyElementTag(self: KPointer): boolean {
        throw new Error("Not implemented")
    }
    static _ParseInfo_isWhitespace(self: KPointer): boolean {
        throw new Error("Not implemented")
    }
    static _ParseInfo_getAttributeCount(self: KPointer): number {
        throw new Error("Not implemented")
    }
    static _XmlPullParser_ctor(thisArray: Uint8Array, thisLength: int32): KPointer {
        throw new Error("Not implemented")
    }
    static _XmlPullParser_getFinalizer(): KPointer {
        throw new Error("Not implemented")
    }
    static _XmlPullParser_parse(self: KPointer, thisArray: Uint8Array, thisLength: int32): void {
        throw new Error("Not implemented")
    }
    static _XmlPullParser_parseXml(self: KPointer, thisArray: Uint8Array, thisLength: int32): void {
        throw new Error("Not implemented")
    }

    static _CheckArkoalaCallbackEvent(buffer: Uint8Array, bufferLength: int32): int32 {
        throw new Error("Not implemented")
    }
    static _HoldArkoalaResource(resourceId: int32): void {
        throw new Error("Not implemented")
    }
    static _ReleaseArkoalaResource(resourceId: int32): void {
        throw new Error("Not implemented")
    }
    static _Utf8ToString(buffer: Uint8Array, position: int32, length: int32): string {
        throw new Error("Not implemented")
    }
    static _MaterializeBuffer(data: KPointer, length: int32, resourceId: int32, holdPtr: KPointer, releasePtr: KPointer): ArrayBuffer {
        throw new Error("Not implemented")
    }
    static _GetNativeBufferPointer(data: ArrayBuffer): KPointer {
        throw new Error("Not implemented")
    }
}

registerNativeModule("XMLNativeModule", XMLNativeModule)
