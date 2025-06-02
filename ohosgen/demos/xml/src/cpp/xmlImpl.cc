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

#include <stdio.h>

#include "ohos_xml.h"
#include "parser_impl.h"

#include "interop-logging.h"

OH_OHOS_XML_xml_XmlSerializerHandle xml_XmlSerializer_constructImpl(const OH_Buffer* buffer, const Opt_String* encoding) {
    return {};
}
void xml_XmlSerializer_destructImpl(OH_OHOS_XML_xml_XmlSerializerHandle thiz) {
}
void xml_XmlSerializer_setAttributesImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* name, const OH_String* value) {
}
void xml_XmlSerializer_addEmptyElementImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* name) {
}
void xml_XmlSerializer_setDeclarationImpl(OH_NativePointer thisPtr) {
}
void xml_XmlSerializer_startElementImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* name) {
}
void xml_XmlSerializer_endElementImpl(OH_NativePointer thisPtr) {
}
void xml_XmlSerializer_setNamespaceImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* prefix, const OH_String* namespace_) {
}
void xml_XmlSerializer_setCommentImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlSerializer_setCDATAImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlSerializer_setTextImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlSerializer_setDocTypeImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlDynamicSerializer_addEmptyElementImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* name) {
}
OH_OHOS_XML_xml_XmlDynamicSerializerHandle xml_XmlDynamicSerializer_constructImpl(const Opt_String* encoding) {
    return {};
}
void xml_XmlDynamicSerializer_destructImpl(OH_OHOS_XML_xml_XmlDynamicSerializerHandle thisPtr) {
}
void xml_XmlDynamicSerializer_endElementImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr) {
}
OH_Buffer xml_XmlDynamicSerializer_getOutputImpl(OH_NativePointer thisPtr) {
    return {};
}
void xml_XmlDynamicSerializer_setAttributesImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* name, const OH_String* value) {
}
void xml_XmlDynamicSerializer_setCdataImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlDynamicSerializer_setCommentImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlDynamicSerializer_setDeclarationImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr) {
}
void xml_XmlDynamicSerializer_setDocTypeImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlDynamicSerializer_setNamespaceImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* prefix, const OH_String* namespace_) {
}
void xml_XmlDynamicSerializer_setTextImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* text) {
}
void xml_XmlDynamicSerializer_startElementImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_String* name) {
}
OH_OHOS_XML_xml_ParseInfoHandle xml_ParseInfo_constructImpl() {
    return {};
}
void xml_ParseInfo_destructImpl(OH_OHOS_XML_xml_ParseInfoHandle thiz) {
}
OH_Number xml_ParseInfo_getColumnNumberImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number xml_ParseInfo_getDepthImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number xml_ParseInfo_getLineNumberImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String xml_ParseInfo_getNameImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String xml_ParseInfo_getNamespaceImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String xml_ParseInfo_getPrefixImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String xml_ParseInfo_getTextImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean xml_ParseInfo_isEmptyElementTagImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Boolean xml_ParseInfo_isWhitespaceImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_Number xml_ParseInfo_getAttributeCountImpl(OH_NativePointer thisPtr) {
    return {};
}

OH_OHOS_XML_xml_XmlPullParserHandle xml_XmlPullParser_constructImpl(const OH_Buffer* buffer, const Opt_String* encoding) {
    const ExpatParser* parser = new ExpatParser(*buffer);
    return (OH_OHOS_XML_xml_XmlPullParserHandle) parser;
}
void xml_XmlPullParser_destructImpl(OH_OHOS_XML_xml_XmlPullParserHandle thiz) {
    const ExpatParser* parser = (ExpatParser*) thiz;
    delete parser;
}

void temp_hold(int resId) {}
void temp_release(int resId) {}
void temp_call(const OH_Int32 resourceId, const OH_Boolean value) {}
void temp_call_sync(const OH_OHOS_XML_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value) {}

