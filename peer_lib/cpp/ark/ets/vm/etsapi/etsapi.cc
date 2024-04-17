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

#include "ets/vm/etsapi/etsapi.h"
#include "ets/vm/etsapi/utils.h"

#include "oh_sk_log.h"

#include <runtime/handle_scope-inl.h>
#include <runtime/include/coretypes/array.h>
#include <runtime/include/coretypes/class.h>
#include <runtime/include/thread_scopes.h>

EtsExports* EtsExports::getInstance() {
    static EtsExports *instance = nullptr;
    if (instance == nullptr) {
        instance = new EtsExports();
    }
    return instance;
}

ets_object EtsEnv::NewGlobalRef(ets_object obj)
{
    auto objHeader = reinterpret_cast<ark::ObjectHeader*>(obj);
    auto *storage = GetRefStorage();
    auto ref = storage->NewRef(objHeader, ark::mem::Reference::ObjectType::GLOBAL);
    return reinterpret_cast<ets_object>(ref);
}

template <class T>
static T *GetArrayElements(ets_array array)
{
    if (array == nullptr) {
        return nullptr;
    }

    auto *coreArray = reinterpret_cast<ark::coretypes::Array*>(array);
    return reinterpret_cast<T*>(coreArray->GetData());
}

ets_float *EtsEnv::GetFloatArrayElements(ets_floatArray array, ets_boolean *isCopy)
{
    if (isCopy != nullptr) {
        *isCopy = false;
    }
    return GetArrayElements<ets_float>(array);
}

ets_byte *EtsEnv::GetByteArrayElements(ets_byteArray array, ets_boolean *isCopy)
{
    if (isCopy != nullptr) {
        *isCopy = false;
    }
    return GetArrayElements<ets_byte>(array);
}

ets_char *EtsEnv::GetCharArrayElements(ets_charArray array, ets_boolean *isCopy)
{
    if (isCopy != nullptr) {
        *isCopy = false;
    }
    return GetArrayElements<ets_char>(array);
}

ets_short *EtsEnv::GetShortArrayElements(ets_shortArray array, ets_boolean *isCopy)
{
    if (isCopy != nullptr) {
        *isCopy = false;
    }
    return GetArrayElements<ets_short>(array);
}

ets_int *EtsEnv::GetIntArrayElements(ets_intArray array, ets_boolean *isCopy)
{
    if (isCopy != nullptr) {
        *isCopy = false;
    }
    return GetArrayElements<ets_int>(array);
}

ets_long *EtsEnv::GetLongArrayElements(ets_longArray array, ets_boolean *isCopy)
{
    if (isCopy != nullptr) {
        *isCopy = false;
    }
    return GetArrayElements<ets_long>(array);
}

void EtsEnv::Invoke(ets_object objRef, const char* methodName)
{
    auto thread = ark::ManagedThread::GetCurrent();
    ark::ScopedManagedCodeThread managedScope(thread);
    ark::HandleScope<ark::ObjectHeader*> handleScope(thread);

    auto *storage = GetRefStorage();
    ark::VMHandle<ark::ObjectHeader> handle(thread, storage->GetObject(reinterpret_cast<ark::mem::Reference*>(objRef)));
    auto klass = handle->ClassAddr<ark::Class>();
    auto name = ark::utf::CStringAsMutf8(methodName);
    auto method = klass->GetClassMethod(name);
    if (method == nullptr) {
        OH_SK_LOG_FATAL_A("EtsEnv::Invoke GetClassMethod(\"%s\") failed", methodName);
        return;
    }
    auto arg = ark::Value(handle.GetPtr());
    method->Invoke(thread, &arg);
}
