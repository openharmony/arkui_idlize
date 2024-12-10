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
#ifndef %INCLUDE_GUARD_DEFINE%
#define %INCLUDE_GUARD_DEFINE%

#define %LIBRARY_NAME%_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

enum OH_Tag
{
  OH_TAG_UNDEFINED = 101,
  OH_TAG_INT32 = 102,
  OH_TAG_FLOAT32 = 103,
  OH_TAG_STRING = 104,
  OH_TAG_LENGTH = 105,
  OH_TAG_RESOURCE = 106,
  OH_TAG_OBJECT = 107,
};

enum OH_RuntimeType
{
  OH_RUNTIME_UNEXPECTED = -1,
  OH_RUNTIME_NUMBER = 1,
  OH_RUNTIME_STRING = 2,
  OH_RUNTIME_OBJECT = 3,
  OH_RUNTIME_BOOLEAN = 4,
  OH_RUNTIME_UNDEFINED = 5,
  OH_RUNTIME_BIGINT = 6,
  OH_RUNTIME_FUNCTION = 7,
  OH_RUNTIME_SYMBOL = 8,
  OH_RUNTIME_MATERIALIZED = 9,
};

typedef float OH_Float32;
typedef double OH_Float64;
typedef int32_t OH_Int32;
typedef unsigned int OH_UInt32;
typedef int64_t OH_Int64;
typedef int8_t OH_Int8;
typedef int8_t OH_Boolean;
typedef const char* OH_CharPtr;
typedef void* OH_NativePointer;
typedef const char* OH_String;
typedef struct OH_CallbackResource {
  OH_Int32 resourceId;
  void (*hold)(OH_Int32 resourceId);
  void (*release)(OH_Int32 resourceId);
} OH_CallbackResource;
typedef struct OH_Number {
  OH_Int8 tag;
  union {
    OH_Float32 f32;
    OH_Int32 i32;
  };
} OH_Number;
typedef struct OH_Buffer
{
  void* data;
  int64_t length;
} OH_Buffer;
typedef struct OH_Materialized {
  OH_NativePointer ptr;
} OH_Materialized;
typedef struct OH_CustomObject {
  char kind[20];
  OH_Int32 id;
  // Data of custom object.
  union {
    OH_Int32 ints[4];
    OH_Float32 floats[4];
    void* pointers[4];
    OH_String string;
  };
} OH_CustomObject;
typedef struct OH_Undefined {
  OH_Int32 dummy; // Empty structs are forbidden in C.
} OH_Undefined;

// TODO: wrong, provide real definitions.
typedef void* OH_DataView;

typedef struct OH_AnyAPI {
    OH_Int32 version;
} OH_AnyAPI;

typedef enum OH_APIKind {
    OH_%LIBRARY_NAME%_API_KIND = 1
} OH_APIKind;

struct _OH_VMContext;
typedef struct _OH_VMContext* OH_VMContext;