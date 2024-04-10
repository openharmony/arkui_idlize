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

#include "ArgDeserializerBase.h"

#include <algorithm>
#include <vector>

struct MyDeserializer : CustomDeserializer {
    std::vector<string> supported;
    MyDeserializer() {
        supported.push_back("Function");
        supported.push_back("Resource");
        ArgDeserializerBase::registerCustomDeserializer(this);
    }
    virtual bool supports(const string& kind) {
        return std::find(supported.begin(), supported.end(), kind) != supported.end();
    }
    virtual CustomObject deserialize(ArgDeserializerBase* deserializer, const string& kind) {
        String value = deserializer->readString();
        fprintf(stderr, "native deserialize() for %s, got %s\n", kind.c_str(), value.c_str());
        return CustomObject(string("NativeError") + kind);
    }

};

MyDeserializer deserilizer;