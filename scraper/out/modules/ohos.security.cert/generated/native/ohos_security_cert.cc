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

#include "ohos_security_cert.h"

#define KOALA_INTEROP_MODULE OHOS_SECURITY_CERTNativeModule
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
    Kind_Callback_Opt_Array_String_Void = -543655128,
    Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void = -796663741,
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Array_Boolean& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Array_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Array_Buffer& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_Buffer* value);

template <>
inline void WriteToString(std::string* result, const Array_Buffer* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_Buffer, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_Buffer*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_Buffer* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Array_Buffer& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Array_cert_GeneralName& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_GeneralName* value);

template <>
inline void WriteToString(std::string* result, const Array_cert_GeneralName* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_SECURITY_CERT_cert_GeneralName, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_SECURITY_CERT_cert_GeneralName*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_cert_GeneralName* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Array_cert_GeneralName& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_Buffer& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Buffer& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_CertExtension& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_CertExtension value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_CertExtension* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_CertExtension& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_CertItemType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_CertItemType value) {
    result->append("OH_OHOS_SECURITY_CERT_cert_CertItemType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_CertItemType* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_CertItemType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_DataArray& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_DataArray* value) {
    result->append("{");
    // Array_Buffer data
    result->append(".data=");
    WriteToString(result, &value->data);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_DataArray* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_DataArray& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_DataBlob& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_DataBlob* value) {
    result->append("{");
    // OH_Buffer data
    result->append(".data=");
    WriteToString(result, value->data);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_DataBlob* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_DataBlob& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_EncodingFormat& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_EncodingFormat value) {
    result->append("OH_OHOS_SECURITY_CERT_cert_EncodingFormat(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_EncodingFormat* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_EncodingFormat& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_EncodingType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_EncodingType value) {
    result->append("OH_OHOS_SECURITY_CERT_cert_EncodingType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_EncodingType* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_EncodingType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType value) {
    result->append("OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_ExtensionEntryType* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_ExtensionEntryType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_ExtensionOidType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_ExtensionOidType value) {
    result->append("OH_OHOS_SECURITY_CERT_cert_ExtensionOidType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_ExtensionOidType* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_ExtensionOidType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_GeneralNameType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_GeneralNameType value) {
    result->append("OH_OHOS_SECURITY_CERT_cert_GeneralNameType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_GeneralNameType* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_GeneralNameType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_X500DistinguishedName* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_X500DistinguishedName& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_X509Cert& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_X509Cert value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_X509Cert& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OHOS_SECURITY_CERT_AsyncCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_SECURITY_CERT_AsyncCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_SECURITY_CERT_AsyncCallback* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_OHOS_SECURITY_CERT_AsyncCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OHOS_SECURITY_CERT_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_SECURITY_CERT_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_SECURITY_CERT_Callback_Void* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_OHOS_SECURITY_CERT_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_BusinessError& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_BusinessError value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_BusinessError& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_EncodingBlob& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_EncodingBlob* value) {
    result->append("{");
    // OH_Buffer data
    result->append(".data=");
    WriteToString(result, value->data);
    // OH_OHOS_SECURITY_CERT_cert_EncodingFormat encodingFormat
    result->append(", ");
    result->append(".encodingFormat=");
    WriteToString(result, value->encodingFormat);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_EncodingBlob* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_EncodingBlob& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_GeneralName& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_GeneralName* value) {
    result->append("{");
    // OH_OHOS_SECURITY_CERT_cert_GeneralNameType type
    result->append(".type=");
    WriteToString(result, value->type);
    // OH_Buffer name
    result->append(", ");
    result->append(".name=");
    WriteToString(result, &value->name);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_GeneralName* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_GeneralName& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters* value) {
    result->append("{");
    // Array_cert_GeneralName subjectAlternativeNames
    result->append(".subjectAlternativeNames=");
    WriteToString(result, &value->subjectAlternativeNames);
    // OH_Boolean matchAllSubjectAltNames
    result->append(", ");
    result->append(".matchAllSubjectAltNames=");
    WriteToString(result, &value->matchAllSubjectAltNames);
    // OH_Buffer authorityKeyIdentifier
    result->append(", ");
    result->append(".authorityKeyIdentifier=");
    WriteToString(result, &value->authorityKeyIdentifier);
    // OH_Int32 minPathLenConstraint
    result->append(", ");
    result->append(".minPathLenConstraint=");
    WriteToString(result, &value->minPathLenConstraint);
    // OH_OHOS_SECURITY_CERT_cert_X509Cert x509Cert
    result->append(", ");
    result->append(".x509Cert=");
    WriteToString(result, &value->x509Cert);
    // OH_String validDate
    result->append(", ");
    result->append(".validDate=");
    WriteToString(result, &value->validDate);
    // OH_Buffer issuer
    result->append(", ");
    result->append(".issuer=");
    WriteToString(result, &value->issuer);
    // Array_String extendedKeyUsage
    result->append(", ");
    result->append(".extendedKeyUsage=");
    WriteToString(result, &value->extendedKeyUsage);
    // OH_Buffer nameConstraints
    result->append(", ");
    result->append(".nameConstraints=");
    WriteToString(result, &value->nameConstraints);
    // Array_String certPolicy
    result->append(", ");
    result->append(".certPolicy=");
    WriteToString(result, &value->certPolicy);
    // OH_String privateKeyValid
    result->append(", ");
    result->append(".privateKeyValid=");
    WriteToString(result, &value->privateKeyValid);
    // Array_Boolean keyUsage
    result->append(", ");
    result->append(".keyUsage=");
    WriteToString(result, &value->keyUsage);
    // OH_Int64 serialNumber
    result->append(", ");
    result->append(".serialNumber=");
    WriteToString(result, &value->serialNumber);
    // OH_Buffer subject
    result->append(", ");
    result->append(".subject=");
    WriteToString(result, &value->subject);
    // OH_Buffer subjectKeyIdentifier
    result->append(", ");
    result->append(".subjectKeyIdentifier=");
    WriteToString(result, &value->subjectKeyIdentifier);
    // OH_OHOS_SECURITY_CERT_cert_DataBlob publicKey
    result->append(", ");
    result->append(".publicKey=");
    WriteToString(result, &value->publicKey);
    // OH_String publicKeyAlgID
    result->append(", ");
    result->append(".publicKeyAlgID=");
    WriteToString(result, &value->publicKeyAlgID);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_cert_X509CertMatchParameters* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cert_X509CertMatchParameters& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_cryptoFramework_PubKey* value) {
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_cryptoFramework_PubKey& value)
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
inline OH_OHOS_SECURITY_CERT_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class cert_CertExtension_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_CertExtension value);
    static OH_OHOS_SECURITY_CERT_cert_CertExtension read(DeserializerBase& buffer);
};
class cert_DataArray_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_DataArray value);
    static OH_OHOS_SECURITY_CERT_cert_DataArray read(DeserializerBase& buffer);
};
class cert_DataBlob_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_DataBlob value);
    static OH_OHOS_SECURITY_CERT_cert_DataBlob read(DeserializerBase& buffer);
};
class cert_X500DistinguishedName_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName value);
    static OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName read(DeserializerBase& buffer);
};
class cert_X509Cert_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_X509Cert value);
    static OH_OHOS_SECURITY_CERT_cert_X509Cert read(DeserializerBase& buffer);
};
class cert_EncodingBlob_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_EncodingBlob value);
    static OH_OHOS_SECURITY_CERT_cert_EncodingBlob read(DeserializerBase& buffer);
};
class cert_GeneralName_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_GeneralName value);
    static OH_OHOS_SECURITY_CERT_cert_GeneralName read(DeserializerBase& buffer);
};
class cert_X509CertMatchParameters_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters value);
    static OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters read(DeserializerBase& buffer);
};
class cryptoFramework_PubKey_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey value);
    static OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey read(DeserializerBase& buffer);
};
inline void cert_CertExtension_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_CertExtension value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_SECURITY_CERT_cert_CertExtension cert_CertExtension_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_SECURITY_CERT_cert_CertExtension>(ptr);
}
inline void cert_DataArray_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_DataArray value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForData = value.data;
    valueSerializer.writeInt32(valueHolderForData.length);
    for (int valueHolderForDataCounterI = 0; valueHolderForDataCounterI < valueHolderForData.length; valueHolderForDataCounterI++) {
        const OH_Buffer valueHolderForDataTmpElement = valueHolderForData.array[valueHolderForDataCounterI];
        valueSerializer.writeBuffer(valueHolderForDataTmpElement);
    }
}
inline OH_OHOS_SECURITY_CERT_cert_DataArray cert_DataArray_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_SECURITY_CERT_cert_DataArray value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int32 dataTmpBufLength = valueDeserializer.readInt32();
    Array_Buffer dataTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(dataTmpBuf)>::type,
        std::decay<decltype(*dataTmpBuf.array)>::type>(&dataTmpBuf, dataTmpBufLength);
    for (int dataTmpBufBufCounterI = 0; dataTmpBufBufCounterI < dataTmpBufLength; dataTmpBufBufCounterI++) {
        dataTmpBuf.array[dataTmpBufBufCounterI] = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    }
    value.data = dataTmpBuf;
    return value;
}
inline void cert_DataBlob_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_DataBlob value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForData = value.data;
    valueSerializer.writeBuffer(valueHolderForData);
}
inline OH_OHOS_SECURITY_CERT_cert_DataBlob cert_DataBlob_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_SECURITY_CERT_cert_DataBlob value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.data = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    return value;
}
inline void cert_X500DistinguishedName_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName cert_X500DistinguishedName_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName>(ptr);
}
inline void cert_X509Cert_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_X509Cert value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_SECURITY_CERT_cert_X509Cert cert_X509Cert_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_SECURITY_CERT_cert_X509Cert>(ptr);
}
inline void cert_EncodingBlob_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_EncodingBlob value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForData = value.data;
    valueSerializer.writeBuffer(valueHolderForData);
    const auto valueHolderForEncodingFormat = value.encodingFormat;
    valueSerializer.writeInt32(static_cast<OH_OHOS_SECURITY_CERT_cert_EncodingFormat>(valueHolderForEncodingFormat));
}
inline OH_OHOS_SECURITY_CERT_cert_EncodingBlob cert_EncodingBlob_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_SECURITY_CERT_cert_EncodingBlob value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.data = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    value.encodingFormat = static_cast<OH_OHOS_SECURITY_CERT_cert_EncodingFormat>(valueDeserializer.readInt32());
    return value;
}
inline void cert_GeneralName_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_GeneralName value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForType = value.type;
    valueSerializer.writeInt32(static_cast<OH_OHOS_SECURITY_CERT_cert_GeneralNameType>(valueHolderForType));
    const auto valueHolderForName = value.name;
    if (runtimeType(valueHolderForName) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForNameTmpValue = valueHolderForName.value;
        valueSerializer.writeBuffer(valueHolderForNameTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_SECURITY_CERT_cert_GeneralName cert_GeneralName_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_SECURITY_CERT_cert_GeneralName value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.type = static_cast<OH_OHOS_SECURITY_CERT_cert_GeneralNameType>(valueDeserializer.readInt32());
    const auto nameTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Buffer nameTmpBuf = {};
    nameTmpBuf.tag = nameTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nameTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nameTmpBuf.value = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    }
    value.name = nameTmpBuf;
    return value;
}
inline void cert_X509CertMatchParameters_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForSubjectAlternativeNames = value.subjectAlternativeNames;
    if (runtimeType(valueHolderForSubjectAlternativeNames) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForSubjectAlternativeNamesTmpValue = valueHolderForSubjectAlternativeNames.value;
        valueSerializer.writeInt32(valueHolderForSubjectAlternativeNamesTmpValue.length);
        for (int valueHolderForSubjectAlternativeNamesTmpValueCounterI = 0; valueHolderForSubjectAlternativeNamesTmpValueCounterI < valueHolderForSubjectAlternativeNamesTmpValue.length; valueHolderForSubjectAlternativeNamesTmpValueCounterI++) {
            const OH_OHOS_SECURITY_CERT_cert_GeneralName valueHolderForSubjectAlternativeNamesTmpValueTmpElement = valueHolderForSubjectAlternativeNamesTmpValue.array[valueHolderForSubjectAlternativeNamesTmpValueCounterI];
            cert_GeneralName_serializer::write(valueSerializer, valueHolderForSubjectAlternativeNamesTmpValueTmpElement);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMatchAllSubjectAltNames = value.matchAllSubjectAltNames;
    if (runtimeType(valueHolderForMatchAllSubjectAltNames) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMatchAllSubjectAltNamesTmpValue = valueHolderForMatchAllSubjectAltNames.value;
        valueSerializer.writeBoolean(valueHolderForMatchAllSubjectAltNamesTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAuthorityKeyIdentifier = value.authorityKeyIdentifier;
    if (runtimeType(valueHolderForAuthorityKeyIdentifier) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAuthorityKeyIdentifierTmpValue = valueHolderForAuthorityKeyIdentifier.value;
        valueSerializer.writeBuffer(valueHolderForAuthorityKeyIdentifierTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMinPathLenConstraint = value.minPathLenConstraint;
    if (runtimeType(valueHolderForMinPathLenConstraint) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMinPathLenConstraintTmpValue = valueHolderForMinPathLenConstraint.value;
        valueSerializer.writeInt32(valueHolderForMinPathLenConstraintTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForX509Cert = value.x509Cert;
    if (runtimeType(valueHolderForX509Cert) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForX509CertTmpValue = valueHolderForX509Cert.value;
        cert_X509Cert_serializer::write(valueSerializer, valueHolderForX509CertTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForValidDate = value.validDate;
    if (runtimeType(valueHolderForValidDate) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForValidDateTmpValue = valueHolderForValidDate.value;
        valueSerializer.writeString(valueHolderForValidDateTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIssuer = value.issuer;
    if (runtimeType(valueHolderForIssuer) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIssuerTmpValue = valueHolderForIssuer.value;
        valueSerializer.writeBuffer(valueHolderForIssuerTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForExtendedKeyUsage = value.extendedKeyUsage;
    if (runtimeType(valueHolderForExtendedKeyUsage) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForExtendedKeyUsageTmpValue = valueHolderForExtendedKeyUsage.value;
        valueSerializer.writeInt32(valueHolderForExtendedKeyUsageTmpValue.length);
        for (int valueHolderForExtendedKeyUsageTmpValueCounterI = 0; valueHolderForExtendedKeyUsageTmpValueCounterI < valueHolderForExtendedKeyUsageTmpValue.length; valueHolderForExtendedKeyUsageTmpValueCounterI++) {
            const OH_String valueHolderForExtendedKeyUsageTmpValueTmpElement = valueHolderForExtendedKeyUsageTmpValue.array[valueHolderForExtendedKeyUsageTmpValueCounterI];
            valueSerializer.writeString(valueHolderForExtendedKeyUsageTmpValueTmpElement);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForNameConstraints = value.nameConstraints;
    if (runtimeType(valueHolderForNameConstraints) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForNameConstraintsTmpValue = valueHolderForNameConstraints.value;
        valueSerializer.writeBuffer(valueHolderForNameConstraintsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCertPolicy = value.certPolicy;
    if (runtimeType(valueHolderForCertPolicy) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCertPolicyTmpValue = valueHolderForCertPolicy.value;
        valueSerializer.writeInt32(valueHolderForCertPolicyTmpValue.length);
        for (int valueHolderForCertPolicyTmpValueCounterI = 0; valueHolderForCertPolicyTmpValueCounterI < valueHolderForCertPolicyTmpValue.length; valueHolderForCertPolicyTmpValueCounterI++) {
            const OH_String valueHolderForCertPolicyTmpValueTmpElement = valueHolderForCertPolicyTmpValue.array[valueHolderForCertPolicyTmpValueCounterI];
            valueSerializer.writeString(valueHolderForCertPolicyTmpValueTmpElement);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPrivateKeyValid = value.privateKeyValid;
    if (runtimeType(valueHolderForPrivateKeyValid) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPrivateKeyValidTmpValue = valueHolderForPrivateKeyValid.value;
        valueSerializer.writeString(valueHolderForPrivateKeyValidTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForKeyUsage = value.keyUsage;
    if (runtimeType(valueHolderForKeyUsage) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForKeyUsageTmpValue = valueHolderForKeyUsage.value;
        valueSerializer.writeInt32(valueHolderForKeyUsageTmpValue.length);
        for (int valueHolderForKeyUsageTmpValueCounterI = 0; valueHolderForKeyUsageTmpValueCounterI < valueHolderForKeyUsageTmpValue.length; valueHolderForKeyUsageTmpValueCounterI++) {
            const OH_Boolean valueHolderForKeyUsageTmpValueTmpElement = valueHolderForKeyUsageTmpValue.array[valueHolderForKeyUsageTmpValueCounterI];
            valueSerializer.writeBoolean(valueHolderForKeyUsageTmpValueTmpElement);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForSerialNumber = value.serialNumber;
    if (runtimeType(valueHolderForSerialNumber) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForSerialNumberTmpValue = valueHolderForSerialNumber.value;
        valueSerializer.writeInt64(valueHolderForSerialNumberTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForSubject = value.subject;
    if (runtimeType(valueHolderForSubject) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForSubjectTmpValue = valueHolderForSubject.value;
        valueSerializer.writeBuffer(valueHolderForSubjectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForSubjectKeyIdentifier = value.subjectKeyIdentifier;
    if (runtimeType(valueHolderForSubjectKeyIdentifier) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForSubjectKeyIdentifierTmpValue = valueHolderForSubjectKeyIdentifier.value;
        valueSerializer.writeBuffer(valueHolderForSubjectKeyIdentifierTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPublicKey = value.publicKey;
    if (runtimeType(valueHolderForPublicKey) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPublicKeyTmpValue = valueHolderForPublicKey.value;
        cert_DataBlob_serializer::write(valueSerializer, valueHolderForPublicKeyTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPublicKeyAlgID = value.publicKeyAlgID;
    if (runtimeType(valueHolderForPublicKeyAlgID) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPublicKeyAlgIDTmpValue = valueHolderForPublicKeyAlgID.value;
        valueSerializer.writeString(valueHolderForPublicKeyAlgIDTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters cert_X509CertMatchParameters_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto subjectAlternativeNamesTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Array_cert_GeneralName subjectAlternativeNamesTmpBuf = {};
    subjectAlternativeNamesTmpBuf.tag = subjectAlternativeNamesTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((subjectAlternativeNamesTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 subjectAlternativeNamesTmpBuf_Length = valueDeserializer.readInt32();
        Array_cert_GeneralName subjectAlternativeNamesTmpBuf_ = {};
        valueDeserializer.resizeArray<std::decay<decltype(subjectAlternativeNamesTmpBuf_)>::type,
        std::decay<decltype(*subjectAlternativeNamesTmpBuf_.array)>::type>(&subjectAlternativeNamesTmpBuf_, subjectAlternativeNamesTmpBuf_Length);
        for (int subjectAlternativeNamesTmpBuf_BufCounterI = 0; subjectAlternativeNamesTmpBuf_BufCounterI < subjectAlternativeNamesTmpBuf_Length; subjectAlternativeNamesTmpBuf_BufCounterI++) {
            subjectAlternativeNamesTmpBuf_.array[subjectAlternativeNamesTmpBuf_BufCounterI] = cert_GeneralName_serializer::read(valueDeserializer);
        }
        subjectAlternativeNamesTmpBuf.value = subjectAlternativeNamesTmpBuf_;
    }
    value.subjectAlternativeNames = subjectAlternativeNamesTmpBuf;
    const auto matchAllSubjectAltNamesTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean matchAllSubjectAltNamesTmpBuf = {};
    matchAllSubjectAltNamesTmpBuf.tag = matchAllSubjectAltNamesTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((matchAllSubjectAltNamesTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        matchAllSubjectAltNamesTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.matchAllSubjectAltNames = matchAllSubjectAltNamesTmpBuf;
    const auto authorityKeyIdentifierTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Buffer authorityKeyIdentifierTmpBuf = {};
    authorityKeyIdentifierTmpBuf.tag = authorityKeyIdentifierTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((authorityKeyIdentifierTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        authorityKeyIdentifierTmpBuf.value = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    }
    value.authorityKeyIdentifier = authorityKeyIdentifierTmpBuf;
    const auto minPathLenConstraintTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Int32 minPathLenConstraintTmpBuf = {};
    minPathLenConstraintTmpBuf.tag = minPathLenConstraintTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((minPathLenConstraintTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        minPathLenConstraintTmpBuf.value = valueDeserializer.readInt32();
    }
    value.minPathLenConstraint = minPathLenConstraintTmpBuf;
    const auto x509CertTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_cert_X509Cert x509CertTmpBuf = {};
    x509CertTmpBuf.tag = x509CertTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((x509CertTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        x509CertTmpBuf.value = static_cast<OH_OHOS_SECURITY_CERT_cert_X509Cert>(cert_X509Cert_serializer::read(valueDeserializer));
    }
    value.x509Cert = x509CertTmpBuf;
    const auto validDateTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_String validDateTmpBuf = {};
    validDateTmpBuf.tag = validDateTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((validDateTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        validDateTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.validDate = validDateTmpBuf;
    const auto issuerTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Buffer issuerTmpBuf = {};
    issuerTmpBuf.tag = issuerTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((issuerTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        issuerTmpBuf.value = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    }
    value.issuer = issuerTmpBuf;
    const auto extendedKeyUsageTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Array_String extendedKeyUsageTmpBuf = {};
    extendedKeyUsageTmpBuf.tag = extendedKeyUsageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((extendedKeyUsageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 extendedKeyUsageTmpBuf_Length = valueDeserializer.readInt32();
        Array_String extendedKeyUsageTmpBuf_ = {};
        valueDeserializer.resizeArray<std::decay<decltype(extendedKeyUsageTmpBuf_)>::type,
        std::decay<decltype(*extendedKeyUsageTmpBuf_.array)>::type>(&extendedKeyUsageTmpBuf_, extendedKeyUsageTmpBuf_Length);
        for (int extendedKeyUsageTmpBuf_BufCounterI = 0; extendedKeyUsageTmpBuf_BufCounterI < extendedKeyUsageTmpBuf_Length; extendedKeyUsageTmpBuf_BufCounterI++) {
            extendedKeyUsageTmpBuf_.array[extendedKeyUsageTmpBuf_BufCounterI] = static_cast<OH_String>(valueDeserializer.readString());
        }
        extendedKeyUsageTmpBuf.value = extendedKeyUsageTmpBuf_;
    }
    value.extendedKeyUsage = extendedKeyUsageTmpBuf;
    const auto nameConstraintsTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Buffer nameConstraintsTmpBuf = {};
    nameConstraintsTmpBuf.tag = nameConstraintsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nameConstraintsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nameConstraintsTmpBuf.value = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    }
    value.nameConstraints = nameConstraintsTmpBuf;
    const auto certPolicyTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Array_String certPolicyTmpBuf = {};
    certPolicyTmpBuf.tag = certPolicyTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((certPolicyTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 certPolicyTmpBuf_Length = valueDeserializer.readInt32();
        Array_String certPolicyTmpBuf_ = {};
        valueDeserializer.resizeArray<std::decay<decltype(certPolicyTmpBuf_)>::type,
        std::decay<decltype(*certPolicyTmpBuf_.array)>::type>(&certPolicyTmpBuf_, certPolicyTmpBuf_Length);
        for (int certPolicyTmpBuf_BufCounterI = 0; certPolicyTmpBuf_BufCounterI < certPolicyTmpBuf_Length; certPolicyTmpBuf_BufCounterI++) {
            certPolicyTmpBuf_.array[certPolicyTmpBuf_BufCounterI] = static_cast<OH_String>(valueDeserializer.readString());
        }
        certPolicyTmpBuf.value = certPolicyTmpBuf_;
    }
    value.certPolicy = certPolicyTmpBuf;
    const auto privateKeyValidTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_String privateKeyValidTmpBuf = {};
    privateKeyValidTmpBuf.tag = privateKeyValidTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((privateKeyValidTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        privateKeyValidTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.privateKeyValid = privateKeyValidTmpBuf;
    const auto keyUsageTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Array_Boolean keyUsageTmpBuf = {};
    keyUsageTmpBuf.tag = keyUsageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyUsageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 keyUsageTmpBuf_Length = valueDeserializer.readInt32();
        Array_Boolean keyUsageTmpBuf_ = {};
        valueDeserializer.resizeArray<std::decay<decltype(keyUsageTmpBuf_)>::type,
        std::decay<decltype(*keyUsageTmpBuf_.array)>::type>(&keyUsageTmpBuf_, keyUsageTmpBuf_Length);
        for (int keyUsageTmpBuf_BufCounterI = 0; keyUsageTmpBuf_BufCounterI < keyUsageTmpBuf_Length; keyUsageTmpBuf_BufCounterI++) {
            keyUsageTmpBuf_.array[keyUsageTmpBuf_BufCounterI] = valueDeserializer.readBoolean();
        }
        keyUsageTmpBuf.value = keyUsageTmpBuf_;
    }
    value.keyUsage = keyUsageTmpBuf;
    const auto serialNumberTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Int64 serialNumberTmpBuf = {};
    serialNumberTmpBuf.tag = serialNumberTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((serialNumberTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        serialNumberTmpBuf.value = static_cast<OH_Int64>(valueDeserializer.readInt64());
    }
    value.serialNumber = serialNumberTmpBuf;
    const auto subjectTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Buffer subjectTmpBuf = {};
    subjectTmpBuf.tag = subjectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((subjectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        subjectTmpBuf.value = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    }
    value.subject = subjectTmpBuf;
    const auto subjectKeyIdentifierTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Buffer subjectKeyIdentifierTmpBuf = {};
    subjectKeyIdentifierTmpBuf.tag = subjectKeyIdentifierTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((subjectKeyIdentifierTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        subjectKeyIdentifierTmpBuf.value = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    }
    value.subjectKeyIdentifier = subjectKeyIdentifierTmpBuf;
    const auto publicKeyTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_cert_DataBlob publicKeyTmpBuf = {};
    publicKeyTmpBuf.tag = publicKeyTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((publicKeyTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        publicKeyTmpBuf.value = cert_DataBlob_serializer::read(valueDeserializer);
    }
    value.publicKey = publicKeyTmpBuf;
    const auto publicKeyAlgIDTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(valueDeserializer.readInt8());
    Opt_String publicKeyAlgIDTmpBuf = {};
    publicKeyAlgIDTmpBuf.tag = publicKeyAlgIDTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((publicKeyAlgIDTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        publicKeyAlgIDTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.publicKeyAlgID = publicKeyAlgIDTmpBuf;
    return value;
}
inline void cryptoFramework_PubKey_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey cryptoFramework_PubKey_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_SECURITY_CERT_API* GetOH_OHOS_SECURITY_CERT_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_SECURITY_CERT_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_SECURITY_CERT_APIKind::OH_OHOS_SECURITY_CERT_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_cert_CertExtension_construct() {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_CertExtension()->construct();
}
KOALA_INTEROP_DIRECT_0(cert_CertExtension_construct, OH_NativePointer)
OH_NativePointer impl_cert_CertExtension_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_CertExtension()->destruct;
}
KOALA_INTEROP_DIRECT_0(cert_CertExtension_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_cert_CertExtension_getEncoded(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_CertExtension()->getEncoded(thisPtr);
        SerializerBase _retSerializer {};
        cert_EncodingBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_CertExtension_getEncoded, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_cert_CertExtension_getOidList(OH_NativePointer thisPtr, OH_Int32 valueType) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_CertExtension()->getOidList(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cert_ExtensionOidType>(valueType));
        SerializerBase _retSerializer {};
        cert_DataArray_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(cert_CertExtension_getOidList, KInteropReturnBuffer, OH_NativePointer, OH_Int32)
KInteropReturnBuffer impl_cert_CertExtension_getEntry(OH_NativePointer thisPtr, OH_Int32 valueType, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_SECURITY_CERT_cert_DataBlob oidValueTemp = cert_DataBlob_serializer::read(thisDeserializer);;
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_CertExtension()->getEntry(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType>(valueType), static_cast<OH_OHOS_SECURITY_CERT_cert_DataBlob*>(&oidValueTemp));
        SerializerBase _retSerializer {};
        cert_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_4(cert_CertExtension_getEntry, KInteropReturnBuffer, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
OH_Int32 impl_cert_CertExtension_checkCA(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_CertExtension()->checkCA(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_CertExtension_checkCA, OH_Int32, OH_NativePointer)
OH_Boolean impl_cert_CertExtension_hasUnsupportedCriticalExtension(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_CertExtension()->hasUnsupportedCriticalExtension(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_CertExtension_hasUnsupportedCriticalExtension, OH_Boolean, OH_NativePointer)
OH_NativePointer impl_cert_X500DistinguishedName_construct() {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X500DistinguishedName()->construct();
}
KOALA_INTEROP_DIRECT_0(cert_X500DistinguishedName_construct, OH_NativePointer)
OH_NativePointer impl_cert_X500DistinguishedName_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X500DistinguishedName()->destruct;
}
KOALA_INTEROP_DIRECT_0(cert_X500DistinguishedName_getFinalizer, OH_NativePointer)
OH_String impl_cert_X500DistinguishedName_getName0(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X500DistinguishedName()->getName0(thisPtr);
}
KOALA_INTEROP_1(cert_X500DistinguishedName_getName0, KStringPtr, OH_NativePointer)
OH_String impl_cert_X500DistinguishedName_getName1(OH_NativePointer thisPtr, OH_Int32 encodingType) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X500DistinguishedName()->getName1(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cert_EncodingType>(encodingType));
}
KOALA_INTEROP_2(cert_X500DistinguishedName_getName1, KStringPtr, OH_NativePointer, OH_Int32)
KInteropReturnBuffer impl_cert_X500DistinguishedName_getName2(OH_NativePointer thisPtr, const KStringPtr& type) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X500DistinguishedName()->getName2(thisPtr, (const OH_String*) (&type));
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_String retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeString(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(cert_X500DistinguishedName_getName2, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
KInteropReturnBuffer impl_cert_X500DistinguishedName_getEncoded(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X500DistinguishedName()->getEncoded(thisPtr);
        SerializerBase _retSerializer {};
        cert_EncodingBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X500DistinguishedName_getEncoded, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_cert_X509Cert_construct() {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->construct();
}
KOALA_INTEROP_DIRECT_0(cert_X509Cert_construct, OH_NativePointer)
OH_NativePointer impl_cert_X509Cert_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->destruct;
}
KOALA_INTEROP_DIRECT_0(cert_X509Cert_getFinalizer, OH_NativePointer)
void impl_cert_X509Cert_verify0(OH_NativePointer thisPtr, OH_NativePointer key, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_SECURITY_CERT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->verify0(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey>(key), static_cast<OHOS_SECURITY_CERT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(cert_X509Cert_verify0, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_cert_X509Cert_verify1(KVMContext vmContext, OH_NativePointer thisPtr, OH_NativePointer key, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->verify1(reinterpret_cast<OH_OHOS_SECURITY_CERT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey>(key), static_cast<OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(cert_X509Cert_verify1, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_cert_X509Cert_getEncoded0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_SECURITY_CERT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getEncoded0(thisPtr, static_cast<OHOS_SECURITY_CERT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(cert_X509Cert_getEncoded0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_cert_X509Cert_getEncoded1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void))))};;
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getEncoded1(reinterpret_cast<OH_OHOS_SECURITY_CERT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(cert_X509Cert_getEncoded1, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_cert_X509Cert_getPublicKey(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getPublicKey(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getPublicKey, OH_NativePointer, OH_NativePointer)
void impl_cert_X509Cert_checkValidityWithDate(OH_NativePointer thisPtr, const KStringPtr& date) {
        GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->checkValidityWithDate(thisPtr, (const OH_String*) (&date));
}
KOALA_INTEROP_V2(cert_X509Cert_checkValidityWithDate, OH_NativePointer, KStringPtr)
OH_Int32 impl_cert_X509Cert_getVersion(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getVersion(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getVersion, OH_Int32, OH_NativePointer)
OH_Int64 impl_cert_X509Cert_getCertSerialNumber(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getCertSerialNumber(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getCertSerialNumber, OH_Int64, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getIssuerName0(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getIssuerName0(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getIssuerName0, KInteropReturnBuffer, OH_NativePointer)
OH_String impl_cert_X509Cert_getIssuerName1(OH_NativePointer thisPtr, OH_Int32 encodingType) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getIssuerName1(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cert_EncodingType>(encodingType));
}
KOALA_INTEROP_2(cert_X509Cert_getIssuerName1, KStringPtr, OH_NativePointer, OH_Int32)
KInteropReturnBuffer impl_cert_X509Cert_getSubjectName(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto encodingTypeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(thisDeserializer.readInt8());
        Opt_cert_EncodingType encodingTypeValueTempTmpBuf = {};
        encodingTypeValueTempTmpBuf.tag = encodingTypeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((encodingTypeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            encodingTypeValueTempTmpBuf.value = static_cast<OH_OHOS_SECURITY_CERT_cert_EncodingType>(thisDeserializer.readInt32());
        }
        Opt_cert_EncodingType encodingTypeValueTemp = encodingTypeValueTempTmpBuf;;
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getSubjectName(thisPtr, static_cast<Opt_cert_EncodingType*>(&encodingTypeValueTemp));
        SerializerBase _retSerializer {};
        cert_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_3(cert_X509Cert_getSubjectName, KInteropReturnBuffer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_String impl_cert_X509Cert_getNotBeforeTime(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getNotBeforeTime(thisPtr);
}
KOALA_INTEROP_1(cert_X509Cert_getNotBeforeTime, KStringPtr, OH_NativePointer)
OH_String impl_cert_X509Cert_getNotAfterTime(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getNotAfterTime(thisPtr);
}
KOALA_INTEROP_1(cert_X509Cert_getNotAfterTime, KStringPtr, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getSignature(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getSignature(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getSignature, KInteropReturnBuffer, OH_NativePointer)
OH_String impl_cert_X509Cert_getSignatureAlgName(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getSignatureAlgName(thisPtr);
}
KOALA_INTEROP_1(cert_X509Cert_getSignatureAlgName, KStringPtr, OH_NativePointer)
OH_String impl_cert_X509Cert_getSignatureAlgOid(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getSignatureAlgOid(thisPtr);
}
KOALA_INTEROP_1(cert_X509Cert_getSignatureAlgOid, KStringPtr, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getSignatureAlgParams(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getSignatureAlgParams(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getSignatureAlgParams, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getKeyUsage(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getKeyUsage(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getKeyUsage, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getExtKeyUsage(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getExtKeyUsage(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataArray_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getExtKeyUsage, KInteropReturnBuffer, OH_NativePointer)
OH_Int32 impl_cert_X509Cert_getBasicConstraints(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getBasicConstraints(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getBasicConstraints, OH_Int32, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getSubjectAltNames(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getSubjectAltNames(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataArray_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getSubjectAltNames, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getIssuerAltNames(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getIssuerAltNames(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataArray_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getIssuerAltNames, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_cert_X509Cert_getItem(OH_NativePointer thisPtr, OH_Int32 itemType) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getItem(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cert_CertItemType>(itemType));
        SerializerBase _retSerializer {};
        cert_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(cert_X509Cert_getItem, KInteropReturnBuffer, OH_NativePointer, OH_Int32)
OH_Boolean impl_cert_X509Cert_match(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters paramValueTemp = cert_X509CertMatchParameters_serializer::read(thisDeserializer);;
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->match(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters*>(&paramValueTemp));
}
KOALA_INTEROP_DIRECT_3(cert_X509Cert_match, OH_Boolean, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_cert_X509Cert_getCRLDistributionPoint(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getCRLDistributionPoint(thisPtr);
        SerializerBase _retSerializer {};
        cert_DataArray_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_getCRLDistributionPoint, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_cert_X509Cert_getIssuerX500DistinguishedName(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getIssuerX500DistinguishedName(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getIssuerX500DistinguishedName, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_cert_X509Cert_getSubjectX500DistinguishedName(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getSubjectX500DistinguishedName(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getSubjectX500DistinguishedName, OH_NativePointer, OH_NativePointer)
OH_String impl_cert_X509Cert_toString0(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->toString0(thisPtr);
}
KOALA_INTEROP_1(cert_X509Cert_toString0, KStringPtr, OH_NativePointer)
OH_String impl_cert_X509Cert_toString1(OH_NativePointer thisPtr, OH_Int32 encodingType) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->toString1(thisPtr, static_cast<OH_OHOS_SECURITY_CERT_cert_EncodingType>(encodingType));
}
KOALA_INTEROP_2(cert_X509Cert_toString1, KStringPtr, OH_NativePointer, OH_Int32)
KInteropReturnBuffer impl_cert_X509Cert_hashCode(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->hashCode(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeBuffer(retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cert_X509Cert_hashCode, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_cert_X509Cert_getExtensionsObject(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CERT_API(OHOS_SECURITY_CERT_API_VERSION)->Cert_X509Cert()->getExtensionsObject(thisPtr);
}
KOALA_INTEROP_DIRECT_1(cert_X509Cert_getExtensionsObject, OH_NativePointer, OH_NativePointer)
void deserializeAndCallCallback_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Array_String_Void(OH_OHOS_SECURITY_CERT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))));
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_EncodingBlob_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_EncodingBlob_Opt_Array_String_Void(OH_OHOS_SECURITY_CERT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_SECURITY_CERT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Void(OH_OHOS_SECURITY_CERT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_EncodingBlob_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_EncodingBlob_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_SECURITY_CERT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Array_String_VoidSync(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String error)
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
void callManagedCallback_Opt_EncodingBlob_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_SECURITY_CERT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void);
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
void callManagedCallback_Opt_EncodingBlob_Opt_Array_String_VoidSync(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void);
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
    const OH_OHOS_SECURITY_CERT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_Int32 resourceId)
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
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Void);
        case Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_EncodingBlob_Opt_Array_String_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_EncodingBlob_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_EncodingBlob_Opt_Array_String_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}