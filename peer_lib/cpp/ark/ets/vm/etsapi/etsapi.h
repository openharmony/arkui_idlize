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

#pragma once

#include <vector>
#include <string>

class __ets_object {};
typedef __ets_object* ets_object;
class __ets_string : public __ets_object {};
typedef __ets_string *ets_string;

typedef uint8_t ets_boolean;
typedef int8_t ets_byte;
typedef uint16_t ets_char;
typedef int16_t ets_short;
typedef int32_t ets_int;
typedef int64_t ets_long;
typedef float ets_float;
typedef double ets_double;
typedef ets_int ets_size;

typedef ets_object ets_array;
typedef ets_array ets_objectArray;
typedef ets_array ets_booleanArray;
typedef ets_array ets_byteArray;
typedef ets_array ets_charArray;
typedef ets_array ets_shortArray;
typedef ets_array ets_intArray;
typedef ets_array ets_longArray;
typedef ets_array ets_floatArray;
typedef ets_array ets_doubleArray;

class EtsEnv {
public:
    ets_object NewGlobalRef(ets_object obj);
    ets_float *GetFloatArrayElements(ets_floatArray array, ets_boolean *isCopy);
    ets_byte *GetByteArrayElements(ets_byteArray array, ets_boolean *isCopy);
    ets_char *GetCharArrayElements(ets_charArray array, ets_boolean *isCopy);
    ets_short *GetShortArrayElements(ets_shortArray array, ets_boolean *isCopy);
    ets_int *GetIntArrayElements(ets_intArray array, ets_boolean *isCopy);
    ets_long *GetLongArrayElements(ets_longArray array, ets_boolean *isCopy);
    void Invoke(ets_object objRef, const char* methodName);
};

class EtsExports {
    std::vector<std::pair<std::string, void*>> implementations;

public:
    static EtsExports* getInstance();

    void addImpl(const char* name, void *impl) {
        implementations.emplace_back(name, impl);
    }

    const std::vector<std::pair<std::string, void*>>& getImpls() {
        return implementations;
    }
};
