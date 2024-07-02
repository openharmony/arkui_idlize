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

#include "arkoala_api_generated.h"
#include <string>

#ifndef LIBRARY_STUB_H
#define LIBRARY_STUB_H

enum ArkUIAPIVariantKind {
    BASIC = 0,
    FULL = 1,
    GRAPHICS = 2,
    EXTENDED = 3,
    COUNT = EXTENDED + 1
};

typedef struct ArkUIAnyAPI {
    Ark_Int32 version;
} ArkUIAnyAPI;

const ArkUIAnyAPI* GetAnyImpl(ArkUIAPIVariantKind kind, int version, std::string* result = nullptr);

#endif