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

#include "ohos_arkui_uicontext.h"

#define KOALA_INTEROP_MODULE OHOS_ARKUI_UICONTEXTNativeModule
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
    Kind_Callback_DismissDialogAction_Void = -2095828093,
    Kind_Callback_Number_Void = 36519084,
    Kind_Callback_Observer_DensityInfo_Void = -1740082194,
    Kind_Callback_Observer_NavDestinationInfo_Void = 1620208755,
    Kind_Callback_Observer_NavDestinationSwitchInfo_Void = 1784430305,
    Kind_Callback_Observer_RouterPageInfo_Void = 1823199598,
    Kind_Callback_Observer_ScrollEventInfo_Void = -989743241,
    Kind_Callback_Observer_TabContentInfo_Void = 518302824,
    Kind_Callback_Opt_Array_String_Void = -543655128,
    Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void = 1132774915,
    Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void = 305221743,
    Kind_Callback_Opt_Number_Opt_Array_String_Void = 1738660608,
    Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void = 1265283787,
    Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void = -1192132435,
    Kind_Callback_Void = -1867723152,
    Kind_ClickEventListenerCallback = -1578504153,
    Kind_GestureEventListenerCallback = 2107031758,
    Kind_GestureListenerCallback = -87100190,
    Kind_NodeRenderStateChangeCallback = -464893280,
    Kind_PanListenerCallback = -1052445574,
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Array_CustomObject& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_CustomObject* value);

template <>
inline void WriteToString(std::string* result, const Array_CustomObject* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_CustomObject, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_CustomObject*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_CustomObject* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Array_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Array_DynamicSyncScene& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene value);

template <>
inline void WriteToString(std::string* result, const Array_DynamicSyncScene* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_DynamicSyncScene* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Array_DynamicSyncScene& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Array_GestureActionPhase& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase value);

