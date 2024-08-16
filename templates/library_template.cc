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

#include "arkoala-logging.h"
#include "library.h"

#include "arkoala-logging.h"
#include "arkoala_api_generated.h"

#if defined(KOALA_WINDOWS)

#include <windows.h>
// Here we need to find module where GetArkAnyAPI()
// function is implemented.
void* FindModule()
{
#if KOALA_USE_LIBACE
    HMODULE result = nullptr;
    const char libname[] = "./native/ace_compatible_mock.dll";
    result = LoadLibraryA(libname);
    if (result) {
        return result;
    }
    LOG("Cannot find module!");
    return nullptr;
#else
     return (void*)1;
#endif
}
extern "C" void* GENERATED_GetArkAnyAPI(int kind, int version);

void* FindFunction(void* library, const char* name)
{
#if KOALA_USE_LIBACE
    return (void*)GetProcAddress(reinterpret_cast<HMODULE>(library), TEXT(name));
#else
    return (void*)&GENERATED_GetArkAnyAPI;
#endif
}

#elif defined(KOALA_OHOS) || defined(KOALA_LINUX) || defined(KOALA_MACOS)

#include <dlfcn.h>
void* FindModule()
{
#if KOALA_USE_LIBACE
#if defined(KOALA_OHOS)
#if defined(__aarch64__)
    const char libname[] = "/system/lib64/module/libace_compatible_mock.so";
#elif defined(__arm__)
    const char libname[] = "/system/lib/module/libace_compatible_mock.so";
#endif
#else
    const char libname[] = "./native/libace_compatible_mock.so";
#endif
    void* result = dlopen(libname, RTLD_LAZY | RTLD_LOCAL);
    if (result) {
        return result;
    }
    LOGE("Cannot load libace: %s", dlerror());
    return nullptr;
#else
    return (void*)1;
#endif
}

extern "C" void* GENERATED_GetArkAnyAPI(int kind, int version);
void* FindFunction(void* library, const char* name)
{
#if KOALA_USE_LIBACE
    return dlsym(library, name);
#else
    return (void*)&GENERATED_GetArkAnyAPI;
#endif
}

#else

#error "Unknown platform"

#endif

static %CPP_PREFIX%ArkUIAnyAPI* impls[%CPP_PREFIX%Ark_APIVariantKind::%CPP_PREFIX%COUNT] = { 0 };
const char* getArkAnyAPIFuncName = "%CPP_PREFIX%GetArkAnyAPI";

const ArkUIAnyAPI* GetAnyImpl(ArkUIAPIVariantKind kind, int version, std::string* result) {
    if (!impls[kind]) {
        %CPP_PREFIX%ArkUIAnyAPI* impl = nullptr;
        typedef %CPP_PREFIX%ArkUIAnyAPI* (*GetAPI_t)(int, int);
        GetAPI_t getAPI = nullptr;

        void* module = FindModule();
        if (!module) {
            if (result)
                *result = "Cannot find dynamic module";
            else
                LOGE("Cannot find dynamic module");
            return nullptr;
        }

        if (getAPI == nullptr) {
            getAPI = reinterpret_cast<GetAPI_t>(FindFunction(module, getArkAnyAPIFuncName));
            if (!getAPI) {
                if (result)
                    *result = std::string("Cannot find ") + getArkAnyAPIFuncName;
                else
                    LOGE("Cannot find %s", getArkAnyAPIFuncName);
                return nullptr;
            }
        }

        impl = (*getAPI)(kind, version);
        if (!impl) {
            if (result)
                *result = "getAPI() returned null";
            else
                LOGE("getAPI() returned null")
            return nullptr;
        }

        if (impl->version != version) {
            if (result) {
                char buffer[256];
                snprintf(buffer, sizeof(buffer), "FATAL: API version mismatch, expected %d got %d",
                    version, impl->version);
                *result = buffer;
            } else {
                LOGE("API version mismatch for API %d: expected %d got %d", kind, version, impl->version);
            }
            return nullptr;
        }
        impls[kind] = impl;
    }
    return reinterpret_cast<ArkUIAnyAPI*>(impls[kind]);
}
