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

#include "ohos_print.h"

#define KOALA_INTEROP_MODULE OHOS_PRINTNativeModule
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
    Kind_Callback_String_PrintFileCreationState_Void = 757265612,
    Kind_Callback_Void = -1867723152,
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Array_Number& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_Number* value);

template <>
inline void WriteToString(std::string* result, const Array_Number* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_Number, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_Number*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_Number* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_Array_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintColorMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintColorMode value) {
    result->append("OH_OHOS_PRINT_print_PrintColorMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintColorMode* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintColorMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintDirectionMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintDirectionMode value) {
    result->append("OH_OHOS_PRINT_print_PrintDirectionMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintDirectionMode* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintDirectionMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintDocumentAdapter& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintDocumentAdapter value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintDocumentAdapter& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintDocumentAdapterState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintDocumentAdapterState value) {
    result->append("OH_OHOS_PRINT_print_PrintDocumentAdapterState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintDocumentAdapterState* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintDocumentAdapterState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintDuplexMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintDuplexMode value) {
    result->append("OH_OHOS_PRINT_print_PrintDuplexMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintDuplexMode* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintDuplexMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintFileCreationState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintFileCreationState value) {
    result->append("OH_OHOS_PRINT_print_PrintFileCreationState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintFileCreationState* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintFileCreationState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintPageType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintPageType value) {
    result->append("OH_OHOS_PRINT_print_PrintPageType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintPageType* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintPageType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OHOS_PRINT_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_PRINT_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_PRINT_Callback_Void* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_OHOS_PRINT_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintPageRange& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintPageRange* value) {
    result->append("{");
    // OH_Number startPage
    result->append(".startPage=");
    WriteToString(result, &value->startPage);
    // OH_Number endPage
    result->append(", ");
    result->append(".endPage=");
    WriteToString(result, &value->endPage);
    // Array_Number pages
    result->append(", ");
    result->append(".pages=");
    WriteToString(result, &value->pages);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintPageRange* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintPageRange& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintPageSize& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintPageSize* value) {
    result->append("{");
    // OH_String id
    result->append(".id=");
    WriteToString(result, &value->id);
    // OH_String name
    result->append(", ");
    result->append(".name=");
    WriteToString(result, &value->name);
    // OH_Number width
    result->append(", ");
    result->append(".width=");
    WriteToString(result, &value->width);
    // OH_Number height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, &value->height);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintPageSize* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintPageSize& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_PRINT_print_PrintPageSize
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_PRINT_print_PrintPageType
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_PrintPageSize_PrintPageType* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_Union_PrintPageSize_PrintPageType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PRINT_RuntimeType runtimeType(const OH_OHOS_PRINT_print_PrintAttributes& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PRINT_print_PrintAttributes* value) {
    result->append("{");
    // OH_Number copyNumber
    result->append(".copyNumber=");
    WriteToString(result, &value->copyNumber);
    // OH_OHOS_PRINT_print_PrintPageRange pageRange
    result->append(", ");
    result->append(".pageRange=");
    WriteToString(result, &value->pageRange);
    // OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType pageSize
    result->append(", ");
    result->append(".pageSize=");
    WriteToString(result, &value->pageSize);
    // OH_OHOS_PRINT_print_PrintDirectionMode directionMode
    result->append(", ");
    result->append(".directionMode=");
    WriteToString(result, &value->directionMode);
    // OH_OHOS_PRINT_print_PrintColorMode colorMode
    result->append(", ");
    result->append(".colorMode=");
    WriteToString(result, &value->colorMode);
    // OH_OHOS_PRINT_print_PrintDuplexMode duplexMode
    result->append(", ");
    result->append(".duplexMode=");
    WriteToString(result, &value->duplexMode);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_print_PrintAttributes* value) {
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_print_PrintAttributes& value)
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
inline OH_OHOS_PRINT_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class print_PrintDocumentAdapter_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintDocumentAdapter value);
    static OH_OHOS_PRINT_print_PrintDocumentAdapter read(DeserializerBase& buffer);
};
class print_PrintPageRange_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintPageRange value);
    static OH_OHOS_PRINT_print_PrintPageRange read(DeserializerBase& buffer);
};
class print_PrintPageSize_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintPageSize value);
    static OH_OHOS_PRINT_print_PrintPageSize read(DeserializerBase& buffer);
};
class print_PrintAttributes_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintAttributes value);
    static OH_OHOS_PRINT_print_PrintAttributes read(DeserializerBase& buffer);
};
inline void print_PrintDocumentAdapter_serializer::write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintDocumentAdapter value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_PRINT_print_PrintDocumentAdapter print_PrintDocumentAdapter_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_PRINT_print_PrintDocumentAdapter>(ptr);
}
inline void print_PrintPageRange_serializer::write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintPageRange value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForStartPage = value.startPage;
    if (runtimeType(valueHolderForStartPage) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForStartPageTmpValue = valueHolderForStartPage.value;
        valueSerializer.writeNumber(valueHolderForStartPageTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEndPage = value.endPage;
    if (runtimeType(valueHolderForEndPage) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEndPageTmpValue = valueHolderForEndPage.value;
        valueSerializer.writeNumber(valueHolderForEndPageTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPages = value.pages;
    if (runtimeType(valueHolderForPages) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPagesTmpValue = valueHolderForPages.value;
        valueSerializer.writeInt32(valueHolderForPagesTmpValue.length);
        for (int valueHolderForPagesTmpValueCounterI = 0; valueHolderForPagesTmpValueCounterI < valueHolderForPagesTmpValue.length; valueHolderForPagesTmpValueCounterI++) {
            const OH_Number valueHolderForPagesTmpValueTmpElement = valueHolderForPagesTmpValue.array[valueHolderForPagesTmpValueCounterI];
            valueSerializer.writeNumber(valueHolderForPagesTmpValueTmpElement);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_PRINT_print_PrintPageRange print_PrintPageRange_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PRINT_print_PrintPageRange value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto startPageTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number startPageTmpBuf = {};
    startPageTmpBuf.tag = startPageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((startPageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        startPageTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.startPage = startPageTmpBuf;
    const auto endPageTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number endPageTmpBuf = {};
    endPageTmpBuf.tag = endPageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((endPageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        endPageTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.endPage = endPageTmpBuf;
    const auto pagesTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Array_Number pagesTmpBuf = {};
    pagesTmpBuf.tag = pagesTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pagesTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 pagesTmpBuf_Length = valueDeserializer.readInt32();
        Array_Number pagesTmpBuf_ = {};
        valueDeserializer.resizeArray<std::decay<decltype(pagesTmpBuf_)>::type,
        std::decay<decltype(*pagesTmpBuf_.array)>::type>(&pagesTmpBuf_, pagesTmpBuf_Length);
        for (int pagesTmpBuf_BufCounterI = 0; pagesTmpBuf_BufCounterI < pagesTmpBuf_Length; pagesTmpBuf_BufCounterI++) {
            pagesTmpBuf_.array[pagesTmpBuf_BufCounterI] = static_cast<OH_Number>(valueDeserializer.readNumber());
        }
        pagesTmpBuf.value = pagesTmpBuf_;
    }
    value.pages = pagesTmpBuf;
    return value;
}
inline void print_PrintPageSize_serializer::write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintPageSize value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    valueSerializer.writeString(valueHolderForId);
    const auto valueHolderForName = value.name;
    valueSerializer.writeString(valueHolderForName);
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeNumber(valueHolderForWidth);
    const auto valueHolderForHeight = value.height;
    valueSerializer.writeNumber(valueHolderForHeight);
}
inline OH_OHOS_PRINT_print_PrintPageSize print_PrintPageSize_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PRINT_print_PrintPageSize value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.id = static_cast<OH_String>(valueDeserializer.readString());
    value.name = static_cast<OH_String>(valueDeserializer.readString());
    value.width = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.height = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void print_PrintAttributes_serializer::write(SerializerBase& buffer, OH_OHOS_PRINT_print_PrintAttributes value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForCopyNumber = value.copyNumber;
    if (runtimeType(valueHolderForCopyNumber) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCopyNumberTmpValue = valueHolderForCopyNumber.value;
        valueSerializer.writeNumber(valueHolderForCopyNumberTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPageRange = value.pageRange;
    if (runtimeType(valueHolderForPageRange) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPageRangeTmpValue = valueHolderForPageRange.value;
        print_PrintPageRange_serializer::write(valueSerializer, valueHolderForPageRangeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPageSize = value.pageSize;
    if (runtimeType(valueHolderForPageSize) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPageSizeTmpValue = valueHolderForPageSize.value;
        if (valueHolderForPageSizeTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForPageSizeTmpValueForIdx0 = valueHolderForPageSizeTmpValue.value0;
            print_PrintPageSize_serializer::write(valueSerializer, valueHolderForPageSizeTmpValueForIdx0);
        } else if (valueHolderForPageSizeTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForPageSizeTmpValueForIdx1 = valueHolderForPageSizeTmpValue.value1;
            valueSerializer.writeInt32(static_cast<OH_OHOS_PRINT_print_PrintPageType>(valueHolderForPageSizeTmpValueForIdx1));
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDirectionMode = value.directionMode;
    if (runtimeType(valueHolderForDirectionMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDirectionModeTmpValue = valueHolderForDirectionMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_PRINT_print_PrintDirectionMode>(valueHolderForDirectionModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForColorMode = value.colorMode;
    if (runtimeType(valueHolderForColorMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForColorModeTmpValue = valueHolderForColorMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_PRINT_print_PrintColorMode>(valueHolderForColorModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDuplexMode = value.duplexMode;
    if (runtimeType(valueHolderForDuplexMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDuplexModeTmpValue = valueHolderForDuplexMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_PRINT_print_PrintDuplexMode>(valueHolderForDuplexModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_PRINT_print_PrintAttributes print_PrintAttributes_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PRINT_print_PrintAttributes value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto copyNumberTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number copyNumberTmpBuf = {};
    copyNumberTmpBuf.tag = copyNumberTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((copyNumberTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        copyNumberTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.copyNumber = copyNumberTmpBuf;
    const auto pageRangeTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_print_PrintPageRange pageRangeTmpBuf = {};
    pageRangeTmpBuf.tag = pageRangeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pageRangeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        pageRangeTmpBuf.value = print_PrintPageRange_serializer::read(valueDeserializer);
    }
    value.pageRange = pageRangeTmpBuf;
    const auto pageSizeTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_PrintPageSize_PrintPageType pageSizeTmpBuf = {};
    pageSizeTmpBuf.tag = pageSizeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pageSizeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 pageSizeTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType pageSizeTmpBuf_ = {};
        pageSizeTmpBuf_.selector = pageSizeTmpBuf_UnionSelector;
        if (pageSizeTmpBuf_UnionSelector == 0) {
            pageSizeTmpBuf_.selector = 0;
            pageSizeTmpBuf_.value0 = print_PrintPageSize_serializer::read(valueDeserializer);
        } else if (pageSizeTmpBuf_UnionSelector == 1) {
            pageSizeTmpBuf_.selector = 1;
            pageSizeTmpBuf_.value1 = static_cast<OH_OHOS_PRINT_print_PrintPageType>(valueDeserializer.readInt32());
        } else {
            INTEROP_FATAL("One of the branches for pageSizeTmpBuf_ has to be chosen through deserialisation.");
        }
        pageSizeTmpBuf.value = static_cast<OH_OHOS_PRINT_Union_PrintPageSize_PrintPageType>(pageSizeTmpBuf_);
    }
    value.pageSize = pageSizeTmpBuf;
    const auto directionModeTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_print_PrintDirectionMode directionModeTmpBuf = {};
    directionModeTmpBuf.tag = directionModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((directionModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        directionModeTmpBuf.value = static_cast<OH_OHOS_PRINT_print_PrintDirectionMode>(valueDeserializer.readInt32());
    }
    value.directionMode = directionModeTmpBuf;
    const auto colorModeTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_print_PrintColorMode colorModeTmpBuf = {};
    colorModeTmpBuf.tag = colorModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((colorModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        colorModeTmpBuf.value = static_cast<OH_OHOS_PRINT_print_PrintColorMode>(valueDeserializer.readInt32());
    }
    value.colorMode = colorModeTmpBuf;
    const auto duplexModeTmpBuf_runtimeType = static_cast<OH_OHOS_PRINT_RuntimeType>(valueDeserializer.readInt8());
    Opt_print_PrintDuplexMode duplexModeTmpBuf = {};
    duplexModeTmpBuf.tag = duplexModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((duplexModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        duplexModeTmpBuf.value = static_cast<OH_OHOS_PRINT_print_PrintDuplexMode>(valueDeserializer.readInt32());
    }
    value.duplexMode = duplexModeTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_PRINT_API* GetOH_OHOS_PRINT_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_PRINT_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_PRINT_APIKind::OH_OHOS_PRINT_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_print_PrintDocumentAdapter_construct() {
        return GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->Print_PrintDocumentAdapter()->construct();
}
KOALA_INTEROP_DIRECT_0(print_PrintDocumentAdapter_construct, OH_NativePointer)
OH_NativePointer impl_print_PrintDocumentAdapter_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->Print_PrintDocumentAdapter()->destruct;
}
KOALA_INTEROP_DIRECT_0(print_PrintDocumentAdapter_getFinalizer, OH_NativePointer)
void impl_print_PrintDocumentAdapter_onStartLayoutWrite(OH_NativePointer thisPtr, const KStringPtr& jobId, KSerializerBuffer thisArray, int32_t thisLength, KInteropNumber fd) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_PRINT_print_PrintAttributes oldAttrsValueTemp = print_PrintAttributes_serializer::read(thisDeserializer);;
        OH_OHOS_PRINT_print_PrintAttributes newAttrsValueTemp = print_PrintAttributes_serializer::read(thisDeserializer);;
        OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void writeResultCallbackValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_String_PrintFileCreationState_Void)))), reinterpret_cast<void(*)(OH_OHOS_PRINT_VMContext vmContext, const OH_Int32 resourceId, const OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_String_PrintFileCreationState_Void))))};;
        GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->Print_PrintDocumentAdapter()->onStartLayoutWrite(thisPtr, (const OH_String*) (&jobId), static_cast<OH_OHOS_PRINT_print_PrintAttributes*>(&oldAttrsValueTemp), static_cast<OH_OHOS_PRINT_print_PrintAttributes*>(&newAttrsValueTemp), (const OH_Number*) (&fd), static_cast<OHOS_PRINT_print_Callback_String_PrintFileCreationState_Void*>(&writeResultCallbackValueTemp));
}
KOALA_INTEROP_V5(print_PrintDocumentAdapter_onStartLayoutWrite, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t, KInteropNumber)
void impl_print_PrintDocumentAdapter_onJobStateChanged(OH_NativePointer thisPtr, const KStringPtr& jobId, OH_Int32 state) {
        GetOH_OHOS_PRINT_API(OHOS_PRINT_API_VERSION)->Print_PrintDocumentAdapter()->onJobStateChanged(thisPtr, (const OH_String*) (&jobId), static_cast<OH_OHOS_PRINT_print_PrintDocumentAdapterState>(state));
}
KOALA_INTEROP_V3(print_PrintDocumentAdapter_onJobStateChanged, OH_NativePointer, KStringPtr, OH_Int32)
void deserializeAndCallCallback_String_PrintFileCreationState_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_String_PrintFileCreationState_Void))));
    thisDeserializer.readPointer();
    OH_String jobId = static_cast<OH_String>(thisDeserializer.readString());
    OH_OHOS_PRINT_print_PrintFileCreationState writeResult = static_cast<OH_OHOS_PRINT_print_PrintFileCreationState>(thisDeserializer.readInt32());
    _call(_resourceId, jobId, writeResult);
}
void deserializeAndCallSyncCallback_String_PrintFileCreationState_Void(OH_OHOS_PRINT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_PRINT_VMContext vmContext, const OH_Int32 resourceId, const OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_String_PrintFileCreationState_Void))));
    OH_String jobId = static_cast<OH_String>(thisDeserializer.readString());
    OH_OHOS_PRINT_print_PrintFileCreationState writeResult = static_cast<OH_OHOS_PRINT_print_PrintFileCreationState>(thisDeserializer.readInt32());
    callSyncMethod(vmContext, resourceId, jobId, writeResult);
}
void deserializeAndCallCallback_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void))));
    thisDeserializer.readPointer();
    _call(_resourceId);
}
void deserializeAndCallSyncCallback_Void(OH_OHOS_PRINT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_PRINT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_String_PrintFileCreationState_Void: return deserializeAndCallCallback_String_PrintFileCreationState_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_PRINT_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_String_PrintFileCreationState_Void: return deserializeAndCallSyncCallback_String_PrintFileCreationState_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_String_PrintFileCreationState_Void(OH_Int32 resourceId, OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_PRINT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_String_PrintFileCreationState_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeString(jobId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_PRINT_print_PrintFileCreationState>(writeResult));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_String_PrintFileCreationState_VoidSync(OH_OHOS_PRINT_VMContext vmContext, OH_Int32 resourceId, OH_String jobId, OH_OHOS_PRINT_print_PrintFileCreationState writeResult)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_String_PrintFileCreationState_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeString(jobId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_PRINT_print_PrintFileCreationState>(writeResult));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Void(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_PRINT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_PRINT_VMContext vmContext, OH_Int32 resourceId)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
OH_NativePointer getManagedCallbackCaller(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_String_PrintFileCreationState_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_String_PrintFileCreationState_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_String_PrintFileCreationState_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_String_PrintFileCreationState_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}