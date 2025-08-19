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

#include "ohos_app_ability_startoptions.h"

#define KOALA_INTEROP_MODULE OHOS_APP_ABILITY_STARTOPTIONSNativeModule
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Array_bundleManager_SupportWindowMode& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode value);

template <>
inline void WriteToString(std::string* result, const Array_bundleManager_SupportWindowMode* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode, " + std::to_string(count) + ">({{");
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_Array_bundleManager_SupportWindowMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode value) {
    result->append("OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode(");
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_bundleManager_SupportWindowMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode value) {
    result->append("OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode(");
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_contextConstant_ProcessMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility value) {
    result->append("OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility(");
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_contextConstant_StartupVisibility& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap value) {
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_StartOptions* value) {
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_StartOptions& value)
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
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap value);
    static OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap read(DeserializerBase& buffer);
};
class StartOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions value);
    static OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions read(DeserializerBase& buffer);
};
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap>(ptr);
}
inline void StartOptions_serializer::write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions StartOptions_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_StartOptions>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_APP_ABILITY_STARTOPTIONS_API* GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_APP_ABILITY_STARTOPTIONS_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_APP_ABILITY_STARTOPTIONS_APIKind::OH_OHOS_APP_ABILITY_STARTOPTIONS_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_StartOptions_construct() {
        return GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->construct();
}
KOALA_INTEROP_DIRECT_0(StartOptions_construct, OH_NativePointer)
OH_NativePointer impl_StartOptions_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->destruct;
}
KOALA_INTEROP_DIRECT_0(StartOptions_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_StartOptions_getWindowMode(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getWindowMode(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getWindowMode, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setWindowMode(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto windowModeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 windowModeValueTempTmpBuf = {};
        windowModeValueTempTmpBuf.tag = windowModeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((windowModeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            windowModeValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 windowModeValueTemp = windowModeValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setWindowMode(thisPtr, static_cast<Opt_Int32*>(&windowModeValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowMode, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getDisplayId(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getDisplayId(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeInt64(retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(StartOptions_getDisplayId, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setDisplayId(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto displayIdValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int64 displayIdValueTempTmpBuf = {};
        displayIdValueTempTmpBuf.tag = displayIdValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((displayIdValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            displayIdValueTempTmpBuf.value = thisDeserializer.readInt64();
        }
        Opt_Int64 displayIdValueTemp = displayIdValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setDisplayId(thisPtr, static_cast<Opt_Int64*>(&displayIdValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setDisplayId, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getWithAnimation(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getWithAnimation(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getWithAnimation, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setWithAnimation(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto withAnimationValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean withAnimationValueTempTmpBuf = {};
        withAnimationValueTempTmpBuf.tag = withAnimationValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((withAnimationValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            withAnimationValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean withAnimationValueTemp = withAnimationValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setWithAnimation(thisPtr, static_cast<Opt_Boolean*>(&withAnimationValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setWithAnimation, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getWindowLeft(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getWindowLeft(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getWindowLeft, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setWindowLeft(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto windowLeftValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 windowLeftValueTempTmpBuf = {};
        windowLeftValueTempTmpBuf.tag = windowLeftValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((windowLeftValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            windowLeftValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 windowLeftValueTemp = windowLeftValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setWindowLeft(thisPtr, static_cast<Opt_Int32*>(&windowLeftValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowLeft, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getWindowTop(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getWindowTop(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getWindowTop, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setWindowTop(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto windowTopValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 windowTopValueTempTmpBuf = {};
        windowTopValueTempTmpBuf.tag = windowTopValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((windowTopValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            windowTopValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 windowTopValueTemp = windowTopValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setWindowTop(thisPtr, static_cast<Opt_Int32*>(&windowTopValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowTop, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getWindowWidth(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getWindowWidth(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getWindowWidth, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setWindowWidth(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto windowWidthValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 windowWidthValueTempTmpBuf = {};
        windowWidthValueTempTmpBuf.tag = windowWidthValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((windowWidthValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            windowWidthValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 windowWidthValueTemp = windowWidthValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setWindowWidth(thisPtr, static_cast<Opt_Int32*>(&windowWidthValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowWidth, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getWindowHeight(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getWindowHeight(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getWindowHeight, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setWindowHeight(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto windowHeightValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 windowHeightValueTempTmpBuf = {};
        windowHeightValueTempTmpBuf.tag = windowHeightValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((windowHeightValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            windowHeightValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 windowHeightValueTemp = windowHeightValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setWindowHeight(thisPtr, static_cast<Opt_Int32*>(&windowHeightValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowHeight, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getWindowFocused(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getWindowFocused(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getWindowFocused, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setWindowFocused(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto windowFocusedValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean windowFocusedValueTempTmpBuf = {};
        windowFocusedValueTempTmpBuf.tag = windowFocusedValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((windowFocusedValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            windowFocusedValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean windowFocusedValueTemp = windowFocusedValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setWindowFocused(thisPtr, static_cast<Opt_Boolean*>(&windowFocusedValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setWindowFocused, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getProcessMode(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getProcessMode(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeInt32(static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode>(retValueTmpValue));
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(StartOptions_getProcessMode, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setProcessMode(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto processModeValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_contextConstant_ProcessMode processModeValueTempTmpBuf = {};
        processModeValueTempTmpBuf.tag = processModeValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((processModeValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            processModeValueTempTmpBuf.value = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_ProcessMode>(thisDeserializer.readInt32());
        }
        Opt_contextConstant_ProcessMode processModeValueTemp = processModeValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setProcessMode(thisPtr, static_cast<Opt_contextConstant_ProcessMode*>(&processModeValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setProcessMode, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getStartupVisibility(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getStartupVisibility(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeInt32(static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility>(retValueTmpValue));
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(StartOptions_getStartupVisibility, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setStartupVisibility(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto startupVisibilityValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_contextConstant_StartupVisibility startupVisibilityValueTempTmpBuf = {};
        startupVisibilityValueTempTmpBuf.tag = startupVisibilityValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((startupVisibilityValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            startupVisibilityValueTempTmpBuf.value = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_contextConstant_StartupVisibility>(thisDeserializer.readInt32());
        }
        Opt_contextConstant_StartupVisibility startupVisibilityValueTemp = startupVisibilityValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setStartupVisibility(thisPtr, static_cast<Opt_contextConstant_StartupVisibility*>(&startupVisibilityValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setStartupVisibility, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getStartWindowIcon(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getStartWindowIcon(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            image_PixelMap_serializer::write(_retSerializer, retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(StartOptions_getStartWindowIcon, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setStartWindowIcon(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto startWindowIconValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_image_PixelMap startWindowIconValueTempTmpBuf = {};
        startWindowIconValueTempTmpBuf.tag = startWindowIconValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((startWindowIconValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            startWindowIconValueTempTmpBuf.value = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_image_PixelMap>(image_PixelMap_serializer::read(thisDeserializer));
        }
        Opt_image_PixelMap startWindowIconValueTemp = startWindowIconValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setStartWindowIcon(thisPtr, static_cast<Opt_image_PixelMap*>(&startWindowIconValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setStartWindowIcon, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getStartWindowBackgroundColor(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getStartWindowBackgroundColor(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeString(retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(StartOptions_getStartWindowBackgroundColor, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setStartWindowBackgroundColor(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto startWindowBackgroundColorValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_String startWindowBackgroundColorValueTempTmpBuf = {};
        startWindowBackgroundColorValueTempTmpBuf.tag = startWindowBackgroundColorValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((startWindowBackgroundColorValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            startWindowBackgroundColorValueTempTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String startWindowBackgroundColorValueTemp = startWindowBackgroundColorValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setStartWindowBackgroundColor(thisPtr, static_cast<Opt_String*>(&startWindowBackgroundColorValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setStartWindowBackgroundColor, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getSupportWindowModes(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getSupportWindowModes(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeInt32(retValueTmpValue.length);
            for (int retValueTmpValueCounterI = 0; retValueTmpValueCounterI < retValueTmpValue.length; retValueTmpValueCounterI++) {
                const OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode retValueTmpValueTmpElement = retValueTmpValue.array[retValueTmpValueCounterI];
                _retSerializer.writeInt32(static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode>(retValueTmpValueTmpElement));
            }
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(StartOptions_getSupportWindowModes, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setSupportWindowModes(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto supportWindowModesValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_bundleManager_SupportWindowMode supportWindowModesValueTempTmpBuf = {};
        supportWindowModesValueTempTmpBuf.tag = supportWindowModesValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((supportWindowModesValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 supportWindowModesValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_bundleManager_SupportWindowMode supportWindowModesValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(supportWindowModesValueTempTmpBuf_)>::type,
        std::decay<decltype(*supportWindowModesValueTempTmpBuf_.array)>::type>(&supportWindowModesValueTempTmpBuf_, supportWindowModesValueTempTmpBuf_Length);
            for (int supportWindowModesValueTempTmpBuf_BufCounterI = 0; supportWindowModesValueTempTmpBuf_BufCounterI < supportWindowModesValueTempTmpBuf_Length; supportWindowModesValueTempTmpBuf_BufCounterI++) {
                supportWindowModesValueTempTmpBuf_.array[supportWindowModesValueTempTmpBuf_BufCounterI] = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_bundleManager_SupportWindowMode>(thisDeserializer.readInt32());
            }
            supportWindowModesValueTempTmpBuf.value = supportWindowModesValueTempTmpBuf_;
        }
        Opt_Array_bundleManager_SupportWindowMode supportWindowModesValueTemp = supportWindowModesValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setSupportWindowModes(thisPtr, static_cast<Opt_Array_bundleManager_SupportWindowMode*>(&supportWindowModesValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setSupportWindowModes, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getMinWindowWidth(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getMinWindowWidth(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getMinWindowWidth, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setMinWindowWidth(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto minWindowWidthValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 minWindowWidthValueTempTmpBuf = {};
        minWindowWidthValueTempTmpBuf.tag = minWindowWidthValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((minWindowWidthValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            minWindowWidthValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 minWindowWidthValueTemp = minWindowWidthValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setMinWindowWidth(thisPtr, static_cast<Opt_Int32*>(&minWindowWidthValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setMinWindowWidth, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getMinWindowHeight(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getMinWindowHeight(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getMinWindowHeight, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setMinWindowHeight(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto minWindowHeightValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 minWindowHeightValueTempTmpBuf = {};
        minWindowHeightValueTempTmpBuf.tag = minWindowHeightValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((minWindowHeightValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            minWindowHeightValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 minWindowHeightValueTemp = minWindowHeightValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setMinWindowHeight(thisPtr, static_cast<Opt_Int32*>(&minWindowHeightValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setMinWindowHeight, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getMaxWindowWidth(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getMaxWindowWidth(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getMaxWindowWidth, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setMaxWindowWidth(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto maxWindowWidthValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 maxWindowWidthValueTempTmpBuf = {};
        maxWindowWidthValueTempTmpBuf.tag = maxWindowWidthValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((maxWindowWidthValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            maxWindowWidthValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 maxWindowWidthValueTemp = maxWindowWidthValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setMaxWindowWidth(thisPtr, static_cast<Opt_Int32*>(&maxWindowWidthValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setMaxWindowWidth, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_StartOptions_getMaxWindowHeight(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->getMaxWindowHeight(thisPtr);
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
KOALA_INTEROP_1(StartOptions_getMaxWindowHeight, KInteropReturnBuffer, OH_NativePointer)
void impl_StartOptions_setMaxWindowHeight(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto maxWindowHeightValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_STARTOPTIONS_RuntimeType>(thisDeserializer.readInt8());
        Opt_Int32 maxWindowHeightValueTempTmpBuf = {};
        maxWindowHeightValueTempTmpBuf.tag = maxWindowHeightValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((maxWindowHeightValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            maxWindowHeightValueTempTmpBuf.value = thisDeserializer.readInt32();
        }
        Opt_Int32 maxWindowHeightValueTemp = maxWindowHeightValueTempTmpBuf;;
        GetOH_OHOS_APP_ABILITY_STARTOPTIONS_API(OHOS_APP_ABILITY_STARTOPTIONS_API_VERSION)->StartOptions()->setMaxWindowHeight(thisPtr, static_cast<Opt_Int32*>(&maxWindowHeightValueTemp));
}
KOALA_INTEROP_DIRECT_V3(StartOptions_setMaxWindowHeight, OH_NativePointer, KSerializerBuffer, int32_t)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_APP_ABILITY_STARTOPTIONS_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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