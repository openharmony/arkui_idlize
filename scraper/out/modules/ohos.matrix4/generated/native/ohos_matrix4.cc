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

#include "ohos_matrix4.h"

#define KOALA_INTEROP_MODULE OHOS_MATRIX4NativeModule
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Array_matrix4_Point& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_Point* value);

template <>
inline void WriteToString(std::string* result, const Array_matrix4_Point* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_MATRIX4_matrix4_Point, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_MATRIX4_matrix4_Point*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_matrix4_Point* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_Array_matrix4_Point& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_OHOS_MATRIX4_matrix4_Matrix4Transit& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_Matrix4Transit value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_matrix4_Matrix4Transit* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_matrix4_Matrix4Transit& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_OHOS_MATRIX4_matrix4_Point& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_Point* value) {
    result->append("{");
    // OH_Number x
    result->append(".x=");
    WriteToString(result, &value->x);
    // OH_Number y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, &value->y);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_matrix4_Point* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_matrix4_Point& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number* value) {
    result->append("{");
    // OH_Number value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    // OH_Number value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, &value->value1);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_matrix4_Tuple_Number_Number* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_matrix4_Tuple_Number_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions* value) {
    result->append("{");
    // Array_matrix4_Point src
    result->append(".src=");
    WriteToString(result, &value->src);
    // OH_Number srcIndex
    result->append(", ");
    result->append(".srcIndex=");
    WriteToString(result, &value->srcIndex);
    // Array_matrix4_Point dst
    result->append(", ");
    result->append(".dst=");
    WriteToString(result, &value->dst);
    // OH_Number dstIndex
    result->append(", ");
    result->append(".dstIndex=");
    WriteToString(result, &value->dstIndex);
    // OH_Number pointCount
    result->append(", ");
    result->append(".pointCount=");
    WriteToString(result, &value->pointCount);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_matrix4_PolyToPolyOptions* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_matrix4_PolyToPolyOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_OHOS_MATRIX4_matrix4_RotateOption& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_RotateOption* value) {
    result->append("{");
    // OH_Number x
    result->append(".x=");
    WriteToString(result, &value->x);
    // OH_Number y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, &value->y);
    // OH_Number z
    result->append(", ");
    result->append(".z=");
    WriteToString(result, &value->z);
    // OH_Number centerX
    result->append(", ");
    result->append(".centerX=");
    WriteToString(result, &value->centerX);
    // OH_Number centerY
    result->append(", ");
    result->append(".centerY=");
    WriteToString(result, &value->centerY);
    // OH_Number angle
    result->append(", ");
    result->append(".angle=");
    WriteToString(result, &value->angle);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_matrix4_RotateOption* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_matrix4_RotateOption& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_OHOS_MATRIX4_matrix4_ScaleOption& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_ScaleOption* value) {
    result->append("{");
    // OH_Number x
    result->append(".x=");
    WriteToString(result, &value->x);
    // OH_Number y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, &value->y);
    // OH_Number z
    result->append(", ");
    result->append(".z=");
    WriteToString(result, &value->z);
    // OH_Number centerX
    result->append(", ");
    result->append(".centerX=");
    WriteToString(result, &value->centerX);
    // OH_Number centerY
    result->append(", ");
    result->append(".centerY=");
    WriteToString(result, &value->centerY);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_matrix4_ScaleOption* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_matrix4_ScaleOption& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const OH_OHOS_MATRIX4_matrix4_TranslateOption& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_MATRIX4_matrix4_TranslateOption* value) {
    result->append("{");
    // OH_Number x
    result->append(".x=");
    WriteToString(result, &value->x);
    // OH_Number y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, &value->y);
    // OH_Number z
    result->append(", ");
    result->append(".z=");
    WriteToString(result, &value->z);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_matrix4_TranslateOption* value) {
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_matrix4_TranslateOption& value)
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
inline OH_OHOS_MATRIX4_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class matrix4_Matrix4Transit_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_Matrix4Transit value);
    static OH_OHOS_MATRIX4_matrix4_Matrix4Transit read(DeserializerBase& buffer);
};
class matrix4_Point_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_Point value);
    static OH_OHOS_MATRIX4_matrix4_Point read(DeserializerBase& buffer);
};
class matrix4_PolyToPolyOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions value);
    static OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions read(DeserializerBase& buffer);
};
class matrix4_RotateOption_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_RotateOption value);
    static OH_OHOS_MATRIX4_matrix4_RotateOption read(DeserializerBase& buffer);
};
class matrix4_ScaleOption_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_ScaleOption value);
    static OH_OHOS_MATRIX4_matrix4_ScaleOption read(DeserializerBase& buffer);
};
class matrix4_TranslateOption_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_TranslateOption value);
    static OH_OHOS_MATRIX4_matrix4_TranslateOption read(DeserializerBase& buffer);
};
inline void matrix4_Matrix4Transit_serializer::write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_Matrix4Transit value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_MATRIX4_matrix4_Matrix4Transit matrix4_Matrix4Transit_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_MATRIX4_matrix4_Matrix4Transit>(ptr);
}
inline void matrix4_Point_serializer::write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_Point value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    valueSerializer.writeNumber(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeNumber(valueHolderForY);
}
inline OH_OHOS_MATRIX4_matrix4_Point matrix4_Point_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MATRIX4_matrix4_Point value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.x = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.y = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void matrix4_PolyToPolyOptions_serializer::write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForSrc = value.src;
    valueSerializer.writeInt32(valueHolderForSrc.length);
    for (int valueHolderForSrcCounterI = 0; valueHolderForSrcCounterI < valueHolderForSrc.length; valueHolderForSrcCounterI++) {
        const OH_OHOS_MATRIX4_matrix4_Point valueHolderForSrcTmpElement = valueHolderForSrc.array[valueHolderForSrcCounterI];
        matrix4_Point_serializer::write(valueSerializer, valueHolderForSrcTmpElement);
    }
    const auto valueHolderForSrcIndex = value.srcIndex;
    if (runtimeType(valueHolderForSrcIndex) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForSrcIndexTmpValue = valueHolderForSrcIndex.value;
        valueSerializer.writeNumber(valueHolderForSrcIndexTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDst = value.dst;
    valueSerializer.writeInt32(valueHolderForDst.length);
    for (int valueHolderForDstCounterI = 0; valueHolderForDstCounterI < valueHolderForDst.length; valueHolderForDstCounterI++) {
        const OH_OHOS_MATRIX4_matrix4_Point valueHolderForDstTmpElement = valueHolderForDst.array[valueHolderForDstCounterI];
        matrix4_Point_serializer::write(valueSerializer, valueHolderForDstTmpElement);
    }
    const auto valueHolderForDstIndex = value.dstIndex;
    if (runtimeType(valueHolderForDstIndex) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDstIndexTmpValue = valueHolderForDstIndex.value;
        valueSerializer.writeNumber(valueHolderForDstIndexTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPointCount = value.pointCount;
    if (runtimeType(valueHolderForPointCount) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPointCountTmpValue = valueHolderForPointCount.value;
        valueSerializer.writeNumber(valueHolderForPointCountTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions matrix4_PolyToPolyOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int32 srcTmpBufLength = valueDeserializer.readInt32();
    Array_matrix4_Point srcTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(srcTmpBuf)>::type,
        std::decay<decltype(*srcTmpBuf.array)>::type>(&srcTmpBuf, srcTmpBufLength);
    for (int srcTmpBufBufCounterI = 0; srcTmpBufBufCounterI < srcTmpBufLength; srcTmpBufBufCounterI++) {
        srcTmpBuf.array[srcTmpBufBufCounterI] = matrix4_Point_serializer::read(valueDeserializer);
    }
    value.src = srcTmpBuf;
    const auto srcIndexTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number srcIndexTmpBuf = {};
    srcIndexTmpBuf.tag = srcIndexTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((srcIndexTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        srcIndexTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.srcIndex = srcIndexTmpBuf;
    const OH_Int32 dstTmpBufLength = valueDeserializer.readInt32();
    Array_matrix4_Point dstTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(dstTmpBuf)>::type,
        std::decay<decltype(*dstTmpBuf.array)>::type>(&dstTmpBuf, dstTmpBufLength);
    for (int dstTmpBufBufCounterI = 0; dstTmpBufBufCounterI < dstTmpBufLength; dstTmpBufBufCounterI++) {
        dstTmpBuf.array[dstTmpBufBufCounterI] = matrix4_Point_serializer::read(valueDeserializer);
    }
    value.dst = dstTmpBuf;
    const auto dstIndexTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number dstIndexTmpBuf = {};
    dstIndexTmpBuf.tag = dstIndexTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dstIndexTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dstIndexTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.dstIndex = dstIndexTmpBuf;
    const auto pointCountTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number pointCountTmpBuf = {};
    pointCountTmpBuf.tag = pointCountTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pointCountTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        pointCountTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.pointCount = pointCountTmpBuf;
    return value;
}
inline void matrix4_RotateOption_serializer::write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_RotateOption value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    if (runtimeType(valueHolderForX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForXTmpValue = valueHolderForX.value;
        valueSerializer.writeNumber(valueHolderForXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForY = value.y;
    if (runtimeType(valueHolderForY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForYTmpValue = valueHolderForY.value;
        valueSerializer.writeNumber(valueHolderForYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForZ = value.z;
    if (runtimeType(valueHolderForZ) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForZTmpValue = valueHolderForZ.value;
        valueSerializer.writeNumber(valueHolderForZTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCenterX = value.centerX;
    if (runtimeType(valueHolderForCenterX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCenterXTmpValue = valueHolderForCenterX.value;
        valueSerializer.writeNumber(valueHolderForCenterXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCenterY = value.centerY;
    if (runtimeType(valueHolderForCenterY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCenterYTmpValue = valueHolderForCenterY.value;
        valueSerializer.writeNumber(valueHolderForCenterYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAngle = value.angle;
    if (runtimeType(valueHolderForAngle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAngleTmpValue = valueHolderForAngle.value;
        valueSerializer.writeNumber(valueHolderForAngleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_MATRIX4_matrix4_RotateOption matrix4_RotateOption_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MATRIX4_matrix4_RotateOption value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto xTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number xTmpBuf = {};
    xTmpBuf.tag = xTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((xTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        xTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.x = xTmpBuf;
    const auto yTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number yTmpBuf = {};
    yTmpBuf.tag = yTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((yTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        yTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.y = yTmpBuf;
    const auto zTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number zTmpBuf = {};
    zTmpBuf.tag = zTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((zTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        zTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.z = zTmpBuf;
    const auto centerXTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number centerXTmpBuf = {};
    centerXTmpBuf.tag = centerXTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((centerXTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        centerXTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.centerX = centerXTmpBuf;
    const auto centerYTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number centerYTmpBuf = {};
    centerYTmpBuf.tag = centerYTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((centerYTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        centerYTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.centerY = centerYTmpBuf;
    const auto angleTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number angleTmpBuf = {};
    angleTmpBuf.tag = angleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((angleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        angleTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.angle = angleTmpBuf;
    return value;
}
inline void matrix4_ScaleOption_serializer::write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_ScaleOption value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    if (runtimeType(valueHolderForX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForXTmpValue = valueHolderForX.value;
        valueSerializer.writeNumber(valueHolderForXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForY = value.y;
    if (runtimeType(valueHolderForY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForYTmpValue = valueHolderForY.value;
        valueSerializer.writeNumber(valueHolderForYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForZ = value.z;
    if (runtimeType(valueHolderForZ) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForZTmpValue = valueHolderForZ.value;
        valueSerializer.writeNumber(valueHolderForZTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCenterX = value.centerX;
    if (runtimeType(valueHolderForCenterX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCenterXTmpValue = valueHolderForCenterX.value;
        valueSerializer.writeNumber(valueHolderForCenterXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCenterY = value.centerY;
    if (runtimeType(valueHolderForCenterY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCenterYTmpValue = valueHolderForCenterY.value;
        valueSerializer.writeNumber(valueHolderForCenterYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_MATRIX4_matrix4_ScaleOption matrix4_ScaleOption_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MATRIX4_matrix4_ScaleOption value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto xTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number xTmpBuf = {};
    xTmpBuf.tag = xTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((xTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        xTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.x = xTmpBuf;
    const auto yTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number yTmpBuf = {};
    yTmpBuf.tag = yTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((yTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        yTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.y = yTmpBuf;
    const auto zTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number zTmpBuf = {};
    zTmpBuf.tag = zTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((zTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        zTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.z = zTmpBuf;
    const auto centerXTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number centerXTmpBuf = {};
    centerXTmpBuf.tag = centerXTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((centerXTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        centerXTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.centerX = centerXTmpBuf;
    const auto centerYTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number centerYTmpBuf = {};
    centerYTmpBuf.tag = centerYTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((centerYTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        centerYTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.centerY = centerYTmpBuf;
    return value;
}
inline void matrix4_TranslateOption_serializer::write(SerializerBase& buffer, OH_OHOS_MATRIX4_matrix4_TranslateOption value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    if (runtimeType(valueHolderForX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForXTmpValue = valueHolderForX.value;
        valueSerializer.writeNumber(valueHolderForXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForY = value.y;
    if (runtimeType(valueHolderForY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForYTmpValue = valueHolderForY.value;
        valueSerializer.writeNumber(valueHolderForYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForZ = value.z;
    if (runtimeType(valueHolderForZ) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForZTmpValue = valueHolderForZ.value;
        valueSerializer.writeNumber(valueHolderForZTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_MATRIX4_matrix4_TranslateOption matrix4_TranslateOption_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_MATRIX4_matrix4_TranslateOption value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto xTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number xTmpBuf = {};
    xTmpBuf.tag = xTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((xTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        xTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.x = xTmpBuf;
    const auto yTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number yTmpBuf = {};
    yTmpBuf.tag = yTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((yTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        yTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.y = yTmpBuf;
    const auto zTmpBuf_runtimeType = static_cast<OH_OHOS_MATRIX4_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number zTmpBuf = {};
    zTmpBuf.tag = zTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((zTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        zTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.z = zTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_MATRIX4_API* GetOH_OHOS_MATRIX4_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_MATRIX4_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_MATRIX4_APIKind::OH_OHOS_MATRIX4_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_matrix4_Matrix4Transit_construct() {
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->construct();
}
KOALA_INTEROP_DIRECT_0(matrix4_Matrix4Transit_construct, OH_NativePointer)
OH_NativePointer impl_matrix4_Matrix4Transit_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->destruct;
}
KOALA_INTEROP_DIRECT_0(matrix4_Matrix4Transit_getFinalizer, OH_NativePointer)
OH_NativePointer impl_matrix4_Matrix4Transit_copy(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->copy(thisPtr);
}
KOALA_INTEROP_DIRECT_1(matrix4_Matrix4Transit_copy, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_matrix4_Matrix4Transit_invert(OH_NativePointer thisPtr) {
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->invert(thisPtr);
}
KOALA_INTEROP_DIRECT_1(matrix4_Matrix4Transit_invert, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_matrix4_Matrix4Transit_combine(OH_NativePointer thisPtr, OH_NativePointer options) {
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->combine(thisPtr, static_cast<OH_OHOS_MATRIX4_matrix4_Matrix4Transit>(options));
}
KOALA_INTEROP_DIRECT_2(matrix4_Matrix4Transit_combine, OH_NativePointer, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_matrix4_Matrix4Transit_translate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MATRIX4_matrix4_TranslateOption optionsValueTemp = matrix4_TranslateOption_serializer::read(thisDeserializer);;
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->translate(thisPtr, static_cast<OH_OHOS_MATRIX4_matrix4_TranslateOption*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_translate, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_matrix4_Matrix4Transit_scale(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MATRIX4_matrix4_ScaleOption optionsValueTemp = matrix4_ScaleOption_serializer::read(thisDeserializer);;
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->scale(thisPtr, static_cast<OH_OHOS_MATRIX4_matrix4_ScaleOption*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_scale, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_matrix4_Matrix4Transit_skew(OH_NativePointer thisPtr, KInteropNumber x, KInteropNumber y) {
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->skew(thisPtr, (const OH_Number*) (&x), (const OH_Number*) (&y));
}
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_skew, OH_NativePointer, OH_NativePointer, KInteropNumber, KInteropNumber)
OH_NativePointer impl_matrix4_Matrix4Transit_rotate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MATRIX4_matrix4_RotateOption optionsValueTemp = matrix4_RotateOption_serializer::read(thisDeserializer);;
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->rotate(thisPtr, static_cast<OH_OHOS_MATRIX4_matrix4_RotateOption*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_rotate, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_matrix4_Matrix4Transit_transformPoint(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.value0 = static_cast<OH_Number>(thisDeserializer.readNumber());
        optionsValueTempTmpBuf.value1 = static_cast<OH_Number>(thisDeserializer.readNumber());
        OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number optionsValueTemp = optionsValueTempTmpBuf;;
        const auto &retValue = GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->transformPoint(thisPtr, static_cast<OH_OHOS_MATRIX4_matrix4_Tuple_Number_Number*>(&optionsValueTemp));
        SerializerBase _retSerializer {};
        const auto retValue_0 = retValue.value0;
        _retSerializer.writeNumber(retValue_0);
        const auto retValue_1 = retValue.value1;
        _retSerializer.writeNumber(retValue_1);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_3(matrix4_Matrix4Transit_transformPoint, KInteropReturnBuffer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_matrix4_Matrix4Transit_setPolyToPoly(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions optionsValueTemp = matrix4_PolyToPolyOptions_serializer::read(thisDeserializer);;
        return GetOH_OHOS_MATRIX4_API(OHOS_MATRIX4_API_VERSION)->Matrix4_Matrix4Transit()->setPolyToPoly(thisPtr, static_cast<OH_OHOS_MATRIX4_matrix4_PolyToPolyOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_3(matrix4_Matrix4Transit_setPolyToPoly, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_MATRIX4_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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