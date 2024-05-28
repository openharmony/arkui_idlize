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

#include "convertors-jni.h"

static bool registerNativeMethods(JNIEnv *env, const char *classname, JNINativeMethod *methods, int countMethods)
{
    jclass clazz = env->FindClass(classname);
    if (clazz == nullptr)
        return false;
    if (env->RegisterNatives(clazz, methods, countMethods) < 0)
        return false;
    return true;
}

static bool registerNatives(JNIEnv *env)
{
    JniExports *exports = JniExports::getInstance();
    auto &impls = exports->getImpls();
    size_t numMethods = impls.size();
    JNINativeMethod *methods = new JNINativeMethod[numMethods];
    for (size_t i = 0; i < numMethods; i++)
    {
        methods[i].name = (char *)std::get<0>(impls[i]).c_str();
        methods[i].signature = (char *)std::get<1>(impls[i]).c_str();
        methods[i].fnPtr = std::get<2>(impls[i]);
        // fprintf(stderr, "%s %s()\n", methods[i].name,  methods[i].signature);
    }
    return registerNativeMethods(env, "NativeModule", methods, numMethods);
}

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM *vm, void *reserved) {
    JNIEnv *env;
    if (vm->GetEnv(reinterpret_cast<void **>(&env), JNI_VERSION_1_8) != JNI_OK)
    {
        return JNI_ERR;
    }
    if (!registerNatives(env)) return JNI_ERR;
    return JNI_VERSION_1_8;
}


JniExports *JniExports::getInstance()
{
    static JniExports *instance = nullptr;
    if (instance == nullptr)
    {
        instance = new JniExports();
    }
    return instance;
}

void addType(const std::string &type, std::string *result)
{
    if (type == "void")
        result->append("V");
    else if (type == "KInt" || type == "Ark_Int32" || type == "Ark_Boolean" || type == "int32_t" || type == "KUInt" || type == "uint32_t")
        result->append("I");
    else if (type == "Ark_NativePointer" || type == "KNativePointer")
        result->append("J");
    else if (type == "KInteropNumber")
        result->append("D");
    else if (type == "KBoolean")
        result->append("Z");
    else if (type == "KByte*" || type == "uint8_t*")
        result->append("[B");
    else if (type == "KStringPtr")
        result->append("Ljava/lang/String;");
    else {
        fprintf(stderr, "Unhandled type: %s\n", type.c_str());
        throw "Error";
    }
}

std::string javaType(const std::string &type)
{
    if (type == "void")
        return type;
    else if (type == "KInt" || type == "Ark_Int32" || type == "Ark_Boolean" || type == "int32_t" || type == "KUInt")
        return "int";
    else if (type == "KInteropNumber")
        return "double";
    else if (type == "Ark_NativePointer" || type == "KNativePointer")
        return "long";
    else if (type == "KByte*" || type == "uint8_t*")
        return "byte[]";
    else if (type == "KStringPtr")
        return "String";
    else {
        fprintf(stderr, "Unhandled type: %s\n", type.c_str());
        throw "Error";
    }
}

std::string convertType(const char *name, const char *koalaType)
{
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

    result.append("(");
    for (int i = 1; i < (int)tokens.size(); i++)
    {
        addType(tokens[i], &result);
    }
    result.append(")");
    addType(tokens[0], &result);

    if (false)
    {
        std::string params;
        for (int i = 1; i < (int)tokens.size(); i++)
        {
            params.append(javaType(tokens[i]));
            params.append(" arg");
            params.append(std::to_string(i));
            if (i < (int)(tokens.size() - 1))
                params.append(", ");
        }
        fprintf(stderr, "static native %s %s(%s);\n", javaType(tokens[0]).c_str(), name, params.c_str());
    }

    return result;
}

void JniExports::addImpl(const char *name, const char *type, void *impl)
{
    implementations.push_back(std::make_tuple(name, convertType(name, type), impl));
}
