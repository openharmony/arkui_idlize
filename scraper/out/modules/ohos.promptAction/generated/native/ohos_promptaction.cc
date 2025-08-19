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

#include "ohos_promptaction.h"

#define KOALA_INTEROP_MODULE OHOS_PROMPTACTIONNativeModule
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Array_promptAction_Button& value)
{
    return INTEROP_RUNTIME_OBJECT;
}

template <>
void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_Button* value);

template <>
inline void WriteToString(std::string* result, const Array_promptAction_Button* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<OH_OHOS_PROMPTACTION_promptAction_Button, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, const_cast<const OH_OHOS_PROMPTACTION_promptAction_Button*>(&value->array[i]));
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Array_promptAction_Button& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_Boolean& value)
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Boolean& value)
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_CustomObject& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_Number& value)
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_DialogOptionsBorderColor& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_DialogOptionsBorderColor: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_DialogOptionsBorderColor* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_DialogOptionsBorderColor& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_DialogOptionsBorderStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_DialogOptionsBorderWidth& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_DialogOptionsCornerRadius& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_DialogOptionsShadow& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_DialogOptionsShadow: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_DialogOptionsShadow* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_DialogOptionsShadow& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_ImmersiveMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_ImmersiveMode value) {
    result->append("OH_OHOS_PROMPTACTION_ImmersiveMode(");
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_ImmersiveMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_KeyboardAvoidMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_KeyboardAvoidMode value) {
    result->append("OH_OHOS_PROMPTACTION_KeyboardAvoidMode(");
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_KeyboardAvoidMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_LevelMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_LevelMode value) {
    result->append("OH_OHOS_PROMPTACTION_LevelMode(");
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_LevelMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_LevelOrder& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_LevelOrder value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_LevelOrder& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_ActionMenuSuccessResponse& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_CommonController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_CommonController value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_promptAction_CommonController* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_CommonController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_DialogController& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_DialogController value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_DialogController& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_ShowDialogSuccessResponse& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_ToastShowMode& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_ToastShowMode value) {
    result->append("OH_OHOS_PROMPTACTION_promptAction_ToastShowMode(");
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_ToastShowMode& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_BorderStyle_EdgeStyles& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_Dimension_BorderRadiuses& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_Dimension_EdgeWidths& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_ResourceColor_EdgeColors& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_ShadowOptions_ShadowStyle& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OHOS_PROMPTACTION_promptAction_Callback_Void& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OHOS_PROMPTACTION_promptAction_Callback_Void* value) {
    result->append("{");
    result->append(".resource=");
    WriteToString(result, &value->resource);
    result->append(", .call=0");
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_OHOS_PROMPTACTION_promptAction_Callback_Void* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_OHOS_PROMPTACTION_promptAction_Callback_Void& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions* value) {
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
    // OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismiss
    result->append(", ");
    result->append(".onWillDismiss=");
    WriteToString(result, &value->onWillDismiss);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_PROMPTACTION_KeyboardAvoidMode keyboardAvoidMode
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
    // OH_OHOS_PROMPTACTION_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_PROMPTACTION_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_PROMPTACTION_LevelOrder levelOrder
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_BaseDialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions* value) {
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
    // OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismiss
    result->append(", ");
    result->append(".onWillDismiss=");
    WriteToString(result, &value->onWillDismiss);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_PROMPTACTION_KeyboardAvoidMode keyboardAvoidMode
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
    // OH_OHOS_PROMPTACTION_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_PROMPTACTION_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_PROMPTACTION_LevelOrder levelOrder
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
    // OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses cornerRadius
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
    // OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths borderWidth
    result->append(", ");
    result->append(".borderWidth=");
    WriteToString(result, &value->borderWidth);
    // OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors borderColor
    result->append(", ");
    result->append(".borderColor=");
    WriteToString(result, &value->borderColor);
    // OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles borderStyle
    result->append(", ");
    result->append(".borderStyle=");
    WriteToString(result, &value->borderStyle);
    // OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle shadow
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_CustomDialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_DialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_DialogOptions* value) {
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
    // OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismiss
    result->append(", ");
    result->append(".onWillDismiss=");
    WriteToString(result, &value->onWillDismiss);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_PROMPTACTION_KeyboardAvoidMode keyboardAvoidMode
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
    // OH_OHOS_PROMPTACTION_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_PROMPTACTION_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_PROMPTACTION_LevelOrder levelOrder
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
    // OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius cornerRadius
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
    // OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth borderWidth
    result->append(", ");
    result->append(".borderWidth=");
    WriteToString(result, &value->borderWidth);
    // OH_OHOS_PROMPTACTION_DialogOptionsBorderColor borderColor
    result->append(", ");
    result->append(".borderColor=");
    WriteToString(result, &value->borderColor);
    // OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle borderStyle
    result->append(", ");
    result->append(".borderStyle=");
    WriteToString(result, &value->borderStyle);
    // OH_OHOS_PROMPTACTION_DialogOptionsShadow shadow
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_DialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_String_Number& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_String_Number: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_String_Number* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_String_Number& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_String_Resource& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_String_Resource: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_String_Resource* value) {
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_String_Resource& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_Button& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_Button* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_Union_String_Resource text
    result->append(".text=");
    WriteToString(result, &value->text);
    // OH_OHOS_PROMPTACTION_Union_String_Resource color
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_Button& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_promptAction_Button value0
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_PromptActionSingleButton& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_Union_String_Resource title
    result->append(".title=");
    WriteToString(result, &value->title);
    // OH_OHOS_PROMPTACTION_Union_String_Resource message
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
    // OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle shadow
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
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppear
    result->append(", ");
    result->append(".onDidAppear=");
    WriteToString(result, &value->onDidAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappear
    result->append(", ");
    result->append(".onDidDisappear=");
    WriteToString(result, &value->onDidDisappear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppear
    result->append(", ");
    result->append(".onWillAppear=");
    WriteToString(result, &value->onWillAppear);
    // OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappear
    result->append(", ");
    result->append(".onWillDisappear=");
    WriteToString(result, &value->onWillDisappear);
    // OH_OHOS_PROMPTACTION_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_PROMPTACTION_ImmersiveMode immersiveMode
    result->append(", ");
    result->append(".immersiveMode=");
    WriteToString(result, &value->immersiveMode);
    // OH_OHOS_PROMPTACTION_LevelOrder levelOrder
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_ShowDialogOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_Union_String_Resource message
    result->append(".message=");
    WriteToString(result, &value->message);
    // OH_Number duration
    result->append(", ");
    result->append(".duration=");
    WriteToString(result, &value->duration);
    // OH_OHOS_PROMPTACTION_Union_String_Number bottom
    result->append(", ");
    result->append(".bottom=");
    WriteToString(result, &value->bottom);
    // OH_OHOS_PROMPTACTION_promptAction_ToastShowMode showMode
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
    // OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle shadow
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_ShowToastOptions& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_promptAction_Button value0
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_PromptActionDoubleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_promptAction_Button value0
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_PromptActionQuadrupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_promptAction_Button value0
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_PromptActionQuintupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_promptAction_Button value0
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_PromptActionSextupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_promptAction_Button value0
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_PromptActionTripleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        case 3: return runtimeType(value.value3);
        case 4: return runtimeType(value.value4);
        case 5: return runtimeType(value.value5);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, &value->value0);
    }
    // OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    // OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, &value->value2);
    }
    // OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons
    if (value->selector == 3) {
        result->append(".value3=");
        WriteToString(result, &value->value3);
    }
    // OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons
    if (value->selector == 4) {
        result->append(".value4=");
        WriteToString(result, &value->value4);
    }
    // OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions* value) {
    result->append("{");
    // OH_OHOS_PROMPTACTION_Union_String_Resource title
    result->append(".title=");
    WriteToString(result, &value->title);
    // OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons buttons
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
    // OH_OHOS_PROMPTACTION_LevelMode levelMode
    result->append(", ");
    result->append(".levelMode=");
    WriteToString(result, &value->levelMode);
    // OH_Number levelUniqueId
    result->append(", ");
    result->append(".levelUniqueId=");
    WriteToString(result, &value->levelUniqueId);
    // OH_OHOS_PROMPTACTION_ImmersiveMode immersiveMode
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_promptAction_ActionMenuOptions& value)
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
inline OH_OHOS_PROMPTACTION_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class LevelOrder_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_LevelOrder value);
    static OH_OHOS_PROMPTACTION_LevelOrder read(DeserializerBase& buffer);
};
class promptAction_ActionMenuSuccessResponse_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse value);
    static OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse read(DeserializerBase& buffer);
};
class promptAction_CommonController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_CommonController value);
    static OH_OHOS_PROMPTACTION_promptAction_CommonController read(DeserializerBase& buffer);
};
class promptAction_DialogController_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_DialogController value);
    static OH_OHOS_PROMPTACTION_promptAction_DialogController read(DeserializerBase& buffer);
};
class promptAction_ShowDialogSuccessResponse_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse value);
    static OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse read(DeserializerBase& buffer);
};
class promptAction_BaseDialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions value);
    static OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions read(DeserializerBase& buffer);
};
class promptAction_CustomDialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions value);
    static OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions read(DeserializerBase& buffer);
};
class promptAction_DialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_DialogOptions value);
    static OH_OHOS_PROMPTACTION_promptAction_DialogOptions read(DeserializerBase& buffer);
};
class promptAction_Button_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_Button value);
    static OH_OHOS_PROMPTACTION_promptAction_Button read(DeserializerBase& buffer);
};
class promptAction_ShowDialogOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions value);
    static OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions read(DeserializerBase& buffer);
};
class promptAction_ShowToastOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions value);
    static OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions read(DeserializerBase& buffer);
};
class promptAction_ActionMenuOptions_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions value);
    static OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions read(DeserializerBase& buffer);
};
inline void LevelOrder_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_LevelOrder value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_PROMPTACTION_LevelOrder LevelOrder_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_PROMPTACTION_LevelOrder>(ptr);
}
inline void promptAction_ActionMenuSuccessResponse_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
}
inline OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse promptAction_ActionMenuSuccessResponse_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_ActionMenuSuccessResponse value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void promptAction_CommonController_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_CommonController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_PROMPTACTION_promptAction_CommonController promptAction_CommonController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_PROMPTACTION_promptAction_CommonController>(ptr);
}
inline void promptAction_DialogController_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_DialogController value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_PROMPTACTION_promptAction_DialogController promptAction_DialogController_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_PROMPTACTION_promptAction_DialogController>(ptr);
}
inline void promptAction_ShowDialogSuccessResponse_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForIndex = value.index;
    valueSerializer.writeNumber(valueHolderForIndex);
}
inline OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse promptAction_ShowDialogSuccessResponse_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_ShowDialogSuccessResponse value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.index = static_cast<OH_Number>(valueDeserializer.readNumber());
    return value;
}
inline void promptAction_BaseDialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions value)
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_KeyboardAvoidMode>(valueHolderForKeyboardAvoidModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueHolderForLevelModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
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
inline OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions promptAction_BaseDialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_BaseDialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto autoCancelTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean autoCancelTmpBuf = {};
    autoCancelTmpBuf.tag = autoCancelTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((autoCancelTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        autoCancelTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.autoCancel = autoCancelTmpBuf;
    const auto transitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject transitionTmpBuf = {};
    transitionTmpBuf.tag = transitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((transitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        transitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.transition = transitionTmpBuf;
    const auto dialogTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject dialogTransitionTmpBuf = {};
    dialogTransitionTmpBuf.tag = dialogTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dialogTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dialogTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.dialogTransition = dialogTransitionTmpBuf;
    const auto maskTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskTransitionTmpBuf = {};
    maskTransitionTmpBuf.tag = maskTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskTransition = maskTransitionTmpBuf;
    const auto maskColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskColorTmpBuf = {};
    maskColorTmpBuf.tag = maskColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskColor = maskColorTmpBuf;
    const auto onWillDismissTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismissTmpBuf = {};
    onWillDismissTmpBuf.tag = onWillDismissTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDismissTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDismissTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))))};
    }
    value.onWillDismiss = onWillDismissTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto keyboardAvoidModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_KeyboardAvoidMode keyboardAvoidModeTmpBuf = {};
    keyboardAvoidModeTmpBuf.tag = keyboardAvoidModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_KeyboardAvoidMode>(valueDeserializer.readInt32());
    }
    value.keyboardAvoidMode = keyboardAvoidModeTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto keyboardAvoidDistanceTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject keyboardAvoidDistanceTmpBuf = {};
    keyboardAvoidDistanceTmpBuf.tag = keyboardAvoidDistanceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidDistanceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidDistanceTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.keyboardAvoidDistance = keyboardAvoidDistanceTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    const auto focusableTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean focusableTmpBuf = {};
    focusableTmpBuf.tag = focusableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((focusableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        focusableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.focusable = focusableTmpBuf;
    return value;
}
inline void promptAction_CustomDialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions value)
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_KeyboardAvoidMode>(valueHolderForKeyboardAvoidModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueHolderForLevelModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
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
inline OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions promptAction_CustomDialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_CustomDialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto autoCancelTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean autoCancelTmpBuf = {};
    autoCancelTmpBuf.tag = autoCancelTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((autoCancelTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        autoCancelTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.autoCancel = autoCancelTmpBuf;
    const auto transitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject transitionTmpBuf = {};
    transitionTmpBuf.tag = transitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((transitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        transitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.transition = transitionTmpBuf;
    const auto dialogTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject dialogTransitionTmpBuf = {};
    dialogTransitionTmpBuf.tag = dialogTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dialogTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dialogTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.dialogTransition = dialogTransitionTmpBuf;
    const auto maskTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskTransitionTmpBuf = {};
    maskTransitionTmpBuf.tag = maskTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskTransition = maskTransitionTmpBuf;
    const auto maskColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskColorTmpBuf = {};
    maskColorTmpBuf.tag = maskColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskColor = maskColorTmpBuf;
    const auto onWillDismissTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismissTmpBuf = {};
    onWillDismissTmpBuf.tag = onWillDismissTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDismissTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDismissTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))))};
    }
    value.onWillDismiss = onWillDismissTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto keyboardAvoidModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_KeyboardAvoidMode keyboardAvoidModeTmpBuf = {};
    keyboardAvoidModeTmpBuf.tag = keyboardAvoidModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_KeyboardAvoidMode>(valueDeserializer.readInt32());
    }
    value.keyboardAvoidMode = keyboardAvoidModeTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto keyboardAvoidDistanceTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject keyboardAvoidDistanceTmpBuf = {};
    keyboardAvoidDistanceTmpBuf.tag = keyboardAvoidDistanceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidDistanceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidDistanceTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.keyboardAvoidDistance = keyboardAvoidDistanceTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    const auto focusableTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean focusableTmpBuf = {};
    focusableTmpBuf.tag = focusableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((focusableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        focusableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.focusable = focusableTmpBuf;
    value.builder = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto cornerRadiusTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Dimension_BorderRadiuses cornerRadiusTmpBuf = {};
    cornerRadiusTmpBuf.tag = cornerRadiusTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((cornerRadiusTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 cornerRadiusTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses cornerRadiusTmpBuf_ = {};
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
        cornerRadiusTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_Dimension_BorderRadiuses>(cornerRadiusTmpBuf_);
    }
    value.cornerRadius = cornerRadiusTmpBuf;
    const auto widthTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject widthTmpBuf = {};
    widthTmpBuf.tag = widthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((widthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        widthTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.width = widthTmpBuf;
    const auto heightTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject heightTmpBuf = {};
    heightTmpBuf.tag = heightTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((heightTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        heightTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.height = heightTmpBuf;
    const auto borderWidthTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_Dimension_EdgeWidths borderWidthTmpBuf = {};
    borderWidthTmpBuf.tag = borderWidthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderWidthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderWidthTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths borderWidthTmpBuf_ = {};
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
        borderWidthTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_Dimension_EdgeWidths>(borderWidthTmpBuf_);
    }
    value.borderWidth = borderWidthTmpBuf;
    const auto borderColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ResourceColor_EdgeColors borderColorTmpBuf = {};
    borderColorTmpBuf.tag = borderColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderColorTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors borderColorTmpBuf_ = {};
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
        borderColorTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_ResourceColor_EdgeColors>(borderColorTmpBuf_);
    }
    value.borderColor = borderColorTmpBuf;
    const auto borderStyleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_BorderStyle_EdgeStyles borderStyleTmpBuf = {};
    borderStyleTmpBuf.tag = borderStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderStyleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles borderStyleTmpBuf_ = {};
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
        borderStyleTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_BorderStyle_EdgeStyles>(borderStyleTmpBuf_);
    }
    value.borderStyle = borderStyleTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ShadowOptions_ShadowStyle shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle shadowTmpBuf_ = {};
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
        shadowTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    return value;
}
inline void promptAction_DialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_DialogOptions value)
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_KeyboardAvoidMode>(valueHolderForKeyboardAvoidModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueHolderForLevelModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
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
inline OH_OHOS_PROMPTACTION_promptAction_DialogOptions promptAction_DialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_DialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto autoCancelTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean autoCancelTmpBuf = {};
    autoCancelTmpBuf.tag = autoCancelTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((autoCancelTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        autoCancelTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.autoCancel = autoCancelTmpBuf;
    const auto transitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject transitionTmpBuf = {};
    transitionTmpBuf.tag = transitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((transitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        transitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.transition = transitionTmpBuf;
    const auto dialogTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject dialogTransitionTmpBuf = {};
    dialogTransitionTmpBuf.tag = dialogTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((dialogTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        dialogTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.dialogTransition = dialogTransitionTmpBuf;
    const auto maskTransitionTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskTransitionTmpBuf = {};
    maskTransitionTmpBuf.tag = maskTransitionTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskTransitionTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskTransitionTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskTransition = maskTransitionTmpBuf;
    const auto maskColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskColorTmpBuf = {};
    maskColorTmpBuf.tag = maskColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskColor = maskColorTmpBuf;
    const auto onWillDismissTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_DismissDialogAction_Void onWillDismissTmpBuf = {};
    onWillDismissTmpBuf.tag = onWillDismissTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDismissTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDismissTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))))};
    }
    value.onWillDismiss = onWillDismissTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto keyboardAvoidModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_KeyboardAvoidMode keyboardAvoidModeTmpBuf = {};
    keyboardAvoidModeTmpBuf.tag = keyboardAvoidModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_KeyboardAvoidMode>(valueDeserializer.readInt32());
    }
    value.keyboardAvoidMode = keyboardAvoidModeTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto keyboardAvoidDistanceTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject keyboardAvoidDistanceTmpBuf = {};
    keyboardAvoidDistanceTmpBuf.tag = keyboardAvoidDistanceTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((keyboardAvoidDistanceTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        keyboardAvoidDistanceTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.keyboardAvoidDistance = keyboardAvoidDistanceTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    const auto focusableTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean focusableTmpBuf = {};
    focusableTmpBuf.tag = focusableTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((focusableTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        focusableTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.focusable = focusableTmpBuf;
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto cornerRadiusTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsCornerRadius cornerRadiusTmpBuf = {};
    cornerRadiusTmpBuf.tag = cornerRadiusTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((cornerRadiusTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 cornerRadiusTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius cornerRadiusTmpBuf_ = {};
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
        cornerRadiusTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_DialogOptionsCornerRadius>(cornerRadiusTmpBuf_);
    }
    value.cornerRadius = cornerRadiusTmpBuf;
    const auto widthTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject widthTmpBuf = {};
    widthTmpBuf.tag = widthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((widthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        widthTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.width = widthTmpBuf;
    const auto heightTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject heightTmpBuf = {};
    heightTmpBuf.tag = heightTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((heightTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        heightTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.height = heightTmpBuf;
    const auto borderWidthTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsBorderWidth borderWidthTmpBuf = {};
    borderWidthTmpBuf.tag = borderWidthTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderWidthTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderWidthTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth borderWidthTmpBuf_ = {};
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
        borderWidthTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_DialogOptionsBorderWidth>(borderWidthTmpBuf_);
    }
    value.borderWidth = borderWidthTmpBuf;
    const auto borderColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsBorderColor borderColorTmpBuf = {};
    borderColorTmpBuf.tag = borderColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderColorTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_DialogOptionsBorderColor borderColorTmpBuf_ = {};
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
        borderColorTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_DialogOptionsBorderColor>(borderColorTmpBuf_);
    }
    value.borderColor = borderColorTmpBuf;
    const auto borderStyleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsBorderStyle borderStyleTmpBuf = {};
    borderStyleTmpBuf.tag = borderStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((borderStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 borderStyleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle borderStyleTmpBuf_ = {};
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
        borderStyleTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_DialogOptionsBorderStyle>(borderStyleTmpBuf_);
    }
    value.borderStyle = borderStyleTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_DialogOptionsShadow shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_DialogOptionsShadow shadowTmpBuf_ = {};
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
        shadowTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_DialogOptionsShadow>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    return value;
}
inline void promptAction_Button_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_Button value)
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
inline OH_OHOS_PROMPTACTION_promptAction_Button promptAction_Button_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_Button value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 textTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_PROMPTACTION_Union_String_Resource textTmpBuf = {};
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
    value.text = static_cast<OH_OHOS_PROMPTACTION_Union_String_Resource>(textTmpBuf);
    const OH_Int8 colorTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_PROMPTACTION_Union_String_Resource colorTmpBuf = {};
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
    value.color = static_cast<OH_OHOS_PROMPTACTION_Union_String_Resource>(colorTmpBuf);
    const auto primaryTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean primaryTmpBuf = {};
    primaryTmpBuf.tag = primaryTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((primaryTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        primaryTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.primary = primaryTmpBuf;
    return value;
}
inline void promptAction_ShowDialogOptions_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions value)
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
            const OH_OHOS_PROMPTACTION_promptAction_Button valueHolderForButtonsTmpValueTmpElement = valueHolderForButtonsTmpValue.array[valueHolderForButtonsTmpValueCounterI];
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueHolderForLevelModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
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
inline OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions promptAction_ShowDialogOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_ShowDialogOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto titleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Resource titleTmpBuf = {};
    titleTmpBuf.tag = titleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((titleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 titleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_String_Resource titleTmpBuf_ = {};
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
        titleTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_String_Resource>(titleTmpBuf_);
    }
    value.title = titleTmpBuf;
    const auto messageTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Resource messageTmpBuf = {};
    messageTmpBuf.tag = messageTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((messageTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 messageTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_String_Resource messageTmpBuf_ = {};
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
        messageTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_String_Resource>(messageTmpBuf_);
    }
    value.message = messageTmpBuf;
    const auto buttonsTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
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
    const auto maskRectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject maskRectTmpBuf = {};
    maskRectTmpBuf.tag = maskRectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((maskRectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        maskRectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.maskRect = maskRectTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    const auto backgroundBlurStyleOptionsTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleOptionsTmpBuf = {};
    backgroundBlurStyleOptionsTmpBuf.tag = backgroundBlurStyleOptionsTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleOptionsTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleOptionsTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyleOptions = backgroundBlurStyleOptionsTmpBuf;
    const auto backgroundEffectTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundEffectTmpBuf = {};
    backgroundEffectTmpBuf.tag = backgroundEffectTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundEffectTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundEffectTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundEffect = backgroundEffectTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ShadowOptions_ShadowStyle shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle shadowTmpBuf_ = {};
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
        shadowTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    const auto onDidAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidAppearTmpBuf = {};
    onDidAppearTmpBuf.tag = onDidAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidAppear = onDidAppearTmpBuf;
    const auto onDidDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onDidDisappearTmpBuf = {};
    onDidDisappearTmpBuf.tag = onDidDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onDidDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onDidDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onDidDisappear = onDidDisappearTmpBuf;
    const auto onWillAppearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillAppearTmpBuf = {};
    onWillAppearTmpBuf.tag = onWillAppearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillAppearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillAppearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillAppear = onWillAppearTmpBuf;
    const auto onWillDisappearTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_OHOS_PROMPTACTION_promptAction_Callback_Void onWillDisappearTmpBuf = {};
    onWillDisappearTmpBuf.tag = onWillDisappearTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((onWillDisappearTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        onWillDisappearTmpBuf.value = {valueDeserializer.readCallbackResource(), reinterpret_cast<void(*)(const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_Void)))), reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(valueDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))))};
    }
    value.onWillDisappear = onWillDisappearTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    const auto levelOrderTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelOrder levelOrderTmpBuf = {};
    levelOrderTmpBuf.tag = levelOrderTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelOrderTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelOrderTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelOrder>(LevelOrder_serializer::read(valueDeserializer));
    }
    value.levelOrder = levelOrderTmpBuf;
    return value;
}
inline void promptAction_ShowToastOptions_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions value)
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_promptAction_ToastShowMode>(valueHolderForShowModeTmpValue));
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
inline OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions promptAction_ShowToastOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_ShowToastOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const OH_Int8 messageTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_PROMPTACTION_Union_String_Resource messageTmpBuf = {};
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
    value.message = static_cast<OH_OHOS_PROMPTACTION_Union_String_Resource>(messageTmpBuf);
    const auto durationTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number durationTmpBuf = {};
    durationTmpBuf.tag = durationTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((durationTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        durationTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.duration = durationTmpBuf;
    const auto bottomTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Number bottomTmpBuf = {};
    bottomTmpBuf.tag = bottomTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((bottomTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 bottomTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_String_Number bottomTmpBuf_ = {};
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
        bottomTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_String_Number>(bottomTmpBuf_);
    }
    value.bottom = bottomTmpBuf;
    const auto showModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_promptAction_ToastShowMode showModeTmpBuf = {};
    showModeTmpBuf.tag = showModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_promptAction_ToastShowMode>(valueDeserializer.readInt32());
    }
    value.showMode = showModeTmpBuf;
    const auto alignmentTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject alignmentTmpBuf = {};
    alignmentTmpBuf.tag = alignmentTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((alignmentTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        alignmentTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.alignment = alignmentTmpBuf;
    const auto offsetTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject offsetTmpBuf = {};
    offsetTmpBuf.tag = offsetTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((offsetTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        offsetTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.offset = offsetTmpBuf;
    const auto backgroundColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundColorTmpBuf = {};
    backgroundColorTmpBuf.tag = backgroundColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundColor = backgroundColorTmpBuf;
    const auto textColorTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject textColorTmpBuf = {};
    textColorTmpBuf.tag = textColorTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((textColorTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        textColorTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.textColor = textColorTmpBuf;
    const auto backgroundBlurStyleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject backgroundBlurStyleTmpBuf = {};
    backgroundBlurStyleTmpBuf.tag = backgroundBlurStyleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((backgroundBlurStyleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        backgroundBlurStyleTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.backgroundBlurStyle = backgroundBlurStyleTmpBuf;
    const auto shadowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_ShadowOptions_ShadowStyle shadowTmpBuf = {};
    shadowTmpBuf.tag = shadowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((shadowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 shadowTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle shadowTmpBuf_ = {};
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
        shadowTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_ShadowOptions_ShadowStyle>(shadowTmpBuf_);
    }
    value.shadow = shadowTmpBuf;
    const auto enableHoverModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean enableHoverModeTmpBuf = {};
    enableHoverModeTmpBuf.tag = enableHoverModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((enableHoverModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        enableHoverModeTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.enableHoverMode = enableHoverModeTmpBuf;
    const auto hoverModeAreaTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_CustomObject hoverModeAreaTmpBuf = {};
    hoverModeAreaTmpBuf.tag = hoverModeAreaTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((hoverModeAreaTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        hoverModeAreaTmpBuf.value = static_cast<OH_CustomObject>(valueDeserializer.readCustomObject("object"));
    }
    value.hoverModeArea = hoverModeAreaTmpBuf;
    return value;
}
inline void promptAction_ActionMenuOptions_serializer::write(SerializerBase& buffer, OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions value)
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueHolderForLevelModeTmpValue));
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
        valueSerializer.writeInt32(static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueHolderForImmersiveModeTmpValue));
    } else {
        valueSerializer.writeInt8(INTEROP_RUNTIME_UNDEFINED);
    }
}
inline OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions promptAction_ActionMenuOptions_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_PROMPTACTION_promptAction_ActionMenuOptions value = {};
    DeserializerBase& valueDeserializer = buffer;
    const auto titleTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Union_String_Resource titleTmpBuf = {};
    titleTmpBuf.tag = titleTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((titleTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        const OH_Int8 titleTmpBuf_UnionSelector = valueDeserializer.readInt8();
        OH_OHOS_PROMPTACTION_Union_String_Resource titleTmpBuf_ = {};
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
        titleTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_Union_String_Resource>(titleTmpBuf_);
    }
    value.title = titleTmpBuf;
    const OH_Int8 buttonsTmpBufUnionSelector = valueDeserializer.readInt8();
    OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons buttonsTmpBuf = {};
    buttonsTmpBuf.selector = buttonsTmpBufUnionSelector;
    if (buttonsTmpBufUnionSelector == 0) {
        buttonsTmpBuf.selector = 0;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionSingleButton buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        buttonsTmpBuf.value0 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 1) {
        buttonsTmpBuf.selector = 1;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionDoubleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        buttonsTmpBuf.value1 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 2) {
        buttonsTmpBuf.selector = 2;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionTripleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        buttonsTmpBuf.value2 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 3) {
        buttonsTmpBuf.selector = 3;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionQuadrupleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        const auto buttonsTmpBufBufUValue3TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue3TempBuf = {};
        buttonsTmpBufBufUValue3TempBuf.tag = buttonsTmpBufBufUValue3TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue3TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue3TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value3 = buttonsTmpBufBufUValue3TempBuf;
        buttonsTmpBuf.value3 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 4) {
        buttonsTmpBuf.selector = 4;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionQuintupleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        const auto buttonsTmpBufBufUValue3TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue3TempBuf = {};
        buttonsTmpBufBufUValue3TempBuf.tag = buttonsTmpBufBufUValue3TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue3TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue3TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value3 = buttonsTmpBufBufUValue3TempBuf;
        const auto buttonsTmpBufBufUValue4TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue4TempBuf = {};
        buttonsTmpBufBufUValue4TempBuf.tag = buttonsTmpBufBufUValue4TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue4TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue4TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value4 = buttonsTmpBufBufUValue4TempBuf;
        buttonsTmpBuf.value4 = buttonsTmpBufBufU;
    } else if (buttonsTmpBufUnionSelector == 5) {
        buttonsTmpBuf.selector = 5;
        OH_OHOS_PROMPTACTION_promptAction_PromptActionSextupleButtons buttonsTmpBufBufU = {};
        buttonsTmpBufBufU.value0 = promptAction_Button_serializer::read(valueDeserializer);
        const auto buttonsTmpBufBufUValue1TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue1TempBuf = {};
        buttonsTmpBufBufUValue1TempBuf.tag = buttonsTmpBufBufUValue1TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue1TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue1TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value1 = buttonsTmpBufBufUValue1TempBuf;
        const auto buttonsTmpBufBufUValue2TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue2TempBuf = {};
        buttonsTmpBufBufUValue2TempBuf.tag = buttonsTmpBufBufUValue2TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue2TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue2TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value2 = buttonsTmpBufBufUValue2TempBuf;
        const auto buttonsTmpBufBufUValue3TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue3TempBuf = {};
        buttonsTmpBufBufUValue3TempBuf.tag = buttonsTmpBufBufUValue3TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue3TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue3TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value3 = buttonsTmpBufBufUValue3TempBuf;
        const auto buttonsTmpBufBufUValue4TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
        Opt_promptAction_Button buttonsTmpBufBufUValue4TempBuf = {};
        buttonsTmpBufBufUValue4TempBuf.tag = buttonsTmpBufBufUValue4TempBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
        if ((buttonsTmpBufBufUValue4TempBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
            buttonsTmpBufBufUValue4TempBuf.value = promptAction_Button_serializer::read(valueDeserializer);
        }
        buttonsTmpBufBufU.value4 = buttonsTmpBufBufUValue4TempBuf;
        const auto buttonsTmpBufBufUValue5TempBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
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
    value.buttons = static_cast<OH_OHOS_PROMPTACTION_Union_PromptActionSingleButton_PromptActionDoubleButtons_PromptActionTripleButtons_PromptActionQuadrupleButtons_PromptActionQuintupleButtons_PromptActionSextupleButtons>(buttonsTmpBuf);
    const auto showInSubWindowTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean showInSubWindowTmpBuf = {};
    showInSubWindowTmpBuf.tag = showInSubWindowTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((showInSubWindowTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        showInSubWindowTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.showInSubWindow = showInSubWindowTmpBuf;
    const auto isModalTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Boolean isModalTmpBuf = {};
    isModalTmpBuf.tag = isModalTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((isModalTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        isModalTmpBuf.value = valueDeserializer.readBoolean();
    }
    value.isModal = isModalTmpBuf;
    const auto levelModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_LevelMode levelModeTmpBuf = {};
    levelModeTmpBuf.tag = levelModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_LevelMode>(valueDeserializer.readInt32());
    }
    value.levelMode = levelModeTmpBuf;
    const auto levelUniqueIdTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_Number levelUniqueIdTmpBuf = {};
    levelUniqueIdTmpBuf.tag = levelUniqueIdTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((levelUniqueIdTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        levelUniqueIdTmpBuf.value = static_cast<OH_Number>(valueDeserializer.readNumber());
    }
    value.levelUniqueId = levelUniqueIdTmpBuf;
    const auto immersiveModeTmpBuf_runtimeType = static_cast<OH_OHOS_PROMPTACTION_RuntimeType>(valueDeserializer.readInt8());
    Opt_ImmersiveMode immersiveModeTmpBuf = {};
    immersiveModeTmpBuf.tag = immersiveModeTmpBuf_runtimeType == INTEROP_RUNTIME_UNDEFINED ? INTEROP_TAG_UNDEFINED : INTEROP_TAG_OBJECT;
    if ((immersiveModeTmpBuf_runtimeType) != (INTEROP_RUNTIME_UNDEFINED)) {
        immersiveModeTmpBuf.value = static_cast<OH_OHOS_PROMPTACTION_ImmersiveMode>(valueDeserializer.readInt32());
    }
    value.immersiveMode = immersiveModeTmpBuf;
    return value;
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_PROMPTACTION_API* GetOH_OHOS_PROMPTACTION_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_PROMPTACTION_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_PROMPTACTION_APIKind::OH_OHOS_PROMPTACTION_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_LevelOrder_construct() {
        return GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->LevelOrder()->construct();
}
KOALA_INTEROP_DIRECT_0(LevelOrder_construct, OH_NativePointer)
OH_NativePointer impl_LevelOrder_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->LevelOrder()->destruct;
}
KOALA_INTEROP_DIRECT_0(LevelOrder_getFinalizer, OH_NativePointer)
OH_NativePointer impl_LevelOrder_clamp(KInteropNumber order) {
        return GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->LevelOrder()->clamp((const OH_Number*) (&order));
}
KOALA_INTEROP_DIRECT_1(LevelOrder_clamp, OH_NativePointer, KInteropNumber)
OH_Number impl_LevelOrder_getOrder(OH_NativePointer thisPtr) {
        return GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->LevelOrder()->getOrder(thisPtr);
}
KOALA_INTEROP_DIRECT_1(LevelOrder_getOrder, KInteropNumber, OH_NativePointer)
OH_NativePointer impl_promptAction_CommonController_construct() {
        return GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->PromptAction_CommonController()->construct();
}
KOALA_INTEROP_DIRECT_0(promptAction_CommonController_construct, OH_NativePointer)
OH_NativePointer impl_promptAction_CommonController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->PromptAction_CommonController()->destruct;
}
KOALA_INTEROP_DIRECT_0(promptAction_CommonController_getFinalizer, OH_NativePointer)
void impl_promptAction_CommonController_close(OH_NativePointer thisPtr) {
        GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->PromptAction_CommonController()->close(thisPtr);
}
KOALA_INTEROP_DIRECT_V1(promptAction_CommonController_close, OH_NativePointer)
OH_NativePointer impl_promptAction_DialogController_construct() {
        return GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->PromptAction_DialogController()->construct();
}
KOALA_INTEROP_DIRECT_0(promptAction_DialogController_construct, OH_NativePointer)
OH_NativePointer impl_promptAction_DialogController_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_PROMPTACTION_API(OHOS_PROMPTACTION_API_VERSION)->PromptAction_DialogController()->destruct;
}
KOALA_INTEROP_DIRECT_0(promptAction_DialogController_getFinalizer, OH_NativePointer)
void deserializeAndCallCallback_DismissDialogAction_Void(KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 _resourceId = thisDeserializer.readInt32();
    const auto _call = reinterpret_cast<void(*)(const OH_Int32 resourceId, const OH_CustomObject value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCaller(Kind_Callback_DismissDialogAction_Void))));
    thisDeserializer.readPointer();
    OH_CustomObject value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
    _call(_resourceId, value0);
}
void deserializeAndCallSyncCallback_DismissDialogAction_Void(OH_OHOS_PROMPTACTION_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value0)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_DismissDialogAction_Void))));
    OH_CustomObject value0 = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));
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
void deserializeAndCallSyncCallback_Void(OH_OHOS_PROMPTACTION_VMContext vmContext, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    DeserializerBase thisDeserializer = DeserializerBase(thisArray, thisLength);
    const OH_Int32 resourceId = thisDeserializer.readInt32();
    thisDeserializer.readPointer();
    const auto callSyncMethod = reinterpret_cast<void(*)(OH_OHOS_PROMPTACTION_VMContext vmContext, const OH_Int32 resourceId)>(thisDeserializer.readPointerOrDefault(reinterpret_cast<OH_NativePointer>(getManagedCallbackCallerSync(Kind_Callback_Void))));
    callSyncMethod(vmContext, resourceId);
}
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (static_cast<CallbackKind>(kind)) {
        case Kind_Callback_DismissDialogAction_Void: return deserializeAndCallCallback_DismissDialogAction_Void(thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallCallback_Void(thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_PROMPTACTION_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    switch (kind) {
        case Kind_Callback_DismissDialogAction_Void: return deserializeAndCallSyncCallback_DismissDialogAction_Void(vmContext, thisArray, thisLength);
        case Kind_Callback_Void: return deserializeAndCallSyncCallback_Void(vmContext, thisArray, thisLength);
    }
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallbackSync, setCallbackCallerSync(10, static_cast<Callback_Caller_Sync_t>(deserializeAndCallCallbackSync)))
void callManagedCallback_DismissDialogAction_Void(OH_Int32 resourceId, OH_CustomObject value0)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_PROMPTACTION_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_DismissDialogAction_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", value0);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_DismissDialogAction_VoidSync(OH_OHOS_PROMPTACTION_VMContext vmContext, OH_Int32 resourceId, OH_CustomObject value0)
{
    uint8_t dataBuffer[4096];
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&dataBuffer, sizeof(dataBuffer), nullptr);
    argsSerializer.writeInt32(10);
    argsSerializer.writeInt32(Kind_Callback_DismissDialogAction_Void);
    argsSerializer.writeInt32(resourceId);
    argsSerializer.writeCustomObject("object", value0);
    KOALA_INTEROP_CALL_VOID(vmContext, 1, sizeof(dataBuffer), dataBuffer);
}
void callManagedCallback_Void(OH_Int32 resourceId)
{
    CallbackBuffer callbackBuffer = {{}, {}};
    const OH_OHOS_PROMPTACTION_CallbackResource callbackResourceSelf = {resourceId, holdManagedCallbackResource, releaseManagedCallbackResource};
    callbackBuffer.resourceHolder.holdCallbackResource(&callbackResourceSelf);
    SerializerBase argsSerializer = SerializerBase((KSerializerBuffer)&(callbackBuffer.buffer), sizeof(callbackBuffer.buffer), &(callbackBuffer.resourceHolder));
    argsSerializer.writeInt32(Kind_Callback_Void);
    argsSerializer.writeInt32(resourceId);
    enqueueCallback(10, &callbackBuffer);
}
void callManagedCallback_VoidSync(OH_OHOS_PROMPTACTION_VMContext vmContext, OH_Int32 resourceId)
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
        case Kind_Callback_DismissDialogAction_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_DismissDialogAction_Void);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_Void);
    }
    return nullptr;
}
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind)
{
    switch (kind) {
        case Kind_Callback_DismissDialogAction_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_DismissDialogAction_VoidSync);
        case Kind_Callback_Void: return reinterpret_cast<OH_NativePointer>(callManagedCallback_VoidSync);
    }
    return nullptr;
}