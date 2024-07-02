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

#include "arkoala_api_generated.h"
#include "load-library.h"
#include "arkoala-logging.h"
#include "library.h"

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
