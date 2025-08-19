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

#include "ohos_web_webview.h"

#define KOALA_INTEROP_MODULE OHOS_WEB_WEBVIEWNativeModule
#include "common-interop.h"
#include "callback-resource.h"
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include <unordered_map>

#if defined(KOALA_USE_PANDA_VM)
    #if defined(KOALA_ETS_NAPI)
        KOALA_ETS_INTEROP_MODULE_CLASSPATH(KOALA_INTEROP_MODULE, KOALA_QUOTE(ETS_MODULE_CLASSPATH_PREFIX) KOALA_QUOTE(KOALA_INTEROP_MODULE));
    #elif defined(KOALA_ANI)
        KOALA_ANI_INTEROP_MODULE_CLASSPATH(KOALA_INTEROP_MODULE, KOALA_QUOTE(ETS_MODULE_CLASSPATH_PREFIX) KOALA_QUOTE(KOALA_INTEROP_MODULE));
    #endif
#endif
CustomDeserializer * DeserializerBase::customDeserializers = nullptr;

typedef enum CallbackKind {
    Kind_Callback_Boolean_Void = 313269291,
    Kind_Callback_NativeMediaPlayerBridge_Void = -905555770,
    Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void = -1820868578,
    Kind_Callback_Opt_Array_String_Void = -543655128,
    Kind_Callback_Opt_Boolean_Opt_Array_String_Void = -814714393,
    Kind_Callback_Opt_Buffer_Opt_Array_String_Void = 184663715,
    Kind_Callback_Opt_I32_Opt_Array_String_Void = 471552267,
    Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void = -333332968,
    Kind_Callback_Opt_PdfData_Opt_Array_String_Void = 460307265,
    Kind_Callback_Opt_String_Opt_Array_String_Void = 1813490422,
    Kind_Callback_Void = -1867723152,
    Kind_Callback_WebDownloadItem_Void = -1731593282,
    Kind_Callback_WebMessage_Void = -164095148,
    Kind_Callback_WebMessageExt_Void = 60565725,
    Kind_Callback_WebSchemeHandlerRequest_Void = 2045455363,
    Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean = -1343223282,
    Kind_CreateNativeMediaPlayerCallback = 643278217,
    Kind_ResumePlayerFn = -1804515632,
    Kind_SuspendPlayerFn = -2006452349,
} CallbackKind;

OH_NativePointer getManagedCallbackCaller(CallbackKind kind);
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind);

#include <tuple>
#include <string>

#include "interop-types.h"
#include "dynamic-loader.h"
#include "interop-logging.h"
#include "interop-utils.h"

#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#include <stdint.h>
// Improve: remove after migration to OH_AnyAPI to be consistant between arkoala and ohos apis
struct Ark_AnyAPI {
    int32_t version;
};
struct OH_AnyAPI {
    int32_t version;
};
#endif
#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#include <stdint.h>
#define GENERIC_SERVICE_API_VERSION 1
enum GENERIC_SERVICE_APIKind {
    GENERIC_SERVICE_API_KIND = 14,
};

typedef struct ServiceLogger {
    void (*startGroupedLog)(int kind);
    void (*stopGroupedLog)(int kind);
    void (*appendGroupedLog)(int kind, const char* str);
    const char* (*getGroupedLog)(int kind);
    int (*needGroupedLog)(int kind);
} ServiceLogger;

typedef struct GenericServiceAPI {
    int32_t version;
    void (*setLogger)(const ServiceLogger* logger);
} GenericServiceAPI;
#endif

// Improve: rework for generic OHOS case.
void* FindModule(int kind) {
    std::tuple<const char*, bool> candidates[] = {
        { "ace_compatible", true},
        { "ace", true },
        { "ace_compatible_mock", true},
        { nullptr, false }
    };
    char* envValue = getenv("ACE_LIBRARY_PATH");
    std::string prefix = envValue ? std::string(envValue) : "";
    LOGE("Search ACE in \"%s\" (env ACE_LIBRARY_PATH) for API %d", prefix.c_str(), kind);
    for (auto* candidate = candidates; std::get<0>(*candidate); candidate++) {
        std::string name = std::get<0>(*candidate);
        if (std::get<1>(*candidate)) {
            name = libName(name.c_str());
        }
        std::string libraryName = prefix + "/" + name;
        void* module = loadLibrary(libraryName);
        if (module) {
            LOGE("ACE module at: %s", libraryName.c_str());
            return module;
        } else {
            // LOGE("Cannot find ACE module: %s %s", libraryName.c_str(), libraryError());
        }
    }
    return nullptr;
}

static const int API_KIND_MAX = 100;
static const OH_AnyAPI* impls[API_KIND_MAX + 1] = { 0 };
const char* getArkAnyAPIFuncName = "GENERATED_GetArkAnyAPI";

#ifdef KOALA_LIBACE_LINKED
extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version);
#endif
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result) {
    if (kind > API_KIND_MAX) {
        INTEROP_FATAL("Try to get api with kind more than expected: kind=%d, max=%d", kind, API_KIND_MAX);
    }
    if (!impls[kind]) {
        static const GroupLogger* logger = GetDefaultLogger();

        const OH_AnyAPI* impl = nullptr;
        typedef const OH_AnyAPI* (*GetAPI_t)(int, int);

#ifdef KOALA_LIBACE_LINKED
        static GetAPI_t getAPI = GENERATED_GetArkAnyAPI;
#else
        static GetAPI_t getAPI = nullptr;
#endif

        char* envValue = getenv("__LIBACE_ENTRY_POINT");
        if (envValue) {
            long long value = strtoll(envValue, NULL, 16);
            if (value != 0) {
                getAPI = reinterpret_cast<GetAPI_t>(static_cast<uintptr_t>(value));
            }
        }
        if (getAPI == nullptr) {
            void* module = FindModule(kind);
            if (!module) {
                if (result)
                    *result = "Cannot find dynamic module";
                else
                    LOG("Cannot find dynamic module");
                return nullptr;
            }
            getAPI = reinterpret_cast<GetAPI_t>(findSymbol(module, getArkAnyAPIFuncName));
            if (!getAPI) {
                if (result)
                    *result = std::string("Cannot find ") + getArkAnyAPIFuncName;
                else
                    LOGE("Cannot find %s", getArkAnyAPIFuncName);
                return nullptr;
            }
        }
        // Provide custom logger and callback caller to loaded libs.
        auto service = reinterpret_cast<const GenericServiceAPI*>((*getAPI)(GENERIC_SERVICE_API_KIND, GENERIC_SERVICE_API_VERSION));
        if (service) {
            if (logger) service->setLogger(reinterpret_cast<const ServiceLogger*>(logger));
        }

        impl = (*getAPI)(kind, version);
        if (!impl) {
            if (result)
                *result = "getAPI() returned null";
            else
                LOG("getAPI() returned null")
            return nullptr;
        }
        if (impl->version != version) {
            if (result) {
                char buffer[256];
                interop_snprintf(buffer, sizeof(buffer), "FATAL: API version mismatch, expected %d got %d",
                    version, impl->version);
                *result = buffer;
            } else {
                LOGE("API version mismatch for API %d: expected %d got %d", kind, version, impl->version);
            }
            return nullptr;
        }
        impls[kind] = impl;
    }
    return impls[kind];
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_Int32& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Opt_Int32* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_cert_X509Cert& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_cert_X509Cert value);

template <>
inline void WriteToString(std::string* result, const Array_cert_X509Cert* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_WEB_WEBVIEW_cert_X509Cert, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, value->array[i]);
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_cert_X509Cert* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_cert_X509Cert& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_String& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_String* value);

template <>
inline void WriteToString(std::string* result, const Array_String* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_String, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_String*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_String* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_Union_String_Number_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean* value);

template <>
inline void WriteToString(std::string* result, const Array_Union_String_Number_Boolean* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_Union_String_Number_Boolean* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_Union_String_Number_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_webview_MediaSourceInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo value);

template <>
inline void WriteToString(std::string* result, const Array_webview_MediaSourceInfo* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, value->array[i]);
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_webview_MediaSourceInfo* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_webview_MediaSourceInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_webview_OfflineResourceMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap* value);

template <>
inline void WriteToString(std::string* result, const Array_webview_OfflineResourceMap* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_webview_OfflineResourceMap* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_webview_OfflineResourceMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_webview_WebCustomScheme& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme* value);

template <>
inline void WriteToString(std::string* result, const Array_webview_WebCustomScheme* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_webview_WebCustomScheme* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_webview_WebCustomScheme& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_webview_WebHeader& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebHeader* value);

template <>
inline void WriteToString(std::string* result, const Array_webview_WebHeader* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_WEB_WEBVIEW_webview_WebHeader, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_WEB_WEBVIEW_webview_WebHeader*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_webview_WebHeader* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_webview_WebHeader& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Array_webview_WebMessagePort& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort value);

