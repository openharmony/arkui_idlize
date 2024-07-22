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

static bool registerNatives(EtsEnv *env, ets_class clazz)
{
    EtsExports *exports = EtsExports::getInstance();
    auto &impls = exports->getImpls();
    size_t numMethods = impls.size();
    EtsNativeMethod *fastMethods = new EtsNativeMethod[numMethods];
    EtsNativeMethod *slowMethods = new EtsNativeMethod[numMethods];
    int numFastMethods = 0;
    int numSlowMethods = 0;
    for (size_t i = 0; i < numMethods; i++)
    {
        if ((std::get<3>(impls[i]) & ETS_SLOW_NATIVE_FLAG) == 0) {
            // Fill in native methods table!
            fastMethods[numFastMethods].name = std::get<0>(impls[i]).c_str();
            fastMethods[numFastMethods].signature = nullptr; // std::get<1>(impls[i]).c_str();
            fastMethods[numFastMethods].func = std::get<2>(impls[i]);
            numFastMethods++;
        } else {
            slowMethods[numSlowMethods].name = std::get<0>(impls[i]).c_str();
            slowMethods[numSlowMethods].signature = nullptr; // std::get<1>(impls[i]).c_str();
            slowMethods[numSlowMethods].func = std::get<2>(impls[i]);
            numSlowMethods++;
        }
    }
    fprintf(stderr, "%d slow %d fast\n", numSlowMethods, numFastMethods);
    bool result = true;
    if (numSlowMethods > 0)
        result &= (env->RegisterNatives(clazz, slowMethods, numSlowMethods) >= 0);
    if (numFastMethods > 0)
        result &= (env->RegisterNatives(clazz, fastMethods, numFastMethods) >= 0);
    return result;
}

extern "C" ETS_EXPORT ets_int ETS_CALL EtsNapiOnLoad(EtsEnv *env) {
    if (!registerNatives(env, env->FindClass("NativeModule/NativeModule"))) return -1;
    setKoalaEtsNapiCallbackDispatcher(
        env,
        "NativeModule/NativeModule",
        "callCallbackFromNative",
        "I[BI:I"
    );
    return ETS_NAPI_VERSION_1_0;
}
