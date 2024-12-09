import { int32 } from "@koalaui/common"
import { pointer, KPointer } from "@koalaui/interop"

export enum CallbackKind {
    Kind_Callback_Boolean_Void = 313269291,
    Kind_Callback_EventType_ParseInfo_Boolean = 240036623,
    Kind_Callback_String_String_Boolean = 923368928,
}

export interface XMLNativeModule {
    _XmlSerializer_ctor(buffer: string, thisArray: Uint8Array, thisLength: int32): KPointer 
    _XmlSerializer_getFinalizer(): KPointer 
    _XmlSerializer_setAttributes(self: KPointer, name: string, value: string): void 
    _XmlSerializer_addEmptyElement(self: KPointer, name: string): void 
    _XmlSerializer_setDeclaration(self: KPointer): void 
    _XmlSerializer_startElement(self: KPointer, name: string): void 
    _XmlSerializer_endElement(self: KPointer): void 
    _XmlSerializer_setNamespace(self: KPointer, prefix: string, namespace_: string): void 
    _XmlSerializer_setComment(self: KPointer, text: string): void 
    _XmlSerializer_setCDATA(self: KPointer, text: string): void 
    _XmlSerializer_setText(self: KPointer, text: string): void 
    _XmlSerializer_setDocType(self: KPointer, text: string): void 
    _ParseInfo_getFinalizer(): KPointer 
    _ParseInfo_getColumnNumber(self: KPointer): number 
    _ParseInfo_getDepth(self: KPointer): number 
    _ParseInfo_getLineNumber(self: KPointer): number 
    _ParseInfo_getName(self: KPointer): string 
    _ParseInfo_getNamespace(self: KPointer): string 
    _ParseInfo_getPrefix(self: KPointer): string 
    _ParseInfo_getText(self: KPointer): string 
    _ParseInfo_isEmptyElementTag(self: KPointer): boolean 
    _ParseInfo_isWhitespace(self: KPointer): boolean 
    _ParseInfo_getAttributeCount(self: KPointer): number 
    _XmlPullParser_ctor(buffer: string, thisArray: Uint8Array, thisLength: int32): KPointer 
    _XmlPullParser_getFinalizer(): KPointer 
    _XmlPullParser_parse(self: KPointer, thisArray: Uint8Array, thisLength: int32): void 
    _XmlPullParser_parseXml(self: KPointer, thisArray: Uint8Array, thisLength: int32): void 
    _InvokeFinalizer(ptr: KPointer, finalizer: KPointer): void 
    _CallCallback(callbackKind: int32, args: Uint8Array, argsSize: int32): void 
    _CallCallbackResourceHolder(holder: KPointer, resourceId: int32): void 
    _CallCallbackResourceReleaser(releaser: KPointer, resourceId: int32): void 
    _CheckArkoalaCallbackEvent(buffer: Uint8Array, bufferLength: int32): int32 
    _HoldArkoalaResource(resourceId: int32): void 
    _ReleaseArkoalaResource(resourceId: int32): void 
    _Utf8ToString(buffer: Uint8Array, position: int32, length: int32): string 
}

type NativeModuleType = XMLNativeModule
let theModule: NativeModuleType | undefined = undefined

declare const LOAD_NATIVE: NativeModuleType

export function getXMLNativeModule(): NativeModuleType {
    if (theModule) return theModule
    theModule = LOAD_NATIVE as NativeModuleType
    if (!theModule)
        throw new Error("Cannot load native module")
    return theModule
}

