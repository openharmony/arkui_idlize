/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

#ifndef OH_TEST_PROMISE_OH_COMMON_H_
#define OH_TEST_PROMISE_OH_COMMON_H_

#include "test_record.h"
#include <cmath>
#include <iomanip>
#include <iostream>

struct DumpPointer {
    const void* pointer;
    DumpPointer(const void* p): pointer(p) {}

    friend std::ostream& operator << (std::ostream& out, DumpPointer dp) {
        std::ios::fmtflags flags = out.flags();
        out << "0x" << std::hex << std::setw(16) << std::setfill('0') << reinterpret_cast<uintptr_t>(dp.pointer);
        out.flags(flags); // Restores IO flags
        return out;
    }
};

struct DumpOHNumber {
    OH_Number value;
    DumpOHNumber(OH_Number v): value(v) {}

    friend std::ostream& operator << (std::ostream& out, DumpOHNumber dn) {
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

inline OH_Number addOHNumber(OH_Number x, OH_Number y) {
    OH_Number res;
    res.tag = x.tag;
    if (res.tag == INTEROP_TAG_INT32) {
        if (y.tag == INTEROP_TAG_INT32) {
            res.i32 = x.i32 + y.i32;
        } else if (y.tag == INTEROP_TAG_FLOAT32) {
            res.tag = INTEROP_TAG_FLOAT32;
            res.f32 = static_cast<float>(x.i32) + y.f32;
        } else {
            std::cout << "OH_Number addOHNumber(OH_Number x, OH_Number y): y is not number." << std::endl;
            res.tag = INTEROP_TAG_FLOAT32;
            res.f32 = NAN;
        }
    } else if (res.tag == INTEROP_TAG_FLOAT32) {
        if (y.tag == INTEROP_TAG_INT32) {
            res.f32 = x.f32 + static_cast<float>(y.i32);
        } else if (y.tag == INTEROP_TAG_FLOAT32) {
            res.f32 = x.f32 + y.f32;
        } else {
            res.f32 = NAN;
        }
    } else {
        std::cout << "OH_Number addOHNumber(OH_Number x, OH_Number y): x is not number." << std::endl;
        res.tag = INTEROP_TAG_FLOAT32;
        res.f32 = NAN;
    }
    return res;
}

#endif // OH_TEST_PROMISE_OH_COMMON_H_
