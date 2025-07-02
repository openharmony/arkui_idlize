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
#include "huks_with_class.h"
#include "oh_common.h"

namespace {
int dummy = 0;
}

OH_HUKS_WITH_CLASS_HuksClassHandle HuksClass_constructImpl() {
    std::cout << "HuksClass_constructImpl()" << std::endl;
    return reinterpret_cast<OH_HUKS_WITH_CLASS_HuksClassHandle>(&dummy);
}

void HuksClass_destructImpl(OH_HUKS_WITH_CLASS_HuksClassHandle thiz) {
    std::cout << "HuksClass_destructImpl(thiz)" << std::endl;
}

void HuksClass_fooVoidVoidImpl(OH_NativePointer thisPtr) {
    std::cout << "HuksClass_fooVoidVoidImpl(thisPtr)" << std::endl;
}

void HuksClass_fooVoidNumberImpl(OH_NativePointer thisPtr, const OH_Number* arg) {
    std::cout << "HuksClass_fooVoidNumberImpl(thisPtr, arg)"
              << "\n  arg = " << DumpOHNumber(*arg) << std::endl;
}

OH_Number HuksClass_fooNumberVoidImpl(OH_NativePointer thisPtr) {
    static int counter = 0;
    std::cout << "HuksClass_fooNumberVoidImpl(thisPtr)" << std::endl;
    return OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
}

OH_Number HuksClass_fooNumberNumberImpl(OH_NativePointer thisPtr, const OH_Number* arg) {
    static int counter = 0;
    std::cout << "HuksClass_fooNumberNumberImpl(thisPtr, arg)"
              << "\n  arg = " << DumpOHNumber(*arg) << std::endl;
    return addOHNumber(OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter}, *arg);
}

OH_HUKS_WITH_CLASS_HuksResult HuksClass_fooResultNumberImpl(OH_NativePointer thisPtr, const OH_Number* arg) {
    static int counter = 0;
    std::cout << "HuksClass_fooResultNumberImpl(thisPtr, arg)"
              << "\n  arg = " << DumpOHNumber(*arg) << std::endl;
    OH_HUKS_WITH_CLASS_HuksResult result{};
    result.errorCode = OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
    result.outData = { .tag = INTEROP_TAG_UNDEFINED };
    result.certChains = { .tag = INTEROP_TAG_UNDEFINED };
    result.properties = { .tag = INTEROP_TAG_UNDEFINED };
    return result;
}

OH_Number HuksClass_fooNumberOptionsImpl(OH_NativePointer thisPtr, const OH_HUKS_WITH_CLASS_HuksOptions* options) {
    static int counter = 0;
    std::cout << "HuksClass_fooNumberOptionsImpl(thisPtr, options)" << std::endl;
    return OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
}

OH_HUKS_WITH_CLASS_HuksResult HuksClass_generateKeyItemSyncImpl(const OH_String* keyAlias, const OH_HUKS_WITH_CLASS_HuksOptions* options) {
    static int counter = 0;
    std::cout << "HuksClass_generateKeyItemSyncImpl(thisPtr, keyAlias, options)"
              << "\n  keyAlias = " << DumpOHString(*keyAlias) << std::endl;
    OH_HUKS_WITH_CLASS_HuksResult result{};
    result.errorCode = OH_Number{.tag = INTEROP_TAG_INT32, .i32 = ++counter};
    result.outData = { .tag = INTEROP_TAG_UNDEFINED };
    result.certChains = { .tag = INTEROP_TAG_UNDEFINED };
    result.properties = { .tag = INTEROP_TAG_UNDEFINED };
    return result;
}
