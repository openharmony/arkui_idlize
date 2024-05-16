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

#ifndef COMMON_INTEROP_BASE_H
#define COMMON_INTEROP_BASE_H

#include <vector>
#include <string>

#include "interop-types.h"

#define KOALA_INTEROP_PROFILER 0

#if KOALA_INTEROP_PROFILER
#include "profiler.h"
#define KOALA_INTEROP_LOGGER(name) InteropMethodCall(#name)
#endif

#ifdef KOALA_INTEROP_LOGGER
#define KOALA_MAYBE_LOG(name) KOALA_INTEROP_LOGGER(name);
#else
#define KOALA_MAYBE_LOG(name)
#endif

template <class T> T* ptr(KNativePointer ptr) {
    return reinterpret_cast<T*>(ptr);
}

template <class T> T& ref(KNativePointer ptr) {
    return *reinterpret_cast<T*>(ptr);
}

inline KNativePointer nativePtr(void* pointer) {
    return reinterpret_cast<KNativePointer>(pointer);
}

template <class T> KNativePointer fnPtr(void (*pointer)(T*)) {
    return reinterpret_cast<KNativePointer>(pointer);
}

std::vector<KStringPtr> makeStringVector(KStringArray strArray);
std::vector<KStringPtr> makeStringVector(KNativePointerArray arr, KInt size);

// Grouped logs.
void startGroupedLog(int32_t kind);
void endGroupedLog(int32_t kind);
void appendGroupedLog(int32_t kind, const std::string& str);
const std::string& getGroupedLog(int32_t kind);
const bool needGroupedLog(int32_t kind);

#if defined KOALA_USE_NODE_VM
#include "convertors-node.h"
#elif defined KOALA_USE_JSC_VM
#include "convertors-jsc.h"
#elif KOALA_USE_ARK_VM
#include "convertors-ark.h"
#elif KOALA_USE_JAVA_VM
#include "convertors-jni.h"
#elif KOALA_WASM
#include "convertors-wasm.h"
#else
#error "One of above branches must be taken"
#endif

#endif // COMMON_INTEROP_BASE_H
