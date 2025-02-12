import { int32 } from "@koalaui/common"
import { pointer, KPointer, loadNativeModuleLibrary } from "@koalaui/interop"

export enum CallbackKind {
    Kind_Callback_Boolean_Void = 313269291,
    Kind_Callback_EventType_ParseInfo_Boolean = 240036623,
    Kind_Callback_String_String_Boolean = 923368928,
}

export class XMLNativeModule {
    private static _isLoaded: boolean = false
    private static _LoadOnce(): boolean {
        if ((this._isLoaded) == (false))
        {
            this._isLoaded = true
            loadNativeModuleLibrary("XMLNativeModule", XMLNativeModule)
            return true
        }
        return false
    }
    static _XmlSerializer_ctor(thisArray: Uint8Array, thisLength: int32): KPointer {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_ctor(thisArray, thisLength)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_getFinalizer(): KPointer {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_getFinalizer()
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setAttributes(self: KPointer, name: string, value: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_setAttributes(self, name, value)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_addEmptyElement(self: KPointer, name: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_addEmptyElement(self, name)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setDeclaration(self: KPointer): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_setDeclaration(self)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_startElement(self: KPointer, name: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_startElement(self, name)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_endElement(self: KPointer): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_endElement(self)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setNamespace(self: KPointer, prefix: string, namespace_: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_setNamespace(self, prefix, namespace_)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setComment(self: KPointer, text: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_setComment(self, text)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setCDATA(self: KPointer, text: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_setCDATA(self, text)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setText(self: KPointer, text: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_setText(self, text)
        }
        throw new Error("Not implemented")
    }
    static _XmlSerializer_setDocType(self: KPointer, text: string): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlSerializer_setDocType(self, text)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_ctor(): KPointer {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_ctor()
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getFinalizer(): KPointer {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getFinalizer()
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getColumnNumber(self: KPointer): number {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getColumnNumber(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getDepth(self: KPointer): number {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getDepth(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getLineNumber(self: KPointer): number {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getLineNumber(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getName(self: KPointer): string {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getName(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getNamespace(self: KPointer): string {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getNamespace(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getPrefix(self: KPointer): string {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getPrefix(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getText(self: KPointer): string {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getText(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_isEmptyElementTag(self: KPointer): boolean {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_isEmptyElementTag(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_isWhitespace(self: KPointer): boolean {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_isWhitespace(self)
        }
        throw new Error("Not implemented")
    }
    static _ParseInfo_getAttributeCount(self: KPointer): number {
        if ((this._LoadOnce()) == (true))
        {
            return this._ParseInfo_getAttributeCount(self)
        }
        throw new Error("Not implemented")
    }
    static _XmlPullParser_ctor(thisArray: Uint8Array, thisLength: int32): KPointer {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlPullParser_ctor(thisArray, thisLength)
        }
        throw new Error("Not implemented")
    }
    static _XmlPullParser_getFinalizer(): KPointer {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlPullParser_getFinalizer()
        }
        throw new Error("Not implemented")
    }
    static _XmlPullParser_parse(self: KPointer, thisArray: Uint8Array, thisLength: int32): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlPullParser_parse(self, thisArray, thisLength)
        }
        throw new Error("Not implemented")
    }
    static _XmlPullParser_parseXml(self: KPointer, thisArray: Uint8Array, thisLength: int32): void {
        if ((this._LoadOnce()) == (true))
        {
            return this._XmlPullParser_parseXml(self, thisArray, thisLength)
        }
        throw new Error("Not implemented")
    }

    static _MaterializeBuffer(data: KPointer, length: int32, resourceId: int32, holdPtr: KPointer, releasePtr: KPointer): ArrayBuffer {
        if ((this._LoadOnce()) == (true))
        {
            return this._MaterializeBuffer(data, length, resourceId, holdPtr, releasePtr)
        }
        throw new Error("Not implemented")
    }
}
