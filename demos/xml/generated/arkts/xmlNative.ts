import { int32 } from "@koalaui/common"
import { pointer, KPointer, KInt, KStringPtr, KUint8ArrayPtr } from "@koalaui/interop"

export class CallbackKind {
    static readonly Kind_Callback_Boolean_Void: CallbackKind = new CallbackKind(0,0)
    static readonly Kind_Callback_EventType_ParseInfo_Boolean: CallbackKind = new CallbackKind(1,1)
    static readonly Kind_Callback_String_String_Boolean: CallbackKind = new CallbackKind(2,2)
    static readonly Kind_Callback_Void: CallbackKind = new CallbackKind(3,3)
     constructor(value: KInt, ordinal: KInt) {
        this.value = value
        this.ordinal = ordinal
    }
    public readonly value: KInt
    public readonly ordinal: KInt
    public static of(arg0: KInt): CallbackKind {
        if ((arg0) == (CallbackKind.Kind_Callback_Boolean_Void.value))
            return CallbackKind.Kind_Callback_Boolean_Void
        if ((arg0) == (CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean.value))
            return CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean
        if ((arg0) == (CallbackKind.Kind_Callback_String_String_Boolean.value))
            return CallbackKind.Kind_Callback_String_String_Boolean
        if ((arg0) == (CallbackKind.Kind_Callback_Void.value))
            return CallbackKind.Kind_Callback_Void
        throw new Error(`Enum member '${arg0}' not found`)
    }
    public static ofOrdinal(arg0: KInt): CallbackKind {
        if ((arg0) == (CallbackKind.Kind_Callback_Boolean_Void.ordinal))
            return CallbackKind.Kind_Callback_Boolean_Void
        if ((arg0) == (CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean.ordinal))
            return CallbackKind.Kind_Callback_EventType_ParseInfo_Boolean
        if ((arg0) == (CallbackKind.Kind_Callback_String_String_Boolean.ordinal))
            return CallbackKind.Kind_Callback_String_String_Boolean
        if ((arg0) == (CallbackKind.Kind_Callback_Void.ordinal))
            return CallbackKind.Kind_Callback_Void
        throw new Error(`Enum member '${arg0}' not found`)
    }
}

export class XMLNativeModule {
    static {
        loadLibrary("XML_NativeBridgeArk")
        XMLNativeModule.init()
    }

    static native init(): void;

    static callCallbackFromNative(id: KInt, args: KUint8ArrayPtr, length: KInt): KInt {
        // TODO implement callCallbackFromNative
        return 0
    }    

    native static _XmlSerializer_ctor(thisArray: KUint8ArrayPtr, thisLength: KInt): KPointer 
    native static _XmlSerializer_getFinalizer(): KPointer 
    native static _XmlSerializer_setAttributes(self: KPointer, name: KStringPtr, value: KStringPtr): void 
    native static _XmlSerializer_addEmptyElement(self: KPointer, name: KStringPtr): void 
    native static _XmlSerializer_setDeclaration(self: KPointer): void 
    native static _XmlSerializer_startElement(self: KPointer, name: KStringPtr): void 
    native static _XmlSerializer_endElement(self: KPointer): void 
    native static _XmlSerializer_setNamespace(self: KPointer, prefix: KStringPtr, namespace_: KStringPtr): void 
    native static _XmlSerializer_setComment(self: KPointer, text: KStringPtr): void 
    native static _XmlSerializer_setCDATA(self: KPointer, text: KStringPtr): void 
    native static _XmlSerializer_setText(self: KPointer, text: KStringPtr): void 
    native static _XmlSerializer_setDocType(self: KPointer, text: KStringPtr): void 
    native static _ParseInfo_getFinalizer(): KPointer 
    native static _ParseInfo_getColumnNumber(self: KPointer): number 
    native static _ParseInfo_getDepth(self: KPointer): number 
    native static _ParseInfo_getLineNumber(self: KPointer): number 
    native static _ParseInfo_getName(self: KPointer): KStringPtr 
    native static _ParseInfo_getNamespace(self: KPointer): KStringPtr 
    native static _ParseInfo_getPrefix(self: KPointer): KStringPtr 
    native static _ParseInfo_getText(self: KPointer): KStringPtr 
    native static _ParseInfo_isEmptyElementTag(self: KPointer): boolean 
    native static _ParseInfo_isWhitespace(self: KPointer): boolean 
    native static _ParseInfo_getAttributeCount(self: KPointer): number 
    native static _XmlPullParser_ctor(buffer: KStringPtr, thisArray: KUint8ArrayPtr, thisLength: KInt): KPointer 
    native static _XmlPullParser_getFinalizer(): KPointer 
    native static _XmlPullParser_parse(self: KPointer, thisArray: KUint8ArrayPtr, thisLength: KInt): void 
    native static _InvokeFinalizer(ptr: KPointer, finalizer: KPointer): void 
    native static _CallCallback(callbackKind: KInt, args: KUint8ArrayPtr, argsSize: KInt): void 
    native static _CallCallbackResourceHolder(holder: KPointer, resourceId: KInt): void 
    native static _CallCallbackResourceReleaser(releaser: KPointer, resourceId: KInt): void 
    native static _CheckArkoalaCallbackEvent(buffer: KUint8ArrayPtr, bufferLength: KInt): KInt 
    native static _HoldArkoalaResource(resourceId: KInt): void 
    native static _ReleaseArkoalaResource(resourceId: KInt): void 
    native static _Utf8ToString(buffer: KUint8ArrayPtr, position: KInt, length: KInt): KStringPtr 
}

let theModule: XMLNativeModule

export function getXMLNativeModule(): XMLNativeModule {
    if (theModule) return theModule
    theModule = new XMLNativeModule()
    return theModule
}

