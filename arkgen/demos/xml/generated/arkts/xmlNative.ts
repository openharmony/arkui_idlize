import { int32 } from "@koalaui/common"
import { pointer, KPointer, KInt, KStringPtr, KUint8ArrayPtr } from "@koalaui/interop"

export enum CallbackKind {
    Kind_Callback_Boolean_Void = 313269291,
    Kind_Callback_EventType_ParseInfo_Boolean = 240036623,
    Kind_Callback_String_String_Boolean = 923368928
}

export class XMLNativeModule {
    static {
        loadLibrary("XML_NativeBridgeArk")
        XMLNativeModule.init(["xmlNative/XMLNativeModule", "xmlNative/ArkUINativeModule"])
    }

    static native init(modules: string[]): void

    static callCallbackFromNative(id: KInt, args: KUint8ArrayPtr, length: KInt): KInt {
        // TODO implement callCallbackFromNative
        return 0
    }    

    // demo
    native static _AllocateNativeBuffer(length: KInt, retBuffer: KUint8ArrayPtr, init:KUint8ArrayPtr): void;

    native static _XmlSerializer_ctor(thisArray: KUint8ArrayPtr, thisLength: int32): KPointer 
    native static _XmlSerializer_getFinalizer(): KPointer 
    native static _XmlSerializer_setAttributes(self: KPointer, name: string, value: string): void 
    native static _XmlSerializer_addEmptyElement(self: KPointer, name: string): void 
    native static _XmlSerializer_setDeclaration(self: KPointer): void 
    native static _XmlSerializer_startElement(self: KPointer, name: string): void 
    native static _XmlSerializer_endElement(self: KPointer): void 
    native static _XmlSerializer_setNamespace(self: KPointer, prefix: string, namespace_: string): void 
    native static _XmlSerializer_setComment(self: KPointer, text: string): void 
    native static _XmlSerializer_setCDATA(self: KPointer, text: string): void 
    native static _XmlSerializer_setText(self: KPointer, text: string): void 
    native static _XmlSerializer_setDocType(self: KPointer, text: string): void 
    native static _ParseInfo_ctor(): KPointer 
    native static _ParseInfo_getFinalizer(): KPointer 
    native static _ParseInfo_getColumnNumber(self: KPointer): number 
    native static _ParseInfo_getDepth(self: KPointer): number 
    native static _ParseInfo_getLineNumber(self: KPointer): number 
    native static _ParseInfo_getName(self: KPointer): string 
    native static _ParseInfo_getNamespace(self: KPointer): string 
    native static _ParseInfo_getPrefix(self: KPointer): string 
    native static _ParseInfo_getText(self: KPointer): string 
    native static _ParseInfo_isEmptyElementTag(self: KPointer): boolean 
    native static _ParseInfo_isWhitespace(self: KPointer): boolean 
    native static _ParseInfo_getAttributeCount(self: KPointer): number 
    native static _XmlPullParser_ctor(thisArray: KUint8ArrayPtr, thisLength: int32): KPointer 
    native static _XmlPullParser_getFinalizer(): KPointer 
    native static _XmlPullParser_parse(self: KPointer, thisArray: KUint8ArrayPtr, thisLength: int32): void 
    native static _XmlPullParser_parseXml(self: KPointer, thisArray: KUint8ArrayPtr, thisLength: int32): void 
}

export class ArkUINativeModule {
    native static _CheckArkoalaCallbackEvent(buffer: KUint8ArrayPtr, bufferLength: int32): int32 
    native static _HoldArkoalaResource(resourceId: int32): void 
    native static _ReleaseArkoalaResource(resourceId: int32): void 
    native static _Utf8ToString(buffer: KUint8ArrayPtr, position: int32, length: int32): string 
    native static _ManagedStringWrite(str: string, arr: KUint8ArrayPtr, len: int32): int32 
}
