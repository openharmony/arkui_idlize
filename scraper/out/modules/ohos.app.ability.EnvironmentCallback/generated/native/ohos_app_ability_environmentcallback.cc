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

#include "ohos_app_ability_environmentcallback.h"

#define KOALA_INTEROP_MODULE OHOS_APP_ABILITY_ENVIRONMENTCALLBACKNativeModule
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_Float64& value)
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_AbilityConstant_MemoryLevel& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_AbilityConstant_MemoryLevel value) {
    result->append("OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_AbilityConstant_MemoryLevel(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_AbilityConstant_MemoryLevel* value) {
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_AbilityConstant_MemoryLevel& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ColorMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ColorMode value) {
    result->append("OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ColorMode(");
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_ConfigurationConstant_ColorMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_Direction& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_Direction value) {
    result->append("OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_Direction(");
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_ConfigurationConstant_Direction& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ScreenDensity& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ScreenDensity value) {
    result->append("OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ScreenDensity(");
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_ConfigurationConstant_ScreenDensity& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallback value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_EnvironmentCallback* value) {
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_EnvironmentCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration* value) {
    result->append("{");
    // OH_String language
    result->append(".language=");
    WriteToString(result, &value->language);
    // OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ColorMode colorMode
    result->append(", ");
    result->append(".colorMode=");
    WriteToString(result, &value->colorMode);
    // OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_Direction direction
    result->append(", ");
    result->append(".direction=");
    WriteToString(result, &value->direction);
    // OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ScreenDensity screenDensity
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_Configuration& value)
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class EnvironmentCallback_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallback value);
    static OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallback read(DeserializerBase& buffer);
};
class Configuration_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration value);
    static OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration read(DeserializerBase& buffer);
};
inline void EnvironmentCallback_serializer::write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallback value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallback EnvironmentCallback_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_EnvironmentCallback>(ptr);
}
inline void Configuration_serializer::write(SerializerBase& buffer, OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration value)
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ColorMode>(valueHolderForColorModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDirection = value.direction;
    if (runtimeType(valueHolderForDirection) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDirectionTmpValue = valueHolderForDirection.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_Direction>(valueHolderForDirectionTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForScreenDensity = value.screenDensity;
    if (runtimeType(valueHolderForScreenDensity) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForScreenDensityTmpValue = valueHolderForScreenDensity.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ScreenDensity>(valueHolderForScreenDensityTmpValue));
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
inline OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration Configuration_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto languageTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_String languageTmpBuf = {};
    languageTmpBuf.tag = languageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((languageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        languageTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.language = languageTmpBuf;
    const auto colorModeTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_ConfigurationConstant_ColorMode colorModeTmpBuf = {};
    colorModeTmpBuf.tag = colorModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((colorModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        colorModeTmpBuf.value = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ColorMode>(valueDeserializer.readInt32());
    }
    value.colorMode = colorModeTmpBuf;
    const auto directionTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_ConfigurationConstant_Direction directionTmpBuf = {};
    directionTmpBuf.tag = directionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((directionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        directionTmpBuf.value = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_Direction>(valueDeserializer.readInt32());
    }
    value.direction = directionTmpBuf;
    const auto screenDensityTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_ConfigurationConstant_ScreenDensity screenDensityTmpBuf = {};
    screenDensityTmpBuf.tag = screenDensityTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((screenDensityTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        screenDensityTmpBuf.value = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_ConfigurationConstant_ScreenDensity>(valueDeserializer.readInt32());
    }
    value.screenDensity = screenDensityTmpBuf;
    const auto displayIdTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_Int64 displayIdTmpBuf = {};
    displayIdTmpBuf.tag = displayIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((displayIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        displayIdTmpBuf.value = valueDeserializer.readInt64();
    }
    value.displayId = displayIdTmpBuf;
    const auto hasPointerDeviceTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean hasPointerDeviceTmpBuf = {};
    hasPointerDeviceTmpBuf.tag = hasPointerDeviceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hasPointerDeviceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hasPointerDeviceTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.hasPointerDevice = hasPointerDeviceTmpBuf;
    const auto fontSizeScaleTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 fontSizeScaleTmpBuf = {};
    fontSizeScaleTmpBuf.tag = fontSizeScaleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontSizeScaleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        fontSizeScaleTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.fontSizeScale = fontSizeScaleTmpBuf;
    const auto fontWeightScaleTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 fontWeightScaleTmpBuf = {};
    fontWeightScaleTmpBuf.tag = fontWeightScaleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontWeightScaleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        fontWeightScaleTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.fontWeightScale = fontWeightScaleTmpBuf;
    const auto mccTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_String mccTmpBuf = {};
    mccTmpBuf.tag = mccTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((mccTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        mccTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.mcc = mccTmpBuf;
    const auto mncTmpBuf_runtimeType = static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_RuntimeType>(valueDeserializer.readInt8());
    Opt_String mncTmpBuf = {};
    mncTmpBuf.tag = mncTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((mncTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        mncTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.mnc = mncTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API* GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_APIKind::OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_EnvironmentCallback_construct() {
        return GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->EnvironmentCallback()->construct();
}
KOALA_INTEROP_DIRECT_0(EnvironmentCallback_construct, OH_NativePointer)
OH_NativePointer impl_EnvironmentCallback_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->EnvironmentCallback()->destruct;
}
KOALA_INTEROP_DIRECT_0(EnvironmentCallback_getFinalizer, OH_NativePointer)
void impl_EnvironmentCallback_onConfigurationUpdated(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration configValueTemp = Configuration_serializer::read(thisDeserializer);;
        GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->EnvironmentCallback()->onConfigurationUpdated(thisPtr, static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_Configuration*>(&configValueTemp));
}
KOALA_INTEROP_DIRECT_V3(EnvironmentCallback_onConfigurationUpdated, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_EnvironmentCallback_onMemoryLevel(OH_NativePointer thisPtr, OH_Int32 level) {
        GetOH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API(OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_API_VERSION)->EnvironmentCallback()->onMemoryLevel(thisPtr, static_cast<OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_AbilityConstant_MemoryLevel>(level));
}
KOALA_INTEROP_DIRECT_V2(EnvironmentCallback_onMemoryLevel, OH_NativePointer, OH_Int32)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_APP_ABILITY_ENVIRONMENTCALLBACK_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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