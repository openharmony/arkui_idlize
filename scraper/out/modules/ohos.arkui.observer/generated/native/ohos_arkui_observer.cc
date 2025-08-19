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

#include "ohos_arkui_observer.h"

#define KOALA_INTEROP_MODULE OHOS_ARKUI_OBSERVERNativeModule
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_Int32& value)
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_Number& value)
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_UIContext& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_UIContext value) {
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_UIContext& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfo value) {
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_DensityInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationState value) {
    result->append("OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationState(");
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchObserverOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchObserverOptions* value) {
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationSwitchObserverOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageState value) {
    result->append("OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageState(");
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_RouterPageState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventType& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventType value) {
    result->append("OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventType(");
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_ScrollEventType& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentState& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentState value) {
    result->append("OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentState(");
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_TabContentState& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_CustomObject
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_ARKUI_OBSERVER_UIContext
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_Union_UIAbilityContext_UIContext& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo* value) {
    result->append("{");
    // OH_CustomObject navigationId
    result->append(".navigationId=");
    WriteToString(result, &value->navigationId);
    // OH_CustomObject name
    result->append(", ");
    result->append(".name=");
    WriteToString(result, &value->name);
    // OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationState state
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavigationInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavigationInfo* value) {
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_NavigationInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_ObserverOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_ObserverOptions* value) {
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_ObserverOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfo value) {
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_RouterPageInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventInfo* value) {
    result->append("{");
    // OH_String id
    result->append(".id=");
    WriteToString(result, &value->id);
    // OH_Number uniqueId
    result->append(", ");
    result->append(".uniqueId=");
    WriteToString(result, &value->uniqueId);
    // OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventType scrollEvent
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_ScrollEventInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentInfo* value) {
    result->append("{");
    // OH_String tabContentId
    result->append(".tabContentId=");
    WriteToString(result, &value->tabContentId);
    // OH_Number tabContentUniqueId
    result->append(", ");
    result->append(".tabContentUniqueId=");
    WriteToString(result, &value->tabContentUniqueId);
    // OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentState state
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_TabContentInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_Union_NavDestinationInfo_NavBar& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchInfo& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchInfo* value) {
    result->append("{");
    // OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext context
    result->append(".context=");
    WriteToString(result, &value->context);
    // OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar from
    result->append(", ");
    result->append(".from=");
    WriteToString(result, &value->from);
    // OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar to
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
inline OH_OHOS_ARKUI_OBSERVER_RuntimeType runtimeType(const Opt_uiObserver_NavDestinationSwitchInfo& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class UIContext_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_UIContext value);
    static OH_OHOS_ARKUI_OBSERVER_UIContext read(DeserializerBase& buffer);
};
class uiObserver_DensityInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfo value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfo read(DeserializerBase& buffer);
};
class uiObserver_NavDestinationSwitchObserverOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchObserverOptions value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchObserverOptions read(DeserializerBase& buffer);
};
class uiObserver_NavDestinationInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo read(DeserializerBase& buffer);
};
class uiObserver_NavigationInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavigationInfo value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_NavigationInfo read(DeserializerBase& buffer);
};
class uiObserver_ObserverOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_ObserverOptions value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_ObserverOptions read(DeserializerBase& buffer);
};
class uiObserver_RouterPageInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfo value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfo read(DeserializerBase& buffer);
};
class uiObserver_ScrollEventInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventInfo value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventInfo read(DeserializerBase& buffer);
};
class uiObserver_TabContentInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentInfo value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentInfo read(DeserializerBase& buffer);
};
class uiObserver_NavDestinationSwitchInfo_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchInfo value);
    static OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchInfo read(DeserializerBase& buffer);
};
inline void UIContext_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_UIContext value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_OBSERVER_UIContext UIContext_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_OBSERVER_UIContext>(ptr);
}
inline void uiObserver_DensityInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfo value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfo uiObserver_DensityInfo_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_DensityInfo>(ptr);
}
inline void uiObserver_NavDestinationSwitchObserverOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchObserverOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForNavigationId = value.navigationId;
    valueSerializer.writeCustomObject("object", valueHolderForNavigationId);
}
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchObserverOptions uiObserver_NavDestinationSwitchObserverOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchObserverOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.navigationId = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    return value;
}
inline void uiObserver_NavDestinationInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForNavigationId = value.navigationId;
    valueSerializer.writeCustomObject("object", valueHolderForNavigationId);
    const auto valueHolderForName = value.name;
    valueSerializer.writeCustomObject("object", valueHolderForName);
    const auto valueHolderForState = value.state;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationState>(valueHolderForState));
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
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo uiObserver_NavDestinationInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.navigationId = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.name = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    value.state = static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationState>(valueDeserializer.readInt32());
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    const auto paramTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_OBSERVER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Object paramTmpBuf = {};
    paramTmpBuf.tag = paramTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((paramTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        paramTmpBuf.value = static_cast<OH_Object>(valueDeserializer.readObject());
    }
    value.param = paramTmpBuf;
    value.navDestinationId = static_cast<OH_String>(valueDeserializer.readString());
    const auto uniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_OBSERVER_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number uniqueIdTmpBuf = {};
    uniqueIdTmpBuf.tag = uniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((uniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        uniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.uniqueId = uniqueIdTmpBuf;
    const auto modeTmpBuf_runtimeType = static_cast<OH_OHOS_ARKUI_OBSERVER_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject modeTmpBuf = {};
    modeTmpBuf.tag = modeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((modeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        modeTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.mode = modeTmpBuf;
    return value;
}
inline void uiObserver_NavigationInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavigationInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForNavigationId = value.navigationId;
    valueSerializer.writeString(valueHolderForNavigationId);
    const auto valueHolderForPathStack = value.pathStack;
    valueSerializer.writeCustomObject("object", valueHolderForPathStack);
}
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_NavigationInfo uiObserver_NavigationInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_OBSERVER_uiObserver_NavigationInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.navigationId = static_cast<OH_String>(valueDeserializer.readString());
    value.pathStack = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    return value;
}
inline void uiObserver_ObserverOptions_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_ObserverOptions value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    valueSerializer.writeString(valueHolderForId);
}
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_ObserverOptions uiObserver_ObserverOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_OBSERVER_uiObserver_ObserverOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.id = static_cast<OH_String>(valueDeserializer.readString());
    return value;
}
inline void uiObserver_RouterPageInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfo value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfo uiObserver_RouterPageInfo_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageInfo>(ptr);
}
inline void uiObserver_ScrollEventInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForId = value.id;
    valueSerializer.writeString(valueHolderForId);
    const auto valueHolderForUniqueId = value.uniqueId;
    valueSerializer.writeNumber(valueHolderForUniqueId);
    const auto valueHolderForScrollEvent = value.scrollEvent;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventType>(valueHolderForScrollEvent));
    const auto valueHolderForOffset = value.offset;
    valueSerializer.writeNumber(valueHolderForOffset);
}
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventInfo uiObserver_ScrollEventInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.id = static_cast<OH_String>(valueDeserializer.readString());
    value.uniqueId = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.scrollEvent = static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_ScrollEventType>(valueDeserializer.readInt32());
    value.offset = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void uiObserver_TabContentInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentInfo value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForTabContentId = value.tabContentId;
    valueSerializer.writeString(valueHolderForTabContentId);
    const auto valueHolderForTabContentUniqueId = value.tabContentUniqueId;
    valueSerializer.writeNumber(valueHolderForTabContentUniqueId);
    const auto valueHolderForState = value.state;
    valueSerializer.writeInt32(static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentState>(valueHolderForState));
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
    const auto valueHolderForId = value.id;
    valueSerializer.writeString(valueHolderForId);
    const auto valueHolderForUniqueId = value.uniqueId;
    valueSerializer.writeNumber(valueHolderForUniqueId);
}
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentInfo uiObserver_TabContentInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.tabContentId = static_cast<OH_String>(valueDeserializer.readString());
    value.tabContentUniqueId = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.state = static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_TabContentState>(valueDeserializer.readInt32());
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    value.id = static_cast<OH_String>(valueDeserializer.readString());
    value.uniqueId = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void uiObserver_NavDestinationSwitchInfo_serializer::write(SerializerBase& buffer, OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchInfo value)
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
inline OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchInfo uiObserver_NavDestinationSwitchInfo_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_ARKUI_OBSERVER_uiObserver_NavDestinationSwitchInfo value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 contextTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext contextTmpBuf = {};
    contextTmpBuf.selector = contextTmpBufUnionSelector;
    if (contextTmpBufUnionSelector == 0) {
        contextTmpBuf.selector = 0;
        contextTmpBuf.value0 = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    } else if (contextTmpBufUnionSelector == 1) {
        contextTmpBuf.selector = 1;
        contextTmpBuf.value1 = static_cast<OH_OHOS_ARKUI_OBSERVER_UIContext>(UIContext_serializer::read(valueDeserializer));
    } else {
        INTEROP_FATAL("One of the branches for contextTmpBuf has to be chosen through deserialisation.");
    }
    value.context = static_cast<OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext>(contextTmpBuf);
    const OH_Int8 fromTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar fromTmpBuf = {};
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
    value.from = static_cast<OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar>(fromTmpBuf);
    const OH_Int8 toTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar toTmpBuf = {};
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
    value.to = static_cast<OH_OHOS_ARKUI_OBSERVER_Union_NavDestinationInfo_NavBar>(toTmpBuf);
    value.operation = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_ARKUI_OBSERVER_API* GetOH_OHOS_ARKUI_OBSERVER_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_ARKUI_OBSERVER_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_ARKUI_OBSERVER_APIKind::OH_OHOS_ARKUI_OBSERVER_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_uiObserver_DensityInfo_construct() {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_DensityInfo()->construct();
}
KOALA_INTEROP_DIRECT_0(uiObserver_DensityInfo_construct, OH_NativePointer)
OH_NativePointer impl_uiObserver_DensityInfo_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_DensityInfo()->destruct;
}
KOALA_INTEROP_DIRECT_0(uiObserver_DensityInfo_getFinalizer, OH_NativePointer)
OH_NativePointer impl_uiObserver_DensityInfo_getContext(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_DensityInfo()->getContext(thisPtr);
}
KOALA_INTEROP_DIRECT_1(uiObserver_DensityInfo_getContext, OH_NativePointer, OH_NativePointer)
void impl_uiObserver_DensityInfo_setContext(OH_NativePointer thisPtr, OH_NativePointer context) {
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_DensityInfo()->setContext(thisPtr, static_cast<OH_OHOS_ARKUI_OBSERVER_UIContext>(context));
}
KOALA_INTEROP_DIRECT_V2(uiObserver_DensityInfo_setContext, OH_NativePointer, OH_NativePointer)
OH_Number impl_uiObserver_DensityInfo_getDensity(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_DensityInfo()->getDensity(thisPtr);
}
KOALA_INTEROP_DIRECT_1(uiObserver_DensityInfo_getDensity, KInteropNumber, OH_NativePointer)
void impl_uiObserver_DensityInfo_setDensity(OH_NativePointer thisPtr, KInteropNumber density) {
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_DensityInfo()->setDensity(thisPtr, (const OH_Number*) (&density));
}
KOALA_INTEROP_DIRECT_V2(uiObserver_DensityInfo_setDensity, OH_NativePointer, KInteropNumber)
OH_NativePointer impl_uiObserver_RouterPageInfo_construct() {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->construct();
}
KOALA_INTEROP_DIRECT_0(uiObserver_RouterPageInfo_construct, OH_NativePointer)
OH_NativePointer impl_uiObserver_RouterPageInfo_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->destruct;
}
KOALA_INTEROP_DIRECT_0(uiObserver_RouterPageInfo_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_uiObserver_RouterPageInfo_getContext(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->getContext(thisPtr);
        SerializerBase _retSerializer {};
        if (retValue.selector == 0) {
            _retSerializer.writeInt8(0);
            const auto retValueForIdx0 = retValue.value0;
            _retSerializer.writeCustomObject("object", retValueForIdx0);
        } else if (retValue.selector == 1) {
            _retSerializer.writeInt8(1);
            const auto retValueForIdx1 = retValue.value1;
            UIContext_serializer::write(_retSerializer, retValueForIdx1);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getContext, KInteropReturnBuffer, OH_NativePointer)
void impl_uiObserver_RouterPageInfo_setContext(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        const OH_Int8 contextValueTempTmpBufUnionSelector = thisDeserializer.readInt8();
        OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext contextValueTempTmpBuf = {};
        contextValueTempTmpBuf.selector = contextValueTempTmpBufUnionSelector;
        if (contextValueTempTmpBufUnionSelector == 0) {
            contextValueTempTmpBuf.selector = 0;
            contextValueTempTmpBuf.value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
        } else if (contextValueTempTmpBufUnionSelector == 1) {
            contextValueTempTmpBuf.selector = 1;
            contextValueTempTmpBuf.value1 = static_cast<OH_OHOS_ARKUI_OBSERVER_UIContext>(UIContext_serializer::read(thisDeserializer));
        } else {
            INTEROP_FATAL("One of the branches for contextValueTempTmpBuf has to be chosen through deserialisation.");
        }
        OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext contextValueTemp = static_cast<OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext>(contextValueTempTmpBuf);;
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->setContext(thisPtr, static_cast<OH_OHOS_ARKUI_OBSERVER_Union_UIAbilityContext_UIContext*>(&contextValueTemp));
}
KOALA_INTEROP_DIRECT_V3(uiObserver_RouterPageInfo_setContext, OH_NativePointer, KSerializerBuffer, int32_t)
OH_Number impl_uiObserver_RouterPageInfo_getIndex(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->getIndex(thisPtr);
}
KOALA_INTEROP_DIRECT_1(uiObserver_RouterPageInfo_getIndex, KInteropNumber, OH_NativePointer)
void impl_uiObserver_RouterPageInfo_setIndex(OH_NativePointer thisPtr, KInteropNumber index) {
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->setIndex(thisPtr, (const OH_Number*) (&index));
}
KOALA_INTEROP_DIRECT_V2(uiObserver_RouterPageInfo_setIndex, OH_NativePointer, KInteropNumber)
OH_String impl_uiObserver_RouterPageInfo_getName(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->getName(thisPtr);
}
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getName, KStringPtr, OH_NativePointer)
void impl_uiObserver_RouterPageInfo_setName(OH_NativePointer thisPtr, const KStringPtr& name) {
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->setName(thisPtr, (const OH_String*) (&name));
}
KOALA_INTEROP_V2(uiObserver_RouterPageInfo_setName, OH_NativePointer, KStringPtr)
OH_String impl_uiObserver_RouterPageInfo_getPath(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->getPath(thisPtr);
}
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getPath, KStringPtr, OH_NativePointer)
void impl_uiObserver_RouterPageInfo_setPath(OH_NativePointer thisPtr, const KStringPtr& path) {
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->setPath(thisPtr, (const OH_String*) (&path));
}
KOALA_INTEROP_V2(uiObserver_RouterPageInfo_setPath, OH_NativePointer, KStringPtr)
OH_Int32 impl_uiObserver_RouterPageInfo_getState(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->getState(thisPtr);
}
KOALA_INTEROP_DIRECT_1(uiObserver_RouterPageInfo_getState, OH_Int32, OH_NativePointer)
void impl_uiObserver_RouterPageInfo_setState(OH_NativePointer thisPtr, OH_Int32 state) {
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->setState(thisPtr, static_cast<OH_OHOS_ARKUI_OBSERVER_uiObserver_RouterPageState>(state));
}
KOALA_INTEROP_DIRECT_V2(uiObserver_RouterPageInfo_setState, OH_NativePointer, OH_Int32)
OH_String impl_uiObserver_RouterPageInfo_getPageId(OH_NativePointer thisPtr) {
        return GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->getPageId(thisPtr);
}
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getPageId, KStringPtr, OH_NativePointer)
void impl_uiObserver_RouterPageInfo_setPageId(OH_NativePointer thisPtr, const KStringPtr& pageId) {
        GetOH_OHOS_ARKUI_OBSERVER_API(OHOS_ARKUI_OBSERVER_API_VERSION)->UiObserver_RouterPageInfo()->setPageId(thisPtr, (const OH_String*) (&pageId));
}
KOALA_INTEROP_V2(uiObserver_RouterPageInfo_setPageId, OH_NativePointer, KStringPtr)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_ARKUI_OBSERVER_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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