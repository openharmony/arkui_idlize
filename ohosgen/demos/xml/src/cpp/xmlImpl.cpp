
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

#include <cstdio>

#include "interop-logging.h"
#include "ohos_xml.h"
#include "parser_impl.h"

namespace {
// Constants
constexpr int TEST_VALUE = 42;
constexpr int OTHER_VALUE = 88;
} // namespace

OH_NativePointer ohos_xml_xml_XmlSerializer_constructImpl(
    const OH_OHOS_XML_Union_Buffer_DataView_* buffer, const OH_OHOS_XML_Opt_String* encoding)
{
    return {};
}
void ohos_xml_xml_XmlSerializer_destructImpl(OH_NativePointer thiz) {}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_setAttributesImpl(OH_NativePointer thisPtr, const OH_String* name, const OH_String* value)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_addEmptyElementImpl(OH_NativePointer thisPtr, const OH_String* name)
{
    return {};
}
void ohos_xml_xml_XmlSerializer_setDeclarationImpl(OH_NativePointer thisPtr) {}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_startElementImpl(OH_NativePointer thisPtr, const OH_String* name)
{
    return {};
}
void ohos_xml_xml_XmlSerializer_endElementImpl(OH_NativePointer thisPtr) {}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_setNamespaceImpl(
    OH_NativePointer thisPtr, const OH_String* prefix, const OH_String* namespace_)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_setCommentImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_setCDATAImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_setTextImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlSerializer_setDocTypeImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_addEmptyElementImpl(OH_NativePointer thisPtr, const OH_String* name)
{
    return {};
}
OH_NativePointer ohos_xml_xml_XmlDynamicSerializer_constructImpl(const OH_OHOS_XML_Opt_String* encoding)
{
    return {};
}

void ohos_xml_xml_XmlDynamicSerializer_destructImpl(OH_NativePointer thisPtr) {}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_endElementImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_Buffer ohos_xml_xml_XmlDynamicSerializer_getOutputImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_setAttributesImpl(
    OH_NativePointer thisPtr, const OH_String* name, const OH_String* value)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_setCdataImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_setCommentImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_setDeclarationImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_setDocTypeImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_setNamespaceImpl(
    OH_NativePointer thisPtr, const OH_String* prefix, const OH_String* namespace_)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_setTextImpl(OH_NativePointer thisPtr, const OH_String* text)
{
    return {};
}
OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlDynamicSerializer_startElementImpl(OH_NativePointer thisPtr, const OH_String* name)
{
    return {};
}
OH_NativePointer ohos_xml_xml_ParseInfo_constructImpl()
{
    return {};
}
void ohos_xml_xml_ParseInfo_destructImpl(OH_NativePointer thiz) {}
OH_Number ohos_xml_xml_ParseInfo_getColumnNumberImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_Number ohos_xml_xml_ParseInfo_getDepthImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_Number ohos_xml_xml_ParseInfo_getLineNumberImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_String ohos_xml_xml_ParseInfo_getNameImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_String ohos_xml_xml_ParseInfo_getNamespaceImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_String ohos_xml_xml_ParseInfo_getPrefixImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_String ohos_xml_xml_ParseInfo_getTextImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_Boolean ohos_xml_xml_ParseInfo_isEmptyElementTagImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_Boolean ohos_xml_xml_ParseInfo_isWhitespaceImpl(OH_NativePointer thisPtr)
{
    return {};
}
OH_Number ohos_xml_xml_ParseInfo_getAttributeCountImpl(OH_NativePointer thisPtr)
{
    return {};
}

OH_NativePointer ohos_xml_xml_XmlPullParser_constructImpl(
    const OH_OHOS_XML_Union_Buffer_DataView_* bufferOrDataView, const OH_OHOS_XML_Opt_String* encoding)
{
    OH_Buffer buffer = bufferOrDataView->value0;
    const ExpatParser* parser = new ExpatParser(buffer);
    return (OH_NativePointer)parser;
}

void ohos_xml_xml_XmlPullParser_destructImpl(OH_NativePointer thiz)
{
    const ExpatParser* parser = (ExpatParser*)thiz;
    delete parser;
}

void TempHold(int resId) {}
void TempRelease(int resId) {}
void TempCall(const OH_Int32 resourceId, const OH_Boolean value) {}
void TempCallSync(const OH_OHOS_XML_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value) {}

