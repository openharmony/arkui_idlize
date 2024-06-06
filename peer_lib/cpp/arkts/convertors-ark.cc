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

#include "convertors-ark.h"

static int registerNativeMethods(EtsEnv *env, ets_class clazz, EtsNativeMethod *methods, int countMethods) {
    if (clazz == nullptr) {
        fprintf(stderr, "null class\n");
        return ETS_FALSE;
    }
    if (env->RegisterNatives(clazz, methods, countMethods) < 0) return ETS_FALSE;
    return ETS_TRUE;
}

static bool registerNatives(EtsEnv *env, ets_class clazz)
{
    EtsExports *exports = EtsExports::getInstance();
    auto &impls = exports->getImpls();
    size_t numMethods = impls.size();
    EtsNativeMethod *methods = new EtsNativeMethod[numMethods];
    for (size_t i = 0; i < numMethods; i++)
    {        
        // Fill in native methods table!
        methods[i].name = std::get<0>(impls[i]).c_str();
        // TODO: convert signatures properly.
        methods[i].signature = nullptr; // std::get<1>(impls[i]).c_str();
        methods[i].func = std::get<2>(impls[i]);
    }
    return registerNativeMethods(env, clazz, methods, numMethods);
}

// TODO: EtsNapiOnLoad() hook shall be used to register native, but unfortunately, env->FindClass("NativeModule.NativeModule")
// returns null.
extern "C" ETS_EXPORT void ETS_NativeModule_NativeModule_init__(EtsEnv *env, ets_class clazz) {
    registerNatives(env, clazz);
}

/*
extern "C" ETS_EXPORT ets_int ETS_CALL EtsNapiOnLoad(EtsEnv *env) {
    if (!registerNatives(env, env->FindClass("NativeModule.NativeModule"))) return -1;
    return ETS_NAPI_VERSION_1_0;
} */
