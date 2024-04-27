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

/*
export class PandaNativeModule {
    static {
        loadLibrary("PandaModule");
    }

    public native static hello(): String;

    public run(): void throws {
        if (!("Hello" == PandaNativeModule.hello())) {
            throw new Exception("ERROR: error return value from ETSNAPI");
        }
    }
}

export function main(): void {
    let a = new PandaNativeModule
    // console.log(PandaNativeModule.hello())c
    console.log('hello')
}
*/
extern "C"
{
    ETS_EXPORT ets_string ETS_CALL ETS_EtsnapiVersionHookTest_hello(EtsEnv *env, [[maybe_unused]] ets_class)
    {
        return env->NewStringUTF("Hello");
    }

    static EtsNativeMethod gMethods[] = {
        {"hello", ":Lstd/core/String;", (void *)ETS_EtsnapiVersionHookTest_hello},
    };

    static int registerNativeMethods(EtsEnv *env, const char *classname, EtsNativeMethod *methods, int countMethods)
    {
        ets_class clazz = env->FindClass(classname);
        if (clazz == nullptr)
        {
            return ETS_FALSE;
        }
        if (env->RegisterNatives(clazz, methods, countMethods) < 0)
        {
            return ETS_FALSE;
        }
        return ETS_TRUE;
    }

    static bool registerNatives(EtsEnv *env)
    {
        /*
        size_t numMethods = 0;
        EtsNativeMethod* methods = new EtsNativeMethod[numMethods];
        for (size_t i = 0; i < numMethods; i++) {
            // Fill in native methods table!
        } */
        return registerNativeMethods(env, "EtsnapiVersionHookTest", gMethods, sizeof(gMethods) / sizeof(gMethods[0]));
    }

    ETS_EXPORT ets_int ETS_CALL EtsNapiOnLoad(EtsEnv *env)
    {
        if (!registerNatives(env))
        {
            return -1;
        }
        return ETS_NAPI_VERSION_1_0;
    }

} // extern "C"
