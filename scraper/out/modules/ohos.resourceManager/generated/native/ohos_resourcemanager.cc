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

#include "ohos_resourcemanager.h"

#define KOALA_INTEROP_MODULE OHOS_RESOURCEMANAGERNativeModule
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
    Kind_Callback_Opt_Array_String_Opt_Array_String_Void = 287839344,
    Kind_Callback_Opt_Array_String_Void = -543655128,
    Kind_Callback_Opt_Buffer_Opt_Array_String_Void = 184663715,
    Kind_Callback_Opt_Configuration_Opt_Array_String_Void = 897554387,
    Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void = -6708629,
    Kind_Callback_Opt_I64_Opt_Array_String_Void = 1178610856,
    Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void = -801661742,
    Kind_Callback_Opt_String_Opt_Array_String_Void = 1813490422,
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Array_Union_String_F64& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_Union_String_F64* value);

template <>
inline void WriteToString(std::string* result, const Array_Union_String_F64* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_RESOURCEMANAGER_Union_String_F64, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_RESOURCEMANAGER_Union_String_F64*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_Union_String_F64* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Array_Union_String_F64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_Buffer& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Buffer& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_Float64& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_Int64& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Opt_Int64* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode value) {
    result->append("OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_ConfigurationConstant_ColorMode* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_ConfigurationConstant_ColorMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction value) {
    result->append("OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_ConfigurationConstant_Direction* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_ConfigurationConstant_Direction& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity value) {
    result->append("OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_ConfigurationConstant_ScreenDensity* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_ConfigurationConstant_ScreenDensity& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_DrawableDescriptor& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_DrawableDescriptor value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_DrawableDescriptor* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_DrawableDescriptor& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode value) {
    result->append("OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_resourceManager_ColorMode* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_resourceManager_ColorMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType value) {
    result->append("OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_resourceManager_DeviceType* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_resourceManager_DeviceType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_resourceManager_Direction& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_resourceManager_Direction value) {
    result->append("OH_OHOS_RESOURCEMANAGER_resourceManager_Direction(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_resourceManager_Direction* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_resourceManager_Direction& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_resourceManager_ResourceManager* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_resourceManager_ResourceManager& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity value) {
    result->append("OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_resourceManager_ScreenDensity* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_resourceManager_ScreenDensity& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_AsyncCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_AsyncCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_AsyncCallback* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_AsyncCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OHOS_RESOURCEMANAGER_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RESOURCEMANAGER_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RESOURCEMANAGER_Callback_Void* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_OHOS_RESOURCEMANAGER_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_BusinessError& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_BusinessError value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_BusinessError& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_Configuration& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_Configuration* value) {
    result->append("{");
    // OH_String language
    result->append(".language=");
    WriteToString(result, &value->language);
    // OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode colorMode
    result->append(", ");
    result->append(".colorMode=");
    WriteToString(result, &value->colorMode);
    // OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction direction
    result->append(", ");
    result->append(".direction=");
    WriteToString(result, &value->direction);
    // OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity screenDensity
    result->append(", ");
    result->append(".screenDensity=");
    WriteToString(result, &value->screenDensity);
    // OH_Int64 displayId
    result->append(", ");
    result->append(".displayId=");
    WriteToString(result, &value->displayId);
    // OH_Boolean hasPointerDevice
    result->append(", ");
    result->append(".hasPointerDevice=");
    WriteToString(result, &value->hasPointerDevice);
    // OH_Float64 fontSizeScale
    result->append(", ");
    result->append(".fontSizeScale=");
    WriteToString(result, &value->fontSizeScale);
    // OH_Float64 fontWeightScale
    result->append(", ");
    result->append(".fontWeightScale=");
    WriteToString(result, &value->fontWeightScale);
    // OH_String mcc
    result->append(", ");
    result->append(".mcc=");
    WriteToString(result, &value->mcc);
    // OH_String mnc
    result->append(", ");
    result->append(".mnc=");
    WriteToString(result, &value->mnc);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Configuration* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Configuration& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_resourceManager_Configuration* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_resourceManager_Configuration& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_resourceManager_DeviceCapability* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_resourceManager_DeviceCapability& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const OH_OHOS_RESOURCEMANAGER_Union_String_F64& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_RESOURCEMANAGER_Union_String_F64: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RESOURCEMANAGER_Union_String_F64* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_String
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_Float64
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_String_F64* value) {
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Union_String_F64& value)
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
inline OH_OHOS_RESOURCEMANAGER_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class DrawableDescriptor_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_DrawableDescriptor value);
    static OH_OHOS_RESOURCEMANAGER_DrawableDescriptor read(DeserializerBase& buffer);
};
class resourceManager_ResourceManager_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager value);
    static OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager read(DeserializerBase& buffer);
};
class Configuration_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_Configuration value);
    static OH_OHOS_RESOURCEMANAGER_Configuration read(DeserializerBase& buffer);
};
class resourceManager_Configuration_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration value);
    static OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration read(DeserializerBase& buffer);
};
class resourceManager_DeviceCapability_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability value);
    static OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability read(DeserializerBase& buffer);
};
inline void DrawableDescriptor_serializer::write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_DrawableDescriptor value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RESOURCEMANAGER_DrawableDescriptor DrawableDescriptor_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RESOURCEMANAGER_DrawableDescriptor>(ptr);
}
inline void resourceManager_ResourceManager_serializer::write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager resourceManager_ResourceManager_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_ResourceManager>(ptr);
}
inline void Configuration_serializer::write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_Configuration value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForLanguage = value.language;
    if (runtimeType(valueHolderForLanguage) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLanguageTmpValue = valueHolderForLanguage.value;
        valueSerializer.writeString(valueHolderForLanguageTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForColorMode = value.colorMode;
    if (runtimeType(valueHolderForColorMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForColorModeTmpValue = valueHolderForColorMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode>(valueHolderForColorModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDirection = value.direction;
    if (runtimeType(valueHolderForDirection) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDirectionTmpValue = valueHolderForDirection.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction>(valueHolderForDirectionTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForScreenDensity = value.screenDensity;
    if (runtimeType(valueHolderForScreenDensity) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForScreenDensityTmpValue = valueHolderForScreenDensity.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity>(valueHolderForScreenDensityTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDisplayId = value.displayId;
    if (runtimeType(valueHolderForDisplayId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDisplayIdTmpValue = valueHolderForDisplayId.value;
        valueSerializer.writeInt64(valueHolderForDisplayIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHasPointerDevice = value.hasPointerDevice;
    if (runtimeType(valueHolderForHasPointerDevice) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHasPointerDeviceTmpValue = valueHolderForHasPointerDevice.value;
        valueSerializer.writeBoolean(valueHolderForHasPointerDeviceTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFontSizeScale = value.fontSizeScale;
    if (runtimeType(valueHolderForFontSizeScale) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFontSizeScaleTmpValue = valueHolderForFontSizeScale.value;
        valueSerializer.writeFloat64(valueHolderForFontSizeScaleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFontWeightScale = value.fontWeightScale;
    if (runtimeType(valueHolderForFontWeightScale) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFontWeightScaleTmpValue = valueHolderForFontWeightScale.value;
        valueSerializer.writeFloat64(valueHolderForFontWeightScaleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMcc = value.mcc;
    if (runtimeType(valueHolderForMcc) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMccTmpValue = valueHolderForMcc.value;
        valueSerializer.writeString(valueHolderForMccTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMnc = value.mnc;
    if (runtimeType(valueHolderForMnc) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMncTmpValue = valueHolderForMnc.value;
        valueSerializer.writeString(valueHolderForMncTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_RESOURCEMANAGER_Configuration Configuration_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_RESOURCEMANAGER_Configuration value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto languageTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_String languageTmpBuf = {};
    languageTmpBuf.tag = languageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((languageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        languageTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.language = languageTmpBuf;
    const auto colorModeTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_ConfigurationConstant_ColorMode colorModeTmpBuf = {};
    colorModeTmpBuf.tag = colorModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((colorModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        colorModeTmpBuf.value = static_cast<OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ColorMode>(valueDeserializer.readInt32());
    }
    value.colorMode = colorModeTmpBuf;
    const auto directionTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_ConfigurationConstant_Direction directionTmpBuf = {};
    directionTmpBuf.tag = directionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((directionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        directionTmpBuf.value = static_cast<OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_Direction>(valueDeserializer.readInt32());
    }
    value.direction = directionTmpBuf;
    const auto screenDensityTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_ConfigurationConstant_ScreenDensity screenDensityTmpBuf = {};
    screenDensityTmpBuf.tag = screenDensityTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((screenDensityTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        screenDensityTmpBuf.value = static_cast<OH_OHOS_RESOURCEMANAGER_ConfigurationConstant_ScreenDensity>(valueDeserializer.readInt32());
    }
    value.screenDensity = screenDensityTmpBuf;
    const auto displayIdTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Int64 displayIdTmpBuf = {};
    displayIdTmpBuf.tag = displayIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((displayIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        displayIdTmpBuf.value = valueDeserializer.readInt64();
    }
    value.displayId = displayIdTmpBuf;
    const auto hasPointerDeviceTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean hasPointerDeviceTmpBuf = {};
    hasPointerDeviceTmpBuf.tag = hasPointerDeviceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hasPointerDeviceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hasPointerDeviceTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.hasPointerDevice = hasPointerDeviceTmpBuf;
    const auto fontSizeScaleTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 fontSizeScaleTmpBuf = {};
    fontSizeScaleTmpBuf.tag = fontSizeScaleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontSizeScaleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        fontSizeScaleTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.fontSizeScale = fontSizeScaleTmpBuf;
    const auto fontWeightScaleTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 fontWeightScaleTmpBuf = {};
    fontWeightScaleTmpBuf.tag = fontWeightScaleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontWeightScaleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        fontWeightScaleTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.fontWeightScale = fontWeightScaleTmpBuf;
    const auto mccTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_String mccTmpBuf = {};
    mccTmpBuf.tag = mccTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((mccTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        mccTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.mcc = mccTmpBuf;
    const auto mncTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(valueDeserializer.readInt8());
    Opt_String mncTmpBuf = {};
    mncTmpBuf.tag = mncTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((mncTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        mncTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.mnc = mncTmpBuf;
    return value;
}
inline void resourceManager_Configuration_serializer::write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration resourceManager_Configuration_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration>(ptr);
}
inline void resourceManager_DeviceCapability_serializer::write(SerializerBase& buffer, OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability resourceManager_DeviceCapability_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceCapability>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_RESOURCEMANAGER_API* GetOH_OHOS_RESOURCEMANAGER_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_RESOURCEMANAGER_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_RESOURCEMANAGER_APIKind::OH_OHOS_RESOURCEMANAGER_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_resourceManager_Configuration_construct() {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->construct();
}
KOALA_INTEROP_DIRECT_0(resourceManager_Configuration_construct, OH_NativePointer)
OH_NativePointer impl_resourceManager_Configuration_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->destruct;
}
KOALA_INTEROP_DIRECT_0(resourceManager_Configuration_getFinalizer, OH_NativePointer)
OH_Int32 impl_resourceManager_Configuration_getDirection(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->getDirection(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_Configuration_getDirection, OH_Int32, OH_NativePointer)
void impl_resourceManager_Configuration_setDirection(OH_NativePointer thisPtr, OH_Int32 direction) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->setDirection(thisPtr, static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_Direction>(direction));
}
KOALA_INTEROP_DIRECT_V2(resourceManager_Configuration_setDirection, OH_NativePointer, OH_Int32)
OH_String impl_resourceManager_Configuration_getLocale(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->getLocale(thisPtr);
}
KOALA_INTEROP_1(resourceManager_Configuration_getLocale, KStringPtr, OH_NativePointer)
void impl_resourceManager_Configuration_setLocale(OH_NativePointer thisPtr, const KStringPtr& locale) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->setLocale(thisPtr, (const OH_String*) (&locale));
}
KOALA_INTEROP_V2(resourceManager_Configuration_setLocale, OH_NativePointer, KStringPtr)
OH_Int32 impl_resourceManager_Configuration_getDeviceType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->getDeviceType(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_Configuration_getDeviceType, OH_Int32, OH_NativePointer)
void impl_resourceManager_Configuration_setDeviceType(OH_NativePointer thisPtr, OH_Int32 deviceType) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->setDeviceType(thisPtr, static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType>(deviceType));
}
KOALA_INTEROP_DIRECT_V2(resourceManager_Configuration_setDeviceType, OH_NativePointer, OH_Int32)
OH_Int32 impl_resourceManager_Configuration_getScreenDensity(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->getScreenDensity(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_Configuration_getScreenDensity, OH_Int32, OH_NativePointer)
void impl_resourceManager_Configuration_setScreenDensity(OH_NativePointer thisPtr, OH_Int32 screenDensity) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->setScreenDensity(thisPtr, static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity>(screenDensity));
}
KOALA_INTEROP_DIRECT_V2(resourceManager_Configuration_setScreenDensity, OH_NativePointer, OH_Int32)
OH_Int32 impl_resourceManager_Configuration_getColorMode(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->getColorMode(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_Configuration_getColorMode, OH_Int32, OH_NativePointer)
void impl_resourceManager_Configuration_setColorMode(OH_NativePointer thisPtr, OH_Int32 colorMode) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->setColorMode(thisPtr, static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_ColorMode>(colorMode));
}
KOALA_INTEROP_DIRECT_V2(resourceManager_Configuration_setColorMode, OH_NativePointer, OH_Int32)
OH_Int32 impl_resourceManager_Configuration_getMcc(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->getMcc(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_Configuration_getMcc, OH_Int32, OH_NativePointer)
void impl_resourceManager_Configuration_setMcc(OH_NativePointer thisPtr, OH_Int32 mcc) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->setMcc(thisPtr, mcc);
}
KOALA_INTEROP_DIRECT_V2(resourceManager_Configuration_setMcc, OH_NativePointer, OH_Int32)
OH_Int32 impl_resourceManager_Configuration_getMnc(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->getMnc(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_Configuration_getMnc, OH_Int32, OH_NativePointer)
void impl_resourceManager_Configuration_setMnc(OH_NativePointer thisPtr, OH_Int32 mnc) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_Configuration()->setMnc(thisPtr, mnc);
}
KOALA_INTEROP_DIRECT_V2(resourceManager_Configuration_setMnc, OH_NativePointer, OH_Int32)
OH_NativePointer impl_resourceManager_DeviceCapability_construct() {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_DeviceCapability()->construct();
}
KOALA_INTEROP_DIRECT_0(resourceManager_DeviceCapability_construct, OH_NativePointer)
OH_NativePointer impl_resourceManager_DeviceCapability_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_DeviceCapability()->destruct;
}
KOALA_INTEROP_DIRECT_0(resourceManager_DeviceCapability_getFinalizer, OH_NativePointer)
OH_Int32 impl_resourceManager_DeviceCapability_getScreenDensity(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_DeviceCapability()->getScreenDensity(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_DeviceCapability_getScreenDensity, OH_Int32, OH_NativePointer)
void impl_resourceManager_DeviceCapability_setScreenDensity(OH_NativePointer thisPtr, OH_Int32 screenDensity) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_DeviceCapability()->setScreenDensity(thisPtr, static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_ScreenDensity>(screenDensity));
}
KOALA_INTEROP_DIRECT_V2(resourceManager_DeviceCapability_setScreenDensity, OH_NativePointer, OH_Int32)
OH_Int32 impl_resourceManager_DeviceCapability_getDeviceType(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_DeviceCapability()->getDeviceType(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_DeviceCapability_getDeviceType, OH_Int32, OH_NativePointer)
void impl_resourceManager_DeviceCapability_setDeviceType(OH_NativePointer thisPtr, OH_Int32 deviceType) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_DeviceCapability()->setDeviceType(thisPtr, static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_DeviceType>(deviceType));
}
KOALA_INTEROP_DIRECT_V2(resourceManager_DeviceCapability_setDeviceType, OH_NativePointer, OH_Int32)
OH_NativePointer impl_resourceManager_ResourceManager_construct() {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->construct();
}
KOALA_INTEROP_DIRECT_0(resourceManager_ResourceManager_construct, OH_NativePointer)
OH_NativePointer impl_resourceManager_ResourceManager_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->destruct;
}
KOALA_INTEROP_DIRECT_0(resourceManager_ResourceManager_getFinalizer, OH_NativePointer)
void impl_resourceManager_ResourceManager_getDeviceCapability0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDeviceCapability0(thisPtr, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(resourceManager_ResourceManager_getDeviceCapability0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getDeviceCapability1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDeviceCapability1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_DeviceCapability_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(resourceManager_ResourceManager_getDeviceCapability1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getConfiguration0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getConfiguration0(thisPtr, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(resourceManager_ResourceManager_getConfiguration0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getConfiguration1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Configuration value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Configuration_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Configuration value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Configuration_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getConfiguration1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Configuration_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(resourceManager_ResourceManager_getConfiguration1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getStringByName0(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringByName0(thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getStringByName0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getStringByName1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringByName1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getStringByName1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getStringArrayByName0(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringArrayByName0(thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getStringArrayByName0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getStringArrayByName1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringArrayByName1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getStringArrayByName1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaByName0(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaByName0(thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getMediaByName0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaByName1(OH_NativePointer thisPtr, const KStringPtr& resName, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaByName1(thisPtr, (const OH_String*) (&resName), density, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V5(resourceManager_ResourceManager_getMediaByName1, OH_NativePointer, KStringPtr, OH_Int32, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaByName2(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaByName2(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getMediaByName2, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaByName3(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& resName, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaByName3(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&resName), density, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(resourceManager_ResourceManager_getMediaByName3, OH_NativePointer, KStringPtr, OH_Int32, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaBase64ByName0(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaBase64ByName0(thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getMediaBase64ByName0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaBase64ByName1(OH_NativePointer thisPtr, const KStringPtr& resName, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaBase64ByName1(thisPtr, (const OH_String*) (&resName), density, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V5(resourceManager_ResourceManager_getMediaBase64ByName1, OH_NativePointer, KStringPtr, OH_Int32, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaBase64ByName2(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaBase64ByName2(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getMediaBase64ByName2, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaBase64ByName3(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& resName, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaBase64ByName3(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&resName), density, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(resourceManager_ResourceManager_getMediaBase64ByName3, OH_NativePointer, KStringPtr, OH_Int32, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getStringSync0(OH_NativePointer thisPtr, KLong resId) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringSync0(thisPtr, resId);
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getStringSync0, KStringPtr, OH_NativePointer, KLong)
OH_String impl_resourceManager_ResourceManager_getStringSync1(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 argsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_String_F64 argsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(argsValueTempTmpBuf)>::type,
        std::decay<decltype(*argsValueTempTmpBuf.array)>::type>(&argsValueTempTmpBuf, argsValueTempTmpBufLength);
        for (int argsValueTempTmpBufBufCounterI = 0; argsValueTempTmpBufBufCounterI < argsValueTempTmpBufLength; argsValueTempTmpBufBufCounterI++) {
            const OH_Int8 argsValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_RESOURCEMANAGER_Union_String_F64 argsValueTempTmpBufTempBuf = {};
            argsValueTempTmpBufTempBuf.selector = argsValueTempTmpBufTempBufUnionSelector;
            if (argsValueTempTmpBufTempBufUnionSelector == 0) {
                argsValueTempTmpBufTempBuf.selector = 0;
                argsValueTempTmpBufTempBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (argsValueTempTmpBufTempBufUnionSelector == 1) {
                argsValueTempTmpBufTempBuf.selector = 1;
                argsValueTempTmpBufTempBuf.value1 = thisDeserializer.readFloat64();
            } else {
                INTEROP_FATAL("One of the branches for argsValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            argsValueTempTmpBuf.array[argsValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RESOURCEMANAGER_Union_String_F64>(argsValueTempTmpBufTempBuf);
        }
        Array_Union_String_F64 argsValueTemp = argsValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringSync1(thisPtr, resId, static_cast<Array_Union_String_F64*>(&argsValueTemp));
}
KOALA_INTEROP_4(resourceManager_ResourceManager_getStringSync1, KStringPtr, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getStringByNameSync0(OH_NativePointer thisPtr, const KStringPtr& resName) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringByNameSync0(thisPtr, (const OH_String*) (&resName));
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getStringByNameSync0, KStringPtr, OH_NativePointer, KStringPtr)
OH_String impl_resourceManager_ResourceManager_getStringByNameSync1(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 argsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_String_F64 argsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(argsValueTempTmpBuf)>::type,
        std::decay<decltype(*argsValueTempTmpBuf.array)>::type>(&argsValueTempTmpBuf, argsValueTempTmpBufLength);
        for (int argsValueTempTmpBufBufCounterI = 0; argsValueTempTmpBufBufCounterI < argsValueTempTmpBufLength; argsValueTempTmpBufBufCounterI++) {
            const OH_Int8 argsValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_RESOURCEMANAGER_Union_String_F64 argsValueTempTmpBufTempBuf = {};
            argsValueTempTmpBufTempBuf.selector = argsValueTempTmpBufTempBufUnionSelector;
            if (argsValueTempTmpBufTempBufUnionSelector == 0) {
                argsValueTempTmpBufTempBuf.selector = 0;
                argsValueTempTmpBufTempBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (argsValueTempTmpBufTempBufUnionSelector == 1) {
                argsValueTempTmpBufTempBuf.selector = 1;
                argsValueTempTmpBufTempBuf.value1 = thisDeserializer.readFloat64();
            } else {
                INTEROP_FATAL("One of the branches for argsValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            argsValueTempTmpBuf.array[argsValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RESOURCEMANAGER_Union_String_F64>(argsValueTempTmpBufTempBuf);
        }
        Array_Union_String_F64 argsValueTemp = argsValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringByNameSync1(thisPtr, (const OH_String*) (&resName), static_cast<Array_Union_String_F64*>(&argsValueTemp));
}
KOALA_INTEROP_4(resourceManager_ResourceManager_getStringByNameSync1, KStringPtr, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_Boolean impl_resourceManager_ResourceManager_getBoolean(OH_NativePointer thisPtr, KLong resId) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getBoolean(thisPtr, resId);
}
KOALA_INTEROP_DIRECT_2(resourceManager_ResourceManager_getBoolean, OH_Boolean, OH_NativePointer, KLong)
OH_Boolean impl_resourceManager_ResourceManager_getBooleanByName(OH_NativePointer thisPtr, const KStringPtr& resName) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getBooleanByName(thisPtr, (const OH_String*) (&resName));
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getBooleanByName, OH_Boolean, OH_NativePointer, KStringPtr)
OH_Int32 impl_resourceManager_ResourceManager_getInt(OH_NativePointer thisPtr, KLong resId) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getInt(thisPtr, resId);
}
KOALA_INTEROP_DIRECT_2(resourceManager_ResourceManager_getInt, OH_Int32, OH_NativePointer, KLong)
OH_Int32 impl_resourceManager_ResourceManager_getDouble(OH_NativePointer thisPtr, KLong resId) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDouble(thisPtr, resId);
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getDouble, OH_Int32, OH_NativePointer, KLong)
OH_Int32 impl_resourceManager_ResourceManager_getIntByName(OH_NativePointer thisPtr, const KStringPtr& resName) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getIntByName(thisPtr, (const OH_String*) (&resName));
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getIntByName, OH_Int32, OH_NativePointer, KStringPtr)
OH_Int32 impl_resourceManager_ResourceManager_getDoubleByName(OH_NativePointer thisPtr, const KStringPtr& resName) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDoubleByName(thisPtr, (const OH_String*) (&resName));
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getDoubleByName, OH_Int32, OH_NativePointer, KStringPtr)
void impl_resourceManager_ResourceManager_getStringValue0(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringValue0(thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(resourceManager_ResourceManager_getStringValue0, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getStringValue1(KVMContext vmContext, OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringValue1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getStringValue1, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getStringArrayValue0(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringArrayValue0(thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(resourceManager_ResourceManager_getStringArrayValue0, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getStringArrayValue1(KVMContext vmContext, OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringArrayValue1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getStringArrayValue1, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getIntPluralStringValueSync(OH_NativePointer thisPtr, KLong resId, OH_Int32 num, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 argsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_String_F64 argsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(argsValueTempTmpBuf)>::type,
        std::decay<decltype(*argsValueTempTmpBuf.array)>::type>(&argsValueTempTmpBuf, argsValueTempTmpBufLength);
        for (int argsValueTempTmpBufBufCounterI = 0; argsValueTempTmpBufBufCounterI < argsValueTempTmpBufLength; argsValueTempTmpBufBufCounterI++) {
            const OH_Int8 argsValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_RESOURCEMANAGER_Union_String_F64 argsValueTempTmpBufTempBuf = {};
            argsValueTempTmpBufTempBuf.selector = argsValueTempTmpBufTempBufUnionSelector;
            if (argsValueTempTmpBufTempBufUnionSelector == 0) {
                argsValueTempTmpBufTempBuf.selector = 0;
                argsValueTempTmpBufTempBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (argsValueTempTmpBufTempBufUnionSelector == 1) {
                argsValueTempTmpBufTempBuf.selector = 1;
                argsValueTempTmpBufTempBuf.value1 = thisDeserializer.readFloat64();
            } else {
                INTEROP_FATAL("One of the branches for argsValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            argsValueTempTmpBuf.array[argsValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RESOURCEMANAGER_Union_String_F64>(argsValueTempTmpBufTempBuf);
        }
        Array_Union_String_F64 argsValueTemp = argsValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getIntPluralStringValueSync(thisPtr, resId, num, static_cast<Array_Union_String_F64*>(&argsValueTemp));
}
KOALA_INTEROP_5(resourceManager_ResourceManager_getIntPluralStringValueSync, KStringPtr, OH_NativePointer, KLong, OH_Int32, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getIntPluralStringByNameSync(OH_NativePointer thisPtr, const KStringPtr& resName, OH_Int32 num, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 argsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_String_F64 argsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(argsValueTempTmpBuf)>::type,
        std::decay<decltype(*argsValueTempTmpBuf.array)>::type>(&argsValueTempTmpBuf, argsValueTempTmpBufLength);
        for (int argsValueTempTmpBufBufCounterI = 0; argsValueTempTmpBufBufCounterI < argsValueTempTmpBufLength; argsValueTempTmpBufBufCounterI++) {
            const OH_Int8 argsValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_RESOURCEMANAGER_Union_String_F64 argsValueTempTmpBufTempBuf = {};
            argsValueTempTmpBufTempBuf.selector = argsValueTempTmpBufTempBufUnionSelector;
            if (argsValueTempTmpBufTempBufUnionSelector == 0) {
                argsValueTempTmpBufTempBuf.selector = 0;
                argsValueTempTmpBufTempBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (argsValueTempTmpBufTempBufUnionSelector == 1) {
                argsValueTempTmpBufTempBuf.selector = 1;
                argsValueTempTmpBufTempBuf.value1 = thisDeserializer.readFloat64();
            } else {
                INTEROP_FATAL("One of the branches for argsValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            argsValueTempTmpBuf.array[argsValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RESOURCEMANAGER_Union_String_F64>(argsValueTempTmpBufTempBuf);
        }
        Array_Union_String_F64 argsValueTemp = argsValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getIntPluralStringByNameSync(thisPtr, (const OH_String*) (&resName), num, static_cast<Array_Union_String_F64*>(&argsValueTemp));
}
KOALA_INTEROP_5(resourceManager_ResourceManager_getIntPluralStringByNameSync, KStringPtr, OH_NativePointer, KStringPtr, OH_Int32, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getDoublePluralStringValueSync(OH_NativePointer thisPtr, KLong resId, KDouble num, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 argsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_String_F64 argsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(argsValueTempTmpBuf)>::type,
        std::decay<decltype(*argsValueTempTmpBuf.array)>::type>(&argsValueTempTmpBuf, argsValueTempTmpBufLength);
        for (int argsValueTempTmpBufBufCounterI = 0; argsValueTempTmpBufBufCounterI < argsValueTempTmpBufLength; argsValueTempTmpBufBufCounterI++) {
            const OH_Int8 argsValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_RESOURCEMANAGER_Union_String_F64 argsValueTempTmpBufTempBuf = {};
            argsValueTempTmpBufTempBuf.selector = argsValueTempTmpBufTempBufUnionSelector;
            if (argsValueTempTmpBufTempBufUnionSelector == 0) {
                argsValueTempTmpBufTempBuf.selector = 0;
                argsValueTempTmpBufTempBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (argsValueTempTmpBufTempBufUnionSelector == 1) {
                argsValueTempTmpBufTempBuf.selector = 1;
                argsValueTempTmpBufTempBuf.value1 = thisDeserializer.readFloat64();
            } else {
                INTEROP_FATAL("One of the branches for argsValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            argsValueTempTmpBuf.array[argsValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RESOURCEMANAGER_Union_String_F64>(argsValueTempTmpBufTempBuf);
        }
        Array_Union_String_F64 argsValueTemp = argsValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDoublePluralStringValueSync(thisPtr, resId, num, static_cast<Array_Union_String_F64*>(&argsValueTemp));
}
KOALA_INTEROP_5(resourceManager_ResourceManager_getDoublePluralStringValueSync, KStringPtr, OH_NativePointer, KLong, KDouble, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getDoublePluralStringByNameSync(OH_NativePointer thisPtr, const KStringPtr& resName, KDouble num, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 argsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_String_F64 argsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(argsValueTempTmpBuf)>::type,
        std::decay<decltype(*argsValueTempTmpBuf.array)>::type>(&argsValueTempTmpBuf, argsValueTempTmpBufLength);
        for (int argsValueTempTmpBufBufCounterI = 0; argsValueTempTmpBufBufCounterI < argsValueTempTmpBufLength; argsValueTempTmpBufBufCounterI++) {
            const OH_Int8 argsValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_RESOURCEMANAGER_Union_String_F64 argsValueTempTmpBufTempBuf = {};
            argsValueTempTmpBufTempBuf.selector = argsValueTempTmpBufTempBufUnionSelector;
            if (argsValueTempTmpBufTempBufUnionSelector == 0) {
                argsValueTempTmpBufTempBuf.selector = 0;
                argsValueTempTmpBufTempBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
            } else if (argsValueTempTmpBufTempBufUnionSelector == 1) {
                argsValueTempTmpBufTempBuf.selector = 1;
                argsValueTempTmpBufTempBuf.value1 = thisDeserializer.readFloat64();
            } else {
                INTEROP_FATAL("One of the branches for argsValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            argsValueTempTmpBuf.array[argsValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RESOURCEMANAGER_Union_String_F64>(argsValueTempTmpBufTempBuf);
        }
        Array_Union_String_F64 argsValueTemp = argsValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDoublePluralStringByNameSync(thisPtr, (const OH_String*) (&resName), num, static_cast<Array_Union_String_F64*>(&argsValueTemp));
}
KOALA_INTEROP_5(resourceManager_ResourceManager_getDoublePluralStringByNameSync, KStringPtr, OH_NativePointer, KStringPtr, KDouble, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContent0(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContent0(thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(resourceManager_ResourceManager_getMediaContent0, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContent1(OH_NativePointer thisPtr, KLong resId, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContent1(thisPtr, resId, density, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V5(resourceManager_ResourceManager_getMediaContent1, OH_NativePointer, KLong, OH_Int32, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContent2(KVMContext vmContext, OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContent2(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getMediaContent2, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContent3(KVMContext vmContext, OH_NativePointer thisPtr, KLong resId, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContent3(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, resId, density, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(resourceManager_ResourceManager_getMediaContent3, OH_NativePointer, KLong, OH_Int32, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContentBase640(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContentBase640(thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(resourceManager_ResourceManager_getMediaContentBase640, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContentBase641(OH_NativePointer thisPtr, KLong resId, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContentBase641(thisPtr, resId, density, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V5(resourceManager_ResourceManager_getMediaContentBase641, OH_NativePointer, KLong, OH_Int32, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContentBase642(KVMContext vmContext, OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContentBase642(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getMediaContentBase642, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getMediaContentBase643(KVMContext vmContext, OH_NativePointer thisPtr, KLong resId, OH_Int32 density, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContentBase643(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, resId, density, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(resourceManager_ResourceManager_getMediaContentBase643, OH_NativePointer, KLong, OH_Int32, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getRawFileContent0(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFileContent0(thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getRawFileContent0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getRawFileContent1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFileContent1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Buffer_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getRawFileContent1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getRawFd0(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFd0(thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getRawFd0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getRawFd1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFd1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getRawFd1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_closeRawFd0(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->closeRawFd0(thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_closeRawFd0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_closeRawFd1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->closeRawFd1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_closeRawFd1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_NativePointer impl_resourceManager_ResourceManager_getDrawableDescriptor(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto densityValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 densityValueTempTmpBuf = {};
        densityValueTempTmpBuf.tag = densityValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((densityValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            densityValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 densityValueTemp = densityValueTempTmpBuf;;
        const auto typeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 typeValueTempTmpBuf = {};
        typeValueTempTmpBuf.tag = typeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((typeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            typeValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 typeValueTemp = typeValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDrawableDescriptor(thisPtr, resId, static_cast<Opt_Int32*>(&densityValueTemp), static_cast<Opt_Int32*>(&typeValueTemp));
}
KOALA_INTEROP_DIRECT_4(resourceManager_ResourceManager_getDrawableDescriptor, OH_NativePointer, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
OH_NativePointer impl_resourceManager_ResourceManager_getDrawableDescriptorByName(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto densityValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 densityValueTempTmpBuf = {};
        densityValueTempTmpBuf.tag = densityValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((densityValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            densityValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 densityValueTemp = densityValueTempTmpBuf;;
        const auto typeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 typeValueTempTmpBuf = {};
        typeValueTempTmpBuf.tag = typeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((typeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            typeValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 typeValueTemp = typeValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDrawableDescriptorByName(thisPtr, (const OH_String*) (&resName), static_cast<Opt_Int32*>(&densityValueTemp), static_cast<Opt_Int32*>(&typeValueTemp));
}
KOALA_INTEROP_4(resourceManager_ResourceManager_getDrawableDescriptorByName, OH_NativePointer, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getRawFileList0(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFileList0(thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getRawFileList0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getRawFileList1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFileList1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&path), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_Array_String_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getRawFileList1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getColor0(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getColor0(thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(resourceManager_ResourceManager_getColor0, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getColor1(KVMContext vmContext, OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_I64_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_I64_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getColor1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, resId, static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getColor1, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getColorByName0(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getColorByName0(thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(resourceManager_ResourceManager_getColorByName0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_resourceManager_ResourceManager_getColorByName1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_I64_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_I64_Opt_Array_String_Void))))};;
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getColorByName1(reinterpret_cast<OH_OHOS_RESOURCEMANAGER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&resName), static_cast<OHOS_RESOURCEMANAGER_Callback_Opt_I64_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(resourceManager_ResourceManager_getColorByName1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_Int32 impl_resourceManager_ResourceManager_getColorSync(OH_NativePointer thisPtr, KLong resId) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getColorSync(thisPtr, resId);
}
KOALA_INTEROP_DIRECT_2(resourceManager_ResourceManager_getColorSync, OH_Int32, OH_NativePointer, KLong)
OH_Int32 impl_resourceManager_ResourceManager_getColorByNameSync(OH_NativePointer thisPtr, const KStringPtr& resName) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getColorByNameSync(thisPtr, (const OH_String*) (&resName));
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getColorByNameSync, OH_Int32, OH_NativePointer, KStringPtr)
void impl_resourceManager_ResourceManager_addResource(OH_NativePointer thisPtr, const KStringPtr& path) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->addResource(thisPtr, (const OH_String*) (&path));
}
KOALA_INTEROP_V2(resourceManager_ResourceManager_addResource, OH_NativePointer, KStringPtr)
void impl_resourceManager_ResourceManager_removeResource(OH_NativePointer thisPtr, const KStringPtr& path) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->removeResource(thisPtr, (const OH_String*) (&path));
}
KOALA_INTEROP_V2(resourceManager_ResourceManager_removeResource, OH_NativePointer, KStringPtr)
void impl_resourceManager_ResourceManager_getRawFdSync(OH_NativePointer thisPtr, const KStringPtr& path) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFdSync(thisPtr, (const OH_String*) (&path));
}
KOALA_INTEROP_V2(resourceManager_ResourceManager_getRawFdSync, OH_NativePointer, KStringPtr)
void impl_resourceManager_ResourceManager_closeRawFdSync(OH_NativePointer thisPtr, const KStringPtr& path) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->closeRawFdSync(thisPtr, (const OH_String*) (&path));
}
KOALA_INTEROP_V2(resourceManager_ResourceManager_closeRawFdSync, OH_NativePointer, KStringPtr)
KInteropReturnBuffer impl_resourceManager_ResourceManager_getRawFileListSync(OH_NativePointer thisPtr, const KStringPtr& path) {
        const auto &retValue = GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFileListSync(thisPtr, (const OH_String*) (&path));
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_String retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeString(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getRawFileListSync, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
KInteropReturnBuffer impl_resourceManager_ResourceManager_getRawFileContentSync(OH_NativePointer thisPtr, const KStringPtr& path) {
        const auto &retValue = GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getRawFileContentSync(thisPtr, (const OH_String*) (&path));
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getRawFileContentSync, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
KInteropReturnBuffer impl_resourceManager_ResourceManager_getMediaContentSync(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto densityValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 densityValueTempTmpBuf = {};
        densityValueTempTmpBuf.tag = densityValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((densityValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            densityValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 densityValueTemp = densityValueTempTmpBuf;;
        const auto &retValue = GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContentSync(thisPtr, resId, static_cast<Opt_Int32*>(&densityValueTemp));
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_4(resourceManager_ResourceManager_getMediaContentSync, KInteropReturnBuffer, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getMediaContentBase64Sync(OH_NativePointer thisPtr, KLong resId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto densityValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 densityValueTempTmpBuf = {};
        densityValueTempTmpBuf.tag = densityValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((densityValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            densityValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 densityValueTemp = densityValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaContentBase64Sync(thisPtr, resId, static_cast<Opt_Int32*>(&densityValueTemp));
}
KOALA_INTEROP_4(resourceManager_ResourceManager_getMediaContentBase64Sync, KStringPtr, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_resourceManager_ResourceManager_getStringArrayValueSync(OH_NativePointer thisPtr, KLong resId) {
        const auto &retValue = GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringArrayValueSync(thisPtr, resId);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_String retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeString(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getStringArrayValueSync, KInteropReturnBuffer, OH_NativePointer, KLong)
KInteropReturnBuffer impl_resourceManager_ResourceManager_getMediaByNameSync(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto densityValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 densityValueTempTmpBuf = {};
        densityValueTempTmpBuf.tag = densityValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((densityValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            densityValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 densityValueTemp = densityValueTempTmpBuf;;
        const auto &retValue = GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaByNameSync(thisPtr, (const OH_String*) (&resName), static_cast<Opt_Int32*>(&densityValueTemp));
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_4(resourceManager_ResourceManager_getMediaByNameSync, KInteropReturnBuffer, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_String impl_resourceManager_ResourceManager_getMediaBase64ByNameSync(OH_NativePointer thisPtr, const KStringPtr& resName, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto densityValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 densityValueTempTmpBuf = {};
        densityValueTempTmpBuf.tag = densityValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((densityValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            densityValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 densityValueTemp = densityValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getMediaBase64ByNameSync(thisPtr, (const OH_String*) (&resName), static_cast<Opt_Int32*>(&densityValueTemp));
}
KOALA_INTEROP_4(resourceManager_ResourceManager_getMediaBase64ByNameSync, KStringPtr, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_resourceManager_ResourceManager_getStringArrayByNameSync(OH_NativePointer thisPtr, const KStringPtr& resName) {
        const auto &retValue = GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getStringArrayByNameSync(thisPtr, (const OH_String*) (&resName));
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_String retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeString(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getStringArrayByNameSync, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
OH_NativePointer impl_resourceManager_ResourceManager_getConfigurationSync(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getConfigurationSync(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_ResourceManager_getConfigurationSync, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_resourceManager_ResourceManager_getDeviceCapabilitySync(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getDeviceCapabilitySync(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_ResourceManager_getDeviceCapabilitySync, OH_NativePointer, OH_NativePointer)
KInteropReturnBuffer impl_resourceManager_ResourceManager_getLocales(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto includeSystemValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean includeSystemValueTempTmpBuf = {};
        includeSystemValueTempTmpBuf.tag = includeSystemValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((includeSystemValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            includeSystemValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean includeSystemValueTemp = includeSystemValueTempTmpBuf;;
        const auto &retValue = GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getLocales(thisPtr, static_cast<Opt_Boolean*>(&includeSystemValueTemp));
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_String retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeString(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_3(resourceManager_ResourceManager_getLocales, KInteropReturnBuffer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_Int32 impl_resourceManager_ResourceManager_getSymbol(OH_NativePointer thisPtr, KLong resId) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getSymbol(thisPtr, resId);
}
KOALA_INTEROP_DIRECT_2(resourceManager_ResourceManager_getSymbol, OH_Int32, OH_NativePointer, KLong)
OH_Int32 impl_resourceManager_ResourceManager_getSymbolByName(OH_NativePointer thisPtr, const KStringPtr& resName) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getSymbolByName(thisPtr, (const OH_String*) (&resName));
}
KOALA_INTEROP_2(resourceManager_ResourceManager_getSymbolByName, OH_Int32, OH_NativePointer, KStringPtr)
OH_Boolean impl_resourceManager_ResourceManager_isRawDir(OH_NativePointer thisPtr, const KStringPtr& path) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->isRawDir(thisPtr, (const OH_String*) (&path));
}
KOALA_INTEROP_2(resourceManager_ResourceManager_isRawDir, OH_Boolean, OH_NativePointer, KStringPtr)
OH_NativePointer impl_resourceManager_ResourceManager_getOverrideResourceManager(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto configurationValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
        Opt_resourceManager_Configuration configurationValueTempTmpBuf = {};
        configurationValueTempTmpBuf.tag = configurationValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((configurationValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            configurationValueTempTmpBuf.value = static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration>(resourceManager_Configuration_serializer::read(thisDeserializer));
        }
        Opt_resourceManager_Configuration configurationValueTemp = configurationValueTempTmpBuf;;
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getOverrideResourceManager(thisPtr, static_cast<Opt_resourceManager_Configuration*>(&configurationValueTemp));
}
KOALA_INTEROP_DIRECT_3(resourceManager_ResourceManager_getOverrideResourceManager, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_resourceManager_ResourceManager_getOverrideConfiguration(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->getOverrideConfiguration(thisPtr);
}
KOALA_INTEROP_DIRECT_1(resourceManager_ResourceManager_getOverrideConfiguration, OH_NativePointer, OH_NativePointer)
void impl_resourceManager_ResourceManager_updateOverrideConfiguration(OH_NativePointer thisPtr, OH_NativePointer configuration) {
        GetOH_OHOS_RESOURCEMANAGER_API(OHOS_RESOURCEMANAGER_API_VERSION)->ResourceManager_ResourceManager()->updateOverrideConfiguration(thisPtr, static_cast<OH_OHOS_RESOURCEMANAGER_resourceManager_Configuration>(configuration));
}
KOALA_INTEROP_DIRECT_V2(resourceManager_ResourceManager_updateOverrideConfiguration, OH_NativePointer, OH_NativePointer)
void deserializeAndCallCallback_Opt_Array_String_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 valueTmpBuf_Length = thisDeserializer.readInt32();
        Array_String valueTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(valueTmpBuf_)>::type,
        std::decay<decltype(*valueTmpBuf_.array)>::type>(&valueTmpBuf_, valueTmpBuf_Length);
        for (int valueTmpBuf_BufCounterI = 0; valueTmpBuf_BufCounterI < valueTmpBuf_Length; valueTmpBuf_BufCounterI++) {
            valueTmpBuf_.array[valueTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        valueTmpBuf.value = valueTmpBuf_;
    }
    Opt_Array_String value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Array_String_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Array_String valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 valueTmpBuf_Length = thisDeserializer.readInt32();
        Array_String valueTmpBuf_ = {};
        thisDeserializer.resizeArray<std::decay<decltype(valueTmpBuf_)>::type,
        std::decay<decltype(*valueTmpBuf_.array)>::type>(&valueTmpBuf_, valueTmpBuf_Length);
        for (int valueTmpBuf_BufCounterI = 0; valueTmpBuf_BufCounterI < valueTmpBuf_Length; valueTmpBuf_BufCounterI++) {
            valueTmpBuf_.array[valueTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        valueTmpBuf.value = valueTmpBuf_;
    }
    Opt_Array_String value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))));
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_Buffer_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Buffer valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
    }
    Opt_Buffer value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Buffer_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Buffer_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Buffer valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_Buffer>(thisDeserializer.readBuffer());
    }
    Opt_Buffer value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_Configuration_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Configuration value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Configuration_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Configuration valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = Configuration_serializer::read(thisDeserializer);
    }
    Opt_Configuration value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Configuration_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Configuration value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Configuration_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Configuration valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = Configuration_serializer::read(thisDeserializer);
    }
    Opt_Configuration value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_DeviceCapability_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_DeviceCapability_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_I64_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_I64_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Int64 valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readInt64();
    }
    Opt_Int64 value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_I64_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Int64 value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_I64_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_Int64 valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readInt64();
    }
    Opt_Int64 value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_RawFileDescriptor_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_RawFileDescriptor_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_String valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
    }
    Opt_String value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_String_Opt_Array_String_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_String_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
    Opt_String valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
    }
    Opt_String value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RESOURCEMANAGER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Void(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_Opt_Array_String_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Buffer_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Configuration_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Configuration_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_DeviceCapability_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_I64_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_I64_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_RawFileDescriptor_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_String_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_Opt_Array_String_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Buffer_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Configuration_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Configuration_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_DeviceCapability_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_I64_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_I64_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_RawFileDescriptor_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_String_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_Opt_Array_String_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_String value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Array_String_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt32(valueTmpValue.length);
        for (int valueTmpValueCounterI = 0; valueTmpValueCounterI < valueTmpValue.length; valueTmpValueCounterI++) {
            const OH_String valueTmpValueTmpElement = valueTmpValue.array[valueTmpValueCounterI];
            argsSerializer.writeString(valueTmpValueTmpElement);
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
void callManagedCallback_Opt_Array_String_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Array_String_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt32(valueTmpValue.length);
        for (int valueTmpValueCounterI = 0; valueTmpValueCounterI < valueTmpValue.length; valueTmpValueCounterI++) {
            const OH_String valueTmpValueTmpElement = valueTmpValue.array[valueTmpValueCounterI];
            argsSerializer.writeString(valueTmpValueTmpElement);
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
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String error)
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
void callManagedCallback_Opt_Buffer_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Buffer value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Buffer_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_Buffer value, Opt_Array_String error)
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
void callManagedCallback_Opt_Configuration_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Configuration value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Configuration_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        Configuration_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_Configuration_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_Configuration value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Configuration_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        Configuration_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_DeviceCapability_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void);
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
void callManagedCallback_Opt_DeviceCapability_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void);
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
void callManagedCallback_Opt_I64_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Int64 value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_I64_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt64(valueTmpValue);
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
void callManagedCallback_Opt_I64_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_Int64 value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_I64_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeInt64(valueTmpValue);
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
void callManagedCallback_Opt_RawFileDescriptor_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void);
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
void callManagedCallback_Opt_RawFileDescriptor_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void);
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
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_String_Opt_Array_String_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId, Opt_String value, Opt_Array_String error)
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
    const OH_OHOS_RESOURCEMANAGER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_RESOURCEMANAGER_VMContext vmContext, OH_Int32 resourceId)
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
        case Kind_Callback_Opt_Array_String_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Opt_Array_String_Void);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Void);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Buffer_Opt_Array_String_Void);
        case Kind_Callback_Opt_Configuration_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Configuration_Opt_Array_String_Void);
        case Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_DeviceCapability_Opt_Array_String_Void);
        case Kind_Callback_Opt_I64_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_I64_Opt_Array_String_Void);
        case Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_RawFileDescriptor_Opt_Array_String_Void);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_String_Opt_Array_String_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Opt_Array_String_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Buffer_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Buffer_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Configuration_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Configuration_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_DeviceCapability_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_DeviceCapability_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_I64_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_I64_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_RawFileDescriptor_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_RawFileDescriptor_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_String_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_String_Opt_Array_String_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}