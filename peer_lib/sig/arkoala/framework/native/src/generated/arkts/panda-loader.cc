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

#include "common-interop.h"
#include "dynamic-loader.h"

typedef void* (*InitVirtualMachineFunc)(int kind, const char* managedPath, const char* nativePath, void** env);
typedef int (*RunVirtualMachineFunc)(void* env, KInt what);

// Singleton for now.
struct VMControl {
    void* vm;
    RunVirtualMachineFunc runner;
} g_VM;

KNativePointer impl_LoadVirtualMachine(const KStringPtr& libPath, const KStringPtr& classPath, KInt kind) {
    auto lib = std::string(libPath.c_str()) + "/" + libName("panda");
    fprintf(stderr, "would load from %s %s: %d\n", libPath.c_str(), lib.c_str(), kind);
    void* handle = loadLibrary(lib);
    if (!handle) {
        fprintf(stderr, "Cannot load library %s: %s\n", lib.c_str(), libraryError());
        return nullptr;
    }
    auto initFunc = (InitVirtualMachineFunc)findSymbol(handle, "InitVirtualMachine");
    if (!initFunc) {
        fprintf(stderr, "Cannot find InitVirtualMachine in %s\n", lib.c_str());
        return nullptr;
    }
    void* env = nullptr;
    g_VM.vm = initFunc(kind, classPath.c_str(), libPath.c_str(), &env);
    g_VM.runner = (RunVirtualMachineFunc)findSymbol(handle, "RunVirtualMachine");
    if (!g_VM.runner) {
        fprintf(stderr, "Cannot find RunVirtualMachine in %s\n", lib.c_str());
        return nullptr;
    }
    return env;
}
KOALA_INTEROP_3(LoadVirtualMachine, KNativePointer, KStringPtr, KStringPtr, KInt)

KInt impl_RunVirtualMachine(KNativePointer env, KInt what) {
     return g_VM.runner(env, what);
}
KOALA_INTEROP_2(RunVirtualMachine, KInt, KNativePointer, KInt)