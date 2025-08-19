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

#include "ohos_animator.h"

#define KOALA_INTEROP_MODULE OHOS_ANIMATORNativeModule
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
    Kind_Callback_Number_Void = 36519084,
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_Int32& value)
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OH_OHOS_ANIMATOR_SimpleAnimatorOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ANIMATOR_SimpleAnimatorOptions value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_SimpleAnimatorOptions* value) {
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_SimpleAnimatorOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OHOS_ANIMATOR_Callback_Number_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ANIMATOR_Callback_Number_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ANIMATOR_Callback_Number_Void* value) {
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_OHOS_ANIMATOR_Callback_Number_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OHOS_ANIMATOR_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ANIMATOR_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ANIMATOR_Callback_Void* value) {
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_OHOS_ANIMATOR_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OH_OHOS_ANIMATOR_AnimatorOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ANIMATOR_AnimatorOptions* value) {
    result->append("{");
    // OH_Number duration
    result->append(".duration=");
    WriteToString(result, &value->duration);
    // OH_String easing
    result->append(", ");
    result->append(".easing=");
    WriteToString(result, &value->easing);
    // OH_Number delay
    result->append(", ");
    result->append(".delay=");
    WriteToString(result, &value->delay);
    // OH_String fill
    result->append(", ");
    result->append(".fill=");
    WriteToString(result, &value->fill);
    // OH_String direction
    result->append(", ");
    result->append(".direction=");
    WriteToString(result, &value->direction);
    // OH_Number iterations
    result->append(", ");
    result->append(".iterations=");
    WriteToString(result, &value->iterations);
    // OH_Number begin
    result->append(", ");
    result->append(".begin=");
    WriteToString(result, &value->begin);
    // OH_Number end
    result->append(", ");
    result->append(".end=");
    WriteToString(result, &value->end);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_AnimatorOptions* value) {
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_AnimatorOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OH_OHOS_ANIMATOR_AnimatorResult& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ANIMATOR_AnimatorResult value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_AnimatorResult* value) {
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_AnimatorResult& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_ANIMATOR_AnimatorOptions
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_ANIMATOR_SimpleAnimatorOptions
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_AnimatorOptions_SimpleAnimatorOptions* value) {
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_Union_AnimatorOptions_SimpleAnimatorOptions& value)
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
inline OH_OHOS_ANIMATOR_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class SimpleAnimatorOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ANIMATOR_SimpleAnimatorOptions value);
    static OH_OHOS_ANIMATOR_SimpleAnimatorOptions read(DeserializerBase& buffer);
};
class AnimatorOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ANIMATOR_AnimatorOptions value);
    static OH_OHOS_ANIMATOR_AnimatorOptions read(DeserializerBase& buffer);
};
class AnimatorResult_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ANIMATOR_AnimatorResult value);
    static OH_OHOS_ANIMATOR_AnimatorResult read(DeserializerBase& buffer);
};
inline void SimpleAnimatorOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ANIMATOR_SimpleAnimatorOptions value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ANIMATOR_SimpleAnimatorOptions SimpleAnimatorOptions_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ANIMATOR_SimpleAnimatorOptions>(ptr);
}
inline void AnimatorOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ANIMATOR_AnimatorOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForDuration = value.duration;
    valueSerializer.writeNumber(valueHolderForDuration);
    const auto valueHolderForEasing = value.easing;
    valueSerializer.writeString(valueHolderForEasing);
    const auto valueHolderForDelay = value.delay;
    valueSerializer.writeNumber(valueHolderForDelay);
    const auto valueHolderForFill = value.fill;
    valueSerializer.writeString(valueHolderForFill);
    const auto valueHolderForDirection = value.direction;
    valueSerializer.writeString(valueHolderForDirection);
    const auto valueHolderForIterations = value.iterations;
    valueSerializer.writeNumber(valueHolderForIterations);
    const auto valueHolderForBegin = value.begin;
    valueSerializer.writeNumber(valueHolderForBegin);
    const auto valueHolderForEnd = value.end;
    valueSerializer.writeNumber(valueHolderForEnd);
}
inline OH_OHOS_ANIMATOR_AnimatorOptions AnimatorOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ANIMATOR_AnimatorOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.duration = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.easing = static_cast<OH_String>(valueDeserializer.readString());
    value.delay = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.fill = static_cast<OH_String>(valueDeserializer.readString());
    value.direction = static_cast<OH_String>(valueDeserializer.readString());
    value.iterations = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.begin = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.end = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void AnimatorResult_serializer::write(SerializerBase& buffer, OH_OHOS_ANIMATOR_AnimatorResult value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ANIMATOR_AnimatorResult AnimatorResult_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ANIMATOR_AnimatorResult>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_ANIMATOR_API* GetOH_OHOS_ANIMATOR_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_ANIMATOR_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_ANIMATOR_APIKind::OH_OHOS_ANIMATOR_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_AnimatorResult_construct() {
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->construct();
}
KOALA_INTEROP_DIRECT_0(AnimatorResult_construct, OH_NativePointer)
OH_NativePointer impl_AnimatorResult_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->destruct;
}
KOALA_INTEROP_DIRECT_0(AnimatorResult_getFinalizer, OH_NativePointer)
void impl_AnimatorResult_reset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 optionsValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.selector = optionsValueTempTmpBufUnionSelector;
        if (optionsValueTempTmpBufUnionSelector == 0) {
            optionsValueTempTmpBuf.selector = 0;
            optionsValueTempTmpBuf.value0 = AnimatorOptions_serializer::read(thisDeserializer);
        } else if (optionsValueTempTmpBufUnionSelector == 1) {
            optionsValueTempTmpBuf.selector = 1;
            optionsValueTempTmpBuf.value1 = static_cast<OH_OHOS_ANIMATOR_SimpleAnimatorOptions>(SimpleAnimatorOptions_serializer::read(thisDeserializer));
        } else {
            INTEROP_FATAL("One of the branches for optionsValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions optionsValueTemp = static_cast<OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions>(optionsValueTempTmpBuf);;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->reset(thisPtr, static_cast<OH_OHOS_ANIMATOR_Union_AnimatorOptions_SimpleAnimatorOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AnimatorResult_reset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_AnimatorResult_play(OH_NativePointer thisPtr) {
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->play(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(AnimatorResult_play, OH_NativePointer)
void impl_AnimatorResult_finish(OH_NativePointer thisPtr) {
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->finish(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(AnimatorResult_finish, OH_NativePointer)
void impl_AnimatorResult_pause(OH_NativePointer thisPtr) {
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->pause(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(AnimatorResult_pause, OH_NativePointer)
void impl_AnimatorResult_cancel(OH_NativePointer thisPtr) {
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->cancel(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(AnimatorResult_cancel, OH_NativePointer)
void impl_AnimatorResult_reverse(OH_NativePointer thisPtr) {
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->reverse(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(AnimatorResult_reverse, OH_NativePointer)
void impl_AnimatorResult_setExpectedFrameRateRange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject rateRangeValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->setExpectedFrameRateRange(thisPtr, static_cast<OH_CustomObject*>(&rateRangeValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setExpectedFrameRateRange, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_AnimatorResult_getOnFrame(OH_NativePointer thisPtr) {
        [[maybe_unused]] const auto &_api_call_result = GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->getOnFrame(thisPtr);
        // TODO: Value serialization needs to be implemented
        return {};
}
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnFrame, OH_NativePointer, OH_NativePointer)
void impl_AnimatorResult_setOnFrame(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ANIMATOR_Callback_Number_Void onFrameValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Number progress)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Number_Void)))), reinterpret_cast<void(*)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId, const OH_Number progress)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Number_Void))))};;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->setOnFrame(thisPtr, static_cast<OHOS_ANIMATOR_Callback_Number_Void*>(&onFrameValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnFrame, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_AnimatorResult_getOnFinish(OH_NativePointer thisPtr) {
        [[maybe_unused]] const auto &_api_call_result = GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->getOnFinish(thisPtr);
        // TODO: Value serialization needs to be implemented
        return {};
}
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnFinish, OH_NativePointer, OH_NativePointer)
void impl_AnimatorResult_setOnFinish(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ANIMATOR_Callback_Void onFinishValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->setOnFinish(thisPtr, static_cast<OHOS_ANIMATOR_Callback_Void*>(&onFinishValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnFinish, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_AnimatorResult_getOnCancel(OH_NativePointer thisPtr) {
        [[maybe_unused]] const auto &_api_call_result = GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->getOnCancel(thisPtr);
        // TODO: Value serialization needs to be implemented
        return {};
}
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnCancel, OH_NativePointer, OH_NativePointer)
void impl_AnimatorResult_setOnCancel(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ANIMATOR_Callback_Void onCancelValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->setOnCancel(thisPtr, static_cast<OHOS_ANIMATOR_Callback_Void*>(&onCancelValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnCancel, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_AnimatorResult_getOnRepeat(OH_NativePointer thisPtr) {
        [[maybe_unused]] const auto &_api_call_result = GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->getOnRepeat(thisPtr);
        // TODO: Value serialization needs to be implemented
        return {};
}
KOALA_INTEROP_DIRECT_1(AnimatorResult_getOnRepeat, OH_NativePointer, OH_NativePointer)
void impl_AnimatorResult_setOnRepeat(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ANIMATOR_Callback_Void onRepeatValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->AnimatorResult()->setOnRepeat(thisPtr, static_cast<OHOS_ANIMATOR_Callback_Void*>(&onRepeatValueTemp));
}
KOALA_INTEROP_DIRECT_V3(AnimatorResult_setOnRepeat, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_SimpleAnimatorOptions_construct(KInteropNumber begin, KInteropNumber end) {
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->construct((const OH_Number*) (&begin), (const OH_Number*) (&end));
}
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_construct, OH_NativePointer, KInteropNumber, KInteropNumber)
OH_NativePointer impl_SimpleAnimatorOptions_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->destruct;
}
KOALA_INTEROP_DIRECT_0(SimpleAnimatorOptions_getFinalizer, OH_NativePointer)
OH_NativePointer impl_SimpleAnimatorOptions_duration(OH_NativePointer thisPtr, KInteropNumber duration) {
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->duration(thisPtr, (const OH_Number*) (&duration));
}
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_duration, OH_NativePointer, OH_NativePointer, KInteropNumber)
OH_NativePointer impl_SimpleAnimatorOptions_easing(OH_NativePointer thisPtr, const KStringPtr& curve) {
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->easing(thisPtr, (const OH_String*) (&curve));
}
KOALA_INTEROP_2(SimpleAnimatorOptions_easing, OH_NativePointer, OH_NativePointer, KStringPtr)
OH_NativePointer impl_SimpleAnimatorOptions_delay(OH_NativePointer thisPtr, KInteropNumber delay) {
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->delay(thisPtr, (const OH_Number*) (&delay));
}
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_delay, OH_NativePointer, OH_NativePointer, KInteropNumber)
OH_NativePointer impl_SimpleAnimatorOptions_fill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject fillModeValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->fill(thisPtr, static_cast<OH_CustomObject*>(&fillModeValueTemp));
}
KOALA_INTEROP_DIRECT_3(SimpleAnimatorOptions_fill, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_SimpleAnimatorOptions_direction(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject directionValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->direction(thisPtr, static_cast<OH_CustomObject*>(&directionValueTemp));
}
KOALA_INTEROP_DIRECT_3(SimpleAnimatorOptions_direction, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_SimpleAnimatorOptions_iterations(OH_NativePointer thisPtr, KInteropNumber iterations) {
        return GetOH_OHOS_ANIMATOR_API(OHOS_ANIMATOR_API_VERSION)->SimpleAnimatorOptions()->iterations(thisPtr, (const OH_Number*) (&iterations));
}
KOALA_INTEROP_DIRECT_2(SimpleAnimatorOptions_iterations, OH_NativePointer, OH_NativePointer, KInteropNumber)
void deserializeAndCallCallback_Number_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Number progress)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Number_Void))));
    thisDeserializer.readPointer();
    OH_Number progress = static_cast<OH_Number>(thisDeserializer.readNumber());
    _call(_resourceId, progress);
}
void deserializeAndCallSyncCallback_Number_Void(OH_OHOS_ANIMATOR_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId, const OH_Number progress)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Number_Void))));
    OH_Number progress = static_cast<OH_Number>(thisDeserializer.readNumber());
    callSyncMethod(vmContext, resourceId, progress);
}
void deserializeAndCallCallback_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void))));
    thisDeserializer.readPointer();
    _call(_resourceId);
}
void deserializeAndCallSyncCallback_Void(OH_OHOS_ANIMATOR_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ANIMATOR_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_Number_Void: return deserializeAndCallCallback_Number_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_ANIMATOR_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_Number_Void: return deserializeAndCallSyncCallback_Number_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_Number_Void(OH_Int32 resourceId, OH_Number progress)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ANIMATOR_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Number_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeNumber(progress);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Number_VoidSync(OH_OHOS_ANIMATOR_VMContext vmContext, OH_Int32 resourceId, OH_Number progress)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Number_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeNumber(progress);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Void(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ANIMATOR_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_ANIMATOR_VMContext vmContext, OH_Int32 resourceId)
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
        case Kind_Callback_Number_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Number_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_Number_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Number_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}