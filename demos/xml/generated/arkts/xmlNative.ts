import { int32 } from "@koalaui/common"
import { pointer, KPointer, KInt, KStringPtr, KUint8ArrayPtr } from "@koalaui/interop"

export class CallbackKind {
    static readonly Kind_Callback_Boolean_Void: CallbackKind = new CallbackKind(313269291,0)
    static readonly Kind_Callback_EventType_ParseInfo_Boolean: CallbackKind = new CallbackKind(240036623,1)
    static readonly Kind_Callback_String_String_Boolean: CallbackKind = new CallbackKind(923368928,2)
     constructor(value: int32, ordinal: int32) {
        this.value = value
        this.ordinal = ordinal
    }
    public readonly value: int32
    public readonly ordinal: int32
    public static of(arg0: int32): CallbackKind {
        if ((arg0) == (CallbackKind.Kind_Callback_Boolean_Void.value))
            return CallbackKind.Kind_Callback_Boolean_Void
        if ((arg0) == (CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean.value))
            return CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean
        if ((arg0) == (CallbackKind.Kind_Callback_String_String_Boolean.value))
            return CallbackKind.Kind_Callback_String_String_Boolean
        throw new Error(`Enum member '${arg0}' not found`)
    }
    public static ofOrdinal(arg0: int32): CallbackKind {
        if ((arg0) == (CallbackKind.Kind_Callback_Boolean_Void.ordinal))
            return CallbackKind.Kind_Callback_Boolean_Void
        if ((arg0) == (CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean.ordinal))
            return CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean
        if ((arg0) == (CallbackKind.Kind_Callback_String_String_Boolean.ordinal))
            return CallbackKind.Kind_Callback_String_String_Boolean
        throw new Error(`Enum member '${arg0}' not found`)
    }
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
