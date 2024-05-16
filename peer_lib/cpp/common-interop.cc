/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

#include <string>
#include <vector>
#include "common-interop.h"
#include "ArgDeserializerBase.h"

CustomDeserializer* ArgDeserializerBase::customDeserializers = nullptr;

#if KOALA_INTEROP_PROFILER
#include "profiler.h"

InteropProfiler* InteropProfiler::_instance = nullptr;

#endif

using std::string;

#ifdef KOALA_NAPI
static Napi::Reference<Napi::Function> g_koalaNapiCallbackDispatcher;

void impl_SetCallbackDispatcher(Napi::Object dispatcher) {
    g_koalaNapiCallbackDispatcher = Napi::Reference<Napi::Function>::New(dispatcher.As<Napi::Function>(), 1);
}
KOALA_INTEROP_V1(SetCallbackDispatcher, Napi::Object)

void impl_CleanCallbackDispatcher() {
    if (!g_koalaNapiCallbackDispatcher.IsEmpty()) {
        g_koalaNapiCallbackDispatcher.Reset();
    }
}
KOALA_INTEROP_V0(CleanCallbackDispatcher)

napi_value getKoalaNapiCallbackDispatcher() {
    if (g_koalaNapiCallbackDispatcher.IsEmpty()) {
        abort();
    }
    return (napi_value)g_koalaNapiCallbackDispatcher.Value();
}
#endif

KInt impl_StringLength(KNativePointer ptr) {
    string* s = reinterpret_cast<string*>(ptr);
    return s->length();
}
KOALA_INTEROP_1(StringLength, KInt, KNativePointer)

void impl_StringData(KNativePointer ptr, KByte* bytes, KUInt size) {
    string* s = reinterpret_cast<string*>(ptr);
    if (s) memcpy(bytes, s->c_str(), size);
}
KOALA_INTEROP_V3(StringData, KNativePointer, KByte*, KUInt)

KNativePointer impl_StringMake(const KStringPtr& str) {
    return new string(str.c_str());
}
KOALA_INTEROP_1(StringMake, KNativePointer, KStringPtr)

void stringFinalizer(string* ptr) {
    delete ptr;
}
KNativePointer impl_GetStringFinalizer() {
    return fnPtr<string>(stringFinalizer);
}
KOALA_INTEROP_0(GetStringFinalizer, KNativePointer)

void impl_InvokeFinalizer(KNativePointer obj, KNativePointer finalizer) {
    auto finalizer_f = reinterpret_cast<void (*)(KNativePointer)>(finalizer);
    finalizer_f(obj);
}
KOALA_INTEROP_V2(InvokeFinalizer, KNativePointer, KNativePointer)

KInt impl_GetPtrVectorSize(KNativePointer ptr) {
    return reinterpret_cast<std::vector<void*>*>(ptr)->size();
}
KOALA_INTEROP_1(GetPtrVectorSize, KInt, KNativePointer)

KNativePointer impl_GetPtrVectorElement(KNativePointer ptr, KInt index) {
    auto vector = reinterpret_cast<std::vector<void*>*>(ptr);
    auto element = vector->at(index);
    return nativePtr(element);
}
KOALA_INTEROP_2(GetPtrVectorElement, KNativePointer, KNativePointer, KInt)

inline KUInt unpackUInt(const KByte* bytes) {
    return (bytes[0] | (bytes[1] << 8) | (bytes[2] << 16) | (bytes[3] << 24));
}

std::vector<KStringPtr> makeStringVector(KStringArray strArray) {
    if (strArray == nullptr) {
        return std::vector<KStringPtr>(0);
    }
    KUInt arraySize = unpackUInt(strArray);
    std::vector<KStringPtr> res(arraySize);
    size_t offset = sizeof(KUInt);
    for (KUInt i = 0; i < arraySize; ++i) {
        int len = unpackUInt(strArray + offset);
        res[i].assign((const char*)(strArray + offset + sizeof(KUInt)), len);
        offset += len + sizeof(KUInt);
    }
    return res;
}

std::vector<KStringPtr> makeStringVector(KNativePointerArray arr, KInt length) {
    if (arr == nullptr) {
        return std::vector<KStringPtr>(0);
    } else {
        std::vector<KStringPtr> res(length);
        char** strings = reinterpret_cast<char**>(arr);
        for (KInt i = 0; i < length; ++i) {
            const char* str = reinterpret_cast<const char*>(strings[i]);
            res[i].assign(str);
        }
        return res;
    }
}

std::vector<std::pair<std::string, bool>> groupedLogs;

void startGroupedLog(KInt index) {
    if (index < 0) return;
    if (index >= (int)groupedLogs.size()) {
        groupedLogs.resize(index + 1);
    }
    groupedLogs[index] = std::make_pair(std::string(), true);
}

void stopGroupedLog(KInt index) {
    if (index >=0 && index < (int)groupedLogs.size()) {
        groupedLogs[index].second = false;
    }
}

void appendGroupedLog(KInt index, const std::string& str) {
    groupedLogs[index].first.append(str);
}

std::string emptyString;

const std::string& getGroupedLog(int32_t index) {
    if (index >=0 && index < (int)groupedLogs.size()) {
        return groupedLogs[index].first;
    }
    return emptyString;
}

const bool needGroupedLog(int32_t index) {
    if (index >=0 && index < (int)groupedLogs.size()) {
        return groupedLogs[index].second;
    }
    return false;
}

KNativePointer impl_GetGroupedLog(KInt index) {
    return new std::string(getGroupedLog(index));
}
KOALA_INTEROP_1(GetGroupedLog, KNativePointer, KInt)

void impl_StartGroupedLog(KInt index) {
    startGroupedLog(index);
}
KOALA_INTEROP_V1(StartGroupedLog, KInt)

void impl_StopGroupedLog(KInt index) {
    stopGroupedLog(index);
}
KOALA_INTEROP_V1(StopGroupedLog, KInt)

KInt impl_TestPerfNumber(KInt value) {
    return value + 1;
}
KOALA_INTEROP_1(TestPerfNumber, KInt, KInt)

void impl_TestPerfNumberWithArray(KByte* data, KInt length) {
}
KOALA_INTEROP_V2(TestPerfNumberWithArray, KByte*, KInt)