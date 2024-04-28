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

void addType(const std::string& type, std::string* result) {
    if (type == "void")
        result->append("V");
    else if (type == "KInt" || type == "Ark_Int32" || type == "Ark_Boolean" || type == "int32_t")
        result->append("I");
    else if (type == "Ark_NativePointer" || type == "KNativePointer")
        result->append("J");
    else if (type == "KByte*" || type == "uint8_t*")
        result->append("[B");
    else if (type == "KStringPtr")
        result->append("Lstd/core/String;");
    else {
        fprintf(stderr, "Unhandled type: %s\n", type.c_str());
        throw "Error";
    }
}

std::string convertType(const char* koalaType) {
    std::string result;
    size_t current = 0, last = 0;
    std::string token;
    std::string input(koalaType);
    while ((current = input.find('|', last)) != std::string::npos) {
        auto token = input.substr(last, current - last);
        addType(token, &result);
        last = current + 1;
    }
    return result;
}

void EtsExports:: addImpl(const char* name, const char* type, void* impl) {
    implementations.push_back(std::make_tuple(name, convertType(type), impl));
}
