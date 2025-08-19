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

#include "ohos_graphics_drawing.h"

#define KOALA_INTEROP_MODULE OHOS_GRAPHICS_DRAWINGNativeModule
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Array_common2D_Color& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_common2D_Color* value);

template <>
inline void WriteToString(std::string* result, const Array_common2D_Color* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_GRAPHICS_DRAWING_common2D_Color, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_GRAPHICS_DRAWING_common2D_Color*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_common2D_Color* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Array_common2D_Color& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Array_drawing_RectType& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_RectType value);

template <>
inline void WriteToString(std::string* result, const Array_drawing_RectType* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_GRAPHICS_DRAWING_drawing_RectType, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_drawing_RectType* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Array_drawing_RectType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Array_Float64& value)
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Array_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Array_Int32& value)
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Array_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_Float64& value)
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_common2D_Color& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_common2D_Color* value) {
    result->append("{");
    // OH_Int32 alpha
    result->append(".alpha=");
    WriteToString(result, value->alpha);
    // OH_Int32 red
    result->append(", ");
    result->append(".red=");
    WriteToString(result, value->red);
    // OH_Int32 green
    result->append(", ");
    result->append(".green=");
    WriteToString(result, value->green);
    // OH_Int32 blue
    result->append(", ");
    result->append(".blue=");
    WriteToString(result, value->blue);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_common2D_Color* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_common2D_Color& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_common2D_Rect* value) {
    result->append("{");
    // OH_Float64 left
    result->append(".left=");
    WriteToString(result, value->left);
    // OH_Float64 top
    result->append(", ");
    result->append(".top=");
    WriteToString(result, value->top);
    // OH_Float64 right
    result->append(", ");
    result->append(".right=");
    WriteToString(result, value->right);
    // OH_Float64 bottom
    result->append(", ");
    result->append(".bottom=");
    WriteToString(result, value->bottom);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_common2D_Rect* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_common2D_Rect& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode value) {
    result->append("OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_BlendMode* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_BlendMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_Brush& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_Brush value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_Brush* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_Brush& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_Canvas* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_Canvas& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_ColorFilter* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_ColorFilter& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode value) {
    result->append("OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_FilterMode* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_FilterMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_Lattice* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_Lattice& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_RectType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_RectType value) {
    result->append("OH_OHOS_GRAPHICS_DRAWING_drawing_RectType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_RectType* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_RectType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_drawing_SamplingOptions* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_drawing_SamplingOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_image_PixelMap value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_GRAPHICS_DRAWING_common2D_Color
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_Int32
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_Common2D_Color_I32* value) {
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Union_Common2D_Color_I32& value)
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
inline OH_OHOS_GRAPHICS_DRAWING_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class common2D_Color_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_common2D_Color value);
    static OH_OHOS_GRAPHICS_DRAWING_common2D_Color read(DeserializerBase& buffer);
};
class common2D_Rect_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_common2D_Rect value);
    static OH_OHOS_GRAPHICS_DRAWING_common2D_Rect read(DeserializerBase& buffer);
};
class drawing_Brush_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_Brush value);
    static OH_OHOS_GRAPHICS_DRAWING_drawing_Brush read(DeserializerBase& buffer);
};
class drawing_Canvas_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas value);
    static OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas read(DeserializerBase& buffer);
};
class drawing_ColorFilter_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter value);
    static OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter read(DeserializerBase& buffer);
};
class drawing_Lattice_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice value);
    static OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice read(DeserializerBase& buffer);
};
class drawing_SamplingOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions value);
    static OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions read(DeserializerBase& buffer);
};
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap value);
    static OH_OHOS_GRAPHICS_DRAWING_image_PixelMap read(DeserializerBase& buffer);
};
inline void common2D_Color_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_common2D_Color value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForAlpha = value.alpha;
    valueSerializer.writeInt32(valueHolderForAlpha);
    const auto valueHolderForRed = value.red;
    valueSerializer.writeInt32(valueHolderForRed);
    const auto valueHolderForGreen = value.green;
    valueSerializer.writeInt32(valueHolderForGreen);
    const auto valueHolderForBlue = value.blue;
    valueSerializer.writeInt32(valueHolderForBlue);
}
inline OH_OHOS_GRAPHICS_DRAWING_common2D_Color common2D_Color_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_GRAPHICS_DRAWING_common2D_Color value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.alpha = valueDeserializer.readInt32();
    value.red = valueDeserializer.readInt32();
    value.green = valueDeserializer.readInt32();
    value.blue = valueDeserializer.readInt32();
    return value;
}
inline void common2D_Rect_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_common2D_Rect value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForLeft = value.left;
    valueSerializer.writeFloat64(valueHolderForLeft);
    const auto valueHolderForTop = value.top;
    valueSerializer.writeFloat64(valueHolderForTop);
    const auto valueHolderForRight = value.right;
    valueSerializer.writeFloat64(valueHolderForRight);
    const auto valueHolderForBottom = value.bottom;
    valueSerializer.writeFloat64(valueHolderForBottom);
}
inline OH_OHOS_GRAPHICS_DRAWING_common2D_Rect common2D_Rect_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_GRAPHICS_DRAWING_common2D_Rect value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.left = valueDeserializer.readFloat64();
    value.top = valueDeserializer.readFloat64();
    value.right = valueDeserializer.readFloat64();
    value.bottom = valueDeserializer.readFloat64();
    return value;
}
inline void drawing_Brush_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_Brush value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_DRAWING_drawing_Brush drawing_Brush_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_Brush>(ptr);
}
inline void drawing_Canvas_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas drawing_Canvas_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_Canvas>(ptr);
}
inline void drawing_ColorFilter_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter drawing_ColorFilter_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_ColorFilter>(ptr);
}
inline void drawing_Lattice_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice drawing_Lattice_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_Lattice>(ptr);
}
inline void drawing_SamplingOptions_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions drawing_SamplingOptions_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions>(ptr);
}
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_GRAPHICS_DRAWING_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_GRAPHICS_DRAWING_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_GRAPHICS_DRAWING_image_PixelMap>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_GRAPHICS_DRAWING_API* GetOH_OHOS_GRAPHICS_DRAWING_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_GRAPHICS_DRAWING_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_GRAPHICS_DRAWING_APIKind::OH_OHOS_GRAPHICS_DRAWING_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_drawing_Brush_construct0() {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Brush()->construct0();
}
KOALA_INTEROP_DIRECT_0(drawing_Brush_construct0, OH_NativePointer)
OH_NativePointer impl_drawing_Brush_construct1(OH_NativePointer brush) {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Brush()->construct1(static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_Brush>(brush));
}
KOALA_INTEROP_DIRECT_1(drawing_Brush_construct1, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_drawing_Brush_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Brush()->destruct;
}
KOALA_INTEROP_DIRECT_0(drawing_Brush_getFinalizer, OH_NativePointer)
void impl_drawing_Brush_setBlendMode(OH_NativePointer thisPtr, OH_Int32 mode) {
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Brush()->setBlendMode(thisPtr, static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode>(mode));
}
KOALA_INTEROP_DIRECT_V2(drawing_Brush_setBlendMode, OH_NativePointer, OH_Int32)
void impl_drawing_Brush_reset(OH_NativePointer thisPtr) {
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Brush()->reset(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(drawing_Brush_reset, OH_NativePointer)
OH_NativePointer impl_drawing_Canvas_construct(OH_NativePointer pixelmap) {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->construct(static_cast<OH_OHOS_GRAPHICS_DRAWING_image_PixelMap>(pixelmap));
}
KOALA_INTEROP_DIRECT_1(drawing_Canvas_construct, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_drawing_Canvas_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->destruct;
}
KOALA_INTEROP_DIRECT_0(drawing_Canvas_getFinalizer, OH_NativePointer)
void impl_drawing_Canvas_drawRect0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_GRAPHICS_DRAWING_common2D_Rect rectValueTemp = common2D_Rect_serializer::read(thisDeserializer);;
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->drawRect0(thisPtr, static_cast<OH_OHOS_GRAPHICS_DRAWING_common2D_Rect*>(&rectValueTemp));
}
KOALA_INTEROP_DIRECT_V3(drawing_Canvas_drawRect0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_drawing_Canvas_drawRect1(OH_NativePointer thisPtr, KDouble left, KDouble top, KDouble right, KDouble bottom) {
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->drawRect1(thisPtr, left, top, right, bottom);
}
KOALA_INTEROP_V5(drawing_Canvas_drawRect1, OH_NativePointer, KDouble, KDouble, KDouble, KDouble)
void impl_drawing_Canvas_drawImageRect(OH_NativePointer thisPtr, OH_NativePointer pixelmap, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_GRAPHICS_DRAWING_common2D_Rect dstRectValueTemp = common2D_Rect_serializer::read(thisDeserializer);;
        const auto samplingOptionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_GRAPHICS_DRAWING_RuntimeType>(thisDeserializer.readInt8());
        Opt_drawing_SamplingOptions samplingOptionsValueTempTmpBuf = {};
        samplingOptionsValueTempTmpBuf.tag = samplingOptionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((samplingOptionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            samplingOptionsValueTempTmpBuf.value = static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_SamplingOptions>(drawing_SamplingOptions_serializer::read(thisDeserializer));
        }
        Opt_drawing_SamplingOptions samplingOptionsValueTemp = samplingOptionsValueTempTmpBuf;;
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->drawImageRect(thisPtr, static_cast<OH_OHOS_GRAPHICS_DRAWING_image_PixelMap>(pixelmap), static_cast<OH_OHOS_GRAPHICS_DRAWING_common2D_Rect*>(&dstRectValueTemp), static_cast<Opt_drawing_SamplingOptions*>(&samplingOptionsValueTemp));
}
KOALA_INTEROP_DIRECT_V4(drawing_Canvas_drawImageRect, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_drawing_Canvas_drawPixelMapMesh(OH_NativePointer thisPtr, OH_NativePointer pixelmap, OH_Int32 meshWidth, OH_Int32 meshHeight, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 vertOffset, OH_Int32 colorOffset) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 verticesValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Float64 verticesValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(verticesValueTempTmpBuf)>::type,
        std::decay<decltype(*verticesValueTempTmpBuf.array)>::type>(&verticesValueTempTmpBuf, verticesValueTempTmpBufLength);
        for (int verticesValueTempTmpBufBufCounterI = 0; verticesValueTempTmpBufBufCounterI < verticesValueTempTmpBufLength; verticesValueTempTmpBufBufCounterI++) {
            verticesValueTempTmpBuf.array[verticesValueTempTmpBufBufCounterI] = thisDeserializer.readFloat64();
        }
        Array_Float64 verticesValueTemp = verticesValueTempTmpBuf;;
        const OH_Int32 colorsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Int32 colorsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(colorsValueTempTmpBuf)>::type,
        std::decay<decltype(*colorsValueTempTmpBuf.array)>::type>(&colorsValueTempTmpBuf, colorsValueTempTmpBufLength);
        for (int colorsValueTempTmpBufBufCounterI = 0; colorsValueTempTmpBufBufCounterI < colorsValueTempTmpBufLength; colorsValueTempTmpBufBufCounterI++) {
            colorsValueTempTmpBuf.array[colorsValueTempTmpBufBufCounterI] = thisDeserializer.readInt32();
        }
        Array_Int32 colorsValueTemp = colorsValueTempTmpBuf;;
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->drawPixelMapMesh(thisPtr, static_cast<OH_OHOS_GRAPHICS_DRAWING_image_PixelMap>(pixelmap), meshWidth, meshHeight, static_cast<Array_Float64*>(&verticesValueTemp), vertOffset, static_cast<Array_Int32*>(&colorsValueTemp), colorOffset);
}
KOALA_INTEROP_DIRECT_V8(drawing_Canvas_drawPixelMapMesh, OH_NativePointer, OH_NativePointer, OH_Int32, OH_Int32, KSerializerBuffer, int32_t, OH_Int32, OH_Int32)
void impl_drawing_Canvas_attachBrush(OH_NativePointer thisPtr, OH_NativePointer brush) {
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->attachBrush(thisPtr, static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_Brush>(brush));
}
KOALA_INTEROP_DIRECT_V2(drawing_Canvas_attachBrush, OH_NativePointer, OH_NativePointer)
void impl_drawing_Canvas_detachBrush(OH_NativePointer thisPtr) {
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->detachBrush(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(drawing_Canvas_detachBrush, OH_NativePointer)
OH_Int32 impl_drawing_Canvas_saveLayer(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto rectValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_GRAPHICS_DRAWING_RuntimeType>(thisDeserializer.readInt8());
        Opt_common2D_Rect rectValueTempTmpBuf = {};
        rectValueTempTmpBuf.tag = rectValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((rectValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            rectValueTempTmpBuf.value = common2D_Rect_serializer::read(thisDeserializer);
        }
        Opt_common2D_Rect rectValueTemp = rectValueTempTmpBuf;;
        const auto brushValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_GRAPHICS_DRAWING_RuntimeType>(thisDeserializer.readInt8());
        Opt_drawing_Brush brushValueTempTmpBuf = {};
        brushValueTempTmpBuf.tag = brushValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((brushValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            brushValueTempTmpBuf.value = static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_Brush>(drawing_Brush_serializer::read(thisDeserializer));
        }
        Opt_drawing_Brush brushValueTemp = brushValueTempTmpBuf;;
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->saveLayer(thisPtr, static_cast<Opt_common2D_Rect*>(&rectValueTemp), static_cast<Opt_drawing_Brush*>(&brushValueTemp));
}
KOALA_INTEROP_DIRECT_3(drawing_Canvas_saveLayer, OH_Int32, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_drawing_Canvas_restore(OH_NativePointer thisPtr) {
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->restore(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(drawing_Canvas_restore, OH_NativePointer)
void impl_drawing_Canvas_rotate(OH_NativePointer thisPtr, KDouble degrees, KDouble sx, KDouble sy) {
        GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Canvas()->rotate(thisPtr, degrees, sx, sy);
}
KOALA_INTEROP_V4(drawing_Canvas_rotate, OH_NativePointer, KDouble, KDouble, KDouble)
OH_NativePointer impl_drawing_ColorFilter_construct() {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_ColorFilter()->construct();
}
KOALA_INTEROP_DIRECT_0(drawing_ColorFilter_construct, OH_NativePointer)
OH_NativePointer impl_drawing_ColorFilter_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_ColorFilter()->destruct;
}
KOALA_INTEROP_DIRECT_0(drawing_ColorFilter_getFinalizer, OH_NativePointer)
OH_NativePointer impl_drawing_ColorFilter_createBlendModeColorFilter(KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 colorValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32 colorValueTempTmpBuf = {};
        colorValueTempTmpBuf.selector = colorValueTempTmpBufUnionSelector;
        if (colorValueTempTmpBufUnionSelector == 0) {
            colorValueTempTmpBuf.selector = 0;
            colorValueTempTmpBuf.value0 = common2D_Color_serializer::read(thisDeserializer);
        } else if (colorValueTempTmpBufUnionSelector == 1) {
            colorValueTempTmpBuf.selector = 1;
            colorValueTempTmpBuf.value1 = thisDeserializer.readInt32();
        } else {
            INTEROP_FATAL("One of the branches for colorValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32 colorValueTemp = static_cast<OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32>(colorValueTempTmpBuf);;
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_ColorFilter()->createBlendModeColorFilter(static_cast<OH_OHOS_GRAPHICS_DRAWING_Union_Common2D_Color_I32*>(&colorValueTemp), static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_BlendMode>(mode));
}
KOALA_INTEROP_DIRECT_3(drawing_ColorFilter_createBlendModeColorFilter, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
OH_NativePointer impl_drawing_Lattice_construct() {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Lattice()->construct();
}
KOALA_INTEROP_DIRECT_0(drawing_Lattice_construct, OH_NativePointer)
OH_NativePointer impl_drawing_Lattice_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Lattice()->destruct;
}
KOALA_INTEROP_DIRECT_0(drawing_Lattice_getFinalizer, OH_NativePointer)
OH_NativePointer impl_drawing_Lattice_createImageLattice(KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 fXCount, OH_Int32 fYCount) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 xDivsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Int32 xDivsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(xDivsValueTempTmpBuf)>::type,
        std::decay<decltype(*xDivsValueTempTmpBuf.array)>::type>(&xDivsValueTempTmpBuf, xDivsValueTempTmpBufLength);
        for (int xDivsValueTempTmpBufBufCounterI = 0; xDivsValueTempTmpBufBufCounterI < xDivsValueTempTmpBufLength; xDivsValueTempTmpBufBufCounterI++) {
            xDivsValueTempTmpBuf.array[xDivsValueTempTmpBufBufCounterI] = thisDeserializer.readInt32();
        }
        Array_Int32 xDivsValueTemp = xDivsValueTempTmpBuf;;
        const OH_Int32 yDivsValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Int32 yDivsValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(yDivsValueTempTmpBuf)>::type,
        std::decay<decltype(*yDivsValueTempTmpBuf.array)>::type>(&yDivsValueTempTmpBuf, yDivsValueTempTmpBufLength);
        for (int yDivsValueTempTmpBufBufCounterI = 0; yDivsValueTempTmpBufBufCounterI < yDivsValueTempTmpBufLength; yDivsValueTempTmpBufBufCounterI++) {
            yDivsValueTempTmpBuf.array[yDivsValueTempTmpBufBufCounterI] = thisDeserializer.readInt32();
        }
        Array_Int32 yDivsValueTemp = yDivsValueTempTmpBuf;;
        const auto fBoundsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_GRAPHICS_DRAWING_RuntimeType>(thisDeserializer.readInt8());
        Opt_common2D_Rect fBoundsValueTempTmpBuf = {};
        fBoundsValueTempTmpBuf.tag = fBoundsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((fBoundsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            fBoundsValueTempTmpBuf.value = common2D_Rect_serializer::read(thisDeserializer);
        }
        Opt_common2D_Rect fBoundsValueTemp = fBoundsValueTempTmpBuf;;
        const auto fRectTypesValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_GRAPHICS_DRAWING_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_drawing_RectType fRectTypesValueTempTmpBuf = {};
        fRectTypesValueTempTmpBuf.tag = fRectTypesValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((fRectTypesValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 fRectTypesValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_drawing_RectType fRectTypesValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(fRectTypesValueTempTmpBuf_)>::type,
        std::decay<decltype(*fRectTypesValueTempTmpBuf_.array)>::type>(&fRectTypesValueTempTmpBuf_, fRectTypesValueTempTmpBuf_Length);
            for (int fRectTypesValueTempTmpBuf_BufCounterI = 0; fRectTypesValueTempTmpBuf_BufCounterI < fRectTypesValueTempTmpBuf_Length; fRectTypesValueTempTmpBuf_BufCounterI++) {
                fRectTypesValueTempTmpBuf_.array[fRectTypesValueTempTmpBuf_BufCounterI] = static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_RectType>(thisDeserializer.readInt32());
            }
            fRectTypesValueTempTmpBuf.value = fRectTypesValueTempTmpBuf_;
        }
        Opt_Array_drawing_RectType fRectTypesValueTemp = fRectTypesValueTempTmpBuf;;
        const auto fColorsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_GRAPHICS_DRAWING_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_common2D_Color fColorsValueTempTmpBuf = {};
        fColorsValueTempTmpBuf.tag = fColorsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((fColorsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 fColorsValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_common2D_Color fColorsValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(fColorsValueTempTmpBuf_)>::type,
        std::decay<decltype(*fColorsValueTempTmpBuf_.array)>::type>(&fColorsValueTempTmpBuf_, fColorsValueTempTmpBuf_Length);
            for (int fColorsValueTempTmpBuf_BufCounterI = 0; fColorsValueTempTmpBuf_BufCounterI < fColorsValueTempTmpBuf_Length; fColorsValueTempTmpBuf_BufCounterI++) {
                fColorsValueTempTmpBuf_.array[fColorsValueTempTmpBuf_BufCounterI] = common2D_Color_serializer::read(thisDeserializer);
            }
            fColorsValueTempTmpBuf.value = fColorsValueTempTmpBuf_;
        }
        Opt_Array_common2D_Color fColorsValueTemp = fColorsValueTempTmpBuf;;
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_Lattice()->createImageLattice(static_cast<Array_Int32*>(&xDivsValueTemp), static_cast<Array_Int32*>(&yDivsValueTemp), fXCount, fYCount, static_cast<Opt_common2D_Rect*>(&fBoundsValueTemp), static_cast<Opt_Array_drawing_RectType*>(&fRectTypesValueTemp), static_cast<Opt_Array_common2D_Color*>(&fColorsValueTemp));
}
KOALA_INTEROP_DIRECT_4(drawing_Lattice_createImageLattice, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32, OH_Int32)
OH_NativePointer impl_drawing_SamplingOptions_construct0() {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_SamplingOptions()->construct0();
}
KOALA_INTEROP_DIRECT_0(drawing_SamplingOptions_construct0, OH_NativePointer)
OH_NativePointer impl_drawing_SamplingOptions_construct1(OH_Int32 filterMode) {
        return GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_SamplingOptions()->construct1(static_cast<OH_OHOS_GRAPHICS_DRAWING_drawing_FilterMode>(filterMode));
}
KOALA_INTEROP_DIRECT_1(drawing_SamplingOptions_construct1, OH_NativePointer, OH_Int32)
OH_NativePointer impl_drawing_SamplingOptions_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_GRAPHICS_DRAWING_API(OHOS_GRAPHICS_DRAWING_API_VERSION)->Drawing_SamplingOptions()->destruct;
}
KOALA_INTEROP_DIRECT_0(drawing_SamplingOptions_getFinalizer, OH_NativePointer)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_GRAPHICS_DRAWING_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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