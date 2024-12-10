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

#include "common-interop.h"
#include "SerializerBase.h"
#include "DeserializerBase.h"
#include <deque>

CustomDeserializer * DeserializerBase::customDeserializers = nullptr;

%CALLBACK_KINDS%

struct CallbackBuffer {
    CallbackKind kind;
    uint8_t buffer[60 * 4];
    CallbackResourceHolder resourceHolder;
};
void enqueueArkoalaCallback(const CallbackBuffer* event);

OH_NativePointer getManagedCallbackCaller(CallbackKind kind);
OH_NativePointer getManagedCallbackCallerSync(CallbackKind kind);
void holdManagedCallbackResource(OH_Int32 resourceId);
void releaseManagedCallbackResource(OH_Int32 resourceId);

void deserializeAndCallCallback(KInt kind, KByte* args, KInt argsSize);