template <>
inline void WriteToString(std::string* result, const Array_webview_WebMessagePort* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, value->array[i]);
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_webview_WebMessagePort* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Array_webview_WebMessagePort& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Map_String_String& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
void WriteToString(std::string* result, const OH_String* value);
template <>
void WriteToString(std::string* result, const OH_String* value);
template <>
inline void WriteToString(std::string* result, const Map_String_String* value) {
    result->append("{");
    int32_t count = value->size;
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_String*>(&value->keys[i]));
        result->append(": ");
        WriteToString(result, const_cast<const OH_String*>(&value->values[i]));
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Map_String_String* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Map_String_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_Boolean& value)
{
    return INTEROP_RUNTIME_BOOLEAN;
}
template <>
inline void WriteToString(std::string* result, const Opt_Boolean* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_Buffer& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Opt_Buffer* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Buffer& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline void WriteToString(std::string* result, const Opt_CustomObject* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_Float64& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Opt_Float64* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_Number& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const Opt_Number* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline void WriteToString(std::string* result, const Opt_Object* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_cert_X509Cert& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_cert_X509Cert value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_X509Cert* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_cert_X509Cert& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_image_PixelMap value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_image_PixelMap* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintDocumentAdapter* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_print_PrintDocumentAdapter& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_WebNetErrorList& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_WebNetErrorList value) {
    result->append("OH_OHOS_WEB_WEBVIEW_WebNetErrorList(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_WebNetErrorList* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_WebNetErrorList& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_BackForwardCacheOptions* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_BackForwardCacheOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_BackForwardCacheSupportedFeatures* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_BackForwardCacheSupportedFeatures& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_BackForwardList& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_BackForwardList value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_BackForwardList* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_BackForwardList& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_CacheOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_CacheOptions* value) {
    result->append("{");
    // Array_webview_WebHeader responseHeaders
    result->append(".responseHeaders=");
    WriteToString(result, &value->responseHeaders);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_CacheOptions* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_CacheOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_JsMessageExt* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_JsMessageExt& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_JsMessageType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_JsMessageType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_JsMessageType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_JsMessageType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_JsMessageType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_MediaError& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_MediaError value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_MediaError(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_MediaError* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_MediaError& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_MediaPlaybackState* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_MediaPlaybackState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_MediaType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_MediaType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_MediaType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_MediaType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_MediaType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_NativeMediaPlayerHandler* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_NativeMediaPlayerHandler& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_NetworkState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_NetworkState value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_NetworkState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_NetworkState* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_NetworkState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_OfflineResourceType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_OfflineResourceType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_PdfData& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_PdfData value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_PdfData* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_PdfData& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_PlaybackStatus* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_PlaybackStatus& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_Preload& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_Preload value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_Preload(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_Preload* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_Preload& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_PressureLevel& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_PressureLevel value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_PressureLevel(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_PressureLevel* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_PressureLevel& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_ReadyState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_ReadyState value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_ReadyState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_ReadyState* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_ReadyState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_RectEvent& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_RectEvent* value) {
    result->append("{");
    // OH_Float64 x
    result->append(".x=");
    WriteToString(result, value->x);
    // OH_Float64 y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, value->y);
    // OH_Float64 width
    result->append(", ");
    result->append(".width=");
    WriteToString(result, value->width);
    // OH_Float64 height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, value->height);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_RectEvent* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_RectEvent& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_RenderProcessMode* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_RenderProcessMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset* value) {
    result->append("{");
    // OH_Float64 x
    result->append(".x=");
    WriteToString(result, value->x);
    // OH_Float64 y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, value->y);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_ScrollOffset* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_ScrollOffset& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_ScrollType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_ScrollType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_ScrollType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_ScrollType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_ScrollType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_SecureDnsMode* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_SecureDnsMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_SecurityLevel* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_SecurityLevel& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_SourceType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_SourceType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_SourceType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_SourceType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_SourceType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_SuspendType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_SuspendType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_SuspendType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_SuspendType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_SuspendType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebDownloadDelegate* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebDownloadDelegate& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebDownloadErrorCode* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebDownloadErrorCode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebDownloadItem* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebDownloadItem& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebDownloadState* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebDownloadState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebHitTestType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebHitTestType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebHttpBodyStream* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebHttpBodyStream& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebMessageExt* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebMessageExt& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebMessageType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_WebMessageType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebMessageType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebMessageType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebResourceHandler* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebResourceHandler& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebResourceType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceType value) {
    result->append("OH_OHOS_WEB_WEBVIEW_webview_WebResourceType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebResourceType* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebResourceType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebSchemeHandler* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebSchemeHandler& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebSchemeHandlerRequest* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebSchemeHandlerRequest& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebSchemeHandlerResponse* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebSchemeHandlerResponse& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebviewController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebviewController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebviewController* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebviewController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_String& value)
{
    return INTEROP_RUNTIME_STRING;
}
template <>
inline void WriteToString(std::string* result, const Opt_String* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_AsyncCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_AsyncCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_AsyncCallback* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_AsyncCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Boolean_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Boolean_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Boolean_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Boolean_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_Callback_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_ResumePlayerFn& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_ResumePlayerFn* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_BusinessError& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_BusinessError value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_BusinessError* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_BusinessError& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_WEB_WEBVIEW_Union_String_Buffer: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_String
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_Buffer
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_String_Buffer* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Union_String_Buffer& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_String
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_Number
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    // OH_Boolean
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, value->value2);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_String_Number_Boolean* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Union_String_Number_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_Union_String_Resource& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_WEB_WEBVIEW_Union_String_Resource: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_Union_String_Resource* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_String
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_CustomObject
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_String_Resource* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_Union_String_Resource& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_WebMessage& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_WEB_WEBVIEW_WebMessage: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_WebMessage* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Buffer
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, value->value0);
    }
    // OH_String
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_WebMessage* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_WebMessage& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_HistoryItem& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_HistoryItem* value) {
    result->append("{");
    // OH_OHOS_WEB_WEBVIEW_image_PixelMap icon
    result->append(".icon=");
    WriteToString(result, value->icon);
    // OH_String historyUrl
    result->append(", ");
    result->append(".historyUrl=");
    WriteToString(result, &value->historyUrl);
    // OH_String historyRawUrl
    result->append(", ");
    result->append(".historyRawUrl=");
    WriteToString(result, &value->historyRawUrl);
    // OH_String title
    result->append(", ");
    result->append(".title=");
    WriteToString(result, &value->title);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_HistoryItem* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_HistoryItem& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_HitTestValue& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_HitTestValue* value) {
    result->append("{");
    // OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType type
    result->append(".type=");
    WriteToString(result, value->type);
    // OH_String extra
    result->append(", ");
    result->append(".extra=");
    WriteToString(result, &value->extra);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_HitTestValue* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_HitTestValue& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_MediaSourceInfo* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_MediaSourceInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_NativeMediaPlayerBridge* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_NativeMediaPlayerBridge& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_NativeMediaPlayerSurfaceInfo* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_NativeMediaPlayerSurfaceInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap* value) {
    result->append("{");
    // Array_String urlList
    result->append(".urlList=");
    WriteToString(result, &value->urlList);
    // OH_Buffer resource
    result->append(", ");
    result->append(".resource=");
    WriteToString(result, value->resource);
    // Array_webview_WebHeader responseHeaders
    result->append(", ");
    result->append(".responseHeaders=");
    WriteToString(result, &value->responseHeaders);
    // OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType type
    result->append(", ");
    result->append(".type=");
    WriteToString(result, value->type);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_OfflineResourceMap* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_OfflineResourceMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration* value) {
    result->append("{");
    // OH_Float64 width
    result->append(".width=");
    WriteToString(result, value->width);
    // OH_Float64 height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, value->height);
    // OH_Float64 marginTop
    result->append(", ");
    result->append(".marginTop=");
    WriteToString(result, value->marginTop);
    // OH_Float64 marginBottom
    result->append(", ");
    result->append(".marginBottom=");
    WriteToString(result, value->marginBottom);
    // OH_Float64 marginRight
    result->append(", ");
    result->append(".marginRight=");
    WriteToString(result, value->marginRight);
    // OH_Float64 marginLeft
    result->append(", ");
    result->append(".marginLeft=");
    WriteToString(result, value->marginLeft);
    // OH_Float64 scale
    result->append(", ");
    result->append(".scale=");
    WriteToString(result, &value->scale);
    // OH_Boolean shouldPrintBackground
    result->append(", ");
    result->append(".shouldPrintBackground=");
    WriteToString(result, &value->shouldPrintBackground);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_PdfConfiguration* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_PdfConfiguration& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_RequestInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_RequestInfo* value) {
    result->append("{");
    // OH_String url
    result->append(".url=");
    WriteToString(result, &value->url);
    // OH_String method
    result->append(", ");
    result->append(".method=");
    WriteToString(result, &value->method);
    // OH_String formData
    result->append(", ");
    result->append(".formData=");
    WriteToString(result, &value->formData);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_RequestInfo* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_RequestInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo* value) {
    result->append("{");
    // OH_String id
    result->append(".id=");
    WriteToString(result, &value->id);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_SnapshotInfo* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_SnapshotInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult* value) {
    result->append("{");
    // OH_String id
    result->append(".id=");
    WriteToString(result, &value->id);
    // OH_Boolean status
    result->append(", ");
    result->append(".status=");
    WriteToString(result, &value->status);
    // OH_OHOS_WEB_WEBVIEW_image_PixelMap imagePixelMap
    result->append(", ");
    result->append(".imagePixelMap=");
    WriteToString(result, &value->imagePixelMap);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_SnapshotResult* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_SnapshotResult& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme* value) {
    result->append("{");
    // OH_String schemeName
    result->append(".schemeName=");
    WriteToString(result, &value->schemeName);
    // OH_Boolean isSupportCORS
    result->append(", ");
    result->append(".isSupportCORS=");
    WriteToString(result, value->isSupportCORS);
    // OH_Boolean isSupportFetch
    result->append(", ");
    result->append(".isSupportFetch=");
    WriteToString(result, value->isSupportFetch);
    // OH_Boolean isStandard
    result->append(", ");
    result->append(".isStandard=");
    WriteToString(result, &value->isStandard);
    // OH_Boolean isLocal
    result->append(", ");
    result->append(".isLocal=");
    WriteToString(result, &value->isLocal);
    // OH_Boolean isDisplayIsolated
    result->append(", ");
    result->append(".isDisplayIsolated=");
    WriteToString(result, &value->isDisplayIsolated);
    // OH_Boolean isSecure
    result->append(", ");
    result->append(".isSecure=");
    WriteToString(result, &value->isSecure);
    // OH_Boolean isCspBypassing
    result->append(", ");
    result->append(".isCspBypassing=");
    WriteToString(result, &value->isCspBypassing);
    // OH_Boolean isCodeCacheSupported
    result->append(", ");
    result->append(".isCodeCacheSupported=");
    WriteToString(result, &value->isCodeCacheSupported);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebCustomScheme* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebCustomScheme& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebHeader& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebHeader* value) {
    result->append("{");
    // OH_String headerKey
    result->append(".headerKey=");
    WriteToString(result, &value->headerKey);
    // OH_String headerValue
    result->append(", ");
    result->append(".headerValue=");
    WriteToString(result, &value->headerValue);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebHeader* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebHeader& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_WebMessagePort* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_WebMessagePort& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo* value) {
    result->append("{");
    // OH_String embedID
    result->append(".embedID=");
    WriteToString(result, &value->embedID);
    // OH_OHOS_WEB_WEBVIEW_webview_MediaType mediaType
    result->append(", ");
    result->append(".mediaType=");
    WriteToString(result, value->mediaType);
    // Array_webview_MediaSourceInfo mediaSrcList
    result->append(", ");
    result->append(".mediaSrcList=");
    WriteToString(result, &value->mediaSrcList);
    // OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo surfaceInfo
    result->append(", ");
    result->append(".surfaceInfo=");
    WriteToString(result, value->surfaceInfo);
    // OH_Boolean controlsShown
    result->append(", ");
    result->append(".controlsShown=");
    WriteToString(result, value->controlsShown);
    // Array_String controlList
    result->append(", ");
    result->append(".controlList=");
    WriteToString(result, &value->controlList);
    // OH_Boolean muted
    result->append(", ");
    result->append(".muted=");
    WriteToString(result, value->muted);
    // OH_String posterUrl
    result->append(", ");
    result->append(".posterUrl=");
    WriteToString(result, &value->posterUrl);
    // OH_OHOS_WEB_WEBVIEW_webview_Preload preload
    result->append(", ");
    result->append(".preload=");
    WriteToString(result, value->preload);
    // Map_String_String headers
    result->append(", ");
    result->append(".headers=");
    WriteToString(result, &value->headers);
    // Map_String_String attributes
    result->append(", ");
    result->append(".attributes=");
    WriteToString(result, &value->attributes);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_webview_MediaInfo* value) {
    result->append("{.tag=");
    result->append(tagNameExact(reinterpret_cast<OH_Tag>(value->tag)));
    result->append(", .value=");
    if (value->tag != INTEROP_TAG_UNDEFINED) {
        WriteToString(result, &value->value);
    } else {
        OH_Undefined undefined = { 0 };
        WriteToString(result, undefined);
    }
    result->append("}");
}
template <>
inline OH_OHOS_WEB_WEBVIEW_RuntimeType runtimeType(const Opt_webview_MediaInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class cert_X509Cert_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_cert_X509Cert value);
    static OH_OHOS_WEB_WEBVIEW_cert_X509Cert read(DeserializerBase& buffer);
};
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_image_PixelMap value);
    static OH_OHOS_WEB_WEBVIEW_image_PixelMap read(DeserializerBase& buffer);
};
class print_PrintDocumentAdapter_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter value);
    static OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter read(DeserializerBase& buffer);
};
class webview_BackForwardCacheOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions value);
    static OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions read(DeserializerBase& buffer);
};
class webview_BackForwardCacheSupportedFeatures_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures value);
    static OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures read(DeserializerBase& buffer);
};
class webview_BackForwardList_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_BackForwardList value);
    static OH_OHOS_WEB_WEBVIEW_webview_BackForwardList read(DeserializerBase& buffer);
};
class webview_CacheOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_CacheOptions value);
    static OH_OHOS_WEB_WEBVIEW_webview_CacheOptions read(DeserializerBase& buffer);
};
class webview_JsMessageExt_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt value);
    static OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt read(DeserializerBase& buffer);
};
class webview_NativeMediaPlayerHandler_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler value);
    static OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler read(DeserializerBase& buffer);
};
class webview_PdfData_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_PdfData value);
    static OH_OHOS_WEB_WEBVIEW_webview_PdfData read(DeserializerBase& buffer);
};
class webview_RectEvent_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_RectEvent value);
    static OH_OHOS_WEB_WEBVIEW_webview_RectEvent read(DeserializerBase& buffer);
};
class webview_ScrollOffset_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset value);
    static OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset read(DeserializerBase& buffer);
};
class webview_WebDownloadDelegate_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate read(DeserializerBase& buffer);
};
class webview_WebDownloadItem_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem read(DeserializerBase& buffer);
};
class webview_WebHttpBodyStream_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream read(DeserializerBase& buffer);
};
class webview_WebMessageExt_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt read(DeserializerBase& buffer);
};
class webview_WebResourceHandler_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler read(DeserializerBase& buffer);
};
class webview_WebSchemeHandler_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler read(DeserializerBase& buffer);
};
class webview_WebSchemeHandlerRequest_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest read(DeserializerBase& buffer);
};
class webview_WebSchemeHandlerResponse_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse read(DeserializerBase& buffer);
};
class webview_WebviewController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebviewController value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebviewController read(DeserializerBase& buffer);
};
class webview_HistoryItem_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_HistoryItem value);
    static OH_OHOS_WEB_WEBVIEW_webview_HistoryItem read(DeserializerBase& buffer);
};
class webview_HitTestValue_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_HitTestValue value);
    static OH_OHOS_WEB_WEBVIEW_webview_HitTestValue read(DeserializerBase& buffer);
};
class webview_MediaSourceInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo value);
    static OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo read(DeserializerBase& buffer);
};
class webview_NativeMediaPlayerBridge_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge value);
    static OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge read(DeserializerBase& buffer);
};
class webview_NativeMediaPlayerSurfaceInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo value);
    static OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo read(DeserializerBase& buffer);
};
class webview_OfflineResourceMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap value);
    static OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap read(DeserializerBase& buffer);
};
class webview_PdfConfiguration_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration value);
    static OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration read(DeserializerBase& buffer);
};
class webview_RequestInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_RequestInfo value);
    static OH_OHOS_WEB_WEBVIEW_webview_RequestInfo read(DeserializerBase& buffer);
};
class webview_SnapshotInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo value);
    static OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo read(DeserializerBase& buffer);
};
class webview_SnapshotResult_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult value);
    static OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult read(DeserializerBase& buffer);
};
class webview_WebCustomScheme_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme read(DeserializerBase& buffer);
};
class webview_WebHeader_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebHeader value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebHeader read(DeserializerBase& buffer);
};
class webview_WebMessagePort_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort value);
    static OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort read(DeserializerBase& buffer);
};
class webview_MediaInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_MediaInfo value);
    static OH_OHOS_WEB_WEBVIEW_webview_MediaInfo read(DeserializerBase& buffer);
};
inline void cert_X509Cert_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_cert_X509Cert value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_cert_X509Cert cert_X509Cert_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_cert_X509Cert>(ptr);
}
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_image_PixelMap>(ptr);
}
inline void print_PrintDocumentAdapter_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter print_PrintDocumentAdapter_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter>(ptr);
}
inline void webview_BackForwardCacheOptions_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions webview_BackForwardCacheOptions_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions>(ptr);
}
inline void webview_BackForwardCacheSupportedFeatures_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures webview_BackForwardCacheSupportedFeatures_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures>(ptr);
}
inline void webview_BackForwardList_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_BackForwardList value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_BackForwardList webview_BackForwardList_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_BackForwardList>(ptr);
}
inline void webview_CacheOptions_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_CacheOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForResponseHeaders = value.responseHeaders;
    valueSerializer.writeInt32(valueHolderForResponseHeaders.length);
    for (int valueHolderForResponseHeadersCounterI = 0; valueHolderForResponseHeadersCounterI < valueHolderForResponseHeaders.length; valueHolderForResponseHeadersCounterI++) {
        const OH_OHOS_WEB_WEBVIEW_webview_WebHeader valueHolderForResponseHeadersTmpElement = valueHolderForResponseHeaders.array[valueHolderForResponseHeadersCounterI];
        webview_WebHeader_serializer::write(valueSerializer, valueHolderForResponseHeadersTmpElement);
    }
}
inline OH_OHOS_WEB_WEBVIEW_webview_CacheOptions webview_CacheOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_CacheOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int32 responseHeadersTmpBufLength = valueDeserializer.readInt32();
    Array_webview_WebHeader responseHeadersTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(responseHeadersTmpBuf)>::type,
        std::decay<decltype(*responseHeadersTmpBuf.array)>::type>(&responseHeadersTmpBuf, responseHeadersTmpBufLength);
    for (int responseHeadersTmpBufBufCounterI = 0; responseHeadersTmpBufBufCounterI < responseHeadersTmpBufLength; responseHeadersTmpBufBufCounterI++) {
        responseHeadersTmpBuf.array[responseHeadersTmpBufBufCounterI] = webview_WebHeader_serializer::read(valueDeserializer);
    }
    value.responseHeaders = responseHeadersTmpBuf;
    return value;
}
inline void webview_JsMessageExt_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt webview_JsMessageExt_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt>(ptr);
}
inline void webview_NativeMediaPlayerHandler_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler webview_NativeMediaPlayerHandler_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler>(ptr);
}
inline void webview_PdfData_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_PdfData value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_PdfData webview_PdfData_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_PdfData>(ptr);
}
inline void webview_RectEvent_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_RectEvent value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    valueSerializer.writeFloat64(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeFloat64(valueHolderForY);
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeFloat64(valueHolderForWidth);
    const auto valueHolderForHeight = value.height;
    valueSerializer.writeFloat64(valueHolderForHeight);
}
inline OH_OHOS_WEB_WEBVIEW_webview_RectEvent webview_RectEvent_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_RectEvent value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.x = valueDeserializer.readFloat64();
    value.y = valueDeserializer.readFloat64();
    value.width = valueDeserializer.readFloat64();
    value.height = valueDeserializer.readFloat64();
    return value;
}
inline void webview_ScrollOffset_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    valueSerializer.writeFloat64(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeFloat64(valueHolderForY);
}
inline OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset webview_ScrollOffset_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.x = valueDeserializer.readFloat64();
    value.y = valueDeserializer.readFloat64();
    return value;
}
inline void webview_WebDownloadDelegate_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate webview_WebDownloadDelegate_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate>(ptr);
}
inline void webview_WebDownloadItem_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem webview_WebDownloadItem_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem>(ptr);
}
inline void webview_WebHttpBodyStream_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream webview_WebHttpBodyStream_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream>(ptr);
}
inline void webview_WebMessageExt_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt webview_WebMessageExt_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt>(ptr);
}
inline void webview_WebResourceHandler_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler webview_WebResourceHandler_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler>(ptr);
}
inline void webview_WebSchemeHandler_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler webview_WebSchemeHandler_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler>(ptr);
}
inline void webview_WebSchemeHandlerRequest_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest webview_WebSchemeHandlerRequest_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest>(ptr);
}
inline void webview_WebSchemeHandlerResponse_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse webview_WebSchemeHandlerResponse_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse>(ptr);
}
inline void webview_WebviewController_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebviewController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebviewController webview_WebviewController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebviewController>(ptr);
}
inline void webview_HistoryItem_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_HistoryItem value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForIcon = value.icon;
    image_PixelMap_serializer::write(valueSerializer, valueHolderForIcon);
    const auto valueHolderForHistoryUrl = value.historyUrl;
    valueSerializer.writeString(valueHolderForHistoryUrl);
    const auto valueHolderForHistoryRawUrl = value.historyRawUrl;
    valueSerializer.writeString(valueHolderForHistoryRawUrl);
    const auto valueHolderForTitle = value.title;
    valueSerializer.writeString(valueHolderForTitle);
}
inline OH_OHOS_WEB_WEBVIEW_webview_HistoryItem webview_HistoryItem_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_HistoryItem value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.icon = static_cast<OH_OHOS_WEB_WEBVIEW_image_PixelMap>(image_PixelMap_serializer::read(valueDeserializer));
    value.historyUrl = static_cast<OH_String>(valueDeserializer.readString());
    value.historyRawUrl = static_cast<OH_String>(valueDeserializer.readString());
    value.title = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void webview_HitTestValue_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_HitTestValue value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForType = value.type;
    valueSerializer.writeInt32(static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType>(valueHolderForType));
    const auto valueHolderForExtra = value.extra;
    valueSerializer.writeString(valueHolderForExtra);
}
inline OH_OHOS_WEB_WEBVIEW_webview_HitTestValue webview_HitTestValue_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_HitTestValue value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.type = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType>(valueDeserializer.readInt32());
    value.extra = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void webview_MediaSourceInfo_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo webview_MediaSourceInfo_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo>(ptr);
}
inline void webview_NativeMediaPlayerBridge_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge webview_NativeMediaPlayerBridge_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge>(ptr);
}
inline void webview_NativeMediaPlayerSurfaceInfo_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo webview_NativeMediaPlayerSurfaceInfo_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo>(ptr);
}
inline void webview_OfflineResourceMap_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForUrlList = value.urlList;
    valueSerializer.writeInt32(valueHolderForUrlList.length);
    for (int valueHolderForUrlListCounterI = 0; valueHolderForUrlListCounterI < valueHolderForUrlList.length; valueHolderForUrlListCounterI++) {
        const OH_String valueHolderForUrlListTmpElement = valueHolderForUrlList.array[valueHolderForUrlListCounterI];
        valueSerializer.writeString(valueHolderForUrlListTmpElement);
    }
    const auto valueHolderForResource = value.resource;
    valueSerializer.writeBuffer(valueHolderForResource);
    const auto valueHolderForResponseHeaders = value.responseHeaders;
    valueSerializer.writeInt32(valueHolderForResponseHeaders.length);
    for (int valueHolderForResponseHeadersCounterI = 0; valueHolderForResponseHeadersCounterI < valueHolderForResponseHeaders.length; valueHolderForResponseHeadersCounterI++) {
        const OH_OHOS_WEB_WEBVIEW_webview_WebHeader valueHolderForResponseHeadersTmpElement = valueHolderForResponseHeaders.array[valueHolderForResponseHeadersCounterI];
        webview_WebHeader_serializer::write(valueSerializer, valueHolderForResponseHeadersTmpElement);
    }
    const auto valueHolderForType = value.type;
    valueSerializer.writeInt32(static_cast<OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType>(valueHolderForType));
}
inline OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap webview_OfflineResourceMap_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int32 urlListTmpBufLength = valueDeserializer.readInt32();
    Array_String urlListTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(urlListTmpBuf)>::type,
        std::decay<decltype(*urlListTmpBuf.array)>::type>(&urlListTmpBuf, urlListTmpBufLength);
    for (int urlListTmpBufBufCounterI = 0; urlListTmpBufBufCounterI < urlListTmpBufLength; urlListTmpBufBufCounterI++) {
        urlListTmpBuf.array[urlListTmpBufBufCounterI] = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.urlList = urlListTmpBuf;
    value.resource = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    const OH_Int32 responseHeadersTmpBufLength = valueDeserializer.readInt32();
    Array_webview_WebHeader responseHeadersTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(responseHeadersTmpBuf)>::type,
        std::decay<decltype(*responseHeadersTmpBuf.array)>::type>(&responseHeadersTmpBuf, responseHeadersTmpBufLength);
    for (int responseHeadersTmpBufBufCounterI = 0; responseHeadersTmpBufBufCounterI < responseHeadersTmpBufLength; responseHeadersTmpBufBufCounterI++) {
        responseHeadersTmpBuf.array[responseHeadersTmpBufBufCounterI] = webview_WebHeader_serializer::read(valueDeserializer);
    }
    value.responseHeaders = responseHeadersTmpBuf;
    value.type = static_cast<OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType>(valueDeserializer.readInt32());
    return value;
}
inline void webview_PdfConfiguration_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeFloat64(valueHolderForWidth);
    const auto valueHolderForHeight = value.height;
    valueSerializer.writeFloat64(valueHolderForHeight);
    const auto valueHolderForMarginTop = value.marginTop;
    valueSerializer.writeFloat64(valueHolderForMarginTop);
    const auto valueHolderForMarginBottom = value.marginBottom;
    valueSerializer.writeFloat64(valueHolderForMarginBottom);
    const auto valueHolderForMarginRight = value.marginRight;
    valueSerializer.writeFloat64(valueHolderForMarginRight);
    const auto valueHolderForMarginLeft = value.marginLeft;
    valueSerializer.writeFloat64(valueHolderForMarginLeft);
    const auto valueHolderForScale = value.scale;
    if (runtimeType(valueHolderForScale) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForScaleTmpValue = valueHolderForScale.value;
        valueSerializer.writeFloat64(valueHolderForScaleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShouldPrintBackground = value.shouldPrintBackground;
    if (runtimeType(valueHolderForShouldPrintBackground) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShouldPrintBackgroundTmpValue = valueHolderForShouldPrintBackground.value;
        valueSerializer.writeBoolean(valueHolderForShouldPrintBackgroundTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration webview_PdfConfiguration_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.width = valueDeserializer.readFloat64();
    value.height = valueDeserializer.readFloat64();
    value.marginTop = valueDeserializer.readFloat64();
    value.marginBottom = valueDeserializer.readFloat64();
    value.marginRight = valueDeserializer.readFloat64();
    value.marginLeft = valueDeserializer.readFloat64();
    const auto scaleTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 scaleTmpBuf = {};
    scaleTmpBuf.tag = scaleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((scaleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        scaleTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.scale = scaleTmpBuf;
    const auto shouldPrintBackgroundTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean shouldPrintBackgroundTmpBuf = {};
    shouldPrintBackgroundTmpBuf.tag = shouldPrintBackgroundTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shouldPrintBackgroundTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        shouldPrintBackgroundTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.shouldPrintBackground = shouldPrintBackgroundTmpBuf;
    return value;
}
inline void webview_RequestInfo_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_RequestInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForUrl = value.url;
    valueSerializer.writeString(valueHolderForUrl);
    const auto valueHolderForMethod = value.method;
    valueSerializer.writeString(valueHolderForMethod);
    const auto valueHolderForFormData = value.formData;
    valueSerializer.writeString(valueHolderForFormData);
}
inline OH_OHOS_WEB_WEBVIEW_webview_RequestInfo webview_RequestInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_RequestInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.url = static_cast<OH_String>(valueDeserializer.readString());
    value.method = static_cast<OH_String>(valueDeserializer.readString());
    value.formData = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void webview_SnapshotInfo_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    if (runtimeType(valueHolderForId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIdTmpValue = valueHolderForId.value;
        valueSerializer.writeString(valueHolderForIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo webview_SnapshotInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto idTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String idTmpBuf = {};
    idTmpBuf.tag = idTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((idTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        idTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.id = idTmpBuf;
    return value;
}
inline void webview_SnapshotResult_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    if (runtimeType(valueHolderForId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIdTmpValue = valueHolderForId.value;
        valueSerializer.writeString(valueHolderForIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForStatus = value.status;
    if (runtimeType(valueHolderForStatus) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForStatusTmpValue = valueHolderForStatus.value;
        valueSerializer.writeBoolean(valueHolderForStatusTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForImagePixelMap = value.imagePixelMap;
    if (runtimeType(valueHolderForImagePixelMap) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForImagePixelMapTmpValue = valueHolderForImagePixelMap.value;
        image_PixelMap_serializer::write(valueSerializer, valueHolderForImagePixelMapTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult webview_SnapshotResult_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto idTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String idTmpBuf = {};
    idTmpBuf.tag = idTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((idTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        idTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.id = idTmpBuf;
    const auto statusTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean statusTmpBuf = {};
    statusTmpBuf.tag = statusTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((statusTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        statusTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.status = statusTmpBuf;
    const auto imagePixelMapTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_image_PixelMap imagePixelMapTmpBuf = {};
    imagePixelMapTmpBuf.tag = imagePixelMapTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((imagePixelMapTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        imagePixelMapTmpBuf.value = static_cast<OH_OHOS_WEB_WEBVIEW_image_PixelMap>(image_PixelMap_serializer::read(valueDeserializer));
    }
    value.imagePixelMap = imagePixelMapTmpBuf;
    return value;
}
inline void webview_WebCustomScheme_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForSchemeName = value.schemeName;
    valueSerializer.writeString(valueHolderForSchemeName);
    const auto valueHolderForIsSupportCORS = value.isSupportCORS;
    valueSerializer.writeBoolean(valueHolderForIsSupportCORS);
    const auto valueHolderForIsSupportFetch = value.isSupportFetch;
    valueSerializer.writeBoolean(valueHolderForIsSupportFetch);
    const auto valueHolderForIsStandard = value.isStandard;
    if (runtimeType(valueHolderForIsStandard) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsStandardTmpValue = valueHolderForIsStandard.value;
        valueSerializer.writeBoolean(valueHolderForIsStandardTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsLocal = value.isLocal;
    if (runtimeType(valueHolderForIsLocal) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsLocalTmpValue = valueHolderForIsLocal.value;
        valueSerializer.writeBoolean(valueHolderForIsLocalTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsDisplayIsolated = value.isDisplayIsolated;
    if (runtimeType(valueHolderForIsDisplayIsolated) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsDisplayIsolatedTmpValue = valueHolderForIsDisplayIsolated.value;
        valueSerializer.writeBoolean(valueHolderForIsDisplayIsolatedTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsSecure = value.isSecure;
    if (runtimeType(valueHolderForIsSecure) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsSecureTmpValue = valueHolderForIsSecure.value;
        valueSerializer.writeBoolean(valueHolderForIsSecureTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsCspBypassing = value.isCspBypassing;
    if (runtimeType(valueHolderForIsCspBypassing) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsCspBypassingTmpValue = valueHolderForIsCspBypassing.value;
        valueSerializer.writeBoolean(valueHolderForIsCspBypassingTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsCodeCacheSupported = value.isCodeCacheSupported;
    if (runtimeType(valueHolderForIsCodeCacheSupported) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsCodeCacheSupportedTmpValue = valueHolderForIsCodeCacheSupported.value;
        valueSerializer.writeBoolean(valueHolderForIsCodeCacheSupportedTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme webview_WebCustomScheme_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.schemeName = static_cast<OH_String>(valueDeserializer.readString());
    value.isSupportCORS = valueDeserializer.readBoolean();
    value.isSupportFetch = valueDeserializer.readBoolean();
    const auto isStandardTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isStandardTmpBuf = {};
    isStandardTmpBuf.tag = isStandardTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isStandardTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isStandardTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isStandard = isStandardTmpBuf;
    const auto isLocalTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isLocalTmpBuf = {};
    isLocalTmpBuf.tag = isLocalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isLocalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isLocalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isLocal = isLocalTmpBuf;
    const auto isDisplayIsolatedTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isDisplayIsolatedTmpBuf = {};
    isDisplayIsolatedTmpBuf.tag = isDisplayIsolatedTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isDisplayIsolatedTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isDisplayIsolatedTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isDisplayIsolated = isDisplayIsolatedTmpBuf;
    const auto isSecureTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isSecureTmpBuf = {};
    isSecureTmpBuf.tag = isSecureTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isSecureTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isSecureTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isSecure = isSecureTmpBuf;
    const auto isCspBypassingTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isCspBypassingTmpBuf = {};
    isCspBypassingTmpBuf.tag = isCspBypassingTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isCspBypassingTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isCspBypassingTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isCspBypassing = isCspBypassingTmpBuf;
    const auto isCodeCacheSupportedTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isCodeCacheSupportedTmpBuf = {};
    isCodeCacheSupportedTmpBuf.tag = isCodeCacheSupportedTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isCodeCacheSupportedTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isCodeCacheSupportedTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isCodeCacheSupported = isCodeCacheSupportedTmpBuf;
    return value;
}
inline void webview_WebHeader_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebHeader value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForHeaderKey = value.headerKey;
    valueSerializer.writeString(valueHolderForHeaderKey);
    const auto valueHolderForHeaderValue = value.headerValue;
    valueSerializer.writeString(valueHolderForHeaderValue);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebHeader webview_WebHeader_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_WebHeader value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.headerKey = static_cast<OH_String>(valueDeserializer.readString());
    value.headerValue = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void webview_WebMessagePort_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort webview_WebMessagePort_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort>(ptr);
}
inline void webview_MediaInfo_serializer::write(SerializerBase& buffer, OH_OHOS_WEB_WEBVIEW_webview_MediaInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForEmbedID = value.embedID;
    valueSerializer.writeString(valueHolderForEmbedID);
    const auto valueHolderForMediaType = value.mediaType;
    valueSerializer.writeInt32(static_cast<OH_OHOS_WEB_WEBVIEW_webview_MediaType>(valueHolderForMediaType));
    const auto valueHolderForMediaSrcList = value.mediaSrcList;
    valueSerializer.writeInt32(valueHolderForMediaSrcList.length);
    for (int valueHolderForMediaSrcListCounterI = 0; valueHolderForMediaSrcListCounterI < valueHolderForMediaSrcList.length; valueHolderForMediaSrcListCounterI++) {
        const OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo valueHolderForMediaSrcListTmpElement = valueHolderForMediaSrcList.array[valueHolderForMediaSrcListCounterI];
        webview_MediaSourceInfo_serializer::write(valueSerializer, valueHolderForMediaSrcListTmpElement);
    }
    const auto valueHolderForSurfaceInfo = value.surfaceInfo;
    webview_NativeMediaPlayerSurfaceInfo_serializer::write(valueSerializer, valueHolderForSurfaceInfo);
    const auto valueHolderForControlsShown = value.controlsShown;
    valueSerializer.writeBoolean(valueHolderForControlsShown);
    const auto valueHolderForControlList = value.controlList;
    valueSerializer.writeInt32(valueHolderForControlList.length);
    for (int valueHolderForControlListCounterI = 0; valueHolderForControlListCounterI < valueHolderForControlList.length; valueHolderForControlListCounterI++) {
        const OH_String valueHolderForControlListTmpElement = valueHolderForControlList.array[valueHolderForControlListCounterI];
        valueSerializer.writeString(valueHolderForControlListTmpElement);
    }
    const auto valueHolderForMuted = value.muted;
    valueSerializer.writeBoolean(valueHolderForMuted);
    const auto valueHolderForPosterUrl = value.posterUrl;
    valueSerializer.writeString(valueHolderForPosterUrl);
    const auto valueHolderForPreload = value.preload;
    valueSerializer.writeInt32(static_cast<OH_OHOS_WEB_WEBVIEW_webview_Preload>(valueHolderForPreload));
    const auto valueHolderForHeaders = value.headers;
    valueSerializer.writeInt32(valueHolderForHeaders.size);
    for (int32_t i = 0; i < valueHolderForHeaders.size; i++) {
        auto valueHolderForHeadersKeyVar = valueHolderForHeaders.keys[i];
        auto valueHolderForHeadersValueVar = valueHolderForHeaders.values[i];
        valueSerializer.writeString(valueHolderForHeadersKeyVar);
        valueSerializer.writeString(valueHolderForHeadersValueVar);
    }
    const auto valueHolderForAttributes = value.attributes;
    valueSerializer.writeInt32(valueHolderForAttributes.size);
    for (int32_t i = 0; i < valueHolderForAttributes.size; i++) {
        auto valueHolderForAttributesKeyVar = valueHolderForAttributes.keys[i];
        auto valueHolderForAttributesValueVar = valueHolderForAttributes.values[i];
        valueSerializer.writeString(valueHolderForAttributesKeyVar);
        valueSerializer.writeString(valueHolderForAttributesValueVar);
    }
}
inline OH_OHOS_WEB_WEBVIEW_webview_MediaInfo webview_MediaInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WEB_WEBVIEW_webview_MediaInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.embedID = static_cast<OH_String>(valueDeserializer.readString());
    value.mediaType = static_cast<OH_OHOS_WEB_WEBVIEW_webview_MediaType>(valueDeserializer.readInt32());
    const OH_Int32 mediaSrcListTmpBufLength = valueDeserializer.readInt32();
    Array_webview_MediaSourceInfo mediaSrcListTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(mediaSrcListTmpBuf)>::type,
        std::decay<decltype(*mediaSrcListTmpBuf.array)>::type>(&mediaSrcListTmpBuf, mediaSrcListTmpBufLength);
    for (int mediaSrcListTmpBufBufCounterI = 0; mediaSrcListTmpBufBufCounterI < mediaSrcListTmpBufLength; mediaSrcListTmpBufBufCounterI++) {
        mediaSrcListTmpBuf.array[mediaSrcListTmpBufBufCounterI] = static_cast<OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo>(webview_MediaSourceInfo_serializer::read(valueDeserializer));
    }
    value.mediaSrcList = mediaSrcListTmpBuf;
    value.surfaceInfo = static_cast<OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo>(webview_NativeMediaPlayerSurfaceInfo_serializer::read(valueDeserializer));
    value.controlsShown = valueDeserializer.readBoolean();
    const OH_Int32 controlListTmpBufLength = valueDeserializer.readInt32();
    Array_String controlListTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(controlListTmpBuf)>::type,
        std::decay<decltype(*controlListTmpBuf.array)>::type>(&controlListTmpBuf, controlListTmpBufLength);
    for (int controlListTmpBufBufCounterI = 0; controlListTmpBufBufCounterI < controlListTmpBufLength; controlListTmpBufBufCounterI++) {
        controlListTmpBuf.array[controlListTmpBufBufCounterI] = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.controlList = controlListTmpBuf;
    value.muted = valueDeserializer.readBoolean();
    value.posterUrl = static_cast<OH_String>(valueDeserializer.readString());
    value.preload = static_cast<OH_OHOS_WEB_WEBVIEW_webview_Preload>(valueDeserializer.readInt32());
    const OH_Int32 headersTmpBufSizeVar = valueDeserializer.readInt32();
    Map_String_String headersTmpBuf = {};
    valueDeserializer.resizeMap<Map_String_String, OH_String, OH_String>(&headersTmpBuf, headersTmpBufSizeVar);
    for (int headersTmpBufIVar = 0; headersTmpBufIVar < headersTmpBufSizeVar; headersTmpBufIVar++) {
        const OH_String headersTmpBufKeyVar = static_cast<OH_String>(valueDeserializer.readString());
        const OH_String headersTmpBufValueVar = static_cast<OH_String>(valueDeserializer.readString());
        headersTmpBuf.keys[headersTmpBufIVar] = headersTmpBufKeyVar;
        headersTmpBuf.values[headersTmpBufIVar] = headersTmpBufValueVar;
    }
    value.headers = headersTmpBuf;
    const OH_Int32 attributesTmpBufSizeVar = valueDeserializer.readInt32();
    Map_String_String attributesTmpBuf = {};
    valueDeserializer.resizeMap<Map_String_String, OH_String, OH_String>(&attributesTmpBuf, attributesTmpBufSizeVar);
    for (int attributesTmpBufIVar = 0; attributesTmpBufIVar < attributesTmpBufSizeVar; attributesTmpBufIVar++) {
        const OH_String attributesTmpBufKeyVar = static_cast<OH_String>(valueDeserializer.readString());
        const OH_String attributesTmpBufValueVar = static_cast<OH_String>(valueDeserializer.readString());
        attributesTmpBuf.keys[attributesTmpBufIVar] = attributesTmpBufKeyVar;
        attributesTmpBuf.values[attributesTmpBufIVar] = attributesTmpBufValueVar;
    }
    value.attributes = attributesTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_WEB_WEBVIEW_API* GetOH_OHOS_WEB_WEBVIEW_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_WEB_WEBVIEW_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_WEB_WEBVIEW_APIKind::OH_OHOS_WEB_WEBVIEW_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_webview_BackForwardCacheOptions_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheOptions()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_BackForwardCacheOptions_construct, OH_NativePointer)
OH_NativePointer impl_webview_BackForwardCacheOptions_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheOptions()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_BackForwardCacheOptions_getFinalizer, OH_NativePointer)
OH_Number impl_webview_BackForwardCacheOptions_getSize(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheOptions()->getSize(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_BackForwardCacheOptions_getSize, KInteropNumber, OH_NativePointer)
void impl_webview_BackForwardCacheOptions_setSize(OH_NativePointer thisPtr, KInteropNumber size) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheOptions()->setSize(thisPtr, (const OH_Number*) (&size));
}
KOALA_INTEROP_DIRECT_V2(webview_BackForwardCacheOptions_setSize, OH_NativePointer, KInteropNumber)
OH_Number impl_webview_BackForwardCacheOptions_getTimeToLive(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheOptions()->getTimeToLive(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_BackForwardCacheOptions_getTimeToLive, KInteropNumber, OH_NativePointer)
void impl_webview_BackForwardCacheOptions_setTimeToLive(OH_NativePointer thisPtr, KInteropNumber timeToLive) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheOptions()->setTimeToLive(thisPtr, (const OH_Number*) (&timeToLive));
}
KOALA_INTEROP_DIRECT_V2(webview_BackForwardCacheOptions_setTimeToLive, OH_NativePointer, KInteropNumber)
OH_NativePointer impl_webview_BackForwardCacheSupportedFeatures_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheSupportedFeatures()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_BackForwardCacheSupportedFeatures_construct, OH_NativePointer)
OH_NativePointer impl_webview_BackForwardCacheSupportedFeatures_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheSupportedFeatures()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_BackForwardCacheSupportedFeatures_getFinalizer, OH_NativePointer)
OH_Boolean impl_webview_BackForwardCacheSupportedFeatures_getNativeEmbed(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheSupportedFeatures()->getNativeEmbed(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_BackForwardCacheSupportedFeatures_getNativeEmbed, OH_Boolean, OH_NativePointer)
void impl_webview_BackForwardCacheSupportedFeatures_setNativeEmbed(OH_NativePointer thisPtr, OH_Boolean nativeEmbed) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheSupportedFeatures()->setNativeEmbed(thisPtr, nativeEmbed);
}
KOALA_INTEROP_DIRECT_V2(webview_BackForwardCacheSupportedFeatures_setNativeEmbed, OH_NativePointer, OH_Boolean)
OH_Boolean impl_webview_BackForwardCacheSupportedFeatures_getMediaTakeOver(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheSupportedFeatures()->getMediaTakeOver(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_BackForwardCacheSupportedFeatures_getMediaTakeOver, OH_Boolean, OH_NativePointer)
void impl_webview_BackForwardCacheSupportedFeatures_setMediaTakeOver(OH_NativePointer thisPtr, OH_Boolean mediaTakeOver) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardCacheSupportedFeatures()->setMediaTakeOver(thisPtr, mediaTakeOver);
}
KOALA_INTEROP_DIRECT_V2(webview_BackForwardCacheSupportedFeatures_setMediaTakeOver, OH_NativePointer, OH_Boolean)
OH_NativePointer impl_webview_BackForwardList_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardList()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_BackForwardList_construct, OH_NativePointer)
OH_NativePointer impl_webview_BackForwardList_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardList()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_BackForwardList_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_webview_BackForwardList_getItemAtIndex(OH_NativePointer thisPtr, OH_Int32 index) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardList()->getItemAtIndex(thisPtr, index);
        SerializerBase _retSerializer {};
        webview_HistoryItem_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(webview_BackForwardList_getItemAtIndex, KInteropReturnBuffer, OH_NativePointer, OH_Int32)
OH_Int32 impl_webview_BackForwardList_getCurrentIndex(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardList()->getCurrentIndex(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_BackForwardList_getCurrentIndex, OH_Int32, OH_NativePointer)
void impl_webview_BackForwardList_setCurrentIndex(OH_NativePointer thisPtr, OH_Int32 currentIndex) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardList()->setCurrentIndex(thisPtr, currentIndex);
}
KOALA_INTEROP_DIRECT_V2(webview_BackForwardList_setCurrentIndex, OH_NativePointer, OH_Int32)
OH_Int32 impl_webview_BackForwardList_getSize(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardList()->getSize(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_BackForwardList_getSize, OH_Int32, OH_NativePointer)
void impl_webview_BackForwardList_setSize(OH_NativePointer thisPtr, OH_Int32 size) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_BackForwardList()->setSize(thisPtr, size);
}
KOALA_INTEROP_DIRECT_V2(webview_BackForwardList_setSize, OH_NativePointer, OH_Int32)
OH_NativePointer impl_webview_JsMessageExt_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_JsMessageExt_construct, OH_NativePointer)
OH_NativePointer impl_webview_JsMessageExt_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_JsMessageExt_getFinalizer, OH_NativePointer)
OH_Int32 impl_webview_JsMessageExt_getType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->getType(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_JsMessageExt_getType, OH_Int32, OH_NativePointer)
OH_String impl_webview_JsMessageExt_getString(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->getString(thisPtr);
}
KOALA_INTEROP_1(webview_JsMessageExt_getString, KStringPtr, OH_NativePointer)
OH_Number impl_webview_JsMessageExt_getNumber(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->getNumber(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_JsMessageExt_getNumber, KInteropNumber, OH_NativePointer)
OH_Boolean impl_webview_JsMessageExt_getBoolean(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->getBoolean(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_JsMessageExt_getBoolean, OH_Boolean, OH_NativePointer)
KInteropReturnBuffer impl_webview_JsMessageExt_getArrayBuffer(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->getArrayBuffer(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_JsMessageExt_getArrayBuffer, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_webview_JsMessageExt_getArray(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_JsMessageExt()->getArray(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean retValueTmpElement = retValue.array[retValueCounterI];
            if (retValueTmpElement.selector == 0) {
                _retSerializer.writeInt8(0);
                const auto retValueTmpElementForIdx0 = retValueTmpElement.value0;
                _retSerializer.writeString(retValueTmpElementForIdx0);
            } else if (retValueTmpElement.selector == 1) {
                _retSerializer.writeInt8(1);
                const auto retValueTmpElementForIdx1 = retValueTmpElement.value1;
                _retSerializer.writeNumber(retValueTmpElementForIdx1);
            } else if (retValueTmpElement.selector == 2) {
                _retSerializer.writeInt8(2);
                const auto retValueTmpElementForIdx2 = retValueTmpElement.value2;
                _retSerializer.writeBoolean(retValueTmpElementForIdx2);
            }
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_JsMessageExt_getArray, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_webview_MediaSourceInfo_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_MediaSourceInfo_construct, OH_NativePointer)
OH_NativePointer impl_webview_MediaSourceInfo_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_MediaSourceInfo_getFinalizer, OH_NativePointer)
OH_Int32 impl_webview_MediaSourceInfo_getType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->getType(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_MediaSourceInfo_getType, OH_Int32, OH_NativePointer)
void impl_webview_MediaSourceInfo_setType(OH_NativePointer thisPtr, OH_Int32 type) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->setType(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_SourceType>(type));
}
KOALA_INTEROP_DIRECT_V2(webview_MediaSourceInfo_setType, OH_NativePointer, OH_Int32)
OH_String impl_webview_MediaSourceInfo_getSource(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->getSource(thisPtr);
}
KOALA_INTEROP_1(webview_MediaSourceInfo_getSource, KStringPtr, OH_NativePointer)
void impl_webview_MediaSourceInfo_setSource(OH_NativePointer thisPtr, const KStringPtr& source) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->setSource(thisPtr, (const OH_String*) (&source));
}
KOALA_INTEROP_V2(webview_MediaSourceInfo_setSource, OH_NativePointer, KStringPtr)
OH_String impl_webview_MediaSourceInfo_getFormat(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->getFormat(thisPtr);
}
KOALA_INTEROP_1(webview_MediaSourceInfo_getFormat, KStringPtr, OH_NativePointer)
void impl_webview_MediaSourceInfo_setFormat(OH_NativePointer thisPtr, const KStringPtr& format) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_MediaSourceInfo()->setFormat(thisPtr, (const OH_String*) (&format));
}
KOALA_INTEROP_V2(webview_MediaSourceInfo_setFormat, OH_NativePointer, KStringPtr)
OH_NativePointer impl_webview_NativeMediaPlayerBridge_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_NativeMediaPlayerBridge_construct, OH_NativePointer)
OH_NativePointer impl_webview_NativeMediaPlayerBridge_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_NativeMediaPlayerBridge_getFinalizer, OH_NativePointer)
void impl_webview_NativeMediaPlayerBridge_updateRect(OH_NativePointer thisPtr, KDouble x, KDouble y, KDouble width, KDouble height) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->updateRect(thisPtr, x, y, width, height);
}
KOALA_INTEROP_V5(webview_NativeMediaPlayerBridge_updateRect, OH_NativePointer, KDouble, KDouble, KDouble, KDouble)
void impl_webview_NativeMediaPlayerBridge_play(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->play(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerBridge_play, OH_NativePointer)
void impl_webview_NativeMediaPlayerBridge_pause(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->pause(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerBridge_pause, OH_NativePointer)
void impl_webview_NativeMediaPlayerBridge_seek(OH_NativePointer thisPtr, KDouble targetTime) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->seek(thisPtr, targetTime);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerBridge_seek, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerBridge_setVolume(OH_NativePointer thisPtr, KDouble volume) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->setVolume(thisPtr, volume);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerBridge_setVolume, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerBridge_setMuted(OH_NativePointer thisPtr, OH_Boolean muted) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->setMuted(thisPtr, muted);
}
KOALA_INTEROP_DIRECT_V2(webview_NativeMediaPlayerBridge_setMuted, OH_NativePointer, OH_Boolean)
void impl_webview_NativeMediaPlayerBridge_setPlaybackRate(OH_NativePointer thisPtr, KDouble playbackRate) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->setPlaybackRate(thisPtr, playbackRate);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerBridge_setPlaybackRate, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerBridge_release(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->release(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerBridge_release, OH_NativePointer)
void impl_webview_NativeMediaPlayerBridge_enterFullscreen(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->enterFullscreen(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerBridge_enterFullscreen, OH_NativePointer)
void impl_webview_NativeMediaPlayerBridge_exitFullscreen(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->exitFullscreen(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerBridge_exitFullscreen, OH_NativePointer)
KInteropReturnBuffer impl_webview_NativeMediaPlayerBridge_getResumePlayer(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->getResumePlayer(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeCallbackResource(retValueTmpValue.resource);
            _retSerializer.writePointer(reinterpret_cast<OH_NativePointer>(retValueTmpValue.call));
            _retSerializer.writePointer(reinterpret_cast<OH_NativePointer>(retValueTmpValue.callSync));
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_NativeMediaPlayerBridge_getResumePlayer, KInteropReturnBuffer, OH_NativePointer)
void impl_webview_NativeMediaPlayerBridge_setResumePlayer(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto resumePlayerValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn resumePlayerValueTempTmpBuf = {};
        resumePlayerValueTempTmpBuf.tag = resumePlayerValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((resumePlayerValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            resumePlayerValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_ResumePlayerFn)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_ResumePlayerFn))))};
        }
        Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn resumePlayerValueTemp = resumePlayerValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->setResumePlayer(thisPtr, static_cast<Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn*>(&resumePlayerValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_NativeMediaPlayerBridge_setResumePlayer, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_webview_NativeMediaPlayerBridge_getSuspendPlayer(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->getSuspendPlayer(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeCallbackResource(retValueTmpValue.resource);
            _retSerializer.writePointer(reinterpret_cast<OH_NativePointer>(retValueTmpValue.call));
            _retSerializer.writePointer(reinterpret_cast<OH_NativePointer>(retValueTmpValue.callSync));
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_NativeMediaPlayerBridge_getSuspendPlayer, KInteropReturnBuffer, OH_NativePointer)
void impl_webview_NativeMediaPlayerBridge_setSuspendPlayer(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto suspendPlayerValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn suspendPlayerValueTempTmpBuf = {};
        suspendPlayerValueTempTmpBuf.tag = suspendPlayerValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((suspendPlayerValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            suspendPlayerValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_SuspendPlayerFn)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_SuspendPlayerFn))))};
        }
        Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn suspendPlayerValueTemp = suspendPlayerValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerBridge()->setSuspendPlayer(thisPtr, static_cast<Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn*>(&suspendPlayerValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_NativeMediaPlayerBridge_setSuspendPlayer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_NativeMediaPlayerHandler_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_NativeMediaPlayerHandler_construct, OH_NativePointer)
OH_NativePointer impl_webview_NativeMediaPlayerHandler_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_NativeMediaPlayerHandler_getFinalizer, OH_NativePointer)
void impl_webview_NativeMediaPlayerHandler_handleStatusChanged(OH_NativePointer thisPtr, OH_Int32 status) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleStatusChanged(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus>(status));
}
KOALA_INTEROP_DIRECT_V2(webview_NativeMediaPlayerHandler_handleStatusChanged, OH_NativePointer, OH_Int32)
void impl_webview_NativeMediaPlayerHandler_handleVolumeChanged(OH_NativePointer thisPtr, KDouble volume) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleVolumeChanged(thisPtr, volume);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerHandler_handleVolumeChanged, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerHandler_handleMutedChanged(OH_NativePointer thisPtr, OH_Boolean muted) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleMutedChanged(thisPtr, muted);
}
KOALA_INTEROP_DIRECT_V2(webview_NativeMediaPlayerHandler_handleMutedChanged, OH_NativePointer, OH_Boolean)
void impl_webview_NativeMediaPlayerHandler_handlePlaybackRateChanged(OH_NativePointer thisPtr, KDouble playbackRate) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handlePlaybackRateChanged(thisPtr, playbackRate);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerHandler_handlePlaybackRateChanged, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerHandler_handleDurationChanged(OH_NativePointer thisPtr, KDouble duration) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleDurationChanged(thisPtr, duration);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerHandler_handleDurationChanged, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerHandler_handleTimeUpdate(OH_NativePointer thisPtr, KDouble currentPlayTime) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleTimeUpdate(thisPtr, currentPlayTime);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerHandler_handleTimeUpdate, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerHandler_handleBufferedEndTimeChanged(OH_NativePointer thisPtr, KDouble bufferedEndTime) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleBufferedEndTimeChanged(thisPtr, bufferedEndTime);
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerHandler_handleBufferedEndTimeChanged, OH_NativePointer, KDouble)
void impl_webview_NativeMediaPlayerHandler_handleEnded(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleEnded(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerHandler_handleEnded, OH_NativePointer)
void impl_webview_NativeMediaPlayerHandler_handleNetworkStateChanged(OH_NativePointer thisPtr, OH_Int32 state) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleNetworkStateChanged(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_NetworkState>(state));
}
KOALA_INTEROP_DIRECT_V2(webview_NativeMediaPlayerHandler_handleNetworkStateChanged, OH_NativePointer, OH_Int32)
void impl_webview_NativeMediaPlayerHandler_handleReadyStateChanged(OH_NativePointer thisPtr, OH_Int32 state) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleReadyStateChanged(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_ReadyState>(state));
}
KOALA_INTEROP_DIRECT_V2(webview_NativeMediaPlayerHandler_handleReadyStateChanged, OH_NativePointer, OH_Int32)
void impl_webview_NativeMediaPlayerHandler_handleFullscreenChanged(OH_NativePointer thisPtr, OH_Boolean fullscreen) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleFullscreenChanged(thisPtr, fullscreen);
}
KOALA_INTEROP_DIRECT_V2(webview_NativeMediaPlayerHandler_handleFullscreenChanged, OH_NativePointer, OH_Boolean)
void impl_webview_NativeMediaPlayerHandler_handleSeeking(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleSeeking(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerHandler_handleSeeking, OH_NativePointer)
void impl_webview_NativeMediaPlayerHandler_handleSeekFinished(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleSeekFinished(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_NativeMediaPlayerHandler_handleSeekFinished, OH_NativePointer)
void impl_webview_NativeMediaPlayerHandler_handleError(OH_NativePointer thisPtr, OH_Int32 error, const KStringPtr& errorMessage) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleError(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_MediaError>(error), (const OH_String*) (&errorMessage));
}
KOALA_INTEROP_V3(webview_NativeMediaPlayerHandler_handleError, OH_NativePointer, OH_Int32, KStringPtr)
void impl_webview_NativeMediaPlayerHandler_handleVideoSizeChanged(OH_NativePointer thisPtr, KDouble width, KDouble height) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerHandler()->handleVideoSizeChanged(thisPtr, width, height);
}
KOALA_INTEROP_V3(webview_NativeMediaPlayerHandler_handleVideoSizeChanged, OH_NativePointer, KDouble, KDouble)
OH_NativePointer impl_webview_NativeMediaPlayerSurfaceInfo_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerSurfaceInfo()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_NativeMediaPlayerSurfaceInfo_construct, OH_NativePointer)
OH_NativePointer impl_webview_NativeMediaPlayerSurfaceInfo_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerSurfaceInfo()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_NativeMediaPlayerSurfaceInfo_getFinalizer, OH_NativePointer)
OH_String impl_webview_NativeMediaPlayerSurfaceInfo_getId(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerSurfaceInfo()->getId(thisPtr);
}
KOALA_INTEROP_1(webview_NativeMediaPlayerSurfaceInfo_getId, KStringPtr, OH_NativePointer)
void impl_webview_NativeMediaPlayerSurfaceInfo_setId(OH_NativePointer thisPtr, const KStringPtr& id) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerSurfaceInfo()->setId(thisPtr, (const OH_String*) (&id));
}
KOALA_INTEROP_V2(webview_NativeMediaPlayerSurfaceInfo_setId, OH_NativePointer, KStringPtr)
KInteropReturnBuffer impl_webview_NativeMediaPlayerSurfaceInfo_getRect(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerSurfaceInfo()->getRect(thisPtr);
        SerializerBase _retSerializer {};
        webview_RectEvent_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_NativeMediaPlayerSurfaceInfo_getRect, KInteropReturnBuffer, OH_NativePointer)
void impl_webview_NativeMediaPlayerSurfaceInfo_setRect(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WEB_WEBVIEW_webview_RectEvent rectValueTemp = webview_RectEvent_serializer::read(thisDeserializer);;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_NativeMediaPlayerSurfaceInfo()->setRect(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_RectEvent*>(&rectValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_NativeMediaPlayerSurfaceInfo_setRect, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_PdfData_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_PdfData()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_PdfData_construct, OH_NativePointer)
OH_NativePointer impl_webview_PdfData_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_PdfData()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_PdfData_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_webview_PdfData_pdfArrayBuffer(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_PdfData()->pdfArrayBuffer(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_PdfData_pdfArrayBuffer, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_webview_WebDownloadDelegate_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadDelegate()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebDownloadDelegate_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebDownloadDelegate_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadDelegate()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebDownloadDelegate_getFinalizer, OH_NativePointer)
void impl_webview_WebDownloadDelegate_onBeforeDownload(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebDownloadItem_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebDownloadItem_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadDelegate()->onBeforeDownload(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebDownloadDelegate_onBeforeDownload, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebDownloadDelegate_onDownloadUpdated(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebDownloadItem_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebDownloadItem_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadDelegate()->onDownloadUpdated(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebDownloadDelegate_onDownloadUpdated, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebDownloadDelegate_onDownloadFinish(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebDownloadItem_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebDownloadItem_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadDelegate()->onDownloadFinish(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebDownloadDelegate_onDownloadFinish, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebDownloadDelegate_onDownloadFailed(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebDownloadItem_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebDownloadItem_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadDelegate()->onDownloadFailed(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebDownloadDelegate_onDownloadFailed, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebDownloadItem_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebDownloadItem_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebDownloadItem_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebDownloadItem_getFinalizer, OH_NativePointer)
OH_String impl_webview_WebDownloadItem_getGuid(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getGuid(thisPtr);
}
KOALA_INTEROP_1(webview_WebDownloadItem_getGuid, KStringPtr, OH_NativePointer)
OH_Number impl_webview_WebDownloadItem_getCurrentSpeed(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getCurrentSpeed(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebDownloadItem_getCurrentSpeed, KInteropNumber, OH_NativePointer)
OH_Number impl_webview_WebDownloadItem_getPercentComplete(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getPercentComplete(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebDownloadItem_getPercentComplete, KInteropNumber, OH_NativePointer)
OH_Number impl_webview_WebDownloadItem_getTotalBytes(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getTotalBytes(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebDownloadItem_getTotalBytes, KInteropNumber, OH_NativePointer)
OH_Int32 impl_webview_WebDownloadItem_getState(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getState(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebDownloadItem_getState, OH_Int32, OH_NativePointer)
OH_Int32 impl_webview_WebDownloadItem_getLastErrorCode(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getLastErrorCode(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebDownloadItem_getLastErrorCode, OH_Int32, OH_NativePointer)
OH_String impl_webview_WebDownloadItem_getMethod(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getMethod(thisPtr);
}
KOALA_INTEROP_1(webview_WebDownloadItem_getMethod, KStringPtr, OH_NativePointer)
OH_String impl_webview_WebDownloadItem_getMimeType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getMimeType(thisPtr);
}
KOALA_INTEROP_1(webview_WebDownloadItem_getMimeType, KStringPtr, OH_NativePointer)
OH_String impl_webview_WebDownloadItem_getUrl(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getUrl(thisPtr);
}
KOALA_INTEROP_1(webview_WebDownloadItem_getUrl, KStringPtr, OH_NativePointer)
OH_String impl_webview_WebDownloadItem_getSuggestedFileName(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getSuggestedFileName(thisPtr);
}
KOALA_INTEROP_1(webview_WebDownloadItem_getSuggestedFileName, KStringPtr, OH_NativePointer)
void impl_webview_WebDownloadItem_start(OH_NativePointer thisPtr, const KStringPtr& downloadPath) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->start(thisPtr, (const OH_String*) (&downloadPath));
}
KOALA_INTEROP_V2(webview_WebDownloadItem_start, OH_NativePointer, KStringPtr)
void impl_webview_WebDownloadItem_cancel(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->cancel(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebDownloadItem_cancel, OH_NativePointer)
void impl_webview_WebDownloadItem_pause(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->pause(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebDownloadItem_pause, OH_NativePointer)
void impl_webview_WebDownloadItem_resume(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->resume(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebDownloadItem_resume, OH_NativePointer)
OH_Number impl_webview_WebDownloadItem_getReceivedBytes(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getReceivedBytes(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebDownloadItem_getReceivedBytes, KInteropNumber, OH_NativePointer)
OH_String impl_webview_WebDownloadItem_getFullPath(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->getFullPath(thisPtr);
}
KOALA_INTEROP_1(webview_WebDownloadItem_getFullPath, KStringPtr, OH_NativePointer)
KInteropReturnBuffer impl_webview_WebDownloadItem_serialize(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->serialize(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebDownloadItem_serialize, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_webview_WebDownloadItem_deserialize(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer serializedDataValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebDownloadItem()->deserialize(static_cast<OH_Buffer*>(&serializedDataValueTemp));
}
KOALA_INTEROP_DIRECT_2(webview_WebDownloadItem_deserialize, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebHttpBodyStream_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebHttpBodyStream_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebHttpBodyStream_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebHttpBodyStream_getFinalizer, OH_NativePointer)
void impl_webview_WebHttpBodyStream_initialize(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->initialize(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(webview_WebHttpBodyStream_initialize, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebHttpBodyStream_read(KVMContext vmContext, OH_NativePointer thisPtr, KInteropNumber size, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->read(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_Number*) (&size), static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(webview_WebHttpBodyStream_read, OH_NativePointer, KInteropNumber, KSerializerBuffer, int32_t)
OH_Number impl_webview_WebHttpBodyStream_getSize(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->getSize(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebHttpBodyStream_getSize, KInteropNumber, OH_NativePointer)
OH_Number impl_webview_WebHttpBodyStream_getPosition(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->getPosition(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebHttpBodyStream_getPosition, KInteropNumber, OH_NativePointer)
OH_Boolean impl_webview_WebHttpBodyStream_isChunked(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->isChunked(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebHttpBodyStream_isChunked, OH_Boolean, OH_NativePointer)
OH_Boolean impl_webview_WebHttpBodyStream_isEof(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->isEof(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebHttpBodyStream_isEof, OH_Boolean, OH_NativePointer)
OH_Boolean impl_webview_WebHttpBodyStream_isInMemory(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebHttpBodyStream()->isInMemory(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebHttpBodyStream_isInMemory, OH_Boolean, OH_NativePointer)
OH_NativePointer impl_webview_WebMessageExt_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebMessageExt_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebMessageExt_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebMessageExt_getFinalizer, OH_NativePointer)
OH_Int32 impl_webview_WebMessageExt_getType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->getType(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebMessageExt_getType, OH_Int32, OH_NativePointer)
OH_String impl_webview_WebMessageExt_getString(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->getString(thisPtr);
}
KOALA_INTEROP_1(webview_WebMessageExt_getString, KStringPtr, OH_NativePointer)
OH_Number impl_webview_WebMessageExt_getNumber(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->getNumber(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebMessageExt_getNumber, KInteropNumber, OH_NativePointer)
OH_Boolean impl_webview_WebMessageExt_getBoolean(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->getBoolean(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebMessageExt_getBoolean, OH_Boolean, OH_NativePointer)
KInteropReturnBuffer impl_webview_WebMessageExt_getArrayBuffer(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->getArrayBuffer(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebMessageExt_getArrayBuffer, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_webview_WebMessageExt_getArray(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->getArray(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean retValueTmpElement = retValue.array[retValueCounterI];
            if (retValueTmpElement.selector == 0) {
                _retSerializer.writeInt8(0);
                const auto retValueTmpElementForIdx0 = retValueTmpElement.value0;
                _retSerializer.writeString(retValueTmpElementForIdx0);
            } else if (retValueTmpElement.selector == 1) {
                _retSerializer.writeInt8(1);
                const auto retValueTmpElementForIdx1 = retValueTmpElement.value1;
                _retSerializer.writeNumber(retValueTmpElementForIdx1);
            } else if (retValueTmpElement.selector == 2) {
                _retSerializer.writeInt8(2);
                const auto retValueTmpElementForIdx2 = retValueTmpElement.value2;
                _retSerializer.writeBoolean(retValueTmpElementForIdx2);
            }
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebMessageExt_getArray, KInteropReturnBuffer, OH_NativePointer)
void impl_webview_WebMessageExt_getError(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->getError(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebMessageExt_getError, OH_NativePointer)
void impl_webview_WebMessageExt_setType(OH_NativePointer thisPtr, OH_Int32 type) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->setType(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebMessageType>(type));
}
KOALA_INTEROP_DIRECT_V2(webview_WebMessageExt_setType, OH_NativePointer, OH_Int32)
void impl_webview_WebMessageExt_setString(OH_NativePointer thisPtr, const KStringPtr& message) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->setString(thisPtr, (const OH_String*) (&message));
}
KOALA_INTEROP_V2(webview_WebMessageExt_setString, OH_NativePointer, KStringPtr)
void impl_webview_WebMessageExt_setNumber(OH_NativePointer thisPtr, KInteropNumber message) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->setNumber(thisPtr, (const OH_Number*) (&message));
}
KOALA_INTEROP_DIRECT_V2(webview_WebMessageExt_setNumber, OH_NativePointer, KInteropNumber)
void impl_webview_WebMessageExt_setBoolean(OH_NativePointer thisPtr, OH_Boolean message) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->setBoolean(thisPtr, message);
}
KOALA_INTEROP_DIRECT_V2(webview_WebMessageExt_setBoolean, OH_NativePointer, OH_Boolean)
void impl_webview_WebMessageExt_setArrayBuffer(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer messageValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->setArrayBuffer(thisPtr, static_cast<OH_Buffer*>(&messageValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebMessageExt_setArrayBuffer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebMessageExt_setArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 messageValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_String_Number_Boolean messageValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(messageValueTempTmpBuf)>::type,
        std::decay<decltype(*messageValueTempTmpBuf.array)>::type>(&messageValueTempTmpBuf, messageValueTempTmpBufLength);
        for (int messageValueTempTmpBufBufCounterI = 0; messageValueTempTmpBufBufCounterI < messageValueTempTmpBufLength; messageValueTempTmpBufBufCounterI++) {
            const OH_Int8 messageValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean messageValueTempTmpBufTempBuf = {};
            messageValueTempTmpBufTempBuf.selector = messageValueTempTmpBufTempBufUnionSelector;
            if (messageValueTempTmpBufTempBufUnionSelector == 0) {
                messageValueTempTmpBufTempBuf.selector = 0;
                messageValueTempTmpBufTempBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (messageValueTempTmpBufTempBufUnionSelector == 1) {
                messageValueTempTmpBufTempBuf.selector = 1;
                messageValueTempTmpBufTempBuf.value1 = static_cast<OH_Number>(thisDeserializer.readNumber());
            } else if (messageValueTempTmpBufTempBufUnionSelector == 2) {
                messageValueTempTmpBufTempBuf.selector = 2;
                messageValueTempTmpBufTempBuf.value2 = thisDeserializer.readBoolean();
            } else {
                INTEROP_FATAL("One of the branches for messageValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            messageValueTempTmpBuf.array[messageValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean>(messageValueTempTmpBufTempBuf);
        }
        Array_Union_String_Number_Boolean messageValueTemp = messageValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->setArray(thisPtr, static_cast<Array_Union_String_Number_Boolean*>(&messageValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebMessageExt_setArray, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebMessageExt_setError(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject messageValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessageExt()->setError(thisPtr, static_cast<OH_CustomObject*>(&messageValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebMessageExt_setError, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebMessagePort_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebMessagePort_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebMessagePort_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebMessagePort_getFinalizer, OH_NativePointer)
void impl_webview_WebMessagePort_close(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->close(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebMessagePort_close, OH_NativePointer)
void impl_webview_WebMessagePort_postMessageEvent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 messageValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_WEB_WEBVIEW_WebMessage messageValueTempTmpBuf = {};
        messageValueTempTmpBuf.selector = messageValueTempTmpBufUnionSelector;
        if (messageValueTempTmpBufUnionSelector == 0) {
            messageValueTempTmpBuf.selector = 0;
            messageValueTempTmpBuf.value0 = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
        } else if (messageValueTempTmpBufUnionSelector == 1) {
            messageValueTempTmpBuf.selector = 1;
            messageValueTempTmpBuf.value1 = static_cast<OH_String>(thisDeserializer.readString());
        } else {
            INTEROP_FATAL("One of the branches for messageValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_WEB_WEBVIEW_WebMessage messageValueTemp = static_cast<OH_OHOS_WEB_WEBVIEW_WebMessage>(messageValueTempTmpBuf);;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->postMessageEvent(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_WebMessage*>(&messageValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebMessagePort_postMessageEvent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebMessagePort_onMessageEvent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_WebMessage result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebMessage_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_WebMessage result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebMessage_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->onMessageEvent(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebMessagePort_onMessageEvent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebMessagePort_postMessageEventExt(OH_NativePointer thisPtr, OH_NativePointer message) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->postMessageEventExt(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt>(message));
}
KOALA_INTEROP_DIRECT_V2(webview_WebMessagePort_postMessageEventExt, OH_NativePointer, OH_NativePointer)
void impl_webview_WebMessagePort_onMessageEventExt(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebMessageExt_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebMessageExt_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->onMessageEventExt(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebMessagePort_onMessageEventExt, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_webview_WebMessagePort_getIsExtentionType(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->getIsExtentionType(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeBoolean(retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebMessagePort_getIsExtentionType, KInteropReturnBuffer, OH_NativePointer)
void impl_webview_WebMessagePort_setIsExtentionType(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto isExtentionTypeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean isExtentionTypeValueTempTmpBuf = {};
        isExtentionTypeValueTempTmpBuf.tag = isExtentionTypeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((isExtentionTypeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            isExtentionTypeValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean isExtentionTypeValueTemp = isExtentionTypeValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebMessagePort()->setIsExtentionType(thisPtr, static_cast<Opt_Boolean*>(&isExtentionTypeValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebMessagePort_setIsExtentionType, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebResourceHandler_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebResourceHandler()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebResourceHandler_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebResourceHandler_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebResourceHandler()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebResourceHandler_getFinalizer, OH_NativePointer)
void impl_webview_WebResourceHandler_didReceiveResponse(OH_NativePointer thisPtr, OH_NativePointer response) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebResourceHandler()->didReceiveResponse(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse>(response));
}
KOALA_INTEROP_DIRECT_V2(webview_WebResourceHandler_didReceiveResponse, OH_NativePointer, OH_NativePointer)
void impl_webview_WebResourceHandler_didReceiveResponseBody(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer dataValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebResourceHandler()->didReceiveResponseBody(thisPtr, static_cast<OH_Buffer*>(&dataValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebResourceHandler_didReceiveResponseBody, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebResourceHandler_didFinish(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebResourceHandler()->didFinish(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebResourceHandler_didFinish, OH_NativePointer)
void impl_webview_WebResourceHandler_didFail(OH_NativePointer thisPtr, OH_Int32 code) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebResourceHandler()->didFail(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_WebNetErrorList>(code));
}
KOALA_INTEROP_DIRECT_V2(webview_WebResourceHandler_didFail, OH_NativePointer, OH_Int32)
OH_NativePointer impl_webview_WebSchemeHandler_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandler()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebSchemeHandler_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebSchemeHandler_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandler()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebSchemeHandler_getFinalizer, OH_NativePointer)
void impl_webview_WebSchemeHandler_onRequestStart(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, const OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, const OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandler()->onRequestStart(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebSchemeHandler_onRequestStart, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebSchemeHandler_onRequestStop(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebSchemeHandlerRequest_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebSchemeHandlerRequest_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandler()->onRequestStop(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebSchemeHandler_onRequestStop, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebSchemeHandlerRequest_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebSchemeHandlerRequest_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebSchemeHandlerRequest_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebSchemeHandlerRequest_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_webview_WebSchemeHandlerRequest_getHeader(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->getHeader(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_OHOS_WEB_WEBVIEW_webview_WebHeader retValueTmpElement = retValue.array[retValueCounterI];
            webview_WebHeader_serializer::write(_retSerializer, retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebSchemeHandlerRequest_getHeader, KInteropReturnBuffer, OH_NativePointer)
OH_String impl_webview_WebSchemeHandlerRequest_getRequestUrl(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->getRequestUrl(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerRequest_getRequestUrl, KStringPtr, OH_NativePointer)
OH_String impl_webview_WebSchemeHandlerRequest_getRequestMethod(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->getRequestMethod(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerRequest_getRequestMethod, KStringPtr, OH_NativePointer)
OH_String impl_webview_WebSchemeHandlerRequest_getReferrer(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->getReferrer(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerRequest_getReferrer, KStringPtr, OH_NativePointer)
OH_Boolean impl_webview_WebSchemeHandlerRequest_isMainFrame(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->isMainFrame(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebSchemeHandlerRequest_isMainFrame, OH_Boolean, OH_NativePointer)
OH_Boolean impl_webview_WebSchemeHandlerRequest_hasGesture(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->hasGesture(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebSchemeHandlerRequest_hasGesture, OH_Boolean, OH_NativePointer)
KInteropReturnBuffer impl_webview_WebSchemeHandlerRequest_getHttpBodyStream(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->getHttpBodyStream(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            webview_WebHttpBodyStream_serializer::write(_retSerializer, retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebSchemeHandlerRequest_getHttpBodyStream, KInteropReturnBuffer, OH_NativePointer)
OH_Int32 impl_webview_WebSchemeHandlerRequest_getRequestResourceType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->getRequestResourceType(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebSchemeHandlerRequest_getRequestResourceType, OH_Int32, OH_NativePointer)
OH_String impl_webview_WebSchemeHandlerRequest_getFrameUrl(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerRequest()->getFrameUrl(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerRequest_getFrameUrl, KStringPtr, OH_NativePointer)
OH_NativePointer impl_webview_WebSchemeHandlerResponse_construct() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->construct();
}
KOALA_INTEROP_DIRECT_0(webview_WebSchemeHandlerResponse_construct, OH_NativePointer)
OH_NativePointer impl_webview_WebSchemeHandlerResponse_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebSchemeHandlerResponse_getFinalizer, OH_NativePointer)
void impl_webview_WebSchemeHandlerResponse_setUrl(OH_NativePointer thisPtr, const KStringPtr& url) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->setUrl(thisPtr, (const OH_String*) (&url));
}
KOALA_INTEROP_V2(webview_WebSchemeHandlerResponse_setUrl, OH_NativePointer, KStringPtr)
OH_String impl_webview_WebSchemeHandlerResponse_getUrl(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->getUrl(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerResponse_getUrl, KStringPtr, OH_NativePointer)
void impl_webview_WebSchemeHandlerResponse_setNetErrorCode(OH_NativePointer thisPtr, OH_Int32 code) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->setNetErrorCode(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_WebNetErrorList>(code));
}
KOALA_INTEROP_DIRECT_V2(webview_WebSchemeHandlerResponse_setNetErrorCode, OH_NativePointer, OH_Int32)
OH_Int32 impl_webview_WebSchemeHandlerResponse_getNetErrorCode(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->getNetErrorCode(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebSchemeHandlerResponse_getNetErrorCode, OH_Int32, OH_NativePointer)
void impl_webview_WebSchemeHandlerResponse_setStatus(OH_NativePointer thisPtr, KInteropNumber code) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->setStatus(thisPtr, (const OH_Number*) (&code));
}
KOALA_INTEROP_DIRECT_V2(webview_WebSchemeHandlerResponse_setStatus, OH_NativePointer, KInteropNumber)
OH_Number impl_webview_WebSchemeHandlerResponse_getStatus(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->getStatus(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebSchemeHandlerResponse_getStatus, KInteropNumber, OH_NativePointer)
void impl_webview_WebSchemeHandlerResponse_setStatusText(OH_NativePointer thisPtr, const KStringPtr& text) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->setStatusText(thisPtr, (const OH_String*) (&text));
}
KOALA_INTEROP_V2(webview_WebSchemeHandlerResponse_setStatusText, OH_NativePointer, KStringPtr)
OH_String impl_webview_WebSchemeHandlerResponse_getStatusText(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->getStatusText(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerResponse_getStatusText, KStringPtr, OH_NativePointer)
void impl_webview_WebSchemeHandlerResponse_setMimeType(OH_NativePointer thisPtr, const KStringPtr& type) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->setMimeType(thisPtr, (const OH_String*) (&type));
}
KOALA_INTEROP_V2(webview_WebSchemeHandlerResponse_setMimeType, OH_NativePointer, KStringPtr)
OH_String impl_webview_WebSchemeHandlerResponse_getMimeType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->getMimeType(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerResponse_getMimeType, KStringPtr, OH_NativePointer)
void impl_webview_WebSchemeHandlerResponse_setEncoding(OH_NativePointer thisPtr, const KStringPtr& encoding) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->setEncoding(thisPtr, (const OH_String*) (&encoding));
}
KOALA_INTEROP_V2(webview_WebSchemeHandlerResponse_setEncoding, OH_NativePointer, KStringPtr)
OH_String impl_webview_WebSchemeHandlerResponse_getEncoding(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->getEncoding(thisPtr);
}
KOALA_INTEROP_1(webview_WebSchemeHandlerResponse_getEncoding, KStringPtr, OH_NativePointer)
void impl_webview_WebSchemeHandlerResponse_setHeaderByName(OH_NativePointer thisPtr, const KStringPtr& name, const KStringPtr& value, OH_Boolean overwrite) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->setHeaderByName(thisPtr, (const OH_String*) (&name), (const OH_String*) (&value), overwrite);
}
KOALA_INTEROP_V4(webview_WebSchemeHandlerResponse_setHeaderByName, OH_NativePointer, KStringPtr, KStringPtr, OH_Boolean)
OH_String impl_webview_WebSchemeHandlerResponse_getHeaderByName(OH_NativePointer thisPtr, const KStringPtr& name) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebSchemeHandlerResponse()->getHeaderByName(thisPtr, (const OH_String*) (&name));
}
KOALA_INTEROP_2(webview_WebSchemeHandlerResponse_getHeaderByName, KStringPtr, OH_NativePointer, KStringPtr)
OH_NativePointer impl_webview_WebviewController_construct(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto webTagValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_String webTagValueTempTmpBuf = {};
        webTagValueTempTmpBuf.tag = webTagValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((webTagValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            webTagValueTempTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String webTagValueTemp = webTagValueTempTmpBuf;;
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->construct(static_cast<Opt_String*>(&webTagValueTemp));
}
KOALA_INTEROP_DIRECT_2(webview_WebviewController_construct, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebviewController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->destruct;
}
KOALA_INTEROP_DIRECT_0(webview_WebviewController_getFinalizer, OH_NativePointer)
void impl_webview_WebviewController_initializeWebEngine() {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->initializeWebEngine();
}
KOALA_INTEROP_DIRECT_V0(webview_WebviewController_initializeWebEngine)
void impl_webview_WebviewController_setHttpDns(OH_Int32 secureDnsMode, const KStringPtr& secureDnsConfig) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setHttpDns(static_cast<OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode>(secureDnsMode), (const OH_String*) (&secureDnsConfig));
}
KOALA_INTEROP_V2(webview_WebviewController_setHttpDns, OH_Int32, KStringPtr)
void impl_webview_WebviewController_setWebDebuggingAccess0(OH_Boolean webDebuggingAccess) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setWebDebuggingAccess0(webDebuggingAccess);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_setWebDebuggingAccess0, OH_Boolean)
void impl_webview_WebviewController_enableSafeBrowsing(OH_NativePointer thisPtr, OH_Boolean enable) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->enableSafeBrowsing(thisPtr, enable);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_enableSafeBrowsing, OH_NativePointer, OH_Boolean)
OH_Boolean impl_webview_WebviewController_isSafeBrowsingEnabled(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->isSafeBrowsingEnabled(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_isSafeBrowsingEnabled, OH_Boolean, OH_NativePointer)
OH_Boolean impl_webview_WebviewController_accessForward(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->accessForward(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_accessForward, OH_Boolean, OH_NativePointer)
OH_Boolean impl_webview_WebviewController_accessBackward(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->accessBackward(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_accessBackward, OH_Boolean, OH_NativePointer)
OH_Boolean impl_webview_WebviewController_accessStep(OH_NativePointer thisPtr, KInteropNumber step) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->accessStep(thisPtr, (const OH_Number*) (&step));
}
KOALA_INTEROP_DIRECT_2(webview_WebviewController_accessStep, OH_Boolean, OH_NativePointer, KInteropNumber)
void impl_webview_WebviewController_forward(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->forward(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_forward, OH_NativePointer)
void impl_webview_WebviewController_backward(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->backward(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_backward, OH_NativePointer)
void impl_webview_WebviewController_clearHistory(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearHistory(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_clearHistory, OH_NativePointer)
void impl_webview_WebviewController_onActive(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->onActive(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_onActive, OH_NativePointer)
void impl_webview_WebviewController_onInactive(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->onInactive(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_onInactive, OH_NativePointer)
void impl_webview_WebviewController_refresh(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->refresh(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_refresh, OH_NativePointer)
void impl_webview_WebviewController_loadData(OH_NativePointer thisPtr, const KStringPtr& data, const KStringPtr& mimeType, const KStringPtr& encoding, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto baseUrlValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_String baseUrlValueTempTmpBuf = {};
        baseUrlValueTempTmpBuf.tag = baseUrlValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((baseUrlValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            baseUrlValueTempTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String baseUrlValueTemp = baseUrlValueTempTmpBuf;;
        const auto historyUrlValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_String historyUrlValueTempTmpBuf = {};
        historyUrlValueTempTmpBuf.tag = historyUrlValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((historyUrlValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            historyUrlValueTempTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String historyUrlValueTemp = historyUrlValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->loadData(thisPtr, (const OH_String*) (&data), (const OH_String*) (&mimeType), (const OH_String*) (&encoding), static_cast<Opt_String*>(&baseUrlValueTemp), static_cast<Opt_String*>(&historyUrlValueTemp));
}
KOALA_INTEROP_V6(webview_WebviewController_loadData, OH_NativePointer, KStringPtr, KStringPtr, KStringPtr, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_loadUrl(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 urlValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_WEB_WEBVIEW_Union_String_Resource urlValueTempTmpBuf = {};
        urlValueTempTmpBuf.selector = urlValueTempTmpBufUnionSelector;
        if (urlValueTempTmpBufUnionSelector == 0) {
            urlValueTempTmpBuf.selector = 0;
            urlValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (urlValueTempTmpBufUnionSelector == 1) {
            urlValueTempTmpBuf.selector = 1;
            urlValueTempTmpBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for urlValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_WEB_WEBVIEW_Union_String_Resource urlValueTemp = static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Resource>(urlValueTempTmpBuf);;
        const auto headersValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_webview_WebHeader headersValueTempTmpBuf = {};
        headersValueTempTmpBuf.tag = headersValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((headersValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 headersValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_webview_WebHeader headersValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(headersValueTempTmpBuf_)>::type,
        std::decay<decltype(*headersValueTempTmpBuf_.array)>::type>(&headersValueTempTmpBuf_, headersValueTempTmpBuf_Length);
            for (int headersValueTempTmpBuf_BufCounterI = 0; headersValueTempTmpBuf_BufCounterI < headersValueTempTmpBuf_Length; headersValueTempTmpBuf_BufCounterI++) {
                headersValueTempTmpBuf_.array[headersValueTempTmpBuf_BufCounterI] = webview_WebHeader_serializer::read(thisDeserializer);
            }
            headersValueTempTmpBuf.value = headersValueTempTmpBuf_;
        }
        Opt_Array_webview_WebHeader headersValueTemp = headersValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->loadUrl(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Resource*>(&urlValueTemp), static_cast<Opt_Array_webview_WebHeader*>(&headersValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_loadUrl, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_storeWebArchive0(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& baseName, OH_Boolean autoName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->storeWebArchive0(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&baseName), autoName, static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(webview_WebviewController_storeWebArchive0, OH_NativePointer, KStringPtr, OH_Boolean, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_storeWebArchive1(OH_NativePointer thisPtr, const KStringPtr& baseName, OH_Boolean autoName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->storeWebArchive1(thisPtr, (const OH_String*) (&baseName), autoName, static_cast<OHOS_WEB_WEBVIEW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V5(webview_WebviewController_storeWebArchive1, OH_NativePointer, KStringPtr, OH_Boolean, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_zoom(OH_NativePointer thisPtr, KDouble factor) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->zoom(thisPtr, factor);
}
KOALA_INTEROP_V2(webview_WebviewController_zoom, OH_NativePointer, KDouble)
void impl_webview_WebviewController_zoomIn(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->zoomIn(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_zoomIn, OH_NativePointer)
void impl_webview_WebviewController_zoomOut(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->zoomOut(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_zoomOut, OH_NativePointer)
OH_Int32 impl_webview_WebviewController_getWebId(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getWebId(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getWebId, OH_Int32, OH_NativePointer)
OH_String impl_webview_WebviewController_getUserAgent(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getUserAgent(thisPtr);
}
KOALA_INTEROP_1(webview_WebviewController_getUserAgent, KStringPtr, OH_NativePointer)
OH_String impl_webview_WebviewController_getTitle(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getTitle(thisPtr);
}
KOALA_INTEROP_1(webview_WebviewController_getTitle, KStringPtr, OH_NativePointer)
OH_Int32 impl_webview_WebviewController_getPageHeight(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getPageHeight(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getPageHeight, OH_Int32, OH_NativePointer)
void impl_webview_WebviewController_backOrForward(OH_NativePointer thisPtr, KInteropNumber step) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->backOrForward(thisPtr, (const OH_Number*) (&step));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_backOrForward, OH_NativePointer, KInteropNumber)
void impl_webview_WebviewController_requestFocus(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->requestFocus(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_requestFocus, OH_NativePointer)
KInteropReturnBuffer impl_webview_WebviewController_createWebMessagePorts(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto isExtentionTypeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean isExtentionTypeValueTempTmpBuf = {};
        isExtentionTypeValueTempTmpBuf.tag = isExtentionTypeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((isExtentionTypeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            isExtentionTypeValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean isExtentionTypeValueTemp = isExtentionTypeValueTempTmpBuf;;
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->createWebMessagePorts(thisPtr, static_cast<Opt_Boolean*>(&isExtentionTypeValueTemp));
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort retValueTmpElement = retValue.array[retValueCounterI];
            webview_WebMessagePort_serializer::write(_retSerializer, retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_3(webview_WebviewController_createWebMessagePorts, KInteropReturnBuffer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_postMessage(OH_NativePointer thisPtr, const KStringPtr& name, KSerializerBuffer thisArray, int32_t thisLength, const KStringPtr& uri) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 portsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_webview_WebMessagePort portsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(portsValueTempTmpBuf)>::type,
        std::decay<decltype(*portsValueTempTmpBuf.array)>::type>(&portsValueTempTmpBuf, portsValueTempTmpBufLength);
        for (int portsValueTempTmpBufBufCounterI = 0; portsValueTempTmpBufBufCounterI < portsValueTempTmpBufLength; portsValueTempTmpBufBufCounterI++) {
            portsValueTempTmpBuf.array[portsValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort>(webview_WebMessagePort_serializer::read(thisDeserializer));
        }
        Array_webview_WebMessagePort portsValueTemp = portsValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->postMessage(thisPtr, (const OH_String*) (&name), static_cast<Array_webview_WebMessagePort*>(&portsValueTemp), (const OH_String*) (&uri));
}
KOALA_INTEROP_V5(webview_WebviewController_postMessage, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t, KStringPtr)
void impl_webview_WebviewController_stop(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->stop(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_stop, OH_NativePointer)
void impl_webview_WebviewController_registerJavaScriptProxy(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, const KStringPtr& name) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Object jsObjectValueTemp = static_cast<OH_Object>(thisDeserializer.readObject());;
        const OH_Int32 methodListValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String methodListValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(methodListValueTempTmpBuf)>::type,
        std::decay<decltype(*methodListValueTempTmpBuf.array)>::type>(&methodListValueTempTmpBuf, methodListValueTempTmpBufLength);
        for (int methodListValueTempTmpBufBufCounterI = 0; methodListValueTempTmpBufBufCounterI < methodListValueTempTmpBufLength; methodListValueTempTmpBufBufCounterI++) {
            methodListValueTempTmpBuf.array[methodListValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String methodListValueTemp = methodListValueTempTmpBuf;;
        const auto asyncMethodListValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_String asyncMethodListValueTempTmpBuf = {};
        asyncMethodListValueTempTmpBuf.tag = asyncMethodListValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((asyncMethodListValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 asyncMethodListValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_String asyncMethodListValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(asyncMethodListValueTempTmpBuf_)>::type,
        std::decay<decltype(*asyncMethodListValueTempTmpBuf_.array)>::type>(&asyncMethodListValueTempTmpBuf_, asyncMethodListValueTempTmpBuf_Length);
            for (int asyncMethodListValueTempTmpBuf_BufCounterI = 0; asyncMethodListValueTempTmpBuf_BufCounterI < asyncMethodListValueTempTmpBuf_Length; asyncMethodListValueTempTmpBuf_BufCounterI++) {
                asyncMethodListValueTempTmpBuf_.array[asyncMethodListValueTempTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
            }
            asyncMethodListValueTempTmpBuf.value = asyncMethodListValueTempTmpBuf_;
        }
        Opt_Array_String asyncMethodListValueTemp = asyncMethodListValueTempTmpBuf;;
        const auto permissionValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_String permissionValueTempTmpBuf = {};
        permissionValueTempTmpBuf.tag = permissionValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((permissionValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            permissionValueTempTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String permissionValueTemp = permissionValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->registerJavaScriptProxy(thisPtr, static_cast<OH_Object*>(&jsObjectValueTemp), (const OH_String*) (&name), static_cast<Array_String*>(&methodListValueTemp), static_cast<Opt_Array_String*>(&asyncMethodListValueTemp), static_cast<Opt_String*>(&permissionValueTemp));
}
KOALA_INTEROP_V4(webview_WebviewController_registerJavaScriptProxy, OH_NativePointer, KSerializerBuffer, int32_t, KStringPtr)
void impl_webview_WebviewController_deleteJavaScriptRegister(OH_NativePointer thisPtr, const KStringPtr& name) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->deleteJavaScriptRegister(thisPtr, (const OH_String*) (&name));
}
KOALA_INTEROP_V2(webview_WebviewController_deleteJavaScriptRegister, OH_NativePointer, KStringPtr)
void impl_webview_WebviewController_searchAllAsync(OH_NativePointer thisPtr, const KStringPtr& searchString) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->searchAllAsync(thisPtr, (const OH_String*) (&searchString));
}
KOALA_INTEROP_V2(webview_WebviewController_searchAllAsync, OH_NativePointer, KStringPtr)
void impl_webview_WebviewController_clearMatches(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearMatches(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_clearMatches, OH_NativePointer)
void impl_webview_WebviewController_searchNext(OH_NativePointer thisPtr, OH_Boolean forward) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->searchNext(thisPtr, forward);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_searchNext, OH_NativePointer, OH_Boolean)
void impl_webview_WebviewController_clearSslCache(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearSslCache(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_clearSslCache, OH_NativePointer)
void impl_webview_WebviewController_clearClientAuthenticationCache(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearClientAuthenticationCache(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_clearClientAuthenticationCache, OH_NativePointer)
void impl_webview_WebviewController_runJavaScript0(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& script, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->runJavaScript0(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&script), static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(webview_WebviewController_runJavaScript0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_runJavaScript1(OH_NativePointer thisPtr, const KStringPtr& script, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->runJavaScript1(thisPtr, (const OH_String*) (&script), static_cast<OHOS_WEB_WEBVIEW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(webview_WebviewController_runJavaScript1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_runJavaScriptExt0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 scriptValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_WEB_WEBVIEW_Union_String_Buffer scriptValueTempTmpBuf = {};
        scriptValueTempTmpBuf.selector = scriptValueTempTmpBufUnionSelector;
        if (scriptValueTempTmpBufUnionSelector == 0) {
            scriptValueTempTmpBuf.selector = 0;
            scriptValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (scriptValueTempTmpBufUnionSelector == 1) {
            scriptValueTempTmpBuf.selector = 1;
            scriptValueTempTmpBuf.value1 = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
        } else {
            INTEROP_FATAL("One of the branches for scriptValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_WEB_WEBVIEW_Union_String_Buffer scriptValueTemp = static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Buffer>(scriptValueTempTmpBuf);;
        OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->runJavaScriptExt0(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Buffer*>(&scriptValueTemp), static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(webview_WebviewController_runJavaScriptExt0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_runJavaScriptExt1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 scriptValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_WEB_WEBVIEW_Union_String_Buffer scriptValueTempTmpBuf = {};
        scriptValueTempTmpBuf.selector = scriptValueTempTmpBufUnionSelector;
        if (scriptValueTempTmpBufUnionSelector == 0) {
            scriptValueTempTmpBuf.selector = 0;
            scriptValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (scriptValueTempTmpBufUnionSelector == 1) {
            scriptValueTempTmpBuf.selector = 1;
            scriptValueTempTmpBuf.value1 = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
        } else {
            INTEROP_FATAL("One of the branches for scriptValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_WEB_WEBVIEW_Union_String_Buffer scriptValueTemp = static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Buffer>(scriptValueTempTmpBuf);;
        OHOS_WEB_WEBVIEW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->runJavaScriptExt1(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Buffer*>(&scriptValueTemp), static_cast<OHOS_WEB_WEBVIEW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_runJavaScriptExt1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_createPdf0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration configurationValueTemp = webview_PdfConfiguration_serializer::read(thisDeserializer);;
        OHOS_WEB_WEBVIEW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->createPdf0(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration*>(&configurationValueTemp), static_cast<OHOS_WEB_WEBVIEW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_createPdf0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_createPdf1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration configurationValueTemp = webview_PdfConfiguration_serializer::read(thisDeserializer);;
        OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PdfData_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PdfData_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->createPdf1(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration*>(&configurationValueTemp), static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(webview_WebviewController_createPdf1, OH_NativePointer, KSerializerBuffer, int32_t)
OH_String impl_webview_WebviewController_getUrl(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getUrl(thisPtr);
}
KOALA_INTEROP_1(webview_WebviewController_getUrl, KStringPtr, OH_NativePointer)
void impl_webview_WebviewController_pageUp(OH_NativePointer thisPtr, OH_Boolean top) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->pageUp(thisPtr, top);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_pageUp, OH_NativePointer, OH_Boolean)
void impl_webview_WebviewController_pageDown(OH_NativePointer thisPtr, OH_Boolean bottom) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->pageDown(thisPtr, bottom);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_pageDown, OH_NativePointer, OH_Boolean)
OH_String impl_webview_WebviewController_getOriginalUrl(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getOriginalUrl(thisPtr);
}
KOALA_INTEROP_1(webview_WebviewController_getOriginalUrl, KStringPtr, OH_NativePointer)
OH_NativePointer impl_webview_WebviewController_getFavicon(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getFavicon(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getFavicon, OH_NativePointer, OH_NativePointer)
void impl_webview_WebviewController_setNetworkAvailable(OH_NativePointer thisPtr, OH_Boolean enable) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setNetworkAvailable(thisPtr, enable);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_setNetworkAvailable, OH_NativePointer, OH_Boolean)
void impl_webview_WebviewController_hasImage0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Boolean_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->hasImage0(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(webview_WebviewController_hasImage0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_hasImage1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->hasImage1(thisPtr, static_cast<OHOS_WEB_WEBVIEW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_hasImage1, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebviewController_getBackForwardEntries(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getBackForwardEntries(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getBackForwardEntries, OH_NativePointer, OH_NativePointer)
void impl_webview_WebviewController_removeCache(OH_NativePointer thisPtr, OH_Boolean clearRom) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->removeCache(thisPtr, clearRom);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_removeCache, OH_NativePointer, OH_Boolean)
void impl_webview_WebviewController_removeAllCache(OH_Boolean clearRom) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->removeAllCache(clearRom);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_removeAllCache, OH_Boolean)
void impl_webview_WebviewController_scrollTo(OH_NativePointer thisPtr, KDouble x, KDouble y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto durationValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 durationValueTempTmpBuf = {};
        durationValueTempTmpBuf.tag = durationValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((durationValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            durationValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 durationValueTemp = durationValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->scrollTo(thisPtr, x, y, static_cast<Opt_Int32*>(&durationValueTemp));
}
KOALA_INTEROP_V5(webview_WebviewController_scrollTo, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_scrollBy(OH_NativePointer thisPtr, KDouble deltaX, KDouble deltaY, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto durationValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 durationValueTempTmpBuf = {};
        durationValueTempTmpBuf.tag = durationValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((durationValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            durationValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 durationValueTemp = durationValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->scrollBy(thisPtr, deltaX, deltaY, static_cast<Opt_Int32*>(&durationValueTemp));
}
KOALA_INTEROP_V5(webview_WebviewController_scrollBy, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_slideScroll(OH_NativePointer thisPtr, KDouble vx, KDouble vy) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->slideScroll(thisPtr, vx, vy);
}
KOALA_INTEROP_V3(webview_WebviewController_slideScroll, OH_NativePointer, KDouble, KDouble)
KInteropReturnBuffer impl_webview_WebviewController_serializeWebState(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->serializeWebState(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebviewController_serializeWebState, KInteropReturnBuffer, OH_NativePointer)
void impl_webview_WebviewController_restoreWebState(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer stateValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->restoreWebState(thisPtr, static_cast<OH_Buffer*>(&stateValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_restoreWebState, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_customizeSchemes(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 schemesValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_webview_WebCustomScheme schemesValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(schemesValueTempTmpBuf)>::type,
        std::decay<decltype(*schemesValueTempTmpBuf.array)>::type>(&schemesValueTempTmpBuf, schemesValueTempTmpBufLength);
        for (int schemesValueTempTmpBufBufCounterI = 0; schemesValueTempTmpBufBufCounterI < schemesValueTempTmpBufLength; schemesValueTempTmpBufBufCounterI++) {
            schemesValueTempTmpBuf.array[schemesValueTempTmpBufBufCounterI] = webview_WebCustomScheme_serializer::read(thisDeserializer);
        }
        Array_webview_WebCustomScheme schemesValueTemp = schemesValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->customizeSchemes(static_cast<Array_webview_WebCustomScheme*>(&schemesValueTemp));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_customizeSchemes, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_getCertificate0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_cert_X509Cert value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_cert_X509Cert value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getCertificate0(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(webview_WebviewController_getCertificate0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_getCertificate1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getCertificate1(thisPtr, static_cast<OHOS_WEB_WEBVIEW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_getCertificate1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_setAudioMuted(OH_NativePointer thisPtr, OH_Boolean mute) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setAudioMuted(thisPtr, mute);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_setAudioMuted, OH_NativePointer, OH_Boolean)
void impl_webview_WebviewController_prefetchPage(OH_NativePointer thisPtr, const KStringPtr& url, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto additionalHeadersValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_webview_WebHeader additionalHeadersValueTempTmpBuf = {};
        additionalHeadersValueTempTmpBuf.tag = additionalHeadersValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((additionalHeadersValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 additionalHeadersValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_webview_WebHeader additionalHeadersValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(additionalHeadersValueTempTmpBuf_)>::type,
        std::decay<decltype(*additionalHeadersValueTempTmpBuf_.array)>::type>(&additionalHeadersValueTempTmpBuf_, additionalHeadersValueTempTmpBuf_Length);
            for (int additionalHeadersValueTempTmpBuf_BufCounterI = 0; additionalHeadersValueTempTmpBuf_BufCounterI < additionalHeadersValueTempTmpBuf_Length; additionalHeadersValueTempTmpBuf_BufCounterI++) {
                additionalHeadersValueTempTmpBuf_.array[additionalHeadersValueTempTmpBuf_BufCounterI] = webview_WebHeader_serializer::read(thisDeserializer);
            }
            additionalHeadersValueTempTmpBuf.value = additionalHeadersValueTempTmpBuf_;
        }
        Opt_Array_webview_WebHeader additionalHeadersValueTemp = additionalHeadersValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->prefetchPage(thisPtr, (const OH_String*) (&url), static_cast<Opt_Array_webview_WebHeader*>(&additionalHeadersValueTemp));
}
KOALA_INTEROP_V4(webview_WebviewController_prefetchPage, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_prepareForPageLoad(const KStringPtr& url, OH_Boolean preconnectable, KInteropNumber numSockets) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->prepareForPageLoad((const OH_String*) (&url), preconnectable, (const OH_Number*) (&numSockets));
}
KOALA_INTEROP_V3(webview_WebviewController_prepareForPageLoad, KStringPtr, OH_Boolean, KInteropNumber)
void impl_webview_WebviewController_setCustomUserAgent(OH_NativePointer thisPtr, const KStringPtr& userAgent) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setCustomUserAgent(thisPtr, (const OH_String*) (&userAgent));
}
KOALA_INTEROP_V2(webview_WebviewController_setCustomUserAgent, OH_NativePointer, KStringPtr)
OH_String impl_webview_WebviewController_getCustomUserAgent(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getCustomUserAgent(thisPtr);
}
KOALA_INTEROP_1(webview_WebviewController_getCustomUserAgent, KStringPtr, OH_NativePointer)
void impl_webview_WebviewController_setConnectionTimeout(KInteropNumber timeout) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setConnectionTimeout((const OH_Number*) (&timeout));
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_setConnectionTimeout, KInteropNumber)
void impl_webview_WebviewController_setDownloadDelegate(OH_NativePointer thisPtr, OH_NativePointer delegate) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setDownloadDelegate(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate>(delegate));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_setDownloadDelegate, OH_NativePointer, OH_NativePointer)
void impl_webview_WebviewController_startDownload(OH_NativePointer thisPtr, const KStringPtr& url) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->startDownload(thisPtr, (const OH_String*) (&url));
}
KOALA_INTEROP_V2(webview_WebviewController_startDownload, OH_NativePointer, KStringPtr)
void impl_webview_WebviewController_postUrl(OH_NativePointer thisPtr, const KStringPtr& url, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer postDataValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->postUrl(thisPtr, (const OH_String*) (&url), static_cast<OH_Buffer*>(&postDataValueTemp));
}
KOALA_INTEROP_V4(webview_WebviewController_postUrl, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_NativePointer impl_webview_WebviewController_createWebPrintDocumentAdapter(OH_NativePointer thisPtr, const KStringPtr& jobName) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->createWebPrintDocumentAdapter(thisPtr, (const OH_String*) (&jobName));
}
KOALA_INTEROP_2(webview_WebviewController_createWebPrintDocumentAdapter, OH_NativePointer, OH_NativePointer, KStringPtr)
OH_Int32 impl_webview_WebviewController_getSecurityLevel(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getSecurityLevel(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getSecurityLevel, OH_Int32, OH_NativePointer)
OH_Boolean impl_webview_WebviewController_isIncognitoMode(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->isIncognitoMode(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_isIncognitoMode, OH_Boolean, OH_NativePointer)
void impl_webview_WebviewController_setScrollable(OH_NativePointer thisPtr, OH_Boolean enable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto typeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_webview_ScrollType typeValueTempTmpBuf = {};
        typeValueTempTmpBuf.tag = typeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((typeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            typeValueTempTmpBuf.value = static_cast<OH_OHOS_WEB_WEBVIEW_webview_ScrollType>(thisDeserializer.readInt32());
        }
        Opt_webview_ScrollType typeValueTemp = typeValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setScrollable(thisPtr, enable, static_cast<Opt_webview_ScrollType*>(&typeValueTemp));
}
KOALA_INTEROP_DIRECT_V4(webview_WebviewController_setScrollable, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
OH_Boolean impl_webview_WebviewController_getScrollable(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getScrollable(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getScrollable, OH_Boolean, OH_NativePointer)
void impl_webview_WebviewController_setPrintBackground(OH_NativePointer thisPtr, OH_Boolean enable) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setPrintBackground(thisPtr, enable);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_setPrintBackground, OH_NativePointer, OH_Boolean)
OH_Boolean impl_webview_WebviewController_getPrintBackground(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getPrintBackground(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getPrintBackground, OH_Boolean, OH_NativePointer)
OH_String impl_webview_WebviewController_getLastJavascriptProxyCallingFrameUrl(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getLastJavascriptProxyCallingFrameUrl(thisPtr);
}
KOALA_INTEROP_1(webview_WebviewController_getLastJavascriptProxyCallingFrameUrl, KStringPtr, OH_NativePointer)
void impl_webview_WebviewController_startCamera(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->startCamera(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_startCamera, OH_NativePointer)
void impl_webview_WebviewController_stopCamera(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->stopCamera(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_stopCamera, OH_NativePointer)
void impl_webview_WebviewController_closeCamera(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->closeCamera(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_closeCamera, OH_NativePointer)
void impl_webview_WebviewController_pauseAllTimers() {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->pauseAllTimers();
}
KOALA_INTEROP_DIRECT_V0(webview_WebviewController_pauseAllTimers)
void impl_webview_WebviewController_resumeAllTimers() {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->resumeAllTimers();
}
KOALA_INTEROP_DIRECT_V0(webview_WebviewController_resumeAllTimers)
void impl_webview_WebviewController_stopAllMedia(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->stopAllMedia(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_stopAllMedia, OH_NativePointer)
void impl_webview_WebviewController_resumeAllMedia(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->resumeAllMedia(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_resumeAllMedia, OH_NativePointer)
void impl_webview_WebviewController_pauseAllMedia(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->pauseAllMedia(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_pauseAllMedia, OH_NativePointer)
void impl_webview_WebviewController_closeAllMediaPresentations(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->closeAllMediaPresentations(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_closeAllMediaPresentations, OH_NativePointer)
OH_Int32 impl_webview_WebviewController_getMediaPlaybackState(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getMediaPlaybackState(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_getMediaPlaybackState, OH_Int32, OH_NativePointer)
void impl_webview_WebviewController_setWebSchemeHandler(OH_NativePointer thisPtr, const KStringPtr& scheme, OH_NativePointer handler) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setWebSchemeHandler(thisPtr, (const OH_String*) (&scheme), static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler>(handler));
}
KOALA_INTEROP_V3(webview_WebviewController_setWebSchemeHandler, OH_NativePointer, KStringPtr, OH_NativePointer)
void impl_webview_WebviewController_clearWebSchemeHandler(OH_NativePointer thisPtr) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearWebSchemeHandler(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_clearWebSchemeHandler, OH_NativePointer)
void impl_webview_WebviewController_setServiceWorkerWebSchemeHandler(const KStringPtr& scheme, OH_NativePointer handler) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setServiceWorkerWebSchemeHandler((const OH_String*) (&scheme), static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler>(handler));
}
KOALA_INTEROP_V2(webview_WebviewController_setServiceWorkerWebSchemeHandler, KStringPtr, OH_NativePointer)
void impl_webview_WebviewController_clearServiceWorkerWebSchemeHandler() {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearServiceWorkerWebSchemeHandler();
}
KOALA_INTEROP_DIRECT_V0(webview_WebviewController_clearServiceWorkerWebSchemeHandler)
void impl_webview_WebviewController_enableIntelligentTrackingPrevention(OH_NativePointer thisPtr, OH_Boolean enable) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->enableIntelligentTrackingPrevention(thisPtr, enable);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_enableIntelligentTrackingPrevention, OH_NativePointer, OH_Boolean)
OH_Boolean impl_webview_WebviewController_isIntelligentTrackingPreventionEnabled(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->isIntelligentTrackingPreventionEnabled(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_isIntelligentTrackingPreventionEnabled, OH_Boolean, OH_NativePointer)
void impl_webview_WebviewController_addIntelligentTrackingPreventionBypassingList(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 hostListValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String hostListValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(hostListValueTempTmpBuf)>::type,
        std::decay<decltype(*hostListValueTempTmpBuf.array)>::type>(&hostListValueTempTmpBuf, hostListValueTempTmpBufLength);
        for (int hostListValueTempTmpBufBufCounterI = 0; hostListValueTempTmpBufBufCounterI < hostListValueTempTmpBufLength; hostListValueTempTmpBufBufCounterI++) {
            hostListValueTempTmpBuf.array[hostListValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String hostListValueTemp = hostListValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->addIntelligentTrackingPreventionBypassingList(static_cast<Array_String*>(&hostListValueTemp));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_addIntelligentTrackingPreventionBypassingList, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_removeIntelligentTrackingPreventionBypassingList(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 hostListValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String hostListValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(hostListValueTempTmpBuf)>::type,
        std::decay<decltype(*hostListValueTempTmpBuf.array)>::type>(&hostListValueTempTmpBuf, hostListValueTempTmpBufLength);
        for (int hostListValueTempTmpBufBufCounterI = 0; hostListValueTempTmpBufBufCounterI < hostListValueTempTmpBufLength; hostListValueTempTmpBufBufCounterI++) {
            hostListValueTempTmpBuf.array[hostListValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String hostListValueTemp = hostListValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->removeIntelligentTrackingPreventionBypassingList(static_cast<Array_String*>(&hostListValueTemp));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_removeIntelligentTrackingPreventionBypassingList, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_clearIntelligentTrackingPreventionBypassingList() {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearIntelligentTrackingPreventionBypassingList();
}
KOALA_INTEROP_DIRECT_V0(webview_WebviewController_clearIntelligentTrackingPreventionBypassingList)
OH_String impl_webview_WebviewController_getDefaultUserAgent() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getDefaultUserAgent();
}
KOALA_INTEROP_0(webview_WebviewController_getDefaultUserAgent, KStringPtr)
void impl_webview_WebviewController_onCreateNativeMediaPlayer(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_CreateNativeMediaPlayerCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_CreateNativeMediaPlayerCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->onCreateNativeMediaPlayer(thisPtr, static_cast<OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_onCreateNativeMediaPlayer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_enableWholeWebPageDrawing() {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->enableWholeWebPageDrawing();
}
KOALA_INTEROP_DIRECT_V0(webview_WebviewController_enableWholeWebPageDrawing)
void impl_webview_WebviewController_webPageSnapshot(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo infoValueTemp = webview_SnapshotInfo_serializer::read(thisDeserializer);;
        OHOS_WEB_WEBVIEW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->webPageSnapshot(thisPtr, static_cast<OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo*>(&infoValueTemp), static_cast<OHOS_WEB_WEBVIEW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_webPageSnapshot, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_prefetchResource(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WEB_WEBVIEW_webview_RequestInfo requestValueTemp = webview_RequestInfo_serializer::read(thisDeserializer);;
        const auto additionalHeadersValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_webview_WebHeader additionalHeadersValueTempTmpBuf = {};
        additionalHeadersValueTempTmpBuf.tag = additionalHeadersValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((additionalHeadersValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 additionalHeadersValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_webview_WebHeader additionalHeadersValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(additionalHeadersValueTempTmpBuf_)>::type,
        std::decay<decltype(*additionalHeadersValueTempTmpBuf_.array)>::type>(&additionalHeadersValueTempTmpBuf_, additionalHeadersValueTempTmpBuf_Length);
            for (int additionalHeadersValueTempTmpBuf_BufCounterI = 0; additionalHeadersValueTempTmpBuf_BufCounterI < additionalHeadersValueTempTmpBuf_Length; additionalHeadersValueTempTmpBuf_BufCounterI++) {
                additionalHeadersValueTempTmpBuf_.array[additionalHeadersValueTempTmpBuf_BufCounterI] = webview_WebHeader_serializer::read(thisDeserializer);
            }
            additionalHeadersValueTempTmpBuf.value = additionalHeadersValueTempTmpBuf_;
        }
        Opt_Array_webview_WebHeader additionalHeadersValueTemp = additionalHeadersValueTempTmpBuf;;
        const auto cacheKeyValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_String cacheKeyValueTempTmpBuf = {};
        cacheKeyValueTempTmpBuf.tag = cacheKeyValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((cacheKeyValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            cacheKeyValueTempTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String cacheKeyValueTemp = cacheKeyValueTempTmpBuf;;
        const auto cacheValidTimeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 cacheValidTimeValueTempTmpBuf = {};
        cacheValidTimeValueTempTmpBuf.tag = cacheValidTimeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((cacheValidTimeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            cacheValidTimeValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 cacheValidTimeValueTemp = cacheValidTimeValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->prefetchResource(static_cast<OH_OHOS_WEB_WEBVIEW_webview_RequestInfo*>(&requestValueTemp), static_cast<Opt_Array_webview_WebHeader*>(&additionalHeadersValueTemp), static_cast<Opt_String*>(&cacheKeyValueTemp), static_cast<Opt_Int32*>(&cacheValidTimeValueTemp));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_prefetchResource, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_clearPrefetchedResource(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 cacheKeyListValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String cacheKeyListValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(cacheKeyListValueTempTmpBuf)>::type,
        std::decay<decltype(*cacheKeyListValueTempTmpBuf.array)>::type>(&cacheKeyListValueTempTmpBuf, cacheKeyListValueTempTmpBufLength);
        for (int cacheKeyListValueTempTmpBufBufCounterI = 0; cacheKeyListValueTempTmpBufBufCounterI < cacheKeyListValueTempTmpBufLength; cacheKeyListValueTempTmpBufBufCounterI++) {
            cacheKeyListValueTempTmpBuf.array[cacheKeyListValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String cacheKeyListValueTemp = cacheKeyListValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearPrefetchedResource(static_cast<Array_String*>(&cacheKeyListValueTemp));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_clearPrefetchedResource, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_setRenderProcessMode(OH_Int32 mode) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setRenderProcessMode(static_cast<OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode>(mode));
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_setRenderProcessMode, OH_Int32)
OH_Int32 impl_webview_WebviewController_getRenderProcessMode() {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getRenderProcessMode();
}
KOALA_INTEROP_DIRECT_0(webview_WebviewController_getRenderProcessMode, OH_Int32)
OH_Boolean impl_webview_WebviewController_terminateRenderProcess(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->terminateRenderProcess(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_terminateRenderProcess, OH_Boolean, OH_NativePointer)
void impl_webview_WebviewController_precompileJavaScript(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& url, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 scriptValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_WEB_WEBVIEW_Union_String_Buffer scriptValueTempTmpBuf = {};
        scriptValueTempTmpBuf.selector = scriptValueTempTmpBufUnionSelector;
        if (scriptValueTempTmpBufUnionSelector == 0) {
            scriptValueTempTmpBuf.selector = 0;
            scriptValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (scriptValueTempTmpBufUnionSelector == 1) {
            scriptValueTempTmpBuf.selector = 1;
            scriptValueTempTmpBuf.value1 = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
        } else {
            INTEROP_FATAL("One of the branches for scriptValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_WEB_WEBVIEW_Union_String_Buffer scriptValueTemp = static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Buffer>(scriptValueTempTmpBuf);;
        OH_OHOS_WEB_WEBVIEW_webview_CacheOptions cacheOptionsValueTemp = webview_CacheOptions_serializer::read(thisDeserializer);;
        OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Int32 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_I32_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Int32 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_I32_Opt_Array_String_Void))))};;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->precompileJavaScript(reinterpret_cast<OH_OHOS_WEB_WEBVIEW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&url), static_cast<OH_OHOS_WEB_WEBVIEW_Union_String_Buffer*>(&scriptValueTemp), static_cast<OH_OHOS_WEB_WEBVIEW_webview_CacheOptions*>(&cacheOptionsValueTemp), static_cast<OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(webview_WebviewController_precompileJavaScript, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_setHostIP(const KStringPtr& hostName, const KStringPtr& address, KInteropNumber aliveTime) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setHostIP((const OH_String*) (&hostName), (const OH_String*) (&address), (const OH_Number*) (&aliveTime));
}
KOALA_INTEROP_V3(webview_WebviewController_setHostIP, KStringPtr, KStringPtr, KInteropNumber)
void impl_webview_WebviewController_clearHostIP(const KStringPtr& hostName) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->clearHostIP((const OH_String*) (&hostName));
}
KOALA_INTEROP_V1(webview_WebviewController_clearHostIP, KStringPtr)
void impl_webview_WebviewController_warmupServiceWorker(const KStringPtr& url) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->warmupServiceWorker((const OH_String*) (&url));
}
KOALA_INTEROP_V1(webview_WebviewController_warmupServiceWorker, KStringPtr)
void impl_webview_WebviewController_injectOfflineResources(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 resourceMapsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_webview_OfflineResourceMap resourceMapsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(resourceMapsValueTempTmpBuf)>::type,
        std::decay<decltype(*resourceMapsValueTempTmpBuf.array)>::type>(&resourceMapsValueTempTmpBuf, resourceMapsValueTempTmpBufLength);
        for (int resourceMapsValueTempTmpBufBufCounterI = 0; resourceMapsValueTempTmpBufBufCounterI < resourceMapsValueTempTmpBufLength; resourceMapsValueTempTmpBufBufCounterI++) {
            resourceMapsValueTempTmpBuf.array[resourceMapsValueTempTmpBufBufCounterI] = webview_OfflineResourceMap_serializer::read(thisDeserializer);
        }
        Array_webview_OfflineResourceMap resourceMapsValueTemp = resourceMapsValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->injectOfflineResources(thisPtr, static_cast<Array_webview_OfflineResourceMap*>(&resourceMapsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_injectOfflineResources, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_enableAdsBlock(OH_NativePointer thisPtr, OH_Boolean enable) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->enableAdsBlock(thisPtr, enable);
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_enableAdsBlock, OH_NativePointer, OH_Boolean)
OH_Boolean impl_webview_WebviewController_isAdsBlockEnabled(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->isAdsBlockEnabled(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_isAdsBlockEnabled, OH_Boolean, OH_NativePointer)
OH_Boolean impl_webview_WebviewController_isAdsBlockEnabledForCurPage(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->isAdsBlockEnabledForCurPage(thisPtr);
}
KOALA_INTEROP_DIRECT_1(webview_WebviewController_isAdsBlockEnabledForCurPage, OH_Boolean, OH_NativePointer)
OH_String impl_webview_WebviewController_getSurfaceId(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getSurfaceId(thisPtr);
}
KOALA_INTEROP_1(webview_WebviewController_getSurfaceId, KStringPtr, OH_NativePointer)
void impl_webview_WebviewController_setUrlTrustList(OH_NativePointer thisPtr, const KStringPtr& urlTrustList) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setUrlTrustList(thisPtr, (const OH_String*) (&urlTrustList));
}
KOALA_INTEROP_V2(webview_WebviewController_setUrlTrustList, OH_NativePointer, KStringPtr)
void impl_webview_WebviewController_setPathAllowingUniversalAccess(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 pathListValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String pathListValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(pathListValueTempTmpBuf)>::type,
        std::decay<decltype(*pathListValueTempTmpBuf.array)>::type>(&pathListValueTempTmpBuf, pathListValueTempTmpBufLength);
        for (int pathListValueTempTmpBufBufCounterI = 0; pathListValueTempTmpBufBufCounterI < pathListValueTempTmpBufLength; pathListValueTempTmpBufBufCounterI++) {
            pathListValueTempTmpBuf.array[pathListValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String pathListValueTemp = pathListValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setPathAllowingUniversalAccess(thisPtr, static_cast<Array_String*>(&pathListValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_setPathAllowingUniversalAccess, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_trimMemoryByPressureLevel(OH_Int32 level) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->trimMemoryByPressureLevel(static_cast<OH_OHOS_WEB_WEBVIEW_webview_PressureLevel>(level));
}
KOALA_INTEROP_DIRECT_V1(webview_WebviewController_trimMemoryByPressureLevel, OH_Int32)
void impl_webview_WebviewController_enableBackForwardCache(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto featuresValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_webview_BackForwardCacheSupportedFeatures featuresValueTempTmpBuf = {};
        featuresValueTempTmpBuf.tag = featuresValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((featuresValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            featuresValueTempTmpBuf.value = static_cast<OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures>(webview_BackForwardCacheSupportedFeatures_serializer::read(thisDeserializer));
        }
        Opt_webview_BackForwardCacheSupportedFeatures featuresValueTemp = featuresValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->enableBackForwardCache(static_cast<Opt_webview_BackForwardCacheSupportedFeatures*>(&featuresValueTemp));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_enableBackForwardCache, KSerializerBuffer, int32_t)
void impl_webview_WebviewController_setBackForwardCacheOptions(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
        Opt_webview_BackForwardCacheOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = static_cast<OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions>(webview_BackForwardCacheOptions_serializer::read(thisDeserializer));
        }
        Opt_webview_BackForwardCacheOptions optionsValueTemp = optionsValueTempTmpBuf;;
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setBackForwardCacheOptions(thisPtr, static_cast<Opt_webview_BackForwardCacheOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(webview_WebviewController_setBackForwardCacheOptions, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_webview_WebviewController_getScrollOffset(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getScrollOffset(thisPtr);
        SerializerBase _retSerializer {};
        webview_ScrollOffset_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebviewController_getScrollOffset, KInteropReturnBuffer, OH_NativePointer)
OH_Boolean impl_webview_WebviewController_scrollByWithResult(OH_NativePointer thisPtr, KDouble deltaX, KDouble deltaY) {
        return GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->scrollByWithResult(thisPtr, deltaX, deltaY);
}
KOALA_INTEROP_3(webview_WebviewController_scrollByWithResult, OH_Boolean, OH_NativePointer, KDouble, KDouble)
KInteropReturnBuffer impl_webview_WebviewController_getLastHitTest(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->getLastHitTest(thisPtr);
        SerializerBase _retSerializer {};
        webview_HitTestValue_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(webview_WebviewController_getLastHitTest, KInteropReturnBuffer, OH_NativePointer)
void impl_webview_WebviewController_setWebDebuggingAccess1(OH_Boolean webDebuggingAccess, KInteropNumber port) {
        GetOH_OHOS_WEB_WEBVIEW_API(OHOS_WEB_WEBVIEW_API_VERSION)->Webview_WebviewController()->setWebDebuggingAccess1(webDebuggingAccess, (const OH_Number*) (&port));
}
KOALA_INTEROP_DIRECT_V2(webview_WebviewController_setWebDebuggingAccess1, OH_Boolean, KInteropNumber)
void deserializeAndCallCallback_Boolean_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void))));
    thisDeserializer.readPointer();
    OH_Boolean value = thisDeserializer.readBoolean();
    _call(_resourceId, value);
}
void deserializeAndCallSyncCallback_Boolean_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))));
    OH_Boolean value = thisDeserializer.readBoolean();
    callSyncMethod(vmContext, resourceId, value);
}
void deserializeAndCallCallback_NativeMediaPlayerBridge_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_NativeMediaPlayerBridge_Void))));
    thisDeserializer.readPointer();
    OH_CustomObject value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    _call(_resourceId, value);
}
void deserializeAndCallSyncCallback_NativeMediaPlayerBridge_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_NativeMediaPlayerBridge_Void))));
    OH_CustomObject value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    callSyncMethod(vmContext, resourceId, value);
}
void deserializeAndCallCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_cert_X509Cert value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_cert_X509Cert valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 valueTmpBuf_Length = thisDeserializer.readInt32();
        Array_cert_X509Cert valueTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(valueTmpBuf_)>::type,
        std::decay<decltype(*valueTmpBuf_.array)>::type>(&valueTmpBuf_, valueTmpBuf_Length);
        for (int valueTmpBuf_BufCounterI = 0; valueTmpBuf_BufCounterI < valueTmpBuf_Length; valueTmpBuf_BufCounterI++) {
            valueTmpBuf_.array[valueTmpBuf_BufCounterI] = static_cast<OH_OHOS_WEB_WEBVIEW_cert_X509Cert>(cert_X509Cert_serializer::read(thisDeserializer));
        }
        valueTmpBuf.value = valueTmpBuf_;
    }
    Opt_Array_cert_X509Cert value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, value, error);
}
void deserializeAndCallSyncCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_cert_X509Cert value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_cert_X509Cert valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 valueTmpBuf_Length = thisDeserializer.readInt32();
        Array_cert_X509Cert valueTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(valueTmpBuf_)>::type,
        std::decay<decltype(*valueTmpBuf_.array)>::type>(&valueTmpBuf_, valueTmpBuf_Length);
        for (int valueTmpBuf_BufCounterI = 0; valueTmpBuf_BufCounterI < valueTmpBuf_Length; valueTmpBuf_BufCounterI++) {
            valueTmpBuf_.array[valueTmpBuf_BufCounterI] = static_cast<OH_OHOS_WEB_WEBVIEW_cert_X509Cert>(cert_X509Cert_serializer::read(thisDeserializer));
        }
        valueTmpBuf.value = valueTmpBuf_;
    }
    Opt_Array_cert_X509Cert value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, value, error);
}
void deserializeAndCallCallback_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, error);
}
void deserializeAndCallSyncCallback_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))));
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, error);
}
void deserializeAndCallCallback_Opt_Boolean_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Boolean valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readBoolean();
    }
    Opt_Boolean value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, value, error);
}
void deserializeAndCallSyncCallback_Opt_Boolean_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Boolean valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readBoolean();
    }
    Opt_Boolean value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, value, error);
}
void deserializeAndCallCallback_Opt_Buffer_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Buffer valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
    }
    Opt_Buffer value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, value, error);
}
void deserializeAndCallSyncCallback_Opt_Buffer_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Buffer valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
    }
    Opt_Buffer value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, value, error);
}
void deserializeAndCallCallback_Opt_I32_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Int32 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_I32_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Int32 valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readInt32();
    }
    Opt_Int32 value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, value, error);
}
void deserializeAndCallSyncCallback_Opt_I32_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Int32 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_I32_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Int32 valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readInt32();
    }
    Opt_Int32 value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, value, error);
}
void deserializeAndCallCallback_Opt_JsMessageExt_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, value, error);
}
void deserializeAndCallSyncCallback_Opt_JsMessageExt_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, value, error);
}
void deserializeAndCallCallback_Opt_PdfData_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PdfData_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, value, error);
}
void deserializeAndCallSyncCallback_Opt_PdfData_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PdfData_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, value, error);
}
void deserializeAndCallCallback_Opt_String_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_String valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
    }
    Opt_String value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    _call(_resourceId, value, error);
}
void deserializeAndCallSyncCallback_Opt_String_Opt_Array_String_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_String valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
    }
    Opt_String value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WEB_WEBVIEW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String errorTmpBuf = {};
    errorTmpBuf.tag = errorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((errorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 errorTmpBuf_Length = thisDeserializer.readInt32();
        Array_String errorTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(errorTmpBuf_)>::type,
        std::decay<decltype(*errorTmpBuf_.array)>::type>(&errorTmpBuf_, errorTmpBuf_Length);
        for (int errorTmpBuf_BufCounterI = 0; errorTmpBuf_BufCounterI < errorTmpBuf_Length; errorTmpBuf_BufCounterI++) {
            errorTmpBuf_.array[errorTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        errorTmpBuf.value = errorTmpBuf_;
    }
    Opt_Array_String error = errorTmpBuf;
    callSyncMethod(vmContext, resourceId, value, error);
}
void deserializeAndCallCallback_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void))));
    thisDeserializer.readPointer();
    _call(_resourceId);
}
void deserializeAndCallSyncCallback_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback_WebDownloadItem_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebDownloadItem_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0 = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem>(webview_WebDownloadItem_serializer::read(thisDeserializer));
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_WebDownloadItem_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebDownloadItem_Void))));
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0 = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem>(webview_WebDownloadItem_serializer::read(thisDeserializer));
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_WebMessage_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_WebMessage result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebMessage_Void))));
    thisDeserializer.readPointer();
    const OH_Int8 resultTmpBufUnionSelector = thisDeserializer.readInt8();
    OH_OHOS_WEB_WEBVIEW_WebMessage resultTmpBuf = {};
    resultTmpBuf.selector = resultTmpBufUnionSelector;
    if (resultTmpBufUnionSelector == 0) {
        resultTmpBuf.selector = 0;
        resultTmpBuf.value0 = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
    } else if (resultTmpBufUnionSelector == 1) {
        resultTmpBuf.selector = 1;
        resultTmpBuf.value1 = static_cast<OH_String>(thisDeserializer.readString());
    } else {
        INTEROP_FATAL("One of the branches for resultTmpBuf has to be chosen through deserialisation.");
    }
    OH_OHOS_WEB_WEBVIEW_WebMessage result = static_cast<OH_OHOS_WEB_WEBVIEW_WebMessage>(resultTmpBuf);
    _call(_resourceId, result);
}
void deserializeAndCallSyncCallback_WebMessage_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_WebMessage result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebMessage_Void))));
    const OH_Int8 resultTmpBufUnionSelector = thisDeserializer.readInt8();
    OH_OHOS_WEB_WEBVIEW_WebMessage resultTmpBuf = {};
    resultTmpBuf.selector = resultTmpBufUnionSelector;
    if (resultTmpBufUnionSelector == 0) {
        resultTmpBuf.selector = 0;
        resultTmpBuf.value0 = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
    } else if (resultTmpBufUnionSelector == 1) {
        resultTmpBuf.selector = 1;
        resultTmpBuf.value1 = static_cast<OH_String>(thisDeserializer.readString());
    } else {
        INTEROP_FATAL("One of the branches for resultTmpBuf has to be chosen through deserialisation.");
    }
    OH_OHOS_WEB_WEBVIEW_WebMessage result = static_cast<OH_OHOS_WEB_WEBVIEW_WebMessage>(resultTmpBuf);
    callSyncMethod(vmContext, resourceId, result);
}
void deserializeAndCallCallback_WebMessageExt_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebMessageExt_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt>(webview_WebMessageExt_serializer::read(thisDeserializer));
    _call(_resourceId, result);
}
void deserializeAndCallSyncCallback_WebMessageExt_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebMessageExt_Void))));
    OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt>(webview_WebMessageExt_serializer::read(thisDeserializer));
    callSyncMethod(vmContext, resourceId, result);
}
void deserializeAndCallCallback_WebSchemeHandlerRequest_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebSchemeHandlerRequest_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0 = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest>(webview_WebSchemeHandlerRequest_serializer::read(thisDeserializer));
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_WebSchemeHandlerRequest_Void(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebSchemeHandlerRequest_Void))));
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0 = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest>(webview_WebSchemeHandlerRequest_serializer::read(thisDeserializer));
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_WebSchemeHandlerRequest_WebResourceHandler_Boolean(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, const OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean))));
    thisDeserializer.readPointer();
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest>(webview_WebSchemeHandlerRequest_serializer::read(thisDeserializer));
    OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler>(webview_WebResourceHandler_serializer::read(thisDeserializer));
    OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuationResult = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
    _call(_resourceId, request, handler, continuationResult);
}
void deserializeAndCallSyncCallback_WebSchemeHandlerRequest_WebResourceHandler_Boolean(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, const OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean))));
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest>(webview_WebSchemeHandlerRequest_serializer::read(thisDeserializer));
    OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler = static_cast<OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler>(webview_WebResourceHandler_serializer::read(thisDeserializer));
    OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuationResult = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
    callSyncMethod(vmContext, resourceId, request, handler, continuationResult);
}
void deserializeAndCallCreateNativeMediaPlayerCallback(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_CreateNativeMediaPlayerCallback))));
    thisDeserializer.readPointer();
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler = static_cast<OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler>(webview_NativeMediaPlayerHandler_serializer::read(thisDeserializer));
    OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo = webview_MediaInfo_serializer::read(thisDeserializer);
    OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuationResult = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_NativeMediaPlayerBridge_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_NativeMediaPlayerBridge_Void))))};
    _call(_resourceId, handler, mediaInfo, continuationResult);
}
void deserializeAndCallSyncCreateNativeMediaPlayerCallback(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_CreateNativeMediaPlayerCallback))));
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler = static_cast<OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler>(webview_NativeMediaPlayerHandler_serializer::read(thisDeserializer));
    OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo = webview_MediaInfo_serializer::read(thisDeserializer);
    OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuationResult = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_NativeMediaPlayerBridge_Void)))), reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_NativeMediaPlayerBridge_Void))))};
    callSyncMethod(vmContext, resourceId, handler, mediaInfo, continuationResult);
}
void deserializeAndCallResumePlayerFn(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_ResumePlayerFn))));
    thisDeserializer.readPointer();
    _call(_resourceId);
}
void deserializeAndCallSyncResumePlayerFn(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_ResumePlayerFn))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallSuspendPlayerFn(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_SuspendPlayerFn))));
    thisDeserializer.readPointer();
    OH_OHOS_WEB_WEBVIEW_webview_SuspendType type = static_cast<OH_OHOS_WEB_WEBVIEW_webview_SuspendType>(thisDeserializer.readInt32());
    _call(_resourceId, type);
}
void deserializeAndCallSyncSuspendPlayerFn(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_SuspendPlayerFn))));
    OH_OHOS_WEB_WEBVIEW_webview_SuspendType type = static_cast<OH_OHOS_WEB_WEBVIEW_webview_SuspendType>(thisDeserializer.readInt32());
    callSyncMethod(vmContext, resourceId, type);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_Boolean_Void: return deserializeAndCallCallback_Boolean_Void(thisArray, thisLength);
        case Kind_Callback_NativeMediaPlayerBridge_Void: return deserializeAndCallCallback_NativeMediaPlayerBridge_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Boolean_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Buffer_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_I32_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_I32_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_JsMessageExt_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_PdfData_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_PdfData_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_String_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
        case Kind_Callback_WebDownloadItem_Void: return deserializeAndCallCallback_WebDownloadItem_Void(thisArray, thisLength);
        case Kind_Callback_WebMessage_Void: return deserializeAndCallCallback_WebMessage_Void(thisArray, thisLength);
        case Kind_Callback_WebMessageExt_Void: return deserializeAndCallCallback_WebMessageExt_Void(thisArray, thisLength);
        case Kind_Callback_WebSchemeHandlerRequest_Void: return deserializeAndCallCallback_WebSchemeHandlerRequest_Void(thisArray, thisLength);
        case Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean: return deserializeAndCallCallback_WebSchemeHandlerRequest_WebResourceHandler_Boolean(thisArray, thisLength);
        case Kind_CreateNativeMediaPlayerCallback: return deserializeAndCallCreateNativeMediaPlayerCallback(thisArray, thisLength);
        case Kind_ResumePlayerFn: return deserializeAndCallResumePlayerFn(thisArray, thisLength);
        case Kind_SuspendPlayerFn: return deserializeAndCallSuspendPlayerFn(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_Boolean_Void: return deserializeAndCallSyncCallback_Boolean_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_NativeMediaPlayerBridge_Void: return deserializeAndCallSyncCallback_NativeMediaPlayerBridge_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Boolean_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Buffer_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_I32_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_I32_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_JsMessageExt_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_PdfData_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_PdfData_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_String_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WebDownloadItem_Void: return deserializeAndCallSyncCallback_WebDownloadItem_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WebMessage_Void: return deserializeAndCallSyncCallback_WebMessage_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WebMessageExt_Void: return deserializeAndCallSyncCallback_WebMessageExt_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WebSchemeHandlerRequest_Void: return deserializeAndCallSyncCallback_WebSchemeHandlerRequest_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean: return deserializeAndCallSyncCallback_WebSchemeHandlerRequest_WebResourceHandler_Boolean(vmContext, thisArray, thisLength);
        case Kind_CreateNativeMediaPlayerCallback: return deserializeAndCallSyncCreateNativeMediaPlayerCallback(vmContext, thisArray, thisLength);
        case Kind_ResumePlayerFn: return deserializeAndCallSyncResumePlayerFn(vmContext, thisArray, thisLength);
        case Kind_SuspendPlayerFn: return deserializeAndCallSyncSuspendPlayerFn(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_Boolean_Void(OH_Int32 resourceId, OH_Boolean value)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Boolean_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeBoolean(value);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Boolean_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_Boolean value)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Boolean_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeBoolean(value);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_NativeMediaPlayerBridge_Void(OH_Int32 resourceId, OH_CustomObject value)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_NativeMediaPlayerBridge_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", value);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_NativeMediaPlayerBridge_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_CustomObject value)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_NativeMediaPlayerBridge_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", value);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_cert_X509Cert value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt32(valueTmpValue.length);
        for (int valueTmpValueCounterI = 0; valueTmpValueCounterI < valueTmpValue.length; valueTmpValueCounterI++) {
            const OH_OHOS_WEB_WEBVIEW_cert_X509Cert valueTmpValueTmpElement = valueTmpValue.array[valueTmpValueCounterI];
            cert_X509Cert_serializer::write(argsSerializer, valueTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_Array_cert_X509Cert value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt32(valueTmpValue.length);
        for (int valueTmpValueCounterI = 0; valueTmpValueCounterI < valueTmpValue.length; valueTmpValueCounterI++) {
            const OH_OHOS_WEB_WEBVIEW_cert_X509Cert valueTmpValueTmpElement = valueTmpValue.array[valueTmpValueCounterI];
            cert_X509Cert_serializer::write(argsSerializer, valueTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_Boolean_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Boolean value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Boolean_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeBoolean(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_Boolean_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_Boolean value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Boolean_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeBoolean(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_Buffer_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Buffer value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Buffer_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeBuffer(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_Buffer_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_Buffer value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Buffer_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeBuffer(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_I32_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Int32 value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_I32_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt32(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_I32_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_Int32 value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_I32_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt32(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_JsMessageExt_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeCustomObject("object", valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_JsMessageExt_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeCustomObject("object", valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_PdfData_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_PdfData_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeCustomObject("object", valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_PdfData_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_PdfData_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeCustomObject("object", valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_String_Opt_Array_String_Void(OH_Int32 resourceId, Opt_String value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_String_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeString(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Opt_String_Opt_Array_String_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, Opt_String value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_String_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeString(valueTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    if (runtimeType(error) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto errorTmpValue = error.value;
        argsSerializer.writeInt32(errorTmpValue.length);
        for (int errorTmpValueCounterI = 0; errorTmpValueCounterI < errorTmpValue.length; errorTmpValueCounterI++) {
            const OH_String errorTmpValueTmpElement = errorTmpValue.array[errorTmpValueCounterI];
            argsSerializer.writeString(errorTmpValueTmpElement);
        }
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Void(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WebDownloadItem_Void(OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WebDownloadItem_Void);
    argsSerializer.writeInt32(resourceId);
    webview_WebDownloadItem_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WebDownloadItem_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WebDownloadItem_Void);
    argsSerializer.writeInt32(resourceId);
    webview_WebDownloadItem_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WebMessage_Void(OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_WebMessage result)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WebMessage_Void);
    argsSerializer.writeInt32(resourceId);
    if (result.selector == 0) {
        argsSerializer.writeInt8(0);
        const auto resultForIdx0 = result.value0;
        argsSerializer.writeBuffer(resultForIdx0);
    } else if (result.selector == 1) {
        argsSerializer.writeInt8(1);
        const auto resultForIdx1 = result.value1;
        argsSerializer.writeString(resultForIdx1);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WebMessage_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_WebMessage result)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WebMessage_Void);
    argsSerializer.writeInt32(resourceId);
    if (result.selector == 0) {
        argsSerializer.writeInt8(0);
        const auto resultForIdx0 = result.value0;
        argsSerializer.writeBuffer(resultForIdx0);
    } else if (result.selector == 1) {
        argsSerializer.writeInt8(1);
        const auto resultForIdx1 = result.value1;
        argsSerializer.writeString(resultForIdx1);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WebMessageExt_Void(OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WebMessageExt_Void);
    argsSerializer.writeInt32(resourceId);
    webview_WebMessageExt_serializer::write(argsSerializer, result);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WebMessageExt_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WebMessageExt_Void);
    argsSerializer.writeInt32(resourceId);
    webview_WebMessageExt_serializer::write(argsSerializer, result);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WebSchemeHandlerRequest_Void(OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WebSchemeHandlerRequest_Void);
    argsSerializer.writeInt32(resourceId);
    webview_WebSchemeHandlerRequest_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WebSchemeHandlerRequest_VoidSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WebSchemeHandlerRequest_Void);
    argsSerializer.writeInt32(resourceId);
    webview_WebSchemeHandlerRequest_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WebSchemeHandlerRequest_WebResourceHandler_Boolean(OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean);
    argsSerializer.writeInt32(resourceId);
    webview_WebSchemeHandlerRequest_serializer::write(argsSerializer, request);
    webview_WebResourceHandler_serializer::write(argsSerializer, handler);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WebSchemeHandlerRequest_WebResourceHandler_BooleanSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean);
    argsSerializer.writeInt32(resourceId);
    webview_WebSchemeHandlerRequest_serializer::write(argsSerializer, request);
    webview_WebResourceHandler_serializer::write(argsSerializer, handler);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCreateNativeMediaPlayerCallback(OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_CreateNativeMediaPlayerCallback);
    argsSerializer.writeInt32(resourceId);
    webview_NativeMediaPlayerHandler_serializer::write(argsSerializer, handler);
    webview_MediaInfo_serializer::write(argsSerializer, mediaInfo);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCreateNativeMediaPlayerCallbackSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_CreateNativeMediaPlayerCallback);
    argsSerializer.writeInt32(resourceId);
    webview_NativeMediaPlayerHandler_serializer::write(argsSerializer, handler);
    webview_MediaInfo_serializer::write(argsSerializer, mediaInfo);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedResumePlayerFn(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_ResumePlayerFn);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedResumePlayerFnSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_ResumePlayerFn);
    argsSerializer.writeInt32(resourceId);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedSuspendPlayerFn(OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WEB_WEBVIEW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_SuspendPlayerFn);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WEB_WEBVIEW_webview_SuspendType>(type));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedSuspendPlayerFnSync(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_SuspendPlayerFn);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WEB_WEBVIEW_webview_SuspendType>(type));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
OH_NativePointer getManagedCallbackCaller(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Boolean_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Boolean_Void);
        case Kind_Callback_NativeMediaPlayerBridge_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_NativeMediaPlayerBridge_Void);
        case Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Void);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Boolean_Opt_Array_String_Void);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Buffer_Opt_Array_String_Void);
        case Kind_Callback_Opt_I32_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_I32_Opt_Array_String_Void);
        case Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_JsMessageExt_Opt_Array_String_Void);
        case Kind_Callback_Opt_PdfData_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PdfData_Opt_Array_String_Void);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_String_Opt_Array_String_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
        case Kind_Callback_WebDownloadItem_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebDownloadItem_Void);
        case Kind_Callback_WebMessage_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebMessage_Void);
        case Kind_Callback_WebMessageExt_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebMessageExt_Void);
        case Kind_Callback_WebSchemeHandlerRequest_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebSchemeHandlerRequest_Void);
        case Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebSchemeHandlerRequest_WebResourceHandler_Boolean);
        case Kind_CreateNativeMediaPlayerCallback: return reinterpret_cast<OH_NativePointer>(callManagedCreateNativeMediaPlayerCallback);
        case Kind_ResumePlayerFn: return reinterpret_cast<OH_NativePointer>(callManagedResumePlayerFn);
        case Kind_SuspendPlayerFn: return reinterpret_cast<OH_NativePointer>(callManagedSuspendPlayerFn);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Boolean_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Boolean_VoidSync);
        case Kind_Callback_NativeMediaPlayerBridge_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_NativeMediaPlayerBridge_VoidSync);
        case Kind_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_Cert_X509Cert_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Boolean_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Buffer_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_I32_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_I32_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_JsMessageExt_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_JsMessageExt_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_PdfData_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PdfData_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_String_Opt_Array_String_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
        case Kind_Callback_WebDownloadItem_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebDownloadItem_VoidSync);
        case Kind_Callback_WebMessage_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebMessage_VoidSync);
        case Kind_Callback_WebMessageExt_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebMessageExt_VoidSync);
        case Kind_Callback_WebSchemeHandlerRequest_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebSchemeHandlerRequest_VoidSync);
        case Kind_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WebSchemeHandlerRequest_WebResourceHandler_BooleanSync);
        case Kind_CreateNativeMediaPlayerCallback: return reinterpret_cast<OH_NativePointer>(callManagedCreateNativeMediaPlayerCallbackSync);
        case Kind_ResumePlayerFn: return reinterpret_cast<OH_NativePointer>(callManagedResumePlayerFnSync);
        case Kind_SuspendPlayerFn: return reinterpret_cast<OH_NativePointer>(callManagedSuspendPlayerFnSync);
    }
    return nullptr;
}