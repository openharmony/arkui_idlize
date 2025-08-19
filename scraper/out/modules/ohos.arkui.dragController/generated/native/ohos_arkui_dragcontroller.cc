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

#include "ohos_arkui_dragcontroller.h"

#define KOALA_INTEROP_MODULE OHOS_ARKUI_DRAGCONTROLLERNativeModule
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
    Kind_Callback_DragAndDropInfo_Void = 381285491,
    Kind_Callback_Opt_Array_String_Void = -543655128,
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_Array_String& value)
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_DragAction* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_DragAction& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_DragPreview* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_DragPreview& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStartRequestStatus& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStartRequestStatus value) {
    result->append("OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStartRequestStatus(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_DragStartRequestStatus* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_DragStartRequestStatus& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus value) {
    result->append("OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_DragStatus* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_DragStatus& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_unifiedDataChannel_UnifiedData* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_unifiedDataChannel_UnifiedData& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_CustomObject
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
inline void WriteToString(std::string* result, const Opt_Union_Curve_ICurve* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_Union_Curve_ICurve& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions* value) {
    result->append("{");
    // OH_Number duration
    result->append(".duration=");
    WriteToString(result, &value->duration);
    // OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve curve
    result->append(", ");
    result->append(".curve=");
    WriteToString(result, &value->curve);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_AnimationOptions* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_AnimationOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo* value) {
    result->append("{");
    // OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus status
    result->append(".status=");
    WriteToString(result, value->status);
    // OH_CustomObject event
    result->append(", ");
    result->append(".event=");
    WriteToString(result, &value->event);
    // OH_String extraParams
    result->append(", ");
    result->append(".extraParams=");
    WriteToString(result, &value->extraParams);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_DragAndDropInfo* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_DragAndDropInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam* value) {
    result->append("{");
    // OH_CustomObject event
    result->append(".event=");
    WriteToString(result, &value->event);
    // OH_String extraParams
    result->append(", ");
    result->append(".extraParams=");
    WriteToString(result, &value->extraParams);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_DragEventParam* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_DragEventParam& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo* value) {
    result->append("{");
    // OH_Number pointerId
    result->append(".pointerId=");
    WriteToString(result, &value->pointerId);
    // OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData data
    result->append(", ");
    result->append(".data=");
    WriteToString(result, &value->data);
    // OH_String extraParams
    result->append(", ");
    result->append(".extraParams=");
    WriteToString(result, &value->extraParams);
    // OH_CustomObject touchPoint
    result->append(", ");
    result->append(".touchPoint=");
    WriteToString(result, &value->touchPoint);
    // OH_CustomObject previewOptions
    result->append(", ");
    result->append(".previewOptions=");
    WriteToString(result, &value->previewOptions);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_dragController_DragInfo* value) {
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_dragController_DragInfo& value)
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
inline OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class dragController_DragAction_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction value);
    static OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction read(DeserializerBase& buffer);
};
class dragController_DragPreview_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview value);
    static OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview read(DeserializerBase& buffer);
};
class unifiedDataChannel_UnifiedData_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData value);
    static OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData read(DeserializerBase& buffer);
};
class dragController_AnimationOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions value);
    static OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions read(DeserializerBase& buffer);
};
class dragController_DragAndDropInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value);
    static OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo read(DeserializerBase& buffer);
};
class dragController_DragEventParam_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam value);
    static OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam read(DeserializerBase& buffer);
};
class dragController_DragInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo value);
    static OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo read(DeserializerBase& buffer);
};
inline void dragController_DragAction_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction dragController_DragAction_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAction>(ptr);
}
inline void dragController_DragPreview_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview dragController_DragPreview_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragPreview>(ptr);
}
inline void unifiedDataChannel_UnifiedData_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData unifiedDataChannel_UnifiedData_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData>(ptr);
}
inline void dragController_AnimationOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForDuration = value.duration;
    if (runtimeType(valueHolderForDuration) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDurationTmpValue = valueHolderForDuration.value;
        valueSerializer.writeNumber(valueHolderForDurationTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCurve = value.curve;
    if (runtimeType(valueHolderForCurve) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCurveTmpValue = valueHolderForCurve.value;
        if (valueHolderForCurveTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForCurveTmpValueForIdx0 = valueHolderForCurveTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForCurveTmpValueForIdx0);
        } else if (valueHolderForCurveTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForCurveTmpValueForIdx1 = valueHolderForCurveTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForCurveTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions dragController_AnimationOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto durationTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number durationTmpBuf = {};
    durationTmpBuf.tag = durationTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((durationTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        durationTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.duration = durationTmpBuf;
    const auto curveTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Curve_ICurve curveTmpBuf = {};
    curveTmpBuf.tag = curveTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((curveTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 curveTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve curveTmpBuf_ = {};
        curveTmpBuf_.selector = curveTmpBuf_UnionSelector;
        if (curveTmpBuf_UnionSelector == 0) {
            curveTmpBuf_.selector = 0;
            curveTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (curveTmpBuf_UnionSelector == 1) {
            curveTmpBuf_.selector = 1;
            curveTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for curveTmpBuf_ has to be chosen through deserialisation.");
        }
        curveTmpBuf.value = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_Union_Curve_ICurve>(curveTmpBuf_);
    }
    value.curve = curveTmpBuf;
    return value;
}
inline void dragController_DragAndDropInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForStatus = value.status;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus>(valueHolderForStatus));
    const auto valueHolderForEvent = value.event;
    valueSerializer.writeCustomObject("object", valueHolderForEvent);
    const auto valueHolderForExtraParams = value.extraParams;
    if (runtimeType(valueHolderForExtraParams) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForExtraParamsTmpValue = valueHolderForExtraParams.value;
        valueSerializer.writeString(valueHolderForExtraParamsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo dragController_DragAndDropInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.status = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragStatus>(valueDeserializer.readInt32());
    value.event = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    const auto extraParamsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(valueDeserializer.readInt8());
    Opt_String extraParamsTmpBuf = {};
    extraParamsTmpBuf.tag = extraParamsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((extraParamsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        extraParamsTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.extraParams = extraParamsTmpBuf;
    return value;
}
inline void dragController_DragEventParam_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForEvent = value.event;
    valueSerializer.writeCustomObject("object", valueHolderForEvent);
    const auto valueHolderForExtraParams = value.extraParams;
    valueSerializer.writeString(valueHolderForExtraParams);
}
inline OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam dragController_DragEventParam_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragEventParam value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.event = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.extraParams = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void dragController_DragInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForPointerId = value.pointerId;
    valueSerializer.writeNumber(valueHolderForPointerId);
    const auto valueHolderForData = value.data;
    if (runtimeType(valueHolderForData) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDataTmpValue = valueHolderForData.value;
        unifiedDataChannel_UnifiedData_serializer::write(valueSerializer, valueHolderForDataTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForExtraParams = value.extraParams;
    if (runtimeType(valueHolderForExtraParams) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForExtraParamsTmpValue = valueHolderForExtraParams.value;
        valueSerializer.writeString(valueHolderForExtraParamsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTouchPoint = value.touchPoint;
    if (runtimeType(valueHolderForTouchPoint) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTouchPointTmpValue = valueHolderForTouchPoint.value;
        valueSerializer.writeCustomObject("object", valueHolderForTouchPointTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForPreviewOptions = value.previewOptions;
    if (runtimeType(valueHolderForPreviewOptions) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPreviewOptionsTmpValue = valueHolderForPreviewOptions.value;
        valueSerializer.writeCustomObject("object", valueHolderForPreviewOptionsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo dragController_DragInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.pointerId = static_cast<OH_Number>(valueDeserializer.readNumber());
    const auto dataTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(valueDeserializer.readInt8());
    Opt_unifiedDataChannel_UnifiedData dataTmpBuf = {};
    dataTmpBuf.tag = dataTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dataTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dataTmpBuf.value = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_unifiedDataChannel_UnifiedData>(unifiedDataChannel_UnifiedData_serializer::read(valueDeserializer));
    }
    value.data = dataTmpBuf;
    const auto extraParamsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(valueDeserializer.readInt8());
    Opt_String extraParamsTmpBuf = {};
    extraParamsTmpBuf.tag = extraParamsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((extraParamsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        extraParamsTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.extraParams = extraParamsTmpBuf;
    const auto touchPointTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject touchPointTmpBuf = {};
    touchPointTmpBuf.tag = touchPointTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((touchPointTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        touchPointTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.touchPoint = touchPointTmpBuf;
    const auto previewOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject previewOptionsTmpBuf = {};
    previewOptionsTmpBuf.tag = previewOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((previewOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        previewOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.previewOptions = previewOptionsTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_ARKUI_DRAGCONTROLLER_API* GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_ARKUI_DRAGCONTROLLER_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_ARKUI_DRAGCONTROLLER_APIKind::OH_OHOS_ARKUI_DRAGCONTROLLER_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_dragController_DragAction_construct() {
        return GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragAction()->construct();
}
KOALA_INTEROP_DIRECT_0(dragController_DragAction_construct, OH_NativePointer)
OH_NativePointer impl_dragController_DragAction_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragAction()->destruct;
}
KOALA_INTEROP_DIRECT_0(dragController_DragAction_getFinalizer, OH_NativePointer)
void impl_dragController_DragAction_startDrag(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragAction()->startDrag(reinterpret_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OHOS_ARKUI_DRAGCONTROLLER_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(dragController_DragAction_startDrag, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_dragController_DragAction_onStatusChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DragAndDropInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DragAndDropInfo_Void))))};;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragAction()->onStatusChange(thisPtr, static_cast<OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(dragController_DragAction_onStatusChange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_dragController_DragAction_offStatusChange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DragAndDropInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DragAndDropInfo_Void))))};
        }
        Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragAction()->offStatusChange(thisPtr, static_cast<Opt_OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_DragAndDropInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(dragController_DragAction_offStatusChange, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_dragController_DragPreview_construct() {
        return GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragPreview()->construct();
}
KOALA_INTEROP_DIRECT_0(dragController_DragPreview_construct, OH_NativePointer)
OH_NativePointer impl_dragController_DragPreview_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragPreview()->destruct;
}
KOALA_INTEROP_DIRECT_0(dragController_DragPreview_getFinalizer, OH_NativePointer)
void impl_dragController_DragPreview_setForegroundColor(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject colorValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragPreview()->setForegroundColor(thisPtr, static_cast<OH_CustomObject*>(&colorValueTemp));
}
KOALA_INTEROP_DIRECT_V3(dragController_DragPreview_setForegroundColor, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_dragController_DragPreview_animate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions optionsValueTemp = dragController_AnimationOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void handlerValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ARKUI_DRAGCONTROLLER_API(OHOS_ARKUI_DRAGCONTROLLER_API_VERSION)->DragController_DragPreview()->animate(thisPtr, static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_AnimationOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_DRAGCONTROLLER_dragController_Callback_Void*>(&handlerValueTemp));
}
KOALA_INTEROP_DIRECT_V3(dragController_DragPreview_animate, OH_NativePointer, KSerializerBuffer, int32_t)
void deserializeAndCallCallback_DragAndDropInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DragAndDropInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0 = dragController_DragAndDropInfo_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_DragAndDropInfo_Void(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DragAndDropInfo_Void))));
    OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0 = dragController_DragAndDropInfo_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Array_String_Void(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))));
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_DRAGCONTROLLER_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void))));
    thisDeserializer.readPointer();
    _call(_resourceId);
}
void deserializeAndCallSyncCallback_Void(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_DragAndDropInfo_Void: return deserializeAndCallCallback_DragAndDropInfo_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_DragAndDropInfo_Void: return deserializeAndCallSyncCallback_DragAndDropInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_DragAndDropInfo_Void(OH_Int32 resourceId, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_DRAGCONTROLLER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_DragAndDropInfo_Void);
    argsSerializer.writeInt32(resourceId);
    dragController_DragAndDropInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_DragAndDropInfo_VoidSync(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_DRAGCONTROLLER_dragController_DragAndDropInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_DragAndDropInfo_Void);
    argsSerializer.writeInt32(resourceId);
    dragController_DragAndDropInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_DRAGCONTROLLER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Array_String_VoidSync(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String error)
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
void callManagedCallback_Void(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_DRAGCONTROLLER_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_ARKUI_DRAGCONTROLLER_VMContext vmContext, OH_Int32 resourceId)
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
        case Kind_Callback_DragAndDropInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_DragAndDropInfo_Void);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_DragAndDropInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_DragAndDropInfo_VoidSync);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}