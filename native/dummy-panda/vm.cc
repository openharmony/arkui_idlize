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
#include <stdio.h>
#include <stdint.h>

#include <jni.h>

#include "etsapi.h"
#include "dynamic-loader.h"

typedef jint (*JNI_CreateJavaVM_t)(JavaVM **pvm, void **penv, void *args);

jobject app = nullptr;

extern "C" ETS_EXPORT void* InitVirtualMachine(int32_t kind, const char* classPath, const char* libPath, void** env) {

    std::string jvmLibDir = std::string(getenv("JAVA_HOME")) +
#ifdef KOALA_WINDOWS
        "/bin/server"
#else
        "/lib/server"
#endif
    ;
    std::string jvmLibName = jvmLibDir + "/" + libName("jvm");
    void* jvmLib = loadLibrary(jvmLibName);
    JNI_CreateJavaVM_t createJavaVM = (JNI_CreateJavaVM_t)findSymbol(jvmLib, "JNI_CreateJavaVM");
    fprintf(stderr, "Init VM %d sym=%p\n", kind, createJavaVM);
    JavaVM* vm = nullptr;
    JavaVMInitArgs vm_args;
    JavaVMOption* options = new JavaVMOption[2];
    options[0].optionString = (char*)strdup((std::string("-Djava.class.path=") + classPath).c_str());
    options[1].optionString = (char*)strdup((std::string("-Djava.library.path=") + libPath).c_str());
    vm_args.version = JNI_VERSION_10;
    vm_args.nOptions = 2;
    vm_args.options = options;
    vm_args.ignoreUnrecognized = false;
    int result = createJavaVM(&vm, env, &vm_args);
    JNIEnv* jenv = (JNIEnv*)*env;
    jclass clazz = jenv->FindClass("org/koalaui/arkoala/Application");
    jmethodID start = jenv->GetStaticMethodID(clazz, "startApplication", "()Lorg/koalaui/arkoala/Application;");
    if (start) app = jenv->NewGlobalRef(jenv->CallStaticObjectMethod(clazz, start));
    return vm;
}

extern "C" ETS_EXPORT int RunVirtualMachine(void* env, int32_t what) {
    JNIEnv* jenv = (JNIEnv*)env;
    static jclass appClass = nullptr;
    if (!appClass) appClass = (jclass)jenv->NewGlobalRef(jenv->FindClass("org/koalaui/arkoala/Application"));
    static jmethodID mid = nullptr;
    if (!mid) mid = jenv->GetMethodID(appClass, "enter", "(I)V");
    return mid ? jenv->CallIntMethod(app, mid, what, nullptr, 0) : 0;
}
