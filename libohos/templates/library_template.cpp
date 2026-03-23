/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

#include <tuple>
#include <string>

#include "interop-types.h"
#include "dynamic-loader.h"
#include "interop-logging.h"
#include "interop-utils.h"

%ANY_API%
%GENERIC_SERVICE_API%

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
        }
    }
    return nullptr;
}

static const int API_KIND_MAX = 100;
static const OH_AnyAPI* impls[API_KIND_MAX + 1] = { 0 };
const char* GET_ARK_ANY_API_FUNC_NAME = "%CPP_PREFIX%GetArkAnyAPI";

#ifdef KOALA_LIBACE_LINKED
extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version);
#endif

namespace {
void ReportMsg(std::string* result, const std::string& msg, bool isError = false) {
    if (result) {
        *result = msg;
    } else if (isError) {
        LOGE("%s", msg.c_str());
    } else {
        LOGI("%s", msg.c_str());
    }
}

const OH_AnyAPI* GetImpl(int kind, int version, std::string* result) {
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
        long long value = strtoll(envValue, nullptr, 16);
        if (value != 0) {
            getAPI = reinterpret_cast<GetAPI_t>(static_cast<uintptr_t>(value));
        }
    }
    if (getAPI == nullptr) {
        void* module = FindModule(kind);
        if (!module) {
            ReportMsg(result, "Cannot find dynamic module");
            return nullptr;
        }
        getAPI = reinterpret_cast<GetAPI_t>(findSymbol(module, GET_ARK_ANY_API_FUNC_NAME));
        if (!getAPI) {
            ReportMsg(result, std::string("Cannot find ") + GET_ARK_ANY_API_FUNC_NAME, true);
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
        ReportMsg(result, "getAPI() returned null");
        return nullptr;
    }
    if (impl->version != version) {
        char buffer[256];
        interop_snprintf(buffer, sizeof(buffer), "FATAL: API version mismatch for API %d: expected %d got %d",
            kind, version, impl->version);
        ReportMsg(result, buffer, true);
        return nullptr;
    }
    return impl;
}

}  // namespace

const OH_AnyAPI* GetAnyImpl(int kind, int version, std::string* result) {
    if (kind > API_KIND_MAX) {
        INTEROP_FATAL("Try to get api with kind more than expected: kind=%d, max=%d", kind, API_KIND_MAX);
    }
    if (!impls[kind]) {
        const OH_AnyAPI* impl = GetImpl(kind, version, result);
        if (impl) {
            impls[kind] = impl;
        }
    }
    return impls[kind];
}
