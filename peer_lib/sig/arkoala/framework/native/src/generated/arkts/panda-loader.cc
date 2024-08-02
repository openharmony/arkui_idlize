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

struct CallbackMethod
{
    int (*CallInt)(void *env, int methodId, uint8_t *data, int dataSize);
};

CallbackMethod* g_callbacks = nullptr;

typedef void *(*InitVirtualMachineFunc)(
    int kind, const char *managedPath, const char *nativePath, void **env,
    CallbackMethod *callbacks);
typedef int (*RunVirtualMachineFunc)(void *jvmEnv, void *jsEnv, KInt what, KInt arg0);

// Singleton for now.
struct VMControl
{
    void *vm;
    RunVirtualMachineFunc runner;
} g_VM;

int CallInt(void *vmContext, int methodId, uint8_t *data, int length){
    KOALA_INTEROP_CALL_INT(vmContext, methodId, length, data);
}

KNativePointer impl_LoadVirtualMachine(
    const KStringPtr &libPath, const KStringPtr &classPath, KInt kind)
{
    auto lib = std::string(libPath.c_str()) + "/" + libName("panda");
    fprintf(stderr, "would load from %s %s: %d\n", libPath.c_str(), lib.c_str(), kind);
    void *handle = loadLibrary(lib);
    if (!handle)
    {
        fprintf(stderr, "Cannot load library %s: %s\n", lib.c_str(), libraryError());
        return nullptr;
    }
    auto initFunc = (InitVirtualMachineFunc)findSymbol(handle, "InitVirtualMachine");
    if (!initFunc)
    {
        fprintf(stderr, "Cannot find InitVirtualMachine in %s\n", lib.c_str());
        return nullptr;
    }
    void *env = nullptr;
    // Callbacks mechanism is a bit clumsy:
    // when loading VM we provide a pointer to a structure which performs callbacks in terms of
    // our VM, and VM remembers that pointer and uses it to call back into our VM.
    static CallbackMethod callbacks = { CallInt };
    g_VM.vm = initFunc(kind, classPath.c_str(), libPath.c_str(), &env, &callbacks);
    g_VM.runner = (RunVirtualMachineFunc)findSymbol(handle, "RunVirtualMachine");
    if (!g_VM.runner)
    {
        fprintf(stderr, "Cannot find RunVirtualMachine in %s\n", lib.c_str());
        return nullptr;
    }
    return env;
}
KOALA_INTEROP_3(LoadVirtualMachine, KNativePointer, KStringPtr, KStringPtr, KInt)

KInt impl_RunVirtualMachine(KVMContext vmContext, KNativePointer env, KInt what, KInt arg0)
{
    return g_VM.runner(env, vmContext, what, arg0);
}
KOALA_INTEROP_CTX_3(RunVirtualMachine, KInt, KNativePointer, KInt, KInt)

void impl_SetCallbackMethod(KNativePointer method) {
    g_callbacks = (CallbackMethod*)method;
}
KOALA_INTEROP_V1(SetCallbackMethod, KNativePointer)

KInt impl_CallExternalAPI(KNativePointer env, KInt what, KByte *data, KInt length)
{
    return g_callbacks ? g_callbacks->CallInt(env, what, data, length) : -1;
}
KOALA_INTEROP_4(CallExternalAPI, KInt, KNativePointer, KInt, KByte*, KInt)
