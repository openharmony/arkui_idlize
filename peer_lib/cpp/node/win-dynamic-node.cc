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
   op(napi_get_cb_info) \
   op(napi_create_error) \
   op(napi_get_value_string_utf8) \
   op(napi_define_properties) \
   op(napi_delete_reference) \
   op(napi_get_reference_value) \
   op(napi_open_handle_scope) \
   op(napi_close_handle_scope) \
   op(napi_open_escapable_handle_scope) \
   op(napi_close_escapable_handle_scope) \
   op(napi_is_exception_pending) \
   op(napi_create_type_error) \
   op(napi_escape_handle) \
   op(napi_get_and_clear_last_exception) \
   op(napi_fatal_error) \
   op(napi_create_double) \
   op(napi_typeof) \
   op(napi_get_property) \
   op(napi_get_named_property) \
   op(napi_create_reference) \
   op(napi_get_global) \
   op(napi_has_property) \
   op(napi_get_undefined) \
   op(napi_get_value_double) \
   op(napi_close_callback_scope) \
   op(napi_async_destroy) \
   op(napi_call_function)

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
                   napi_finalize finalize_cb,
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
  return p_napi_get_cb_info(env, cbinfo, argc, argv, this_arg, data);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_create_string_utf8(napi_env env,
                                                           const char* str,
                                                           size_t length,
                                                           napi_value* result) {
  LoadNapiFunctions();
  return p_napi_create_string_utf8(env, str, length, result);
}


NAPI_EXTERN napi_status NAPI_CDECL napi_throw(napi_env env, napi_value error) {
  LoadNapiFunctions();
  return p_napi_throw(env, error);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_create_error(napi_env env,
                                                     napi_value code,
                                                     napi_value msg,
                                                     napi_value* result) {
  LoadNapiFunctions();
  return p_napi_create_error(env, code, msg, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_value_string_utf8(
    napi_env env, napi_value value, char* buf, size_t bufsize, size_t* result) {
  LoadNapiFunctions();
  return p_napi_get_value_string_utf8(env, value, buf, bufsize, result);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_define_properties(napi_env env,
                       napi_value object,
                       size_t property_count,
                       const napi_property_descriptor* properties) {
  LoadNapiFunctions();
  return p_napi_define_properties(env, object, property_count, properties);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_delete_reference(napi_env env,
                                                         napi_ref ref) {
  LoadNapiFunctions();
  return p_napi_delete_reference(env, ref);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_reference_value(napi_env env,
                                                            napi_ref ref,
                                                            napi_value* result) {
  LoadNapiFunctions();
  return p_napi_get_reference_value(env, ref, result);
}
NAPI_EXTERN napi_status NAPI_CDECL
napi_open_handle_scope(napi_env env, napi_handle_scope* result) {
  LoadNapiFunctions();
  return p_napi_open_handle_scope(env, result);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_close_handle_scope(napi_env env, napi_handle_scope scope) {
  LoadNapiFunctions();
  return p_napi_close_handle_scope(env, scope);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_open_escapable_handle_scope(
    napi_env env, napi_escapable_handle_scope* result) {
  return p_napi_open_escapable_handle_scope(env, result);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_close_escapable_handle_scope(
    napi_env env, napi_escapable_handle_scope scope) {
  LoadNapiFunctions();
  return p_napi_close_escapable_handle_scope(env, scope);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_is_exception_pending(napi_env env,
                                                             bool* result) {
  LoadNapiFunctions();
  return p_napi_is_exception_pending(env, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_property(napi_env env,
                                                     napi_value object,
                                                     napi_value key,
                                                     napi_value* result) {
  LoadNapiFunctions();
  return p_napi_get_property(env, object, key, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_get_value_uint32(napi_env env,
                                                         napi_value value,
                                                         uint32_t* result) {
  LoadNapiFunctions();
  return p_napi_get_value_uint32(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_typeof(napi_env env,
                                               napi_value value,
                                               napi_valuetype* result) {
  LoadNapiFunctions();
  return p_napi_typeof(env, value, result);
}
NAPI_EXTERN napi_status NAPI_CDECL
napi_get_and_clear_last_exception(napi_env env, napi_value* result) {
  LoadNapiFunctions();
  return p_napi_get_and_clear_last_exception(env, result);
}
NAPI_EXTERN NAPI_NO_RETURN void NAPI_CDECL
napi_fatal_error(const char* location,
                 size_t location_len,
                 const char* message,
                 size_t message_len) {
  LoadNapiFunctions();
  p_napi_fatal_error(location, location_len, message, message_len);
  // Not reachable, but not represented in type signature.
  exit(0);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_create_double(napi_env env,
                                                      double value,
                                                      napi_value* result) {
  LoadNapiFunctions();
  return p_napi_create_double(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_create_type_error(napi_env env,
                                                          napi_value code,
                                                          napi_value msg,
                                                          napi_value* result) {
  LoadNapiFunctions();
  return p_napi_create_type_error(env, code, msg, result);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_get_named_property(napi_env env,
                                                           napi_value object,
                                                           const char* utf8name,
                                                           napi_value* result) {
  return napi_ok;
}
NAPI_EXTERN napi_status NAPI_CDECL
napi_create_reference(napi_env env,
                      napi_value value,
                      uint32_t initial_refcount,
                      napi_ref* result) {
  LoadNapiFunctions();
  return p_napi_create_reference(env, value, initial_refcount, result);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_escape_handle(napi_env env,
                   napi_escapable_handle_scope scope,
                   napi_value escapee,
                   napi_value* result);
NAPI_EXTERN napi_status NAPI_CDECL napi_get_global(napi_env env,
                                                   napi_value* result) {

  LoadNapiFunctions();
  return p_napi_get_global(env, result);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_has_property(napi_env env,
                                                     napi_value object,
                                                     napi_value key,
                                                     bool* result) {
  LoadNapiFunctions();
  return p_napi_has_property(env, object, key, result);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_create_function(napi_env env,
                                                        const char* utf8name,
                                                        size_t length,
                                                        napi_callback cb,
                                                        void* data,
                                                        napi_value* result) {
  LoadNapiFunctions();
  return p_napi_create_function(env, utf8name, length, cb, data, result);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_escape_handle(napi_env env,
                   napi_escapable_handle_scope scope,
                   napi_value escapee,
                   napi_value* result) {
  LoadNapiFunctions();
  return p_napi_escape_handle(env, scope, escapee, result);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_get_undefined(napi_env env,
                                                      napi_value* result) {
  LoadNapiFunctions();
  return p_napi_get_undefined(env, result);
}
NAPI_EXTERN napi_status NAPI_CDECL napi_get_value_double(napi_env env,
                                                         napi_value value,
                                                         double* result) {
  LoadNapiFunctions();
  return p_napi_get_value_double(env, value, result);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_close_callback_scope(napi_env env, napi_callback_scope scope) {
  LoadNapiFunctions();
  return p_napi_close_callback_scope(env, scope);
}

NAPI_EXTERN napi_status NAPI_CDECL
napi_async_destroy(napi_env env, napi_async_context async_context) {
  LoadNapiFunctions();
  return p_napi_async_destroy(env, async_context);
}

NAPI_EXTERN napi_status NAPI_CDECL napi_call_function(napi_env env,
                                                      napi_value recv,
                                                      napi_value func,
                                                      size_t argc,
                                                      const napi_value* argv,
                                                      napi_value* result) {
  LoadNapiFunctions();
  return p_napi_call_function(env, recv, func, argc, argv, result);
}
