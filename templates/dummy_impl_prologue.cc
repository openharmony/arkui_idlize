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
#include "Serializers.h"
#include "arkoala-logging.h"
#include "common-interop.h"
#include "arkoala-macros.h"

typedef void (*AppendGroupedLogSignature)(int32_t, const std::string&);

AppendGroupedLogSignature appendGroupedLogPtr = nullptr;

void SetAppendGroupedLog(void* logger) {
    if (logger) appendGroupedLogPtr = reinterpret_cast<AppendGroupedLogSignature>(logger);
}

void dummyClassFinalizer(KNativePointer* ptr) {
    char hex[20];
    std::snprintf(hex, sizeof(hex), "0x%llx", (long long)ptr);
    string out("dummyClassFinalizer(");
    out.append(hex);
    out.append(")");
    appendGroupedLog(1, out);
}

namespace OHOS::Ace::NG {
Ark_NodeHandle CreateNode(GENERATED_Ark_NodeType type, Ark_Int32 id, Ark_Int32 flags) {
    Ark_NodeHandle result = (Ark_NodeHandle) 123;
    if (!needGroupedLog(1)) {
        return result;
    }
    string out("createNode(");
    WriteToString(&out, (Ark_Int32)type);
    out.append(", ");
    WriteToString(&out, id);
    out.append(", ");
    WriteToString(&out, flags);
    out.append(")");
    appendGroupedLog(1, out);
    return result;
}
}

