/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "xml.h"

OH_XML_XmlSerializerHandle XmlSerializer_constructImpl(const OH_Buffer* buffer, const Opt_String* encoding) {
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
OH_XML_XmlPullParserHandle XmlPullParser_constructImpl(const OH_Buffer* buffer, const Opt_String* encoding) {
    return {};
}
void XmlPullParser_destructImpl(OH_XML_XmlPullParserHandle thiz) {
}
void XmlPullParser_parseImpl(OH_NativePointer thisPtr, const OH_XML_ParseOptions* option) {
}
void XmlPullParser_parseXmlImpl(OH_NativePointer thisPtr, const OH_XML_ParseOptions* option) {
}