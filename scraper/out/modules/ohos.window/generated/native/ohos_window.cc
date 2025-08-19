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

#include "ohos_window.h"

#define KOALA_INTEROP_MODULE OHOS_WINDOWNativeModule
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
    Kind_Callback_AvoidAreaOptions_Void = -2028566691,
    Kind_Callback_Boolean_Void = 313269291,
    Kind_Callback_F64_Void = -949162837,
    Kind_Callback_I32_Void = 1148910599,
    Kind_Callback_I64_Void = 158810308,
    Kind_Callback_KeyboardInfo_Void = -1812524852,
    Kind_Callback_Opt_Array_String_Void = -543655128,
    Kind_Callback_Opt_Boolean_Opt_Array_String_Void = -814714393,
    Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void = 305221743,
    Kind_Callback_Opt_Window_Opt_Array_String_Void = 1543863439,
    Kind_Callback_Promise_Boolean = 1790670400,
    Kind_Callback_RectChangeOptions_Void = -1125852455,
    Kind_Callback_Size_Void = -646869686,
    Kind_Callback_TitleButtonRect_Void = -1880926119,
    Kind_Callback_Void = -1867723152,
    Kind_Callback_WindowEventType_Void = -87838217,
    Kind_Callback_WindowStageEventType_Void = 1893167827,
    Kind_Callback_WindowStatusType_Void = -1741561873,
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Boolean& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_Float64& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Float64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_ConfigurationConstant_ColorMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_ConfigurationConstant_ColorMode value) {
    result->append("OH_OHOS_WINDOW_ConfigurationConstant_ColorMode(");
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_ConfigurationConstant_ColorMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_image_PixelMap value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_UIContext& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_UIContext value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_UIContext* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_UIContext& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_AvoidAreaType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_AvoidAreaType value) {
    result->append("OH_OHOS_WINDOW_window_AvoidAreaType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_AvoidAreaType* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_AvoidAreaType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_ColorSpace& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_ColorSpace value) {
    result->append("OH_OHOS_WINDOW_window_ColorSpace(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_ColorSpace* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_ColorSpace& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_MaximizePresentation& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_MaximizePresentation value) {
    result->append("OH_OHOS_WINDOW_window_MaximizePresentation(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_MaximizePresentation* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_MaximizePresentation& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_Orientation& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_Orientation value) {
    result->append("OH_OHOS_WINDOW_window_Orientation(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_Orientation* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_Orientation& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_Rect& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_Rect* value) {
    result->append("{");
    // OH_Int32 left
    result->append(".left=");
    WriteToString(result, value->left);
    // OH_Int32 top
    result->append(", ");
    result->append(".top=");
    WriteToString(result, value->top);
    // OH_Int32 width
    result->append(", ");
    result->append(".width=");
    WriteToString(result, value->width);
    // OH_Int32 height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, value->height);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_Rect* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_Rect& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_RectChangeReason& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_RectChangeReason value) {
    result->append("OH_OHOS_WINDOW_window_RectChangeReason(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_RectChangeReason* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_RectChangeReason& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_Size& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_Size* value) {
    result->append("{");
    // OH_Int32 width
    result->append(".width=");
    WriteToString(result, value->width);
    // OH_Int32 height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, value->height);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_Size* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_Size& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_TitleButtonRect& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_TitleButtonRect* value) {
    result->append("{");
    // OH_Number width
    result->append(".width=");
    WriteToString(result, &value->width);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_TitleButtonRect* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_TitleButtonRect& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_Window& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_Window value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_window_Window* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_Window& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_WindowEventType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_WindowEventType value) {
    result->append("OH_OHOS_WINDOW_window_WindowEventType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_WindowEventType* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_WindowEventType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_WindowStage& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_WindowStage value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_window_WindowStage* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_WindowStage& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_WindowStageEventType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_WindowStageEventType value) {
    result->append("OH_OHOS_WINDOW_window_WindowStageEventType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_WindowStageEventType* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_WindowStageEventType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_WindowStatusType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_WindowStatusType value) {
    result->append("OH_OHOS_WINDOW_window_WindowStatusType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_WindowStatusType* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_WindowStatusType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_WindowType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_WindowType value) {
    result->append("OH_OHOS_WINDOW_window_WindowType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_WindowType* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_WindowType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_AsyncCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_AsyncCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_AsyncCallback* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_AsyncCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_Callback_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_Callback_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_Callback_Opt_Array_String_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_Callback_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_Boolean_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_Boolean_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_Boolean_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_Boolean_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_F64_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_F64_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_F64_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_F64_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_I32_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_I32_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_I32_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_I32_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_I64_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_I64_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_I64_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_I64_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_KeyboardInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_KeyboardInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_Promise_Boolean& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_Promise_Boolean* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_Promise_Boolean* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_Promise_Boolean& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_RectChangeOptions_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_RectChangeOptions_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_Size_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_Size_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_Size_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_Size_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_TitleButtonRect_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_TitleButtonRect_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_WindowEventType_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_WindowEventType_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_WindowStageEventType_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_WindowStageEventType_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OHOS_WINDOW_window_Callback_WindowStatusType_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_WINDOW_window_Callback_WindowStatusType_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_BusinessError& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_BusinessError value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_BusinessError& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_Union_String_ColorMetrics& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_WINDOW_Union_String_ColorMetrics: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_Union_String_ColorMetrics* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_String
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_CustomObject
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_String_ColorMetrics* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Union_String_ColorMetrics& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_AvoidArea& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_AvoidArea* value) {
    result->append("{");
    // OH_Boolean visible
    result->append(".visible=");
    WriteToString(result, value->visible);
    // OH_OHOS_WINDOW_window_Rect leftRect
    result->append(", ");
    result->append(".leftRect=");
    WriteToString(result, &value->leftRect);
    // OH_OHOS_WINDOW_window_Rect topRect
    result->append(", ");
    result->append(".topRect=");
    WriteToString(result, &value->topRect);
    // OH_OHOS_WINDOW_window_Rect rightRect
    result->append(", ");
    result->append(".rightRect=");
    WriteToString(result, &value->rightRect);
    // OH_OHOS_WINDOW_window_Rect bottomRect
    result->append(", ");
    result->append(".bottomRect=");
    WriteToString(result, &value->bottomRect);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_AvoidArea* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_AvoidArea& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_AvoidAreaOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_AvoidAreaOptions* value) {
    result->append("{");
    // OH_OHOS_WINDOW_window_AvoidAreaType type
    result->append(".type=");
    WriteToString(result, value->type);
    // OH_OHOS_WINDOW_window_AvoidArea area
    result->append(", ");
    result->append(".area=");
    WriteToString(result, &value->area);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_AvoidAreaOptions* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_AvoidAreaOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_DecorButtonStyle& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_DecorButtonStyle* value) {
    result->append("{");
    // OH_OHOS_WINDOW_ConfigurationConstant_ColorMode colorMode
    result->append(".colorMode=");
    WriteToString(result, &value->colorMode);
    // OH_Number buttonBackgroundSize
    result->append(", ");
    result->append(".buttonBackgroundSize=");
    WriteToString(result, &value->buttonBackgroundSize);
    // OH_Number spacingBetweenButtons
    result->append(", ");
    result->append(".spacingBetweenButtons=");
    WriteToString(result, &value->spacingBetweenButtons);
    // OH_Number closeButtonRightMargin
    result->append(", ");
    result->append(".closeButtonRightMargin=");
    WriteToString(result, &value->closeButtonRightMargin);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_DecorButtonStyle* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_DecorButtonStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_KeyboardInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_KeyboardInfo* value) {
    result->append("{");
    // OH_OHOS_WINDOW_window_Rect beginRect
    result->append(".beginRect=");
    WriteToString(result, &value->beginRect);
    // OH_OHOS_WINDOW_window_Rect endRect
    result->append(", ");
    result->append(".endRect=");
    WriteToString(result, &value->endRect);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_KeyboardInfo* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_KeyboardInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_RectChangeOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_RectChangeOptions* value) {
    result->append("{");
    // OH_OHOS_WINDOW_window_Rect rect
    result->append(".rect=");
    WriteToString(result, &value->rect);
    // OH_OHOS_WINDOW_window_RectChangeReason reason
    result->append(", ");
    result->append(".reason=");
    WriteToString(result, value->reason);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_RectChangeOptions* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_RectChangeOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_RotateOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_RotateOptions* value) {
    result->append("{");
    // OH_Float64 x
    result->append(".x=");
    WriteToString(result, &value->x);
    // OH_Float64 y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, &value->y);
    // OH_Float64 z
    result->append(", ");
    result->append(".z=");
    WriteToString(result, &value->z);
    // OH_Float64 pivotX
    result->append(", ");
    result->append(".pivotX=");
    WriteToString(result, &value->pivotX);
    // OH_Float64 pivotY
    result->append(", ");
    result->append(".pivotY=");
    WriteToString(result, &value->pivotY);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_RotateOptions* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_RotateOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_ScaleOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_ScaleOptions* value) {
    result->append("{");
    // OH_Float64 x
    result->append(".x=");
    WriteToString(result, &value->x);
    // OH_Float64 y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, &value->y);
    // OH_Float64 pivotX
    result->append(", ");
    result->append(".pivotX=");
    WriteToString(result, &value->pivotX);
    // OH_Float64 pivotY
    result->append(", ");
    result->append(".pivotY=");
    WriteToString(result, &value->pivotY);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_ScaleOptions* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_ScaleOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_SystemBarProperties& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_SystemBarProperties* value) {
    result->append("{");
    // OH_String statusBarColor
    result->append(".statusBarColor=");
    WriteToString(result, &value->statusBarColor);
    // OH_Boolean isStatusBarLightIcon
    result->append(", ");
    result->append(".isStatusBarLightIcon=");
    WriteToString(result, &value->isStatusBarLightIcon);
    // OH_String statusBarContentColor
    result->append(", ");
    result->append(".statusBarContentColor=");
    WriteToString(result, &value->statusBarContentColor);
    // OH_String navigationBarColor
    result->append(", ");
    result->append(".navigationBarColor=");
    WriteToString(result, &value->navigationBarColor);
    // OH_Boolean isNavigationBarLightIcon
    result->append(", ");
    result->append(".isNavigationBarLightIcon=");
    WriteToString(result, &value->isNavigationBarLightIcon);
    // OH_String navigationBarContentColor
    result->append(", ");
    result->append(".navigationBarContentColor=");
    WriteToString(result, &value->navigationBarContentColor);
    // OH_Boolean enableStatusBarAnimation
    result->append(", ");
    result->append(".enableStatusBarAnimation=");
    WriteToString(result, &value->enableStatusBarAnimation);
    // OH_Boolean enableNavigationBarAnimation
    result->append(", ");
    result->append(".enableNavigationBarAnimation=");
    WriteToString(result, &value->enableNavigationBarAnimation);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_SystemBarProperties* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_SystemBarProperties& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_SystemBarStyle& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_SystemBarStyle* value) {
    result->append("{");
    // OH_String statusBarContentColor
    result->append(".statusBarContentColor=");
    WriteToString(result, &value->statusBarContentColor);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_SystemBarStyle* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_SystemBarStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_TranslateOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_TranslateOptions* value) {
    result->append("{");
    // OH_Float64 x
    result->append(".x=");
    WriteToString(result, &value->x);
    // OH_Float64 y
    result->append(", ");
    result->append(".y=");
    WriteToString(result, &value->y);
    // OH_Float64 z
    result->append(", ");
    result->append(".z=");
    WriteToString(result, &value->z);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_TranslateOptions* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_TranslateOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const OH_OHOS_WINDOW_window_WindowProperties& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_WINDOW_window_WindowProperties* value) {
    result->append("{");
    // OH_OHOS_WINDOW_window_Rect windowRect
    result->append(".windowRect=");
    WriteToString(result, &value->windowRect);
    // OH_OHOS_WINDOW_window_Rect drawableRect
    result->append(", ");
    result->append(".drawableRect=");
    WriteToString(result, &value->drawableRect);
    // OH_OHOS_WINDOW_window_WindowType type
    result->append(", ");
    result->append(".type=");
    WriteToString(result, value->type);
    // OH_Boolean isFullScreen
    result->append(", ");
    result->append(".isFullScreen=");
    WriteToString(result, value->isFullScreen);
    // OH_Boolean isLayoutFullScreen
    result->append(", ");
    result->append(".isLayoutFullScreen=");
    WriteToString(result, value->isLayoutFullScreen);
    // OH_Boolean focusable
    result->append(", ");
    result->append(".focusable=");
    WriteToString(result, value->focusable);
    // OH_Boolean touchable
    result->append(", ");
    result->append(".touchable=");
    WriteToString(result, value->touchable);
    // OH_Float64 brightness
    result->append(", ");
    result->append(".brightness=");
    WriteToString(result, value->brightness);
    // OH_Boolean isKeepScreenOn
    result->append(", ");
    result->append(".isKeepScreenOn=");
    WriteToString(result, value->isKeepScreenOn);
    // OH_Boolean isPrivacyMode
    result->append(", ");
    result->append(".isPrivacyMode=");
    WriteToString(result, value->isPrivacyMode);
    // OH_Boolean isTransparent
    result->append(", ");
    result->append(".isTransparent=");
    WriteToString(result, value->isTransparent);
    // OH_Int32 id
    result->append(", ");
    result->append(".id=");
    WriteToString(result, value->id);
    // OH_Int64 displayId
    result->append(", ");
    result->append(".displayId=");
    WriteToString(result, &value->displayId);
    // OH_String name
    result->append(", ");
    result->append(".name=");
    WriteToString(result, &value->name);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_window_WindowProperties* value) {
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_window_WindowProperties& value)
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
inline OH_OHOS_WINDOW_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_image_PixelMap value);
    static OH_OHOS_WINDOW_image_PixelMap read(DeserializerBase& buffer);
};
class UIContext_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_UIContext value);
    static OH_OHOS_WINDOW_UIContext read(DeserializerBase& buffer);
};
class window_Rect_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_Rect value);
    static OH_OHOS_WINDOW_window_Rect read(DeserializerBase& buffer);
};
class window_Size_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_Size value);
    static OH_OHOS_WINDOW_window_Size read(DeserializerBase& buffer);
};
class window_TitleButtonRect_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_TitleButtonRect value);
    static OH_OHOS_WINDOW_window_TitleButtonRect read(DeserializerBase& buffer);
};
class window_Window_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_Window value);
    static OH_OHOS_WINDOW_window_Window read(DeserializerBase& buffer);
};
class window_WindowStage_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_WindowStage value);
    static OH_OHOS_WINDOW_window_WindowStage read(DeserializerBase& buffer);
};
class window_AvoidArea_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_AvoidArea value);
    static OH_OHOS_WINDOW_window_AvoidArea read(DeserializerBase& buffer);
};
class window_AvoidAreaOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_AvoidAreaOptions value);
    static OH_OHOS_WINDOW_window_AvoidAreaOptions read(DeserializerBase& buffer);
};
class window_DecorButtonStyle_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_DecorButtonStyle value);
    static OH_OHOS_WINDOW_window_DecorButtonStyle read(DeserializerBase& buffer);
};
class window_KeyboardInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_KeyboardInfo value);
    static OH_OHOS_WINDOW_window_KeyboardInfo read(DeserializerBase& buffer);
};
class window_RectChangeOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_RectChangeOptions value);
    static OH_OHOS_WINDOW_window_RectChangeOptions read(DeserializerBase& buffer);
};
class window_RotateOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_RotateOptions value);
    static OH_OHOS_WINDOW_window_RotateOptions read(DeserializerBase& buffer);
};
class window_ScaleOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_ScaleOptions value);
    static OH_OHOS_WINDOW_window_ScaleOptions read(DeserializerBase& buffer);
};
class window_SystemBarProperties_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_SystemBarProperties value);
    static OH_OHOS_WINDOW_window_SystemBarProperties read(DeserializerBase& buffer);
};
class window_SystemBarStyle_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_SystemBarStyle value);
    static OH_OHOS_WINDOW_window_SystemBarStyle read(DeserializerBase& buffer);
};
class window_TranslateOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_TranslateOptions value);
    static OH_OHOS_WINDOW_window_TranslateOptions read(DeserializerBase& buffer);
};
class window_WindowProperties_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_WINDOW_window_WindowProperties value);
    static OH_OHOS_WINDOW_window_WindowProperties read(DeserializerBase& buffer);
};
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WINDOW_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WINDOW_image_PixelMap>(ptr);
}
inline void UIContext_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_UIContext value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WINDOW_UIContext UIContext_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WINDOW_UIContext>(ptr);
}
inline void window_Rect_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_Rect value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForLeft = value.left;
    valueSerializer.writeInt32(valueHolderForLeft);
    const auto valueHolderForTop = value.top;
    valueSerializer.writeInt32(valueHolderForTop);
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeInt32(valueHolderForWidth);
    const auto valueHolderForHeight = value.height;
    valueSerializer.writeInt32(valueHolderForHeight);
}
inline OH_OHOS_WINDOW_window_Rect window_Rect_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_Rect value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.left = valueDeserializer.readInt32();
    value.top = valueDeserializer.readInt32();
    value.width = valueDeserializer.readInt32();
    value.height = valueDeserializer.readInt32();
    return value;
}
inline void window_Size_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_Size value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeInt32(valueHolderForWidth);
    const auto valueHolderForHeight = value.height;
    valueSerializer.writeInt32(valueHolderForHeight);
}
inline OH_OHOS_WINDOW_window_Size window_Size_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_Size value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.width = valueDeserializer.readInt32();
    value.height = valueDeserializer.readInt32();
    return value;
}
inline void window_TitleButtonRect_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_TitleButtonRect value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeNumber(valueHolderForWidth);
}
inline OH_OHOS_WINDOW_window_TitleButtonRect window_TitleButtonRect_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_TitleButtonRect value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.width = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void window_Window_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_Window value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WINDOW_window_Window window_Window_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WINDOW_window_Window>(ptr);
}
inline void window_WindowStage_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_WindowStage value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_WINDOW_window_WindowStage window_WindowStage_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_WINDOW_window_WindowStage>(ptr);
}
inline void window_AvoidArea_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_AvoidArea value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForVisible = value.visible;
    valueSerializer.writeBoolean(valueHolderForVisible);
    const auto valueHolderForLeftRect = value.leftRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForLeftRect);
    const auto valueHolderForTopRect = value.topRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForTopRect);
    const auto valueHolderForRightRect = value.rightRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForRightRect);
    const auto valueHolderForBottomRect = value.bottomRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForBottomRect);
}
inline OH_OHOS_WINDOW_window_AvoidArea window_AvoidArea_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_AvoidArea value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.visible = valueDeserializer.readBoolean();
    value.leftRect = window_Rect_serializer::read(valueDeserializer);
    value.topRect = window_Rect_serializer::read(valueDeserializer);
    value.rightRect = window_Rect_serializer::read(valueDeserializer);
    value.bottomRect = window_Rect_serializer::read(valueDeserializer);
    return value;
}
inline void window_AvoidAreaOptions_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_AvoidAreaOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForType = value.type;
    valueSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_AvoidAreaType>(valueHolderForType));
    const auto valueHolderForArea = value.area;
    window_AvoidArea_serializer::write(valueSerializer, valueHolderForArea);
}
inline OH_OHOS_WINDOW_window_AvoidAreaOptions window_AvoidAreaOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_AvoidAreaOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.type = static_cast<OH_OHOS_WINDOW_window_AvoidAreaType>(valueDeserializer.readInt32());
    value.area = window_AvoidArea_serializer::read(valueDeserializer);
    return value;
}
inline void window_DecorButtonStyle_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_DecorButtonStyle value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForColorMode = value.colorMode;
    if (runtimeType(valueHolderForColorMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForColorModeTmpValue = valueHolderForColorMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_ConfigurationConstant_ColorMode>(valueHolderForColorModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForButtonBackgroundSize = value.buttonBackgroundSize;
    if (runtimeType(valueHolderForButtonBackgroundSize) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForButtonBackgroundSizeTmpValue = valueHolderForButtonBackgroundSize.value;
        valueSerializer.writeNumber(valueHolderForButtonBackgroundSizeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForSpacingBetweenButtons = value.spacingBetweenButtons;
    if (runtimeType(valueHolderForSpacingBetweenButtons) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForSpacingBetweenButtonsTmpValue = valueHolderForSpacingBetweenButtons.value;
        valueSerializer.writeNumber(valueHolderForSpacingBetweenButtonsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCloseButtonRightMargin = value.closeButtonRightMargin;
    if (runtimeType(valueHolderForCloseButtonRightMargin) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCloseButtonRightMarginTmpValue = valueHolderForCloseButtonRightMargin.value;
        valueSerializer.writeNumber(valueHolderForCloseButtonRightMarginTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WINDOW_window_DecorButtonStyle window_DecorButtonStyle_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_DecorButtonStyle value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto colorModeTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_ConfigurationConstant_ColorMode colorModeTmpBuf = {};
    colorModeTmpBuf.tag = colorModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((colorModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        colorModeTmpBuf.value = static_cast<OH_OHOS_WINDOW_ConfigurationConstant_ColorMode>(valueDeserializer.readInt32());
    }
    value.colorMode = colorModeTmpBuf;
    const auto buttonBackgroundSizeTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number buttonBackgroundSizeTmpBuf = {};
    buttonBackgroundSizeTmpBuf.tag = buttonBackgroundSizeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((buttonBackgroundSizeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        buttonBackgroundSizeTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.buttonBackgroundSize = buttonBackgroundSizeTmpBuf;
    const auto spacingBetweenButtonsTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number spacingBetweenButtonsTmpBuf = {};
    spacingBetweenButtonsTmpBuf.tag = spacingBetweenButtonsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((spacingBetweenButtonsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        spacingBetweenButtonsTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.spacingBetweenButtons = spacingBetweenButtonsTmpBuf;
    const auto closeButtonRightMarginTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number closeButtonRightMarginTmpBuf = {};
    closeButtonRightMarginTmpBuf.tag = closeButtonRightMarginTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((closeButtonRightMarginTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        closeButtonRightMarginTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.closeButtonRightMargin = closeButtonRightMarginTmpBuf;
    return value;
}
inline void window_KeyboardInfo_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_KeyboardInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForBeginRect = value.beginRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForBeginRect);
    const auto valueHolderForEndRect = value.endRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForEndRect);
}
inline OH_OHOS_WINDOW_window_KeyboardInfo window_KeyboardInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_KeyboardInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.beginRect = window_Rect_serializer::read(valueDeserializer);
    value.endRect = window_Rect_serializer::read(valueDeserializer);
    return value;
}
inline void window_RectChangeOptions_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_RectChangeOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForRect = value.rect;
    window_Rect_serializer::write(valueSerializer, valueHolderForRect);
    const auto valueHolderForReason = value.reason;
    valueSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_RectChangeReason>(valueHolderForReason));
}
inline OH_OHOS_WINDOW_window_RectChangeOptions window_RectChangeOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_RectChangeOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.rect = window_Rect_serializer::read(valueDeserializer);
    value.reason = static_cast<OH_OHOS_WINDOW_window_RectChangeReason>(valueDeserializer.readInt32());
    return value;
}
inline void window_RotateOptions_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_RotateOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    if (runtimeType(valueHolderForX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForXTmpValue = valueHolderForX.value;
        valueSerializer.writeFloat64(valueHolderForXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForY = value.y;
    if (runtimeType(valueHolderForY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForYTmpValue = valueHolderForY.value;
        valueSerializer.writeFloat64(valueHolderForYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForZ = value.z;
    if (runtimeType(valueHolderForZ) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForZTmpValue = valueHolderForZ.value;
        valueSerializer.writeFloat64(valueHolderForZTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPivotX = value.pivotX;
    if (runtimeType(valueHolderForPivotX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPivotXTmpValue = valueHolderForPivotX.value;
        valueSerializer.writeFloat64(valueHolderForPivotXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPivotY = value.pivotY;
    if (runtimeType(valueHolderForPivotY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPivotYTmpValue = valueHolderForPivotY.value;
        valueSerializer.writeFloat64(valueHolderForPivotYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WINDOW_window_RotateOptions window_RotateOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_RotateOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto xTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 xTmpBuf = {};
    xTmpBuf.tag = xTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((xTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        xTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.x = xTmpBuf;
    const auto yTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 yTmpBuf = {};
    yTmpBuf.tag = yTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((yTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        yTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.y = yTmpBuf;
    const auto zTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 zTmpBuf = {};
    zTmpBuf.tag = zTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((zTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        zTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.z = zTmpBuf;
    const auto pivotXTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 pivotXTmpBuf = {};
    pivotXTmpBuf.tag = pivotXTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pivotXTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        pivotXTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.pivotX = pivotXTmpBuf;
    const auto pivotYTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 pivotYTmpBuf = {};
    pivotYTmpBuf.tag = pivotYTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pivotYTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        pivotYTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.pivotY = pivotYTmpBuf;
    return value;
}
inline void window_ScaleOptions_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_ScaleOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    if (runtimeType(valueHolderForX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForXTmpValue = valueHolderForX.value;
        valueSerializer.writeFloat64(valueHolderForXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForY = value.y;
    if (runtimeType(valueHolderForY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForYTmpValue = valueHolderForY.value;
        valueSerializer.writeFloat64(valueHolderForYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPivotX = value.pivotX;
    if (runtimeType(valueHolderForPivotX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPivotXTmpValue = valueHolderForPivotX.value;
        valueSerializer.writeFloat64(valueHolderForPivotXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPivotY = value.pivotY;
    if (runtimeType(valueHolderForPivotY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPivotYTmpValue = valueHolderForPivotY.value;
        valueSerializer.writeFloat64(valueHolderForPivotYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WINDOW_window_ScaleOptions window_ScaleOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_ScaleOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto xTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 xTmpBuf = {};
    xTmpBuf.tag = xTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((xTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        xTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.x = xTmpBuf;
    const auto yTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 yTmpBuf = {};
    yTmpBuf.tag = yTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((yTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        yTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.y = yTmpBuf;
    const auto pivotXTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 pivotXTmpBuf = {};
    pivotXTmpBuf.tag = pivotXTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pivotXTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        pivotXTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.pivotX = pivotXTmpBuf;
    const auto pivotYTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 pivotYTmpBuf = {};
    pivotYTmpBuf.tag = pivotYTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((pivotYTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        pivotYTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.pivotY = pivotYTmpBuf;
    return value;
}
inline void window_SystemBarProperties_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_SystemBarProperties value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForStatusBarColor = value.statusBarColor;
    if (runtimeType(valueHolderForStatusBarColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForStatusBarColorTmpValue = valueHolderForStatusBarColor.value;
        valueSerializer.writeString(valueHolderForStatusBarColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsStatusBarLightIcon = value.isStatusBarLightIcon;
    if (runtimeType(valueHolderForIsStatusBarLightIcon) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsStatusBarLightIconTmpValue = valueHolderForIsStatusBarLightIcon.value;
        valueSerializer.writeBoolean(valueHolderForIsStatusBarLightIconTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForStatusBarContentColor = value.statusBarContentColor;
    if (runtimeType(valueHolderForStatusBarContentColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForStatusBarContentColorTmpValue = valueHolderForStatusBarContentColor.value;
        valueSerializer.writeString(valueHolderForStatusBarContentColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForNavigationBarColor = value.navigationBarColor;
    if (runtimeType(valueHolderForNavigationBarColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForNavigationBarColorTmpValue = valueHolderForNavigationBarColor.value;
        valueSerializer.writeString(valueHolderForNavigationBarColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsNavigationBarLightIcon = value.isNavigationBarLightIcon;
    if (runtimeType(valueHolderForIsNavigationBarLightIcon) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsNavigationBarLightIconTmpValue = valueHolderForIsNavigationBarLightIcon.value;
        valueSerializer.writeBoolean(valueHolderForIsNavigationBarLightIconTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForNavigationBarContentColor = value.navigationBarContentColor;
    if (runtimeType(valueHolderForNavigationBarContentColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForNavigationBarContentColorTmpValue = valueHolderForNavigationBarContentColor.value;
        valueSerializer.writeString(valueHolderForNavigationBarContentColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableStatusBarAnimation = value.enableStatusBarAnimation;
    if (runtimeType(valueHolderForEnableStatusBarAnimation) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableStatusBarAnimationTmpValue = valueHolderForEnableStatusBarAnimation.value;
        valueSerializer.writeBoolean(valueHolderForEnableStatusBarAnimationTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableNavigationBarAnimation = value.enableNavigationBarAnimation;
    if (runtimeType(valueHolderForEnableNavigationBarAnimation) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableNavigationBarAnimationTmpValue = valueHolderForEnableNavigationBarAnimation.value;
        valueSerializer.writeBoolean(valueHolderForEnableNavigationBarAnimationTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WINDOW_window_SystemBarProperties window_SystemBarProperties_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_SystemBarProperties value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto statusBarColorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String statusBarColorTmpBuf = {};
    statusBarColorTmpBuf.tag = statusBarColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((statusBarColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        statusBarColorTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.statusBarColor = statusBarColorTmpBuf;
    const auto isStatusBarLightIconTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isStatusBarLightIconTmpBuf = {};
    isStatusBarLightIconTmpBuf.tag = isStatusBarLightIconTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isStatusBarLightIconTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isStatusBarLightIconTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isStatusBarLightIcon = isStatusBarLightIconTmpBuf;
    const auto statusBarContentColorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String statusBarContentColorTmpBuf = {};
    statusBarContentColorTmpBuf.tag = statusBarContentColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((statusBarContentColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        statusBarContentColorTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.statusBarContentColor = statusBarContentColorTmpBuf;
    const auto navigationBarColorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String navigationBarColorTmpBuf = {};
    navigationBarColorTmpBuf.tag = navigationBarColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((navigationBarColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        navigationBarColorTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.navigationBarColor = navigationBarColorTmpBuf;
    const auto isNavigationBarLightIconTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isNavigationBarLightIconTmpBuf = {};
    isNavigationBarLightIconTmpBuf.tag = isNavigationBarLightIconTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isNavigationBarLightIconTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isNavigationBarLightIconTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isNavigationBarLightIcon = isNavigationBarLightIconTmpBuf;
    const auto navigationBarContentColorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String navigationBarContentColorTmpBuf = {};
    navigationBarContentColorTmpBuf.tag = navigationBarContentColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((navigationBarContentColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        navigationBarContentColorTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.navigationBarContentColor = navigationBarContentColorTmpBuf;
    const auto enableStatusBarAnimationTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableStatusBarAnimationTmpBuf = {};
    enableStatusBarAnimationTmpBuf.tag = enableStatusBarAnimationTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableStatusBarAnimationTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableStatusBarAnimationTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableStatusBarAnimation = enableStatusBarAnimationTmpBuf;
    const auto enableNavigationBarAnimationTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableNavigationBarAnimationTmpBuf = {};
    enableNavigationBarAnimationTmpBuf.tag = enableNavigationBarAnimationTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableNavigationBarAnimationTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableNavigationBarAnimationTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableNavigationBarAnimation = enableNavigationBarAnimationTmpBuf;
    return value;
}
inline void window_SystemBarStyle_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_SystemBarStyle value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForStatusBarContentColor = value.statusBarContentColor;
    if (runtimeType(valueHolderForStatusBarContentColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForStatusBarContentColorTmpValue = valueHolderForStatusBarContentColor.value;
        valueSerializer.writeString(valueHolderForStatusBarContentColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WINDOW_window_SystemBarStyle window_SystemBarStyle_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_SystemBarStyle value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto statusBarContentColorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String statusBarContentColorTmpBuf = {};
    statusBarContentColorTmpBuf.tag = statusBarContentColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((statusBarContentColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        statusBarContentColorTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.statusBarContentColor = statusBarContentColorTmpBuf;
    return value;
}
inline void window_TranslateOptions_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_TranslateOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    if (runtimeType(valueHolderForX) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForXTmpValue = valueHolderForX.value;
        valueSerializer.writeFloat64(valueHolderForXTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForY = value.y;
    if (runtimeType(valueHolderForY) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForYTmpValue = valueHolderForY.value;
        valueSerializer.writeFloat64(valueHolderForYTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForZ = value.z;
    if (runtimeType(valueHolderForZ) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForZTmpValue = valueHolderForZ.value;
        valueSerializer.writeFloat64(valueHolderForZTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WINDOW_window_TranslateOptions window_TranslateOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_TranslateOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto xTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 xTmpBuf = {};
    xTmpBuf.tag = xTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((xTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        xTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.x = xTmpBuf;
    const auto yTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 yTmpBuf = {};
    yTmpBuf.tag = yTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((yTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        yTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.y = yTmpBuf;
    const auto zTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Float64 zTmpBuf = {};
    zTmpBuf.tag = zTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((zTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        zTmpBuf.value = valueDeserializer.readFloat64();
    }
    value.z = zTmpBuf;
    return value;
}
inline void window_WindowProperties_serializer::write(SerializerBase& buffer, OH_OHOS_WINDOW_window_WindowProperties value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForWindowRect = value.windowRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForWindowRect);
    const auto valueHolderForDrawableRect = value.drawableRect;
    window_Rect_serializer::write(valueSerializer, valueHolderForDrawableRect);
    const auto valueHolderForType = value.type;
    valueSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_WindowType>(valueHolderForType));
    const auto valueHolderForIsFullScreen = value.isFullScreen;
    valueSerializer.writeBoolean(valueHolderForIsFullScreen);
    const auto valueHolderForIsLayoutFullScreen = value.isLayoutFullScreen;
    valueSerializer.writeBoolean(valueHolderForIsLayoutFullScreen);
    const auto valueHolderForFocusable = value.focusable;
    valueSerializer.writeBoolean(valueHolderForFocusable);
    const auto valueHolderForTouchable = value.touchable;
    valueSerializer.writeBoolean(valueHolderForTouchable);
    const auto valueHolderForBrightness = value.brightness;
    valueSerializer.writeFloat64(valueHolderForBrightness);
    const auto valueHolderForIsKeepScreenOn = value.isKeepScreenOn;
    valueSerializer.writeBoolean(valueHolderForIsKeepScreenOn);
    const auto valueHolderForIsPrivacyMode = value.isPrivacyMode;
    valueSerializer.writeBoolean(valueHolderForIsPrivacyMode);
    const auto valueHolderForIsTransparent = value.isTransparent;
    valueSerializer.writeBoolean(valueHolderForIsTransparent);
    const auto valueHolderForId = value.id;
    valueSerializer.writeInt32(valueHolderForId);
    const auto valueHolderForDisplayId = value.displayId;
    if (runtimeType(valueHolderForDisplayId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDisplayIdTmpValue = valueHolderForDisplayId.value;
        valueSerializer.writeInt64(valueHolderForDisplayIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForName = value.name;
    if (runtimeType(valueHolderForName) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForNameTmpValue = valueHolderForName.value;
        valueSerializer.writeString(valueHolderForNameTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_WINDOW_window_WindowProperties window_WindowProperties_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_WINDOW_window_WindowProperties value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.windowRect = window_Rect_serializer::read(valueDeserializer);
    value.drawableRect = window_Rect_serializer::read(valueDeserializer);
    value.type = static_cast<OH_OHOS_WINDOW_window_WindowType>(valueDeserializer.readInt32());
    value.isFullScreen = valueDeserializer.readBoolean();
    value.isLayoutFullScreen = valueDeserializer.readBoolean();
    value.focusable = valueDeserializer.readBoolean();
    value.touchable = valueDeserializer.readBoolean();
    value.brightness = valueDeserializer.readFloat64();
    value.isKeepScreenOn = valueDeserializer.readBoolean();
    value.isPrivacyMode = valueDeserializer.readBoolean();
    value.isTransparent = valueDeserializer.readBoolean();
    value.id = valueDeserializer.readInt32();
    const auto displayIdTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_Int64 displayIdTmpBuf = {};
    displayIdTmpBuf.tag = displayIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((displayIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        displayIdTmpBuf.value = valueDeserializer.readInt64();
    }
    value.displayId = displayIdTmpBuf;
    const auto nameTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(valueDeserializer.readInt8());
    Opt_String nameTmpBuf = {};
    nameTmpBuf.tag = nameTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nameTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nameTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.name = nameTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_WINDOW_API* GetOH_OHOS_WINDOW_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_WINDOW_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_WINDOW_APIKind::OH_OHOS_WINDOW_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_window_Window_construct() {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->construct();
}
KOALA_INTEROP_DIRECT_0(window_Window_construct, OH_NativePointer)
OH_NativePointer impl_window_Window_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->destruct;
}
KOALA_INTEROP_DIRECT_0(window_Window_getFinalizer, OH_NativePointer)
void impl_window_Window_hideWithAnimation0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->hideWithAnimation0(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_hideWithAnimation0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_hideWithAnimation1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->hideWithAnimation1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_hideWithAnimation1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_showWindow0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->showWindow0(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_showWindow0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_showWindow1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->showWindow1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_showWindow1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_showWithAnimation0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->showWithAnimation0(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_showWithAnimation0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_showWithAnimation1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->showWithAnimation1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_showWithAnimation1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_destroyWindow0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->destroyWindow0(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_destroyWindow0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_destroyWindow1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->destroyWindow1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_destroyWindow1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_moveWindowTo0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Int32 x, OH_Int32 y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->moveWindowTo0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, x, y, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(window_Window_moveWindowTo0, OH_NativePointer, OH_Int32, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_moveWindowTo1(OH_NativePointer thisPtr, OH_Int32 x, OH_Int32 y, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->moveWindowTo1(thisPtr, x, y, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V5(window_Window_moveWindowTo1, OH_NativePointer, OH_Int32, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_resize0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Int32 width, OH_Int32 height, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->resize0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, width, height, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(window_Window_resize0, OH_NativePointer, OH_Int32, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_resize1(OH_NativePointer thisPtr, OH_Int32 width, OH_Int32 height, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->resize1(thisPtr, width, height, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V5(window_Window_resize1, OH_NativePointer, OH_Int32, OH_Int32, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_window_Window_getGlobalRect(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->getGlobalRect(thisPtr);
        SerializerBase _retSerializer {};
        window_Rect_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(window_Window_getGlobalRect, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_window_Window_getWindowProperties(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->getWindowProperties(thisPtr);
        SerializerBase _retSerializer {};
        window_WindowProperties_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(window_Window_getWindowProperties, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_window_Window_getWindowAvoidArea(OH_NativePointer thisPtr, OH_Int32 type) {
        const auto &retValue = GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->getWindowAvoidArea(thisPtr, static_cast<OH_OHOS_WINDOW_window_AvoidAreaType>(type));
        SerializerBase _retSerializer {};
        window_AvoidArea_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(window_Window_getWindowAvoidArea, KInteropReturnBuffer, OH_NativePointer, OH_Int32)
void impl_window_Window_setWindowLayoutFullScreen(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean isLayoutFullScreen, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowLayoutFullScreen(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, isLayoutFullScreen, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setWindowLayoutFullScreen, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowSystemBarEnable(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 namesValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_String namesValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(namesValueTempTmpBuf)>::type,
        std::decay<decltype(*namesValueTempTmpBuf.array)>::type>(&namesValueTempTmpBuf, namesValueTempTmpBufLength);
        for (int namesValueTempTmpBufBufCounterI = 0; namesValueTempTmpBufBufCounterI < namesValueTempTmpBufLength; namesValueTempTmpBufBufCounterI++) {
            namesValueTempTmpBuf.array[namesValueTempTmpBufBufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
        }
        Array_String namesValueTemp = namesValueTempTmpBuf;;
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowSystemBarEnable(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<Array_String*>(&namesValueTemp), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_setWindowSystemBarEnable, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setSpecificSystemBarEnabled(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& name, OH_Boolean enable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto enableAnimationValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean enableAnimationValueTempTmpBuf = {};
        enableAnimationValueTempTmpBuf.tag = enableAnimationValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((enableAnimationValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            enableAnimationValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean enableAnimationValueTemp = enableAnimationValueTempTmpBuf;;
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setSpecificSystemBarEnabled(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&name), enable, static_cast<Opt_Boolean*>(&enableAnimationValueTemp), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(window_Window_setSpecificSystemBarEnabled, OH_NativePointer, KStringPtr, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowSystemBarProperties(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WINDOW_window_SystemBarProperties systemBarPropertiesValueTemp = window_SystemBarProperties_serializer::read(thisDeserializer);;
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowSystemBarProperties(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_WINDOW_window_SystemBarProperties*>(&systemBarPropertiesValueTemp), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_setWindowSystemBarProperties, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setPreferredOrientation0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Int32 orientation, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setPreferredOrientation0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_WINDOW_window_Orientation>(orientation), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setPreferredOrientation0, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_setPreferredOrientation1(OH_NativePointer thisPtr, OH_Int32 orientation, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setPreferredOrientation1(thisPtr, static_cast<OH_OHOS_WINDOW_window_Orientation>(orientation), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_setPreferredOrientation1, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_loadContent0(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject storageValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->loadContent0(thisPtr, (const OH_String*) (&path), static_cast<OH_CustomObject*>(&storageValueTemp), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(window_Window_loadContent0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_Window_loadContent1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject storageValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->loadContent1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&path), static_cast<OH_CustomObject*>(&storageValueTemp), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_loadContent1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_NativePointer impl_window_Window_getUIContext(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->getUIContext(thisPtr);
}
KOALA_INTEROP_DIRECT_1(window_Window_getUIContext, OH_NativePointer, OH_NativePointer)
void impl_window_Window_setUIContent0(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setUIContent0(thisPtr, (const OH_String*) (&path), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(window_Window_setUIContent0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_Window_setUIContent1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setUIContent1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&path), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setUIContent1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
OH_Boolean impl_window_Window_isWindowShowing(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->isWindowShowing(thisPtr);
}
KOALA_INTEROP_DIRECT_1(window_Window_isWindowShowing, OH_Boolean, OH_NativePointer)
void impl_window_Window_onWindowSizeChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Size_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Size_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Size_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowSizeChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Size_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowSizeChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowSizeChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Size_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Size_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Size_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Size_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowSizeChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Size_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowSizeChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onAvoidAreaChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_AvoidAreaOptions_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_AvoidAreaOptions_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onAvoidAreaChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onAvoidAreaChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offAvoidAreaChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_AvoidAreaOptions_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_AvoidAreaOptions_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offAvoidAreaChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_AvoidAreaOptions_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offAvoidAreaChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onKeyboardHeightChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_I32_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Int32 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_I32_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int32 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_I32_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onKeyboardHeightChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_I32_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onKeyboardHeightChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offKeyboardHeightChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_I32_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Int32 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_I32_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int32 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_I32_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_I32_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offKeyboardHeightChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_I32_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offKeyboardHeightChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onKeyboardDidShow(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_KeyboardInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_KeyboardInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_KeyboardInfo_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onKeyboardDidShow(thisPtr, static_cast<OHOS_WINDOW_window_Callback_KeyboardInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onKeyboardDidShow, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offKeyboardDidShow(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_KeyboardInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_KeyboardInfo_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offKeyboardDidShow(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offKeyboardDidShow, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onKeyboardDidHide(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_KeyboardInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_KeyboardInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_KeyboardInfo_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onKeyboardDidHide(thisPtr, static_cast<OHOS_WINDOW_window_Callback_KeyboardInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onKeyboardDidHide, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offKeyboardDidHide(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_KeyboardInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_KeyboardInfo_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offKeyboardDidHide(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_KeyboardInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offKeyboardDidHide, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onTouchOutside(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onTouchOutside(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onTouchOutside, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offTouchOutside(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offTouchOutside(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offTouchOutside, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onDisplayIdChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_I64_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Int64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_I64_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_I64_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onDisplayIdChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_I64_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onDisplayIdChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offDisplayIdChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_I64_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Int64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_I64_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_I64_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_I64_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offDisplayIdChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_I64_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offDisplayIdChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onWindowVisibilityChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Boolean_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowVisibilityChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Boolean_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowVisibilityChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowVisibilityChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Boolean_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Boolean_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowVisibilityChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Boolean_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowVisibilityChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onSystemDensityChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_F64_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Float64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_F64_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Float64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_F64_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onSystemDensityChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_F64_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onSystemDensityChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offSystemDensityChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_F64_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Float64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_F64_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Float64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_F64_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_F64_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offSystemDensityChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_F64_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offSystemDensityChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onNoInteractionDetected(OH_NativePointer thisPtr, KLong timeout, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onNoInteractionDetected(thisPtr, timeout, static_cast<OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_onNoInteractionDetected, OH_NativePointer, KLong, KSerializerBuffer, int32_t)
void impl_window_Window_offNoInteractionDetected(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offNoInteractionDetected(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offNoInteractionDetected, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onScreenshot(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onScreenshot(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onScreenshot, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offScreenshot(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offScreenshot(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offScreenshot, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onDialogTargetTouch(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onDialogTargetTouch(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onDialogTargetTouch, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offDialogTargetTouch(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offDialogTargetTouch(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offDialogTargetTouch, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onWindowEvent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_WindowEventType_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowEventType_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowEventType_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowEvent(thisPtr, static_cast<OHOS_WINDOW_window_Callback_WindowEventType_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowEvent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowEvent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowEventType_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowEventType_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowEvent(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_WindowEventType_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowEvent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onWindowStatusChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_WindowStatusType_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowStatusType_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowStatusType_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowStatusChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_WindowStatusType_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowStatusChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowStatusChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowStatusType_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowStatusType_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowStatusChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_WindowStatusType_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowStatusChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onSubWindowClose(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onSubWindowClose(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onSubWindowClose, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offSubWindowClose(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offSubWindowClose(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offSubWindowClose, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onWindowWillClose(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Promise_Boolean callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Promise_Boolean)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Promise_Boolean))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowWillClose(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Promise_Boolean*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowWillClose, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowWillClose(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Promise_Boolean callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Promise_Boolean)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Promise_Boolean))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Promise_Boolean callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowWillClose(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Promise_Boolean*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowWillClose, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onWindowHighlightChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Boolean_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowHighlightChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Boolean_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowHighlightChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowHighlightChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Boolean_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Boolean_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowHighlightChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Boolean_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowHighlightChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_isWindowSupportWideGamut0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Boolean_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->isWindowSupportWideGamut0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_isWindowSupportWideGamut0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_isWindowSupportWideGamut1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->isWindowSupportWideGamut1(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_isWindowSupportWideGamut1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowColorSpace0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Int32 colorSpace, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowColorSpace0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_WINDOW_window_ColorSpace>(colorSpace), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setWindowColorSpace0, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowColorSpace1(OH_NativePointer thisPtr, OH_Int32 colorSpace, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowColorSpace1(thisPtr, static_cast<OH_OHOS_WINDOW_window_ColorSpace>(colorSpace), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_setWindowColorSpace1, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowBackgroundColor(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 colorValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_WINDOW_Union_String_ColorMetrics colorValueTempTmpBuf = {};
        colorValueTempTmpBuf.selector = colorValueTempTmpBufUnionSelector;
        if (colorValueTempTmpBufUnionSelector == 0) {
            colorValueTempTmpBuf.selector = 0;
            colorValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (colorValueTempTmpBufUnionSelector == 1) {
            colorValueTempTmpBuf.selector = 1;
            colorValueTempTmpBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for colorValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_WINDOW_Union_String_ColorMetrics colorValueTemp = static_cast<OH_OHOS_WINDOW_Union_String_ColorMetrics>(colorValueTempTmpBuf);;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowBackgroundColor(thisPtr, static_cast<OH_OHOS_WINDOW_Union_String_ColorMetrics*>(&colorValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_setWindowBackgroundColor, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowFocusable0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean isFocusable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowFocusable0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, isFocusable, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setWindowFocusable0, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowFocusable1(OH_NativePointer thisPtr, OH_Boolean isFocusable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowFocusable1(thisPtr, isFocusable, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_setWindowFocusable1, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowKeepScreenOn0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean isKeepScreenOn, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowKeepScreenOn0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, isKeepScreenOn, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setWindowKeepScreenOn0, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowKeepScreenOn1(OH_NativePointer thisPtr, OH_Boolean isKeepScreenOn, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowKeepScreenOn1(thisPtr, isKeepScreenOn, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_setWindowKeepScreenOn1, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowPrivacyMode0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean isPrivacyMode, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowPrivacyMode0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, isPrivacyMode, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setWindowPrivacyMode0, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowPrivacyMode1(OH_NativePointer thisPtr, OH_Boolean isPrivacyMode, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowPrivacyMode1(thisPtr, isPrivacyMode, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_setWindowPrivacyMode1, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowTouchable0(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean isTouchable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowTouchable0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, isTouchable, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setWindowTouchable0, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowTouchable1(OH_NativePointer thisPtr, OH_Boolean isTouchable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowTouchable1(thisPtr, isTouchable, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_setWindowTouchable1, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_snapshot0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->snapshot0(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_snapshot0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_snapshot1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->snapshot1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Image_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_snapshot1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_opacity(OH_NativePointer thisPtr, KDouble opacity) {
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->opacity(thisPtr, opacity);
}
KOALA_INTEROP_V2(window_Window_opacity, OH_NativePointer, KDouble)
void impl_window_Window_scale(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WINDOW_window_ScaleOptions scaleOptionsValueTemp = window_ScaleOptions_serializer::read(thisDeserializer);;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->scale(thisPtr, static_cast<OH_OHOS_WINDOW_window_ScaleOptions*>(&scaleOptionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_scale, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_rotate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WINDOW_window_RotateOptions rotateOptionsValueTemp = window_RotateOptions_serializer::read(thisDeserializer);;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->rotate(thisPtr, static_cast<OH_OHOS_WINDOW_window_RotateOptions*>(&rotateOptionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_rotate, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_translate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WINDOW_window_TranslateOptions translateOptionsValueTemp = window_TranslateOptions_serializer::read(thisDeserializer);;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->translate(thisPtr, static_cast<OH_OHOS_WINDOW_window_TranslateOptions*>(&translateOptionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_translate, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setShadow(OH_NativePointer thisPtr, KDouble radius, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto colorValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_String colorValueTempTmpBuf = {};
        colorValueTempTmpBuf.tag = colorValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((colorValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            colorValueTempTmpBuf.value = static_cast<OH_String>(thisDeserializer.readString());
        }
        Opt_String colorValueTemp = colorValueTempTmpBuf;;
        const auto offsetXValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Float64 offsetXValueTempTmpBuf = {};
        offsetXValueTempTmpBuf.tag = offsetXValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((offsetXValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            offsetXValueTempTmpBuf.value = thisDeserializer.readFloat64();
        }
        Opt_Float64 offsetXValueTemp = offsetXValueTempTmpBuf;;
        const auto offsetYValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Float64 offsetYValueTempTmpBuf = {};
        offsetYValueTempTmpBuf.tag = offsetYValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((offsetYValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            offsetYValueTempTmpBuf.value = thisDeserializer.readFloat64();
        }
        Opt_Float64 offsetYValueTemp = offsetYValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setShadow(thisPtr, radius, static_cast<Opt_String*>(&colorValueTemp), static_cast<Opt_Float64*>(&offsetXValueTemp), static_cast<Opt_Float64*>(&offsetYValueTemp));
}
KOALA_INTEROP_V4(window_Window_setShadow, OH_NativePointer, KDouble, KSerializerBuffer, int32_t)
void impl_window_Window_setWaterMarkFlag0(OH_NativePointer thisPtr, OH_Boolean enable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWaterMarkFlag0(thisPtr, enable, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_setWaterMarkFlag0, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_setWaterMarkFlag1(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean enable, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWaterMarkFlag1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, enable, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_setWaterMarkFlag1, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_minimize0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->minimize0(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_minimize0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_minimize1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->minimize1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_minimize1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_maximize(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto presentationValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_window_MaximizePresentation presentationValueTempTmpBuf = {};
        presentationValueTempTmpBuf.tag = presentationValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((presentationValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            presentationValueTempTmpBuf.value = static_cast<OH_OHOS_WINDOW_window_MaximizePresentation>(thisDeserializer.readInt32());
        }
        Opt_window_MaximizePresentation presentationValueTemp = presentationValueTempTmpBuf;;
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->maximize(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<Opt_window_MaximizePresentation*>(&presentationValueTemp), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_maximize, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_hideNonSystemFloatingWindows0(OH_NativePointer thisPtr, OH_Boolean shouldHide, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->hideNonSystemFloatingWindows0(thisPtr, shouldHide, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(window_Window_hideNonSystemFloatingWindows0, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_hideNonSystemFloatingWindows1(KVMContext vmContext, OH_NativePointer thisPtr, OH_Boolean shouldHide, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->hideNonSystemFloatingWindows1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, shouldHide, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_Window_hideNonSystemFloatingWindows1, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_keepKeyboardOnFocus(OH_NativePointer thisPtr, OH_Boolean keepKeyboardFlag) {
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->keepKeyboardOnFocus(thisPtr, keepKeyboardFlag);
}
KOALA_INTEROP_DIRECT_V2(window_Window_keepKeyboardOnFocus, OH_NativePointer, OH_Boolean)
void impl_window_Window_recover(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->recover(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_recover, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowDecorVisible(OH_NativePointer thisPtr, OH_Boolean isVisible) {
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowDecorVisible(thisPtr, isVisible);
}
KOALA_INTEROP_DIRECT_V2(window_Window_setWindowDecorVisible, OH_NativePointer, OH_Boolean)
void impl_window_Window_setWindowDecorHeight(OH_NativePointer thisPtr, OH_Int32 height) {
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowDecorHeight(thisPtr, height);
}
KOALA_INTEROP_DIRECT_V2(window_Window_setWindowDecorHeight, OH_NativePointer, OH_Int32)
OH_Int32 impl_window_Window_getWindowDecorHeight(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->getWindowDecorHeight(thisPtr);
}
KOALA_INTEROP_DIRECT_1(window_Window_getWindowDecorHeight, OH_Int32, OH_NativePointer)
void impl_window_Window_setDecorButtonStyle(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_WINDOW_window_DecorButtonStyle dectorStyleValueTemp = window_DecorButtonStyle_serializer::read(thisDeserializer);;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setDecorButtonStyle(thisPtr, static_cast<OH_OHOS_WINDOW_window_DecorButtonStyle*>(&dectorStyleValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_setDecorButtonStyle, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setWindowTitleButtonVisible(OH_NativePointer thisPtr, OH_Boolean isMaximizeButtonVisible, OH_Boolean isMinimizeButtonVisible, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto isCloseButtonVisibleValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean isCloseButtonVisibleValueTempTmpBuf = {};
        isCloseButtonVisibleValueTempTmpBuf.tag = isCloseButtonVisibleValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((isCloseButtonVisibleValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            isCloseButtonVisibleValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean isCloseButtonVisibleValueTemp = isCloseButtonVisibleValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setWindowTitleButtonVisible(thisPtr, isMaximizeButtonVisible, isMinimizeButtonVisible, static_cast<Opt_Boolean*>(&isCloseButtonVisibleValueTemp));
}
KOALA_INTEROP_DIRECT_V5(window_Window_setWindowTitleButtonVisible, OH_NativePointer, OH_Boolean, OH_Boolean, KSerializerBuffer, int32_t)
void impl_window_Window_startMoving0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->startMoving0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_Window_startMoving0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_startMoving1(KVMContext vmContext, OH_NativePointer thisPtr, OH_Int32 offsetX, OH_Int32 offsetY, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->startMoving1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, offsetX, offsetY, static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V5(window_Window_startMoving1, OH_NativePointer, OH_Int32, OH_Int32, KSerializerBuffer, int32_t)
void impl_window_Window_onWindowTitleButtonRectChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_TitleButtonRect_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_TitleButtonRect_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_TitleButtonRect_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowTitleButtonRectChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_TitleButtonRect_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowTitleButtonRectChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowTitleButtonRectChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_TitleButtonRect_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_TitleButtonRect_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowTitleButtonRectChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_TitleButtonRect_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowTitleButtonRectChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_onWindowRectChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_RectChangeOptions_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_RectChangeOptions_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_RectChangeOptions_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->onWindowRectChange(thisPtr, static_cast<OHOS_WINDOW_window_Callback_RectChangeOptions_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_onWindowRectChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_offWindowRectChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_RectChangeOptions_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_RectChangeOptions_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->offWindowRectChange(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_RectChangeOptions_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_Window_offWindowRectChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_Window_setImmersiveModeEnabledState(OH_NativePointer thisPtr, OH_Boolean enabled) {
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->setImmersiveModeEnabledState(thisPtr, enabled);
}
KOALA_INTEROP_DIRECT_V2(window_Window_setImmersiveModeEnabledState, OH_NativePointer, OH_Boolean)
OH_Int32 impl_window_Window_getWindowStatus(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_Window()->getWindowStatus(thisPtr);
}
KOALA_INTEROP_DIRECT_1(window_Window_getWindowStatus, OH_Int32, OH_NativePointer)
OH_NativePointer impl_window_WindowStage_construct() {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->construct();
}
KOALA_INTEROP_DIRECT_0(window_WindowStage_construct, OH_NativePointer)
OH_NativePointer impl_window_WindowStage_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->destruct;
}
KOALA_INTEROP_DIRECT_0(window_WindowStage_getFinalizer, OH_NativePointer)
void impl_window_WindowStage_getMainWindow0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Window_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Window_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->getMainWindow0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(window_WindowStage_getMainWindow0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_WindowStage_getMainWindow1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->getMainWindow1(thisPtr, static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_WindowStage_getMainWindow1, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_window_WindowStage_getMainWindowSync(OH_NativePointer thisPtr) {
        return GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->getMainWindowSync(thisPtr);
}
KOALA_INTEROP_DIRECT_1(window_WindowStage_getMainWindowSync, OH_NativePointer, OH_NativePointer)
void impl_window_WindowStage_createSubWindow0(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& name, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Window_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Window_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->createSubWindow0(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&name), static_cast<OHOS_WINDOW_Callback_Opt_Window_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_WindowStage_createSubWindow0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_createSubWindow1(OH_NativePointer thisPtr, const KStringPtr& name, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->createSubWindow1(thisPtr, (const OH_String*) (&name), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(window_WindowStage_createSubWindow1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_loadContent0(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject storageValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->loadContent0(thisPtr, (const OH_String*) (&path), static_cast<OH_CustomObject*>(&storageValueTemp), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(window_WindowStage_loadContent0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_loadContent1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto storageValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_CustomObject storageValueTempTmpBuf = {};
        storageValueTempTmpBuf.tag = storageValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((storageValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            storageValueTempTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        }
        Opt_CustomObject storageValueTemp = storageValueTempTmpBuf;;
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->loadContent1(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&path), static_cast<Opt_CustomObject*>(&storageValueTemp), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_WindowStage_loadContent1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_loadContent2(OH_NativePointer thisPtr, const KStringPtr& path, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->loadContent2(thisPtr, (const OH_String*) (&path), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(window_WindowStage_loadContent2, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_loadContentByName0(OH_NativePointer thisPtr, const KStringPtr& name, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject storageValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->loadContentByName0(thisPtr, (const OH_String*) (&name), static_cast<OH_CustomObject*>(&storageValueTemp), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(window_WindowStage_loadContentByName0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_loadContentByName1(OH_NativePointer thisPtr, const KStringPtr& name, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->loadContentByName1(thisPtr, (const OH_String*) (&name), static_cast<OHOS_WINDOW_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_V4(window_WindowStage_loadContentByName1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_loadContentByName2(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& name, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto storageValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_CustomObject storageValueTempTmpBuf = {};
        storageValueTempTmpBuf.tag = storageValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((storageValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            storageValueTempTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        }
        Opt_CustomObject storageValueTemp = storageValueTempTmpBuf;;
        OHOS_WINDOW_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->loadContentByName2(reinterpret_cast<OH_OHOS_WINDOW_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&name), static_cast<Opt_CustomObject*>(&storageValueTemp), static_cast<OHOS_WINDOW_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(window_WindowStage_loadContentByName2, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_window_WindowStage_onWindowStageEvent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_WindowStageEventType_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowStageEventType_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowStageEventType_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->onWindowStageEvent(thisPtr, static_cast<OHOS_WINDOW_window_Callback_WindowStageEventType_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_WindowStage_onWindowStageEvent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_WindowStage_offWindowStageEvent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowStageEventType_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowStageEventType_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->offWindowStageEvent(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_WindowStageEventType_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_WindowStage_offWindowStageEvent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_WindowStage_onWindowStageClose(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_WINDOW_window_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->onWindowStageClose(thisPtr, static_cast<OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_WindowStage_onWindowStageClose, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_WindowStage_offWindowStageClose(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_WINDOW_window_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->offWindowStageClose(thisPtr, static_cast<Opt_OHOS_WINDOW_window_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(window_WindowStage_offWindowStageClose, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_window_WindowStage_disableWindowDecor(OH_NativePointer thisPtr) {
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->disableWindowDecor(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(window_WindowStage_disableWindowDecor, OH_NativePointer)
void impl_window_WindowStage_setShowOnLockScreen(OH_NativePointer thisPtr, OH_Boolean showOnLockScreen) {
        GetOH_OHOS_WINDOW_API(OHOS_WINDOW_API_VERSION)->Window_WindowStage()->setShowOnLockScreen(thisPtr, showOnLockScreen);
}
KOALA_INTEROP_DIRECT_V2(window_WindowStage_setShowOnLockScreen, OH_NativePointer, OH_Boolean)
void deserializeAndCallCallback_AvoidAreaOptions_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_AvoidAreaOptions_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_AvoidAreaOptions value0 = window_AvoidAreaOptions_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_AvoidAreaOptions_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_AvoidAreaOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_AvoidAreaOptions_Void))));
    OH_OHOS_WINDOW_window_AvoidAreaOptions value0 = window_AvoidAreaOptions_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Boolean_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Boolean_Void))));
    thisDeserializer.readPointer();
    OH_Boolean value0 = thisDeserializer.readBoolean();
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Boolean_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Boolean_Void))));
    OH_Boolean value0 = thisDeserializer.readBoolean();
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_F64_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Float64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_F64_Void))));
    thisDeserializer.readPointer();
    OH_Float64 value0 = thisDeserializer.readFloat64();
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_F64_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Float64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_F64_Void))));
    OH_Float64 value0 = thisDeserializer.readFloat64();
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_I32_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Int32 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_I32_Void))));
    thisDeserializer.readPointer();
    OH_Int32 value0 = thisDeserializer.readInt32();
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_I32_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int32 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_I32_Void))));
    OH_Int32 value0 = thisDeserializer.readInt32();
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_I64_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Int64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_I64_Void))));
    thisDeserializer.readPointer();
    OH_Int64 value0 = thisDeserializer.readInt64();
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_I64_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_Int64 value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_I64_Void))));
    OH_Int64 value0 = thisDeserializer.readInt64();
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_KeyboardInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_KeyboardInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_KeyboardInfo value0 = window_KeyboardInfo_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_KeyboardInfo_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_KeyboardInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_KeyboardInfo_Void))));
    OH_OHOS_WINDOW_window_KeyboardInfo value0 = window_KeyboardInfo_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Array_String_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))));
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_Boolean_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Boolean valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readBoolean();
    }
    Opt_Boolean value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Boolean_Opt_Array_String_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
    Opt_Boolean valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = thisDeserializer.readBoolean();
    }
    Opt_Boolean value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_Image_PixelMap_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
    Opt_image_PixelMap valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_OHOS_WINDOW_image_PixelMap>(image_PixelMap_serializer::read(thisDeserializer));
    }
    Opt_image_PixelMap value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Image_PixelMap_Opt_Array_String_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
    Opt_image_PixelMap valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_OHOS_WINDOW_image_PixelMap>(image_PixelMap_serializer::read(thisDeserializer));
    }
    Opt_image_PixelMap value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_Window_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Window_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Window_Opt_Array_String_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Window_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_WINDOW_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Promise_Boolean(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Promise_Boolean))));
    thisDeserializer.readPointer();
    OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuationResult = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Boolean_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))))};
    _call(_resourceId, continuationResult);
}
void deserializeAndCallSyncCallback_Promise_Boolean(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Promise_Boolean))));
    OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuationResult = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Boolean_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Boolean_Opt_Array_String_Void))))};
    callSyncMethod(vmContext, resourceId, continuationResult);
}
void deserializeAndCallCallback_RectChangeOptions_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_RectChangeOptions_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_RectChangeOptions value0 = window_RectChangeOptions_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_RectChangeOptions_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_RectChangeOptions value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_RectChangeOptions_Void))));
    OH_OHOS_WINDOW_window_RectChangeOptions value0 = window_RectChangeOptions_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Size_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Size_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_Size value0 = window_Size_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Size_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_Size value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Size_Void))));
    OH_OHOS_WINDOW_window_Size value0 = window_Size_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_TitleButtonRect_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_TitleButtonRect_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_TitleButtonRect value0 = window_TitleButtonRect_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_TitleButtonRect_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WINDOW_window_TitleButtonRect value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_TitleButtonRect_Void))));
    OH_OHOS_WINDOW_window_TitleButtonRect value0 = window_TitleButtonRect_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void))));
    thisDeserializer.readPointer();
    _call(_resourceId);
}
void deserializeAndCallSyncCallback_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback_WindowEventType_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowEventType_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_WindowEventType value0 = static_cast<OH_OHOS_WINDOW_window_WindowEventType>(thisDeserializer.readInt32());
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_WindowEventType_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowEventType_Void))));
    OH_OHOS_WINDOW_window_WindowEventType value0 = static_cast<OH_OHOS_WINDOW_window_WindowEventType>(thisDeserializer.readInt32());
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_WindowStageEventType_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowStageEventType_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_WindowStageEventType value0 = static_cast<OH_OHOS_WINDOW_window_WindowStageEventType>(thisDeserializer.readInt32());
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_WindowStageEventType_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowStageEventType_Void))));
    OH_OHOS_WINDOW_window_WindowStageEventType value0 = static_cast<OH_OHOS_WINDOW_window_WindowStageEventType>(thisDeserializer.readInt32());
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_WindowStatusType_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_WindowStatusType_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_WINDOW_window_WindowStatusType value0 = static_cast<OH_OHOS_WINDOW_window_WindowStatusType>(thisDeserializer.readInt32());
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_WindowStatusType_Void(OH_OHOS_WINDOW_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_WINDOW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_WindowStatusType_Void))));
    OH_OHOS_WINDOW_window_WindowStatusType value0 = static_cast<OH_OHOS_WINDOW_window_WindowStatusType>(thisDeserializer.readInt32());
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_AvoidAreaOptions_Void: return deserializeAndCallCallback_AvoidAreaOptions_Void(thisArray, thisLength);
        case Kind_Callback_Boolean_Void: return deserializeAndCallCallback_Boolean_Void(thisArray, thisLength);
        case Kind_Callback_F64_Void: return deserializeAndCallCallback_F64_Void(thisArray, thisLength);
        case Kind_Callback_I32_Void: return deserializeAndCallCallback_I32_Void(thisArray, thisLength);
        case Kind_Callback_I64_Void: return deserializeAndCallCallback_I64_Void(thisArray, thisLength);
        case Kind_Callback_KeyboardInfo_Void: return deserializeAndCallCallback_KeyboardInfo_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Boolean_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Image_PixelMap_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Window_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Window_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Promise_Boolean: return deserializeAndCallCallback_Promise_Boolean(thisArray, thisLength);
        case Kind_Callback_RectChangeOptions_Void: return deserializeAndCallCallback_RectChangeOptions_Void(thisArray, thisLength);
        case Kind_Callback_Size_Void: return deserializeAndCallCallback_Size_Void(thisArray, thisLength);
        case Kind_Callback_TitleButtonRect_Void: return deserializeAndCallCallback_TitleButtonRect_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
        case Kind_Callback_WindowEventType_Void: return deserializeAndCallCallback_WindowEventType_Void(thisArray, thisLength);
        case Kind_Callback_WindowStageEventType_Void: return deserializeAndCallCallback_WindowStageEventType_Void(thisArray, thisLength);
        case Kind_Callback_WindowStatusType_Void: return deserializeAndCallCallback_WindowStatusType_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_AvoidAreaOptions_Void: return deserializeAndCallSyncCallback_AvoidAreaOptions_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Boolean_Void: return deserializeAndCallSyncCallback_Boolean_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_F64_Void: return deserializeAndCallSyncCallback_F64_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_I32_Void: return deserializeAndCallSyncCallback_I32_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_I64_Void: return deserializeAndCallSyncCallback_I64_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_KeyboardInfo_Void: return deserializeAndCallSyncCallback_KeyboardInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Boolean_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Image_PixelMap_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Window_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Window_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Promise_Boolean: return deserializeAndCallSyncCallback_Promise_Boolean(vmContext, thisArray, thisLength);
        case Kind_Callback_RectChangeOptions_Void: return deserializeAndCallSyncCallback_RectChangeOptions_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Size_Void: return deserializeAndCallSyncCallback_Size_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_TitleButtonRect_Void: return deserializeAndCallSyncCallback_TitleButtonRect_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WindowEventType_Void: return deserializeAndCallSyncCallback_WindowEventType_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WindowStageEventType_Void: return deserializeAndCallSyncCallback_WindowStageEventType_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_WindowStatusType_Void: return deserializeAndCallSyncCallback_WindowStatusType_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_AvoidAreaOptions_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_AvoidAreaOptions value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_AvoidAreaOptions_Void);
    argsSerializer.writeInt32(resourceId);
    window_AvoidAreaOptions_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_AvoidAreaOptions_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_AvoidAreaOptions value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_AvoidAreaOptions_Void);
    argsSerializer.writeInt32(resourceId);
    window_AvoidAreaOptions_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Boolean_Void(OH_Int32 resourceId, OH_Boolean value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Boolean_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeBoolean(value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Boolean_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_Boolean value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Boolean_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeBoolean(value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_F64_Void(OH_Int32 resourceId, OH_Float64 value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_F64_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeFloat64(value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_F64_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_Float64 value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_F64_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeFloat64(value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_I32_Void(OH_Int32 resourceId, OH_Int32 value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_I32_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_I32_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_Int32 value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_I32_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_I64_Void(OH_Int32 resourceId, OH_Int64 value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_I64_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt64(value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_I64_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_Int64 value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_I64_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt64(value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_KeyboardInfo_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_KeyboardInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_KeyboardInfo_Void);
    argsSerializer.writeInt32(resourceId);
    window_KeyboardInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_KeyboardInfo_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_KeyboardInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_KeyboardInfo_Void);
    argsSerializer.writeInt32(resourceId);
    window_KeyboardInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Array_String_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String error)
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
void callManagedCallback_Opt_Boolean_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Boolean value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Boolean_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeBoolean(valueTmpValue);
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
void callManagedCallback_Opt_Boolean_Opt_Array_String_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, Opt_Boolean value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Boolean_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeBoolean(valueTmpValue);
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
void callManagedCallback_Opt_Image_PixelMap_Opt_Array_String_Void(OH_Int32 resourceId, Opt_image_PixelMap value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        image_PixelMap_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_Image_PixelMap_Opt_Array_String_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, Opt_image_PixelMap value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        image_PixelMap_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_Window_Opt_Array_String_Void(OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Window_Opt_Array_String_Void);
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
void callManagedCallback_Opt_Window_Opt_Array_String_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, Opt_CustomObject value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Window_Opt_Array_String_Void);
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
void callManagedCallback_Promise_Boolean(OH_Int32 resourceId, OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Promise_Boolean);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Promise_BooleanSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OHOS_WINDOW_Callback_Opt_Boolean_Opt_Array_String_Void continuation)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Promise_Boolean);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCallbackResource(continuation.resource);
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.call));
    argsSerializer.writePointer(reinterpret_cast<OH_NativePointer>(continuation.callSync));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_RectChangeOptions_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_RectChangeOptions value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_RectChangeOptions_Void);
    argsSerializer.writeInt32(resourceId);
    window_RectChangeOptions_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_RectChangeOptions_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_RectChangeOptions value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_RectChangeOptions_Void);
    argsSerializer.writeInt32(resourceId);
    window_RectChangeOptions_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Size_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_Size value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Size_Void);
    argsSerializer.writeInt32(resourceId);
    window_Size_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Size_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_Size value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Size_Void);
    argsSerializer.writeInt32(resourceId);
    window_Size_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_TitleButtonRect_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_TitleButtonRect value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_TitleButtonRect_Void);
    argsSerializer.writeInt32(resourceId);
    window_TitleButtonRect_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_TitleButtonRect_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_TitleButtonRect value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_TitleButtonRect_Void);
    argsSerializer.writeInt32(resourceId);
    window_TitleButtonRect_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Void(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WindowEventType_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WindowEventType_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_WindowEventType>(value0));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WindowEventType_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowEventType value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WindowEventType_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_WindowEventType>(value0));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WindowStageEventType_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WindowStageEventType_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_WindowStageEventType>(value0));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WindowStageEventType_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStageEventType value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WindowStageEventType_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_WindowStageEventType>(value0));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_WindowStatusType_Void(OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_WINDOW_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_WindowStatusType_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_WindowStatusType>(value0));
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_WindowStatusType_VoidSync(OH_OHOS_WINDOW_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_WINDOW_window_WindowStatusType value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_WindowStatusType_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_WINDOW_window_WindowStatusType>(value0));
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
OH_NativePointer getManagedCallbackCaller(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_AvoidAreaOptions_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_AvoidAreaOptions_Void);
        case Kind_Callback_Boolean_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Boolean_Void);
        case Kind_Callback_F64_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_F64_Void);
        case Kind_Callback_I32_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_I32_Void);
        case Kind_Callback_I64_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_I64_Void);
        case Kind_Callback_KeyboardInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_KeyboardInfo_Void);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Void);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Boolean_Opt_Array_String_Void);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Image_PixelMap_Opt_Array_String_Void);
        case Kind_Callback_Opt_Window_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Window_Opt_Array_String_Void);
        case Kind_Callback_Promise_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Promise_Boolean);
        case Kind_Callback_RectChangeOptions_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_RectChangeOptions_Void);
        case Kind_Callback_Size_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Size_Void);
        case Kind_Callback_TitleButtonRect_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_TitleButtonRect_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
        case Kind_Callback_WindowEventType_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WindowEventType_Void);
        case Kind_Callback_WindowStageEventType_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WindowStageEventType_Void);
        case Kind_Callback_WindowStatusType_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WindowStatusType_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_AvoidAreaOptions_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_AvoidAreaOptions_VoidSync);
        case Kind_Callback_Boolean_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Boolean_VoidSync);
        case Kind_Callback_F64_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_F64_VoidSync);
        case Kind_Callback_I32_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_I32_VoidSync);
        case Kind_Callback_I64_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_I64_VoidSync);
        case Kind_Callback_KeyboardInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_KeyboardInfo_VoidSync);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Boolean_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Boolean_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Image_PixelMap_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Window_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Window_Opt_Array_String_VoidSync);
        case Kind_Callback_Promise_Boolean: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Promise_BooleanSync);
        case Kind_Callback_RectChangeOptions_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_RectChangeOptions_VoidSync);
        case Kind_Callback_Size_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Size_VoidSync);
        case Kind_Callback_TitleButtonRect_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_TitleButtonRect_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
        case Kind_Callback_WindowEventType_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WindowEventType_VoidSync);
        case Kind_Callback_WindowStageEventType_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WindowStageEventType_VoidSync);
        case Kind_Callback_WindowStatusType_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_WindowStatusType_VoidSync);
    }
    return nullptr;
}