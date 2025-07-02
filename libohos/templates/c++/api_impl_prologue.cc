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

#include "%API_HEADER_PATH%"

#define KOALA_INTEROP_MODULE %INTEROP_MODULE_NAME%
#include "common-interop.h"
#include "callback-resource.h"
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include <unordered_map>

#if defined(KOALA_USE_PANDA_VM)
    #if defined(KOALA_ETS_NAPI)
        KOALA_ETS_INTEROP_MODULE_CLASSPATH(KOALA_INTEROP_MODULE, KOALA_QUOTE(ETS_MODULE_CLASSPATH_PREFIX) KOALA_QUOTE(KOALA_INTEROP_MODULE));
    #elif defined(KOALA_ANI)
        KOALA_ANI_INTEROP_MODULE_CLASSPATH(KOALA_INTEROP_MODULE, KOALA_QUOTE(ETS_MODULE_CLASSPATH_PREFIX) KOALA_QUOTE(KOALA_INTEROP_MODULE));
    #endif
#endif
CustomDeserializer * DeserializerBase::customDeserializers = nullptr;

%CALLBACK_KINDS%

OH_NativePointer getManagedCallbackCaller(CallbackKind kind);
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind);
