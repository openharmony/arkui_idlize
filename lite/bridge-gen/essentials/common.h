/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

#ifndef COMMON_H
#define COMMON_H

#ifndef PLATFORM_ENV_TYPE
#define PLATFORM_ENV_TYPE int
#endif

template <typename T>
struct BridgeConvertor {
    using PlatformType = T;
    static T toBridgeType(PLATFORM_ENV_TYPE, PlatformType) = delete;
    static PlatformType fromBridgeType(PLATFORM_ENV_TYPE, T) = delete;
    static void cleanup(T) {};
};

#endif
