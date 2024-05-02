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

#ifdef KOALA_WINDOWS
#include <windows.h>
// Here we need to find module where GetArkUINodeAPI()
// function is implemented.
void* loadLibrary(const std::string& libPath) {
    return GetModuleHandle(libPath.c_str());
}

const char* libraryError() {
    return "";
}

void* findSymbol(void* library, const char* name) {
    return (void*)GetProcAddress(reinterpret_cast<HMODULE>(library), name);
}

#else
#include <dlfcn.h>

void* loadLibrary(const std::string& libPath) {
    return dlopen(libPath.c_str(), RTLD_LOCAL | RTLD_NOW);
}

const char* libraryError() {
    return dlerror();
}

void* findSymbol(void* library, const char* name) {
    return dlsym(library, name);
}

#endif
#include <stdio.h>

#include <string>

#include "etsapi.h"

// Emulator of Panda VM to simplify other platform development.

typedef ets_int ETS_CALL (*EtsNapiOnLoad_t)(EtsEnv *env);

std::string libName(const char* lib) {
    std::string result;
    result = "lib" + std::string(lib) + ".dylib";
    return result;
}

ets_int registerNatives(EtsEnv *env, ets_class cls, const EtsNativeMethod *methods, ets_int nMethods) {
    fprintf(stderr, "registerNatives: %d\n", nMethods);
    for (int i = 0; i < nMethods; i++) {
        fprintf(stderr, "registerNative: %s %s %p\n", methods[i].name, methods[i].signature, methods[i].func);
    }
    return 0;
}

ets_class dummyNativeModule = (ets_class)42;

ets_class findClass(EtsEnv *env, const char *name) {
    fprintf(stderr, "findClass: %s\n", name);
    return dummyNativeModule;
}

int main(int argc, const char** argv) {
    std::string libPath = std::string("./native/") + libName("NativeBridgeArk");
    void* lib = loadLibrary(libPath);
    if (!lib) {
        fprintf(stderr, "Cannot load library %s: %s\n", libPath.c_str(), libraryError());
        return 1;
    }
    EtsNapiOnLoad_t onLoad = reinterpret_cast<EtsNapiOnLoad_t>(findSymbol(lib, "EtsNapiOnLoad"));
    if (!onLoad) {
        fprintf(stderr, "Cannot find entry point\n");
        return 1;
    }

    EtsEnv env;
    ETS_NativeInterface* native_interface = new ETS_NativeInterface();
    native_interface->RegisterNatives = registerNatives;
    native_interface->FindClass = findClass;

    env.native_interface = native_interface;

    onLoad(&env);

    return 0;
}