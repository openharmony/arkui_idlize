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

#include "convertors-ets.h"

uint8_t* getUInt8Elements(EtsEnv *env, ets_byteArray v)
{
//    return reinterpret_cast<uint8_t *>(env->GetByteArrayElements(v, nullptr));
    return nullptr;
}

int8_t* getInt8Elements(EtsEnv *env, ets_byteArray v)
{
    // return env->GetByteArrayElements(v, nullptr);
    return nullptr;
}

uint16_t* getUInt16Elements(EtsEnv *env, ets_charArray v)
{
    // return env->GetCharArrayElements(v, nullptr);
    return nullptr;
}

int16_t* getInt16Elements(EtsEnv *env, ets_shortArray v)
{
    // return env->GetShortArrayElements(v, nullptr);
    return nullptr;
}

uint32_t* getUInt32Elements(EtsEnv *env, ets_intArray v)
{
    // return reinterpret_cast<uint32_t *>(env->GetIntArrayElements(v, nullptr));
    return nullptr;
}

int32_t* getInt32Elements(EtsEnv *env, ets_intArray v)
{
    //return env->GetIntArrayElements(v, nullptr);
    return nullptr;
}

float* getFloat32Elements(EtsEnv *env, ets_floatArray v)
{
    // return env->GetFloatArrayElements(v, nullptr);
    return nullptr;
}

int64_t* getLongElements(EtsEnv *env, ets_longArray v)
{
    //return env->GetLongArrayElements(v, nullptr);
    return nullptr;
}

KStringPtr getString(EtsEnv *env, ets_string v) {
    KStringPtr result;
    if (v != nullptr) {
        // TODO: implement me!
        assert(false);
    }
    return result;
}

EtsExports* EtsExports::getInstance() {
    static EtsExports *instance = nullptr;
    if (instance == nullptr) {
        instance = new EtsExports();
    }
    return instance;
}
