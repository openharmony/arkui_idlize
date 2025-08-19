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

#include "ohos_security_cryptoframework.h"

#define KOALA_INTEROP_MODULE OHOS_SECURITY_CRYPTOFRAMEWORKNativeModule
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_Int32& value)
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_Int32& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_Buffer& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const Opt_Buffer* value) {
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_Buffer& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_Int64& value)
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_Int64& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem& value)
{
    return INTEROP_RUNTIME_NUMBER;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem value) {
    result->append("OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem(");
    WriteToString(result, (OH_Int32) value);
    result->append(")");
}
template <>
inline void WriteToString(std::string* result, const Opt_cryptoFramework_AsyKeySpecItem* value) {
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_cryptoFramework_AsyKeySpecItem& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob* value) {
    result->append("{");
    // OH_Buffer data
    result->append(".data=");
    WriteToString(result, value->data);
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_cryptoFramework_DataBlob* value) {
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_cryptoFramework_DataBlob& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_String& value)
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_String& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_cryptoFramework_Key* value) {
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_cryptoFramework_Key& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey& value)
{
    return INTEROP_RUNTIME_OBJECT;
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey value) {
    WriteToString(result, static_cast<InteropNativePointer>(value));
}
template <>
inline void WriteToString(std::string* result, const Opt_cryptoFramework_PubKey* value) {
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_cryptoFramework_PubKey& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
template <>
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32& value)
{
    switch (value.selector) {
        case 0: return runtimeType(value.value0);
        case 1: return runtimeType(value.value1);
        case 2: return runtimeType(value.value2);
        default: INTEROP_FATAL("Bad selector in OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32: %d", value.selector);
    }
}
template <>
inline void WriteToString(std::string* result, const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32* value) {
    result->append("{");
    result->append(".selector=");
    result->append(std::to_string(value->selector));
    result->append(", ");
    // OH_Int64
    if (value->selector == 0) {
        result->append(".value0=");
        WriteToString(result, value->value0);
    }
    // OH_String
    if (value->selector == 1) {
        result->append(".value1=");
        WriteToString(result, &value->value1);
    }
    // OH_Int32
    if (value->selector == 2) {
        result->append(".value2=");
        WriteToString(result, value->value2);
    }
    result->append("}");
}
template <>
inline void WriteToString(std::string* result, const Opt_Union_Bigint_String_I32* value) {
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_Union_Bigint_String_I32& value)
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
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType runtimeType(const Opt_Object& value)
{
    return (value.tag != INTEROP_TAG_UNDEFINED) ? (INTEROP_RUNTIME_OBJECT) : (INTEROP_RUNTIME_UNDEFINED);
}
class cryptoFramework_DataBlob_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob value);
    static OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob read(DeserializerBase& buffer);
};
class cryptoFramework_Key_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key value);
    static OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key read(DeserializerBase& buffer);
};
class cryptoFramework_PubKey_serializer {
    public:
    static void write(SerializerBase& buffer, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey value);
    static OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey read(DeserializerBase& buffer);
};
inline void cryptoFramework_DataBlob_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob value)
{
    SerializerBase& valueSerializer = buffer;
    const auto valueHolderForData = value.data;
    valueSerializer.writeBuffer(valueHolderForData);
}
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob cryptoFramework_DataBlob_serializer::read(DeserializerBase& buffer)
{
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob value = {};
    DeserializerBase& valueDeserializer = buffer;
    value.data = static_cast<OH_Buffer>(valueDeserializer.readBuffer());
    return value;
}
inline void cryptoFramework_Key_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key cryptoFramework_Key_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key>(ptr);
}
inline void cryptoFramework_PubKey_serializer::write(SerializerBase& buffer, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey value)
{
    SerializerBase& valueSerializer = buffer;
    valueSerializer.writePointer(value);
}
inline OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey cryptoFramework_PubKey_serializer::read(DeserializerBase& buffer)
{
    DeserializerBase& valueDeserializer = buffer;
    OH_NativePointer ptr = valueDeserializer.readPointer();
    return static_cast<OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey>(ptr);
}
const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);
static const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API* GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(int32_t apiVersion) {
    return reinterpret_cast<const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API*>(
        GetAnyImpl(static_cast<int>(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_APIKind::OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API_KIND),
        apiVersion, nullptr));
}
OH_NativePointer impl_CommonShapeMethod_construct(OH_Int32 id, OH_Int32 flags) {
        return GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CommonShapeMethod()->construct(id, flags);
}
KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, OH_NativePointer, OH_Int32, OH_Int32)
void impl_CommonShapeMethod_setOffset(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CommonShapeMethod()->setOffset(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setFill(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CommonShapeMethod()->setFill(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, OH_NativePointer, KSerializerBuffer, int32_t)
void impl_CommonShapeMethod_setPosition(OH_NativePointer thisPtr, KSerializerBuffer thisArray, int32_t thisLength) {
        DeserializerBase thisDeserializer(thisArray, thisLength);
        OH_CustomObject valueValueTemp = static_cast<OH_CustomObject>(thisDeserializer.readCustomObject("object"));;
        GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CommonShapeMethod()->setPosition(thisPtr, static_cast<OH_CustomObject*>(&valueValueTemp));
}
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, OH_NativePointer, KSerializerBuffer, int32_t)

// Accessors

OH_NativePointer impl_cryptoFramework_Key_construct() {
        return GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_Key()->construct();
}
KOALA_INTEROP_DIRECT_0(cryptoFramework_Key_construct, OH_NativePointer)
OH_NativePointer impl_cryptoFramework_Key_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_Key()->destruct;
}
KOALA_INTEROP_DIRECT_0(cryptoFramework_Key_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_cryptoFramework_Key_getEncoded(OH_NativePointer thisPtr) {
        const auto &retValue = GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_Key()->getEncoded(thisPtr);
        SerializerBase _retSerializer {};
        cryptoFramework_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_1(cryptoFramework_Key_getEncoded, KInteropReturnBuffer, OH_NativePointer)
OH_String impl_cryptoFramework_Key_getFormat(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_Key()->getFormat(thisPtr);
}
KOALA_INTEROP_1(cryptoFramework_Key_getFormat, KStringPtr, OH_NativePointer)
OH_String impl_cryptoFramework_Key_getAlgName(OH_NativePointer thisPtr) {
        return GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_Key()->getAlgName(thisPtr);
}
KOALA_INTEROP_1(cryptoFramework_Key_getAlgName, KStringPtr, OH_NativePointer)
OH_NativePointer impl_cryptoFramework_PubKey_construct() {
        return GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_PubKey()->construct();
}
KOALA_INTEROP_DIRECT_0(cryptoFramework_PubKey_construct, OH_NativePointer)
OH_NativePointer impl_cryptoFramework_PubKey_getFinalizer() {
        return (OH_NativePointer) GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_PubKey()->destruct;
}
KOALA_INTEROP_DIRECT_0(cryptoFramework_PubKey_getFinalizer, OH_NativePointer)
KInteropReturnBuffer impl_cryptoFramework_PubKey_getAsyKeySpec(OH_NativePointer thisPtr, OH_Int32 itemType) {
        const auto &retValue = GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_PubKey()->getAsyKeySpec(thisPtr, static_cast<OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem>(itemType));
        SerializerBase _retSerializer {};
        if (retValue.selector == 0) {
            _retSerializer.writeInt8(0);
            const auto retValueForIdx0 = retValue.value0;
            _retSerializer.writeInt64(retValueForIdx0);
        } else if (retValue.selector == 1) {
            _retSerializer.writeInt8(1);
            const auto retValueForIdx1 = retValue.value1;
            _retSerializer.writeString(retValueForIdx1);
        } else if (retValue.selector == 2) {
            _retSerializer.writeInt8(2);
            const auto retValueForIdx2 = retValue.value2;
            _retSerializer.writeInt32(retValueForIdx2);
        }
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(cryptoFramework_PubKey_getAsyKeySpec, KInteropReturnBuffer, OH_NativePointer, OH_Int32)
KInteropReturnBuffer impl_cryptoFramework_PubKey_getEncodedDer(OH_NativePointer thisPtr, const KStringPtr& format) {
        const auto &retValue = GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_PubKey()->getEncodedDer(thisPtr, (const OH_String*) (&format));
        SerializerBase _retSerializer {};
        cryptoFramework_DataBlob_serializer::write(_retSerializer, retValue);
        return _retSerializer.toReturnBuffer();
}
KOALA_INTEROP_2(cryptoFramework_PubKey_getEncodedDer, KInteropReturnBuffer, OH_NativePointer, KStringPtr)
OH_String impl_cryptoFramework_PubKey_getEncodedPem(OH_NativePointer thisPtr, const KStringPtr& format) {
        return GetOH_OHOS_SECURITY_CRYPTOFRAMEWORK_API(OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION)->CryptoFramework_PubKey()->getEncodedPem(thisPtr, (const OH_String*) (&format));
}
KOALA_INTEROP_2(cryptoFramework_PubKey_getEncodedPem, KStringPtr, OH_NativePointer, KStringPtr)
void deserializeAndCallCallback(OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
{
    INTEROP_FATAL("Unknown callback kind");
}
KOALA_EXECUTE(deserializeAndCallCallback, setCallbackCaller(10, static_cast<Callback_Caller_t>(deserializeAndCallCallback)))
void deserializeAndCallCallbackSync(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_VMContext vmContext, OH_Int32 kind, KSerializerBuffer thisArray, OH_Int32 thisLength)
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