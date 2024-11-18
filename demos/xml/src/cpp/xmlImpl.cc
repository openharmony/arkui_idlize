/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "xml.h"
#include "parser_impl.h"

OH_XML_XmlSerializerHandle XmlSerializer_constructImpl(const OH_Union_ArrayBuffer_DataView* buffer, const Opt_String* encoding) {
    return {};
}
void XmlSerializer_destructImpl(OH_XML_XmlSerializerHandle thiz) {
}
void XmlSerializer_setAttributesImpl(OH_NativePointer thisPtr, const OH_String* name, const OH_String* value) {
}
void XmlSerializer_addEmptyElementImpl(OH_NativePointer thisPtr, const OH_String* name) {
}
void XmlSerializer_setDeclarationImpl(OH_NativePointer thisPtr) {
}
void XmlSerializer_startElementImpl(OH_NativePointer thisPtr, const OH_String* name) {
}
void XmlSerializer_endElementImpl(OH_NativePointer thisPtr) {
}
void XmlSerializer_setNamespaceImpl(OH_NativePointer thisPtr, const OH_String* prefix, const OH_String* namespace_) {
}
void XmlSerializer_setCommentImpl(OH_NativePointer thisPtr, const OH_String* text) {
}
void XmlSerializer_setCDATAImpl(OH_NativePointer thisPtr, const OH_String* text) {
}
void XmlSerializer_setTextImpl(OH_NativePointer thisPtr, const OH_String* text) {
}
void XmlSerializer_setDocTypeImpl(OH_NativePointer thisPtr, const OH_String* text) {
}
OH_XML_ParseInfoHandle ParseInfo_constructImpl() {
    return {};
}
void ParseInfo_destructImpl(OH_XML_ParseInfoHandle thiz) {
}
OH_Number ParseInfo_getColumnNumberImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number ParseInfo_getDepthImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number ParseInfo_getLineNumberImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String ParseInfo_getNameImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String ParseInfo_getNamespaceImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String ParseInfo_getPrefixImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String ParseInfo_getTextImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean ParseInfo_isEmptyElementTagImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean ParseInfo_isWhitespaceImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number ParseInfo_getAttributeCountImpl(OH_NativePointer thisPtr) {
    return {};
}

OH_XML_XmlPullParserHandle XmlPullParser_constructImpl(const OH_String* buffer, const Opt_String* encoding) {
    const ExpatParser* parser = new ExpatParser(*buffer);
    return (OH_XML_XmlPullParserHandle) parser;
}
void XmlPullParser_destructImpl(OH_XML_XmlPullParserHandle thiz) {
    const ExpatParser* parser = (ExpatParser*) thiz;
    delete parser;
}

void temp_hold(int resId) {}
void temp_release(int resId) {}
void temp_call(const OH_Int32 resourceId, const OH_Boolean value) {}

void XmlPullParser_parseImpl(OH_NativePointer thisPtr, const OH_ParseOptions* option) {
    ExpatParser* parser = (ExpatParser*) thisPtr;
    if (option->tagValueCallbackFunction.tag != OH_TAG_UNDEFINED) {
        parser->setTagValueCallback([&](const char* name, const char* value) {
            auto callback = &(option->tagValueCallbackFunction.value);
            callback->call(callback->resource.resourceId, name, value, {
                {
                    1,
                    temp_hold,
                    temp_release,
                },
                temp_call,
            });
        });
    }
    if (option->attributeValueCallbackFunction.tag != OH_TAG_UNDEFINED) {
        parser->setAttributeValueCallback([&](const char* name, const char* value) {
            auto callback = &(option->attributeValueCallbackFunction.value);
            callback->call(callback->resource.resourceId, name, value, {
                {
                    1,
                    temp_hold,
                    temp_release,
                },
                temp_call,
            });
        });
    }
    // TODO handle other properties from ParseOptions
    parser->parse();
    parser->reset();
}
