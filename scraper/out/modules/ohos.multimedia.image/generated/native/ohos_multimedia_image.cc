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

#include "ohos_multimedia_image.h"

#define KOALA_INTEROP_MODULE OHOS_MULTIMEDIA_IMAGENativeModule
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
    Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void = -693143510,
    Kind_Callback_Opt_PixelMap_Opt_Array_String_Void = 1834499351,
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_Buffer& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_Buffer& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_Float64& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_colorSpaceManager_ColorSpaceManager* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_colorSpaceManager_ColorSpaceManager& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType value) {
    result->append("OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_AlphaType* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_AlphaType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel value) {
    result->append("OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_AntiAliasingLevel* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_AntiAliasingLevel& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat value) {
    result->append("OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_PixelMapFormat* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_PixelMapFormat& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_ResolutionQuality& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_ResolutionQuality value) {
    result->append("OH_OHOS_MULTIMEDIA_IMAGE_image_ResolutionQuality(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_ResolutionQuality* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_ResolutionQuality& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_Size& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_Size* value) {
    result->append("{");
    // OH_Int32 height
    result->append(".height=");
    WriteToString(result, value->height);
    // OH_Int32 width
    result->append(", ");
    result->append(".width=");
    WriteToString(result, value->width);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_Size* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_Size& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_rpc_MessageSequence& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OHOS_MULTIMEDIA_IMAGE_AsyncCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_MULTIMEDIA_IMAGE_AsyncCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_MULTIMEDIA_IMAGE_AsyncCallback* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_OHOS_MULTIMEDIA_IMAGE_AsyncCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OHOS_MULTIMEDIA_IMAGE_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_MULTIMEDIA_IMAGE_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Void* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_OHOS_MULTIMEDIA_IMAGE_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_BusinessError& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_BusinessError value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_BusinessError& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo* value) {
    result->append("{");
    // OH_OHOS_MULTIMEDIA_IMAGE_image_Size size
    result->append(".size=");
    WriteToString(result, &value->size);
    // OH_Int32 density
    result->append(", ");
    result->append(".density=");
    WriteToString(result, value->density);
    // OH_Int32 stride
    result->append(", ");
    result->append(".stride=");
    WriteToString(result, value->stride);
    // OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat pixelFormat
    result->append(", ");
    result->append(".pixelFormat=");
    WriteToString(result, value->pixelFormat);
    // OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType alphaType
    result->append(", ");
    result->append(".alphaType=");
    WriteToString(result, value->alphaType);
    // OH_String mimeType
    result->append(", ");
    result->append(".mimeType=");
    WriteToString(result, &value->mimeType);
    // OH_Boolean isHdr
    result->append(", ");
    result->append(".isHdr=");
    WriteToString(result, value->isHdr);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_ImageInfo* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_ImageInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_Region& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_Region* value) {
    result->append("{");
    // OH_OHOS_MULTIMEDIA_IMAGE_image_Size size
    result->append(".size=");
    WriteToString(result, &value->size);
    // OH_Int32 x
    result->append(", ");
    result->append(".x=");
    WriteToString(result, value->x);
    // OH_Int32 y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, value->y);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_Region* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_Region& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea* value) {
    result->append("{");
    // OH_Buffer pixels
    result->append(".pixels=");
    WriteToString(result, value->pixels);
    // OH_Int32 offset
    result->append(", ");
    result->append(".offset=");
    WriteToString(result, value->offset);
    // OH_Int32 stride
    result->append(", ");
    result->append(".stride=");
    WriteToString(result, value->stride);
    // OH_OHOS_MULTIMEDIA_IMAGE_image_Region region
    result->append(", ");
    result->append(".region=");
    WriteToString(result, &value->region);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_image_PositionArea* value) {
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_image_PositionArea& value)
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
inline OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class colorSpaceManager_ColorSpaceManager_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager value);
    static OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager read(DeserializerBase& buffer);
};
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap value);
    static OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap read(DeserializerBase& buffer);
};
class image_Size_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_Size value);
    static OH_OHOS_MULTIMEDIA_IMAGE_image_Size read(DeserializerBase& buffer);
};
class rpc_MessageSequence_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence value);
    static OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence read(DeserializerBase& buffer);
};
class image_ImageInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo value);
    static OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo read(DeserializerBase& buffer);
};
class image_Region_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_Region value);
    static OH_OHOS_MULTIMEDIA_IMAGE_image_Region read(DeserializerBase& buffer);
};
class image_PositionArea_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea value);
    static OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea read(DeserializerBase& buffer);
};
inline void colorSpaceManager_ColorSpaceManager_serializer::write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager colorSpaceManager_ColorSpaceManager_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager>(ptr);
}
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMap>(ptr);
}
inline void image_Size_serializer::write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_Size value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForHeight = value.height;
    valueSerializer.writeInt32(valueHolderForHeight);
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeInt32(valueHolderForWidth);
}
inline OH_OHOS_MULTIMEDIA_IMAGE_image_Size image_Size_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MULTIMEDIA_IMAGE_image_Size value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.height = valueDeserializer.readInt32();
    value.width = valueDeserializer.readInt32();
    return value;
}
inline void rpc_MessageSequence_serializer::write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence rpc_MessageSequence_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence>(ptr);
}
inline void image_ImageInfo_serializer::write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForSize = value.size;
    image_Size_serializer::write(valueSerializer, valueHolderForSize);
    const auto valueHolderForDensity = value.density;
    valueSerializer.writeInt32(valueHolderForDensity);
    const auto valueHolderForStride = value.stride;
    valueSerializer.writeInt32(valueHolderForStride);
    const auto valueHolderForPixelFormat = value.pixelFormat;
    valueSerializer.writeInt32(static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat>(valueHolderForPixelFormat));
    const auto valueHolderForAlphaType = value.alphaType;
    valueSerializer.writeInt32(static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType>(valueHolderForAlphaType));
    const auto valueHolderForMimeType = value.mimeType;
    valueSerializer.writeString(valueHolderForMimeType);
    const auto valueHolderForIsHdr = value.isHdr;
    valueSerializer.writeBoolean(valueHolderForIsHdr);
}
inline OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo image_ImageInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MULTIMEDIA_IMAGE_image_ImageInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.size = image_Size_serializer::read(valueDeserializer);
    value.density = valueDeserializer.readInt32();
    value.stride = valueDeserializer.readInt32();
    value.pixelFormat = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat>(valueDeserializer.readInt32());
    value.alphaType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_AlphaType>(valueDeserializer.readInt32());
    value.mimeType = static_cast<OH_String>(valueDeserializer.readString());
    value.isHdr = valueDeserializer.readBoolean();
    return value;
}
inline void image_Region_serializer::write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_Region value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForSize = value.size;
    image_Size_serializer::write(valueSerializer, valueHolderForSize);
    const auto valueHolderForX = value.x;
    valueSerializer.writeInt32(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeInt32(valueHolderForY);
}
inline OH_OHOS_MULTIMEDIA_IMAGE_image_Region image_Region_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MULTIMEDIA_IMAGE_image_Region value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.size = image_Size_serializer::read(valueDeserializer);
    value.x = valueDeserializer.readInt32();
    value.y = valueDeserializer.readInt32();
    return value;
}
inline void image_PositionArea_serializer::write(SerializerBase& buffer, OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForPixels = value.pixels;
    valueSerializer.writeBuffer(valueHolderForPixels);
    const auto valueHolderForOffset = value.offset;
    valueSerializer.writeInt32(valueHolderForOffset);
    const auto valueHolderForStride = value.stride;
    valueSerializer.writeInt32(valueHolderForStride);
    const auto valueHolderForRegion = value.region;
    image_Region_serializer::write(valueSerializer, valueHolderForRegion);
}
inline OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea image_PositionArea_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.pixels = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    value.offset = valueDeserializer.readInt32();
    value.stride = valueDeserializer.readInt32();
    value.region = image_Region_serializer::read(valueDeserializer);
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_MULTIMEDIA_IMAGE_API* GetOH_OHOS_MULTIMEDIA_IMAGE_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_MULTIMEDIA_IMAGE_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_MULTIMEDIA_IMAGE_APIKind::OH_OHOS_MULTIMEDIA_IMAGE_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_image_PixelMap_construct() {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->construct();
}
KOALA_INTEROP_DIRECT_0(image_PixelMap_construct, OH_NativePointer)
OH_NativePointer impl_image_PixelMap_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->destruct;
}
KOALA_INTEROP_DIRECT_0(image_PixelMap_getFinalizer, OH_NativePointer)
void impl_image_PixelMap_readPixelsToBuffer0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer dstValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->readPixelsToBuffer0(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_Buffer*>(&dstValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_readPixelsToBuffer0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_readPixelsToBuffer1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer dstValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->readPixelsToBuffer1(thisPtr, static_cast<OH_Buffer*>(&dstValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixelsToBuffer1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_readPixelsToBufferSync(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer dstValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->readPixelsToBufferSync(thisPtr, static_cast<OH_Buffer*>(&dstValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixelsToBufferSync, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_readPixels0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea areaValueTemp = image_PositionArea_serializer::read(thisDeserializer);;
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->readPixels0(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea*>(&areaValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_readPixels0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_readPixels1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea areaValueTemp = image_PositionArea_serializer::read(thisDeserializer);;
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->readPixels1(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea*>(&areaValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixels1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_readPixelsSync(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea areaValueTemp = image_PositionArea_serializer::read(thisDeserializer);;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->readPixelsSync(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea*>(&areaValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_readPixelsSync, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_writePixels0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea areaValueTemp = image_PositionArea_serializer::read(thisDeserializer);;
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->writePixels0(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea*>(&areaValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_writePixels0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_writePixels1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea areaValueTemp = image_PositionArea_serializer::read(thisDeserializer);;
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->writePixels1(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea*>(&areaValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writePixels1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_writePixelsSync(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea areaValueTemp = image_PositionArea_serializer::read(thisDeserializer);;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->writePixelsSync(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PositionArea*>(&areaValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writePixelsSync, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_writeBufferToPixels0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer srcValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->writeBufferToPixels0(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_Buffer*>(&srcValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_writeBufferToPixels0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_writeBufferToPixels1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer srcValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->writeBufferToPixels1(thisPtr, static_cast<OH_Buffer*>(&srcValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writeBufferToPixels1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_writeBufferToPixelsSync(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_Buffer srcValueTemp = static_cast<OH_Buffer>(thisDeserializer.readBuffer());;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->writeBufferToPixelsSync(thisPtr, static_cast<OH_Buffer*>(&srcValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_writeBufferToPixelsSync, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_toSdr(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->toSdr(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_toSdr, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_getImageInfo0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getImageInfo0(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_ImageInfo_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_getImageInfo0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_getImageInfo1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getImageInfo1(thisPtr, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_getImageInfo1, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_image_PixelMap_getImageInfoSync(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getImageInfoSync(thisPtr);
        SerializerBase _retSerializer {};
        image_ImageInfo_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(image_PixelMap_getImageInfoSync, KInteropReturnBuffer, OH_NativePointer)
OH_Int32 impl_image_PixelMap_getBytesNumberPerRow(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getBytesNumberPerRow(thisPtr);
}
KOALA_INTEROP_DIRECT_1(image_PixelMap_getBytesNumberPerRow, OH_Int32, OH_NativePointer)
OH_Int32 impl_image_PixelMap_getPixelBytesNumber(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getPixelBytesNumber(thisPtr);
}
KOALA_INTEROP_DIRECT_1(image_PixelMap_getPixelBytesNumber, OH_Int32, OH_NativePointer)
OH_Int32 impl_image_PixelMap_getDensity(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getDensity(thisPtr);
}
KOALA_INTEROP_DIRECT_1(image_PixelMap_getDensity, OH_Int32, OH_NativePointer)
void impl_image_PixelMap_opacity0(OH_NativePointer thisPtr, KDouble rate, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->opacity0(thisPtr, rate, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(image_PixelMap_opacity0, OH_NativePointer, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_opacity1(KVMContext vmContext, OH_NativePointer thisPtr, KDouble rate, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->opacity1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, rate, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(image_PixelMap_opacity1, OH_NativePointer, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_opacitySync(OH_NativePointer thisPtr, KDouble rate) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->opacitySync(thisPtr, rate);
}
KOALA_INTEROP_V2(image_PixelMap_opacitySync, OH_NativePointer, KDouble)
void impl_image_PixelMap_createAlphaPixelmap0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->createAlphaPixelmap0(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_createAlphaPixelmap0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_createAlphaPixelmap1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->createAlphaPixelmap1(thisPtr, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_createAlphaPixelmap1, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_image_PixelMap_createAlphaPixelmapSync(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->createAlphaPixelmapSync(thisPtr);
}
KOALA_INTEROP_DIRECT_1(image_PixelMap_createAlphaPixelmapSync, OH_NativePointer, OH_NativePointer)
void impl_image_PixelMap_scale0(OH_NativePointer thisPtr, KDouble x, KDouble y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->scale0(thisPtr, x, y, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V5(image_PixelMap_scale0, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_scale1(KVMContext vmContext, OH_NativePointer thisPtr, KDouble x, KDouble y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->scale1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, x, y, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(image_PixelMap_scale1, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_scaleSync0(OH_NativePointer thisPtr, KDouble x, KDouble y) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->scaleSync0(thisPtr, x, y);
}
KOALA_INTEROP_V3(image_PixelMap_scaleSync0, OH_NativePointer, KDouble, KDouble)
void impl_image_PixelMap_scale2(KVMContext vmContext, OH_NativePointer thisPtr, KDouble x, KDouble y, OH_Int32 level, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->scale2(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, x, y, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel>(level), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V6(image_PixelMap_scale2, OH_NativePointer, KDouble, KDouble, OH_Int32, KSerializerBuffer, int32_t)
void impl_image_PixelMap_scaleSync1(OH_NativePointer thisPtr, KDouble x, KDouble y, OH_Int32 level) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->scaleSync1(thisPtr, x, y, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel>(level));
}
KOALA_INTEROP_V4(image_PixelMap_scaleSync1, OH_NativePointer, KDouble, KDouble, OH_Int32)
void impl_image_PixelMap_createScaledPixelMap(KVMContext vmContext, OH_NativePointer thisPtr, KDouble x, KDouble y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto levelValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
        Opt_image_AntiAliasingLevel levelValueTempTmpBuf = {};
        levelValueTempTmpBuf.tag = levelValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((levelValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            levelValueTempTmpBuf.value = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel>(thisDeserializer.readInt32());
        }
        Opt_image_AntiAliasingLevel levelValueTemp = levelValueTempTmpBuf;;
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->createScaledPixelMap(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, x, y, static_cast<Opt_image_AntiAliasingLevel*>(&levelValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(image_PixelMap_createScaledPixelMap, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
OH_NativePointer impl_image_PixelMap_createScaledPixelMapSync(OH_NativePointer thisPtr, KDouble x, KDouble y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto levelValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
        Opt_image_AntiAliasingLevel levelValueTempTmpBuf = {};
        levelValueTempTmpBuf.tag = levelValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((levelValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            levelValueTempTmpBuf.value = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_AntiAliasingLevel>(thisDeserializer.readInt32());
        }
        Opt_image_AntiAliasingLevel levelValueTemp = levelValueTempTmpBuf;;
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->createScaledPixelMapSync(thisPtr, x, y, static_cast<Opt_image_AntiAliasingLevel*>(&levelValueTemp));
}
KOALA_INTEROP_5(image_PixelMap_createScaledPixelMapSync, OH_NativePointer, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_translate0(OH_NativePointer thisPtr, KDouble x, KDouble y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->translate0(thisPtr, x, y, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V5(image_PixelMap_translate0, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_translate1(KVMContext vmContext, OH_NativePointer thisPtr, KDouble x, KDouble y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->translate1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, x, y, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(image_PixelMap_translate1, OH_NativePointer, KDouble, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_translateSync(OH_NativePointer thisPtr, KDouble x, KDouble y) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->translateSync(thisPtr, x, y);
}
KOALA_INTEROP_V3(image_PixelMap_translateSync, OH_NativePointer, KDouble, KDouble)
void impl_image_PixelMap_rotate0(OH_NativePointer thisPtr, KDouble angle, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->rotate0(thisPtr, angle, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(image_PixelMap_rotate0, OH_NativePointer, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_rotate1(KVMContext vmContext, OH_NativePointer thisPtr, KDouble angle, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->rotate1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, angle, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(image_PixelMap_rotate1, OH_NativePointer, KDouble, KSerializerBuffer, int32_t)
void impl_image_PixelMap_rotateSync(OH_NativePointer thisPtr, KDouble angle) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->rotateSync(thisPtr, angle);
}
KOALA_INTEROP_V2(image_PixelMap_rotateSync, OH_NativePointer, KDouble)
void impl_image_PixelMap_flip0(OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->flip0(thisPtr, horizontal, vertical, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V5(image_PixelMap_flip0, OH_NativePointer, OH_Boolean, OH_Boolean, KSerializerBuffer, int32_t)
void impl_image_PixelMap_flip1(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->flip1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, horizontal, vertical, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(image_PixelMap_flip1, OH_NativePointer, OH_Boolean, OH_Boolean, KSerializerBuffer, int32_t)
void impl_image_PixelMap_flipSync(OH_NativePointer thisPtr, OH_Boolean horizontal, OH_Boolean vertical) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->flipSync(thisPtr, horizontal, vertical);
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_flipSync, OH_NativePointer, OH_Boolean, OH_Boolean)
void impl_image_PixelMap_crop0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_Region regionValueTemp = image_Region_serializer::read(thisDeserializer);;
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->crop0(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_Region*>(&regionValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_crop0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_crop1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_Region regionValueTemp = image_Region_serializer::read(thisDeserializer);;
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->crop1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_Region*>(&regionValueTemp), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_crop1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_cropSync(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MULTIMEDIA_IMAGE_image_Region regionValueTemp = image_Region_serializer::read(thisDeserializer);;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->cropSync(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_Region*>(&regionValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_cropSync, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_image_PixelMap_getColorSpace(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getColorSpace(thisPtr);
}
KOALA_INTEROP_DIRECT_1(image_PixelMap_getColorSpace, OH_NativePointer, OH_NativePointer)
void impl_image_PixelMap_marshalling(OH_NativePointer thisPtr, OH_NativePointer sequence_) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->marshalling(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence>(sequence_));
}
KOALA_INTEROP_DIRECT_V2(image_PixelMap_marshalling, OH_NativePointer, OH_NativePointer)
void impl_image_PixelMap_unmarshalling(KVMContext vmContext, OH_NativePointer thisPtr, OH_NativePointer sequence_, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->unmarshalling(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_rpc_MessageSequence>(sequence_), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(image_PixelMap_unmarshalling, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_setColorSpace(OH_NativePointer thisPtr, OH_NativePointer colorSpace) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->setColorSpace(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager>(colorSpace));
}
KOALA_INTEROP_DIRECT_V2(image_PixelMap_setColorSpace, OH_NativePointer, OH_NativePointer)
void impl_image_PixelMap_applyColorSpace0(OH_NativePointer thisPtr, OH_NativePointer targetColorSpace, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->applyColorSpace0(thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager>(targetColorSpace), static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(image_PixelMap_applyColorSpace0, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_applyColorSpace1(KVMContext vmContext, OH_NativePointer thisPtr, OH_NativePointer targetColorSpace, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->applyColorSpace1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_colorSpaceManager_ColorSpaceManager>(targetColorSpace), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(image_PixelMap_applyColorSpace1, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_convertPixelFormat(KVMContext vmContext, OH_NativePointer thisPtr, OH_Int32 targetPixelFormat, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->convertPixelFormat(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_MULTIMEDIA_IMAGE_image_PixelMapFormat>(targetPixelFormat), static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(image_PixelMap_convertPixelFormat, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
void impl_image_PixelMap_release0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->release0(thisPtr, static_cast<OHOS_MULTIMEDIA_IMAGE_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(image_PixelMap_release0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_release1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->release1(reinterpret_cast<OH_OHOS_MULTIMEDIA_IMAGE_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_MULTIMEDIA_IMAGE_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(image_PixelMap_release1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_image_PixelMap_setMemoryNameSync(OH_NativePointer thisPtr, const KStringPtr& name) {
        GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->setMemoryNameSync(thisPtr, (const OH_String*) (&name));
}
KOALA_INTEROP_V2(image_PixelMap_setMemoryNameSync, OH_NativePointer, KStringPtr)
OH_Boolean impl_image_PixelMap_getIsEditable(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getIsEditable(thisPtr);
}
KOALA_INTEROP_DIRECT_1(image_PixelMap_getIsEditable, OH_Boolean, OH_NativePointer)
OH_Boolean impl_image_PixelMap_getIsStrideAlignment(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MULTIMEDIA_IMAGE_API(OHOS_MULTIMEDIA_IMAGE_API_VERSION)->Image_PixelMap()->getIsStrideAlignment(thisPtr);
}
KOALA_INTEROP_DIRECT_1(image_PixelMap_getIsStrideAlignment, OH_Boolean, OH_NativePointer)
void deserializeAndCallCallback_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Array_String_Void(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))));
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_ImageInfo_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_ImageInfo_Opt_Array_String_Void(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_PixelMap_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_PixelMap_Opt_Array_String_Void(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_MULTIMEDIA_IMAGE_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Void(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_ImageInfo_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_PixelMap_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_PixelMap_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_ImageInfo_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_PixelMap_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_PixelMap_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Array_String_VoidSync(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String error)
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
void callManagedCallback_Opt_ImageInfo_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void);
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
void callManagedCallback_Opt_ImageInfo_Opt_Array_String_VoidSync(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void);
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
void callManagedCallback_Opt_PixelMap_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void);
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
void callManagedCallback_Opt_PixelMap_Opt_Array_String_VoidSync(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_PixelMap_Opt_Array_String_Void);
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
    const OH_OHOS_MULTIMEDIA_IMAGE_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_MULTIMEDIA_IMAGE_VMContext vmContext, OH_Int32 resourceId)
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
        case Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_ImageInfo_Opt_Array_String_Void);
        case Kind_Callback_Opt_PixelMap_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PixelMap_Opt_Array_String_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_ImageInfo_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_ImageInfo_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_PixelMap_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PixelMap_Opt_Array_String_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}