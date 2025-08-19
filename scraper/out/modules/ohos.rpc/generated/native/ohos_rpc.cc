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

#include "ohos_rpc.h"

#define KOALA_INTEROP_MODULE OHOS_RPCNativeModule
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
    Kind_Callback_Opt_RequestResult_Opt_Array_String_Void = -113465829,
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const Array_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_Boolean value);

template <>
inline void WriteToString(std::string* result, const Array_Boolean* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_Boolean, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_Boolean* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Array_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const Array_Float64& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_Float64 value);

template <>
inline void WriteToString(std::string* result, const Array_Float64* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_Float64, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_Float64* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Array_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const Array_Int32& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_Int32 value);

template <>
inline void WriteToString(std::string* result, const Array_Int32* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_Int32, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_Int32* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Array_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const Array_rpc_Parcelable& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_Parcelable value);

template <>
inline void WriteToString(std::string* result, const Array_rpc_Parcelable* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_RPC_rpc_Parcelable, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_rpc_Parcelable* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Array_rpc_Parcelable& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_Buffer& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Buffer& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_Float64& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_rpc_Ashmem& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_Ashmem value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_rpc_Ashmem* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_rpc_Ashmem& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_rpc_DeathRecipient& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_DeathRecipient value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_rpc_DeathRecipient* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_rpc_DeathRecipient& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_rpc_IRemoteObject& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_IRemoteObject value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_rpc_IRemoteObject* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_rpc_IRemoteObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_rpc_MessageOption& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_MessageOption value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_rpc_MessageOption* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_rpc_MessageOption& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_rpc_MessageSequence& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_MessageSequence value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_rpc_MessageSequence* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_rpc_MessageSequence& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_rpc_Parcelable& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_Parcelable value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_rpc_Parcelable* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_rpc_Parcelable& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_rpc_RequestResult& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_rpc_RequestResult* value) {
    result->append("{");
    // OH_Int32 errCode
    result->append(".errCode=");
    WriteToString(result, value->errCode);
    // OH_Int32 code
    result->append(", ");
    result->append(".code=");
    WriteToString(result, value->code);
    // OH_OHOS_RPC_rpc_MessageSequence data
    result->append(", ");
    result->append(".data=");
    WriteToString(result, value->data);
    // OH_OHOS_RPC_rpc_MessageSequence reply
    result->append(", ");
    result->append(".reply=");
    WriteToString(result, value->reply);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_rpc_RequestResult* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_rpc_RequestResult& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OHOS_RPC_AsyncCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RPC_AsyncCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RPC_AsyncCallback* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_OHOS_RPC_AsyncCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OHOS_RPC_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_RPC_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_RPC_Callback_Void* value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_OHOS_RPC_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_RPC_RuntimeType runtimeType(const OH_OHOS_RPC_BusinessError& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_RPC_BusinessError value) {
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_BusinessError& value)
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
inline OH_OHOS_RPC_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class rpc_Ashmem_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RPC_rpc_Ashmem value);
    static OH_OHOS_RPC_rpc_Ashmem read(DeserializerBase& buffer);
};
class rpc_DeathRecipient_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RPC_rpc_DeathRecipient value);
    static OH_OHOS_RPC_rpc_DeathRecipient read(DeserializerBase& buffer);
};
class rpc_IRemoteObject_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RPC_rpc_IRemoteObject value);
    static OH_OHOS_RPC_rpc_IRemoteObject read(DeserializerBase& buffer);
};
class rpc_MessageOption_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RPC_rpc_MessageOption value);
    static OH_OHOS_RPC_rpc_MessageOption read(DeserializerBase& buffer);
};
class rpc_MessageSequence_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RPC_rpc_MessageSequence value);
    static OH_OHOS_RPC_rpc_MessageSequence read(DeserializerBase& buffer);
};
class rpc_Parcelable_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RPC_rpc_Parcelable value);
    static OH_OHOS_RPC_rpc_Parcelable read(DeserializerBase& buffer);
};
class rpc_RequestResult_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_RPC_rpc_RequestResult value);
    static OH_OHOS_RPC_rpc_RequestResult read(DeserializerBase& buffer);
};
inline void rpc_Ashmem_serializer::write(SerializerBase& buffer, OH_OHOS_RPC_rpc_Ashmem value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RPC_rpc_Ashmem rpc_Ashmem_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RPC_rpc_Ashmem>(ptr);
}
inline void rpc_DeathRecipient_serializer::write(SerializerBase& buffer, OH_OHOS_RPC_rpc_DeathRecipient value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RPC_rpc_DeathRecipient rpc_DeathRecipient_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RPC_rpc_DeathRecipient>(ptr);
}
inline void rpc_IRemoteObject_serializer::write(SerializerBase& buffer, OH_OHOS_RPC_rpc_IRemoteObject value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RPC_rpc_IRemoteObject rpc_IRemoteObject_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RPC_rpc_IRemoteObject>(ptr);
}
inline void rpc_MessageOption_serializer::write(SerializerBase& buffer, OH_OHOS_RPC_rpc_MessageOption value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RPC_rpc_MessageOption rpc_MessageOption_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RPC_rpc_MessageOption>(ptr);
}
inline void rpc_MessageSequence_serializer::write(SerializerBase& buffer, OH_OHOS_RPC_rpc_MessageSequence value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RPC_rpc_MessageSequence rpc_MessageSequence_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RPC_rpc_MessageSequence>(ptr);
}
inline void rpc_Parcelable_serializer::write(SerializerBase& buffer, OH_OHOS_RPC_rpc_Parcelable value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_RPC_rpc_Parcelable rpc_Parcelable_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_RPC_rpc_Parcelable>(ptr);
}
inline void rpc_RequestResult_serializer::write(SerializerBase& buffer, OH_OHOS_RPC_rpc_RequestResult value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForErrCode = value.errCode;
    valueSerializer.writeInt32(valueHolderForErrCode);
    const auto valueHolderForCode = value.code;
    valueSerializer.writeInt32(valueHolderForCode);
    const auto valueHolderForData = value.data;
    rpc_MessageSequence_serializer::write(valueSerializer, valueHolderForData);
    const auto valueHolderForReply = value.reply;
    rpc_MessageSequence_serializer::write(valueSerializer, valueHolderForReply);
}
inline OH_OHOS_RPC_rpc_RequestResult rpc_RequestResult_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_RPC_rpc_RequestResult value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.errCode = valueDeserializer.readInt32();
    value.code = valueDeserializer.readInt32();
    value.data = static_cast<OH_OHOS_RPC_rpc_MessageSequence>(rpc_MessageSequence_serializer::read(valueDeserializer));
    value.reply = static_cast<OH_OHOS_RPC_rpc_MessageSequence>(rpc_MessageSequence_serializer::read(valueDeserializer));
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_RPC_API* GetOH_OHOS_RPC_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_RPC_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_RPC_APIKind::OH_OHOS_RPC_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_rpc_Ashmem_construct() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Ashmem()->construct();
}
KOALA_INTEROP_DIRECT_0(rpc_Ashmem_construct, OH_NativePointer)
OH_NativePointer impl_rpc_Ashmem_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Ashmem()->destruct;
}
KOALA_INTEROP_DIRECT_0(rpc_Ashmem_getFinalizer, OH_NativePointer)
OH_NativePointer impl_rpc_Ashmem_create0(const KStringPtr& name, OH_Int32 size) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Ashmem()->create0((const OH_String*) (&name), size);
}
KOALA_INTEROP_2(rpc_Ashmem_create0, OH_NativePointer, KStringPtr, OH_Int32)
OH_NativePointer impl_rpc_Ashmem_create1(OH_NativePointer ashmem) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Ashmem()->create1(static_cast<OH_OHOS_RPC_rpc_Ashmem>(ashmem));
}
KOALA_INTEROP_DIRECT_1(rpc_Ashmem_create1, OH_NativePointer, OH_NativePointer)
OH_Int32 impl_rpc_Ashmem_getAshmemSize(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Ashmem()->getAshmemSize(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_Ashmem_getAshmemSize, OH_Int32, OH_NativePointer)
void impl_rpc_Ashmem_mapReadWriteAshmem(OH_NativePointer thisPtr) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Ashmem()->mapReadWriteAshmem(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(rpc_Ashmem_mapReadWriteAshmem, OH_NativePointer)
OH_NativePointer impl_rpc_DeathRecipient_construct() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_DeathRecipient()->construct();
}
KOALA_INTEROP_DIRECT_0(rpc_DeathRecipient_construct, OH_NativePointer)
OH_NativePointer impl_rpc_DeathRecipient_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_DeathRecipient()->destruct;
}
KOALA_INTEROP_DIRECT_0(rpc_DeathRecipient_getFinalizer, OH_NativePointer)
void impl_rpc_DeathRecipient_onRemoteDied(OH_NativePointer thisPtr) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_DeathRecipient()->onRemoteDied(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(rpc_DeathRecipient_onRemoteDied, OH_NativePointer)
OH_NativePointer impl_rpc_IRemoteObject_construct() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->construct();
}
KOALA_INTEROP_DIRECT_0(rpc_IRemoteObject_construct, OH_NativePointer)
OH_NativePointer impl_rpc_IRemoteObject_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->destruct;
}
KOALA_INTEROP_DIRECT_0(rpc_IRemoteObject_getFinalizer, OH_NativePointer)
void impl_rpc_IRemoteObject_sendMessageRequest0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Int32 code, OH_NativePointer data, OH_NativePointer reply, OH_NativePointer options, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_RequestResult_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_RPC_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_RequestResult_Opt_Array_String_Void))))};;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->sendMessageRequest0(reinterpret_cast<OH_OHOS_RPC_VMContext>(vmContext), GetAsyncWorker(), thisPtr, code, static_cast<OH_OHOS_RPC_rpc_MessageSequence>(data), static_cast<OH_OHOS_RPC_rpc_MessageSequence>(reply), static_cast<OH_OHOS_RPC_rpc_MessageOption>(options), static_cast<OHOS_RPC_Callback_Opt_RequestResult_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V7(rpc_IRemoteObject_sendMessageRequest0, OH_NativePointer, OH_Int32, OH_NativePointer, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_IRemoteObject_sendMessageRequest1(OH_NativePointer thisPtr, OH_Int32 code, OH_NativePointer data, OH_NativePointer reply, OH_NativePointer options, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_RPC_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_RPC_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->sendMessageRequest1(thisPtr, code, static_cast<OH_OHOS_RPC_rpc_MessageSequence>(data), static_cast<OH_OHOS_RPC_rpc_MessageSequence>(reply), static_cast<OH_OHOS_RPC_rpc_MessageOption>(options), static_cast<OHOS_RPC_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V7(rpc_IRemoteObject_sendMessageRequest1, OH_NativePointer, OH_Int32, OH_NativePointer, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_IRemoteObject_registerDeathRecipient(OH_NativePointer thisPtr, OH_NativePointer recipient, OH_Int32 flags) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->registerDeathRecipient(thisPtr, static_cast<OH_OHOS_RPC_rpc_DeathRecipient>(recipient), flags);
}
KOALA_INTEROP_DIRECT_V3(rpc_IRemoteObject_registerDeathRecipient, OH_NativePointer, OH_NativePointer, OH_Int32)
void impl_rpc_IRemoteObject_unregisterDeathRecipient(OH_NativePointer thisPtr, OH_NativePointer recipient, OH_Int32 flags) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->unregisterDeathRecipient(thisPtr, static_cast<OH_OHOS_RPC_rpc_DeathRecipient>(recipient), flags);
}
KOALA_INTEROP_DIRECT_V3(rpc_IRemoteObject_unregisterDeathRecipient, OH_NativePointer, OH_NativePointer, OH_Int32)
OH_String impl_rpc_IRemoteObject_getDescriptor(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->getDescriptor(thisPtr);
}
KOALA_INTEROP_1(rpc_IRemoteObject_getDescriptor, KStringPtr, OH_NativePointer)
OH_Boolean impl_rpc_IRemoteObject_isObjectDead(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_IRemoteObject()->isObjectDead(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_IRemoteObject_isObjectDead, OH_Boolean, OH_NativePointer)
OH_NativePointer impl_rpc_MessageOption_construct0(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto syncFlagsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RPC_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 syncFlagsValueTempTmpBuf = {};
        syncFlagsValueTempTmpBuf.tag = syncFlagsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((syncFlagsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            syncFlagsValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 syncFlagsValueTemp = syncFlagsValueTempTmpBuf;;
        const auto waitTimeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_RPC_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 waitTimeValueTempTmpBuf = {};
        waitTimeValueTempTmpBuf.tag = waitTimeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((waitTimeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            waitTimeValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 waitTimeValueTemp = waitTimeValueTempTmpBuf;;
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->construct0(static_cast<Opt_Int32*>(&syncFlagsValueTemp), static_cast<Opt_Int32*>(&waitTimeValueTemp));
}
KOALA_INTEROP_DIRECT_2(rpc_MessageOption_construct0, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_rpc_MessageOption_construct1(OH_Boolean isAsync) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->construct1(isAsync);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageOption_construct1, OH_NativePointer, OH_Boolean)
OH_NativePointer impl_rpc_MessageOption_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->destruct;
}
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getFinalizer, OH_NativePointer)
OH_Boolean impl_rpc_MessageOption_isAsync(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->isAsync(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageOption_isAsync, OH_Boolean, OH_NativePointer)
void impl_rpc_MessageOption_setAsync(OH_NativePointer thisPtr, OH_Boolean isAsync) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->setAsync(thisPtr, isAsync);
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageOption_setAsync, OH_NativePointer, OH_Boolean)
OH_Int32 impl_rpc_MessageOption_getTF_SYNC() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->getTF_SYNC();
}
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getTF_SYNC, OH_Int32)
void impl_rpc_MessageOption_setTF_SYNC(OH_Int32 TF_SYNC) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->setTF_SYNC(TF_SYNC);
}
KOALA_INTEROP_DIRECT_V1(rpc_MessageOption_setTF_SYNC, OH_Int32)
OH_Int32 impl_rpc_MessageOption_getTF_ASYNC() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->getTF_ASYNC();
}
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getTF_ASYNC, OH_Int32)
void impl_rpc_MessageOption_setTF_ASYNC(OH_Int32 TF_ASYNC) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->setTF_ASYNC(TF_ASYNC);
}
KOALA_INTEROP_DIRECT_V1(rpc_MessageOption_setTF_ASYNC, OH_Int32)
OH_Int32 impl_rpc_MessageOption_getTF_WAIT_TIME() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->getTF_WAIT_TIME();
}
KOALA_INTEROP_DIRECT_0(rpc_MessageOption_getTF_WAIT_TIME, OH_Int32)
void impl_rpc_MessageOption_setTF_WAIT_TIME(OH_Int32 TF_WAIT_TIME) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageOption()->setTF_WAIT_TIME(TF_WAIT_TIME);
}
KOALA_INTEROP_DIRECT_V1(rpc_MessageOption_setTF_WAIT_TIME, OH_Int32)
OH_NativePointer impl_rpc_MessageSequence_construct() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->construct();
}
KOALA_INTEROP_DIRECT_0(rpc_MessageSequence_construct, OH_NativePointer)
OH_NativePointer impl_rpc_MessageSequence_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->destruct;
}
KOALA_INTEROP_DIRECT_0(rpc_MessageSequence_getFinalizer, OH_NativePointer)
OH_NativePointer impl_rpc_MessageSequence_create() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->create();
}
KOALA_INTEROP_DIRECT_0(rpc_MessageSequence_create, OH_NativePointer)
void impl_rpc_MessageSequence_reclaim(OH_NativePointer thisPtr) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->reclaim(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_reclaim, OH_NativePointer)
void impl_rpc_MessageSequence_writeRemoteObject(OH_NativePointer thisPtr, OH_NativePointer obj) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeRemoteObject(thisPtr, static_cast<OH_OHOS_RPC_rpc_IRemoteObject>(obj));
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeRemoteObject, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_rpc_MessageSequence_readRemoteObject(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readRemoteObject(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readRemoteObject, OH_NativePointer, OH_NativePointer)
void impl_rpc_MessageSequence_writeInterfaceToken(OH_NativePointer thisPtr, const KStringPtr& token) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeInterfaceToken(thisPtr, (const OH_String*) (&token));
}
KOALA_INTEROP_V2(rpc_MessageSequence_writeInterfaceToken, OH_NativePointer, KStringPtr)
OH_String impl_rpc_MessageSequence_readInterfaceToken(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readInterfaceToken(thisPtr);
}
KOALA_INTEROP_1(rpc_MessageSequence_readInterfaceToken, KStringPtr, OH_NativePointer)
OH_Int32 impl_rpc_MessageSequence_getCapacity(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->getCapacity(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_getCapacity, OH_Int32, OH_NativePointer)
void impl_rpc_MessageSequence_setCapacity(OH_NativePointer thisPtr, OH_Int32 size) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->setCapacity(thisPtr, size);
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_setCapacity, OH_NativePointer, OH_Int32)
void impl_rpc_MessageSequence_writeNoException(OH_NativePointer thisPtr) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeNoException(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_writeNoException, OH_NativePointer)
void impl_rpc_MessageSequence_readException(OH_NativePointer thisPtr) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readException(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_readException, OH_NativePointer)
void impl_rpc_MessageSequence_writeInt(OH_NativePointer thisPtr, OH_Int32 val) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeInt(thisPtr, val);
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeInt, OH_NativePointer, OH_Int32)
void impl_rpc_MessageSequence_writeLong(OH_NativePointer thisPtr, KLong val) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeLong(thisPtr, val);
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeLong, OH_NativePointer, KLong)
void impl_rpc_MessageSequence_writeBoolean(OH_NativePointer thisPtr, OH_Boolean val) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeBoolean(thisPtr, val);
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeBoolean, OH_NativePointer, OH_Boolean)
void impl_rpc_MessageSequence_writeString(OH_NativePointer thisPtr, const KStringPtr& val) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeString(thisPtr, (const OH_String*) (&val));
}
KOALA_INTEROP_V2(rpc_MessageSequence_writeString, OH_NativePointer, KStringPtr)
void impl_rpc_MessageSequence_writeParcelable(OH_NativePointer thisPtr, OH_NativePointer val) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeParcelable(thisPtr, static_cast<OH_OHOS_RPC_rpc_Parcelable>(val));
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeParcelable, OH_NativePointer, OH_NativePointer)
void impl_rpc_MessageSequence_writeByteArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 byteArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Int32 byteArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(byteArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*byteArrayValueTempTmpBuf.array)>::type>(&byteArrayValueTempTmpBuf, byteArrayValueTempTmpBufLength);
        for (int byteArrayValueTempTmpBufBufCounterI = 0; byteArrayValueTempTmpBufBufCounterI < byteArrayValueTempTmpBufLength; byteArrayValueTempTmpBufBufCounterI++) {
            byteArrayValueTempTmpBuf.array[byteArrayValueTempTmpBufBufCounterI] = thisDeserializer.readInt32();
        }
        Array_Int32 byteArrayValueTemp = byteArrayValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeByteArray(thisPtr, static_cast<Array_Int32*>(&byteArrayValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeByteArray, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_MessageSequence_writeIntArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 intArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Int32 intArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(intArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*intArrayValueTempTmpBuf.array)>::type>(&intArrayValueTempTmpBuf, intArrayValueTempTmpBufLength);
        for (int intArrayValueTempTmpBufBufCounterI = 0; intArrayValueTempTmpBufBufCounterI < intArrayValueTempTmpBufLength; intArrayValueTempTmpBufBufCounterI++) {
            intArrayValueTempTmpBuf.array[intArrayValueTempTmpBufBufCounterI] = thisDeserializer.readInt32();
        }
        Array_Int32 intArrayValueTemp = intArrayValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeIntArray(thisPtr, static_cast<Array_Int32*>(&intArrayValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeIntArray, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_MessageSequence_writeDoubleArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 doubleArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Float64 doubleArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(doubleArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*doubleArrayValueTempTmpBuf.array)>::type>(&doubleArrayValueTempTmpBuf, doubleArrayValueTempTmpBufLength);
        for (int doubleArrayValueTempTmpBufBufCounterI = 0; doubleArrayValueTempTmpBufBufCounterI < doubleArrayValueTempTmpBufLength; doubleArrayValueTempTmpBufBufCounterI++) {
            doubleArrayValueTempTmpBuf.array[doubleArrayValueTempTmpBufBufCounterI] = thisDeserializer.readFloat64();
        }
        Array_Float64 doubleArrayValueTemp = doubleArrayValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeDoubleArray(thisPtr, static_cast<Array_Float64*>(&doubleArrayValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeDoubleArray, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_MessageSequence_writeBooleanArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 booleanArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Boolean booleanArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(booleanArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*booleanArrayValueTempTmpBuf.array)>::type>(&booleanArrayValueTempTmpBuf, booleanArrayValueTempTmpBufLength);
        for (int booleanArrayValueTempTmpBufBufCounterI = 0; booleanArrayValueTempTmpBufBufCounterI < booleanArrayValueTempTmpBufLength; booleanArrayValueTempTmpBufBufCounterI++) {
            booleanArrayValueTempTmpBuf.array[booleanArrayValueTempTmpBufBufCounterI] = thisDeserializer.readBoolean();
        }
        Array_Boolean booleanArrayValueTemp = booleanArrayValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeBooleanArray(thisPtr, static_cast<Array_Boolean*>(&booleanArrayValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeBooleanArray, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_MessageSequence_writeStringArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 stringArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String stringArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(stringArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*stringArrayValueTempTmpBuf.array)>::type>(&stringArrayValueTempTmpBuf, stringArrayValueTempTmpBufLength);
        for (int stringArrayValueTempTmpBufBufCounterI = 0; stringArrayValueTempTmpBufBufCounterI < stringArrayValueTempTmpBufLength; stringArrayValueTempTmpBufBufCounterI++) {
            stringArrayValueTempTmpBuf.array[stringArrayValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String stringArrayValueTemp = stringArrayValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeStringArray(thisPtr, static_cast<Array_String*>(&stringArrayValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeStringArray, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_MessageSequence_writeParcelableArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 parcelableArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_rpc_Parcelable parcelableArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(parcelableArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*parcelableArrayValueTempTmpBuf.array)>::type>(&parcelableArrayValueTempTmpBuf, parcelableArrayValueTempTmpBufLength);
        for (int parcelableArrayValueTempTmpBufBufCounterI = 0; parcelableArrayValueTempTmpBufBufCounterI < parcelableArrayValueTempTmpBufLength; parcelableArrayValueTempTmpBufBufCounterI++) {
            parcelableArrayValueTempTmpBuf.array[parcelableArrayValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RPC_rpc_Parcelable>(rpc_Parcelable_serializer::read(thisDeserializer));
        }
        Array_rpc_Parcelable parcelableArrayValueTemp = parcelableArrayValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeParcelableArray(thisPtr, static_cast<Array_rpc_Parcelable*>(&parcelableArrayValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_writeParcelableArray, OH_NativePointer, KSerializerBuffer, int32_t)
OH_Int32 impl_rpc_MessageSequence_readInt(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readInt(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readInt, OH_Int32, OH_NativePointer)
OH_Int32 impl_rpc_MessageSequence_readLong(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readLong(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readLong, OH_Int32, OH_NativePointer)
OH_Boolean impl_rpc_MessageSequence_readBoolean(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readBoolean(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readBoolean, OH_Boolean, OH_NativePointer)
OH_String impl_rpc_MessageSequence_readString(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readString(thisPtr);
}
KOALA_INTEROP_1(rpc_MessageSequence_readString, KStringPtr, OH_NativePointer)
void impl_rpc_MessageSequence_readParcelable(OH_NativePointer thisPtr, OH_NativePointer dataIn) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readParcelable(thisPtr, static_cast<OH_OHOS_RPC_rpc_Parcelable>(dataIn));
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_readParcelable, OH_NativePointer, OH_NativePointer)
void impl_rpc_MessageSequence_readIntArray0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 dataInValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Int32 dataInValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(dataInValueTempTmpBuf)>::type,
        std::decay<decltype(*dataInValueTempTmpBuf.array)>::type>(&dataInValueTempTmpBuf, dataInValueTempTmpBufLength);
        for (int dataInValueTempTmpBufBufCounterI = 0; dataInValueTempTmpBufBufCounterI < dataInValueTempTmpBufLength; dataInValueTempTmpBufBufCounterI++) {
            dataInValueTempTmpBuf.array[dataInValueTempTmpBufBufCounterI] = thisDeserializer.readInt32();
        }
        Array_Int32 dataInValueTemp = dataInValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readIntArray0(thisPtr, static_cast<Array_Int32*>(&dataInValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readIntArray0, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_rpc_MessageSequence_readIntArray1(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readIntArray1(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_Int32 retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeInt32(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(rpc_MessageSequence_readIntArray1, KInteropReturnBuffer, OH_NativePointer)
void impl_rpc_MessageSequence_readDoubleArray0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 dataInValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Float64 dataInValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(dataInValueTempTmpBuf)>::type,
        std::decay<decltype(*dataInValueTempTmpBuf.array)>::type>(&dataInValueTempTmpBuf, dataInValueTempTmpBufLength);
        for (int dataInValueTempTmpBufBufCounterI = 0; dataInValueTempTmpBufBufCounterI < dataInValueTempTmpBufLength; dataInValueTempTmpBufBufCounterI++) {
            dataInValueTempTmpBuf.array[dataInValueTempTmpBufBufCounterI] = thisDeserializer.readFloat64();
        }
        Array_Float64 dataInValueTemp = dataInValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readDoubleArray0(thisPtr, static_cast<Array_Float64*>(&dataInValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readDoubleArray0, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_rpc_MessageSequence_readDoubleArray1(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readDoubleArray1(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_Float64 retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeFloat64(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(rpc_MessageSequence_readDoubleArray1, KInteropReturnBuffer, OH_NativePointer)
void impl_rpc_MessageSequence_readBooleanArray0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 dataInValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Boolean dataInValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(dataInValueTempTmpBuf)>::type,
        std::decay<decltype(*dataInValueTempTmpBuf.array)>::type>(&dataInValueTempTmpBuf, dataInValueTempTmpBufLength);
        for (int dataInValueTempTmpBufBufCounterI = 0; dataInValueTempTmpBufBufCounterI < dataInValueTempTmpBufLength; dataInValueTempTmpBufBufCounterI++) {
            dataInValueTempTmpBuf.array[dataInValueTempTmpBufBufCounterI] = thisDeserializer.readBoolean();
        }
        Array_Boolean dataInValueTemp = dataInValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readBooleanArray0(thisPtr, static_cast<Array_Boolean*>(&dataInValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readBooleanArray0, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_rpc_MessageSequence_readBooleanArray1(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readBooleanArray1(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_Boolean retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeBoolean(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(rpc_MessageSequence_readBooleanArray1, KInteropReturnBuffer, OH_NativePointer)
void impl_rpc_MessageSequence_readStringArray0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 dataInValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String dataInValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(dataInValueTempTmpBuf)>::type,
        std::decay<decltype(*dataInValueTempTmpBuf.array)>::type>(&dataInValueTempTmpBuf, dataInValueTempTmpBufLength);
        for (int dataInValueTempTmpBufBufCounterI = 0; dataInValueTempTmpBufBufCounterI < dataInValueTempTmpBufLength; dataInValueTempTmpBufBufCounterI++) {
            dataInValueTempTmpBuf.array[dataInValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String dataInValueTemp = dataInValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readStringArray0(thisPtr, static_cast<Array_String*>(&dataInValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readStringArray0, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_rpc_MessageSequence_readStringArray1(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readStringArray1(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_String retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeString(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(rpc_MessageSequence_readStringArray1, KInteropReturnBuffer, OH_NativePointer)
void impl_rpc_MessageSequence_readParcelableArray(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 parcelableArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_rpc_Parcelable parcelableArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(parcelableArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*parcelableArrayValueTempTmpBuf.array)>::type>(&parcelableArrayValueTempTmpBuf, parcelableArrayValueTempTmpBufLength);
        for (int parcelableArrayValueTempTmpBufBufCounterI = 0; parcelableArrayValueTempTmpBufBufCounterI < parcelableArrayValueTempTmpBufLength; parcelableArrayValueTempTmpBufBufCounterI++) {
            parcelableArrayValueTempTmpBuf.array[parcelableArrayValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_RPC_rpc_Parcelable>(rpc_Parcelable_serializer::read(thisDeserializer));
        }
        Array_rpc_Parcelable parcelableArrayValueTemp = parcelableArrayValueTempTmpBuf;;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readParcelableArray(thisPtr, static_cast<Array_rpc_Parcelable*>(&parcelableArrayValueTemp));
}
KOALA_INTEROP_DIRECT_V3(rpc_MessageSequence_readParcelableArray, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_rpc_MessageSequence_closeFileDescriptor(OH_Int32 fd) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->closeFileDescriptor(fd);
}
KOALA_INTEROP_DIRECT_V1(rpc_MessageSequence_closeFileDescriptor, OH_Int32)
void impl_rpc_MessageSequence_writeFileDescriptor(OH_NativePointer thisPtr, OH_Int32 fd) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeFileDescriptor(thisPtr, fd);
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeFileDescriptor, OH_NativePointer, OH_Int32)
OH_Int32 impl_rpc_MessageSequence_readFileDescriptor(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readFileDescriptor(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readFileDescriptor, OH_Int32, OH_NativePointer)
void impl_rpc_MessageSequence_writeAshmem(OH_NativePointer thisPtr, OH_NativePointer ashmem) {
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeAshmem(thisPtr, static_cast<OH_OHOS_RPC_rpc_Ashmem>(ashmem));
}
KOALA_INTEROP_DIRECT_V2(rpc_MessageSequence_writeAshmem, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_rpc_MessageSequence_readAshmem(OH_NativePointer thisPtr) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readAshmem(thisPtr);
}
KOALA_INTEROP_DIRECT_1(rpc_MessageSequence_readAshmem, OH_NativePointer, OH_NativePointer)
void impl_rpc_MessageSequence_writeRawDataBuffer(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 size) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer rawDataValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->writeRawDataBuffer(thisPtr, static_cast<OH_Buffer*>(&rawDataValueTemp), size);
}
KOALA_INTEROP_DIRECT_V4(rpc_MessageSequence_writeRawDataBuffer, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
KInteropReturnBuffer impl_rpc_MessageSequence_readRawDataBuffer(OH_NativePointer thisPtr, OH_Int32 size) {
        const auto &retValue = GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_MessageSequence()->readRawDataBuffer(thisPtr, size);
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(rpc_MessageSequence_readRawDataBuffer, KInteropReturnBuffer, OH_NativePointer, OH_Int32)
OH_NativePointer impl_rpc_Parcelable_construct() {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Parcelable()->construct();
}
KOALA_INTEROP_DIRECT_0(rpc_Parcelable_construct, OH_NativePointer)
OH_NativePointer impl_rpc_Parcelable_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Parcelable()->destruct;
}
KOALA_INTEROP_DIRECT_0(rpc_Parcelable_getFinalizer, OH_NativePointer)
OH_Boolean impl_rpc_Parcelable_marshalling(OH_NativePointer thisPtr, OH_NativePointer dataOut) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Parcelable()->marshalling(thisPtr, static_cast<OH_OHOS_RPC_rpc_MessageSequence>(dataOut));
}
KOALA_INTEROP_DIRECT_2(rpc_Parcelable_marshalling, OH_Boolean, OH_NativePointer, OH_NativePointer)
OH_Boolean impl_rpc_Parcelable_unmarshalling(OH_NativePointer thisPtr, OH_NativePointer dataIn) {
        return GetOH_OHOS_RPC_API(OHOS_RPC_API_VERSION)->Rpc_Parcelable()->unmarshalling(thisPtr, static_cast<OH_OHOS_RPC_rpc_MessageSequence>(dataIn));
}
KOALA_INTEROP_DIRECT_2(rpc_Parcelable_unmarshalling, OH_Boolean, OH_NativePointer, OH_NativePointer)
void deserializeAndCallCallback_Opt_RequestResult_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_RequestResult_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RPC_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RPC_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_RequestResult_Opt_Array_String_Void(OH_OHOS_RPC_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RPC_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_RequestResult_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_RPC_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_RPC_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Void(OH_OHOS_RPC_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_RPC_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_Opt_RequestResult_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_RequestResult_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_RPC_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_Opt_RequestResult_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_RequestResult_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_Opt_RequestResult_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RPC_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_RequestResult_Opt_Array_String_Void);
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
void callManagedCallback_Opt_RequestResult_Opt_Array_String_VoidSync(OH_OHOS_RPC_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_RequestResult_Opt_Array_String_Void);
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
void callManagedCallback_Void(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_RPC_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_RPC_VMContext vmContext, OH_Int32 resourceId)
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
        case Kind_Callback_Opt_RequestResult_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_RequestResult_Opt_Array_String_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Opt_RequestResult_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_RequestResult_Opt_Array_String_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}