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

#include "ohos_graphics_uieffect.h"

#define KOALA_INTEROP_MODULE OHOS_GRAPHICS_UIEFFECTNativeModule
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Array_Float64& value)
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_Array_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_Float64& value)
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_uiEffect_Filter* value) {
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_uiEffect_Filter& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FlyMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FlyMode value) {
    result->append("OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FlyMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiEffect_FlyMode* value) {
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_uiEffect_FlyMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_TileMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_TileMode value) {
    result->append("OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_TileMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiEffect_TileMode* value) {
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_uiEffect_TileMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Tuple_F64_F64_F64& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Tuple_F64_F64_F64* value) {
    result->append("{");
    // OH_Float64 value0
    result->append(".value0=");
    WriteToString(result, value->value0);
    // OH_Float64 value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, value->value1);
    // OH_Float64 value2
    result->append(", ");
    result->append(".value2=");
    WriteToString(result, value->value2);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiEffect_Tuple_F64_F64_F64* value) {
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_uiEffect_Tuple_F64_F64_F64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_uiEffect_VisualEffect* value) {
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_uiEffect_VisualEffect& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_WaterRippleMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_WaterRippleMode value) {
    result->append("OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_WaterRippleMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiEffect_WaterRippleMode* value) {
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_uiEffect_WaterRippleMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender* value) {
    result->append("{");
    // OH_Float64 cubicRate
    result->append(".cubicRate=");
    WriteToString(result, value->cubicRate);
    // OH_Float64 quadraticRate
    result->append(", ");
    result->append(".quadraticRate=");
    WriteToString(result, value->quadraticRate);
    // OH_Float64 linearRate
    result->append(", ");
    result->append(".linearRate=");
    WriteToString(result, value->linearRate);
    // OH_Float64 degree
    result->append(", ");
    result->append(".degree=");
    WriteToString(result, value->degree);
    // OH_Float64 saturation
    result->append(", ");
    result->append(".saturation=");
    WriteToString(result, value->saturation);
    // OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Tuple_F64_F64_F64 positiveCoefficient
    result->append(", ");
    result->append(".positiveCoefficient=");
    WriteToString(result, &value->positiveCoefficient);
    // OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Tuple_F64_F64_F64 negativeCoefficient
    result->append(", ");
    result->append(".negativeCoefficient=");
    WriteToString(result, &value->negativeCoefficient);
    // OH_Float64 fraction
    result->append(", ");
    result->append(".fraction=");
    WriteToString(result, value->fraction);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiEffect_BrightnessBlender* value) {
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_uiEffect_BrightnessBlender& value)
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
inline OH_OHOS_GRAPHICS_UIEFFECT_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class uiEffect_Filter_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter value);
    static OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter read(DeserializerBase& buffer);
};
class uiEffect_VisualEffect_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect value);
    static OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect read(DeserializerBase& buffer);
};
class uiEffect_BrightnessBlender_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender value);
    static OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender read(DeserializerBase& buffer);
};
inline void uiEffect_Filter_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter uiEffect_Filter_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Filter>(ptr);
}
inline void uiEffect_VisualEffect_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect uiEffect_VisualEffect_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_VisualEffect>(ptr);
}
inline void uiEffect_BrightnessBlender_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForCubicRate = value.cubicRate;
    valueSerializer.writeFloat64(valueHolderForCubicRate);
    const auto valueHolderForQuadraticRate = value.quadraticRate;
    valueSerializer.writeFloat64(valueHolderForQuadraticRate);
    const auto valueHolderForLinearRate = value.linearRate;
    valueSerializer.writeFloat64(valueHolderForLinearRate);
    const auto valueHolderForDegree = value.degree;
    valueSerializer.writeFloat64(valueHolderForDegree);
    const auto valueHolderForSaturation = value.saturation;
    valueSerializer.writeFloat64(valueHolderForSaturation);
    const auto valueHolderForPositiveCoefficient = value.positiveCoefficient;
    const auto valueHolderForPositiveCoefficient_0 = valueHolderForPositiveCoefficient.value0;
    valueSerializer.writeFloat64(valueHolderForPositiveCoefficient_0);
    const auto valueHolderForPositiveCoefficient_1 = valueHolderForPositiveCoefficient.value1;
    valueSerializer.writeFloat64(valueHolderForPositiveCoefficient_1);
    const auto valueHolderForPositiveCoefficient_2 = valueHolderForPositiveCoefficient.value2;
    valueSerializer.writeFloat64(valueHolderForPositiveCoefficient_2);
    const auto valueHolderForNegativeCoefficient = value.negativeCoefficient;
    const auto valueHolderForNegativeCoefficient_0 = valueHolderForNegativeCoefficient.value0;
    valueSerializer.writeFloat64(valueHolderForNegativeCoefficient_0);
    const auto valueHolderForNegativeCoefficient_1 = valueHolderForNegativeCoefficient.value1;
    valueSerializer.writeFloat64(valueHolderForNegativeCoefficient_1);
    const auto valueHolderForNegativeCoefficient_2 = valueHolderForNegativeCoefficient.value2;
    valueSerializer.writeFloat64(valueHolderForNegativeCoefficient_2);
    const auto valueHolderForFraction = value.fraction;
    valueSerializer.writeFloat64(valueHolderForFraction);
}
inline OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender uiEffect_BrightnessBlender_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.cubicRate = valueDeserializer.readFloat64();
    value.quadraticRate = valueDeserializer.readFloat64();
    value.linearRate = valueDeserializer.readFloat64();
    value.degree = valueDeserializer.readFloat64();
    value.saturation = valueDeserializer.readFloat64();
    OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Tuple_F64_F64_F64 positiveCoefficientTmpBuf = {};
    positiveCoefficientTmpBuf.value0 = valueDeserializer.readFloat64();
    positiveCoefficientTmpBuf.value1 = valueDeserializer.readFloat64();
    positiveCoefficientTmpBuf.value2 = valueDeserializer.readFloat64();
    value.positiveCoefficient = positiveCoefficientTmpBuf;
    OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_Tuple_F64_F64_F64 negativeCoefficientTmpBuf = {};
    negativeCoefficientTmpBuf.value0 = valueDeserializer.readFloat64();
    negativeCoefficientTmpBuf.value1 = valueDeserializer.readFloat64();
    negativeCoefficientTmpBuf.value2 = valueDeserializer.readFloat64();
    value.negativeCoefficient = negativeCoefficientTmpBuf;
    value.fraction = valueDeserializer.readFloat64();
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_GRAPHICS_UIEFFECT_API* GetOH_OHOS_GRAPHICS_UIEFFECT_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_GRAPHICS_UIEFFECT_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_GRAPHICS_UIEFFECT_APIKind::OH_OHOS_GRAPHICS_UIEFFECT_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_uiEffect_Filter_construct() {
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_Filter()->construct();
}
KOALA_INTEROP_DIRECT_0(uiEffect_Filter_construct, OH_NativePointer)
OH_NativePointer impl_uiEffect_Filter_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_Filter()->destruct;
}
KOALA_INTEROP_DIRECT_0(uiEffect_Filter_getFinalizer, OH_NativePointer)
OH_NativePointer impl_uiEffect_Filter_pixelStretch(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 tileMode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 stretchSizesValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Float64 stretchSizesValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(stretchSizesValueTempTmpBuf)>::type,
        std::decay<decltype(*stretchSizesValueTempTmpBuf.array)>::type>(&stretchSizesValueTempTmpBuf, stretchSizesValueTempTmpBufLength);
        for (int stretchSizesValueTempTmpBufBufCounterI = 0; stretchSizesValueTempTmpBufBufCounterI < stretchSizesValueTempTmpBufLength; stretchSizesValueTempTmpBufBufCounterI++) {
            stretchSizesValueTempTmpBuf.array[stretchSizesValueTempTmpBufBufCounterI] = thisDeserializer.readFloat64();
        }
        Array_Float64 stretchSizesValueTemp = stretchSizesValueTempTmpBuf;;
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_Filter()->pixelStretch(thisPtr, static_cast<Array_Float64*>(&stretchSizesValueTemp), static_cast<OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_TileMode>(tileMode));
}
KOALA_INTEROP_DIRECT_4(uiEffect_Filter_pixelStretch, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
OH_NativePointer impl_uiEffect_Filter_blur(OH_NativePointer thisPtr, KDouble blurRadius) {
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_Filter()->blur(thisPtr, blurRadius);
}
KOALA_INTEROP_2(uiEffect_Filter_blur, OH_NativePointer, OH_NativePointer, KDouble)
OH_NativePointer impl_uiEffect_Filter_waterRipple(OH_NativePointer thisPtr, KDouble progress, OH_Int32 waveCount, KDouble x, KDouble y, OH_Int32 rippleMode) {
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_Filter()->waterRipple(thisPtr, progress, waveCount, x, y, static_cast<OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_WaterRippleMode>(rippleMode));
}
KOALA_INTEROP_6(uiEffect_Filter_waterRipple, OH_NativePointer, OH_NativePointer, KDouble, OH_Int32, KDouble, KDouble, OH_Int32)
OH_NativePointer impl_uiEffect_Filter_flyInFlyOutEffect(OH_NativePointer thisPtr, KDouble degree, OH_Int32 flyMode) {
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_Filter()->flyInFlyOutEffect(thisPtr, degree, static_cast<OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_FlyMode>(flyMode));
}
KOALA_INTEROP_3(uiEffect_Filter_flyInFlyOutEffect, OH_NativePointer, OH_NativePointer, KDouble, OH_Int32)
OH_NativePointer impl_uiEffect_Filter_distort(OH_NativePointer thisPtr, KDouble distortionK) {
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_Filter()->distort(thisPtr, distortionK);
}
KOALA_INTEROP_2(uiEffect_Filter_distort, OH_NativePointer, OH_NativePointer, KDouble)
OH_NativePointer impl_uiEffect_VisualEffect_construct() {
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_VisualEffect()->construct();
}
KOALA_INTEROP_DIRECT_0(uiEffect_VisualEffect_construct, OH_NativePointer)
OH_NativePointer impl_uiEffect_VisualEffect_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_VisualEffect()->destruct;
}
KOALA_INTEROP_DIRECT_0(uiEffect_VisualEffect_getFinalizer, OH_NativePointer)
OH_NativePointer impl_uiEffect_VisualEffect_backgroundColorBlender(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender blenderValueTemp = uiEffect_BrightnessBlender_serializer::read(thisDeserializer);;
        return GetOH_OHOS_GRAPHICS_UIEFFECT_API(OHOS_GRAPHICS_UIEFFECT_API_VERSION)->UiEffect_VisualEffect()->backgroundColorBlender(thisPtr, static_cast<OH_OHOS_GRAPHICS_UIEFFECT_uiEffect_BrightnessBlender*>(&blenderValueTemp));
}
KOALA_INTEROP_DIRECT_3(uiEffect_VisualEffect_backgroundColorBlender, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_GRAPHICS_UIEFFECT_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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