/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
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

#ifndef OH_TEST_OST_OH_COMMON_H_
#define OH_TEST_OST_OH_COMMON_H_

#include "test_ost.h"

#include <cmath>
#include <cstring>
#include <iomanip>
#include <iostream>
#include <unordered_map>
#include <vector>

struct AllocationManager {
    static inline std::vector<void*> allocated;

    static std::pair<void*, size_t> Allocate(size_t sizeBytes)
    {
        std::cout << "AllocationManager::Allocate(sizeBytes=" << sizeBytes << ")" << std::endl;
        void* cur = std::malloc(sizeBytes);
        size_t index = allocated.size();
        allocated.push_back(cur);
        return { cur, index };
    }

    static void Deallocate(size_t index)
    {
        std::cout << "AllocationManager::Deallocate(index=" << index << ")" << std::endl;
        std::free(allocated[index]);
    }
};

InteropCallbackResource MakeInteropCallbackResource(size_t sizeBytes, InteropNativePointer* data);

inline OH_Buffer MakeOHBuffer(size_t sizeBytes)
{
    OH_Buffer res;
    res.resource = MakeInteropCallbackResource(sizeBytes, &res.data);
    res.length = sizeBytes;
    return res;
}

struct DumpOHNumber {
    OH_Number value;
    DumpOHNumber(OH_Number v)
        : value(v) {}

    friend std::ostream& operator<<(std::ostream& out, DumpOHNumber dn)
    {
        if (dn.value.tag == INTEROP_TAG_INT32) {
            out << dn.value.i32 << " (int32)";
        } else if (dn.value.tag == INTEROP_TAG_FLOAT32) {
            out << dn.value.f32 << " (float32)";
        } else {
            out << "<not-number-type>";
        }
        return out;
    }
};

OH_Number addOHNumber(OH_Number x, OH_Number y);

#endif // OH_TEST_OST_OH_COMMON_H_
