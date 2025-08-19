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

#include "ohos_app_ability_atomicserviceoptions.h"

#define KOALA_INTEROP_MODULE OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Array_bundleManager_SupportWindowMode& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_bundleManager_SupportWindowMode value);

template <>
inline void WriteToString(std::string* result, const Array_bundleManager_SupportWindowMode* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_bundleManager_SupportWindowMode, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_bundleManager_SupportWindowMode* value) {
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_Array_bundleManager_SupportWindowMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Map_String_Object& value)
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_Map_String_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_Int64& value)
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_bundleManager_SupportWindowMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_bundleManager_SupportWindowMode value) {
    result->append("OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_bundleManager_SupportWindowMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_bundleManager_SupportWindowMode* value) {
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_bundleManager_SupportWindowMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_contextConstant_ProcessMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_contextConstant_ProcessMode value) {
    result->append("OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_contextConstant_ProcessMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_contextConstant_ProcessMode* value) {
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_contextConstant_ProcessMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_contextConstant_StartupVisibility& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_contextConstant_StartupVisibility value) {
    result->append("OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_contextConstant_StartupVisibility(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_contextConstant_StartupVisibility* value) {
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_contextConstant_StartupVisibility& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_image_PixelMap value) {
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptions value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_AtomicServiceOptions* value) {
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
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType runtimeType(const Opt_AtomicServiceOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_image_PixelMap value);
    static OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_image_PixelMap read(DeserializerBase& buffer);
};
class AtomicServiceOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptions value);
    static OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptions read(DeserializerBase& buffer);
};
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_image_PixelMap>(ptr);
}
inline void AtomicServiceOptions_serializer::write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptions value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptions AtomicServiceOptions_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_AtomicServiceOptions>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API* GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_APIKind::OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_AtomicServiceOptions_construct() {
        return GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->AtomicServiceOptions()->construct();
}
KOALA_INTEROP_DIRECT_0(AtomicServiceOptions_construct, OH_NativePointer)
OH_NativePointer impl_AtomicServiceOptions_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->AtomicServiceOptions()->destruct;
}
KOALA_INTEROP_DIRECT_0(AtomicServiceOptions_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_AtomicServiceOptions_getFlags(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->AtomicServiceOptions()->getFlags(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeInt32(retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(AtomicServiceOptions_getFlags, KInteropReturnBuffer, OH_NativePointer)
void impl_AtomicServiceOptions_setFlags(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto flagsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 flagsValueTempTmpBuf = {};
        flagsValueTempTmpBuf.tag = flagsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((flagsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            flagsValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 flagsValueTemp = flagsValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->AtomicServiceOptions()->setFlags(thisPtr, static_cast<Opt_Int32*>(&flagsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AtomicServiceOptions_setFlags, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_AtomicServiceOptions_getParameters(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->AtomicServiceOptions()->getParameters(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeInt32(retValueTmpValue.size);
            for (int32_t i = 0; i < retValueTmpValue.size; i++) {
                auto retValueTmpValueKeyVar = retValueTmpValue.keys[i];
                auto retValueTmpValueValueVar = retValueTmpValue.values[i];
                _retSerializer.writeString(retValueTmpValueKeyVar);
                _retSerializer.writeObject(retValueTmpValueValueVar);
            }
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(AtomicServiceOptions_getParameters, KInteropReturnBuffer, OH_NativePointer)
void impl_AtomicServiceOptions_setParameters(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto parametersValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Map_String_Object parametersValueTempTmpBuf = {};
        parametersValueTempTmpBuf.tag = parametersValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((parametersValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 parametersValueTempTmpBuf_SizeVar = thisDeserializer.readInt32();
            Map_String_Object parametersValueTempTmpBuf_ = {};
            thisDeserializer.resizeMap<Map_String_Object, OH_String, OH_Object>(&parametersValueTempTmpBuf_, parametersValueTempTmpBuf_SizeVar);
            for (int parametersValueTempTmpBuf_IVar = 0; parametersValueTempTmpBuf_IVar < parametersValueTempTmpBuf_SizeVar; parametersValueTempTmpBuf_IVar++) {
                const OH_String parametersValueTempTmpBuf_KeyVar = static_cast<OH_String>(thisDeserializer.readString());
                const OH_Object parametersValueTempTmpBuf_ValueVar = static_cast<OH_Object>(thisDeserializer.readObject());
                parametersValueTempTmpBuf_.keys[parametersValueTempTmpBuf_IVar] = parametersValueTempTmpBuf_KeyVar;
                parametersValueTempTmpBuf_.values[parametersValueTempTmpBuf_IVar] = parametersValueTempTmpBuf_ValueVar;
            }
            parametersValueTempTmpBuf.value = parametersValueTempTmpBuf_;
        }
        Opt_Map_String_Object parametersValueTemp = parametersValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API(OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_API_VERSION)->AtomicServiceOptions()->setParameters(thisPtr, static_cast<Opt_Map_String_Object*>(&parametersValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AtomicServiceOptions_setParameters, OH_NativePointer, KSerializerBuffer, int32_t)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_APP_ABILITY_ATOMICSERVICEOPTIONS_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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