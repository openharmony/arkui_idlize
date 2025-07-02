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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "huks.h"
#include "oh_common.h"

void GlobalScope_fooVoidVoidImpl() {
    std::cout << "GlobalScope_fooVoidVoidImpl()" << std::endl;
}

void GlobalScope_fooVoidNumberImpl(const OH_Number* arg) {
    std::cout << "GlobalScope_fooVoidNumberImpl(arg)"
              << "\n  arg = " << DumpOHNumber(*arg) << std::endl;
}

OH_Number GlobalScope_fooNumberVoidImpl() {
    static int counter = 0;
    std::cout << "GlobalScope_fooNumberVoidImpl()" << std::endl;
    return OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
}

OH_Number GlobalScope_fooNumberNumberImpl(const OH_Number* arg) {
    static int counter = 0;
    std::cout << "GlobalScope_fooNumberNumberImpl(arg)"
              << "\n  arg = " << DumpOHNumber(*arg) << std::endl;
    return addOHNumber(OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter}, *arg);
}

OH_HUKS_HuksResult GlobalScope_fooResultNumberImpl(const OH_Number* arg) {
    static int counter = 0;
    std::cout << "GlobalScope_fooResultNumberImpl(arg)"
              << "\n  arg = " << DumpOHNumber(*arg) << std::endl;
    OH_HUKS_HuksResult result{};
    result.errorCode = OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
    result.outData = { .tag = INTEROP_TAG_UNDEFINED };
    result.certChains = { .tag = INTEROP_TAG_UNDEFINED };
    result.properties = { .tag = INTEROP_TAG_UNDEFINED };
    return result;
}

OH_Number GlobalScope_fooNumberOptionsImpl(const OH_HUKS_HuksOptions* options) {
    static int counter = 0;
    std::cout << "GlobalScope_fooNumberOptionsImpl(options)" << std::endl;
    return OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
}

OH_HUKS_HuksResult GlobalScope_generateKeyItemSyncImpl(const OH_String* keyAlias, const OH_HUKS_HuksOptions* options) {
    static int counter = 0;
    std::cout << "GlobalScope_generateKeyItemSyncImpl(keyAlias, options)"
              << "\n  keyAlias = " << DumpOHString(*keyAlias) << std::endl;
    OH_HUKS_HuksResult result{};
    result.errorCode = OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
    result.outData = { .tag = INTEROP_TAG_UNDEFINED };
    result.certChains = { .tag = INTEROP_TAG_UNDEFINED };
    result.properties = { .tag = INTEROP_TAG_UNDEFINED };
    return result;
}
