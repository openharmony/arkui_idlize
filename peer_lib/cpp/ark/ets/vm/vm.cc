/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

#include "vm.h"

#include <compiler/compiler_options.h>
#include <plugins/ets/runtime/ets_vm_api.h>
#include <plugins/ets/runtime/interop_js/ts2ets_common.h>
#include <plugins/ets/runtime/interop_js/ts2ets_copy.h>
#include <plugins/ets/runtime/interop_js/ts2ets_jsvalue.h>
#include <runtime/include/runtime.h>
#include <runtime/include/thread_scopes.h>

#include <sstream>

#include "base_options.h"
#include "etsapi/etsapi.h"
#include "etsapi/utils.h"
#include "oh_sk_log.h"
#include "source_language.h"

namespace ets {

#define APP_LOG(fmt, msg) OH_LOG_Print(LOG_APP, LOG_INFO, 0xFF00, "koala", fmt, msg)

void InitExports() {
    ark::ScopedManagedCodeThread smct(ark::ManagedThread::GetCurrent());

    OH_SK_LOG_INFO_A("InitExports: %lu exports", EtsExports::getInstance()->getImpls().size());
    for (auto &[name, impl] : EtsExports::getInstance()->getImpls()) {
        if (ark::ets::BindNative("LETSGLOBAL;", name.data(), impl)) {
            OH_SK_LOG_INFO_A("Binded func %s", name.data());
        }
    }
}

static void HiLogPrintStringUTF8(ark::coretypes::String *arg) {
    std::stringstream ss;
    ark::Span<const char> sp(reinterpret_cast<const char *>(arg->GetDataMUtf8()), arg->GetLength());
    for (char c : sp) {
        ss << c;
    }
    APP_LOG("%s", ss.str().c_str());
}

static void HiLogPrintStringUTF16(ark::coretypes::String *arg) {
    std::wstringstream ss;
    ark::Span<const char16_t> sp(reinterpret_cast<const char16_t *>(arg->GetDataUtf16()), arg->GetLength());
    for (wchar_t c : sp) {
        ss << c;
    }
    APP_LOG("%S", ss.str().c_str());
}

static void HiLogPrintString([[maybe_unused]] ark::Method *, ark::coretypes::String *arg) {
    if (arg->IsUtf16()) {
        HiLogPrintStringUTF16(arg);
    } else {
        HiLogPrintStringUTF8(arg);
    }
}

void InitLogging() {
    ark::ScopedManagedCodeThread smct(ark::ManagedThread::GetCurrent());
    ark::ets::BindNative("LETSGLOBAL;", "_log", reinterpret_cast<void *>(HiLogPrintString));
}

void InitInteropJS() {
    ark::ScopedManagedCodeThread smct(ark::ManagedThread::GetCurrent());

    ark::ets::ts2ets::GlobalCtx::Init();
    ark::ets::ts2ets::InitJSValueExports();
}

Napi::Value InvokeMethod(const Napi::CallbackInfo &info) {
    std::vector<napi_value> jsargs(info.Length());
    for (size_t i = 0; i < jsargs.size(); ++i) {
        jsargs[i] = info[i];
    }
    return Napi::Value(info.Env(), ark::ets::ts2ets::InvokeEtsMethodImpl(info.Env(), jsargs.data(), jsargs.size(), false));
}

}  // namespace ets