template <>
inline void WriteToString(std::string* result, const Array_GestureActionPhase* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase, " + std::to_string(count) + ">({{");
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
inline void WriteToString(std::string* result, const Opt_Array_GestureActionPhase* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Array_GestureActionPhase& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Array_promptAction_Button& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_Button* value);

template <>
inline void WriteToString(std::string* result, const Array_promptAction_Button* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_ARKUI_UICONTEXT_promptAction_Button, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_ARKUI_UICONTEXT_promptAction_Button*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_promptAction_Button* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Array_promptAction_Button& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Array_router_RouterState& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_router_RouterState* value);

template <>
inline void WriteToString(std::string* result, const Array_router_RouterState* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_ARKUI_UICONTEXT_router_RouterState, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_ARKUI_UICONTEXT_router_RouterState*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_router_RouterState* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Array_router_RouterState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Array_String& value)
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Array_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Array_Union_CustomBuilder_DragItemInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo* value);

template <>
inline void WriteToString(std::string* result, const Array_Union_CustomBuilder_DragItemInfo* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo*>(&value->array[i]));
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Array_Union_CustomBuilder_DragItemInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Array_Union_CustomBuilder_DragItemInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Boolean& value)
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Number& value)
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_ComponentSnapshot* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_ComponentSnapshot& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion* value) {
    result->append("{");
    // OH_Number start
    result->append(".start=");
    WriteToString(result, &value->start);
    // OH_Number end
    result->append(", ");
    result->append(".end=");
    WriteToString(result, &value->end);
    // OH_Number top
    result->append(", ");
    result->append(".top=");
    WriteToString(result, &value->top);
    // OH_Number bottom
    result->append(", ");
    result->append(".bottom=");
    WriteToString(result, &value->bottom);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_componentSnapshot_LocalizedSnapshotRegion* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentSnapshot_LocalizedSnapshotRegion& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion* value) {
    result->append("{");
    // OH_Number left
    result->append(".left=");
    WriteToString(result, &value->left);
    // OH_Number right
    result->append(", ");
    result->append(".right=");
    WriteToString(result, &value->right);
    // OH_Number top
    result->append(", ");
    result->append(".top=");
    WriteToString(result, &value->top);
    // OH_Number bottom
    result->append(", ");
    result->append(".bottom=");
    WriteToString(result, &value->bottom);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_componentSnapshot_SnapshotRegion* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentSnapshot_SnapshotRegion& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_ComponentUtils& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_ComponentUtils value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_ComponentUtils* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_ComponentUtils& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentUtils_Matrix4Result& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentUtils_Matrix4Result* value) {
    result->append("{");
    // OH_Number value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    // OH_Number value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, &value->value1);
    // OH_Number value2
    result->append(", ");
    result->append(".value2=");
    WriteToString(result, &value->value2);
    // OH_Number value3
    result->append(", ");
    result->append(".value3=");
    WriteToString(result, &value->value3);
    // OH_Number value4
    result->append(", ");
    result->append(".value4=");
    WriteToString(result, &value->value4);
    // OH_Number value5
    result->append(", ");
    result->append(".value5=");
    WriteToString(result, &value->value5);
    // OH_Number value6
    result->append(", ");
    result->append(".value6=");
    WriteToString(result, &value->value6);
    // OH_Number value7
    result->append(", ");
    result->append(".value7=");
    WriteToString(result, &value->value7);
    // OH_Number value8
    result->append(", ");
    result->append(".value8=");
    WriteToString(result, &value->value8);
    // OH_Number value9
    result->append(", ");
    result->append(".value9=");
    WriteToString(result, &value->value9);
    // OH_Number value10
    result->append(", ");
    result->append(".value10=");
    WriteToString(result, &value->value10);
    // OH_Number value11
    result->append(", ");
    result->append(".value11=");
    WriteToString(result, &value->value11);
    // OH_Number value12
    result->append(", ");
    result->append(".value12=");
    WriteToString(result, &value->value12);
    // OH_Number value13
    result->append(", ");
    result->append(".value13=");
    WriteToString(result, &value->value13);
    // OH_Number value14
    result->append(", ");
    result->append(".value14=");
    WriteToString(result, &value->value14);
    // OH_Number value15
    result->append(", ");
    result->append(".value15=");
    WriteToString(result, &value->value15);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_componentUtils_Matrix4Result* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentUtils_Matrix4Result& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset* value) {
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
inline void WriteToString(std::string* result, const Opt_componentUtils_Offset* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentUtils_Offset& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult* value) {
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
inline void WriteToString(std::string* result, const Opt_componentUtils_RotateResult* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentUtils_RotateResult& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult* value) {
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
inline void WriteToString(std::string* result, const Opt_componentUtils_ScaleResult* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentUtils_ScaleResult& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size* value) {
    result->append("{");
    // OH_Number width
    result->append(".width=");
    WriteToString(result, &value->width);
    // OH_Number height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, &value->height);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_componentUtils_Size* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentUtils_Size& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult* value) {
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
inline void WriteToString(std::string* result, const Opt_componentUtils_TranslateResult* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentUtils_TranslateResult& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_ContentCoverController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_ContentCoverController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_ContentCoverController* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_ContentCoverController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_ContextMenuController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_ContextMenuController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_ContextMenuController* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_ContextMenuController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_CursorController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_CursorController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_CursorController* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_CursorController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderColor& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderColor: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderColor* value) {
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
inline void WriteToString(std::string* result, const Opt_DialogOptionsBorderColor* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_DialogOptionsBorderColor& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderStyle& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderStyle: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderStyle* value) {
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
inline void WriteToString(std::string* result, const Opt_DialogOptionsBorderStyle* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_DialogOptionsBorderStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderWidth& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderWidth: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderWidth* value) {
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
inline void WriteToString(std::string* result, const Opt_DialogOptionsBorderWidth* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_DialogOptionsBorderWidth& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsCornerRadius& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_DialogOptionsCornerRadius: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsCornerRadius* value) {
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
inline void WriteToString(std::string* result, const Opt_DialogOptionsCornerRadius* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_DialogOptionsCornerRadius& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsShadow& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_DialogOptionsShadow: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DialogOptionsShadow* value) {
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
inline void WriteToString(std::string* result, const Opt_DialogOptionsShadow* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_DialogOptionsShadow& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_DragController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DragController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_DragController* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_DragController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_dragController_DragAction& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_dragController_DragPreview& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_dragController_DragStartRequestStatus& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragStartRequestStatus value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_dragController_DragStartRequestStatus(");
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_dragController_DragStartRequestStatus& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_DynamicSyncScene* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_DynamicSyncScene& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_FocusController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_FocusController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_FocusController* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_FocusController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Font& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Font value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_Font* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Font& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_FrameCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_FrameCallback value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_FrameCallback* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_FrameCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_GestureActionPhase* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_GestureActionPhase& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_GestureListenerType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_GestureListenerType value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_GestureListenerType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_GestureListenerType* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_GestureListenerType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs* value) {
    result->append("{");
    // Array_GestureActionPhase actionPhases
    result->append(".actionPhases=");
    WriteToString(result, &value->actionPhases);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_GestureObserverConfigs* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_GestureObserverConfigs& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_image_PixelMap& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_image_PixelMap value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_image_PixelMap& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_ImmersiveMode* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_ImmersiveMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_inspector_ComponentObserver* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_inspector_ComponentObserver& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_KeyboardAvoidMode* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_KeyboardAvoidMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_LevelMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_LevelMode value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_LevelMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_LevelMode* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_LevelMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_LevelOrder& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_LevelOrder value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_LevelOrder* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_LevelOrder& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_MeasureUtils& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_MeasureUtils value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_MeasureUtils* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_MeasureUtils& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_MediaQuery& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_MediaQuery value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_MediaQuery* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_MediaQuery& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_NodeRenderState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_NodeRenderState value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_NodeRenderState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_NodeRenderState* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_NodeRenderState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_OverlayManager& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_OverlayManager value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_OverlayManager* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OverlayManager& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_pointer_PointerStyle& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_pointer_PointerStyle value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_pointer_PointerStyle(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_pointer_PointerStyle* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_pointer_PointerStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_PromptAction& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_PromptAction value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_PromptAction* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_PromptAction& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuSuccessResponse& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuSuccessResponse* value) {
    result->append("{");
    // OH_Number index
    result->append(".index=");
    WriteToString(result, &value->index);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_ActionMenuSuccessResponse* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_ActionMenuSuccessResponse& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_DialogController* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_DialogController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogSuccessResponse& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogSuccessResponse* value) {
    result->append("{");
    // OH_Number index
    result->append(".index=");
    WriteToString(result, &value->index);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_ShowDialogSuccessResponse* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_ShowDialogSuccessResponse& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_ToastShowMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ToastShowMode value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_promptAction_ToastShowMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_ToastShowMode* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_ToastShowMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Router& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Router value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_Router* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Router& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_router_RouterMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_router_RouterMode value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_router_RouterMode(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_router_RouterMode* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_router_RouterMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_SimpleAnimatorOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_SnapshotRegionType& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_SnapshotRegionType: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_SnapshotRegionType* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_SnapshotRegionType* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_SnapshotRegionType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_TextMenuController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_TextMenuController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_TextMenuController* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_TextMenuController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_UIContext& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_UIContext value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_UIContext& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_UIInspector& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_UIInspector value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_UIInspector* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_UIInspector& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_UIObserver& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_UIObserver value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_UIObserver* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_UIObserver& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_DensityInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_DensityInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationState value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_NavDestinationState* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions* value) {
    result->append("{");
    // OH_CustomObject navigationId
    result->append(".navigationId=");
    WriteToString(result, &value->navigationId);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_NavDestinationSwitchObserverOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationSwitchObserverOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageState value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_RouterPageState* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_RouterPageState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventType value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventType(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_ScrollEventType* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_ScrollEventType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentState value) {
    result->append("OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentState(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_TabContentState* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_TabContentState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_unifiedDataChannel_UnifiedData& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions* value) {
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
    // OH_CustomObject
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, &value->value2);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_BorderStyle_EdgeStyles& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_BorderStyle_EdgeStyles: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_BorderStyle_EdgeStyles* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_BorderStyle_EdgeStyles* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_BorderStyle_EdgeStyles& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_Common_UIAbilityContext_Common_ExtensionContext* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Common_UIAbilityContext_Common_ExtensionContext& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_CustomBuilder_CustomBuilderT* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_CustomBuilder_CustomBuilderT& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_CustomBuilder_DragItemInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_CustomBuilder_DragItemInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_BorderRadiuses& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_BorderRadiuses: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_BorderRadiuses* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_Dimension_BorderRadiuses* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Dimension_BorderRadiuses& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_EdgeWidths& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_EdgeWidths: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_EdgeWidths* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_Dimension_EdgeWidths* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Dimension_EdgeWidths& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Number_FontStyle& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Number_FontStyle: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_FontStyle* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
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
inline void WriteToString(std::string* result, const Opt_Union_Number_FontStyle* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Number_FontStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextAlign& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextAlign: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextAlign* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
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
inline void WriteToString(std::string* result, const Opt_Union_Number_TextAlign* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Number_TextAlign& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextCase& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextCase: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextCase* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
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
inline void WriteToString(std::string* result, const Opt_Union_Number_TextCase* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Number_TextCase& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextOverflow& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextOverflow: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextOverflow* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
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
inline void WriteToString(std::string* result, const Opt_Union_Number_TextOverflow* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Number_TextOverflow& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_ResourceColor_EdgeColors& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_ResourceColor_EdgeColors: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_ResourceColor_EdgeColors* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_ResourceColor_EdgeColors* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_ResourceColor_EdgeColors& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_ShadowOptions_ShadowStyle* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_ShadowOptions_ShadowStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_UIAbilityContext_UIContext& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_UIAbilityContext_UIContext: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_UIAbilityContext_UIContext* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_CustomObject
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_ARKUI_UICONTEXT_UIContext
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_UIAbilityContext_UIContext* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_UIAbilityContext_UIContext& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_AsyncCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_AsyncCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_AsyncCallback* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_AsyncCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Number_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Number_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Number_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Number_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_Callback_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_GestureListenerCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_GestureListenerCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_GestureListenerCallback* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_GestureListenerCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_PanListenerCallback& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_PanListenerCallback* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_AnimatorOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_AnimatorResult& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_AnimatorResult value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_AnimatorResult& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_BusinessError& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_BusinessError value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_BusinessError& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotOptions* value) {
    result->append("{");
    // OH_Number scale
    result->append(".scale=");
    WriteToString(result, &value->scale);
    // OH_Boolean waitUntilRenderFinished
    result->append(", ");
    result->append(".waitUntilRenderFinished=");
    WriteToString(result, &value->waitUntilRenderFinished);
    // OH_OHOS_ARKUI_UICONTEXT_SnapshotRegionType region
    result->append(", ");
    result->append(".region=");
    WriteToString(result, &value->region);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_componentSnapshot_SnapshotOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentSnapshot_SnapshotOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size size
    result->append(".size=");
    WriteToString(result, &value->size);
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset localOffset
    result->append(", ");
    result->append(".localOffset=");
    WriteToString(result, &value->localOffset);
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset windowOffset
    result->append(", ");
    result->append(".windowOffset=");
    WriteToString(result, &value->windowOffset);
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset screenOffset
    result->append(", ");
    result->append(".screenOffset=");
    WriteToString(result, &value->screenOffset);
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult translate
    result->append(", ");
    result->append(".translate=");
    WriteToString(result, &value->translate);
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult scale
    result->append(", ");
    result->append(".scale=");
    WriteToString(result, &value->scale);
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult rotate
    result->append(", ");
    result->append(".rotate=");
    WriteToString(result, &value->rotate);
    // OH_OHOS_ARKUI_UICONTEXT_componentUtils_Matrix4Result transform
    result->append(", ");
    result->append(".transform=");
    WriteToString(result, &value->transform);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_componentUtils_ComponentInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_componentUtils_ComponentInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_dragController_DragEventParam& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragEventParam* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_dragController_DragEventParam& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo* value) {
    result->append("{");
    // OH_Number pointerId
    result->append(".pointerId=");
    WriteToString(result, &value->pointerId);
    // OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData data
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_dragController_DragInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_font_FontInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_font_FontInfo* value) {
    result->append("{");
    // OH_String path
    result->append(".path=");
    WriteToString(result, &value->path);
    // OH_String postScriptName
    result->append(", ");
    result->append(".postScriptName=");
    WriteToString(result, &value->postScriptName);
    // OH_String fullName
    result->append(", ");
    result->append(".fullName=");
    WriteToString(result, &value->fullName);
    // OH_String family
    result->append(", ");
    result->append(".family=");
    WriteToString(result, &value->family);
    // OH_String subfamily
    result->append(", ");
    result->append(".subfamily=");
    WriteToString(result, &value->subfamily);
    // OH_Number weight
    result->append(", ");
    result->append(".weight=");
    WriteToString(result, &value->weight);
    // OH_Number width
    result->append(", ");
    result->append(".width=");
    WriteToString(result, &value->width);
    // OH_Boolean italic
    result->append(", ");
    result->append(".italic=");
    WriteToString(result, value->italic);
    // OH_Boolean monoSpace
    result->append(", ");
    result->append(".monoSpace=");
    WriteToString(result, value->monoSpace);
    // OH_Boolean symbolic
    result->append(", ");
    result->append(".symbolic=");
    WriteToString(result, value->symbolic);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_font_FontInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_font_FontInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo* value) {
    result->append("{");
    // OH_CustomObject event
    result->append(".event=");
    WriteToString(result, &value->event);
    // OH_CustomObject current
    result->append(", ");
    result->append(".current=");
    WriteToString(result, &value->current);
    // OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase currentPhase
    result->append(", ");
    result->append(".currentPhase=");
    WriteToString(result, value->currentPhase);
    // OH_CustomObject node
    result->append(", ");
    result->append(".node=");
    WriteToString(result, &value->node);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_GestureTriggerInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_GestureTriggerInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_mediaquery_MediaQueryListener* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_mediaquery_MediaQueryListener& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_NodeIdentity& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_NodeIdentity: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_NodeIdentity* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_String
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_Number
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_NodeIdentity* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_NodeIdentity& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions* value) {
    result->append("{");
    // OH_Boolean renderRootOverlay
    result->append(".renderRootOverlay=");
    WriteToString(result, &value->renderRootOverlay);
    // OH_Boolean enableBackPressedEvent
    result->append(", ");
    result->append(".enableBackPressedEvent=");
    WriteToString(result, &value->enableBackPressedEvent);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OverlayManagerOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_OverlayManagerOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions* value) {
    result->append("{");
    // OH_CustomObject maskRect
    result->append(".maskRect=");
    WriteToString(result, &value->maskRect);
    // OH_CustomObject alignment
    result->append(", ");
    result->append(".alignment=");
    WriteToString(result, &value->alignment);
    // OH_CustomObject offset
    result->append(", ");
    result->append(".offset=");
    WriteToString(result, &value->offset);
    // OH_Boolean showInSubWindow
    result->append(", ");
    result->append(".showInSubWindow=");
    WriteToString(result, &value->showInSubWindow);
    // OH_Boolean isModal
    result->append(", ");
    result->append(".isModal=");
    WriteToString(result, &value->isModal);
    // OH_Boolean autoCancel
    result->append(", ");
    result->append(".autoCancel=");
    WriteToString(result, &value->autoCancel);
    // OH_CustomObject transition
    result->append(", ");
    result->append(".transition=");
    WriteToString(result, &value->transition);
    // OH_CustomObject dialogTransition
    result->append(", ");
    result->append(".dialogTransition=");
    WriteToString(result, &value->dialogTransition);
    // OH_CustomObject maskTransition
    result->append(", ");
    result->append(".maskTransition=");
    WriteToString(result, &value->maskTransition);
    // OH_CustomObject maskColor
    result->append(", ");
    result->append(".maskColor=");
    WriteToString(result, &value->maskColor);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void onWillDismiss
    result->append(", ");
    result->append(".onWillDismiss=");
    WriteToString(result, &value->onWillDismiss);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode keyboardAvoidMode
    result->append(", ");
    result->append(".keyboardAvoidMode=");
    WriteToString(result, &value->keyboardAvoidMode);
    // OH_Boolean enableHoverMode
    result->append(", ");
    result->append(".enableHoverMode=");
    WriteToString(result, &value->enableHoverMode);
    // OH_CustomObject hoverModeArea
    result->append(", ");
    result->append(".hoverModeArea=");
    WriteToString(result, &value->hoverModeArea);
    // OH_CustomObject backgroundBlurStyleOptions
    result->append(", ");
    result->append(".backgroundBlurStyleOptions=");
    WriteToString(result, &value->backgroundBlurStyleOptions);
    // OH_CustomObject backgroundEffect
    result->append(", ");
    result->append(".backgroundEffect=");
    WriteToString(result, &value->backgroundEffect);
    // OH_CustomObject keyboardAvoidDistance
    result->append(", ");
    result->append(".keyboardAvoidDistance=");
    WriteToString(result, &value->keyboardAvoidDistance);
    // OH_OHOS_ARKUI_UICONTEXT_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_ARKUI_UICONTEXT_LevelOrder levelOrder
    result->append(", ");
    result->append(".levelOrder=");
    WriteToString(result, &value->levelOrder);
    // OH_Boolean focusable
    result->append(", ");
    result->append(".focusable=");
    WriteToString(result, &value->focusable);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_BaseDialogOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_BaseDialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions* value) {
    result->append("{");
    // OH_CustomObject maskRect
    result->append(".maskRect=");
    WriteToString(result, &value->maskRect);
    // OH_CustomObject alignment
    result->append(", ");
    result->append(".alignment=");
    WriteToString(result, &value->alignment);
    // OH_CustomObject offset
    result->append(", ");
    result->append(".offset=");
    WriteToString(result, &value->offset);
    // OH_Boolean showInSubWindow
    result->append(", ");
    result->append(".showInSubWindow=");
    WriteToString(result, &value->showInSubWindow);
    // OH_Boolean isModal
    result->append(", ");
    result->append(".isModal=");
    WriteToString(result, &value->isModal);
    // OH_Boolean autoCancel
    result->append(", ");
    result->append(".autoCancel=");
    WriteToString(result, &value->autoCancel);
    // OH_CustomObject transition
    result->append(", ");
    result->append(".transition=");
    WriteToString(result, &value->transition);
    // OH_CustomObject dialogTransition
    result->append(", ");
    result->append(".dialogTransition=");
    WriteToString(result, &value->dialogTransition);
    // OH_CustomObject maskTransition
    result->append(", ");
    result->append(".maskTransition=");
    WriteToString(result, &value->maskTransition);
    // OH_CustomObject maskColor
    result->append(", ");
    result->append(".maskColor=");
    WriteToString(result, &value->maskColor);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void onWillDismiss
    result->append(", ");
    result->append(".onWillDismiss=");
    WriteToString(result, &value->onWillDismiss);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode keyboardAvoidMode
    result->append(", ");
    result->append(".keyboardAvoidMode=");
    WriteToString(result, &value->keyboardAvoidMode);
    // OH_Boolean enableHoverMode
    result->append(", ");
    result->append(".enableHoverMode=");
    WriteToString(result, &value->enableHoverMode);
    // OH_CustomObject hoverModeArea
    result->append(", ");
    result->append(".hoverModeArea=");
    WriteToString(result, &value->hoverModeArea);
    // OH_CustomObject backgroundBlurStyleOptions
    result->append(", ");
    result->append(".backgroundBlurStyleOptions=");
    WriteToString(result, &value->backgroundBlurStyleOptions);
    // OH_CustomObject backgroundEffect
    result->append(", ");
    result->append(".backgroundEffect=");
    WriteToString(result, &value->backgroundEffect);
    // OH_CustomObject keyboardAvoidDistance
    result->append(", ");
    result->append(".keyboardAvoidDistance=");
    WriteToString(result, &value->keyboardAvoidDistance);
    // OH_OHOS_ARKUI_UICONTEXT_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_ARKUI_UICONTEXT_LevelOrder levelOrder
    result->append(", ");
    result->append(".levelOrder=");
    WriteToString(result, &value->levelOrder);
    // OH_Boolean focusable
    result->append(", ");
    result->append(".focusable=");
    WriteToString(result, &value->focusable);
    // OH_CustomObject builder
    result->append(", ");
    result->append(".builder=");
    WriteToString(result, &value->builder);
    // OH_CustomObject backgroundColor
    result->append(", ");
    result->append(".backgroundColor=");
    WriteToString(result, &value->backgroundColor);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_BorderRadiuses cornerRadius
    result->append(", ");
    result->append(".cornerRadius=");
    WriteToString(result, &value->cornerRadius);
    // OH_CustomObject width
    result->append(", ");
    result->append(".width=");
    WriteToString(result, &value->width);
    // OH_CustomObject height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, &value->height);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_EdgeWidths borderWidth
    result->append(", ");
    result->append(".borderWidth=");
    WriteToString(result, &value->borderWidth);
    // OH_OHOS_ARKUI_UICONTEXT_Union_ResourceColor_EdgeColors borderColor
    result->append(", ");
    result->append(".borderColor=");
    WriteToString(result, &value->borderColor);
    // OH_OHOS_ARKUI_UICONTEXT_Union_BorderStyle_EdgeStyles borderStyle
    result->append(", ");
    result->append(".borderStyle=");
    WriteToString(result, &value->borderStyle);
    // OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle shadow
    result->append(", ");
    result->append(".shadow=");
    WriteToString(result, &value->shadow);
    // OH_CustomObject backgroundBlurStyle
    result->append(", ");
    result->append(".backgroundBlurStyle=");
    WriteToString(result, &value->backgroundBlurStyle);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_CustomDialogOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_CustomDialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogOptions* value) {
    result->append("{");
    // OH_CustomObject maskRect
    result->append(".maskRect=");
    WriteToString(result, &value->maskRect);
    // OH_CustomObject alignment
    result->append(", ");
    result->append(".alignment=");
    WriteToString(result, &value->alignment);
    // OH_CustomObject offset
    result->append(", ");
    result->append(".offset=");
    WriteToString(result, &value->offset);
    // OH_Boolean showInSubWindow
    result->append(", ");
    result->append(".showInSubWindow=");
    WriteToString(result, &value->showInSubWindow);
    // OH_Boolean isModal
    result->append(", ");
    result->append(".isModal=");
    WriteToString(result, &value->isModal);
    // OH_Boolean autoCancel
    result->append(", ");
    result->append(".autoCancel=");
    WriteToString(result, &value->autoCancel);
    // OH_CustomObject transition
    result->append(", ");
    result->append(".transition=");
    WriteToString(result, &value->transition);
    // OH_CustomObject dialogTransition
    result->append(", ");
    result->append(".dialogTransition=");
    WriteToString(result, &value->dialogTransition);
    // OH_CustomObject maskTransition
    result->append(", ");
    result->append(".maskTransition=");
    WriteToString(result, &value->maskTransition);
    // OH_CustomObject maskColor
    result->append(", ");
    result->append(".maskColor=");
    WriteToString(result, &value->maskColor);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void onWillDismiss
    result->append(", ");
    result->append(".onWillDismiss=");
    WriteToString(result, &value->onWillDismiss);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode keyboardAvoidMode
    result->append(", ");
    result->append(".keyboardAvoidMode=");
    WriteToString(result, &value->keyboardAvoidMode);
    // OH_Boolean enableHoverMode
    result->append(", ");
    result->append(".enableHoverMode=");
    WriteToString(result, &value->enableHoverMode);
    // OH_CustomObject hoverModeArea
    result->append(", ");
    result->append(".hoverModeArea=");
    WriteToString(result, &value->hoverModeArea);
    // OH_CustomObject backgroundBlurStyleOptions
    result->append(", ");
    result->append(".backgroundBlurStyleOptions=");
    WriteToString(result, &value->backgroundBlurStyleOptions);
    // OH_CustomObject backgroundEffect
    result->append(", ");
    result->append(".backgroundEffect=");
    WriteToString(result, &value->backgroundEffect);
    // OH_CustomObject keyboardAvoidDistance
    result->append(", ");
    result->append(".keyboardAvoidDistance=");
    WriteToString(result, &value->keyboardAvoidDistance);
    // OH_OHOS_ARKUI_UICONTEXT_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_ARKUI_UICONTEXT_LevelOrder levelOrder
    result->append(", ");
    result->append(".levelOrder=");
    WriteToString(result, &value->levelOrder);
    // OH_Boolean focusable
    result->append(", ");
    result->append(".focusable=");
    WriteToString(result, &value->focusable);
    // OH_CustomObject backgroundColor
    result->append(", ");
    result->append(".backgroundColor=");
    WriteToString(result, &value->backgroundColor);
    // OH_OHOS_ARKUI_UICONTEXT_DialogOptionsCornerRadius cornerRadius
    result->append(", ");
    result->append(".cornerRadius=");
    WriteToString(result, &value->cornerRadius);
    // OH_CustomObject width
    result->append(", ");
    result->append(".width=");
    WriteToString(result, &value->width);
    // OH_CustomObject height
    result->append(", ");
    result->append(".height=");
    WriteToString(result, &value->height);
    // OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderWidth borderWidth
    result->append(", ");
    result->append(".borderWidth=");
    WriteToString(result, &value->borderWidth);
    // OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderColor borderColor
    result->append(", ");
    result->append(".borderColor=");
    WriteToString(result, &value->borderColor);
    // OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderStyle borderStyle
    result->append(", ");
    result->append(".borderStyle=");
    WriteToString(result, &value->borderStyle);
    // OH_OHOS_ARKUI_UICONTEXT_DialogOptionsShadow shadow
    result->append(", ");
    result->append(".shadow=");
    WriteToString(result, &value->shadow);
    // OH_CustomObject backgroundBlurStyle
    result->append(", ");
    result->append(".backgroundBlurStyle=");
    WriteToString(result, &value->backgroundBlurStyle);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_DialogOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_DialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions* value) {
    result->append("{");
    // OH_String message
    result->append(".message=");
    WriteToString(result, &value->message);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_router_EnableAlertOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_router_EnableAlertOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions* value) {
    result->append("{");
    // OH_String name
    result->append(".name=");
    WriteToString(result, &value->name);
    // OH_Object params
    result->append(", ");
    result->append(".params=");
    WriteToString(result, &value->params);
    // OH_Boolean recoverable
    result->append(", ");
    result->append(".recoverable=");
    WriteToString(result, &value->recoverable);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_router_NamedRouterOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_router_NamedRouterOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions* value) {
    result->append("{");
    // OH_String url
    result->append(".url=");
    WriteToString(result, &value->url);
    // OH_Object params
    result->append(", ");
    result->append(".params=");
    WriteToString(result, &value->params);
    // OH_Boolean recoverable
    result->append(", ");
    result->append(".recoverable=");
    WriteToString(result, &value->recoverable);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_router_RouterOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_router_RouterOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_router_RouterState& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_router_RouterState* value) {
    result->append("{");
    // OH_Number index
    result->append(".index=");
    WriteToString(result, &value->index);
    // OH_String name
    result->append(", ");
    result->append(".name=");
    WriteToString(result, &value->name);
    // OH_String path
    result->append(", ");
    result->append(".path=");
    WriteToString(result, &value->path);
    // OH_Object params
    result->append(", ");
    result->append(".params=");
    WriteToString(result, value->params);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_router_RouterState* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_router_RouterState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo* value) {
    result->append("{");
    // OH_CustomObject navigationId
    result->append(".navigationId=");
    WriteToString(result, &value->navigationId);
    // OH_CustomObject name
    result->append(", ");
    result->append(".name=");
    WriteToString(result, &value->name);
    // OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationState state
    result->append(", ");
    result->append(".state=");
    WriteToString(result, value->state);
    // OH_Number index
    result->append(", ");
    result->append(".index=");
    WriteToString(result, &value->index);
    // OH_Object param
    result->append(", ");
    result->append(".param=");
    WriteToString(result, &value->param);
    // OH_String navDestinationId
    result->append(", ");
    result->append(".navDestinationId=");
    WriteToString(result, &value->navDestinationId);
    // OH_Number uniqueId
    result->append(", ");
    result->append(".uniqueId=");
    WriteToString(result, &value->uniqueId);
    // OH_CustomObject mode
    result->append(", ");
    result->append(".mode=");
    WriteToString(result, &value->mode);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_NavDestinationInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavigationInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavigationInfo* value) {
    result->append("{");
    // OH_String navigationId
    result->append(".navigationId=");
    WriteToString(result, &value->navigationId);
    // OH_CustomObject pathStack
    result->append(", ");
    result->append(".pathStack=");
    WriteToString(result, &value->pathStack);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_NavigationInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_NavigationInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions* value) {
    result->append("{");
    // OH_String id
    result->append(".id=");
    WriteToString(result, &value->id);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_ObserverOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_ObserverOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_RouterPageInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_RouterPageInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo* value) {
    result->append("{");
    // OH_String id
    result->append(".id=");
    WriteToString(result, &value->id);
    // OH_Number uniqueId
    result->append(", ");
    result->append(".uniqueId=");
    WriteToString(result, &value->uniqueId);
    // OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventType scrollEvent
    result->append(", ");
    result->append(".scrollEvent=");
    WriteToString(result, value->scrollEvent);
    // OH_Number offset
    result->append(", ");
    result->append(".offset=");
    WriteToString(result, &value->offset);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_ScrollEventInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_ScrollEventInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo* value) {
    result->append("{");
    // OH_String tabContentId
    result->append(".tabContentId=");
    WriteToString(result, &value->tabContentId);
    // OH_Number tabContentUniqueId
    result->append(", ");
    result->append(".tabContentUniqueId=");
    WriteToString(result, &value->tabContentUniqueId);
    // OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentState state
    result->append(", ");
    result->append(".state=");
    WriteToString(result, value->state);
    // OH_Number index
    result->append(", ");
    result->append(".index=");
    WriteToString(result, &value->index);
    // OH_String id
    result->append(", ");
    result->append(".id=");
    WriteToString(result, &value->id);
    // OH_Number uniqueId
    result->append(", ");
    result->append(".uniqueId=");
    WriteToString(result, &value->uniqueId);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_TabContentInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_TabContentInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_AnimatorOptions_SimpleAnimatorOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo
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
inline void WriteToString(std::string* result, const Opt_Union_NavDestinationInfo_NavBar* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_NavDestinationInfo_NavBar& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Number_String& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Number_String: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_String* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_String
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_Number_String* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Number_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_FontWeight& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_FontWeight: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_FontWeight* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_String
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    // OH_CustomObject
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, &value->value2);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_Number_String_FontWeight* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Number_String_FontWeight& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Number
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_String
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    // OH_CustomObject
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, &value->value2);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_Number_String_Resource* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_Number_String_Resource& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_String_Number& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_String_Number: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_String_Number* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_String
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_Number
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_String_Number* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_String_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource* value) {
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
inline void WriteToString(std::string* result, const Opt_Union_String_Resource* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_String_Resource& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_font_FontOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_font_FontOptions* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource familyName
    result->append(".familyName=");
    WriteToString(result, &value->familyName);
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource familySrc
    result->append(", ");
    result->append(".familySrc=");
    WriteToString(result, &value->familySrc);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_font_FontOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_font_FontOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_MeasureOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_MeasureOptions* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource textContent
    result->append(".textContent=");
    WriteToString(result, &value->textContent);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource constraintWidth
    result->append(", ");
    result->append(".constraintWidth=");
    WriteToString(result, &value->constraintWidth);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource fontSize
    result->append(", ");
    result->append(".fontSize=");
    WriteToString(result, &value->fontSize);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_FontStyle fontStyle
    result->append(", ");
    result->append(".fontStyle=");
    WriteToString(result, &value->fontStyle);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_FontWeight fontWeight
    result->append(", ");
    result->append(".fontWeight=");
    WriteToString(result, &value->fontWeight);
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource fontFamily
    result->append(", ");
    result->append(".fontFamily=");
    WriteToString(result, &value->fontFamily);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_String letterSpacing
    result->append(", ");
    result->append(".letterSpacing=");
    WriteToString(result, &value->letterSpacing);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextAlign textAlign
    result->append(", ");
    result->append(".textAlign=");
    WriteToString(result, &value->textAlign);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextOverflow overflow
    result->append(", ");
    result->append(".overflow=");
    WriteToString(result, &value->overflow);
    // OH_Number maxLines
    result->append(", ");
    result->append(".maxLines=");
    WriteToString(result, &value->maxLines);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource lineHeight
    result->append(", ");
    result->append(".lineHeight=");
    WriteToString(result, &value->lineHeight);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_String baselineOffset
    result->append(", ");
    result->append(".baselineOffset=");
    WriteToString(result, &value->baselineOffset);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextCase textCase
    result->append(", ");
    result->append(".textCase=");
    WriteToString(result, &value->textCase);
    // OH_OHOS_ARKUI_UICONTEXT_Union_Number_String textIndent
    result->append(", ");
    result->append(".textIndent=");
    WriteToString(result, &value->textIndent);
    // OH_CustomObject wordBreak
    result->append(", ");
    result->append(".wordBreak=");
    WriteToString(result, &value->wordBreak);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_MeasureOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_MeasureOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_PageInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_PageInfo* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo routerPageInfo
    result->append(".routerPageInfo=");
    WriteToString(result, &value->routerPageInfo);
    // OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo navDestinationInfo
    result->append(", ");
    result->append(".navDestinationInfo=");
    WriteToString(result, &value->navDestinationInfo);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_PageInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_PageInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_Button& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_Button* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource text
    result->append(".text=");
    WriteToString(result, &value->text);
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource color
    result->append(", ");
    result->append(".color=");
    WriteToString(result, &value->color);
    // OH_Boolean primary
    result->append(", ");
    result->append(".primary=");
    WriteToString(result, &value->primary);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_Button* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_Button& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSingleButton& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSingleButton* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_PromptActionSingleButton* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_PromptActionSingleButton& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource title
    result->append(".title=");
    WriteToString(result, &value->title);
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource message
    result->append(", ");
    result->append(".message=");
    WriteToString(result, &value->message);
    // Array_promptAction_Button buttons
    result->append(", ");
    result->append(".buttons=");
    WriteToString(result, &value->buttons);
    // OH_CustomObject maskRect
    result->append(", ");
    result->append(".maskRect=");
    WriteToString(result, &value->maskRect);
    // OH_CustomObject alignment
    result->append(", ");
    result->append(".alignment=");
    WriteToString(result, &value->alignment);
    // OH_CustomObject offset
    result->append(", ");
    result->append(".offset=");
    WriteToString(result, &value->offset);
    // OH_Boolean showInSubWindow
    result->append(", ");
    result->append(".showInSubWindow=");
    WriteToString(result, &value->showInSubWindow);
    // OH_Boolean isModal
    result->append(", ");
    result->append(".isModal=");
    WriteToString(result, &value->isModal);
    // OH_CustomObject backgroundColor
    result->append(", ");
    result->append(".backgroundColor=");
    WriteToString(result, &value->backgroundColor);
    // OH_CustomObject backgroundBlurStyle
    result->append(", ");
    result->append(".backgroundBlurStyle=");
    WriteToString(result, &value->backgroundBlurStyle);
    // OH_CustomObject backgroundBlurStyleOptions
    result->append(", ");
    result->append(".backgroundBlurStyleOptions=");
    WriteToString(result, &value->backgroundBlurStyleOptions);
    // OH_CustomObject backgroundEffect
    result->append(", ");
    result->append(".backgroundEffect=");
    WriteToString(result, &value->backgroundEffect);
    // OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle shadow
    result->append(", ");
    result->append(".shadow=");
    WriteToString(result, &value->shadow);
    // OH_Boolean enableHoverMode
    result->append(", ");
    result->append(".enableHoverMode=");
    WriteToString(result, &value->enableHoverMode);
    // OH_CustomObject hoverModeArea
    result->append(", ");
    result->append(".hoverModeArea=");
    WriteToString(result, &value->hoverModeArea);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_ARKUI_UICONTEXT_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_ARKUI_UICONTEXT_LevelOrder levelOrder
    result->append(", ");
    result->append(".levelOrder=");
    WriteToString(result, &value->levelOrder);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_ShowDialogOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_ShowDialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource message
    result->append(".message=");
    WriteToString(result, &value->message);
    // OH_Number duration
    result->append(", ");
    result->append(".duration=");
    WriteToString(result, &value->duration);
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Number bottom
    result->append(", ");
    result->append(".bottom=");
    WriteToString(result, &value->bottom);
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_ToastShowMode showMode
    result->append(", ");
    result->append(".showMode=");
    WriteToString(result, &value->showMode);
    // OH_CustomObject alignment
    result->append(", ");
    result->append(".alignment=");
    WriteToString(result, &value->alignment);
    // OH_CustomObject offset
    result->append(", ");
    result->append(".offset=");
    WriteToString(result, &value->offset);
    // OH_CustomObject backgroundColor
    result->append(", ");
    result->append(".backgroundColor=");
    WriteToString(result, &value->backgroundColor);
    // OH_CustomObject textColor
    result->append(", ");
    result->append(".textColor=");
    WriteToString(result, &value->textColor);
    // OH_CustomObject backgroundBlurStyle
    result->append(", ");
    result->append(".backgroundBlurStyle=");
    WriteToString(result, &value->backgroundBlurStyle);
    // OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle shadow
    result->append(", ");
    result->append(".shadow=");
    WriteToString(result, &value->shadow);
    // OH_Boolean enableHoverMode
    result->append(", ");
    result->append(".enableHoverMode=");
    WriteToString(result, &value->enableHoverMode);
    // OH_CustomObject hoverModeArea
    result->append(", ");
    result->append(".hoverModeArea=");
    WriteToString(result, &value->hoverModeArea);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_ShowToastOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_ShowToastOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_TargetInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_TargetInfo* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Number id
    result->append(".id=");
    WriteToString(result, &value->id);
    // OH_Number componentId
    result->append(", ");
    result->append(".componentId=");
    WriteToString(result, &value->componentId);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_TargetInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_TargetInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_UIAbilityContext_UIContext context
    result->append(".context=");
    WriteToString(result, &value->context);
    // OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar from
    result->append(", ");
    result->append(".from=");
    WriteToString(result, &value->from);
    // OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar to
    result->append(", ");
    result->append(".to=");
    WriteToString(result, &value->to);
    // OH_CustomObject operation
    result->append(", ");
    result->append(".operation=");
    WriteToString(result, &value->operation);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_uiObserver_NavDestinationSwitchInfo* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationSwitchInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionDoubleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionDoubleButtons* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    // Opt_promptAction_Button value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, &value->value1);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_PromptActionDoubleButtons* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_PromptActionDoubleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuadrupleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuadrupleButtons* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    // Opt_promptAction_Button value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, &value->value1);
    // Opt_promptAction_Button value2
    result->append(", ");
    result->append(".value2=");
    WriteToString(result, &value->value2);
    // Opt_promptAction_Button value3
    result->append(", ");
    result->append(".value3=");
    WriteToString(result, &value->value3);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_PromptActionQuadrupleButtons* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_PromptActionQuadrupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuintupleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuintupleButtons* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    // Opt_promptAction_Button value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, &value->value1);
    // Opt_promptAction_Button value2
    result->append(", ");
    result->append(".value2=");
    WriteToString(result, &value->value2);
    // Opt_promptAction_Button value3
    result->append(", ");
    result->append(".value3=");
    WriteToString(result, &value->value3);
    // Opt_promptAction_Button value4
    result->append(", ");
    result->append(".value4=");
    WriteToString(result, &value->value4);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_PromptActionQuintupleButtons* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_PromptActionQuintupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSextupleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSextupleButtons* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    // Opt_promptAction_Button value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, &value->value1);
    // Opt_promptAction_Button value2
    result->append(", ");
    result->append(".value2=");
    WriteToString(result, &value->value2);
    // Opt_promptAction_Button value3
    result->append(", ");
    result->append(".value3=");
    WriteToString(result, &value->value3);
    // Opt_promptAction_Button value4
    result->append(", ");
    result->append(".value4=");
    WriteToString(result, &value->value4);
    // Opt_promptAction_Button value5
    result->append(", ");
    result->append(".value5=");
    WriteToString(result, &value->value5);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_PromptActionSextupleButtons* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_PromptActionSextupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionTripleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionTripleButtons* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value0
    result->append(".value0=");
    WriteToString(result, &value->value0);
    // Opt_promptAction_Button value1
    result->append(", ");
    result->append(".value1=");
    WriteToString(result, &value->value1);
    // Opt_promptAction_Button value2
    result->append(", ");
    result->append(".value2=");
    WriteToString(result, &value->value2);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_PromptActionTripleButtons* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_PromptActionTripleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        case 3: return runtimeType(value.value3);
        case 4: return runtimeType(value.value4);
        case 5: return runtimeType(value.value5);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_UICONTEXT_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSingleButton
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionDoubleButtons
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionTripleButtons
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, &value->value2);
    }
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuadrupleButtons
    if (value->selector == 3) {
        result->append(".value3=");
        WriteToString(result, &value->value3);
    }
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuintupleButtons
    if (value->selector == 4) {
        result->append(".value4=");
        WriteToString(result, &value->value4);
    }
    // OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSextupleButtons
    if (value->selector == 5) {
        result->append(".value5=");
        WriteToString(result, &value->value5);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions* value) {
    result->append("{");
    // OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource title
    result->append(".title=");
    WriteToString(result, &value->title);
    // OH_OHOS_ARKUI_UICONTEXT_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons buttons
    result->append(", ");
    result->append(".buttons=");
    WriteToString(result, &value->buttons);
    // OH_Boolean showInSubWindow
    result->append(", ");
    result->append(".showInSubWindow=");
    WriteToString(result, &value->showInSubWindow);
    // OH_Boolean isModal
    result->append(", ");
    result->append(".isModal=");
    WriteToString(result, &value->isModal);
    // OH_OHOS_ARKUI_UICONTEXT_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_ActionMenuOptions* value) {
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
inline OH_OHOS_ARKUI_UICONTEXT_RuntimeType runtimeType(const Opt_promptAction_ActionMenuOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class ComponentSnapshot_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot value);
    static OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot read(DeserializerBase& buffer);
};
class componentSnapshot_LocalizedSnapshotRegion_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion value);
    static OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion read(DeserializerBase& buffer);
};
class componentSnapshot_SnapshotRegion_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion value);
    static OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion read(DeserializerBase& buffer);
};
class ComponentUtils_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ComponentUtils value);
    static OH_OHOS_ARKUI_UICONTEXT_ComponentUtils read(DeserializerBase& buffer);
};
class componentUtils_Offset_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset value);
    static OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset read(DeserializerBase& buffer);
};
class componentUtils_RotateResult_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult value);
    static OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult read(DeserializerBase& buffer);
};
class componentUtils_ScaleResult_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult value);
    static OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult read(DeserializerBase& buffer);
};
class componentUtils_Size_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size value);
    static OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size read(DeserializerBase& buffer);
};
class componentUtils_TranslateResult_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult value);
    static OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult read(DeserializerBase& buffer);
};
class ContentCoverController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ContentCoverController value);
    static OH_OHOS_ARKUI_UICONTEXT_ContentCoverController read(DeserializerBase& buffer);
};
class ContextMenuController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ContextMenuController value);
    static OH_OHOS_ARKUI_UICONTEXT_ContextMenuController read(DeserializerBase& buffer);
};
class CursorController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_CursorController value);
    static OH_OHOS_ARKUI_UICONTEXT_CursorController read(DeserializerBase& buffer);
};
class DragController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_DragController value);
    static OH_OHOS_ARKUI_UICONTEXT_DragController read(DeserializerBase& buffer);
};
class dragController_DragAction_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction value);
    static OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction read(DeserializerBase& buffer);
};
class dragController_DragPreview_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview value);
    static OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview read(DeserializerBase& buffer);
};
class DynamicSyncScene_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene value);
    static OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene read(DeserializerBase& buffer);
};
class FocusController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_FocusController value);
    static OH_OHOS_ARKUI_UICONTEXT_FocusController read(DeserializerBase& buffer);
};
class Font_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_Font value);
    static OH_OHOS_ARKUI_UICONTEXT_Font read(DeserializerBase& buffer);
};
class FrameCallback_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_FrameCallback value);
    static OH_OHOS_ARKUI_UICONTEXT_FrameCallback read(DeserializerBase& buffer);
};
class GestureObserverConfigs_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs value);
    static OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs read(DeserializerBase& buffer);
};
class image_PixelMap_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_image_PixelMap value);
    static OH_OHOS_ARKUI_UICONTEXT_image_PixelMap read(DeserializerBase& buffer);
};
class inspector_ComponentObserver_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver value);
    static OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver read(DeserializerBase& buffer);
};
class LevelOrder_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_LevelOrder value);
    static OH_OHOS_ARKUI_UICONTEXT_LevelOrder read(DeserializerBase& buffer);
};
class MeasureUtils_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_MeasureUtils value);
    static OH_OHOS_ARKUI_UICONTEXT_MeasureUtils read(DeserializerBase& buffer);
};
class MediaQuery_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_MediaQuery value);
    static OH_OHOS_ARKUI_UICONTEXT_MediaQuery read(DeserializerBase& buffer);
};
class OverlayManager_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_OverlayManager value);
    static OH_OHOS_ARKUI_UICONTEXT_OverlayManager read(DeserializerBase& buffer);
};
class PromptAction_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_PromptAction value);
    static OH_OHOS_ARKUI_UICONTEXT_PromptAction read(DeserializerBase& buffer);
};
class promptAction_ActionMenuSuccessResponse_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuSuccessResponse value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuSuccessResponse read(DeserializerBase& buffer);
};
class promptAction_DialogController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController read(DeserializerBase& buffer);
};
class promptAction_ShowDialogSuccessResponse_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogSuccessResponse value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogSuccessResponse read(DeserializerBase& buffer);
};
class Router_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_Router value);
    static OH_OHOS_ARKUI_UICONTEXT_Router read(DeserializerBase& buffer);
};
class SimpleAnimatorOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions read(DeserializerBase& buffer);
};
class TextMenuController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_TextMenuController value);
    static OH_OHOS_ARKUI_UICONTEXT_TextMenuController read(DeserializerBase& buffer);
};
class UIContext_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_UIContext value);
    static OH_OHOS_ARKUI_UICONTEXT_UIContext read(DeserializerBase& buffer);
};
class UIInspector_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_UIInspector value);
    static OH_OHOS_ARKUI_UICONTEXT_UIInspector read(DeserializerBase& buffer);
};
class UIObserver_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_UIObserver value);
    static OH_OHOS_ARKUI_UICONTEXT_UIObserver read(DeserializerBase& buffer);
};
class uiObserver_DensityInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo read(DeserializerBase& buffer);
};
class uiObserver_NavDestinationSwitchObserverOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions read(DeserializerBase& buffer);
};
class unifiedDataChannel_UnifiedData_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData value);
    static OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData read(DeserializerBase& buffer);
};
class AnimatorOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions read(DeserializerBase& buffer);
};
class AnimatorResult_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_AnimatorResult value);
    static OH_OHOS_ARKUI_UICONTEXT_AnimatorResult read(DeserializerBase& buffer);
};
class componentSnapshot_SnapshotOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotOptions read(DeserializerBase& buffer);
};
class componentUtils_ComponentInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo read(DeserializerBase& buffer);
};
class dragController_DragEventParam_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragEventParam value);
    static OH_OHOS_ARKUI_UICONTEXT_dragController_DragEventParam read(DeserializerBase& buffer);
};
class dragController_DragInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo read(DeserializerBase& buffer);
};
class font_FontInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_font_FontInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_font_FontInfo read(DeserializerBase& buffer);
};
class GestureTriggerInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo read(DeserializerBase& buffer);
};
class mediaquery_MediaQueryListener_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener value);
    static OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener read(DeserializerBase& buffer);
};
class OverlayManagerOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions read(DeserializerBase& buffer);
};
class promptAction_BaseDialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions read(DeserializerBase& buffer);
};
class promptAction_CustomDialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions read(DeserializerBase& buffer);
};
class promptAction_DialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogOptions read(DeserializerBase& buffer);
};
class router_EnableAlertOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions read(DeserializerBase& buffer);
};
class router_NamedRouterOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions read(DeserializerBase& buffer);
};
class router_RouterOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions read(DeserializerBase& buffer);
};
class router_RouterState_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_RouterState value);
    static OH_OHOS_ARKUI_UICONTEXT_router_RouterState read(DeserializerBase& buffer);
};
class uiObserver_NavDestinationInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo read(DeserializerBase& buffer);
};
class uiObserver_NavigationInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavigationInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavigationInfo read(DeserializerBase& buffer);
};
class uiObserver_ObserverOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions read(DeserializerBase& buffer);
};
class uiObserver_RouterPageInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo read(DeserializerBase& buffer);
};
class uiObserver_ScrollEventInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo read(DeserializerBase& buffer);
};
class uiObserver_TabContentInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo read(DeserializerBase& buffer);
};
class font_FontOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_font_FontOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_font_FontOptions read(DeserializerBase& buffer);
};
class MeasureOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_MeasureOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_MeasureOptions read(DeserializerBase& buffer);
};
class PageInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_PageInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_PageInfo read(DeserializerBase& buffer);
};
class promptAction_Button_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_Button read(DeserializerBase& buffer);
};
class promptAction_ShowDialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions read(DeserializerBase& buffer);
};
class promptAction_ShowToastOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions read(DeserializerBase& buffer);
};
class TargetInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_TargetInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_TargetInfo read(DeserializerBase& buffer);
};
class uiObserver_NavDestinationSwitchInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value);
    static OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo read(DeserializerBase& buffer);
};
class promptAction_ActionMenuOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions value);
    static OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions read(DeserializerBase& buffer);
};
inline void ComponentSnapshot_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot ComponentSnapshot_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_ComponentSnapshot>(ptr);
}
inline void componentSnapshot_LocalizedSnapshotRegion_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForStart = value.start;
    valueSerializer.writeNumber(valueHolderForStart);
    const auto valueHolderForEnd = value.end;
    valueSerializer.writeNumber(valueHolderForEnd);
    const auto valueHolderForTop = value.top;
    valueSerializer.writeNumber(valueHolderForTop);
    const auto valueHolderForBottom = value.bottom;
    valueSerializer.writeNumber(valueHolderForBottom);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion componentSnapshot_LocalizedSnapshotRegion_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_LocalizedSnapshotRegion value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.start = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.end = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.top = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.bottom = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void componentSnapshot_SnapshotRegion_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForLeft = value.left;
    valueSerializer.writeNumber(valueHolderForLeft);
    const auto valueHolderForRight = value.right;
    valueSerializer.writeNumber(valueHolderForRight);
    const auto valueHolderForTop = value.top;
    valueSerializer.writeNumber(valueHolderForTop);
    const auto valueHolderForBottom = value.bottom;
    valueSerializer.writeNumber(valueHolderForBottom);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion componentSnapshot_SnapshotRegion_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotRegion value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.left = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.right = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.top = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.bottom = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void ComponentUtils_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ComponentUtils value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_ComponentUtils ComponentUtils_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_ComponentUtils>(ptr);
}
inline void componentUtils_Offset_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    valueSerializer.writeNumber(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeNumber(valueHolderForY);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset componentUtils_Offset_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentUtils_Offset value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.x = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.y = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void componentUtils_RotateResult_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    valueSerializer.writeNumber(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeNumber(valueHolderForY);
    const auto valueHolderForZ = value.z;
    valueSerializer.writeNumber(valueHolderForZ);
    const auto valueHolderForCenterX = value.centerX;
    valueSerializer.writeNumber(valueHolderForCenterX);
    const auto valueHolderForCenterY = value.centerY;
    valueSerializer.writeNumber(valueHolderForCenterY);
    const auto valueHolderForAngle = value.angle;
    valueSerializer.writeNumber(valueHolderForAngle);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult componentUtils_RotateResult_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentUtils_RotateResult value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.x = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.y = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.z = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.centerX = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.centerY = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.angle = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void componentUtils_ScaleResult_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    valueSerializer.writeNumber(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeNumber(valueHolderForY);
    const auto valueHolderForZ = value.z;
    valueSerializer.writeNumber(valueHolderForZ);
    const auto valueHolderForCenterX = value.centerX;
    valueSerializer.writeNumber(valueHolderForCenterX);
    const auto valueHolderForCenterY = value.centerY;
    valueSerializer.writeNumber(valueHolderForCenterY);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult componentUtils_ScaleResult_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentUtils_ScaleResult value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.x = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.y = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.z = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.centerX = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.centerY = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void componentUtils_Size_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeNumber(valueHolderForWidth);
    const auto valueHolderForHeight = value.height;
    valueSerializer.writeNumber(valueHolderForHeight);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size componentUtils_Size_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentUtils_Size value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.width = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.height = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void componentUtils_TranslateResult_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForX = value.x;
    valueSerializer.writeNumber(valueHolderForX);
    const auto valueHolderForY = value.y;
    valueSerializer.writeNumber(valueHolderForY);
    const auto valueHolderForZ = value.z;
    valueSerializer.writeNumber(valueHolderForZ);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult componentUtils_TranslateResult_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentUtils_TranslateResult value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.x = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.y = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.z = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void ContentCoverController_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ContentCoverController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_ContentCoverController ContentCoverController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_ContentCoverController>(ptr);
}
inline void ContextMenuController_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_ContextMenuController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_ContextMenuController ContextMenuController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_ContextMenuController>(ptr);
}
inline void CursorController_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_CursorController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_CursorController CursorController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_CursorController>(ptr);
}
inline void DragController_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_DragController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_DragController DragController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_DragController>(ptr);
}
inline void dragController_DragAction_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction dragController_DragAction_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_dragController_DragAction>(ptr);
}
inline void dragController_DragPreview_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview dragController_DragPreview_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_dragController_DragPreview>(ptr);
}
inline void DynamicSyncScene_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene DynamicSyncScene_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene>(ptr);
}
inline void FocusController_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_FocusController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_FocusController FocusController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_FocusController>(ptr);
}
inline void Font_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_Font value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_Font Font_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_Font>(ptr);
}
inline void FrameCallback_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_FrameCallback value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_FrameCallback FrameCallback_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_FrameCallback>(ptr);
}
inline void GestureObserverConfigs_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForActionPhases = value.actionPhases;
    valueSerializer.writeInt32(valueHolderForActionPhases.length);
    for (int valueHolderForActionPhasesCounterI = 0; valueHolderForActionPhasesCounterI < valueHolderForActionPhases.length; valueHolderForActionPhasesCounterI++) {
        const OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase valueHolderForActionPhasesTmpElement = valueHolderForActionPhases.array[valueHolderForActionPhasesCounterI];
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase>(valueHolderForActionPhasesTmpElement));
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs GestureObserverConfigs_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int32 actionPhasesTmpBufLength = valueDeserializer.readInt32();
    Array_GestureActionPhase actionPhasesTmpBuf = {};
    valueDeserializer.resizeArray<std::decay<decltype(actionPhasesTmpBuf)>::type,
        std::decay<decltype(*actionPhasesTmpBuf.array)>::type>(&actionPhasesTmpBuf, actionPhasesTmpBufLength);
    for (int actionPhasesTmpBufBufCounterI = 0; actionPhasesTmpBufBufCounterI < actionPhasesTmpBufLength; actionPhasesTmpBufBufCounterI++) {
        actionPhasesTmpBuf.array[actionPhasesTmpBufBufCounterI] = static_cast<OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase>(valueDeserializer.readInt32());
    }
    value.actionPhases = actionPhasesTmpBuf;
    return value;
}
inline void image_PixelMap_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_image_PixelMap value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_image_PixelMap image_PixelMap_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_image_PixelMap>(ptr);
}
inline void inspector_ComponentObserver_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver inspector_ComponentObserver_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_inspector_ComponentObserver>(ptr);
}
inline void LevelOrder_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_LevelOrder value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_LevelOrder LevelOrder_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelOrder>(ptr);
}
inline void MeasureUtils_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_MeasureUtils value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_MeasureUtils MeasureUtils_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_MeasureUtils>(ptr);
}
inline void MediaQuery_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_MediaQuery value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_MediaQuery MediaQuery_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_MediaQuery>(ptr);
}
inline void OverlayManager_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_OverlayManager value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_OverlayManager OverlayManager_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_OverlayManager>(ptr);
}
inline void PromptAction_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_PromptAction value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_PromptAction PromptAction_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_PromptAction>(ptr);
}
inline void promptAction_ActionMenuSuccessResponse_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuSuccessResponse value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuSuccessResponse promptAction_ActionMenuSuccessResponse_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuSuccessResponse value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void promptAction_DialogController_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController promptAction_DialogController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController>(ptr);
}
inline void promptAction_ShowDialogSuccessResponse_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogSuccessResponse value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogSuccessResponse promptAction_ShowDialogSuccessResponse_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogSuccessResponse value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void Router_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_Router value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_Router Router_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_Router>(ptr);
}
inline void SimpleAnimatorOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions SimpleAnimatorOptions_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions>(ptr);
}
inline void TextMenuController_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_TextMenuController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_TextMenuController TextMenuController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_TextMenuController>(ptr);
}
inline void UIContext_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_UIContext value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_UIContext UIContext_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_UIContext>(ptr);
}
inline void UIInspector_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_UIInspector value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_UIInspector UIInspector_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_UIInspector>(ptr);
}
inline void UIObserver_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_UIObserver value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_UIObserver UIObserver_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_UIObserver>(ptr);
}
inline void uiObserver_DensityInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo uiObserver_DensityInfo_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo>(ptr);
}
inline void uiObserver_NavDestinationSwitchObserverOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForNavigationId = value.navigationId;
    valueSerializer.writeCustomObject("object", valueHolderForNavigationId);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions uiObserver_NavDestinationSwitchObserverOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.navigationId = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    return value;
}
inline void unifiedDataChannel_UnifiedData_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData unifiedDataChannel_UnifiedData_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData>(ptr);
}
inline void AnimatorOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions value)
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
inline OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions AnimatorOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_AnimatorOptions value = {};
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
inline void AnimatorResult_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_AnimatorResult value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_AnimatorResult AnimatorResult_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_AnimatorResult>(ptr);
}
inline void componentSnapshot_SnapshotOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForScale = value.scale;
    if (runtimeType(valueHolderForScale) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForScaleTmpValue = valueHolderForScale.value;
        valueSerializer.writeNumber(valueHolderForScaleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForWaitUntilRenderFinished = value.waitUntilRenderFinished;
    if (runtimeType(valueHolderForWaitUntilRenderFinished) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForWaitUntilRenderFinishedTmpValue = valueHolderForWaitUntilRenderFinished.value;
        valueSerializer.writeBoolean(valueHolderForWaitUntilRenderFinishedTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForRegion = value.region;
    if (runtimeType(valueHolderForRegion) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForRegionTmpValue = valueHolderForRegion.value;
        if (valueHolderForRegionTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForRegionTmpValueForIdx0 = valueHolderForRegionTmpValue.value0;
            componentSnapshot_SnapshotRegion_serializer::write(valueSerializer, valueHolderForRegionTmpValueForIdx0);
        } else if (valueHolderForRegionTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForRegionTmpValueForIdx1 = valueHolderForRegionTmpValue.value1;
            componentSnapshot_LocalizedSnapshotRegion_serializer::write(valueSerializer, valueHolderForRegionTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotOptions componentSnapshot_SnapshotOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentSnapshot_SnapshotOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto scaleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number scaleTmpBuf = {};
    scaleTmpBuf.tag = scaleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((scaleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        scaleTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.scale = scaleTmpBuf;
    const auto waitUntilRenderFinishedTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean waitUntilRenderFinishedTmpBuf = {};
    waitUntilRenderFinishedTmpBuf.tag = waitUntilRenderFinishedTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((waitUntilRenderFinishedTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        waitUntilRenderFinishedTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.waitUntilRenderFinished = waitUntilRenderFinishedTmpBuf;
    const auto regionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_SnapshotRegionType regionTmpBuf = {};
    regionTmpBuf.tag = regionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((regionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 regionTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_SnapshotRegionType regionTmpBuf_ = {};
        regionTmpBuf_.selector = regionTmpBuf_UnionSelector;
        if (regionTmpBuf_UnionSelector == 0) {
            regionTmpBuf_.selector = 0;
            regionTmpBuf_.value0 = componentSnapshot_SnapshotRegion_serializer::read(valueDeserializer);
        } else if (regionTmpBuf_UnionSelector == 1) {
            regionTmpBuf_.selector = 1;
            regionTmpBuf_.value1 = componentSnapshot_LocalizedSnapshotRegion_serializer::read(valueDeserializer);
        } else {
            INTEROP_FATAL("One of the branches for regionTmpBuf_ has to be chosen through deserialisation.");
        }
        regionTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_SnapshotRegionType>(regionTmpBuf_);
    }
    value.region = regionTmpBuf;
    return value;
}
inline void componentUtils_ComponentInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForSize = value.size;
    componentUtils_Size_serializer::write(valueSerializer, valueHolderForSize);
    const auto valueHolderForLocalOffset = value.localOffset;
    componentUtils_Offset_serializer::write(valueSerializer, valueHolderForLocalOffset);
    const auto valueHolderForWindowOffset = value.windowOffset;
    componentUtils_Offset_serializer::write(valueSerializer, valueHolderForWindowOffset);
    const auto valueHolderForScreenOffset = value.screenOffset;
    componentUtils_Offset_serializer::write(valueSerializer, valueHolderForScreenOffset);
    const auto valueHolderForTranslate = value.translate;
    componentUtils_TranslateResult_serializer::write(valueSerializer, valueHolderForTranslate);
    const auto valueHolderForScale = value.scale;
    componentUtils_ScaleResult_serializer::write(valueSerializer, valueHolderForScale);
    const auto valueHolderForRotate = value.rotate;
    componentUtils_RotateResult_serializer::write(valueSerializer, valueHolderForRotate);
    const auto valueHolderForTransform = value.transform;
    const auto valueHolderForTransform_0 = valueHolderForTransform.value0;
    valueSerializer.writeNumber(valueHolderForTransform_0);
    const auto valueHolderForTransform_1 = valueHolderForTransform.value1;
    valueSerializer.writeNumber(valueHolderForTransform_1);
    const auto valueHolderForTransform_2 = valueHolderForTransform.value2;
    valueSerializer.writeNumber(valueHolderForTransform_2);
    const auto valueHolderForTransform_3 = valueHolderForTransform.value3;
    valueSerializer.writeNumber(valueHolderForTransform_3);
    const auto valueHolderForTransform_4 = valueHolderForTransform.value4;
    valueSerializer.writeNumber(valueHolderForTransform_4);
    const auto valueHolderForTransform_5 = valueHolderForTransform.value5;
    valueSerializer.writeNumber(valueHolderForTransform_5);
    const auto valueHolderForTransform_6 = valueHolderForTransform.value6;
    valueSerializer.writeNumber(valueHolderForTransform_6);
    const auto valueHolderForTransform_7 = valueHolderForTransform.value7;
    valueSerializer.writeNumber(valueHolderForTransform_7);
    const auto valueHolderForTransform_8 = valueHolderForTransform.value8;
    valueSerializer.writeNumber(valueHolderForTransform_8);
    const auto valueHolderForTransform_9 = valueHolderForTransform.value9;
    valueSerializer.writeNumber(valueHolderForTransform_9);
    const auto valueHolderForTransform_10 = valueHolderForTransform.value10;
    valueSerializer.writeNumber(valueHolderForTransform_10);
    const auto valueHolderForTransform_11 = valueHolderForTransform.value11;
    valueSerializer.writeNumber(valueHolderForTransform_11);
    const auto valueHolderForTransform_12 = valueHolderForTransform.value12;
    valueSerializer.writeNumber(valueHolderForTransform_12);
    const auto valueHolderForTransform_13 = valueHolderForTransform.value13;
    valueSerializer.writeNumber(valueHolderForTransform_13);
    const auto valueHolderForTransform_14 = valueHolderForTransform.value14;
    valueSerializer.writeNumber(valueHolderForTransform_14);
    const auto valueHolderForTransform_15 = valueHolderForTransform.value15;
    valueSerializer.writeNumber(valueHolderForTransform_15);
}
inline OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo componentUtils_ComponentInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_componentUtils_ComponentInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.size = componentUtils_Size_serializer::read(valueDeserializer);
    value.localOffset = componentUtils_Offset_serializer::read(valueDeserializer);
    value.windowOffset = componentUtils_Offset_serializer::read(valueDeserializer);
    value.screenOffset = componentUtils_Offset_serializer::read(valueDeserializer);
    value.translate = componentUtils_TranslateResult_serializer::read(valueDeserializer);
    value.scale = componentUtils_ScaleResult_serializer::read(valueDeserializer);
    value.rotate = componentUtils_RotateResult_serializer::read(valueDeserializer);
    OH_OHOS_ARKUI_UICONTEXT_componentUtils_Matrix4Result transformTmpBuf = {};
    transformTmpBuf.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value1 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value2 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value3 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value4 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value5 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value6 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value7 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value8 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value9 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value10 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value11 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value12 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value13 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value14 = static_cast<OH_Number>(valueDeserializer.readNumber());
    transformTmpBuf.value15 = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.transform = transformTmpBuf;
    return value;
}
inline void dragController_DragEventParam_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragEventParam value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForEvent = value.event;
    valueSerializer.writeCustomObject("object", valueHolderForEvent);
    const auto valueHolderForExtraParams = value.extraParams;
    valueSerializer.writeString(valueHolderForExtraParams);
}
inline OH_OHOS_ARKUI_UICONTEXT_dragController_DragEventParam dragController_DragEventParam_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_dragController_DragEventParam value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.event = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.extraParams = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void dragController_DragInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo value)
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
inline OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo dragController_DragInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.pointerId = static_cast<OH_Number>(valueDeserializer.readNumber());
    const auto dataTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_unifiedDataChannel_UnifiedData dataTmpBuf = {};
    dataTmpBuf.tag = dataTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dataTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dataTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_unifiedDataChannel_UnifiedData>(unifiedDataChannel_UnifiedData_serializer::read(valueDeserializer));
    }
    value.data = dataTmpBuf;
    const auto extraParamsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_String extraParamsTmpBuf = {};
    extraParamsTmpBuf.tag = extraParamsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((extraParamsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        extraParamsTmpBuf.value = static_cast<OH_String>(valueDeserializer.readString());
    }
    value.extraParams = extraParamsTmpBuf;
    const auto touchPointTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject touchPointTmpBuf = {};
    touchPointTmpBuf.tag = touchPointTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((touchPointTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        touchPointTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.touchPoint = touchPointTmpBuf;
    const auto previewOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject previewOptionsTmpBuf = {};
    previewOptionsTmpBuf.tag = previewOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((previewOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        previewOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.previewOptions = previewOptionsTmpBuf;
    return value;
}
inline void font_FontInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_font_FontInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForPath = value.path;
    valueSerializer.writeString(valueHolderForPath);
    const auto valueHolderForPostScriptName = value.postScriptName;
    valueSerializer.writeString(valueHolderForPostScriptName);
    const auto valueHolderForFullName = value.fullName;
    valueSerializer.writeString(valueHolderForFullName);
    const auto valueHolderForFamily = value.family;
    valueSerializer.writeString(valueHolderForFamily);
    const auto valueHolderForSubfamily = value.subfamily;
    valueSerializer.writeString(valueHolderForSubfamily);
    const auto valueHolderForWeight = value.weight;
    valueSerializer.writeNumber(valueHolderForWeight);
    const auto valueHolderForWidth = value.width;
    valueSerializer.writeNumber(valueHolderForWidth);
    const auto valueHolderForItalic = value.italic;
    valueSerializer.writeBoolean(valueHolderForItalic);
    const auto valueHolderForMonoSpace = value.monoSpace;
    valueSerializer.writeBoolean(valueHolderForMonoSpace);
    const auto valueHolderForSymbolic = value.symbolic;
    valueSerializer.writeBoolean(valueHolderForSymbolic);
}
inline OH_OHOS_ARKUI_UICONTEXT_font_FontInfo font_FontInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_font_FontInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.path = static_cast<OH_String>(valueDeserializer.readString());
    value.postScriptName = static_cast<OH_String>(valueDeserializer.readString());
    value.fullName = static_cast<OH_String>(valueDeserializer.readString());
    value.family = static_cast<OH_String>(valueDeserializer.readString());
    value.subfamily = static_cast<OH_String>(valueDeserializer.readString());
    value.weight = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.width = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.italic = valueDeserializer.readBoolean();
    value.monoSpace = valueDeserializer.readBoolean();
    value.symbolic = valueDeserializer.readBoolean();
    return value;
}
inline void GestureTriggerInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForEvent = value.event;
    valueSerializer.writeCustomObject("object", valueHolderForEvent);
    const auto valueHolderForCurrent = value.current;
    valueSerializer.writeCustomObject("object", valueHolderForCurrent);
    const auto valueHolderForCurrentPhase = value.currentPhase;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase>(valueHolderForCurrentPhase));
    const auto valueHolderForNode = value.node;
    if (runtimeType(valueHolderForNode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForNodeTmpValue = valueHolderForNode.value;
        valueSerializer.writeCustomObject("object", valueHolderForNodeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo GestureTriggerInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.event = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.current = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.currentPhase = static_cast<OH_OHOS_ARKUI_UICONTEXT_GestureActionPhase>(valueDeserializer.readInt32());
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.node = nodeTmpBuf;
    return value;
}
inline void mediaquery_MediaQueryListener_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener mediaquery_MediaQueryListener_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_mediaquery_MediaQueryListener>(ptr);
}
inline void OverlayManagerOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForRenderRootOverlay = value.renderRootOverlay;
    if (runtimeType(valueHolderForRenderRootOverlay) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForRenderRootOverlayTmpValue = valueHolderForRenderRootOverlay.value;
        valueSerializer.writeBoolean(valueHolderForRenderRootOverlayTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableBackPressedEvent = value.enableBackPressedEvent;
    if (runtimeType(valueHolderForEnableBackPressedEvent) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableBackPressedEventTmpValue = valueHolderForEnableBackPressedEvent.value;
        valueSerializer.writeBoolean(valueHolderForEnableBackPressedEventTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions OverlayManagerOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto renderRootOverlayTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean renderRootOverlayTmpBuf = {};
    renderRootOverlayTmpBuf.tag = renderRootOverlayTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((renderRootOverlayTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        renderRootOverlayTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.renderRootOverlay = renderRootOverlayTmpBuf;
    const auto enableBackPressedEventTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableBackPressedEventTmpBuf = {};
    enableBackPressedEventTmpBuf.tag = enableBackPressedEventTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableBackPressedEventTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableBackPressedEventTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableBackPressedEvent = enableBackPressedEventTmpBuf;
    return value;
}
inline void promptAction_BaseDialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForMaskRect = value.maskRect;
    if (runtimeType(valueHolderForMaskRect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskRectTmpValue = valueHolderForMaskRect.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskRectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAlignment = value.alignment;
    if (runtimeType(valueHolderForAlignment) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAlignmentTmpValue = valueHolderForAlignment.value;
        valueSerializer.writeCustomObject("object", valueHolderForAlignmentTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOffset = value.offset;
    if (runtimeType(valueHolderForOffset) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOffsetTmpValue = valueHolderForOffset.value;
        valueSerializer.writeCustomObject("object", valueHolderForOffsetTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShowInSubWindow = value.showInSubWindow;
    if (runtimeType(valueHolderForShowInSubWindow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShowInSubWindowTmpValue = valueHolderForShowInSubWindow.value;
        valueSerializer.writeBoolean(valueHolderForShowInSubWindowTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsModal = value.isModal;
    if (runtimeType(valueHolderForIsModal) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsModalTmpValue = valueHolderForIsModal.value;
        valueSerializer.writeBoolean(valueHolderForIsModalTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAutoCancel = value.autoCancel;
    if (runtimeType(valueHolderForAutoCancel) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAutoCancelTmpValue = valueHolderForAutoCancel.value;
        valueSerializer.writeBoolean(valueHolderForAutoCancelTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTransition = value.transition;
    if (runtimeType(valueHolderForTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTransitionTmpValue = valueHolderForTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDialogTransition = value.dialogTransition;
    if (runtimeType(valueHolderForDialogTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDialogTransitionTmpValue = valueHolderForDialogTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForDialogTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaskTransition = value.maskTransition;
    if (runtimeType(valueHolderForMaskTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskTransitionTmpValue = valueHolderForMaskTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaskColor = value.maskColor;
    if (runtimeType(valueHolderForMaskColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskColorTmpValue = valueHolderForMaskColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillDismiss = value.onWillDismiss;
    if (runtimeType(valueHolderForOnWillDismiss) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillDismissTmpValue = valueHolderForOnWillDismiss.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillDismissTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDismissTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDismissTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidAppear = value.onDidAppear;
    if (runtimeType(valueHolderForOnDidAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidAppearTmpValue = valueHolderForOnDidAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidDisappear = value.onDidDisappear;
    if (runtimeType(valueHolderForOnDidDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidDisappearTmpValue = valueHolderForOnDidDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillAppear = value.onWillAppear;
    if (runtimeType(valueHolderForOnWillAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillAppearTmpValue = valueHolderForOnWillAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillDisappear = value.onWillDisappear;
    if (runtimeType(valueHolderForOnWillDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillDisappearTmpValue = valueHolderForOnWillDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForKeyboardAvoidMode = value.keyboardAvoidMode;
    if (runtimeType(valueHolderForKeyboardAvoidMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForKeyboardAvoidModeTmpValue = valueHolderForKeyboardAvoidMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode>(valueHolderForKeyboardAvoidModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableHoverMode = value.enableHoverMode;
    if (runtimeType(valueHolderForEnableHoverMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableHoverModeTmpValue = valueHolderForEnableHoverMode.value;
        valueSerializer.writeBoolean(valueHolderForEnableHoverModeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHoverModeArea = value.hoverModeArea;
    if (runtimeType(valueHolderForHoverModeArea) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHoverModeAreaTmpValue = valueHolderForHoverModeArea.value;
        valueSerializer.writeCustomObject("object", valueHolderForHoverModeAreaTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyleOptions = value.backgroundBlurStyleOptions;
    if (runtimeType(valueHolderForBackgroundBlurStyleOptions) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleOptionsTmpValue = valueHolderForBackgroundBlurStyleOptions.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleOptionsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundEffect = value.backgroundEffect;
    if (runtimeType(valueHolderForBackgroundEffect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundEffectTmpValue = valueHolderForBackgroundEffect.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundEffectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForKeyboardAvoidDistance = value.keyboardAvoidDistance;
    if (runtimeType(valueHolderForKeyboardAvoidDistance) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForKeyboardAvoidDistanceTmpValue = valueHolderForKeyboardAvoidDistance.value;
        valueSerializer.writeCustomObject("object", valueHolderForKeyboardAvoidDistanceTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelMode = value.levelMode;
    if (runtimeType(valueHolderForLevelMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelModeTmpValue = valueHolderForLevelMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueHolderForLevelModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelUniqueId = value.levelUniqueId;
    if (runtimeType(valueHolderForLevelUniqueId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelUniqueIdTmpValue = valueHolderForLevelUniqueId.value;
        valueSerializer.writeNumber(valueHolderForLevelUniqueIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForImmersiveMode = value.immersiveMode;
    if (runtimeType(valueHolderForImmersiveMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForImmersiveModeTmpValue = valueHolderForImmersiveMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelOrder = value.levelOrder;
    if (runtimeType(valueHolderForLevelOrder) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelOrderTmpValue = valueHolderForLevelOrder.value;
        LevelOrder_serializer::write(valueSerializer, valueHolderForLevelOrderTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFocusable = value.focusable;
    if (runtimeType(valueHolderForFocusable) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFocusableTmpValue = valueHolderForFocusable.value;
        valueSerializer.writeBoolean(valueHolderForFocusableTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions promptAction_BaseDialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto autoCancelTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean autoCancelTmpBuf = {};
    autoCancelTmpBuf.tag = autoCancelTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((autoCancelTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        autoCancelTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.autoCancel = autoCancelTmpBuf;
    const auto transitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject transitionTmpBuf = {};
    transitionTmpBuf.tag = transitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((transitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        transitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.transition = transitionTmpBuf;
    const auto dialogTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject dialogTransitionTmpBuf = {};
    dialogTransitionTmpBuf.tag = dialogTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dialogTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dialogTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.dialogTransition = dialogTransitionTmpBuf;
    const auto maskTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskTransitionTmpBuf = {};
    maskTransitionTmpBuf.tag = maskTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskTransition = maskTransitionTmpBuf;
    const auto maskColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskColorTmpBuf = {};
    maskColorTmpBuf.tag = maskColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskColor = maskColorTmpBuf;
    const auto onWillDismissTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void onWillDismissTmpBuf = {};
    onWillDismissTmpBuf.tag = onWillDismissTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDismissTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDismissTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))))};
    }
    value.onWillDismiss = onWillDismissTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto keyboardAvoidModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_KeyboardAvoidMode keyboardAvoidModeTmpBuf = {};
    keyboardAvoidModeTmpBuf.tag = keyboardAvoidModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode>(valueDeserializer.readInt32());
    }
    value.keyboardAvoidMode = keyboardAvoidModeTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto keyboardAvoidDistanceTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject keyboardAvoidDistanceTmpBuf = {};
    keyboardAvoidDistanceTmpBuf.tag = keyboardAvoidDistanceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidDistanceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidDistanceTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.keyboardAvoidDistance = keyboardAvoidDistanceTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    const auto focusableTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean focusableTmpBuf = {};
    focusableTmpBuf.tag = focusableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((focusableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        focusableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.focusable = focusableTmpBuf;
    return value;
}
inline void promptAction_CustomDialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForMaskRect = value.maskRect;
    if (runtimeType(valueHolderForMaskRect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskRectTmpValue = valueHolderForMaskRect.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskRectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAlignment = value.alignment;
    if (runtimeType(valueHolderForAlignment) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAlignmentTmpValue = valueHolderForAlignment.value;
        valueSerializer.writeCustomObject("object", valueHolderForAlignmentTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOffset = value.offset;
    if (runtimeType(valueHolderForOffset) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOffsetTmpValue = valueHolderForOffset.value;
        valueSerializer.writeCustomObject("object", valueHolderForOffsetTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShowInSubWindow = value.showInSubWindow;
    if (runtimeType(valueHolderForShowInSubWindow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShowInSubWindowTmpValue = valueHolderForShowInSubWindow.value;
        valueSerializer.writeBoolean(valueHolderForShowInSubWindowTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsModal = value.isModal;
    if (runtimeType(valueHolderForIsModal) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsModalTmpValue = valueHolderForIsModal.value;
        valueSerializer.writeBoolean(valueHolderForIsModalTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAutoCancel = value.autoCancel;
    if (runtimeType(valueHolderForAutoCancel) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAutoCancelTmpValue = valueHolderForAutoCancel.value;
        valueSerializer.writeBoolean(valueHolderForAutoCancelTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTransition = value.transition;
    if (runtimeType(valueHolderForTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTransitionTmpValue = valueHolderForTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDialogTransition = value.dialogTransition;
    if (runtimeType(valueHolderForDialogTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDialogTransitionTmpValue = valueHolderForDialogTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForDialogTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaskTransition = value.maskTransition;
    if (runtimeType(valueHolderForMaskTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskTransitionTmpValue = valueHolderForMaskTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaskColor = value.maskColor;
    if (runtimeType(valueHolderForMaskColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskColorTmpValue = valueHolderForMaskColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillDismiss = value.onWillDismiss;
    if (runtimeType(valueHolderForOnWillDismiss) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillDismissTmpValue = valueHolderForOnWillDismiss.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillDismissTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDismissTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDismissTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidAppear = value.onDidAppear;
    if (runtimeType(valueHolderForOnDidAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidAppearTmpValue = valueHolderForOnDidAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidDisappear = value.onDidDisappear;
    if (runtimeType(valueHolderForOnDidDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidDisappearTmpValue = valueHolderForOnDidDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillAppear = value.onWillAppear;
    if (runtimeType(valueHolderForOnWillAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillAppearTmpValue = valueHolderForOnWillAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillDisappear = value.onWillDisappear;
    if (runtimeType(valueHolderForOnWillDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillDisappearTmpValue = valueHolderForOnWillDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForKeyboardAvoidMode = value.keyboardAvoidMode;
    if (runtimeType(valueHolderForKeyboardAvoidMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForKeyboardAvoidModeTmpValue = valueHolderForKeyboardAvoidMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode>(valueHolderForKeyboardAvoidModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableHoverMode = value.enableHoverMode;
    if (runtimeType(valueHolderForEnableHoverMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableHoverModeTmpValue = valueHolderForEnableHoverMode.value;
        valueSerializer.writeBoolean(valueHolderForEnableHoverModeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHoverModeArea = value.hoverModeArea;
    if (runtimeType(valueHolderForHoverModeArea) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHoverModeAreaTmpValue = valueHolderForHoverModeArea.value;
        valueSerializer.writeCustomObject("object", valueHolderForHoverModeAreaTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyleOptions = value.backgroundBlurStyleOptions;
    if (runtimeType(valueHolderForBackgroundBlurStyleOptions) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleOptionsTmpValue = valueHolderForBackgroundBlurStyleOptions.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleOptionsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundEffect = value.backgroundEffect;
    if (runtimeType(valueHolderForBackgroundEffect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundEffectTmpValue = valueHolderForBackgroundEffect.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundEffectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForKeyboardAvoidDistance = value.keyboardAvoidDistance;
    if (runtimeType(valueHolderForKeyboardAvoidDistance) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForKeyboardAvoidDistanceTmpValue = valueHolderForKeyboardAvoidDistance.value;
        valueSerializer.writeCustomObject("object", valueHolderForKeyboardAvoidDistanceTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelMode = value.levelMode;
    if (runtimeType(valueHolderForLevelMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelModeTmpValue = valueHolderForLevelMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueHolderForLevelModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelUniqueId = value.levelUniqueId;
    if (runtimeType(valueHolderForLevelUniqueId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelUniqueIdTmpValue = valueHolderForLevelUniqueId.value;
        valueSerializer.writeNumber(valueHolderForLevelUniqueIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForImmersiveMode = value.immersiveMode;
    if (runtimeType(valueHolderForImmersiveMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForImmersiveModeTmpValue = valueHolderForImmersiveMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelOrder = value.levelOrder;
    if (runtimeType(valueHolderForLevelOrder) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelOrderTmpValue = valueHolderForLevelOrder.value;
        LevelOrder_serializer::write(valueSerializer, valueHolderForLevelOrderTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFocusable = value.focusable;
    if (runtimeType(valueHolderForFocusable) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFocusableTmpValue = valueHolderForFocusable.value;
        valueSerializer.writeBoolean(valueHolderForFocusableTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBuilder = value.builder;
    valueSerializer.writeCustomObject("object", valueHolderForBuilder);
    const auto valueHolderForBackgroundColor = value.backgroundColor;
    if (runtimeType(valueHolderForBackgroundColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundColorTmpValue = valueHolderForBackgroundColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCornerRadius = value.cornerRadius;
    if (runtimeType(valueHolderForCornerRadius) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCornerRadiusTmpValue = valueHolderForCornerRadius.value;
        if (valueHolderForCornerRadiusTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForCornerRadiusTmpValueForIdx0 = valueHolderForCornerRadiusTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForCornerRadiusTmpValueForIdx0);
        } else if (valueHolderForCornerRadiusTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForCornerRadiusTmpValueForIdx1 = valueHolderForCornerRadiusTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForCornerRadiusTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForWidth = value.width;
    if (runtimeType(valueHolderForWidth) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForWidthTmpValue = valueHolderForWidth.value;
        valueSerializer.writeCustomObject("object", valueHolderForWidthTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHeight = value.height;
    if (runtimeType(valueHolderForHeight) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHeightTmpValue = valueHolderForHeight.value;
        valueSerializer.writeCustomObject("object", valueHolderForHeightTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBorderWidth = value.borderWidth;
    if (runtimeType(valueHolderForBorderWidth) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBorderWidthTmpValue = valueHolderForBorderWidth.value;
        if (valueHolderForBorderWidthTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBorderWidthTmpValueForIdx0 = valueHolderForBorderWidthTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForBorderWidthTmpValueForIdx0);
        } else if (valueHolderForBorderWidthTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBorderWidthTmpValueForIdx1 = valueHolderForBorderWidthTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForBorderWidthTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBorderColor = value.borderColor;
    if (runtimeType(valueHolderForBorderColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBorderColorTmpValue = valueHolderForBorderColor.value;
        if (valueHolderForBorderColorTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBorderColorTmpValueForIdx0 = valueHolderForBorderColorTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForBorderColorTmpValueForIdx0);
        } else if (valueHolderForBorderColorTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBorderColorTmpValueForIdx1 = valueHolderForBorderColorTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForBorderColorTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBorderStyle = value.borderStyle;
    if (runtimeType(valueHolderForBorderStyle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBorderStyleTmpValue = valueHolderForBorderStyle.value;
        if (valueHolderForBorderStyleTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBorderStyleTmpValueForIdx0 = valueHolderForBorderStyleTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForBorderStyleTmpValueForIdx0);
        } else if (valueHolderForBorderStyleTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBorderStyleTmpValueForIdx1 = valueHolderForBorderStyleTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForBorderStyleTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShadow = value.shadow;
    if (runtimeType(valueHolderForShadow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShadowTmpValue = valueHolderForShadow.value;
        if (valueHolderForShadowTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForShadowTmpValueForIdx0 = valueHolderForShadowTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx0);
        } else if (valueHolderForShadowTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForShadowTmpValueForIdx1 = valueHolderForShadowTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyle = value.backgroundBlurStyle;
    if (runtimeType(valueHolderForBackgroundBlurStyle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleTmpValue = valueHolderForBackgroundBlurStyle.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions promptAction_CustomDialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto autoCancelTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean autoCancelTmpBuf = {};
    autoCancelTmpBuf.tag = autoCancelTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((autoCancelTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        autoCancelTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.autoCancel = autoCancelTmpBuf;
    const auto transitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject transitionTmpBuf = {};
    transitionTmpBuf.tag = transitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((transitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        transitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.transition = transitionTmpBuf;
    const auto dialogTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject dialogTransitionTmpBuf = {};
    dialogTransitionTmpBuf.tag = dialogTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dialogTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dialogTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.dialogTransition = dialogTransitionTmpBuf;
    const auto maskTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskTransitionTmpBuf = {};
    maskTransitionTmpBuf.tag = maskTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskTransition = maskTransitionTmpBuf;
    const auto maskColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskColorTmpBuf = {};
    maskColorTmpBuf.tag = maskColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskColor = maskColorTmpBuf;
    const auto onWillDismissTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void onWillDismissTmpBuf = {};
    onWillDismissTmpBuf.tag = onWillDismissTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDismissTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDismissTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))))};
    }
    value.onWillDismiss = onWillDismissTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto keyboardAvoidModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_KeyboardAvoidMode keyboardAvoidModeTmpBuf = {};
    keyboardAvoidModeTmpBuf.tag = keyboardAvoidModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode>(valueDeserializer.readInt32());
    }
    value.keyboardAvoidMode = keyboardAvoidModeTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto keyboardAvoidDistanceTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject keyboardAvoidDistanceTmpBuf = {};
    keyboardAvoidDistanceTmpBuf.tag = keyboardAvoidDistanceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidDistanceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidDistanceTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.keyboardAvoidDistance = keyboardAvoidDistanceTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    const auto focusableTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean focusableTmpBuf = {};
    focusableTmpBuf.tag = focusableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((focusableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        focusableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.focusable = focusableTmpBuf;
    value.builder = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto cornerRadiusTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Dimension_BorderRadiuses cornerRadiusTmpBuf = {};
    cornerRadiusTmpBuf.tag = cornerRadiusTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((cornerRadiusTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 cornerRadiusTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_BorderRadiuses cornerRadiusTmpBuf_ = {};
        cornerRadiusTmpBuf_.selector = cornerRadiusTmpBuf_UnionSelector;
        if (cornerRadiusTmpBuf_UnionSelector == 0) {
            cornerRadiusTmpBuf_.selector = 0;
            cornerRadiusTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (cornerRadiusTmpBuf_UnionSelector == 1) {
            cornerRadiusTmpBuf_.selector = 1;
            cornerRadiusTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for cornerRadiusTmpBuf_ has to be chosen through deserialisation.");
        }
        cornerRadiusTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_BorderRadiuses>(cornerRadiusTmpBuf_);
    }
    value.cornerRadius = cornerRadiusTmpBuf;
    const auto widthTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject widthTmpBuf = {};
    widthTmpBuf.tag = widthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((widthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        widthTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.width = widthTmpBuf;
    const auto heightTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject heightTmpBuf = {};
    heightTmpBuf.tag = heightTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((heightTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        heightTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.height = heightTmpBuf;
    const auto borderWidthTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Dimension_EdgeWidths borderWidthTmpBuf = {};
    borderWidthTmpBuf.tag = borderWidthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderWidthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderWidthTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_EdgeWidths borderWidthTmpBuf_ = {};
        borderWidthTmpBuf_.selector = borderWidthTmpBuf_UnionSelector;
        if (borderWidthTmpBuf_UnionSelector == 0) {
            borderWidthTmpBuf_.selector = 0;
            borderWidthTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (borderWidthTmpBuf_UnionSelector == 1) {
            borderWidthTmpBuf_.selector = 1;
            borderWidthTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for borderWidthTmpBuf_ has to be chosen through deserialisation.");
        }
        borderWidthTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Dimension_EdgeWidths>(borderWidthTmpBuf_);
    }
    value.borderWidth = borderWidthTmpBuf;
    const auto borderColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ResourceColor_EdgeColors borderColorTmpBuf = {};
    borderColorTmpBuf.tag = borderColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderColorTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_ResourceColor_EdgeColors borderColorTmpBuf_ = {};
        borderColorTmpBuf_.selector = borderColorTmpBuf_UnionSelector;
        if (borderColorTmpBuf_UnionSelector == 0) {
            borderColorTmpBuf_.selector = 0;
            borderColorTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (borderColorTmpBuf_UnionSelector == 1) {
            borderColorTmpBuf_.selector = 1;
            borderColorTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for borderColorTmpBuf_ has to be chosen through deserialisation.");
        }
        borderColorTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_ResourceColor_EdgeColors>(borderColorTmpBuf_);
    }
    value.borderColor = borderColorTmpBuf;
    const auto borderStyleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_BorderStyle_EdgeStyles borderStyleTmpBuf = {};
    borderStyleTmpBuf.tag = borderStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderStyleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_BorderStyle_EdgeStyles borderStyleTmpBuf_ = {};
        borderStyleTmpBuf_.selector = borderStyleTmpBuf_UnionSelector;
        if (borderStyleTmpBuf_UnionSelector == 0) {
            borderStyleTmpBuf_.selector = 0;
            borderStyleTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (borderStyleTmpBuf_UnionSelector == 1) {
            borderStyleTmpBuf_.selector = 1;
            borderStyleTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for borderStyleTmpBuf_ has to be chosen through deserialisation.");
        }
        borderStyleTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_BorderStyle_EdgeStyles>(borderStyleTmpBuf_);
    }
    value.borderStyle = borderStyleTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ShadowOptions_ShadowStyle shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle shadowTmpBuf_ = {};
        shadowTmpBuf_.selector = shadowTmpBuf_UnionSelector;
        if (shadowTmpBuf_UnionSelector == 0) {
            shadowTmpBuf_.selector = 0;
            shadowTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (shadowTmpBuf_UnionSelector == 1) {
            shadowTmpBuf_.selector = 1;
            shadowTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for shadowTmpBuf_ has to be chosen through deserialisation.");
        }
        shadowTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    return value;
}
inline void promptAction_DialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForMaskRect = value.maskRect;
    if (runtimeType(valueHolderForMaskRect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskRectTmpValue = valueHolderForMaskRect.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskRectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAlignment = value.alignment;
    if (runtimeType(valueHolderForAlignment) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAlignmentTmpValue = valueHolderForAlignment.value;
        valueSerializer.writeCustomObject("object", valueHolderForAlignmentTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOffset = value.offset;
    if (runtimeType(valueHolderForOffset) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOffsetTmpValue = valueHolderForOffset.value;
        valueSerializer.writeCustomObject("object", valueHolderForOffsetTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShowInSubWindow = value.showInSubWindow;
    if (runtimeType(valueHolderForShowInSubWindow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShowInSubWindowTmpValue = valueHolderForShowInSubWindow.value;
        valueSerializer.writeBoolean(valueHolderForShowInSubWindowTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsModal = value.isModal;
    if (runtimeType(valueHolderForIsModal) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsModalTmpValue = valueHolderForIsModal.value;
        valueSerializer.writeBoolean(valueHolderForIsModalTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAutoCancel = value.autoCancel;
    if (runtimeType(valueHolderForAutoCancel) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAutoCancelTmpValue = valueHolderForAutoCancel.value;
        valueSerializer.writeBoolean(valueHolderForAutoCancelTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTransition = value.transition;
    if (runtimeType(valueHolderForTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTransitionTmpValue = valueHolderForTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForDialogTransition = value.dialogTransition;
    if (runtimeType(valueHolderForDialogTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDialogTransitionTmpValue = valueHolderForDialogTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForDialogTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaskTransition = value.maskTransition;
    if (runtimeType(valueHolderForMaskTransition) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskTransitionTmpValue = valueHolderForMaskTransition.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskTransitionTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaskColor = value.maskColor;
    if (runtimeType(valueHolderForMaskColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskColorTmpValue = valueHolderForMaskColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillDismiss = value.onWillDismiss;
    if (runtimeType(valueHolderForOnWillDismiss) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillDismissTmpValue = valueHolderForOnWillDismiss.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillDismissTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDismissTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDismissTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidAppear = value.onDidAppear;
    if (runtimeType(valueHolderForOnDidAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidAppearTmpValue = valueHolderForOnDidAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidDisappear = value.onDidDisappear;
    if (runtimeType(valueHolderForOnDidDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidDisappearTmpValue = valueHolderForOnDidDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillAppear = value.onWillAppear;
    if (runtimeType(valueHolderForOnWillAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillAppearTmpValue = valueHolderForOnWillAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillDisappear = value.onWillDisappear;
    if (runtimeType(valueHolderForOnWillDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillDisappearTmpValue = valueHolderForOnWillDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForKeyboardAvoidMode = value.keyboardAvoidMode;
    if (runtimeType(valueHolderForKeyboardAvoidMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForKeyboardAvoidModeTmpValue = valueHolderForKeyboardAvoidMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode>(valueHolderForKeyboardAvoidModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableHoverMode = value.enableHoverMode;
    if (runtimeType(valueHolderForEnableHoverMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableHoverModeTmpValue = valueHolderForEnableHoverMode.value;
        valueSerializer.writeBoolean(valueHolderForEnableHoverModeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHoverModeArea = value.hoverModeArea;
    if (runtimeType(valueHolderForHoverModeArea) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHoverModeAreaTmpValue = valueHolderForHoverModeArea.value;
        valueSerializer.writeCustomObject("object", valueHolderForHoverModeAreaTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyleOptions = value.backgroundBlurStyleOptions;
    if (runtimeType(valueHolderForBackgroundBlurStyleOptions) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleOptionsTmpValue = valueHolderForBackgroundBlurStyleOptions.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleOptionsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundEffect = value.backgroundEffect;
    if (runtimeType(valueHolderForBackgroundEffect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundEffectTmpValue = valueHolderForBackgroundEffect.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundEffectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForKeyboardAvoidDistance = value.keyboardAvoidDistance;
    if (runtimeType(valueHolderForKeyboardAvoidDistance) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForKeyboardAvoidDistanceTmpValue = valueHolderForKeyboardAvoidDistance.value;
        valueSerializer.writeCustomObject("object", valueHolderForKeyboardAvoidDistanceTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelMode = value.levelMode;
    if (runtimeType(valueHolderForLevelMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelModeTmpValue = valueHolderForLevelMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueHolderForLevelModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelUniqueId = value.levelUniqueId;
    if (runtimeType(valueHolderForLevelUniqueId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelUniqueIdTmpValue = valueHolderForLevelUniqueId.value;
        valueSerializer.writeNumber(valueHolderForLevelUniqueIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForImmersiveMode = value.immersiveMode;
    if (runtimeType(valueHolderForImmersiveMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForImmersiveModeTmpValue = valueHolderForImmersiveMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelOrder = value.levelOrder;
    if (runtimeType(valueHolderForLevelOrder) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelOrderTmpValue = valueHolderForLevelOrder.value;
        LevelOrder_serializer::write(valueSerializer, valueHolderForLevelOrderTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFocusable = value.focusable;
    if (runtimeType(valueHolderForFocusable) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFocusableTmpValue = valueHolderForFocusable.value;
        valueSerializer.writeBoolean(valueHolderForFocusableTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundColor = value.backgroundColor;
    if (runtimeType(valueHolderForBackgroundColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundColorTmpValue = valueHolderForBackgroundColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForCornerRadius = value.cornerRadius;
    if (runtimeType(valueHolderForCornerRadius) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForCornerRadiusTmpValue = valueHolderForCornerRadius.value;
        if (valueHolderForCornerRadiusTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForCornerRadiusTmpValueForIdx0 = valueHolderForCornerRadiusTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForCornerRadiusTmpValueForIdx0);
        } else if (valueHolderForCornerRadiusTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForCornerRadiusTmpValueForIdx1 = valueHolderForCornerRadiusTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForCornerRadiusTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForWidth = value.width;
    if (runtimeType(valueHolderForWidth) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForWidthTmpValue = valueHolderForWidth.value;
        valueSerializer.writeCustomObject("object", valueHolderForWidthTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHeight = value.height;
    if (runtimeType(valueHolderForHeight) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHeightTmpValue = valueHolderForHeight.value;
        valueSerializer.writeCustomObject("object", valueHolderForHeightTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBorderWidth = value.borderWidth;
    if (runtimeType(valueHolderForBorderWidth) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBorderWidthTmpValue = valueHolderForBorderWidth.value;
        if (valueHolderForBorderWidthTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBorderWidthTmpValueForIdx0 = valueHolderForBorderWidthTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForBorderWidthTmpValueForIdx0);
        } else if (valueHolderForBorderWidthTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBorderWidthTmpValueForIdx1 = valueHolderForBorderWidthTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForBorderWidthTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBorderColor = value.borderColor;
    if (runtimeType(valueHolderForBorderColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBorderColorTmpValue = valueHolderForBorderColor.value;
        if (valueHolderForBorderColorTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBorderColorTmpValueForIdx0 = valueHolderForBorderColorTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForBorderColorTmpValueForIdx0);
        } else if (valueHolderForBorderColorTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBorderColorTmpValueForIdx1 = valueHolderForBorderColorTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForBorderColorTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBorderStyle = value.borderStyle;
    if (runtimeType(valueHolderForBorderStyle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBorderStyleTmpValue = valueHolderForBorderStyle.value;
        if (valueHolderForBorderStyleTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBorderStyleTmpValueForIdx0 = valueHolderForBorderStyleTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForBorderStyleTmpValueForIdx0);
        } else if (valueHolderForBorderStyleTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBorderStyleTmpValueForIdx1 = valueHolderForBorderStyleTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForBorderStyleTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShadow = value.shadow;
    if (runtimeType(valueHolderForShadow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShadowTmpValue = valueHolderForShadow.value;
        if (valueHolderForShadowTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForShadowTmpValueForIdx0 = valueHolderForShadowTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx0);
        } else if (valueHolderForShadowTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForShadowTmpValueForIdx1 = valueHolderForShadowTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyle = value.backgroundBlurStyle;
    if (runtimeType(valueHolderForBackgroundBlurStyle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleTmpValue = valueHolderForBackgroundBlurStyle.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogOptions promptAction_DialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto autoCancelTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean autoCancelTmpBuf = {};
    autoCancelTmpBuf.tag = autoCancelTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((autoCancelTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        autoCancelTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.autoCancel = autoCancelTmpBuf;
    const auto transitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject transitionTmpBuf = {};
    transitionTmpBuf.tag = transitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((transitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        transitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.transition = transitionTmpBuf;
    const auto dialogTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject dialogTransitionTmpBuf = {};
    dialogTransitionTmpBuf.tag = dialogTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dialogTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dialogTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.dialogTransition = dialogTransitionTmpBuf;
    const auto maskTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskTransitionTmpBuf = {};
    maskTransitionTmpBuf.tag = maskTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskTransition = maskTransitionTmpBuf;
    const auto maskColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskColorTmpBuf = {};
    maskColorTmpBuf.tag = maskColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskColor = maskColorTmpBuf;
    const auto onWillDismissTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_DismissDialogAction_Void onWillDismissTmpBuf = {};
    onWillDismissTmpBuf.tag = onWillDismissTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDismissTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDismissTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))))};
    }
    value.onWillDismiss = onWillDismissTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto keyboardAvoidModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_KeyboardAvoidMode keyboardAvoidModeTmpBuf = {};
    keyboardAvoidModeTmpBuf.tag = keyboardAvoidModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode>(valueDeserializer.readInt32());
    }
    value.keyboardAvoidMode = keyboardAvoidModeTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto keyboardAvoidDistanceTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject keyboardAvoidDistanceTmpBuf = {};
    keyboardAvoidDistanceTmpBuf.tag = keyboardAvoidDistanceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidDistanceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidDistanceTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.keyboardAvoidDistance = keyboardAvoidDistanceTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    const auto focusableTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean focusableTmpBuf = {};
    focusableTmpBuf.tag = focusableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((focusableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        focusableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.focusable = focusableTmpBuf;
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto cornerRadiusTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsCornerRadius cornerRadiusTmpBuf = {};
    cornerRadiusTmpBuf.tag = cornerRadiusTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((cornerRadiusTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 cornerRadiusTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_DialogOptionsCornerRadius cornerRadiusTmpBuf_ = {};
        cornerRadiusTmpBuf_.selector = cornerRadiusTmpBuf_UnionSelector;
        if (cornerRadiusTmpBuf_UnionSelector == 0) {
            cornerRadiusTmpBuf_.selector = 0;
            cornerRadiusTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (cornerRadiusTmpBuf_UnionSelector == 1) {
            cornerRadiusTmpBuf_.selector = 1;
            cornerRadiusTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for cornerRadiusTmpBuf_ has to be chosen through deserialisation.");
        }
        cornerRadiusTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_DialogOptionsCornerRadius>(cornerRadiusTmpBuf_);
    }
    value.cornerRadius = cornerRadiusTmpBuf;
    const auto widthTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject widthTmpBuf = {};
    widthTmpBuf.tag = widthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((widthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        widthTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.width = widthTmpBuf;
    const auto heightTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject heightTmpBuf = {};
    heightTmpBuf.tag = heightTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((heightTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        heightTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.height = heightTmpBuf;
    const auto borderWidthTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsBorderWidth borderWidthTmpBuf = {};
    borderWidthTmpBuf.tag = borderWidthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderWidthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderWidthTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderWidth borderWidthTmpBuf_ = {};
        borderWidthTmpBuf_.selector = borderWidthTmpBuf_UnionSelector;
        if (borderWidthTmpBuf_UnionSelector == 0) {
            borderWidthTmpBuf_.selector = 0;
            borderWidthTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (borderWidthTmpBuf_UnionSelector == 1) {
            borderWidthTmpBuf_.selector = 1;
            borderWidthTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for borderWidthTmpBuf_ has to be chosen through deserialisation.");
        }
        borderWidthTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderWidth>(borderWidthTmpBuf_);
    }
    value.borderWidth = borderWidthTmpBuf;
    const auto borderColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsBorderColor borderColorTmpBuf = {};
    borderColorTmpBuf.tag = borderColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderColorTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderColor borderColorTmpBuf_ = {};
        borderColorTmpBuf_.selector = borderColorTmpBuf_UnionSelector;
        if (borderColorTmpBuf_UnionSelector == 0) {
            borderColorTmpBuf_.selector = 0;
            borderColorTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (borderColorTmpBuf_UnionSelector == 1) {
            borderColorTmpBuf_.selector = 1;
            borderColorTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for borderColorTmpBuf_ has to be chosen through deserialisation.");
        }
        borderColorTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderColor>(borderColorTmpBuf_);
    }
    value.borderColor = borderColorTmpBuf;
    const auto borderStyleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsBorderStyle borderStyleTmpBuf = {};
    borderStyleTmpBuf.tag = borderStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderStyleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderStyle borderStyleTmpBuf_ = {};
        borderStyleTmpBuf_.selector = borderStyleTmpBuf_UnionSelector;
        if (borderStyleTmpBuf_UnionSelector == 0) {
            borderStyleTmpBuf_.selector = 0;
            borderStyleTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (borderStyleTmpBuf_UnionSelector == 1) {
            borderStyleTmpBuf_.selector = 1;
            borderStyleTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for borderStyleTmpBuf_ has to be chosen through deserialisation.");
        }
        borderStyleTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_DialogOptionsBorderStyle>(borderStyleTmpBuf_);
    }
    value.borderStyle = borderStyleTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsShadow shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_DialogOptionsShadow shadowTmpBuf_ = {};
        shadowTmpBuf_.selector = shadowTmpBuf_UnionSelector;
        if (shadowTmpBuf_UnionSelector == 0) {
            shadowTmpBuf_.selector = 0;
            shadowTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (shadowTmpBuf_UnionSelector == 1) {
            shadowTmpBuf_.selector = 1;
            shadowTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for shadowTmpBuf_ has to be chosen through deserialisation.");
        }
        shadowTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_DialogOptionsShadow>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    return value;
}
inline void router_EnableAlertOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForMessage = value.message;
    valueSerializer.writeString(valueHolderForMessage);
}
inline OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions router_EnableAlertOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.message = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void router_NamedRouterOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForName = value.name;
    valueSerializer.writeString(valueHolderForName);
    const auto valueHolderForParams = value.params;
    if (runtimeType(valueHolderForParams) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForParamsTmpValue = valueHolderForParams.value;
        valueSerializer.writeObject(valueHolderForParamsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForRecoverable = value.recoverable;
    if (runtimeType(valueHolderForRecoverable) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForRecoverableTmpValue = valueHolderForRecoverable.value;
        valueSerializer.writeBoolean(valueHolderForRecoverableTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions router_NamedRouterOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.name = static_cast<OH_String>(valueDeserializer.readString());
    const auto paramsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Object paramsTmpBuf = {};
    paramsTmpBuf.tag = paramsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((paramsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        paramsTmpBuf.value = static_cast<OH_Object>(valueDeserializer.readObject());
    }
    value.params = paramsTmpBuf;
    const auto recoverableTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean recoverableTmpBuf = {};
    recoverableTmpBuf.tag = recoverableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((recoverableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        recoverableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.recoverable = recoverableTmpBuf;
    return value;
}
inline void router_RouterOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForUrl = value.url;
    valueSerializer.writeString(valueHolderForUrl);
    const auto valueHolderForParams = value.params;
    if (runtimeType(valueHolderForParams) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForParamsTmpValue = valueHolderForParams.value;
        valueSerializer.writeObject(valueHolderForParamsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForRecoverable = value.recoverable;
    if (runtimeType(valueHolderForRecoverable) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForRecoverableTmpValue = valueHolderForRecoverable.value;
        valueSerializer.writeBoolean(valueHolderForRecoverableTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions router_RouterOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.url = static_cast<OH_String>(valueDeserializer.readString());
    const auto paramsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Object paramsTmpBuf = {};
    paramsTmpBuf.tag = paramsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((paramsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        paramsTmpBuf.value = static_cast<OH_Object>(valueDeserializer.readObject());
    }
    value.params = paramsTmpBuf;
    const auto recoverableTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean recoverableTmpBuf = {};
    recoverableTmpBuf.tag = recoverableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((recoverableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        recoverableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.recoverable = recoverableTmpBuf;
    return value;
}
inline void router_RouterState_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_router_RouterState value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
    const auto valueHolderForName = value.name;
    valueSerializer.writeString(valueHolderForName);
    const auto valueHolderForPath = value.path;
    valueSerializer.writeString(valueHolderForPath);
    const auto valueHolderForParams = value.params;
    valueSerializer.writeObject(valueHolderForParams);
}
inline OH_OHOS_ARKUI_UICONTEXT_router_RouterState router_RouterState_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_router_RouterState value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.name = static_cast<OH_String>(valueDeserializer.readString());
    value.path = static_cast<OH_String>(valueDeserializer.readString());
    value.params = static_cast<OH_Object>(valueDeserializer.readObject());
    return value;
}
inline void uiObserver_NavDestinationInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForNavigationId = value.navigationId;
    valueSerializer.writeCustomObject("object", valueHolderForNavigationId);
    const auto valueHolderForName = value.name;
    valueSerializer.writeCustomObject("object", valueHolderForName);
    const auto valueHolderForState = value.state;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationState>(valueHolderForState));
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
    const auto valueHolderForParam = value.param;
    if (runtimeType(valueHolderForParam) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForParamTmpValue = valueHolderForParam.value;
        valueSerializer.writeObject(valueHolderForParamTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForNavDestinationId = value.navDestinationId;
    valueSerializer.writeString(valueHolderForNavDestinationId);
    const auto valueHolderForUniqueId = value.uniqueId;
    if (runtimeType(valueHolderForUniqueId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForUniqueIdTmpValue = valueHolderForUniqueId.value;
        valueSerializer.writeNumber(valueHolderForUniqueIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMode = value.mode;
    if (runtimeType(valueHolderForMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForModeTmpValue = valueHolderForMode.value;
        valueSerializer.writeCustomObject("object", valueHolderForModeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo uiObserver_NavDestinationInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.navigationId = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.name = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.state = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationState>(valueDeserializer.readInt32());
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    const auto paramTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Object paramTmpBuf = {};
    paramTmpBuf.tag = paramTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((paramTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        paramTmpBuf.value = static_cast<OH_Object>(valueDeserializer.readObject());
    }
    value.param = paramTmpBuf;
    value.navDestinationId = static_cast<OH_String>(valueDeserializer.readString());
    const auto uniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number uniqueIdTmpBuf = {};
    uniqueIdTmpBuf.tag = uniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((uniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        uniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.uniqueId = uniqueIdTmpBuf;
    const auto modeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject modeTmpBuf = {};
    modeTmpBuf.tag = modeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((modeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        modeTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.mode = modeTmpBuf;
    return value;
}
inline void uiObserver_NavigationInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavigationInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForNavigationId = value.navigationId;
    valueSerializer.writeString(valueHolderForNavigationId);
    const auto valueHolderForPathStack = value.pathStack;
    valueSerializer.writeCustomObject("object", valueHolderForPathStack);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavigationInfo uiObserver_NavigationInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavigationInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.navigationId = static_cast<OH_String>(valueDeserializer.readString());
    value.pathStack = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    return value;
}
inline void uiObserver_ObserverOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    valueSerializer.writeString(valueHolderForId);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions uiObserver_ObserverOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.id = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void uiObserver_RouterPageInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo uiObserver_RouterPageInfo_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo>(ptr);
}
inline void uiObserver_ScrollEventInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    valueSerializer.writeString(valueHolderForId);
    const auto valueHolderForUniqueId = value.uniqueId;
    valueSerializer.writeNumber(valueHolderForUniqueId);
    const auto valueHolderForScrollEvent = value.scrollEvent;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventType>(valueHolderForScrollEvent));
    const auto valueHolderForOffset = value.offset;
    valueSerializer.writeNumber(valueHolderForOffset);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo uiObserver_ScrollEventInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.id = static_cast<OH_String>(valueDeserializer.readString());
    value.uniqueId = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.scrollEvent = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventType>(valueDeserializer.readInt32());
    value.offset = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void uiObserver_TabContentInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForTabContentId = value.tabContentId;
    valueSerializer.writeString(valueHolderForTabContentId);
    const auto valueHolderForTabContentUniqueId = value.tabContentUniqueId;
    valueSerializer.writeNumber(valueHolderForTabContentUniqueId);
    const auto valueHolderForState = value.state;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentState>(valueHolderForState));
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
    const auto valueHolderForId = value.id;
    valueSerializer.writeString(valueHolderForId);
    const auto valueHolderForUniqueId = value.uniqueId;
    valueSerializer.writeNumber(valueHolderForUniqueId);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo uiObserver_TabContentInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.tabContentId = static_cast<OH_String>(valueDeserializer.readString());
    value.tabContentUniqueId = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.state = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentState>(valueDeserializer.readInt32());
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.id = static_cast<OH_String>(valueDeserializer.readString());
    value.uniqueId = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void font_FontOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_font_FontOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForFamilyName = value.familyName;
    if (valueHolderForFamilyName.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForFamilyNameForIdx0 = valueHolderForFamilyName.value0;
        valueSerializer.writeString(valueHolderForFamilyNameForIdx0);
    } else if (valueHolderForFamilyName.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForFamilyNameForIdx1 = valueHolderForFamilyName.value1;
        valueSerializer.writeCustomObject("object", valueHolderForFamilyNameForIdx1);
    }
    const auto valueHolderForFamilySrc = value.familySrc;
    if (valueHolderForFamilySrc.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForFamilySrcForIdx0 = valueHolderForFamilySrc.value0;
        valueSerializer.writeString(valueHolderForFamilySrcForIdx0);
    } else if (valueHolderForFamilySrc.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForFamilySrcForIdx1 = valueHolderForFamilySrc.value1;
        valueSerializer.writeCustomObject("object", valueHolderForFamilySrcForIdx1);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_font_FontOptions font_FontOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_font_FontOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 familyNameTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource familyNameTmpBuf = {};
    familyNameTmpBuf.selector = familyNameTmpBufUnionSelector;
    if (familyNameTmpBufUnionSelector == 0) {
        familyNameTmpBuf.selector = 0;
        familyNameTmpBuf.value0 = static_cast<OH_String>(valueDeserializer.readString());
    } else if (familyNameTmpBufUnionSelector == 1) {
        familyNameTmpBuf.selector = 1;
        familyNameTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for familyNameTmpBuf has to be chosen through deserialisation.");
    }
    value.familyName = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(familyNameTmpBuf);
    const OH_Int8 familySrcTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource familySrcTmpBuf = {};
    familySrcTmpBuf.selector = familySrcTmpBufUnionSelector;
    if (familySrcTmpBufUnionSelector == 0) {
        familySrcTmpBuf.selector = 0;
        familySrcTmpBuf.value0 = static_cast<OH_String>(valueDeserializer.readString());
    } else if (familySrcTmpBufUnionSelector == 1) {
        familySrcTmpBuf.selector = 1;
        familySrcTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for familySrcTmpBuf has to be chosen through deserialisation.");
    }
    value.familySrc = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(familySrcTmpBuf);
    return value;
}
inline void MeasureOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_MeasureOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForTextContent = value.textContent;
    if (valueHolderForTextContent.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForTextContentForIdx0 = valueHolderForTextContent.value0;
        valueSerializer.writeString(valueHolderForTextContentForIdx0);
    } else if (valueHolderForTextContent.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForTextContentForIdx1 = valueHolderForTextContent.value1;
        valueSerializer.writeCustomObject("object", valueHolderForTextContentForIdx1);
    }
    const auto valueHolderForConstraintWidth = value.constraintWidth;
    if (runtimeType(valueHolderForConstraintWidth) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForConstraintWidthTmpValue = valueHolderForConstraintWidth.value;
        if (valueHolderForConstraintWidthTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForConstraintWidthTmpValueForIdx0 = valueHolderForConstraintWidthTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForConstraintWidthTmpValueForIdx0);
        } else if (valueHolderForConstraintWidthTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForConstraintWidthTmpValueForIdx1 = valueHolderForConstraintWidthTmpValue.value1;
            valueSerializer.writeString(valueHolderForConstraintWidthTmpValueForIdx1);
        } else if (valueHolderForConstraintWidthTmpValue.selector == 2) {
            valueSerializer.writeInt8(2);
            const auto valueHolderForConstraintWidthTmpValueForIdx2 = valueHolderForConstraintWidthTmpValue.value2;
            valueSerializer.writeCustomObject("object", valueHolderForConstraintWidthTmpValueForIdx2);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFontSize = value.fontSize;
    if (runtimeType(valueHolderForFontSize) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFontSizeTmpValue = valueHolderForFontSize.value;
        if (valueHolderForFontSizeTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForFontSizeTmpValueForIdx0 = valueHolderForFontSizeTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForFontSizeTmpValueForIdx0);
        } else if (valueHolderForFontSizeTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForFontSizeTmpValueForIdx1 = valueHolderForFontSizeTmpValue.value1;
            valueSerializer.writeString(valueHolderForFontSizeTmpValueForIdx1);
        } else if (valueHolderForFontSizeTmpValue.selector == 2) {
            valueSerializer.writeInt8(2);
            const auto valueHolderForFontSizeTmpValueForIdx2 = valueHolderForFontSizeTmpValue.value2;
            valueSerializer.writeCustomObject("object", valueHolderForFontSizeTmpValueForIdx2);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFontStyle = value.fontStyle;
    if (runtimeType(valueHolderForFontStyle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFontStyleTmpValue = valueHolderForFontStyle.value;
        if (valueHolderForFontStyleTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForFontStyleTmpValueForIdx0 = valueHolderForFontStyleTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForFontStyleTmpValueForIdx0);
        } else if (valueHolderForFontStyleTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForFontStyleTmpValueForIdx1 = valueHolderForFontStyleTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForFontStyleTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFontWeight = value.fontWeight;
    if (runtimeType(valueHolderForFontWeight) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFontWeightTmpValue = valueHolderForFontWeight.value;
        if (valueHolderForFontWeightTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForFontWeightTmpValueForIdx0 = valueHolderForFontWeightTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForFontWeightTmpValueForIdx0);
        } else if (valueHolderForFontWeightTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForFontWeightTmpValueForIdx1 = valueHolderForFontWeightTmpValue.value1;
            valueSerializer.writeString(valueHolderForFontWeightTmpValueForIdx1);
        } else if (valueHolderForFontWeightTmpValue.selector == 2) {
            valueSerializer.writeInt8(2);
            const auto valueHolderForFontWeightTmpValueForIdx2 = valueHolderForFontWeightTmpValue.value2;
            valueSerializer.writeCustomObject("object", valueHolderForFontWeightTmpValueForIdx2);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForFontFamily = value.fontFamily;
    if (runtimeType(valueHolderForFontFamily) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForFontFamilyTmpValue = valueHolderForFontFamily.value;
        if (valueHolderForFontFamilyTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForFontFamilyTmpValueForIdx0 = valueHolderForFontFamilyTmpValue.value0;
            valueSerializer.writeString(valueHolderForFontFamilyTmpValueForIdx0);
        } else if (valueHolderForFontFamilyTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForFontFamilyTmpValueForIdx1 = valueHolderForFontFamilyTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForFontFamilyTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLetterSpacing = value.letterSpacing;
    if (runtimeType(valueHolderForLetterSpacing) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLetterSpacingTmpValue = valueHolderForLetterSpacing.value;
        if (valueHolderForLetterSpacingTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForLetterSpacingTmpValueForIdx0 = valueHolderForLetterSpacingTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForLetterSpacingTmpValueForIdx0);
        } else if (valueHolderForLetterSpacingTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForLetterSpacingTmpValueForIdx1 = valueHolderForLetterSpacingTmpValue.value1;
            valueSerializer.writeString(valueHolderForLetterSpacingTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTextAlign = value.textAlign;
    if (runtimeType(valueHolderForTextAlign) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTextAlignTmpValue = valueHolderForTextAlign.value;
        if (valueHolderForTextAlignTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForTextAlignTmpValueForIdx0 = valueHolderForTextAlignTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForTextAlignTmpValueForIdx0);
        } else if (valueHolderForTextAlignTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForTextAlignTmpValueForIdx1 = valueHolderForTextAlignTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForTextAlignTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOverflow = value.overflow;
    if (runtimeType(valueHolderForOverflow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOverflowTmpValue = valueHolderForOverflow.value;
        if (valueHolderForOverflowTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForOverflowTmpValueForIdx0 = valueHolderForOverflowTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForOverflowTmpValueForIdx0);
        } else if (valueHolderForOverflowTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForOverflowTmpValueForIdx1 = valueHolderForOverflowTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForOverflowTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaxLines = value.maxLines;
    if (runtimeType(valueHolderForMaxLines) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaxLinesTmpValue = valueHolderForMaxLines.value;
        valueSerializer.writeNumber(valueHolderForMaxLinesTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLineHeight = value.lineHeight;
    if (runtimeType(valueHolderForLineHeight) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLineHeightTmpValue = valueHolderForLineHeight.value;
        if (valueHolderForLineHeightTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForLineHeightTmpValueForIdx0 = valueHolderForLineHeightTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForLineHeightTmpValueForIdx0);
        } else if (valueHolderForLineHeightTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForLineHeightTmpValueForIdx1 = valueHolderForLineHeightTmpValue.value1;
            valueSerializer.writeString(valueHolderForLineHeightTmpValueForIdx1);
        } else if (valueHolderForLineHeightTmpValue.selector == 2) {
            valueSerializer.writeInt8(2);
            const auto valueHolderForLineHeightTmpValueForIdx2 = valueHolderForLineHeightTmpValue.value2;
            valueSerializer.writeCustomObject("object", valueHolderForLineHeightTmpValueForIdx2);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBaselineOffset = value.baselineOffset;
    if (runtimeType(valueHolderForBaselineOffset) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBaselineOffsetTmpValue = valueHolderForBaselineOffset.value;
        if (valueHolderForBaselineOffsetTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBaselineOffsetTmpValueForIdx0 = valueHolderForBaselineOffsetTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForBaselineOffsetTmpValueForIdx0);
        } else if (valueHolderForBaselineOffsetTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBaselineOffsetTmpValueForIdx1 = valueHolderForBaselineOffsetTmpValue.value1;
            valueSerializer.writeString(valueHolderForBaselineOffsetTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTextCase = value.textCase;
    if (runtimeType(valueHolderForTextCase) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTextCaseTmpValue = valueHolderForTextCase.value;
        if (valueHolderForTextCaseTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForTextCaseTmpValueForIdx0 = valueHolderForTextCaseTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForTextCaseTmpValueForIdx0);
        } else if (valueHolderForTextCaseTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForTextCaseTmpValueForIdx1 = valueHolderForTextCaseTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForTextCaseTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTextIndent = value.textIndent;
    if (runtimeType(valueHolderForTextIndent) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTextIndentTmpValue = valueHolderForTextIndent.value;
        if (valueHolderForTextIndentTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForTextIndentTmpValueForIdx0 = valueHolderForTextIndentTmpValue.value0;
            valueSerializer.writeNumber(valueHolderForTextIndentTmpValueForIdx0);
        } else if (valueHolderForTextIndentTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForTextIndentTmpValueForIdx1 = valueHolderForTextIndentTmpValue.value1;
            valueSerializer.writeString(valueHolderForTextIndentTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForWordBreak = value.wordBreak;
    if (runtimeType(valueHolderForWordBreak) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForWordBreakTmpValue = valueHolderForWordBreak.value;
        valueSerializer.writeCustomObject("object", valueHolderForWordBreakTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_MeasureOptions MeasureOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_MeasureOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 textContentTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource textContentTmpBuf = {};
    textContentTmpBuf.selector = textContentTmpBufUnionSelector;
    if (textContentTmpBufUnionSelector == 0) {
        textContentTmpBuf.selector = 0;
        textContentTmpBuf.value0 = static_cast<OH_String>(valueDeserializer.readString());
    } else if (textContentTmpBufUnionSelector == 1) {
        textContentTmpBuf.selector = 1;
        textContentTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for textContentTmpBuf has to be chosen through deserialisation.");
    }
    value.textContent = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(textContentTmpBuf);
    const auto constraintWidthTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_String_Resource constraintWidthTmpBuf = {};
    constraintWidthTmpBuf.tag = constraintWidthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((constraintWidthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 constraintWidthTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource constraintWidthTmpBuf_ = {};
        constraintWidthTmpBuf_.selector = constraintWidthTmpBuf_UnionSelector;
        if (constraintWidthTmpBuf_UnionSelector == 0) {
            constraintWidthTmpBuf_.selector = 0;
            constraintWidthTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (constraintWidthTmpBuf_UnionSelector == 1) {
            constraintWidthTmpBuf_.selector = 1;
            constraintWidthTmpBuf_.value1 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (constraintWidthTmpBuf_UnionSelector == 2) {
            constraintWidthTmpBuf_.selector = 2;
            constraintWidthTmpBuf_.value2 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for constraintWidthTmpBuf_ has to be chosen through deserialisation.");
        }
        constraintWidthTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource>(constraintWidthTmpBuf_);
    }
    value.constraintWidth = constraintWidthTmpBuf;
    const auto fontSizeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_String_Resource fontSizeTmpBuf = {};
    fontSizeTmpBuf.tag = fontSizeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontSizeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 fontSizeTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource fontSizeTmpBuf_ = {};
        fontSizeTmpBuf_.selector = fontSizeTmpBuf_UnionSelector;
        if (fontSizeTmpBuf_UnionSelector == 0) {
            fontSizeTmpBuf_.selector = 0;
            fontSizeTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (fontSizeTmpBuf_UnionSelector == 1) {
            fontSizeTmpBuf_.selector = 1;
            fontSizeTmpBuf_.value1 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (fontSizeTmpBuf_UnionSelector == 2) {
            fontSizeTmpBuf_.selector = 2;
            fontSizeTmpBuf_.value2 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for fontSizeTmpBuf_ has to be chosen through deserialisation.");
        }
        fontSizeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource>(fontSizeTmpBuf_);
    }
    value.fontSize = fontSizeTmpBuf;
    const auto fontStyleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_FontStyle fontStyleTmpBuf = {};
    fontStyleTmpBuf.tag = fontStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 fontStyleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_FontStyle fontStyleTmpBuf_ = {};
        fontStyleTmpBuf_.selector = fontStyleTmpBuf_UnionSelector;
        if (fontStyleTmpBuf_UnionSelector == 0) {
            fontStyleTmpBuf_.selector = 0;
            fontStyleTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (fontStyleTmpBuf_UnionSelector == 1) {
            fontStyleTmpBuf_.selector = 1;
            fontStyleTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for fontStyleTmpBuf_ has to be chosen through deserialisation.");
        }
        fontStyleTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_FontStyle>(fontStyleTmpBuf_);
    }
    value.fontStyle = fontStyleTmpBuf;
    const auto fontWeightTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_String_FontWeight fontWeightTmpBuf = {};
    fontWeightTmpBuf.tag = fontWeightTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontWeightTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 fontWeightTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_FontWeight fontWeightTmpBuf_ = {};
        fontWeightTmpBuf_.selector = fontWeightTmpBuf_UnionSelector;
        if (fontWeightTmpBuf_UnionSelector == 0) {
            fontWeightTmpBuf_.selector = 0;
            fontWeightTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (fontWeightTmpBuf_UnionSelector == 1) {
            fontWeightTmpBuf_.selector = 1;
            fontWeightTmpBuf_.value1 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (fontWeightTmpBuf_UnionSelector == 2) {
            fontWeightTmpBuf_.selector = 2;
            fontWeightTmpBuf_.value2 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for fontWeightTmpBuf_ has to be chosen through deserialisation.");
        }
        fontWeightTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_FontWeight>(fontWeightTmpBuf_);
    }
    value.fontWeight = fontWeightTmpBuf;
    const auto fontFamilyTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Resource fontFamilyTmpBuf = {};
    fontFamilyTmpBuf.tag = fontFamilyTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((fontFamilyTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 fontFamilyTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource fontFamilyTmpBuf_ = {};
        fontFamilyTmpBuf_.selector = fontFamilyTmpBuf_UnionSelector;
        if (fontFamilyTmpBuf_UnionSelector == 0) {
            fontFamilyTmpBuf_.selector = 0;
            fontFamilyTmpBuf_.value0 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (fontFamilyTmpBuf_UnionSelector == 1) {
            fontFamilyTmpBuf_.selector = 1;
            fontFamilyTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for fontFamilyTmpBuf_ has to be chosen through deserialisation.");
        }
        fontFamilyTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(fontFamilyTmpBuf_);
    }
    value.fontFamily = fontFamilyTmpBuf;
    const auto letterSpacingTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_String letterSpacingTmpBuf = {};
    letterSpacingTmpBuf.tag = letterSpacingTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((letterSpacingTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 letterSpacingTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String letterSpacingTmpBuf_ = {};
        letterSpacingTmpBuf_.selector = letterSpacingTmpBuf_UnionSelector;
        if (letterSpacingTmpBuf_UnionSelector == 0) {
            letterSpacingTmpBuf_.selector = 0;
            letterSpacingTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (letterSpacingTmpBuf_UnionSelector == 1) {
            letterSpacingTmpBuf_.selector = 1;
            letterSpacingTmpBuf_.value1 = static_cast<OH_String>(valueDeserializer.readString());
        } else {
            INTEROP_FATAL("One of the branches for letterSpacingTmpBuf_ has to be chosen through deserialisation.");
        }
        letterSpacingTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String>(letterSpacingTmpBuf_);
    }
    value.letterSpacing = letterSpacingTmpBuf;
    const auto textAlignTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_TextAlign textAlignTmpBuf = {};
    textAlignTmpBuf.tag = textAlignTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((textAlignTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 textAlignTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextAlign textAlignTmpBuf_ = {};
        textAlignTmpBuf_.selector = textAlignTmpBuf_UnionSelector;
        if (textAlignTmpBuf_UnionSelector == 0) {
            textAlignTmpBuf_.selector = 0;
            textAlignTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (textAlignTmpBuf_UnionSelector == 1) {
            textAlignTmpBuf_.selector = 1;
            textAlignTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for textAlignTmpBuf_ has to be chosen through deserialisation.");
        }
        textAlignTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextAlign>(textAlignTmpBuf_);
    }
    value.textAlign = textAlignTmpBuf;
    const auto overflowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_TextOverflow overflowTmpBuf = {};
    overflowTmpBuf.tag = overflowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((overflowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 overflowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextOverflow overflowTmpBuf_ = {};
        overflowTmpBuf_.selector = overflowTmpBuf_UnionSelector;
        if (overflowTmpBuf_UnionSelector == 0) {
            overflowTmpBuf_.selector = 0;
            overflowTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (overflowTmpBuf_UnionSelector == 1) {
            overflowTmpBuf_.selector = 1;
            overflowTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for overflowTmpBuf_ has to be chosen through deserialisation.");
        }
        overflowTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextOverflow>(overflowTmpBuf_);
    }
    value.overflow = overflowTmpBuf;
    const auto maxLinesTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number maxLinesTmpBuf = {};
    maxLinesTmpBuf.tag = maxLinesTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maxLinesTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maxLinesTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.maxLines = maxLinesTmpBuf;
    const auto lineHeightTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_String_Resource lineHeightTmpBuf = {};
    lineHeightTmpBuf.tag = lineHeightTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((lineHeightTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 lineHeightTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource lineHeightTmpBuf_ = {};
        lineHeightTmpBuf_.selector = lineHeightTmpBuf_UnionSelector;
        if (lineHeightTmpBuf_UnionSelector == 0) {
            lineHeightTmpBuf_.selector = 0;
            lineHeightTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (lineHeightTmpBuf_UnionSelector == 1) {
            lineHeightTmpBuf_.selector = 1;
            lineHeightTmpBuf_.value1 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (lineHeightTmpBuf_UnionSelector == 2) {
            lineHeightTmpBuf_.selector = 2;
            lineHeightTmpBuf_.value2 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for lineHeightTmpBuf_ has to be chosen through deserialisation.");
        }
        lineHeightTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String_Resource>(lineHeightTmpBuf_);
    }
    value.lineHeight = lineHeightTmpBuf;
    const auto baselineOffsetTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_String baselineOffsetTmpBuf = {};
    baselineOffsetTmpBuf.tag = baselineOffsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((baselineOffsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 baselineOffsetTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String baselineOffsetTmpBuf_ = {};
        baselineOffsetTmpBuf_.selector = baselineOffsetTmpBuf_UnionSelector;
        if (baselineOffsetTmpBuf_UnionSelector == 0) {
            baselineOffsetTmpBuf_.selector = 0;
            baselineOffsetTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (baselineOffsetTmpBuf_UnionSelector == 1) {
            baselineOffsetTmpBuf_.selector = 1;
            baselineOffsetTmpBuf_.value1 = static_cast<OH_String>(valueDeserializer.readString());
        } else {
            INTEROP_FATAL("One of the branches for baselineOffsetTmpBuf_ has to be chosen through deserialisation.");
        }
        baselineOffsetTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String>(baselineOffsetTmpBuf_);
    }
    value.baselineOffset = baselineOffsetTmpBuf;
    const auto textCaseTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_TextCase textCaseTmpBuf = {};
    textCaseTmpBuf.tag = textCaseTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((textCaseTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 textCaseTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextCase textCaseTmpBuf_ = {};
        textCaseTmpBuf_.selector = textCaseTmpBuf_UnionSelector;
        if (textCaseTmpBuf_UnionSelector == 0) {
            textCaseTmpBuf_.selector = 0;
            textCaseTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (textCaseTmpBuf_UnionSelector == 1) {
            textCaseTmpBuf_.selector = 1;
            textCaseTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for textCaseTmpBuf_ has to be chosen through deserialisation.");
        }
        textCaseTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_TextCase>(textCaseTmpBuf_);
    }
    value.textCase = textCaseTmpBuf;
    const auto textIndentTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Number_String textIndentTmpBuf = {};
    textIndentTmpBuf.tag = textIndentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((textIndentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 textIndentTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String textIndentTmpBuf_ = {};
        textIndentTmpBuf_.selector = textIndentTmpBuf_UnionSelector;
        if (textIndentTmpBuf_UnionSelector == 0) {
            textIndentTmpBuf_.selector = 0;
            textIndentTmpBuf_.value0 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else if (textIndentTmpBuf_UnionSelector == 1) {
            textIndentTmpBuf_.selector = 1;
            textIndentTmpBuf_.value1 = static_cast<OH_String>(valueDeserializer.readString());
        } else {
            INTEROP_FATAL("One of the branches for textIndentTmpBuf_ has to be chosen through deserialisation.");
        }
        textIndentTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String>(textIndentTmpBuf_);
    }
    value.textIndent = textIndentTmpBuf;
    const auto wordBreakTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject wordBreakTmpBuf = {};
    wordBreakTmpBuf.tag = wordBreakTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((wordBreakTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        wordBreakTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.wordBreak = wordBreakTmpBuf;
    return value;
}
inline void PageInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_PageInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForRouterPageInfo = value.routerPageInfo;
    if (runtimeType(valueHolderForRouterPageInfo) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForRouterPageInfoTmpValue = valueHolderForRouterPageInfo.value;
        uiObserver_RouterPageInfo_serializer::write(valueSerializer, valueHolderForRouterPageInfoTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForNavDestinationInfo = value.navDestinationInfo;
    if (runtimeType(valueHolderForNavDestinationInfo) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForNavDestinationInfoTmpValue = valueHolderForNavDestinationInfo.value;
        uiObserver_NavDestinationInfo_serializer::write(valueSerializer, valueHolderForNavDestinationInfoTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_PageInfo PageInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_PageInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto routerPageInfoTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_uiObserver_RouterPageInfo routerPageInfoTmpBuf = {};
    routerPageInfoTmpBuf.tag = routerPageInfoTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((routerPageInfoTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        routerPageInfoTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo>(uiObserver_RouterPageInfo_serializer::read(valueDeserializer));
    }
    value.routerPageInfo = routerPageInfoTmpBuf;
    const auto navDestinationInfoTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_uiObserver_NavDestinationInfo navDestinationInfoTmpBuf = {};
    navDestinationInfoTmpBuf.tag = navDestinationInfoTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((navDestinationInfoTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        navDestinationInfoTmpBuf.value = uiObserver_NavDestinationInfo_serializer::read(valueDeserializer);
    }
    value.navDestinationInfo = navDestinationInfoTmpBuf;
    return value;
}
inline void promptAction_Button_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForText = value.text;
    if (valueHolderForText.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForTextForIdx0 = valueHolderForText.value0;
        valueSerializer.writeString(valueHolderForTextForIdx0);
    } else if (valueHolderForText.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForTextForIdx1 = valueHolderForText.value1;
        valueSerializer.writeCustomObject("object", valueHolderForTextForIdx1);
    }
    const auto valueHolderForColor = value.color;
    if (valueHolderForColor.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForColorForIdx0 = valueHolderForColor.value0;
        valueSerializer.writeString(valueHolderForColorForIdx0);
    } else if (valueHolderForColor.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForColorForIdx1 = valueHolderForColor.value1;
        valueSerializer.writeCustomObject("object", valueHolderForColorForIdx1);
    }
    const auto valueHolderForPrimary = value.primary;
    if (runtimeType(valueHolderForPrimary) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForPrimaryTmpValue = valueHolderForPrimary.value;
        valueSerializer.writeBoolean(valueHolderForPrimaryTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_Button promptAction_Button_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_Button value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 textTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource textTmpBuf = {};
    textTmpBuf.selector = textTmpBufUnionSelector;
    if (textTmpBufUnionSelector == 0) {
        textTmpBuf.selector = 0;
        textTmpBuf.value0 = static_cast<OH_String>(valueDeserializer.readString());
    } else if (textTmpBufUnionSelector == 1) {
        textTmpBuf.selector = 1;
        textTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for textTmpBuf has to be chosen through deserialisation.");
    }
    value.text = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(textTmpBuf);
    const OH_Int8 colorTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource colorTmpBuf = {};
    colorTmpBuf.selector = colorTmpBufUnionSelector;
    if (colorTmpBufUnionSelector == 0) {
        colorTmpBuf.selector = 0;
        colorTmpBuf.value0 = static_cast<OH_String>(valueDeserializer.readString());
    } else if (colorTmpBufUnionSelector == 1) {
        colorTmpBuf.selector = 1;
        colorTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for colorTmpBuf has to be chosen through deserialisation.");
    }
    value.color = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(colorTmpBuf);
    const auto primaryTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean primaryTmpBuf = {};
    primaryTmpBuf.tag = primaryTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((primaryTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        primaryTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.primary = primaryTmpBuf;
    return value;
}
inline void promptAction_ShowDialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForTitle = value.title;
    if (runtimeType(valueHolderForTitle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTitleTmpValue = valueHolderForTitle.value;
        if (valueHolderForTitleTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForTitleTmpValueForIdx0 = valueHolderForTitleTmpValue.value0;
            valueSerializer.writeString(valueHolderForTitleTmpValueForIdx0);
        } else if (valueHolderForTitleTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForTitleTmpValueForIdx1 = valueHolderForTitleTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForTitleTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMessage = value.message;
    if (runtimeType(valueHolderForMessage) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMessageTmpValue = valueHolderForMessage.value;
        if (valueHolderForMessageTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForMessageTmpValueForIdx0 = valueHolderForMessageTmpValue.value0;
            valueSerializer.writeString(valueHolderForMessageTmpValueForIdx0);
        } else if (valueHolderForMessageTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForMessageTmpValueForIdx1 = valueHolderForMessageTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForMessageTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForButtons = value.buttons;
    if (runtimeType(valueHolderForButtons) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForButtonsTmpValue = valueHolderForButtons.value;
        valueSerializer.writeInt32(valueHolderForButtonsTmpValue.length);
        for (int valueHolderForButtonsTmpValueCounterI = 0; valueHolderForButtonsTmpValueCounterI < valueHolderForButtonsTmpValue.length; valueHolderForButtonsTmpValueCounterI++) {
            const OH_OHOS_ARKUI_UICONTEXT_promptAction_Button valueHolderForButtonsTmpValueTmpElement = valueHolderForButtonsTmpValue.array[valueHolderForButtonsTmpValueCounterI];
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsTmpValueTmpElement);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForMaskRect = value.maskRect;
    if (runtimeType(valueHolderForMaskRect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForMaskRectTmpValue = valueHolderForMaskRect.value;
        valueSerializer.writeCustomObject("object", valueHolderForMaskRectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAlignment = value.alignment;
    if (runtimeType(valueHolderForAlignment) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAlignmentTmpValue = valueHolderForAlignment.value;
        valueSerializer.writeCustomObject("object", valueHolderForAlignmentTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOffset = value.offset;
    if (runtimeType(valueHolderForOffset) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOffsetTmpValue = valueHolderForOffset.value;
        valueSerializer.writeCustomObject("object", valueHolderForOffsetTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShowInSubWindow = value.showInSubWindow;
    if (runtimeType(valueHolderForShowInSubWindow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShowInSubWindowTmpValue = valueHolderForShowInSubWindow.value;
        valueSerializer.writeBoolean(valueHolderForShowInSubWindowTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsModal = value.isModal;
    if (runtimeType(valueHolderForIsModal) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsModalTmpValue = valueHolderForIsModal.value;
        valueSerializer.writeBoolean(valueHolderForIsModalTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundColor = value.backgroundColor;
    if (runtimeType(valueHolderForBackgroundColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundColorTmpValue = valueHolderForBackgroundColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyle = value.backgroundBlurStyle;
    if (runtimeType(valueHolderForBackgroundBlurStyle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleTmpValue = valueHolderForBackgroundBlurStyle.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyleOptions = value.backgroundBlurStyleOptions;
    if (runtimeType(valueHolderForBackgroundBlurStyleOptions) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleOptionsTmpValue = valueHolderForBackgroundBlurStyleOptions.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleOptionsTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundEffect = value.backgroundEffect;
    if (runtimeType(valueHolderForBackgroundEffect) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundEffectTmpValue = valueHolderForBackgroundEffect.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundEffectTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShadow = value.shadow;
    if (runtimeType(valueHolderForShadow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShadowTmpValue = valueHolderForShadow.value;
        if (valueHolderForShadowTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForShadowTmpValueForIdx0 = valueHolderForShadowTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx0);
        } else if (valueHolderForShadowTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForShadowTmpValueForIdx1 = valueHolderForShadowTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableHoverMode = value.enableHoverMode;
    if (runtimeType(valueHolderForEnableHoverMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableHoverModeTmpValue = valueHolderForEnableHoverMode.value;
        valueSerializer.writeBoolean(valueHolderForEnableHoverModeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHoverModeArea = value.hoverModeArea;
    if (runtimeType(valueHolderForHoverModeArea) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHoverModeAreaTmpValue = valueHolderForHoverModeArea.value;
        valueSerializer.writeCustomObject("object", valueHolderForHoverModeAreaTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidAppear = value.onDidAppear;
    if (runtimeType(valueHolderForOnDidAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidAppearTmpValue = valueHolderForOnDidAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnDidDisappear = value.onDidDisappear;
    if (runtimeType(valueHolderForOnDidDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnDidDisappearTmpValue = valueHolderForOnDidDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnDidDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnDidDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillAppear = value.onWillAppear;
    if (runtimeType(valueHolderForOnWillAppear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillAppearTmpValue = valueHolderForOnWillAppear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillAppearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillAppearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOnWillDisappear = value.onWillDisappear;
    if (runtimeType(valueHolderForOnWillDisappear) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOnWillDisappearTmpValue = valueHolderForOnWillDisappear.value;
        valueSerializer.writeCallbackResource(valueHolderForOnWillDisappearTmpValue.resource);
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.call));
        valueSerializer.writePointer(reinterpret_cast<OH_NativePointer>(valueHolderForOnWillDisappearTmpValue.callSync));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelMode = value.levelMode;
    if (runtimeType(valueHolderForLevelMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelModeTmpValue = valueHolderForLevelMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueHolderForLevelModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelUniqueId = value.levelUniqueId;
    if (runtimeType(valueHolderForLevelUniqueId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelUniqueIdTmpValue = valueHolderForLevelUniqueId.value;
        valueSerializer.writeNumber(valueHolderForLevelUniqueIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForImmersiveMode = value.immersiveMode;
    if (runtimeType(valueHolderForImmersiveMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForImmersiveModeTmpValue = valueHolderForImmersiveMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelOrder = value.levelOrder;
    if (runtimeType(valueHolderForLevelOrder) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelOrderTmpValue = valueHolderForLevelOrder.value;
        LevelOrder_serializer::write(valueSerializer, valueHolderForLevelOrderTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions promptAction_ShowDialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto titleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Resource titleTmpBuf = {};
    titleTmpBuf.tag = titleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((titleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 titleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource titleTmpBuf_ = {};
        titleTmpBuf_.selector = titleTmpBuf_UnionSelector;
        if (titleTmpBuf_UnionSelector == 0) {
            titleTmpBuf_.selector = 0;
            titleTmpBuf_.value0 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (titleTmpBuf_UnionSelector == 1) {
            titleTmpBuf_.selector = 1;
            titleTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for titleTmpBuf_ has to be chosen through deserialisation.");
        }
        titleTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(titleTmpBuf_);
    }
    value.title = titleTmpBuf;
    const auto messageTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Resource messageTmpBuf = {};
    messageTmpBuf.tag = messageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((messageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 messageTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource messageTmpBuf_ = {};
        messageTmpBuf_.selector = messageTmpBuf_UnionSelector;
        if (messageTmpBuf_UnionSelector == 0) {
            messageTmpBuf_.selector = 0;
            messageTmpBuf_.value0 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (messageTmpBuf_UnionSelector == 1) {
            messageTmpBuf_.selector = 1;
            messageTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for messageTmpBuf_ has to be chosen through deserialisation.");
        }
        messageTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(messageTmpBuf_);
    }
    value.message = messageTmpBuf;
    const auto buttonsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Array_promptAction_Button buttonsTmpBuf = {};
    buttonsTmpBuf.tag = buttonsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((buttonsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int32 buttonsTmpBuf_Length = valueDeserializer.readInt32();
        Array_promptAction_Button buttonsTmpBuf_ = {};
        valueDeserializer.resizeArray<std::decay<decltype(buttonsTmpBuf_)>::type,
        std::decay<decltype(*buttonsTmpBuf_.array)>::type>(&buttonsTmpBuf_, buttonsTmpBuf_Length);
        for (int buttonsTmpBuf_BufCounterI = 0; buttonsTmpBuf_BufCounterI < buttonsTmpBuf_Length; buttonsTmpBuf_BufCounterI++) {
            buttonsTmpBuf_.array[buttonsTmpBuf_BufCounterI] = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBuf.value = buttonsTmpBuf_;
    }
    value.buttons = buttonsTmpBuf;
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ShadowOptions_ShadowStyle shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle shadowTmpBuf_ = {};
        shadowTmpBuf_.selector = shadowTmpBuf_UnionSelector;
        if (shadowTmpBuf_UnionSelector == 0) {
            shadowTmpBuf_.selector = 0;
            shadowTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (shadowTmpBuf_UnionSelector == 1) {
            shadowTmpBuf_.selector = 1;
            shadowTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for shadowTmpBuf_ has to be chosen through deserialisation.");
        }
        shadowTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_ARKUI_UICONTEXT_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    return value;
}
inline void promptAction_ShowToastOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForMessage = value.message;
    if (valueHolderForMessage.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForMessageForIdx0 = valueHolderForMessage.value0;
        valueSerializer.writeString(valueHolderForMessageForIdx0);
    } else if (valueHolderForMessage.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForMessageForIdx1 = valueHolderForMessage.value1;
        valueSerializer.writeCustomObject("object", valueHolderForMessageForIdx1);
    }
    const auto valueHolderForDuration = value.duration;
    if (runtimeType(valueHolderForDuration) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForDurationTmpValue = valueHolderForDuration.value;
        valueSerializer.writeNumber(valueHolderForDurationTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBottom = value.bottom;
    if (runtimeType(valueHolderForBottom) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBottomTmpValue = valueHolderForBottom.value;
        if (valueHolderForBottomTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForBottomTmpValueForIdx0 = valueHolderForBottomTmpValue.value0;
            valueSerializer.writeString(valueHolderForBottomTmpValueForIdx0);
        } else if (valueHolderForBottomTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForBottomTmpValueForIdx1 = valueHolderForBottomTmpValue.value1;
            valueSerializer.writeNumber(valueHolderForBottomTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShowMode = value.showMode;
    if (runtimeType(valueHolderForShowMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShowModeTmpValue = valueHolderForShowMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ToastShowMode>(valueHolderForShowModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForAlignment = value.alignment;
    if (runtimeType(valueHolderForAlignment) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForAlignmentTmpValue = valueHolderForAlignment.value;
        valueSerializer.writeCustomObject("object", valueHolderForAlignmentTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForOffset = value.offset;
    if (runtimeType(valueHolderForOffset) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForOffsetTmpValue = valueHolderForOffset.value;
        valueSerializer.writeCustomObject("object", valueHolderForOffsetTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundColor = value.backgroundColor;
    if (runtimeType(valueHolderForBackgroundColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundColorTmpValue = valueHolderForBackgroundColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForTextColor = value.textColor;
    if (runtimeType(valueHolderForTextColor) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTextColorTmpValue = valueHolderForTextColor.value;
        valueSerializer.writeCustomObject("object", valueHolderForTextColorTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForBackgroundBlurStyle = value.backgroundBlurStyle;
    if (runtimeType(valueHolderForBackgroundBlurStyle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForBackgroundBlurStyleTmpValue = valueHolderForBackgroundBlurStyle.value;
        valueSerializer.writeCustomObject("object", valueHolderForBackgroundBlurStyleTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForShadow = value.shadow;
    if (runtimeType(valueHolderForShadow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShadowTmpValue = valueHolderForShadow.value;
        if (valueHolderForShadowTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForShadowTmpValueForIdx0 = valueHolderForShadowTmpValue.value0;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx0);
        } else if (valueHolderForShadowTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForShadowTmpValueForIdx1 = valueHolderForShadowTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForShadowTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForEnableHoverMode = value.enableHoverMode;
    if (runtimeType(valueHolderForEnableHoverMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForEnableHoverModeTmpValue = valueHolderForEnableHoverMode.value;
        valueSerializer.writeBoolean(valueHolderForEnableHoverModeTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForHoverModeArea = value.hoverModeArea;
    if (runtimeType(valueHolderForHoverModeArea) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForHoverModeAreaTmpValue = valueHolderForHoverModeArea.value;
        valueSerializer.writeCustomObject("object", valueHolderForHoverModeAreaTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions promptAction_ShowToastOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 messageTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource messageTmpBuf = {};
    messageTmpBuf.selector = messageTmpBufUnionSelector;
    if (messageTmpBufUnionSelector == 0) {
        messageTmpBuf.selector = 0;
        messageTmpBuf.value0 = static_cast<OH_String>(valueDeserializer.readString());
    } else if (messageTmpBufUnionSelector == 1) {
        messageTmpBuf.selector = 1;
        messageTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for messageTmpBuf has to be chosen through deserialisation.");
    }
    value.message = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(messageTmpBuf);
    const auto durationTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number durationTmpBuf = {};
    durationTmpBuf.tag = durationTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((durationTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        durationTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.duration = durationTmpBuf;
    const auto bottomTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Number bottomTmpBuf = {};
    bottomTmpBuf.tag = bottomTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((bottomTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 bottomTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_String_Number bottomTmpBuf_ = {};
        bottomTmpBuf_.selector = bottomTmpBuf_UnionSelector;
        if (bottomTmpBuf_UnionSelector == 0) {
            bottomTmpBuf_.selector = 0;
            bottomTmpBuf_.value0 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (bottomTmpBuf_UnionSelector == 1) {
            bottomTmpBuf_.selector = 1;
            bottomTmpBuf_.value1 = static_cast<OH_Number>(valueDeserializer.readNumber());
        } else {
            INTEROP_FATAL("One of the branches for bottomTmpBuf_ has to be chosen through deserialisation.");
        }
        bottomTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Number>(bottomTmpBuf_);
    }
    value.bottom = bottomTmpBuf;
    const auto showModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_promptAction_ToastShowMode showModeTmpBuf = {};
    showModeTmpBuf.tag = showModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ToastShowMode>(valueDeserializer.readInt32());
    }
    value.showMode = showModeTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto textColorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject textColorTmpBuf = {};
    textColorTmpBuf.tag = textColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((textColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        textColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.textColor = textColorTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ShadowOptions_ShadowStyle shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle shadowTmpBuf_ = {};
        shadowTmpBuf_.selector = shadowTmpBuf_UnionSelector;
        if (shadowTmpBuf_UnionSelector == 0) {
            shadowTmpBuf_.selector = 0;
            shadowTmpBuf_.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else if (shadowTmpBuf_UnionSelector == 1) {
            shadowTmpBuf_.selector = 1;
            shadowTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for shadowTmpBuf_ has to be chosen through deserialisation.");
        }
        shadowTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_ShadowOptions_ShadowStyle>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    return value;
}
inline void TargetInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_TargetInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    if (valueHolderForId.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForIdForIdx0 = valueHolderForId.value0;
        valueSerializer.writeString(valueHolderForIdForIdx0);
    } else if (valueHolderForId.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForIdForIdx1 = valueHolderForId.value1;
        valueSerializer.writeNumber(valueHolderForIdForIdx1);
    }
    const auto valueHolderForComponentId = value.componentId;
    if (runtimeType(valueHolderForComponentId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForComponentIdTmpValue = valueHolderForComponentId.value;
        valueSerializer.writeNumber(valueHolderForComponentIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_TargetInfo TargetInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_TargetInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 idTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_String_Number idTmpBuf = {};
    idTmpBuf.selector = idTmpBufUnionSelector;
    if (idTmpBufUnionSelector == 0) {
        idTmpBuf.selector = 0;
        idTmpBuf.value0 = static_cast<OH_String>(valueDeserializer.readString());
    } else if (idTmpBufUnionSelector == 1) {
        idTmpBuf.selector = 1;
        idTmpBuf.value1 = static_cast<OH_Number>(valueDeserializer.readNumber());
    } else {
        INTEROP_FATAL("One of the branches for idTmpBuf has to be chosen through deserialisation.");
    }
    value.id = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Number>(idTmpBuf);
    const auto componentIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number componentIdTmpBuf = {};
    componentIdTmpBuf.tag = componentIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((componentIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        componentIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.componentId = componentIdTmpBuf;
    return value;
}
inline void uiObserver_NavDestinationSwitchInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForContext = value.context;
    if (valueHolderForContext.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForContextForIdx0 = valueHolderForContext.value0;
        valueSerializer.writeCustomObject("object", valueHolderForContextForIdx0);
    } else if (valueHolderForContext.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForContextForIdx1 = valueHolderForContext.value1;
        UIContext_serializer::write(valueSerializer, valueHolderForContextForIdx1);
    }
    const auto valueHolderForFrom = value.from;
    if (valueHolderForFrom.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForFromForIdx0 = valueHolderForFrom.value0;
        uiObserver_NavDestinationInfo_serializer::write(valueSerializer, valueHolderForFromForIdx0);
    } else if (valueHolderForFrom.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForFromForIdx1 = valueHolderForFrom.value1;
        valueSerializer.writeCustomObject("object", valueHolderForFromForIdx1);
    }
    const auto valueHolderForTo = value.to;
    if (valueHolderForTo.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForToForIdx0 = valueHolderForTo.value0;
        uiObserver_NavDestinationInfo_serializer::write(valueSerializer, valueHolderForToForIdx0);
    } else if (valueHolderForTo.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForToForIdx1 = valueHolderForTo.value1;
        valueSerializer.writeCustomObject("object", valueHolderForToForIdx1);
    }
    const auto valueHolderForOperation = value.operation;
    valueSerializer.writeCustomObject("object", valueHolderForOperation);
}
inline OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo uiObserver_NavDestinationSwitchInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 contextTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_UIAbilityContext_UIContext contextTmpBuf = {};
    contextTmpBuf.selector = contextTmpBufUnionSelector;
    if (contextTmpBufUnionSelector == 0) {
        contextTmpBuf.selector = 0;
        contextTmpBuf.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else if (contextTmpBufUnionSelector == 1) {
        contextTmpBuf.selector = 1;
        contextTmpBuf.value1 = static_cast<OH_OHOS_ARKUI_UICONTEXT_UIContext>(UIContext_serializer::read(valueDeserializer));
    } else {
        INTEROP_FATAL("One of the branches for contextTmpBuf has to be chosen through deserialisation.");
    }
    value.context = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_UIAbilityContext_UIContext>(contextTmpBuf);
    const OH_Int8 fromTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar fromTmpBuf = {};
    fromTmpBuf.selector = fromTmpBufUnionSelector;
    if (fromTmpBufUnionSelector == 0) {
        fromTmpBuf.selector = 0;
        fromTmpBuf.value0 = uiObserver_NavDestinationInfo_serializer::read(valueDeserializer);
    } else if (fromTmpBufUnionSelector == 1) {
        fromTmpBuf.selector = 1;
        fromTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for fromTmpBuf has to be chosen through deserialisation.");
    }
    value.from = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar>(fromTmpBuf);
    const OH_Int8 toTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar toTmpBuf = {};
    toTmpBuf.selector = toTmpBufUnionSelector;
    if (toTmpBufUnionSelector == 0) {
        toTmpBuf.selector = 0;
        toTmpBuf.value0 = uiObserver_NavDestinationInfo_serializer::read(valueDeserializer);
    } else if (toTmpBufUnionSelector == 1) {
        toTmpBuf.selector = 1;
        toTmpBuf.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else {
        INTEROP_FATAL("One of the branches for toTmpBuf has to be chosen through deserialisation.");
    }
    value.to = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_NavDestinationInfo_NavBar>(toTmpBuf);
    value.operation = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    return value;
}
inline void promptAction_ActionMenuOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForTitle = value.title;
    if (runtimeType(valueHolderForTitle) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForTitleTmpValue = valueHolderForTitle.value;
        if (valueHolderForTitleTmpValue.selector == 0) {
            valueSerializer.writeInt8(0);
            const auto valueHolderForTitleTmpValueForIdx0 = valueHolderForTitleTmpValue.value0;
            valueSerializer.writeString(valueHolderForTitleTmpValueForIdx0);
        } else if (valueHolderForTitleTmpValue.selector == 1) {
            valueSerializer.writeInt8(1);
            const auto valueHolderForTitleTmpValueForIdx1 = valueHolderForTitleTmpValue.value1;
            valueSerializer.writeCustomObject("object", valueHolderForTitleTmpValueForIdx1);
        }
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForButtons = value.buttons;
    if (valueHolderForButtons.selector == 0) {
        valueSerializer.writeInt8(0);
        const auto valueHolderForButtonsForIdx0 = valueHolderForButtons.value0;
        const auto valueHolderForButtonsForIdx0_0 = valueHolderForButtonsForIdx0.value0;
        promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx0_0);
    } else if (valueHolderForButtons.selector == 1) {
        valueSerializer.writeInt8(1);
        const auto valueHolderForButtonsForIdx1 = valueHolderForButtons.value1;
        const auto valueHolderForButtonsForIdx1_0 = valueHolderForButtonsForIdx1.value0;
        promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx1_0);
        const auto valueHolderForButtonsForIdx1_1 = valueHolderForButtonsForIdx1.value1;
        if (runtimeType(valueHolderForButtonsForIdx1_1) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx1_1TmpValue = valueHolderForButtonsForIdx1_1.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx1_1TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
    } else if (valueHolderForButtons.selector == 2) {
        valueSerializer.writeInt8(2);
        const auto valueHolderForButtonsForIdx2 = valueHolderForButtons.value2;
        const auto valueHolderForButtonsForIdx2_0 = valueHolderForButtonsForIdx2.value0;
        promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx2_0);
        const auto valueHolderForButtonsForIdx2_1 = valueHolderForButtonsForIdx2.value1;
        if (runtimeType(valueHolderForButtonsForIdx2_1) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx2_1TmpValue = valueHolderForButtonsForIdx2_1.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx2_1TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx2_2 = valueHolderForButtonsForIdx2.value2;
        if (runtimeType(valueHolderForButtonsForIdx2_2) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx2_2TmpValue = valueHolderForButtonsForIdx2_2.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx2_2TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
    } else if (valueHolderForButtons.selector == 3) {
        valueSerializer.writeInt8(3);
        const auto valueHolderForButtonsForIdx3 = valueHolderForButtons.value3;
        const auto valueHolderForButtonsForIdx3_0 = valueHolderForButtonsForIdx3.value0;
        promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx3_0);
        const auto valueHolderForButtonsForIdx3_1 = valueHolderForButtonsForIdx3.value1;
        if (runtimeType(valueHolderForButtonsForIdx3_1) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx3_1TmpValue = valueHolderForButtonsForIdx3_1.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx3_1TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx3_2 = valueHolderForButtonsForIdx3.value2;
        if (runtimeType(valueHolderForButtonsForIdx3_2) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx3_2TmpValue = valueHolderForButtonsForIdx3_2.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx3_2TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx3_3 = valueHolderForButtonsForIdx3.value3;
        if (runtimeType(valueHolderForButtonsForIdx3_3) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx3_3TmpValue = valueHolderForButtonsForIdx3_3.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx3_3TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
    } else if (valueHolderForButtons.selector == 4) {
        valueSerializer.writeInt8(4);
        const auto valueHolderForButtonsForIdx4 = valueHolderForButtons.value4;
        const auto valueHolderForButtonsForIdx4_0 = valueHolderForButtonsForIdx4.value0;
        promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx4_0);
        const auto valueHolderForButtonsForIdx4_1 = valueHolderForButtonsForIdx4.value1;
        if (runtimeType(valueHolderForButtonsForIdx4_1) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx4_1TmpValue = valueHolderForButtonsForIdx4_1.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx4_1TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx4_2 = valueHolderForButtonsForIdx4.value2;
        if (runtimeType(valueHolderForButtonsForIdx4_2) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx4_2TmpValue = valueHolderForButtonsForIdx4_2.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx4_2TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx4_3 = valueHolderForButtonsForIdx4.value3;
        if (runtimeType(valueHolderForButtonsForIdx4_3) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx4_3TmpValue = valueHolderForButtonsForIdx4_3.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx4_3TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx4_4 = valueHolderForButtonsForIdx4.value4;
        if (runtimeType(valueHolderForButtonsForIdx4_4) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx4_4TmpValue = valueHolderForButtonsForIdx4_4.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx4_4TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
    } else if (valueHolderForButtons.selector == 5) {
        valueSerializer.writeInt8(5);
        const auto valueHolderForButtonsForIdx5 = valueHolderForButtons.value5;
        const auto valueHolderForButtonsForIdx5_0 = valueHolderForButtonsForIdx5.value0;
        promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx5_0);
        const auto valueHolderForButtonsForIdx5_1 = valueHolderForButtonsForIdx5.value1;
        if (runtimeType(valueHolderForButtonsForIdx5_1) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx5_1TmpValue = valueHolderForButtonsForIdx5_1.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx5_1TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx5_2 = valueHolderForButtonsForIdx5.value2;
        if (runtimeType(valueHolderForButtonsForIdx5_2) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx5_2TmpValue = valueHolderForButtonsForIdx5_2.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx5_2TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx5_3 = valueHolderForButtonsForIdx5.value3;
        if (runtimeType(valueHolderForButtonsForIdx5_3) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx5_3TmpValue = valueHolderForButtonsForIdx5_3.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx5_3TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx5_4 = valueHolderForButtonsForIdx5.value4;
        if (runtimeType(valueHolderForButtonsForIdx5_4) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx5_4TmpValue = valueHolderForButtonsForIdx5_4.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx5_4TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        const auto valueHolderForButtonsForIdx5_5 = valueHolderForButtonsForIdx5.value5;
        if (runtimeType(valueHolderForButtonsForIdx5_5) != INTEROP_RUNTIME_UNDEFINED) {
            valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto valueHolderForButtonsForIdx5_5TmpValue = valueHolderForButtonsForIdx5_5.value;
            promptAction_Button_serializer::write(valueSerializer, valueHolderForButtonsForIdx5_5TmpValue);
        } else {
            valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
    }
    const auto valueHolderForShowInSubWindow = value.showInSubWindow;
    if (runtimeType(valueHolderForShowInSubWindow) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForShowInSubWindowTmpValue = valueHolderForShowInSubWindow.value;
        valueSerializer.writeBoolean(valueHolderForShowInSubWindowTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForIsModal = value.isModal;
    if (runtimeType(valueHolderForIsModal) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForIsModalTmpValue = valueHolderForIsModal.value;
        valueSerializer.writeBoolean(valueHolderForIsModalTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelMode = value.levelMode;
    if (runtimeType(valueHolderForLevelMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelModeTmpValue = valueHolderForLevelMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueHolderForLevelModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForLevelUniqueId = value.levelUniqueId;
    if (runtimeType(valueHolderForLevelUniqueId) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForLevelUniqueIdTmpValue = valueHolderForLevelUniqueId.value;
        valueSerializer.writeNumber(valueHolderForLevelUniqueIdTmpValue);
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    const auto valueHolderForImmersiveMode = value.immersiveMode;
    if (runtimeType(valueHolderForImmersiveMode) != INTEROP_RUNTIME_UNDEFINED) {
        valueSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueHolderForImmersiveModeTmpValue = valueHolderForImmersiveMode.value;
        valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions promptAction_ActionMenuOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto titleTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Resource titleTmpBuf = {};
    titleTmpBuf.tag = titleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((titleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 titleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource titleTmpBuf_ = {};
        titleTmpBuf_.selector = titleTmpBuf_UnionSelector;
        if (titleTmpBuf_UnionSelector == 0) {
            titleTmpBuf_.selector = 0;
            titleTmpBuf_.value0 = static_cast<OH_String>(valueDeserializer.readString());
        } else if (titleTmpBuf_UnionSelector == 1) {
            titleTmpBuf_.selector = 1;
            titleTmpBuf_.value1 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for titleTmpBuf_ has to be chosen through deserialisation.");
        }
        titleTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_String_Resource>(titleTmpBuf_);
    }
    value.title = titleTmpBuf;
    const OH_Int8 buttonsTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_UICONTEXT_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons buttonsTmpBuf = {};
    buttonsTmpBuf.selector = buttonsTmpBufUnionSelector;
    if (buttonsTmpBufUnionSelector == 0) {
        buttonsTmpBuf.selector = 0;
        OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSingleButton buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        buttonsTmpBuf.value0 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 1) {
        buttonsTmpBuf.selector = 1;
        OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionDoubleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        buttonsTmpBuf.value1 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 2) {
        buttonsTmpBuf.selector = 2;
        OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionTripleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        buttonsTmpBuf.value2 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 3) {
        buttonsTmpBuf.selector = 3;
        OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuadrupleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        const auto buttonsTmpBufBufUValue3TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue3TempBuf = {};
        buttonsTmpBufBufUValue3TempBuf.tag = buttonsTmpBufBufUValue3TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue3TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue3TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value3 = buttonsTmpBufBufUValue3TempBuf;
        buttonsTmpBuf.value3 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 4) {
        buttonsTmpBuf.selector = 4;
        OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionQuintupleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        const auto buttonsTmpBufBufUValue3TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue3TempBuf = {};
        buttonsTmpBufBufUValue3TempBuf.tag = buttonsTmpBufBufUValue3TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue3TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue3TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value3 = buttonsTmpBufBufUValue3TempBuf;
        const auto buttonsTmpBufBufUValue4TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue4TempBuf = {};
        buttonsTmpBufBufUValue4TempBuf.tag = buttonsTmpBufBufUValue4TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue4TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue4TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value4 = buttonsTmpBufBufUValue4TempBuf;
        buttonsTmpBuf.value4 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 5) {
        buttonsTmpBuf.selector = 5;
        OH_OHOS_ARKUI_UICONTEXT_promptAction_PromptActionSextupleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        const auto buttonsTmpBufBufUValue3TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue3TempBuf = {};
        buttonsTmpBufBufUValue3TempBuf.tag = buttonsTmpBufBufUValue3TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue3TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue3TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value3 = buttonsTmpBufBufUValue3TempBuf;
        const auto buttonsTmpBufBufUValue4TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue4TempBuf = {};
        buttonsTmpBufBufUValue4TempBuf.tag = buttonsTmpBufBufUValue4TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue4TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue4TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value4 = buttonsTmpBufBufUValue4TempBuf;
        const auto buttonsTmpBufBufUValue5TempBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue5TempBuf = {};
        buttonsTmpBufBufUValue5TempBuf.tag = buttonsTmpBufBufUValue5TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue5TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue5TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value5 = buttonsTmpBufBufUValue5TempBuf;
        buttonsTmpBuf.value5 = buttonsTmpBufBufU;
    } else {
        INTEROP_FATAL("One of the branches for buttonsTmpBuf has to be chosen through deserialisation.");
    }
    value.buttons = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons>(buttonsTmpBuf);
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_ARKUI_UICONTEXT_API* GetOH_OHOS_ARKUI_UICONTEXT_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_ARKUI_UICONTEXT_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_ARKUI_UICONTEXT_APIKind::OH_OHOS_ARKUI_UICONTEXT_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_ComponentSnapshot_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->construct();
}
KOALA_INTEROP_DIRECT_0(ComponentSnapshot_construct, OH_NativePointer)
OH_NativePointer impl_ComponentSnapshot_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->destruct;
}
KOALA_INTEROP_DIRECT_0(ComponentSnapshot_getFinalizer, OH_NativePointer)
void impl_ComponentSnapshot_get0(OH_NativePointer thisPtr, const KStringPtr& id, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->get0(thisPtr, (const OH_String*) (&id), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_V4(ComponentSnapshot_get0, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_ComponentSnapshot_get1(KVMContext vmContext, OH_NativePointer thisPtr, const KStringPtr& id, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->get1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_String*) (&id), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(ComponentSnapshot_get1, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_ComponentSnapshot_createFromBuilder0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject builderValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        const auto delayValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Number delayValueTempTmpBuf = {};
        delayValueTempTmpBuf.tag = delayValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((delayValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            delayValueTempTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
        }
        Opt_Number delayValueTemp = delayValueTempTmpBuf;;
        const auto checkImageStatusValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean checkImageStatusValueTempTmpBuf = {};
        checkImageStatusValueTempTmpBuf.tag = checkImageStatusValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((checkImageStatusValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            checkImageStatusValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean checkImageStatusValueTemp = checkImageStatusValueTempTmpBuf;;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->createFromBuilder0(thisPtr, static_cast<OH_CustomObject*>(&builderValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp), static_cast<Opt_Number*>(&delayValueTemp), static_cast<Opt_Boolean*>(&checkImageStatusValueTemp), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(ComponentSnapshot_createFromBuilder0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_ComponentSnapshot_createFromBuilder1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject builderValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto delayValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Number delayValueTempTmpBuf = {};
        delayValueTempTmpBuf.tag = delayValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((delayValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            delayValueTempTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
        }
        Opt_Number delayValueTemp = delayValueTempTmpBuf;;
        const auto checkImageStatusValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean checkImageStatusValueTempTmpBuf = {};
        checkImageStatusValueTempTmpBuf.tag = checkImageStatusValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((checkImageStatusValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            checkImageStatusValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean checkImageStatusValueTemp = checkImageStatusValueTempTmpBuf;;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->createFromBuilder1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&builderValueTemp), static_cast<Opt_Number*>(&delayValueTemp), static_cast<Opt_Boolean*>(&checkImageStatusValueTemp), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(ComponentSnapshot_createFromBuilder1, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_ComponentSnapshot_getSync(OH_NativePointer thisPtr, const KStringPtr& id, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->getSync(thisPtr, (const OH_String*) (&id), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_4(ComponentSnapshot_getSync, OH_NativePointer, OH_NativePointer, KStringPtr, KSerializerBuffer, int32_t)
void impl_ComponentSnapshot_getWithUniqueId(KVMContext vmContext, OH_NativePointer thisPtr, KInteropNumber uniqueId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->getWithUniqueId(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, (const OH_Number*) (&uniqueId), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(ComponentSnapshot_getWithUniqueId, OH_NativePointer, KInteropNumber, KSerializerBuffer, int32_t)
OH_NativePointer impl_ComponentSnapshot_getSyncWithUniqueId(OH_NativePointer thisPtr, KInteropNumber uniqueId, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->getSyncWithUniqueId(thisPtr, (const OH_Number*) (&uniqueId), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_4(ComponentSnapshot_getSyncWithUniqueId, OH_NativePointer, OH_NativePointer, KInteropNumber, KSerializerBuffer, int32_t)
void impl_ComponentSnapshot_createFromComponent(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto delayValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Number delayValueTempTmpBuf = {};
        delayValueTempTmpBuf.tag = delayValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((delayValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            delayValueTempTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
        }
        Opt_Number delayValueTemp = delayValueTempTmpBuf;;
        const auto checkImageStatusValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean checkImageStatusValueTempTmpBuf = {};
        checkImageStatusValueTempTmpBuf.tag = checkImageStatusValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((checkImageStatusValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            checkImageStatusValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean checkImageStatusValueTemp = checkImageStatusValueTempTmpBuf;;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->createFromComponent(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<Opt_Number*>(&delayValueTemp), static_cast<Opt_Boolean*>(&checkImageStatusValueTemp), static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(ComponentSnapshot_createFromComponent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_ComponentSnapshot_getWithRange(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Boolean isStartRect) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 startValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity startValueTempTmpBuf = {};
        startValueTempTmpBuf.selector = startValueTempTmpBufUnionSelector;
        if (startValueTempTmpBufUnionSelector == 0) {
            startValueTempTmpBuf.selector = 0;
            startValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (startValueTempTmpBufUnionSelector == 1) {
            startValueTempTmpBuf.selector = 1;
            startValueTempTmpBuf.value1 = static_cast<OH_Number>(thisDeserializer.readNumber());
        } else {
            INTEROP_FATAL("One of the branches for startValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity startValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity>(startValueTempTmpBuf);;
        const OH_Int8 endValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity endValueTempTmpBuf = {};
        endValueTempTmpBuf.selector = endValueTempTmpBufUnionSelector;
        if (endValueTempTmpBufUnionSelector == 0) {
            endValueTempTmpBuf.selector = 0;
            endValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (endValueTempTmpBufUnionSelector == 1) {
            endValueTempTmpBuf.selector = 1;
            endValueTempTmpBuf.value1 = static_cast<OH_Number>(thisDeserializer.readNumber());
        } else {
            INTEROP_FATAL("One of the branches for endValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity endValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity>(endValueTempTmpBuf);;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_componentSnapshot_SnapshotOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = componentSnapshot_SnapshotOptions_serializer::read(thisDeserializer);
        }
        Opt_componentSnapshot_SnapshotOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentSnapshot()->getWithRange(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity*>(&startValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity*>(&endValueTemp), isStartRect, static_cast<Opt_componentSnapshot_SnapshotOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Image_PixelMap_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(ComponentSnapshot_getWithRange, OH_NativePointer, KSerializerBuffer, int32_t, OH_Boolean)
OH_NativePointer impl_ComponentUtils_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentUtils()->construct();
}
KOALA_INTEROP_DIRECT_0(ComponentUtils_construct, OH_NativePointer)
OH_NativePointer impl_ComponentUtils_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentUtils()->destruct;
}
KOALA_INTEROP_DIRECT_0(ComponentUtils_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_ComponentUtils_getRectangleById(OH_NativePointer thisPtr, const KStringPtr& id) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ComponentUtils()->getRectangleById(thisPtr, (const OH_String*) (&id));
        SerializerBase _retSerializer {};
        componentUtils_ComponentInfo_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(ComponentUtils_getRectangleById, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
OH_NativePointer impl_ContentCoverController_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ContentCoverController()->construct();
}
KOALA_INTEROP_DIRECT_0(ContentCoverController_construct, OH_NativePointer)
OH_NativePointer impl_ContentCoverController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ContentCoverController()->destruct;
}
KOALA_INTEROP_DIRECT_0(ContentCoverController_getFinalizer, OH_NativePointer)
void impl_ContentCoverController_update(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentCoverOptionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto partialUpdateValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean partialUpdateValueTempTmpBuf = {};
        partialUpdateValueTempTmpBuf.tag = partialUpdateValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((partialUpdateValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            partialUpdateValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean partialUpdateValueTemp = partialUpdateValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ContentCoverController()->update(thisPtr, static_cast<OH_CustomObject*>(&contentCoverOptionsValueTemp), static_cast<Opt_Boolean*>(&partialUpdateValueTemp));
}
KOALA_INTEROP_DIRECT_V3(ContentCoverController_update, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_ContentCoverController_close(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ContentCoverController()->close(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(ContentCoverController_close, OH_NativePointer)
OH_NativePointer impl_ContextMenuController_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ContextMenuController()->construct();
}
KOALA_INTEROP_DIRECT_0(ContextMenuController_construct, OH_NativePointer)
OH_NativePointer impl_ContextMenuController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ContextMenuController()->destruct;
}
KOALA_INTEROP_DIRECT_0(ContextMenuController_getFinalizer, OH_NativePointer)
void impl_ContextMenuController_close(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->ContextMenuController()->close(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(ContextMenuController_close, OH_NativePointer)
OH_NativePointer impl_CursorController_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CursorController()->construct();
}
KOALA_INTEROP_DIRECT_0(CursorController_construct, OH_NativePointer)
OH_NativePointer impl_CursorController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CursorController()->destruct;
}
KOALA_INTEROP_DIRECT_0(CursorController_getFinalizer, OH_NativePointer)
void impl_CursorController_restoreDefault(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CursorController()->restoreDefault(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(CursorController_restoreDefault, OH_NativePointer)
void impl_CursorController_setCursor(OH_NativePointer thisPtr, OH_Int32 value) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->CursorController()->setCursor(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_pointer_PointerStyle>(value));
}
KOALA_INTEROP_DIRECT_V2(CursorController_setCursor, OH_NativePointer, OH_Int32)
OH_NativePointer impl_DragController_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->construct();
}
KOALA_INTEROP_DIRECT_0(DragController_construct, OH_NativePointer)
OH_NativePointer impl_DragController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->destruct;
}
KOALA_INTEROP_DIRECT_0(DragController_getFinalizer, OH_NativePointer)
void impl_DragController_executeDrag0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 customValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo customValueTempTmpBuf = {};
        customValueTempTmpBuf.selector = customValueTempTmpBufUnionSelector;
        if (customValueTempTmpBufUnionSelector == 0) {
            customValueTempTmpBuf.selector = 0;
            customValueTempTmpBuf.value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else if (customValueTempTmpBufUnionSelector == 1) {
            customValueTempTmpBuf.selector = 1;
            customValueTempTmpBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for customValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo customValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo>(customValueTempTmpBuf);;
        OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo dragInfoValueTemp = dragController_DragInfo_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->executeDrag0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo*>(&customValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo*>(&dragInfoValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(DragController_executeDrag0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_DragController_executeDrag1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 customValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo customValueTempTmpBuf = {};
        customValueTempTmpBuf.selector = customValueTempTmpBufUnionSelector;
        if (customValueTempTmpBufUnionSelector == 0) {
            customValueTempTmpBuf.selector = 0;
            customValueTempTmpBuf.value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else if (customValueTempTmpBufUnionSelector == 1) {
            customValueTempTmpBuf.selector = 1;
            customValueTempTmpBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for customValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo customValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo>(customValueTempTmpBuf);;
        OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo dragInfoValueTemp = dragController_DragInfo_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_dragController_DragEventParam value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_dragController_DragEventParam value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->executeDrag1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo*>(&customValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo*>(&dragInfoValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(DragController_executeDrag1, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_DragController_createDragAction(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int32 customArrayValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_Union_CustomBuilder_DragItemInfo customArrayValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(customArrayValueTempTmpBuf)>::type,
        std::decay<decltype(*customArrayValueTempTmpBuf.array)>::type>(&customArrayValueTempTmpBuf, customArrayValueTempTmpBufLength);
        for (int customArrayValueTempTmpBufBufCounterI = 0; customArrayValueTempTmpBufBufCounterI < customArrayValueTempTmpBufLength; customArrayValueTempTmpBufBufCounterI++) {
            const OH_Int8 customArrayValueTempTmpBufTempBufUnionSelector = thisDeserializer.readInt8();
            OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo customArrayValueTempTmpBufTempBuf = {};
            customArrayValueTempTmpBufTempBuf.selector = customArrayValueTempTmpBufTempBufUnionSelector;
            if (customArrayValueTempTmpBufTempBufUnionSelector == 0) {
                customArrayValueTempTmpBufTempBuf.selector = 0;
                customArrayValueTempTmpBufTempBuf.value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
            } else if (customArrayValueTempTmpBufTempBufUnionSelector == 1) {
                customArrayValueTempTmpBufTempBuf.selector = 1;
                customArrayValueTempTmpBufTempBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
            } else {
                INTEROP_FATAL("One of the branches for customArrayValueTempTmpBufTempBuf has to be chosen through deserialisation.");
            }
            customArrayValueTempTmpBuf.array[customArrayValueTempTmpBufBufCounterI] = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_DragItemInfo>(customArrayValueTempTmpBufTempBuf);
        }
        Array_Union_CustomBuilder_DragItemInfo customArrayValueTemp = customArrayValueTempTmpBuf;;
        OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo dragInfoValueTemp = dragController_DragInfo_serializer::read(thisDeserializer);;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->createDragAction(thisPtr, static_cast<Array_Union_CustomBuilder_DragItemInfo*>(&customArrayValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_dragController_DragInfo*>(&dragInfoValueTemp));
}
KOALA_INTEROP_DIRECT_3(DragController_createDragAction, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_DragController_getDragPreview(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->getDragPreview(thisPtr);
}
KOALA_INTEROP_DIRECT_1(DragController_getDragPreview, OH_NativePointer, OH_NativePointer)
void impl_DragController_setDragEventStrictReportingEnabled(OH_NativePointer thisPtr, OH_Boolean enable) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->setDragEventStrictReportingEnabled(thisPtr, enable);
}
KOALA_INTEROP_DIRECT_V2(DragController_setDragEventStrictReportingEnabled, OH_NativePointer, OH_Boolean)
void impl_DragController_notifyDragStartRequest(OH_NativePointer thisPtr, OH_Int32 requestStatus) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->notifyDragStartRequest(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_dragController_DragStartRequestStatus>(requestStatus));
}
KOALA_INTEROP_DIRECT_V2(DragController_notifyDragStartRequest, OH_NativePointer, OH_Int32)
void impl_DragController_cancelDataLoading(OH_NativePointer thisPtr, const KStringPtr& key) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->cancelDataLoading(thisPtr, (const OH_String*) (&key));
}
KOALA_INTEROP_V2(DragController_cancelDataLoading, OH_NativePointer, KStringPtr)
void impl_DragController_enableDropDisallowedBadge(OH_NativePointer thisPtr, OH_Boolean enabled) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DragController()->enableDropDisallowedBadge(thisPtr, enabled);
}
KOALA_INTEROP_DIRECT_V2(DragController_enableDropDisallowedBadge, OH_NativePointer, OH_Boolean)
OH_NativePointer impl_DynamicSyncScene_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DynamicSyncScene()->construct();
}
KOALA_INTEROP_DIRECT_0(DynamicSyncScene_construct, OH_NativePointer)
OH_NativePointer impl_DynamicSyncScene_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DynamicSyncScene()->destruct;
}
KOALA_INTEROP_DIRECT_0(DynamicSyncScene_getFinalizer, OH_NativePointer)
void impl_DynamicSyncScene_setFrameRateRange(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject rangeValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DynamicSyncScene()->setFrameRateRange(thisPtr, static_cast<OH_CustomObject*>(&rangeValueTemp));
}
KOALA_INTEROP_DIRECT_V3(DynamicSyncScene_setFrameRateRange, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_DynamicSyncScene_getFrameRateRange(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->DynamicSyncScene()->getFrameRateRange(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(DynamicSyncScene_getFrameRateRange, OH_NativePointer)
OH_NativePointer impl_FocusController_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->construct();
}
KOALA_INTEROP_DIRECT_0(FocusController_construct, OH_NativePointer)
OH_NativePointer impl_FocusController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->destruct;
}
KOALA_INTEROP_DIRECT_0(FocusController_getFinalizer, OH_NativePointer)
void impl_FocusController_clearFocus(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->clearFocus(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(FocusController_clearFocus, OH_NativePointer)
void impl_FocusController_requestFocus(OH_NativePointer thisPtr, const KStringPtr& key) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->requestFocus(thisPtr, (const OH_String*) (&key));
}
KOALA_INTEROP_V2(FocusController_requestFocus, OH_NativePointer, KStringPtr)
void impl_FocusController_activate(OH_NativePointer thisPtr, OH_Boolean isActive, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto autoInactiveValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean autoInactiveValueTempTmpBuf = {};
        autoInactiveValueTempTmpBuf.tag = autoInactiveValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((autoInactiveValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            autoInactiveValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean autoInactiveValueTemp = autoInactiveValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->activate(thisPtr, isActive, static_cast<Opt_Boolean*>(&autoInactiveValueTemp));
}
KOALA_INTEROP_DIRECT_V4(FocusController_activate, OH_NativePointer, OH_Boolean, KSerializerBuffer, int32_t)
OH_Boolean impl_FocusController_isActive(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->isActive(thisPtr);
}
KOALA_INTEROP_DIRECT_1(FocusController_isActive, OH_Boolean, OH_NativePointer)
void impl_FocusController_setAutoFocusTransfer(OH_NativePointer thisPtr, OH_Boolean isAutoFocusTransfer) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->setAutoFocusTransfer(thisPtr, isAutoFocusTransfer);
}
KOALA_INTEROP_DIRECT_V2(FocusController_setAutoFocusTransfer, OH_NativePointer, OH_Boolean)
void impl_FocusController_setKeyProcessingMode(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject modeValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FocusController()->setKeyProcessingMode(thisPtr, static_cast<OH_CustomObject*>(&modeValueTemp));
}
KOALA_INTEROP_DIRECT_V3(FocusController_setKeyProcessingMode, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_Font_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Font()->construct();
}
KOALA_INTEROP_DIRECT_0(Font_construct, OH_NativePointer)
OH_NativePointer impl_Font_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Font()->destruct;
}
KOALA_INTEROP_DIRECT_0(Font_getFinalizer, OH_NativePointer)
void impl_Font_registerFont(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_font_FontOptions optionsValueTemp = font_FontOptions_serializer::read(thisDeserializer);;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Font()->registerFont(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_font_FontOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(Font_registerFont, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_Font_getSystemFontList(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Font()->getSystemFontList(thisPtr);
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_String retValueTmpElement = retValue.array[retValueCounterI];
            _retSerializer.writeString(retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(Font_getSystemFontList, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_Font_getFontByName(OH_NativePointer thisPtr, const KStringPtr& fontName) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Font()->getFontByName(thisPtr, (const OH_String*) (&fontName));
        SerializerBase _retSerializer {};
        font_FontInfo_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(Font_getFontByName, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
OH_NativePointer impl_FrameCallback_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FrameCallback()->construct();
}
KOALA_INTEROP_DIRECT_0(FrameCallback_construct, OH_NativePointer)
OH_NativePointer impl_FrameCallback_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FrameCallback()->destruct;
}
KOALA_INTEROP_DIRECT_0(FrameCallback_getFinalizer, OH_NativePointer)
void impl_FrameCallback_onFrame(OH_NativePointer thisPtr, KInteropNumber frameTimeInNano) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FrameCallback()->onFrame(thisPtr, (const OH_Number*) (&frameTimeInNano));
}
KOALA_INTEROP_DIRECT_V2(FrameCallback_onFrame, OH_NativePointer, KInteropNumber)
void impl_FrameCallback_onIdle(OH_NativePointer thisPtr, KInteropNumber timeLeftInNano) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->FrameCallback()->onIdle(thisPtr, (const OH_Number*) (&timeLeftInNano));
}
KOALA_INTEROP_DIRECT_V2(FrameCallback_onIdle, OH_NativePointer, KInteropNumber)
OH_NativePointer impl_MeasureUtils_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->MeasureUtils()->construct();
}
KOALA_INTEROP_DIRECT_0(MeasureUtils_construct, OH_NativePointer)
OH_NativePointer impl_MeasureUtils_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->MeasureUtils()->destruct;
}
KOALA_INTEROP_DIRECT_0(MeasureUtils_getFinalizer, OH_NativePointer)
OH_Number impl_MeasureUtils_measureText(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_MeasureOptions optionsValueTemp = MeasureOptions_serializer::read(thisDeserializer);;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->MeasureUtils()->measureText(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_MeasureOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_3(MeasureUtils_measureText, KInteropNumber, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_MeasureUtils_measureTextSize(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_MeasureOptions optionsValueTemp = MeasureOptions_serializer::read(thisDeserializer);;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->MeasureUtils()->measureTextSize(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_MeasureOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(MeasureUtils_measureTextSize, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_MediaQuery_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->MediaQuery()->construct();
}
KOALA_INTEROP_DIRECT_0(MediaQuery_construct, OH_NativePointer)
OH_NativePointer impl_MediaQuery_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->MediaQuery()->destruct;
}
KOALA_INTEROP_DIRECT_0(MediaQuery_getFinalizer, OH_NativePointer)
OH_NativePointer impl_MediaQuery_matchMediaSync(OH_NativePointer thisPtr, const KStringPtr& condition) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->MediaQuery()->matchMediaSync(thisPtr, (const OH_String*) (&condition));
}
KOALA_INTEROP_2(MediaQuery_matchMediaSync, OH_NativePointer, OH_NativePointer, KStringPtr)
OH_NativePointer impl_OverlayManager_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->construct();
}
KOALA_INTEROP_DIRECT_0(OverlayManager_construct, OH_NativePointer)
OH_NativePointer impl_OverlayManager_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->destruct;
}
KOALA_INTEROP_DIRECT_0(OverlayManager_getFinalizer, OH_NativePointer)
void impl_OverlayManager_addComponentContent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto indexValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Number indexValueTempTmpBuf = {};
        indexValueTempTmpBuf.tag = indexValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((indexValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            indexValueTempTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
        }
        Opt_Number indexValueTemp = indexValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->addComponentContent(thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<Opt_Number*>(&indexValueTemp));
}
KOALA_INTEROP_DIRECT_V3(OverlayManager_addComponentContent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_OverlayManager_addComponentContentWithOrder(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto levelOrderValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_LevelOrder levelOrderValueTempTmpBuf = {};
        levelOrderValueTempTmpBuf.tag = levelOrderValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((levelOrderValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            levelOrderValueTempTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_LevelOrder>(LevelOrder_serializer::read(thisDeserializer));
        }
        Opt_LevelOrder levelOrderValueTemp = levelOrderValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->addComponentContentWithOrder(thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<Opt_LevelOrder*>(&levelOrderValueTemp));
}
KOALA_INTEROP_DIRECT_V3(OverlayManager_addComponentContentWithOrder, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_OverlayManager_removeComponentContent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->removeComponentContent(thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp));
}
KOALA_INTEROP_DIRECT_V3(OverlayManager_removeComponentContent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_OverlayManager_showComponentContent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->showComponentContent(thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp));
}
KOALA_INTEROP_DIRECT_V3(OverlayManager_showComponentContent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_OverlayManager_hideComponentContent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->hideComponentContent(thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp));
}
KOALA_INTEROP_DIRECT_V3(OverlayManager_hideComponentContent, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_OverlayManager_showAllComponentContents(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->showAllComponentContents(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(OverlayManager_showAllComponentContents, OH_NativePointer)
void impl_OverlayManager_hideAllComponentContents(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->OverlayManager()->hideAllComponentContents(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(OverlayManager_hideAllComponentContents, OH_NativePointer)
OH_NativePointer impl_PromptAction_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->construct();
}
KOALA_INTEROP_DIRECT_0(PromptAction_construct, OH_NativePointer)
OH_NativePointer impl_PromptAction_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->destruct;
}
KOALA_INTEROP_DIRECT_0(PromptAction_getFinalizer, OH_NativePointer)
void impl_PromptAction_showToast(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions optionsValueTemp = promptAction_ShowToastOptions_serializer::read(thisDeserializer);;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->showToast(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(PromptAction_showToast, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_openToast(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions optionsValueTemp = promptAction_ShowToastOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Number_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Number_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->openToast(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowToastOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_openToast, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_closeToast(OH_NativePointer thisPtr, KInteropNumber toastId) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->closeToast(thisPtr, (const OH_Number*) (&toastId));
}
KOALA_INTEROP_DIRECT_V2(PromptAction_closeToast, OH_NativePointer, KInteropNumber)
void impl_PromptAction_showDialog0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions optionsValueTemp = promptAction_ShowDialogOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->showDialog0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(PromptAction_showDialog0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_showDialog1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions optionsValueTemp = promptAction_ShowDialogOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_promptAction_ShowDialogSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_promptAction_ShowDialogSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->showDialog1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ShowDialogOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_showDialog1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_showActionMenu0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions optionsValueTemp = promptAction_ActionMenuOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->showActionMenu0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(PromptAction_showActionMenu0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_showActionMenu1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions optionsValueTemp = promptAction_ActionMenuOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_promptAction_ActionMenuSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_promptAction_ActionMenuSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->showActionMenu1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_ActionMenuOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_showActionMenu1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_openCustomDialog0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject dialogContentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_promptAction_BaseDialogOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = promptAction_BaseDialogOptions_serializer::read(thisDeserializer);
        }
        Opt_promptAction_BaseDialogOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->openCustomDialog0(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&dialogContentValueTemp), static_cast<Opt_promptAction_BaseDialogOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_openCustomDialog0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_openCustomDialogWithController(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_NativePointer controller) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject dialogContentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_promptAction_BaseDialogOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = promptAction_BaseDialogOptions_serializer::read(thisDeserializer);
        }
        Opt_promptAction_BaseDialogOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->openCustomDialogWithController(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&dialogContentValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController>(controller), static_cast<Opt_promptAction_BaseDialogOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(PromptAction_openCustomDialogWithController, OH_NativePointer, KSerializerBuffer, int32_t, OH_NativePointer)
void impl_PromptAction_updateCustomDialog(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject dialogContentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions optionsValueTemp = promptAction_BaseDialogOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->updateCustomDialog(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&dialogContentValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_BaseDialogOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_updateCustomDialog, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_closeCustomDialog0(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject dialogContentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->closeCustomDialog0(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&dialogContentValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_closeCustomDialog0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_openCustomDialog1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions optionsValueTemp = promptAction_CustomDialogOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Number_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Number_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->openCustomDialog1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_CustomDialogOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_openCustomDialog1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_presentCustomDialog(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 builderValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT builderValueTempTmpBuf = {};
        builderValueTempTmpBuf.selector = builderValueTempTmpBufUnionSelector;
        if (builderValueTempTmpBufUnionSelector == 0) {
            builderValueTempTmpBuf.selector = 0;
            builderValueTempTmpBuf.value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else if (builderValueTempTmpBufUnionSelector == 1) {
            builderValueTempTmpBuf.selector = 1;
            builderValueTempTmpBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for builderValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT builderValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT>(builderValueTempTmpBuf);;
        const auto controllerValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_promptAction_DialogController controllerValueTempTmpBuf = {};
        controllerValueTempTmpBuf.tag = controllerValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((controllerValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            controllerValueTempTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_promptAction_DialogController>(promptAction_DialogController_serializer::read(thisDeserializer));
        }
        Opt_promptAction_DialogController controllerValueTemp = controllerValueTempTmpBuf;;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_promptAction_DialogOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = promptAction_DialogOptions_serializer::read(thisDeserializer);
        }
        Opt_promptAction_DialogOptions optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Number_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Number_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->presentCustomDialog(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_CustomBuilder_CustomBuilderT*>(&builderValueTemp), static_cast<Opt_promptAction_DialogController*>(&controllerValueTemp), static_cast<Opt_promptAction_DialogOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Number_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_presentCustomDialog, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_closeCustomDialog1(OH_NativePointer thisPtr, KInteropNumber dialogId) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->closeCustomDialog1(thisPtr, (const OH_Number*) (&dialogId));
}
KOALA_INTEROP_DIRECT_V2(PromptAction_closeCustomDialog1, OH_NativePointer, KInteropNumber)
OH_NativePointer impl_PromptAction_getTopOrder(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->getTopOrder(thisPtr);
}
KOALA_INTEROP_DIRECT_1(PromptAction_getTopOrder, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_PromptAction_getBottomOrder(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->getBottomOrder(thisPtr);
}
KOALA_INTEROP_DIRECT_1(PromptAction_getBottomOrder, OH_NativePointer, OH_NativePointer)
void impl_PromptAction_openPopup(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_OHOS_ARKUI_UICONTEXT_TargetInfo targetValueTemp = TargetInfo_serializer::read(thisDeserializer);;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_CustomObject optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        }
        Opt_CustomObject optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->openPopup(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_TargetInfo*>(&targetValueTemp), static_cast<Opt_CustomObject*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_openPopup, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_updatePopup(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject optionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto partialUpdateValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean partialUpdateValueTempTmpBuf = {};
        partialUpdateValueTempTmpBuf.tag = partialUpdateValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((partialUpdateValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            partialUpdateValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean partialUpdateValueTemp = partialUpdateValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->updatePopup(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<OH_CustomObject*>(&optionsValueTemp), static_cast<Opt_Boolean*>(&partialUpdateValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_updatePopup, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_closePopup(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->closePopup(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_closePopup, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_openMenu(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_OHOS_ARKUI_UICONTEXT_TargetInfo targetValueTemp = TargetInfo_serializer::read(thisDeserializer);;
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_CustomObject optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        }
        Opt_CustomObject optionsValueTemp = optionsValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->openMenu(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_TargetInfo*>(&targetValueTemp), static_cast<Opt_CustomObject*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_openMenu, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_updateMenu(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject optionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto partialUpdateValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean partialUpdateValueTempTmpBuf = {};
        partialUpdateValueTempTmpBuf.tag = partialUpdateValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((partialUpdateValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            partialUpdateValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean partialUpdateValueTemp = partialUpdateValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->updateMenu(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<OH_CustomObject*>(&optionsValueTemp), static_cast<Opt_Boolean*>(&partialUpdateValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_updateMenu, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_PromptAction_closeMenu(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->PromptAction()->closeMenu(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(PromptAction_closeMenu, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_Router_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->construct();
}
KOALA_INTEROP_DIRECT_0(Router_construct, OH_NativePointer)
OH_NativePointer impl_Router_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->destruct;
}
KOALA_INTEROP_DIRECT_0(Router_getFinalizer, OH_NativePointer)
void impl_Router_pushUrl0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushUrl0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(Router_pushUrl0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_pushUrl1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushUrl1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(Router_pushUrl1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_pushUrl2(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushUrl2(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(Router_pushUrl2, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
void impl_Router_pushUrl3(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushUrl3(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(Router_pushUrl3, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
void impl_Router_replaceUrl0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceUrl0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(Router_replaceUrl0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_replaceUrl1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceUrl1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(Router_replaceUrl1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_replaceUrl2(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceUrl2(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(Router_replaceUrl2, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
void impl_Router_replaceUrl3(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions optionsValueTemp = router_RouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceUrl3(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(Router_replaceUrl3, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
void impl_Router_back0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto optionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_router_RouterOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.tag = optionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((optionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            optionsValueTempTmpBuf.value = router_RouterOptions_serializer::read(thisDeserializer);
        }
        Opt_router_RouterOptions optionsValueTemp = optionsValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->back0(thisPtr, static_cast<Opt_router_RouterOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(Router_back0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_back1(OH_NativePointer thisPtr, KInteropNumber index, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto paramsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Object paramsValueTempTmpBuf = {};
        paramsValueTempTmpBuf.tag = paramsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((paramsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            paramsValueTempTmpBuf.value = static_cast<OH_Object>(thisDeserializer.readObject());
        }
        Opt_Object paramsValueTemp = paramsValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->back1(thisPtr, (const OH_Number*) (&index), static_cast<Opt_Object*>(&paramsValueTemp));
}
KOALA_INTEROP_DIRECT_V4(Router_back1, OH_NativePointer, KInteropNumber, KSerializerBuffer, int32_t)
void impl_Router_clear(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->clear(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(Router_clear, OH_NativePointer)
OH_String impl_Router_getLength(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->getLength(thisPtr);
}
KOALA_INTEROP_1(Router_getLength, KStringPtr, OH_NativePointer)
KInteropReturnBuffer impl_Router_getState(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->getState(thisPtr);
        SerializerBase _retSerializer {};
        router_RouterState_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(Router_getState, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_Router_getStateByIndex(OH_NativePointer thisPtr, KInteropNumber index) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->getStateByIndex(thisPtr, (const OH_Number*) (&index));
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            router_RouterState_serializer::write(_retSerializer, retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(Router_getStateByIndex, KInteropReturnBuffer, OH_NativePointer, KInteropNumber)
KInteropReturnBuffer impl_Router_getStateByUrl(OH_NativePointer thisPtr, const KStringPtr& url) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->getStateByUrl(thisPtr, (const OH_String*) (&url));
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_OHOS_ARKUI_UICONTEXT_router_RouterState retValueTmpElement = retValue.array[retValueCounterI];
            router_RouterState_serializer::write(_retSerializer, retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(Router_getStateByUrl, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
void impl_Router_showAlertBeforeBackPage(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions optionsValueTemp = router_EnableAlertOptions_serializer::read(thisDeserializer);;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->showAlertBeforeBackPage(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_EnableAlertOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(Router_showAlertBeforeBackPage, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_hideAlertBeforeBackPage(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->hideAlertBeforeBackPage(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(Router_hideAlertBeforeBackPage, OH_NativePointer)
void impl_Router_getParams(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->getParams(thisPtr);
}
KOALA_INTEROP_V1(Router_getParams, OH_NativePointer)
void impl_Router_pushNamedRoute0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushNamedRoute0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(Router_pushNamedRoute0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_pushNamedRoute1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushNamedRoute1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(Router_pushNamedRoute1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_pushNamedRoute2(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushNamedRoute2(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(Router_pushNamedRoute2, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
void impl_Router_pushNamedRoute3(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->pushNamedRoute3(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(Router_pushNamedRoute3, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
void impl_Router_replaceNamedRoute0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceNamedRoute0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(Router_replaceNamedRoute0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_replaceNamedRoute1(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceNamedRoute1(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(Router_replaceNamedRoute1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_Router_replaceNamedRoute2(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_AsyncCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_AsyncCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_AsyncCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceNamedRoute2(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_AsyncCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(Router_replaceNamedRoute2, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
void impl_Router_replaceNamedRoute3(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_Int32 mode) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions optionsValueTemp = router_NamedRouterOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->Router()->replaceNamedRoute3(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_router_NamedRouterOptions*>(&optionsValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_router_RouterMode>(mode), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(Router_replaceNamedRoute3, OH_NativePointer, KSerializerBuffer, int32_t, OH_Int32)
OH_NativePointer impl_TextMenuController_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->TextMenuController()->construct();
}
KOALA_INTEROP_DIRECT_0(TextMenuController_construct, OH_NativePointer)
OH_NativePointer impl_TextMenuController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->TextMenuController()->destruct;
}
KOALA_INTEROP_DIRECT_0(TextMenuController_getFinalizer, OH_NativePointer)
void impl_TextMenuController_setMenuOptions(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject optionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->TextMenuController()->setMenuOptions(thisPtr, static_cast<OH_CustomObject*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(TextMenuController_setMenuOptions, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_TextMenuController_disableSystemServiceMenuItems(OH_Boolean disable) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->TextMenuController()->disableSystemServiceMenuItems(disable);
}
KOALA_INTEROP_DIRECT_V1(TextMenuController_disableSystemServiceMenuItems, OH_Boolean)
OH_NativePointer impl_UIContext_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->construct();
}
KOALA_INTEROP_DIRECT_0(UIContext_construct, OH_NativePointer)
OH_NativePointer impl_UIContext_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->destruct;
}
KOALA_INTEROP_DIRECT_0(UIContext_getFinalizer, OH_NativePointer)
OH_NativePointer impl_UIContext_getFont(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getFont(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getFont, OH_NativePointer, OH_NativePointer)
OH_Boolean impl_UIContext_isAvailable(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->isAvailable(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_isAvailable, OH_Boolean, OH_NativePointer)
OH_NativePointer impl_UIContext_getMediaQuery(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getMediaQuery(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getMediaQuery, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getUIInspector(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getUIInspector(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getUIInspector, OH_NativePointer, OH_NativePointer)
OH_String impl_UIContext_getFilteredInspectorTree(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto filtersValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_String filtersValueTempTmpBuf = {};
        filtersValueTempTmpBuf.tag = filtersValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((filtersValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 filtersValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_String filtersValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(filtersValueTempTmpBuf_)>::type,
        std::decay<decltype(*filtersValueTempTmpBuf_.array)>::type>(&filtersValueTempTmpBuf_, filtersValueTempTmpBuf_Length);
            for (int filtersValueTempTmpBuf_BufCounterI = 0; filtersValueTempTmpBuf_BufCounterI < filtersValueTempTmpBuf_Length; filtersValueTempTmpBuf_BufCounterI++) {
                filtersValueTempTmpBuf_.array[filtersValueTempTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
            }
            filtersValueTempTmpBuf.value = filtersValueTempTmpBuf_;
        }
        Opt_Array_String filtersValueTemp = filtersValueTempTmpBuf;;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getFilteredInspectorTree(thisPtr, static_cast<Opt_Array_String*>(&filtersValueTemp));
}
KOALA_INTEROP_3(UIContext_getFilteredInspectorTree, KStringPtr, OH_NativePointer, KSerializerBuffer, int32_t)
OH_String impl_UIContext_getFilteredInspectorTreeById(OH_NativePointer thisPtr, const KStringPtr& id, KInteropNumber depth, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto filtersValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Array_String filtersValueTempTmpBuf = {};
        filtersValueTempTmpBuf.tag = filtersValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((filtersValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            const OH_Int32 filtersValueTempTmpBuf_Length = thisDeserializer.readInt32();
            Array_String filtersValueTempTmpBuf_ = {};
            thisDeserializer.resizeArray<std::decay<decltype(filtersValueTempTmpBuf_)>::type,
        std::decay<decltype(*filtersValueTempTmpBuf_.array)>::type>(&filtersValueTempTmpBuf_, filtersValueTempTmpBuf_Length);
            for (int filtersValueTempTmpBuf_BufCounterI = 0; filtersValueTempTmpBuf_BufCounterI < filtersValueTempTmpBuf_Length; filtersValueTempTmpBuf_BufCounterI++) {
                filtersValueTempTmpBuf_.array[filtersValueTempTmpBuf_BufCounterI] = static_cast<OH_String>(thisDeserializer.readString());
            }
            filtersValueTempTmpBuf.value = filtersValueTempTmpBuf_;
        }
        Opt_Array_String filtersValueTemp = filtersValueTempTmpBuf;;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getFilteredInspectorTreeById(thisPtr, (const OH_String*) (&id), (const OH_Number*) (&depth), static_cast<Opt_Array_String*>(&filtersValueTemp));
}
KOALA_INTEROP_5(UIContext_getFilteredInspectorTreeById, KStringPtr, OH_NativePointer, KStringPtr, KInteropNumber, KSerializerBuffer, int32_t)
OH_NativePointer impl_UIContext_getRouter(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getRouter(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getRouter, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getPromptAction(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getPromptAction(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getPromptAction, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getComponentUtils(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getComponentUtils(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getComponentUtils, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getUIObserver(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getUIObserver(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getUIObserver, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getOverlayManager(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getOverlayManager(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getOverlayManager, OH_NativePointer, OH_NativePointer)
OH_Boolean impl_UIContext_setOverlayManagerOptions(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions optionsValueTemp = OverlayManagerOptions_serializer::read(thisDeserializer);;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->setOverlayManagerOptions(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_OverlayManagerOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_3(UIContext_setOverlayManagerOptions, OH_Boolean, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_UIContext_getOverlayManagerOptions(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getOverlayManagerOptions(thisPtr);
        SerializerBase _retSerializer {};
        OverlayManagerOptions_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(UIContext_getOverlayManagerOptions, KInteropReturnBuffer, OH_NativePointer)
OH_NativePointer impl_UIContext_createAnimator(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 optionsValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.selector = optionsValueTempTmpBufUnionSelector;
        if (optionsValueTempTmpBufUnionSelector == 0) {
            optionsValueTempTmpBuf.selector = 0;
            optionsValueTempTmpBuf.value0 = AnimatorOptions_serializer::read(thisDeserializer);
        } else if (optionsValueTempTmpBufUnionSelector == 1) {
            optionsValueTempTmpBuf.selector = 1;
            optionsValueTempTmpBuf.value1 = static_cast<OH_OHOS_ARKUI_UICONTEXT_SimpleAnimatorOptions>(SimpleAnimatorOptions_serializer::read(thisDeserializer));
        } else {
            INTEROP_FATAL("One of the branches for optionsValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions optionsValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions>(optionsValueTempTmpBuf);;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->createAnimator(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_AnimatorOptions_SimpleAnimatorOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_3(UIContext_createAnimator, OH_NativePointer, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_animateTo(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_ARKUI_UICONTEXT_Callback_Void eventValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->animateTo(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Void*>(&eventValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_animateTo, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_showAlertDialog(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 optionsValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions optionsValueTempTmpBuf = {};
        optionsValueTempTmpBuf.selector = optionsValueTempTmpBufUnionSelector;
        if (optionsValueTempTmpBufUnionSelector == 0) {
            optionsValueTempTmpBuf.selector = 0;
            optionsValueTempTmpBuf.value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else if (optionsValueTempTmpBufUnionSelector == 1) {
            optionsValueTempTmpBuf.selector = 1;
            optionsValueTempTmpBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else if (optionsValueTempTmpBufUnionSelector == 2) {
            optionsValueTempTmpBuf.selector = 2;
            optionsValueTempTmpBuf.value2 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for optionsValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions optionsValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions>(optionsValueTempTmpBuf);;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->showAlertDialog(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_AlertDialogParamWithConfirm_AlertDialogParamWithButtons_AlertDialogParamWithOptions*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_showAlertDialog, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_showActionSheet(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->showActionSheet(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_showActionSheet, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_showDatePickerDialog(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject optionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->showDatePickerDialog(thisPtr, static_cast<OH_CustomObject*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_showDatePickerDialog, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_showTimePickerDialog(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject optionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->showTimePickerDialog(thisPtr, static_cast<OH_CustomObject*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_showTimePickerDialog, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_showTextPickerDialog(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject optionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->showTextPickerDialog(thisPtr, static_cast<OH_CustomObject*>(&optionsValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_showTextPickerDialog, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_runScopedTask(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->runScopedTask(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_runScopedTask, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_setKeyboardAvoidMode(OH_NativePointer thisPtr, OH_Int32 value) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->setKeyboardAvoidMode(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_KeyboardAvoidMode>(value));
}
KOALA_INTEROP_DIRECT_V2(UIContext_setKeyboardAvoidMode, OH_NativePointer, OH_Int32)
OH_Int32 impl_UIContext_getKeyboardAvoidMode(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getKeyboardAvoidMode(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getKeyboardAvoidMode, OH_Int32, OH_NativePointer)
void impl_UIContext_setPixelRoundMode(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject modeValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->setPixelRoundMode(thisPtr, static_cast<OH_CustomObject*>(&modeValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_setPixelRoundMode, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_getPixelRoundMode(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getPixelRoundMode(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(UIContext_getPixelRoundMode, OH_NativePointer)
OH_Boolean impl_UIContext_dispatchKeyEvent(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 nodeValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String nodeValueTempTmpBuf = {};
        nodeValueTempTmpBuf.selector = nodeValueTempTmpBufUnionSelector;
        if (nodeValueTempTmpBufUnionSelector == 0) {
            nodeValueTempTmpBuf.selector = 0;
            nodeValueTempTmpBuf.value0 = static_cast<OH_Number>(thisDeserializer.readNumber());
        } else if (nodeValueTempTmpBufUnionSelector == 1) {
            nodeValueTempTmpBuf.selector = 1;
            nodeValueTempTmpBuf.value1 = static_cast<OH_String>(thisDeserializer.readString());
        } else {
            INTEROP_FATAL("One of the branches for nodeValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_Union_Number_String nodeValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String>(nodeValueTempTmpBuf);;
        OH_CustomObject eventValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->dispatchKeyEvent(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Number_String*>(&nodeValueTemp), static_cast<OH_CustomObject*>(&eventValueTemp));
}
KOALA_INTEROP_DIRECT_3(UIContext_dispatchKeyEvent, OH_Boolean, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_getAtomicServiceBar(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getAtomicServiceBar(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(UIContext_getAtomicServiceBar, OH_NativePointer)
OH_NativePointer impl_UIContext_getDragController(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getDragController(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getDragController, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getMeasureUtils(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getMeasureUtils(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getMeasureUtils, OH_NativePointer, OH_NativePointer)
void impl_UIContext_keyframeAnimateTo(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject paramValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const OH_Int32 keyframesValueTempTmpBufLength = thisDeserializer.readInt32();
        Array_CustomObject keyframesValueTempTmpBuf = {};
        thisDeserializer.resizeArray<std::decay<decltype(keyframesValueTempTmpBuf)>::type,
        std::decay<decltype(*keyframesValueTempTmpBuf.array)>::type>(&keyframesValueTempTmpBuf, keyframesValueTempTmpBufLength);
        for (int keyframesValueTempTmpBufBufCounterI = 0; keyframesValueTempTmpBufBufCounterI < keyframesValueTempTmpBufLength; keyframesValueTempTmpBufBufCounterI++) {
            keyframesValueTempTmpBuf.array[keyframesValueTempTmpBufBufCounterI] = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        }
        Array_CustomObject keyframesValueTemp = keyframesValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->keyframeAnimateTo(thisPtr, static_cast<OH_CustomObject*>(&paramValueTemp), static_cast<Array_CustomObject*>(&keyframesValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_keyframeAnimateTo, OH_NativePointer, KSerializerBuffer, int32_t)
OH_NativePointer impl_UIContext_getFocusController(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getFocusController(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getFocusController, OH_NativePointer, OH_NativePointer)
void impl_UIContext_animateToImmediately(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject paramValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_ARKUI_UICONTEXT_Callback_Void eventValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->animateToImmediately(thisPtr, static_cast<OH_CustomObject*>(&paramValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Void*>(&eventValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_animateToImmediately, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_UIContext_getFrameNodeById(OH_NativePointer thisPtr, const KStringPtr& id) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getFrameNodeById(thisPtr, (const OH_String*) (&id));
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeCustomObject("object", retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(UIContext_getFrameNodeById, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
KInteropReturnBuffer impl_UIContext_getAttachedFrameNodeById(OH_NativePointer thisPtr, const KStringPtr& id) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getAttachedFrameNodeById(thisPtr, (const OH_String*) (&id));
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeCustomObject("object", retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(UIContext_getAttachedFrameNodeById, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
KInteropReturnBuffer impl_UIContext_getFrameNodeByUniqueId(OH_NativePointer thisPtr, KInteropNumber id) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getFrameNodeByUniqueId(thisPtr, (const OH_Number*) (&id));
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeCustomObject("object", retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(UIContext_getFrameNodeByUniqueId, KInteropReturnBuffer, OH_NativePointer, KInteropNumber)
KInteropReturnBuffer impl_UIContext_getPageInfoByUniqueId(OH_NativePointer thisPtr, KInteropNumber id) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getPageInfoByUniqueId(thisPtr, (const OH_Number*) (&id));
        SerializerBase _retSerializer {};
        PageInfo_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(UIContext_getPageInfoByUniqueId, KInteropReturnBuffer, OH_NativePointer, KInteropNumber)
KInteropReturnBuffer impl_UIContext_getNavigationInfoByUniqueId(OH_NativePointer thisPtr, KInteropNumber id) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getNavigationInfoByUniqueId(thisPtr, (const OH_Number*) (&id));
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            uiObserver_NavigationInfo_serializer::write(_retSerializer, retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(UIContext_getNavigationInfoByUniqueId, KInteropReturnBuffer, OH_NativePointer, KInteropNumber)
void impl_UIContext_setDynamicDimming(OH_NativePointer thisPtr, const KStringPtr& id, KInteropNumber value) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->setDynamicDimming(thisPtr, (const OH_String*) (&id), (const OH_Number*) (&value));
}
KOALA_INTEROP_V3(UIContext_setDynamicDimming, OH_NativePointer, KStringPtr, KInteropNumber)
OH_NativePointer impl_UIContext_getCursorController(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getCursorController(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getCursorController, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getContextMenuController(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getContextMenuController(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getContextMenuController, OH_NativePointer, OH_NativePointer)
OH_NativePointer impl_UIContext_getComponentSnapshot(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getComponentSnapshot(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getComponentSnapshot, OH_NativePointer, OH_NativePointer)
OH_Number impl_UIContext_vp2px(OH_NativePointer thisPtr, KInteropNumber value) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->vp2px(thisPtr, (const OH_Number*) (&value));
}
KOALA_INTEROP_DIRECT_2(UIContext_vp2px, KInteropNumber, OH_NativePointer, KInteropNumber)
OH_Number impl_UIContext_px2vp(OH_NativePointer thisPtr, KInteropNumber value) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->px2vp(thisPtr, (const OH_Number*) (&value));
}
KOALA_INTEROP_DIRECT_2(UIContext_px2vp, KInteropNumber, OH_NativePointer, KInteropNumber)
OH_Number impl_UIContext_fp2px(OH_NativePointer thisPtr, KInteropNumber value) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->fp2px(thisPtr, (const OH_Number*) (&value));
}
KOALA_INTEROP_DIRECT_2(UIContext_fp2px, KInteropNumber, OH_NativePointer, KInteropNumber)
OH_Number impl_UIContext_px2fp(OH_NativePointer thisPtr, KInteropNumber value) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->px2fp(thisPtr, (const OH_Number*) (&value));
}
KOALA_INTEROP_DIRECT_2(UIContext_px2fp, KInteropNumber, OH_NativePointer, KInteropNumber)
OH_Number impl_UIContext_lpx2px(OH_NativePointer thisPtr, KInteropNumber value) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->lpx2px(thisPtr, (const OH_Number*) (&value));
}
KOALA_INTEROP_DIRECT_2(UIContext_lpx2px, KInteropNumber, OH_NativePointer, KInteropNumber)
OH_Number impl_UIContext_px2lpx(OH_NativePointer thisPtr, KInteropNumber value) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->px2lpx(thisPtr, (const OH_Number*) (&value));
}
KOALA_INTEROP_DIRECT_2(UIContext_px2lpx, KInteropNumber, OH_NativePointer, KInteropNumber)
KInteropReturnBuffer impl_UIContext_getSharedLocalStorage(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getSharedLocalStorage(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeCustomObject("object", retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(UIContext_getSharedLocalStorage, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_UIContext_getHostContext(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getHostContext(thisPtr);
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            _retSerializer.writeCustomObject("object", retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(UIContext_getHostContext, KInteropReturnBuffer, OH_NativePointer)
KInteropReturnBuffer impl_UIContext_getWindowName(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getWindowName(thisPtr);
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
KOALA_INTEROP_1(UIContext_getWindowName, KInteropReturnBuffer, OH_NativePointer)
void impl_UIContext_getWindowWidthBreakpoint(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getWindowWidthBreakpoint(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(UIContext_getWindowWidthBreakpoint, OH_NativePointer)
void impl_UIContext_getWindowHeightBreakpoint(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getWindowHeightBreakpoint(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(UIContext_getWindowHeightBreakpoint, OH_NativePointer)
void impl_UIContext_openBindSheet(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject bindSheetContentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto sheetOptionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_CustomObject sheetOptionsValueTempTmpBuf = {};
        sheetOptionsValueTempTmpBuf.tag = sheetOptionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((sheetOptionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            sheetOptionsValueTempTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        }
        Opt_CustomObject sheetOptionsValueTemp = sheetOptionsValueTempTmpBuf;;
        const auto targetIdValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Number targetIdValueTempTmpBuf = {};
        targetIdValueTempTmpBuf.tag = targetIdValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((targetIdValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            targetIdValueTempTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
        }
        Opt_Number targetIdValueTemp = targetIdValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->openBindSheet(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&bindSheetContentValueTemp), static_cast<Opt_CustomObject*>(&sheetOptionsValueTemp), static_cast<Opt_Number*>(&targetIdValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(UIContext_openBindSheet, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_updateBindSheet(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject bindSheetContentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject sheetOptionsValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto partialUpdateValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean partialUpdateValueTempTmpBuf = {};
        partialUpdateValueTempTmpBuf.tag = partialUpdateValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((partialUpdateValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            partialUpdateValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean partialUpdateValueTemp = partialUpdateValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->updateBindSheet(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&bindSheetContentValueTemp), static_cast<OH_CustomObject*>(&sheetOptionsValueTemp), static_cast<Opt_Boolean*>(&partialUpdateValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(UIContext_updateBindSheet, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_closeBindSheet(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject bindSheetContentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->closeBindSheet(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&bindSheetContentValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V3(UIContext_closeBindSheet, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_postFrameCallback(OH_NativePointer thisPtr, OH_NativePointer frameCallback) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->postFrameCallback(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_FrameCallback>(frameCallback));
}
KOALA_INTEROP_DIRECT_V2(UIContext_postFrameCallback, OH_NativePointer, OH_NativePointer)
void impl_UIContext_postDelayedFrameCallback(OH_NativePointer thisPtr, OH_NativePointer frameCallback, KInteropNumber delayTime) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->postDelayedFrameCallback(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_FrameCallback>(frameCallback), (const OH_Number*) (&delayTime));
}
KOALA_INTEROP_DIRECT_V3(UIContext_postDelayedFrameCallback, OH_NativePointer, OH_NativePointer, KInteropNumber)
KInteropReturnBuffer impl_UIContext_requireDynamicSyncScene(OH_NativePointer thisPtr, const KStringPtr& id) {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->requireDynamicSyncScene(thisPtr, (const OH_String*) (&id));
        SerializerBase _retSerializer {};
        _retSerializer.writeInt32(retValue.length);
        for (int retValueCounterI = 0; retValueCounterI < retValue.length; retValueCounterI++) {
            const OH_OHOS_ARKUI_UICONTEXT_DynamicSyncScene retValueTmpElement = retValue.array[retValueCounterI];
            DynamicSyncScene_serializer::write(_retSerializer, retValueTmpElement);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(UIContext_requireDynamicSyncScene, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
void impl_UIContext_clearResourceCache(OH_NativePointer thisPtr) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->clearResourceCache(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(UIContext_clearResourceCache, OH_NativePointer)
OH_Boolean impl_UIContext_isFollowingSystemFontScale(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->isFollowingSystemFontScale(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_isFollowingSystemFontScale, OH_Boolean, OH_NativePointer)
OH_Number impl_UIContext_getMaxFontScale(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getMaxFontScale(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getMaxFontScale, KInteropNumber, OH_NativePointer)
void impl_UIContext_bindTabsToScrollable(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject tabsControllerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject scrollerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->bindTabsToScrollable(thisPtr, static_cast<OH_CustomObject*>(&tabsControllerValueTemp), static_cast<OH_CustomObject*>(&scrollerValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_bindTabsToScrollable, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_unbindTabsFromScrollable(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject tabsControllerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject scrollerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->unbindTabsFromScrollable(thisPtr, static_cast<OH_CustomObject*>(&tabsControllerValueTemp), static_cast<OH_CustomObject*>(&scrollerValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_unbindTabsFromScrollable, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_bindTabsToNestedScrollable(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject tabsControllerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject parentScrollerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject childScrollerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->bindTabsToNestedScrollable(thisPtr, static_cast<OH_CustomObject*>(&tabsControllerValueTemp), static_cast<OH_CustomObject*>(&parentScrollerValueTemp), static_cast<OH_CustomObject*>(&childScrollerValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_bindTabsToNestedScrollable, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_unbindTabsFromNestedScrollable(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject tabsControllerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject parentScrollerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        OH_CustomObject childScrollerValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->unbindTabsFromNestedScrollable(thisPtr, static_cast<OH_CustomObject*>(&tabsControllerValueTemp), static_cast<OH_CustomObject*>(&parentScrollerValueTemp), static_cast<OH_CustomObject*>(&childScrollerValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_unbindTabsFromNestedScrollable, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_enableSwipeBack(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto enabledValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Boolean enabledValueTempTmpBuf = {};
        enabledValueTempTmpBuf.tag = enabledValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((enabledValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            enabledValueTempTmpBuf.value = thisDeserializer.readBoolean();
        }
        Opt_Boolean enabledValueTemp = enabledValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->enableSwipeBack(thisPtr, static_cast<Opt_Boolean*>(&enabledValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_enableSwipeBack, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIContext_openBindContentCover(KVMContext vmContext, OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength, OH_NativePointer controller) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject contentValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        const auto contentCoverOptionsValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_CustomObject contentCoverOptionsValueTempTmpBuf = {};
        contentCoverOptionsValueTempTmpBuf.tag = contentCoverOptionsValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((contentCoverOptionsValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            contentCoverOptionsValueTempTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        }
        Opt_CustomObject contentCoverOptionsValueTemp = contentCoverOptionsValueTempTmpBuf;;
        const auto targetIdValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_Number targetIdValueTempTmpBuf = {};
        targetIdValueTempTmpBuf.tag = targetIdValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((targetIdValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            targetIdValueTempTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
        }
        Opt_Number targetIdValueTemp = targetIdValueTempTmpBuf;;
        OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void outputArgumentForReturningPromiseValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->openBindContentCover(reinterpret_cast<OH_OHOS_ARKUI_UICONTEXT_VMContext>(vmContext), GetAsyncWorker(), thisPtr, static_cast<OH_CustomObject*>(&contentValueTemp), static_cast<OH_OHOS_ARKUI_UICONTEXT_ContentCoverController>(controller), static_cast<Opt_CustomObject*>(&contentCoverOptionsValueTemp), static_cast<Opt_Number*>(&targetIdValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Opt_Array_String_Void*>(&outputArgumentForReturningPromiseValueTemp));
}
KOALA_INTEROP_CTX_V4(UIContext_openBindContentCover, OH_NativePointer, KSerializerBuffer, int32_t, OH_NativePointer)
void impl_UIContext_freezeUINode0(OH_NativePointer thisPtr, const KStringPtr& id, OH_Boolean isFrozen) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->freezeUINode0(thisPtr, (const OH_String*) (&id), isFrozen);
}
KOALA_INTEROP_V3(UIContext_freezeUINode0, OH_NativePointer, KStringPtr, OH_Boolean)
void impl_UIContext_freezeUINode1(OH_NativePointer thisPtr, KInteropNumber uniqueId, OH_Boolean isFrozen) {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->freezeUINode1(thisPtr, (const OH_Number*) (&uniqueId), isFrozen);
}
KOALA_INTEROP_DIRECT_V3(UIContext_freezeUINode1, OH_NativePointer, KInteropNumber, OH_Boolean)
OH_NativePointer impl_UIContext_getTextMenuController(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getTextMenuController(thisPtr);
}
KOALA_INTEROP_DIRECT_1(UIContext_getTextMenuController, OH_NativePointer, OH_NativePointer)
KInteropReturnBuffer impl_UIContext_createUIContextWithoutWindow(KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 contextValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext contextValueTempTmpBuf = {};
        contextValueTempTmpBuf.selector = contextValueTempTmpBufUnionSelector;
        if (contextValueTempTmpBufUnionSelector == 0) {
            contextValueTempTmpBuf.selector = 0;
            contextValueTempTmpBuf.value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else if (contextValueTempTmpBufUnionSelector == 1) {
            contextValueTempTmpBuf.selector = 1;
            contextValueTempTmpBuf.value1 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else {
            INTEROP_FATAL("One of the branches for contextValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext contextValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext>(contextValueTempTmpBuf);;
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->createUIContextWithoutWindow(static_cast<OH_OHOS_ARKUI_UICONTEXT_Union_Common_UIAbilityContext_Common_ExtensionContext*>(&contextValueTemp));
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            UIContext_serializer::write(_retSerializer, retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(UIContext_createUIContextWithoutWindow, KInteropReturnBuffer, KSerializerBuffer, int32_t)
void impl_UIContext_destroyUIContextWithoutWindow() {
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->destroyUIContextWithoutWindow();
}
KOALA_INTEROP_DIRECT_V0(UIContext_destroyUIContextWithoutWindow)
void impl_UIContext_setUIStates(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject callback_ValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->setUIStates(thisPtr, static_cast<OH_CustomObject*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIContext_setUIStates, OH_NativePointer, KSerializerBuffer, int32_t)
KInteropReturnBuffer impl_UIContext_getFocusedUIContext() {
        const auto &retValue = GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIContext()->getFocusedUIContext();
        SerializerBase _retSerializer {};
        if (runtimeType(retValue) != INTEROP_RUNTIME_UNDEFINED) {
            _retSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
            const auto retValueTmpValue = retValue.value;
            UIContext_serializer::write(_retSerializer, retValueTmpValue);
        } else {
            _retSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_0(UIContext_getFocusedUIContext, KInteropReturnBuffer)
OH_NativePointer impl_UIInspector_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIInspector()->construct();
}
KOALA_INTEROP_DIRECT_0(UIInspector_construct, OH_NativePointer)
OH_NativePointer impl_UIInspector_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIInspector()->destruct;
}
KOALA_INTEROP_DIRECT_0(UIInspector_getFinalizer, OH_NativePointer)
OH_NativePointer impl_UIInspector_createComponentObserver(OH_NativePointer thisPtr, const KStringPtr& id) {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIInspector()->createComponentObserver(thisPtr, (const OH_String*) (&id));
}
KOALA_INTEROP_2(UIInspector_createComponentObserver, OH_NativePointer, OH_NativePointer, KStringPtr)
OH_NativePointer impl_UIObserver_construct() {
        return GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->construct();
}
KOALA_INTEROP_DIRECT_0(UIObserver_construct, OH_NativePointer)
OH_NativePointer impl_UIObserver_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->destruct;
}
KOALA_INTEROP_DIRECT_0(UIObserver_getFinalizer, OH_NativePointer)
void impl_UIObserver_onNavDestinationUpdate0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions optionsValueTemp = uiObserver_NavDestinationSwitchObserverOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onNavDestinationUpdate0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onNavDestinationUpdate0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offNavDestinationUpdate0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions optionsValueTemp = uiObserver_NavDestinationSwitchObserverOptions_serializer::read(thisDeserializer);;
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offNavDestinationUpdate0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions*>(&optionsValueTemp), static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offNavDestinationUpdate0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onNavDestinationUpdate1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onNavDestinationUpdate1(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onNavDestinationUpdate1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offNavDestinationUpdate1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offNavDestinationUpdate1(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offNavDestinationUpdate1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onScrollEvent0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions optionsValueTemp = uiObserver_ObserverOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_ScrollEventInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_ScrollEventInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onScrollEvent0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onScrollEvent0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offScrollEvent0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions optionsValueTemp = uiObserver_ObserverOptions_serializer::read(thisDeserializer);;
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_ScrollEventInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_ScrollEventInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offScrollEvent0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions*>(&optionsValueTemp), static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offScrollEvent0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onScrollEvent1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_ScrollEventInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_ScrollEventInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onScrollEvent1(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onScrollEvent1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offScrollEvent1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_ScrollEventInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_ScrollEventInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offScrollEvent1(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_ScrollEventInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offScrollEvent1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onRouterPageUpdate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_RouterPageInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_RouterPageInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onRouterPageUpdate(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onRouterPageUpdate, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offRouterPageUpdate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_RouterPageInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_RouterPageInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offRouterPageUpdate(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_RouterPageInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offRouterPageUpdate, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onDensityUpdate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_DensityInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_DensityInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onDensityUpdate(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onDensityUpdate, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offDensityUpdate(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_DensityInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_DensityInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offDensityUpdate(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_DensityInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offDensityUpdate, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onWillDraw(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onWillDraw(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onWillDraw, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offWillDraw(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offWillDraw(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offWillDraw, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onDidLayout(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onDidLayout(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onDidLayout, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offDidLayout(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offDidLayout(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offDidLayout, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onNavDestinationSwitch0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationSwitchInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationSwitchInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onNavDestinationSwitch0(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onNavDestinationSwitch0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offNavDestinationSwitch0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationSwitchInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationSwitchInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offNavDestinationSwitch0(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offNavDestinationSwitch0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onNavDestinationSwitch1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions observerOptionsValueTemp = uiObserver_NavDestinationSwitchObserverOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationSwitchInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationSwitchInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onNavDestinationSwitch1(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions*>(&observerOptionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onNavDestinationSwitch1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offNavDestinationSwitch1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions observerOptionsValueTemp = uiObserver_NavDestinationSwitchObserverOptions_serializer::read(thisDeserializer);;
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationSwitchInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationSwitchInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offNavDestinationSwitch1(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchObserverOptions*>(&observerOptionsValueTemp), static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_NavDestinationSwitchInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offNavDestinationSwitch1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onWillClick0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_ClickEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_ClickEventListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onWillClick0(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onWillClick0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offWillClick0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_ClickEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_ClickEventListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offWillClick0(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offWillClick0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onDidClick0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_ClickEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_ClickEventListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onDidClick0(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onDidClick0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offDidClick0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_ClickEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_ClickEventListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offDidClick0(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_ClickEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offDidClick0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onWillClick1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureEventListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onWillClick1(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onWillClick1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offWillClick1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureEventListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offWillClick1(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offWillClick1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onDidClick1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureEventListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onDidClick1(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onDidClick1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offDidClick1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureEventListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureEventListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offDidClick1(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_GestureEventListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offDidClick1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onBeforePanStart(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onBeforePanStart(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onBeforePanStart, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offBeforePanStart(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offBeforePanStart(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offBeforePanStart, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onBeforePanEnd(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onBeforePanEnd(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onBeforePanEnd, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offBeforePanEnd(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offBeforePanEnd(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offBeforePanEnd, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onAfterPanStart(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onAfterPanStart(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onAfterPanStart, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offAfterPanStart(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offAfterPanStart(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offAfterPanStart, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onAfterPanEnd(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onAfterPanEnd(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onAfterPanEnd, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offAfterPanEnd(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offAfterPanEnd(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_PanListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offAfterPanEnd, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onNodeRenderState(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 nodeIdentityValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity nodeIdentityValueTempTmpBuf = {};
        nodeIdentityValueTempTmpBuf.selector = nodeIdentityValueTempTmpBufUnionSelector;
        if (nodeIdentityValueTempTmpBufUnionSelector == 0) {
            nodeIdentityValueTempTmpBuf.selector = 0;
            nodeIdentityValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (nodeIdentityValueTempTmpBufUnionSelector == 1) {
            nodeIdentityValueTempTmpBuf.selector = 1;
            nodeIdentityValueTempTmpBuf.value1 = static_cast<OH_Number>(thisDeserializer.readNumber());
        } else {
            INTEROP_FATAL("One of the branches for nodeIdentityValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity nodeIdentityValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity>(nodeIdentityValueTempTmpBuf);;
        OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_NodeRenderStateChangeCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_NodeRenderStateChangeCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onNodeRenderState(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity*>(&nodeIdentityValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onNodeRenderState, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offNodeRenderState(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 nodeIdentityValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity nodeIdentityValueTempTmpBuf = {};
        nodeIdentityValueTempTmpBuf.selector = nodeIdentityValueTempTmpBufUnionSelector;
        if (nodeIdentityValueTempTmpBufUnionSelector == 0) {
            nodeIdentityValueTempTmpBuf.selector = 0;
            nodeIdentityValueTempTmpBuf.value0 = static_cast<OH_String>(thisDeserializer.readString());
        } else if (nodeIdentityValueTempTmpBufUnionSelector == 1) {
            nodeIdentityValueTempTmpBuf.selector = 1;
            nodeIdentityValueTempTmpBuf.value1 = static_cast<OH_Number>(thisDeserializer.readNumber());
        } else {
            INTEROP_FATAL("One of the branches for nodeIdentityValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_UICONTEXT_NodeIdentity nodeIdentityValueTemp = static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity>(nodeIdentityValueTempTmpBuf);;
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_NodeRenderStateChangeCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_NodeRenderStateChangeCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offNodeRenderState(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeIdentity*>(&nodeIdentityValueTemp), static_cast<Opt_OHOS_ARKUI_UICONTEXT_NodeRenderStateChangeCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offNodeRenderState, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onTabContentUpdate0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions optionsValueTemp = uiObserver_ObserverOptions_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_TabContentInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_TabContentInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onTabContentUpdate0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions*>(&optionsValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onTabContentUpdate0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offTabContentUpdate0(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions optionsValueTemp = uiObserver_ObserverOptions_serializer::read(thisDeserializer);;
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_TabContentInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_TabContentInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offTabContentUpdate0(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_ObserverOptions*>(&optionsValueTemp), static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offTabContentUpdate0, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_onTabContentUpdate1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_TabContentInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_TabContentInfo_Void))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->onTabContentUpdate1(thisPtr, static_cast<OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_onTabContentUpdate1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_offTabContentUpdate1(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_TabContentInfo_Void)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_TabContentInfo_Void))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->offTabContentUpdate1(thisPtr, static_cast<Opt_OHOS_ARKUI_UICONTEXT_Callback_Observer_TabContentInfo_Void*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V3(UIObserver_offTabContentUpdate1, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_UIObserver_addGlobalGestureListener(OH_NativePointer thisPtr, OH_Int32 type, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs optionValueTemp = GestureObserverConfigs_serializer::read(thisDeserializer);;
        OHOS_ARKUI_UICONTEXT_GestureListenerCallback callback_ValueTemp = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureListenerCallback))))};;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->addGlobalGestureListener(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_GestureListenerType>(type), static_cast<OH_OHOS_ARKUI_UICONTEXT_GestureObserverConfigs*>(&optionValueTemp), static_cast<OHOS_ARKUI_UICONTEXT_GestureListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(UIObserver_addGlobalGestureListener, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
void impl_UIObserver_removeGlobalGestureListener(OH_NativePointer thisPtr, OH_Int32 type, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const auto callback_ValueTempTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
        Opt_OHOS_ARKUI_UICONTEXT_GestureListenerCallback callback_ValueTempTmpBuf = {};
        callback_ValueTempTmpBuf.tag = callback_ValueTempTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((callback_ValueTempTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            callback_ValueTempTmpBuf.value = {thisDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureListenerCallback)))), reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureListenerCallback))))};
        }
        Opt_OHOS_ARKUI_UICONTEXT_GestureListenerCallback callback_ValueTemp = callback_ValueTempTmpBuf;;
        GetOH_OHOS_ARKUI_UICONTEXT_API(OHOS_ARKUI_UICONTEXT_API_VERSION)->UIObserver()->removeGlobalGestureListener(thisPtr, static_cast<OH_OHOS_ARKUI_UICONTEXT_GestureListenerType>(type), static_cast<Opt_OHOS_ARKUI_UICONTEXT_GestureListenerCallback*>(&callback_ValueTemp));
}
KOALA_INTEROP_DIRECT_V4(UIObserver_removeGlobalGestureListener, OH_NativePointer, OH_Int32, KSerializerBuffer, int32_t)
void deserializeAndCallCallback_DismissDialogAction_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void))));
    thisDeserializer.readPointer();
    OH_CustomObject value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_DismissDialogAction_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))));
    OH_CustomObject value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Number_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_Number progress)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Number_Void))));
    thisDeserializer.readPointer();
    OH_Number progress = static_cast<OH_Number>(thisDeserializer.readNumber());
    _call(_resourceId, progress);
}
void deserializeAndCallSyncCallback_Number_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_Number progress)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Number_Void))));
    OH_Number progress = static_cast<OH_Number>(thisDeserializer.readNumber());
    callSyncMethod(vmContext, resourceId, progress);
}
void deserializeAndCallCallback_Observer_DensityInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_DensityInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0 = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo>(uiObserver_DensityInfo_serializer::read(thisDeserializer));
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Observer_DensityInfo_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_DensityInfo_Void))));
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0 = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo>(uiObserver_DensityInfo_serializer::read(thisDeserializer));
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Observer_NavDestinationInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0 = uiObserver_NavDestinationInfo_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Observer_NavDestinationInfo_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationInfo_Void))));
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0 = uiObserver_NavDestinationInfo_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Observer_NavDestinationSwitchInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_NavDestinationSwitchInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0 = uiObserver_NavDestinationSwitchInfo_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Observer_NavDestinationSwitchInfo_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_NavDestinationSwitchInfo_Void))));
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0 = uiObserver_NavDestinationSwitchInfo_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Observer_RouterPageInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_RouterPageInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0 = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo>(uiObserver_RouterPageInfo_serializer::read(thisDeserializer));
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Observer_RouterPageInfo_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_RouterPageInfo_Void))));
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0 = static_cast<OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo>(uiObserver_RouterPageInfo_serializer::read(thisDeserializer));
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Observer_ScrollEventInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_ScrollEventInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0 = uiObserver_ScrollEventInfo_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Observer_ScrollEventInfo_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_ScrollEventInfo_Void))));
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0 = uiObserver_ScrollEventInfo_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Observer_TabContentInfo_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Observer_TabContentInfo_Void))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0 = uiObserver_TabContentInfo_serializer::read(thisDeserializer);
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_Observer_TabContentInfo_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Observer_TabContentInfo_Void))));
    OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0 = uiObserver_TabContentInfo_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, value0);
}
void deserializeAndCallCallback_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Array_String_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Array_String_Void))));
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_DragController_DragEventParam_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_dragController_DragEventParam value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_dragController_DragEventParam valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = dragController_DragEventParam_serializer::read(thisDeserializer);
    }
    Opt_dragController_DragEventParam value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_DragController_DragEventParam_Opt_Array_String_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_dragController_DragEventParam value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_dragController_DragEventParam valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = dragController_DragEventParam_serializer::read(thisDeserializer);
    }
    Opt_dragController_DragEventParam value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_image_PixelMap valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_image_PixelMap>(image_PixelMap_serializer::read(thisDeserializer));
    }
    Opt_image_PixelMap value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Image_PixelMap_Opt_Array_String_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_image_PixelMap value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_image_PixelMap valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_OHOS_ARKUI_UICONTEXT_image_PixelMap>(image_PixelMap_serializer::read(thisDeserializer));
    }
    Opt_image_PixelMap value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_Number_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_Number_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_Number valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
    }
    Opt_Number value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_Number_Opt_Array_String_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Number value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_Number_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_Number valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = static_cast<OH_Number>(thisDeserializer.readNumber());
    }
    Opt_Number value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_promptAction_ActionMenuSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_promptAction_ActionMenuSuccessResponse valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = promptAction_ActionMenuSuccessResponse_serializer::read(thisDeserializer);
    }
    Opt_promptAction_ActionMenuSuccessResponse value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_promptAction_ActionMenuSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_promptAction_ActionMenuSuccessResponse valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = promptAction_ActionMenuSuccessResponse_serializer::read(thisDeserializer);
    }
    Opt_promptAction_ActionMenuSuccessResponse value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const Opt_promptAction_ShowDialogSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void))));
    thisDeserializer.readPointer();
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_promptAction_ShowDialogSuccessResponse valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = promptAction_ShowDialogSuccessResponse_serializer::read(thisDeserializer);
    }
    Opt_promptAction_ShowDialogSuccessResponse value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const Opt_promptAction_ShowDialogSuccessResponse value, const Opt_Array_String error)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void))));
    const auto valueTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_promptAction_ShowDialogSuccessResponse valueTmpBuf = {};
    valueTmpBuf.tag = valueTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((valueTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        valueTmpBuf.value = promptAction_ShowDialogSuccessResponse_serializer::read(thisDeserializer);
    }
    Opt_promptAction_ShowDialogSuccessResponse value = valueTmpBuf;
    const auto errorTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
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
void deserializeAndCallSyncCallback_Void(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallClickEventListenerCallback(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_ClickEventListenerCallback))));
    thisDeserializer.readPointer();
    OH_CustomObject event = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    _call(_resourceId, event, node);
}
void deserializeAndCallSyncClickEventListenerCallback(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_ClickEventListenerCallback))));
    OH_CustomObject event = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    callSyncMethod(vmContext, resourceId, event, node);
}
void deserializeAndCallGestureEventListenerCallback(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureEventListenerCallback))));
    thisDeserializer.readPointer();
    OH_CustomObject event = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    _call(_resourceId, event, node);
}
void deserializeAndCallSyncGestureEventListenerCallback(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureEventListenerCallback))));
    OH_CustomObject event = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    callSyncMethod(vmContext, resourceId, event, node);
}
void deserializeAndCallGestureListenerCallback(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_GestureListenerCallback))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info = GestureTriggerInfo_serializer::read(thisDeserializer);
    _call(_resourceId, info);
}
void deserializeAndCallSyncGestureListenerCallback(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_GestureListenerCallback))));
    OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info = GestureTriggerInfo_serializer::read(thisDeserializer);
    callSyncMethod(vmContext, resourceId, info);
}
void deserializeAndCallNodeRenderStateChangeCallback(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_NodeRenderStateChangeCallback))));
    thisDeserializer.readPointer();
    OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state = static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeRenderState>(thisDeserializer.readInt32());
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    _call(_resourceId, state, node);
}
void deserializeAndCallSyncNodeRenderStateChangeCallback(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_NodeRenderStateChangeCallback))));
    OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state = static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeRenderState>(thisDeserializer.readInt32());
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    callSyncMethod(vmContext, resourceId, state, node);
}
void deserializeAndCallPanListenerCallback(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_PanListenerCallback))));
    thisDeserializer.readPointer();
    OH_CustomObject event = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    OH_CustomObject current = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    _call(_resourceId, event, current, node);
}
void deserializeAndCallSyncPanListenerCallback(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject event, const OH_CustomObject current, const Opt_CustomObject node)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_PanListenerCallback))));
    OH_CustomObject event = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    OH_CustomObject current = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    const auto nodeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_UICONTEXT_RuntimeType>(thisDeserializer.readInt8());
    Opt_CustomObject nodeTmpBuf = {};
    nodeTmpBuf.tag = nodeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((nodeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        nodeTmpBuf.value = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    }
    Opt_CustomObject node = nodeTmpBuf;
    callSyncMethod(vmContext, resourceId, event, current, node);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_DismissDialogAction_Void: return deserializeAndCallCallback_DismissDialogAction_Void(thisArray, thisLength);
        case Kind_Callback_Number_Void: return deserializeAndCallCallback_Number_Void(thisArray, thisLength);
        case Kind_Callback_Observer_DensityInfo_Void: return deserializeAndCallCallback_Observer_DensityInfo_Void(thisArray, thisLength);
        case Kind_Callback_Observer_NavDestinationInfo_Void: return deserializeAndCallCallback_Observer_NavDestinationInfo_Void(thisArray, thisLength);
        case Kind_Callback_Observer_NavDestinationSwitchInfo_Void: return deserializeAndCallCallback_Observer_NavDestinationSwitchInfo_Void(thisArray, thisLength);
        case Kind_Callback_Observer_RouterPageInfo_Void: return deserializeAndCallCallback_Observer_RouterPageInfo_Void(thisArray, thisLength);
        case Kind_Callback_Observer_ScrollEventInfo_Void: return deserializeAndCallCallback_Observer_ScrollEventInfo_Void(thisArray, thisLength);
        case Kind_Callback_Observer_TabContentInfo_Void: return deserializeAndCallCallback_Observer_TabContentInfo_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_DragController_DragEventParam_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Image_PixelMap_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_Number_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_Number_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void: return deserializeAndCallCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
        case Kind_ClickEventListenerCallback: return deserializeAndCallClickEventListenerCallback(thisArray, thisLength);
        case Kind_GestureEventListenerCallback: return deserializeAndCallGestureEventListenerCallback(thisArray, thisLength);
        case Kind_GestureListenerCallback: return deserializeAndCallGestureListenerCallback(thisArray, thisLength);
        case Kind_NodeRenderStateChangeCallback: return deserializeAndCallNodeRenderStateChangeCallback(thisArray, thisLength);
        case Kind_PanListenerCallback: return deserializeAndCallPanListenerCallback(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_DismissDialogAction_Void: return deserializeAndCallSyncCallback_DismissDialogAction_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Number_Void: return deserializeAndCallSyncCallback_Number_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Observer_DensityInfo_Void: return deserializeAndCallSyncCallback_Observer_DensityInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Observer_NavDestinationInfo_Void: return deserializeAndCallSyncCallback_Observer_NavDestinationInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Observer_NavDestinationSwitchInfo_Void: return deserializeAndCallSyncCallback_Observer_NavDestinationSwitchInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Observer_RouterPageInfo_Void: return deserializeAndCallSyncCallback_Observer_RouterPageInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Observer_ScrollEventInfo_Void: return deserializeAndCallSyncCallback_Observer_ScrollEventInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Observer_TabContentInfo_Void: return deserializeAndCallSyncCallback_Observer_TabContentInfo_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_DragController_DragEventParam_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Image_PixelMap_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_Number_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_Number_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void: return deserializeAndCallSyncCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
        case Kind_ClickEventListenerCallback: return deserializeAndCallSyncClickEventListenerCallback(vmContext, thisArray, thisLength);
        case Kind_GestureEventListenerCallback: return deserializeAndCallSyncGestureEventListenerCallback(vmContext, thisArray, thisLength);
        case Kind_GestureListenerCallback: return deserializeAndCallSyncGestureListenerCallback(vmContext, thisArray, thisLength);
        case Kind_NodeRenderStateChangeCallback: return deserializeAndCallSyncNodeRenderStateChangeCallback(vmContext, thisArray, thisLength);
        case Kind_PanListenerCallback: return deserializeAndCallSyncPanListenerCallback(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_DismissDialogAction_Void(OH_Int32 resourceId, OH_CustomObject value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_DismissDialogAction_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_DismissDialogAction_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_CustomObject value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_DismissDialogAction_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Number_Void(OH_Int32 resourceId, OH_Number progress)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Number_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeNumber(progress);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Number_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_Number progress)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Number_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeNumber(progress);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Observer_DensityInfo_Void(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Observer_DensityInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_DensityInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Observer_DensityInfo_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_DensityInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Observer_DensityInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_DensityInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Observer_NavDestinationInfo_Void(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Observer_NavDestinationInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_NavDestinationInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Observer_NavDestinationInfo_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Observer_NavDestinationInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_NavDestinationInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Observer_NavDestinationSwitchInfo_Void(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Observer_NavDestinationSwitchInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_NavDestinationSwitchInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Observer_NavDestinationSwitchInfo_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_NavDestinationSwitchInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Observer_NavDestinationSwitchInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_NavDestinationSwitchInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Observer_RouterPageInfo_Void(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Observer_RouterPageInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_RouterPageInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Observer_RouterPageInfo_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_RouterPageInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Observer_RouterPageInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_RouterPageInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Observer_ScrollEventInfo_Void(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Observer_ScrollEventInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_ScrollEventInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Observer_ScrollEventInfo_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_ScrollEventInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Observer_ScrollEventInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_ScrollEventInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Observer_TabContentInfo_Void(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Observer_TabContentInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_TabContentInfo_serializer::write(argsSerializer, value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_Observer_TabContentInfo_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_uiObserver_TabContentInfo value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Observer_TabContentInfo_Void);
    argsSerializer.writeInt32(resourceId);
    uiObserver_TabContentInfo_serializer::write(argsSerializer, value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Array_String_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, Opt_Array_String error)
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
void callManagedCallback_Opt_DragController_DragEventParam_Opt_Array_String_Void(OH_Int32 resourceId, Opt_dragController_DragEventParam value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        dragController_DragEventParam_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_DragController_DragEventParam_Opt_Array_String_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, Opt_dragController_DragEventParam value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        dragController_DragEventParam_serializer::write(argsSerializer, valueTmpValue);
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
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
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
void callManagedCallback_Opt_Image_PixelMap_Opt_Array_String_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, Opt_image_PixelMap value, Opt_Array_String error)
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
void callManagedCallback_Opt_Number_Opt_Array_String_Void(OH_Int32 resourceId, Opt_Number value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_Number_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeNumber(valueTmpValue);
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
void callManagedCallback_Opt_Number_Opt_Array_String_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, Opt_Number value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_Number_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        argsSerializer.writeNumber(valueTmpValue);
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
void callManagedCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void(OH_Int32 resourceId, Opt_promptAction_ActionMenuSuccessResponse value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        promptAction_ActionMenuSuccessResponse_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, Opt_promptAction_ActionMenuSuccessResponse value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        promptAction_ActionMenuSuccessResponse_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void(OH_Int32 resourceId, Opt_promptAction_ShowDialogSuccessResponse value, Opt_Array_String error)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        promptAction_ShowDialogSuccessResponse_serializer::write(argsSerializer, valueTmpValue);
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
void callManagedCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, Opt_promptAction_ShowDialogSuccessResponse value, Opt_Array_String error)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void);
    argsSerializer.writeInt32(resourceId);
    if (runtimeType(value) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto valueTmpValue = value.value;
        promptAction_ShowDialogSuccessResponse_serializer::write(argsSerializer, valueTmpValue);
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
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedClickEventListenerCallback(OH_Int32 resourceId, OH_CustomObject event, Opt_CustomObject node)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_ClickEventListenerCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", event);
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedClickEventListenerCallbackSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_CustomObject event, Opt_CustomObject node)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_ClickEventListenerCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", event);
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedGestureEventListenerCallback(OH_Int32 resourceId, OH_CustomObject event, Opt_CustomObject node)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_GestureEventListenerCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", event);
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedGestureEventListenerCallbackSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_CustomObject event, Opt_CustomObject node)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_GestureEventListenerCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", event);
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedGestureListenerCallback(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_GestureListenerCallback);
    argsSerializer.writeInt32(resourceId);
    GestureTriggerInfo_serializer::write(argsSerializer, info);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedGestureListenerCallbackSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_GestureTriggerInfo info)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_GestureListenerCallback);
    argsSerializer.writeInt32(resourceId);
    GestureTriggerInfo_serializer::write(argsSerializer, info);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedNodeRenderStateChangeCallback(OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, Opt_CustomObject node)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_NodeRenderStateChangeCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeRenderState>(state));
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedNodeRenderStateChangeCallbackSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_OHOS_ARKUI_UICONTEXT_NodeRenderState state, Opt_CustomObject node)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_NodeRenderStateChangeCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_UICONTEXT_NodeRenderState>(state));
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedPanListenerCallback(OH_Int32 resourceId, OH_CustomObject event, OH_CustomObject current, Opt_CustomObject node)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_ARKUI_UICONTEXT_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_PanListenerCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", event);
    argsSerializer.writeCustomObject("object", current);
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    enqueueCallback(10, &callbackBuffer);
}
void callManagedPanListenerCallbackSync(OH_OHOS_ARKUI_UICONTEXT_VMContext vmContext, OH_Int32 resourceId, OH_CustomObject event, OH_CustomObject current, Opt_CustomObject node)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_PanListenerCallback);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", event);
    argsSerializer.writeCustomObject("object", current);
    if (runtimeType(node) != INTEROP_RUNTIME_UNDEFINED) {
        argsSerializer.writeInt8(INTEROP_RUNTIME_OBJECT);
        const auto nodeTmpValue = node.value;
        argsSerializer.writeCustomObject("object", nodeTmpValue);
    } else {
        argsSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
OH_NativePointer getManagedCallbackCaller(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_DismissDialogAction_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_DismissDialogAction_Void);
        case Kind_Callback_Number_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Number_Void);
        case Kind_Callback_Observer_DensityInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_DensityInfo_Void);
        case Kind_Callback_Observer_NavDestinationInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_NavDestinationInfo_Void);
        case Kind_Callback_Observer_NavDestinationSwitchInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_NavDestinationSwitchInfo_Void);
        case Kind_Callback_Observer_RouterPageInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_RouterPageInfo_Void);
        case Kind_Callback_Observer_ScrollEventInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_ScrollEventInfo_Void);
        case Kind_Callback_Observer_TabContentInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_TabContentInfo_Void);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_Void);
        case Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_DragController_DragEventParam_Opt_Array_String_Void);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Image_PixelMap_Opt_Array_String_Void);
        case Kind_Callback_Opt_Number_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Number_Opt_Array_String_Void);
        case Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void);
        case Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
        case Kind_ClickEventListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedClickEventListenerCallback);
        case Kind_GestureEventListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedGestureEventListenerCallback);
        case Kind_GestureListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedGestureListenerCallback);
        case Kind_NodeRenderStateChangeCallback: return reinterpret_cast<OH_NativePointer>(callManagedNodeRenderStateChangeCallback);
        case Kind_PanListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedPanListenerCallback);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_DismissDialogAction_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_DismissDialogAction_VoidSync);
        case Kind_Callback_Number_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Number_VoidSync);
        case Kind_Callback_Observer_DensityInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_DensityInfo_VoidSync);
        case Kind_Callback_Observer_NavDestinationInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_NavDestinationInfo_VoidSync);
        case Kind_Callback_Observer_NavDestinationSwitchInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_NavDestinationSwitchInfo_VoidSync);
        case Kind_Callback_Observer_RouterPageInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_RouterPageInfo_VoidSync);
        case Kind_Callback_Observer_ScrollEventInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_ScrollEventInfo_VoidSync);
        case Kind_Callback_Observer_TabContentInfo_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Observer_TabContentInfo_VoidSync);
        case Kind_Callback_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_DragController_DragEventParam_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_DragController_DragEventParam_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Image_PixelMap_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Image_PixelMap_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_Number_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_Number_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PromptAction_ActionMenuSuccessResponse_Opt_Array_String_VoidSync);
        case Kind_Callback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Opt_PromptAction_ShowDialogSuccessResponse_Opt_Array_String_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
        case Kind_ClickEventListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedClickEventListenerCallbackSync);
        case Kind_GestureEventListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedGestureEventListenerCallbackSync);
        case Kind_GestureListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedGestureListenerCallbackSync);
        case Kind_NodeRenderStateChangeCallback: return reinterpret_cast<OH_NativePointer>(callManagedNodeRenderStateChangeCallbackSync);
        case Kind_PanListenerCallback: return reinterpret_cast<OH_NativePointer>(callManagedPanListenerCallbackSync);
    }
    return nullptr;
}