void xml_XmlPullParser_parseImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_OHOS_XML_xml_ParseOptions* option) {
    ExpatParser* parser = (ExpatParser*) thisPtr;
    if (option->tagValueCallbackFunction.tag != INTEROP_TAG_UNDEFINED) {
        parser->setTagValueCallback([&](const char* name, const char* value) {
            auto callback = &(option->tagValueCallbackFunction.value);
            callback->call(callback->resource.resourceId, 
                OH_String { name, (OH_Int32)strlen(name) }, 
                OH_String { value, (OH_Int32)strlen(value) }, {
                {
                    1,
                    temp_hold,
                    temp_release,
                },
                temp_call,
                temp_call_sync,
            });
        });
    }
    if (option->attributeValueCallbackFunction.tag != INTEROP_TAG_UNDEFINED) {
        parser->setAttributeValueCallback([&](const char* name, const char* value) {
            auto callback = &(option->attributeValueCallbackFunction.value);
            callback->call(callback->resource.resourceId, 
                OH_String { name, (OH_Int32)strlen(name) }, 
                OH_String { value, (OH_Int32)strlen(value) }, {
                {
                    1,
                    temp_hold,
                    temp_release,
                },
                temp_call,
                temp_call_sync,
            });
        });
    }
    // TODO handle other properties from ParseOptions
    parser->parse();
    parser->reset();
}
void xml_XmlPullParser_parseXmlImpl(OH_OHOS_XML_VMContext vmContext, OH_NativePointer thisPtr, const OH_OHOS_XML_xml_ParseOptions* option) {
}
class TestPromiseHandler {
private:
    OHOS_XML_Callback_Opt_Number_Opt_Array_String_Void callback;
    int result = 0;
public:
    TestPromiseHandler(OHOS_XML_Callback_Opt_Number_Opt_Array_String_Void callback): callback(callback) {
        callback.resource.hold(callback.resource.resourceId);
    }

    void Execute() {
        result = 42;
    }

    void Complete() {
        callback.call(callback.resource.resourceId,
            { .tag = INTEROP_TAG_INT32, .value = { .tag = INTEROP_TAG_INT32, .i32 = 42 } },
            { .tag = INTEROP_TAG_UNDEFINED }
        );
        callback.resource.release(callback.resource.resourceId);
        delete this;
    }
};
static void DoPromiseExecute(void* handler) {
    ((TestPromiseHandler*)handler)->Execute();
}
static void DoPromiseComplete(void* handler) {
    ((TestPromiseHandler*)handler)->Complete();
}
void GlobalScope_xml_returnPromiseImpl(OH_OHOS_XML_VMContext vmContext, OH_OHOS_XML_AsyncWorkerPtr asyncWorker, const OHOS_XML_Callback_Opt_Number_Opt_Array_String_Void* out) {
    auto work = asyncWorker->createWork(vmContext, new TestPromiseHandler(*out), DoPromiseExecute, DoPromiseComplete);
    work.queue(work.workId);
}
OH_OHOS_XML_Point GlobalScope_xml_getPointImpl() {
    return {
        .x = { .tag = INTEROP_TAG_INT32, .i32 = 42 },
        .y = { .tag = INTEROP_TAG_INT32, .i32 = 88 }
    };
}


class ClassStub {};

OH_OHOS_XML_xml_MapTestHandle xml_MapTest_constructImpl() {
    return (OH_OHOS_XML_xml_MapTestHandle)(new ClassStub());
}
void xml_MapTest_destructImpl(OH_OHOS_XML_xml_MapTestHandle thiz) {
    delete (ClassStub*)thiz;
}
OH_Number xml_MapTest_testSerializeImpl(OH_NativePointer thisPtr, const Map_String_Number* options) {
    int sum = 0;
    printf("map->size %d\n", options->size);
    for (int i = 0; i < options->size; i++) {
       printf("  key %s, value %d\n", options->keys[i].chars, options->values[i].i32);
       sum += options->values[i].i32;
    }
    return {
        .tag=INTEROP_TAG_INT32,
        .i32 = (int32_t)sum,
    };
}
