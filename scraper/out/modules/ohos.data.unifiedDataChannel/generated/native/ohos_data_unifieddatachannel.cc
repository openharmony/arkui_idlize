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

#include "ohos_data_unifieddatachannel.h"

#define KOALA_INTEROP_MODULE OHOS_DATA_UNIFIEDDATACHANNELNativeModule
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
    Kind_EMPTY_Callback = -1,
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Array_unifiedDataChannel_UnifiedRecord& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord value);

template <>
inline void WriteToString(std::string* result, const Array_unifiedDataChannel_UnifiedRecord* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_unifiedDataChannel_UnifiedRecord* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Array_unifiedDataChannel_UnifiedRecord& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Map_String_Int32& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
void WriteToString(std::string* result, const OH_String* value);
template <>
void WriteToString(std::string* result, const OH_Int32 value);
template <>
inline void WriteToString(std::string* result, const Map_String_Int32* value) {
    result->append("{");
    int32_t count = value->size;
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_String*>(&value->keys[i]));
        result->append(": ");
        WriteToString(result, (value->values[i]));
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Map_String_Int32* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Map_String_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Map_String_Number& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
void WriteToString(std::string* result, const OH_String* value);
template <>
void WriteToString(std::string* result, const OH_Number* value);
template <>
inline void WriteToString(std::string* result, const Map_String_Number* value) {
    result->append("{");
    int32_t count = value->size;
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_String*>(&value->keys[i]));
        result->append(": ");
        WriteToString(result, const_cast<const OH_Number*>(&value->values[i]));
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Map_String_Number* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Map_String_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Map_String_Object& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
void WriteToString(std::string* result, const OH_String* value);
template <>
void WriteToString(std::string* result, const OH_Object* value);
template <>
inline void WriteToString(std::string* result, const Map_String_Object* value) {
    result->append("{");
    int32_t count = value->size;
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_String*>(&value->keys[i]));
        result->append(": ");
        WriteToString(result, const_cast<const OH_Object*>(&value->values[i]));
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Map_String_Object* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Map_String_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_Buffer& value)
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Buffer& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Number& value)
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_unifiedDataChannel_Summary* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_unifiedDataChannel_Summary& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_unifiedDataChannel_UnifiedData* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_unifiedDataChannel_UnifiedData& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_unifiedDataChannel_UnifiedRecord* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_unifiedDataChannel_UnifiedRecord& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_Want* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Want& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        case 3: return runtimeType(value.value3);
        case 4: return runtimeType(value.value4);
        case 5: return runtimeType(value.value5);
        case 6: return runtimeType(value.value6);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_String
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    // OH_Boolean
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, value->value2);
    }
    // OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap
    if (value->selector == 3) {
        result->append(".value3=");
        WriteToString(result, value->value3);
    }
    // OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want
    if (value->selector == 4) {
        result->append(".value4=");
        WriteToString(result, value->value4);
    }
    // OH_Buffer
    if (value->selector == 5) {
        result->append(".value5=");
        WriteToString(result, value->value5);
    }
    // OH_Object
    if (value->selector == 6) {
        result->append(".value6=");
        WriteToString(result, value->value6);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object* value) {
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
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType runtimeType(const Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap value);
    static OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap read(DeserializerBase& buffer);
};
class unifiedDataChannel_Summary_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary value);
    static OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary read(DeserializerBase& buffer);
};
class unifiedDataChannel_UnifiedData_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData value);
    static OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData read(DeserializerBase& buffer);
};
class unifiedDataChannel_UnifiedRecord_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord value);
    static OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord read(DeserializerBase& buffer);
};
class Want_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want value);
    static OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want read(DeserializerBase& buffer);
};
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap>(ptr);
}
inline void unifiedDataChannel_Summary_serializer::write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary unifiedDataChannel_Summary_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_Summary>(ptr);
}
inline void unifiedDataChannel_UnifiedData_serializer::write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData unifiedDataChannel_UnifiedData_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedData>(ptr);
}
inline void unifiedDataChannel_UnifiedRecord_serializer::write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord unifiedDataChannel_UnifiedRecord_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord>(ptr);
}
inline void Want_serializer::write(SerializerBase& buffer, OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want Want_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_DATA_UNIFIEDDATACHANNEL_API* GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_DATA_UNIFIEDDATACHANNEL_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_DATA_UNIFIEDDATACHANNEL_APIKind::OH_OHOS_DATA_UNIFIEDDATACHANNEL_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_unifiedDataChannel_Summary_construct() {
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_Summary()->construct();
}
KOALA_INTEROP_DIRECT_0(unifiedDataChannel_Summary_construct, OH_NativePointer)
OH_NativePointer impl_unifiedDataChannel_Summary_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_Summary()->destruct;
}
KOALA_INTEROP_DIRECT_0(unifiedDataChannel_Summary_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_unifiedDataChannel_Summary_getSummary(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_Summary()->getSummary(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.size);
        for (int32_t i = 0; i < retValue.size; i++) {
            auto retValueKeyVar = retValue.keys[i];
            auto retValueValueVar = retValue.values[i];
            _retSerializer.writeString(retValueKeyVar);
            _retSerializer.writeNumber(retValueValueVar);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(unifiedDataChannel_Summary_getSummary, KInteropReturnBuffer, OH_NativePointer)
void impl_unifiedDataChannel_Summary_setSummary(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 summaryValueTempTmpBufSizeVar = thisDeserializer.readInt32();
        Map_String_Number summaryValueTempTmpBuf = {};
        thisDeserializer.resizeMap<Map_String_Number, OH_String, OH_Number>(&summaryValueTempTmpBuf, summaryValueTempTmpBufSizeVar);
        for (int summaryValueTempTmpBufIVar = 0; summaryValueTempTmpBufIVar < summaryValueTempTmpBufSizeVar; summaryValueTempTmpBufIVar++) {
            const OH_String summaryValueTempTmpBufKeyVar = static_cast<OH_String>(thisDeserializer.readString());
            const OH_Number summaryValueTempTmpBufValueVar = static_cast<OH_Number>(thisDeserializer.readNumber());
            summaryValueTempTmpBuf.keys[summaryValueTempTmpBufIVar] = summaryValueTempTmpBufKeyVar;
            summaryValueTempTmpBuf.values[summaryValueTempTmpBufIVar] = summaryValueTempTmpBufValueVar;
        }
        Map_String_Number summaryValueTemp = summaryValueTempTmpBuf;;
        GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_Summary()->setSummary(thisPtr, static_cast<Map_String_Number*>(&summaryValueTemp));
}
KOALA_INTEROP_DIRECT_V3(unifiedDataChannel_Summary_setSummary, OH_NativePointer, KSerializerBuffer, int32_t)
OH_Number impl_unifiedDataChannel_Summary_getTotalSize(OH_NativePointer thisPtr) {
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_Summary()->getTotalSize(thisPtr);
}
KOALA_INTEROP_DIRECT_1(unifiedDataChannel_Summary_getTotalSize, KInteropNumber, OH_NativePointer)
void impl_unifiedDataChannel_Summary_setTotalSize(OH_NativePointer thisPtr, KInteropNumber totalSize) {
        GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_Summary()->setTotalSize(thisPtr, (const OH_Number*) (&totalSize));
}
KOALA_INTEROP_DIRECT_V2(unifiedDataChannel_Summary_setTotalSize, OH_NativePointer, KInteropNumber)
OH_NativePointer impl_unifiedDataChannel_UnifiedData_construct0(OH_NativePointer record_) {
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedData()->construct0(static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord>(record_));
}
KOALA_INTEROP_DIRECT_1(unifiedDataChannel_UnifiedData_construct0, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_unifiedDataChannel_UnifiedData_construct1() {
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedData()->construct1();
}
KOALA_INTEROP_DIRECT_0(unifiedDataChannel_UnifiedData_construct1, OH_NativePointer)
OH_NativePointer impl_unifiedDataChannel_UnifiedData_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedData()->destruct;
}
KOALA_INTEROP_DIRECT_0(unifiedDataChannel_UnifiedData_getFinalizer, OH_NativePointer)
void impl_unifiedDataChannel_UnifiedData_addRecord(OH_NativePointer thisPtr, OH_NativePointer record_) {
        GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedData()->addRecord(thisPtr, static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord>(record_));
}
KOALA_INTEROP_DIRECT_V2(unifiedDataChannel_UnifiedData_addRecord, OH_NativePointer, OH_NativePointer)
KInteropReturnBuffer impl_unifiedDataChannel_UnifiedData_getRecords(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedData()->getRecords(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord retValueTmpElement = retValue.array[retValueCounterI];
            unifiedDataChannel_UnifiedRecord_serializer::write(_retSerializer, retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(unifiedDataChannel_UnifiedData_getRecords, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_unifiedDataChannel_UnifiedRecord_construct0() {
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedRecord()->construct0();
}
KOALA_INTEROP_DIRECT_0(unifiedDataChannel_UnifiedRecord_construct0, OH_NativePointer)
OH_NativePointer impl_unifiedDataChannel_UnifiedRecord_construct1(const KStringPtr& type, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto valueValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_RuntimeType>(thisDeserializer.readInt8());
        Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object valueValueTempTmpBuf = {};
        valueValueTempTmpBuf.tag = valueValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((valueValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int8 valueValueTempTmpBuf_UnionSelector = thisDeserializer.readInt8();
            OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object valueValueTempTmpBuf_ = {};
            valueValueTempTmpBuf_.selector = valueValueTempTmpBuf_UnionSelector;
            if (valueValueTempTmpBuf_UnionSelector == 0) {
                valueValueTempTmpBuf_.selector = 0;
                valueValueTempTmpBuf_.value0 = static_cast<OH_Number>(thisDeserializer.readNumber());
            } else if (valueValueTempTmpBuf_UnionSelector == 1) {
                valueValueTempTmpBuf_.selector = 1;
                valueValueTempTmpBuf_.value1 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (valueValueTempTmpBuf_UnionSelector == 2) {
                valueValueTempTmpBuf_.selector = 2;
                valueValueTempTmpBuf_.value2 = thisDeserializer.readBoolean();
            } else if (valueValueTempTmpBuf_UnionSelector == 3) {
                valueValueTempTmpBuf_.selector = 3;
                valueValueTempTmpBuf_.value3 = static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_image_PixelMap>(image_PixelMap_serializer::read(thisDeserializer));
            } else if (valueValueTempTmpBuf_UnionSelector == 4) {
                valueValueTempTmpBuf_.selector = 4;
                valueValueTempTmpBuf_.value4 = static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_Want>(Want_serializer::read(thisDeserializer));
            } else if (valueValueTempTmpBuf_UnionSelector == 5) {
                valueValueTempTmpBuf_.selector = 5;
                valueValueTempTmpBuf_.value5 = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
            } else if (valueValueTempTmpBuf_UnionSelector == 6) {
                valueValueTempTmpBuf_.selector = 6;
                valueValueTempTmpBuf_.value6 = static_cast<OH_Object>(thisDeserializer.readObject());
            } else {
                INTEROP_FATAL("One of the branches for valueValueTempTmpBuf_ has to be chosen through deserialisation.");
            }
            valueValueTempTmpBuf.value = static_cast<OH_OHOS_DATA_UNIFIEDDATACHANNEL_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object>(valueValueTempTmpBuf_);
        }
        Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object valueValueTemp = valueValueTempTmpBuf;;
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedRecord()->construct1((const OH_String*) (&type), static_cast<Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object*>(&valueValueTemp));
}
KOALA_INTEROP_3(unifiedDataChannel_UnifiedRecord_construct1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_NativePointer impl_unifiedDataChannel_UnifiedRecord_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedRecord()->destruct;
}
KOALA_INTEROP_DIRECT_0(unifiedDataChannel_UnifiedRecord_getFinalizer, OH_NativePointer)
OH_String impl_unifiedDataChannel_UnifiedRecord_getType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedRecord()->getType(thisPtr);
}
KOALA_INTEROP_1(unifiedDataChannel_UnifiedRecord_getType, KStringPtr, OH_NativePointer)
void impl_unifiedDataChannel_UnifiedRecord_getValue(OH_NativePointer thisPtr) {
        GetOH_OHOS_DATA_UNIFIEDDATACHANNEL_API(OHOS_DATA_UNIFIEDDATACHANNEL_API_VERSION)->UnifiedDataChannel_UnifiedRecord()->getValue(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(unifiedDataChannel_UnifiedRecord_getValue, OH_NativePointer)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_DATA_UNIFIEDDATACHANNEL_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
OH_NativePointer getManagedCallbackCaller(CallbackKind kind)
{
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    return nullptr;
}