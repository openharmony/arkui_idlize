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
#include <stdio.h>
#include <windows.h>
#include "node_api.h"

#define NAPI_FUNCTIONS(op) \
   op(napi_module_register) \
   op(napi_create_function) \
   op(napi_set_named_property) \
   op(napi_create_string_utf8) \
   op(napi_add_env_cleanup_hook) \
   op(napi_get_last_error_info) \
   op(napi_get_value_bigint_uint64) \
   op(napi_create_object) \
   op(napi_get_arraybuffer_info) \
   op(napi_create_bigint_uint64) \
   op(napi_is_typedarray) \
   op(napi_add_finalizer) \
   op(napi_get_typedarray_info) \
   op(napi_set_property) \
   op(napi_get_value_bool) \
   op(napi_coerce_to_string) \
   op(napi_get_value_uint32) \
   op(napi_get_value_int32) \
   op(napi_throw) \
   op(napi_get_cb_info)

NAPI_EXTERN napi_status NAPI_CDECL napi_throw(napi_env env, napi_value error);

#define DECL_NAPI_IMPL(fn_name, ...) decltype(&fn_name) p_##fn_name;

NAPI_FUNCTIONS(DECL_NAPI_IMPL)

bool LoadNapiFunctions() {
  static bool isLoaded = false;
  if (isLoaded) return true;
  fprintf(stderr, "Init NAPI\n");
  HMODULE nodeModule = GetModuleHandle(NULL);
  FARPROC fn_addr = GetProcAddress(nodeModule, "napi_module_register");

  if (fn_addr == NULL) {
    nodeModule = GetModuleHandleA("node.dll");
    if (nodeModule == NULL) return false;
    fn_addr = GetProcAddress(nodeModule, "napi_module_register");
    if (fn_addr == NULL) {
      return false;
    }
  }
  bool apiLoadFailed = false;

#define GET_NAPI_IMPL(fn_name)                      \
    fn_addr = GetProcAddress(nodeModule, #fn_name); \
    if (fn_addr == NULL) apiLoadFailed = true;      \
    p_##fn_name = (decltype(p_##fn_name))fn_addr;

  // Assign the addresses of the needed functions to the "p*" named pointers.
  NAPI_FUNCTIONS(GET_NAPI_IMPL);

  // If any required APIs failed to load, return false
  if (apiLoadFailed) return false;

  isLoaded = true;

  return true;
}

NAPI_EXTERN void NAPI_CDECL
napi_module_register(napi_module* mod) {
    LoadNapiFunctions();
    p_napi_module_register(mod);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_get_last_error_info(napi_env env, const napi_extended_error_info** result) {
    LoadNapiFunctions();
    return p_napi_get_last_error_info(env, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_value_bigint_uint64(
    napi_env env, napi_value value, uint64_t* result, bool* lossless) {
  LoadNapiFunctions();
  return p_napi_get_value_bigint_uint64(env, value, result, lossless);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_create_object(napi_env env, napi_value* result) {
  LoadNapiFunctions();
  return p_napi_create_object(env, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_arraybuffer_info(napi_env env, napi_value arraybuffer, void** data, size_t* byte_length) {
  LoadNapiFunctions();
  return p_napi_get_arraybuffer_info(env, arraybuffer, data, byte_length);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_create_bigint_uint64(napi_env env, uint64_t value, napi_value* result) {
  LoadNapiFunctions();
  return p_napi_create_bigint_uint64(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_is_typedarray(napi_env env, napi_value value, bool* result) {
  LoadNapiFunctions();
  return p_napi_is_typedarray(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_add_finalizer(napi_env env,
                   napi_value js_object,
                   void* finalize_data,
                   node_api_nogc_finalize finalize_cb,
                   void* finalize_hint,
                   napi_ref* result) {
  LoadNapiFunctions();
  return p_napi_add_finalizer(env, js_object, finalize_data, finalize_cb, finalize_hint, result);
}


NAPI_EXTERN napi_status NAPI_CDECL
napi_get_typedarray_info(napi_env env,
                         napi_value typedarray,
                         napi_typedarray_type* type,
                         size_t* length,
                         void** data,
                         napi_value* arraybuffer,
                         size_t* byte_offset) {
  LoadNapiFunctions();
  return p_napi_get_typedarray_info(env, typedarray, type, length, data, arraybuffer, byte_offset);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_set_property(napi_env env,
                                                     napi_value object,
                                                     napi_value key,
                                                     napi_value value) {
  LoadNapiFunctions();
  return p_napi_set_property(env, object, key, value);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_value_bool(napi_env env,
                                                       napi_value value,
                                                       bool* result) {
  LoadNapiFunctions();
  return p_napi_get_value_bool(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_coerce_to_string(napi_env env,
                                                         napi_value value,
                                                         napi_value* result) {
  LoadNapiFunctions();
  return p_napi_coerce_to_string(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_value_int32(napi_env env,
                                                        napi_value value,
                                                        int32_t* result) {
  LoadNapiFunctions();
  return p_napi_get_value_int32(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_cb_info(
    napi_env env,
    napi_callback_info cbinfo,
    size_t* argc,
    napi_value* argv,
    napi_value* this_arg,
    void** data) {
  LoadNapiFunctions();
  return napi_get_cb_info(env, cbinfo, argc, argv, this_arg, data);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_throw(napi_env env, napi_value error) {
  LoadNapiFunctions();
  return p_napi_throw(env, error);
}
