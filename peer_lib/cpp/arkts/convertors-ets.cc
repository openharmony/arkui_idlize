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

EtsExports* EtsExports::getInstance() {
    static EtsExports *instance = nullptr;
    if (instance == nullptr) {
        instance = new EtsExports();
    }
    return instance;
}

void addType(const std::string& type, std::string* result) {
    if (type == "void")
        result->append("");
    else if (type == "KInt" || type == "Ark_Int32" || type == "Ark_Boolean" || type == "int32_t" || type == "KUInt")
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
    std::string input(koalaType);
    bool seenReturn = false;
    while ((current = input.find('|', last)) != std::string::npos) {
        auto token = input.substr(last, current - last);
        addType(token, &result);
        if (!seenReturn) {
            result.append(":");
            seenReturn = true;
        }
        last = current + 1;
    }
    auto token = input.substr(last, input.length() - last);
    addType(token, &result);
    return result;
}

void EtsExports:: addImpl(const char* name, const char* type, void* impl) {
    implementations.push_back(std::make_tuple(name, convertType(type), impl));
}
