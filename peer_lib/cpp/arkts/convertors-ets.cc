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
    else if (type == "KInt" || type == "Ark_Int32" || type == "Ark_Boolean" || type == "int32_t" || type == "KUInt" || type == "uint32_t")
        result->append("I");
    else if (type == "Ark_NativePointer" || type == "KNativePointer")
        result->append("J");
    else if (type == "KByte*" || type == "uint8_t*")
        result->append("[B");
     else if (type == "KFloatArray")
        result->append("[F");
    else if (type == "KStringPtr")
        result->append("Lstd/core/String;");
    else if (type == "KLength")
        result->append("Lstd/core/Object;");
    else if (type == "KInteropNumber")
        result->append("J");
    else {
        fprintf(stderr, "Unhandled type (addType): %s\n", type.c_str());
        throw "Error";
    }
}

std::string etsType(const std::string &type)
{
    if (type == "void")
        return type;
    else if (type == "KInt" || type == "Ark_Int32" || type == "Ark_Boolean" || type == "int32_t" || type == "KUInt" || type == "uint32_t")
        return "int";
    else if (type == "Ark_NativePointer" || type == "KNativePointer")
        return "long";
    else if (type == "KByte*" || type == "uint8_t*")
        return "byte[]";
    else if (type == "KStringPtr")
        return "String";
    else if (type == "KLength")
        return "Object";
    else if (type == "KInteropNumber")
        return "long";
    else {
        fprintf(stderr, "Unhandled type (etsType): %s\n", type.c_str());
        throw "Error";
    }
}

std::string convertType(const char* name, const char* koalaType) {
    std::string result;
    size_t current = 0, last = 0;
    std::string input(koalaType);

    std::vector<std::string> tokens;
    while ((current = input.find('|', last)) != std::string::npos)
    {
        auto token = input.substr(last, current - last);
        tokens.push_back(token);
        last = current + 1;
    }
    tokens.push_back(input.substr(last, input.length() - last));

    addType(tokens[0], &result);
    result.append(":");
    for (int i = 1; i < (int)tokens.size(); i++)
    {
        addType(tokens[i], &result);
    }

    if (false)
    {
        std::string params;
        for (int i = 1; i < (int)tokens.size(); i++)
        {
            params.append("arg");
            params.append(std::to_string(i));            
            params.append(": ");
            params.append(etsType(tokens[i]));
            if (i < (int)(tokens.size() - 1))
                params.append(", ");
        }
        fprintf(stderr, "static native %s(%s): %s;\n", name, params.c_str(), etsType(tokens[0]).c_str());
    }

    return result;
}

void EtsExports::addImpl(const char* name, const char* type, void* impl) {
    implementations.push_back(std::make_tuple(name, convertType(name, type), impl));
}
