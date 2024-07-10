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

#include "napi.h"

// **************************************************************
// Deprecated (and not exported) functions in in libace_napi.z.so
// **************************************************************


napi_status napi_close_callback_scope(napi_env env, napi_callback_scope scope) {
    throw Napi::Error::New(env, "deprecated");
}

napi_status napi_async_destroy(napi_env env, napi_async_context async_context) {
    throw Napi::Error::New(env, "deprecated");
}

napi_status napi_add_finalizer(
    napi_env env, napi_value js_object, void* native_object,
    napi_finalize finalize_cb, void* finalize_hint, napi_ref* result)
{
    throw Napi::Error::New(env, "deprecated");
}