OH_OHOS_XML_ThrowsWrapper_Void ohos_xml_xml_XmlPullParser_parseXmlImpl(OH_NativePointer thisPtr, const OH_OHOS_XML_ParseOptions* option)
{
    ExpatParser* parser = (ExpatParser*)thisPtr;
    if (option->tagValueCallbackFunction.tag != INTEROP_TAG_UNDEFINED) {
        parser->SetTagValueCallback([&](const char* name, const char* value) {
            auto callback = &(option->tagValueCallbackFunction.value);
            callback->call(callback->resource.resourceId, OH_String { name, (OH_Int32)strlen(name) },
                OH_String { value, (OH_Int32)strlen(value) },
                {
                    {
                        1,
                        TempHold,
                        TempRelease,
                    },
                    TempCall,
                    TempCallSync,
                });
        });
    }
    if (option->attributeValueCallbackFunction.tag != INTEROP_TAG_UNDEFINED) {
        parser->SetAttributeValueCallback([&](const char* name, const char* value) {
            auto callback = &(option->attributeValueCallbackFunction.value);
            callback->call(callback->resource.resourceId, OH_String { name, (OH_Int32)strlen(name) },
                OH_String { value, (OH_Int32)strlen(value) },
                {
                    {
                        1,
                        TempHold,
                        TempRelease,
                    },
                    TempCall,
                    TempCallSync,
                });
        });
    }
    // Improve: handle other properties from ParseOptions
    parser->Parse();
    parser->Reset();
    return { .hasException = false };
}
class TestPromiseHandler {
private:
    OH_OHOS_XML_Callback_Opt_Number_Opt_Array_String_Void callback;
    int result = 0;

public:
    explicit TestPromiseHandler(OH_OHOS_XML_Callback_Opt_Number_Opt_Array_String_Void callback) : callback(callback)
    {
        callback.resource.hold(callback.resource.resourceId);
    }

    void Execute()
    {
        result = TEST_VALUE;
    }

    void Complete()
    {
        callback.call(callback.resource.resourceId,
            { .tag = INTEROP_TAG_INT32, .value = { .tag = INTEROP_TAG_INT32, .i32 = TEST_VALUE } },
            { .tag = INTEROP_TAG_UNDEFINED });
        callback.resource.release(callback.resource.resourceId);
        delete this;
    }
};
static void DoPromiseExecute(void* handler)
{
    ((TestPromiseHandler*)handler)->Execute();
}
static void DoPromiseComplete(void* handler)
{
    ((TestPromiseHandler*)handler)->Complete();
}
void ohos_xml_xml_returnPromiseImpl(OH_OHOS_XML_VMContext vmContext, OH_OHOS_XML_AsyncWorkerPtr asyncWorker,
    const OH_OHOS_XML_Callback_Opt_Number_Opt_Array_String_Void* out)
{
    auto work = asyncWorker->createWork(vmContext, new TestPromiseHandler(*out), DoPromiseExecute, DoPromiseComplete);
    work.queue(work.workId);
}
OH_OHOS_XML_Point ohos_xml_xml_getPointImpl()
{
    return { .x = { .tag = INTEROP_TAG_INT32, .i32 = TEST_VALUE },
        .y = { .tag = INTEROP_TAG_INT32, .i32 = OTHER_VALUE } };
}

void xml_MapTest_callHolderImpl(OH_NativePointer thisPtr) {}
void xml_ParseInfo_callHolderImpl(OH_NativePointer thisPtr) {}
void xml_XmlDynamicSerializer_callHolderImpl(OH_NativePointer thisPtr) {}
void xml_XmlPullParser_callHolderImpl(OH_NativePointer thisPtr) {}
void xml_XmlSerializer_callHolderImpl(OH_NativePointer thisPtr) {}

class ClassStub {};

OH_NativePointer ohos_xml_xml_MapTest_constructImpl()
{
    return (OH_NativePointer)(new ClassStub());
}
void ohos_xml_xml_MapTest_destructImpl(OH_NativePointer thiz)
{
    delete (ClassStub*)thiz;
}
OH_Number ohos_xml_xml_MapTest_testSerializeImpl(OH_NativePointer thisPtr, const OH_OHOS_XML_Map_String_Number* options)
{
    int sum = 0;
    printf("map->size %d\n", options->size);
    for (int i = 0; i < options->size; i++) {
        printf("  key %s, value %d\n", options->keys[i].chars, options->values[i].i32);
        sum += options->values[i].i32;
    }
    return {
        .tag = INTEROP_TAG_INT32,
        .i32 = (int32_t)sum,
    };
}
