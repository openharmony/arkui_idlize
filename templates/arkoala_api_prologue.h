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
#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ARKOALA_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ARKOALA_API_H

/**
 * THIS FILE IS GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!
 */

// The only include allowed in this file! Do not add anything else ever.
#include <stdint.h>

#define %CPP_PREFIX%ARKUI_FULL_API_VERSION %ARKUI_FULL_API_VERSION_VALUE%
#define %CPP_PREFIX%ARKUI_NODE_API_VERSION %CPP_PREFIX%ARKUI_FULL_API_VERSION

#define %CPP_PREFIX%ARKUI_BASIC_NODE_API_VERSION 1
#define %CPP_PREFIX%ARKUI_EXTENDED_NODE_API_VERSION 6
#define %CPP_PREFIX%ARKUI_NODE_GRAPHICS_API_VERSION 5
#define %CPP_PREFIX%ARKUI_NODE_MODIFIERS_API_VERSION 6
#define %CPP_PREFIX%ARKUI_AUTO_GENERATE_NODE_ID -2

#ifdef __cplusplus
extern "C" {
#endif

enum Ark_Tag
{
  ARK_TAG_UNDEFINED = 101,
  ARK_TAG_INT32 = 102,
  ARK_TAG_FLOAT32 = 103,
  ARK_TAG_STRING = 104,
  ARK_TAG_LENGTH = 105,
  ARK_TAG_RESOURCE = 106,
  ARK_TAG_OBJECT = 107,
};

enum Ark_RuntimeType
{
  ARK_RUNTIME_UNEXPECTED = -1,
  ARK_RUNTIME_NUMBER = 1,
  ARK_RUNTIME_STRING = 2,
  ARK_RUNTIME_OBJECT = 3,
  ARK_RUNTIME_BOOLEAN = 4,
  ARK_RUNTIME_UNDEFINED = 5,
  ARK_RUNTIME_BIGINT = 6,
  ARK_RUNTIME_FUNCTION = 7,
  ARK_RUNTIME_SYMBOL = 8,
  ARK_RUNTIME_MATERIALIZED = 9,
};

typedef float Ark_Float32;
typedef double Ark_Float64;
typedef int32_t Ark_Int32;
typedef unsigned int Ark_UInt32; // TODO: update unsigned int
typedef int64_t Ark_Int64;
typedef int8_t Ark_Int8;
typedef int8_t Ark_Boolean;
typedef const char* Ark_CharPtr;
typedef void* Ark_NativePointer;

#ifdef FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ARKOALA_API_H
typedef struct _ArkUINode* Ark_NodeHandle;
#else
struct Ark_NodeHandleOpaque;
typedef struct Ark_NodeHandleOpaque* Ark_NodeHandle;
#endif

struct Ark_ObjectHandleOpaque;
typedef struct Ark_ObjectHandleOpaque* Ark_ObjectHandle;

// Binary layout of Ark_String must match that of KStringPtrImpl.
typedef struct Ark_String {
  const char* chars;
  Ark_Int32 length;
} Ark_String;

typedef struct Ark_Empty {
  Ark_Int32 dummy; // Empty structs are forbidden in C.
} Ark_Empty;

typedef struct Ark_Number {
  Ark_Int8 tag;
  union {
    Ark_Float32 f32;
    Ark_Int32 i32;
  };
} Ark_Number;

// Binary layout of Ark_Length must match that of KLength.
typedef struct Ark_Length
{
  Ark_Int8 type;
  Ark_Float32 value;
  Ark_Int32 unit;
  Ark_Int32 resource;
} Ark_Length;

typedef struct Ark_CustomObject {
  char kind[20];
  Ark_Int32 id;
  // Data of custom object.
  union {
    Ark_Int32 ints[4];
    Ark_Float32 floats[4];
    void* pointers[4];
    Ark_String string;
  };
} Ark_CustomObject;

typedef struct Ark_Undefined {
  Ark_Int32 dummy; // Empty structs are forbidden in C.
} Ark_Undefined;

typedef struct Ark_Function {
  Ark_Int32 id;
} Ark_Function;
typedef Ark_Function Ark_Callback;
typedef Ark_Function Ark_ErrorCallback;

typedef struct Ark_Materialized {
  Ark_NativePointer ptr;
} Ark_Materialized;

typedef Ark_CustomObject Ark_Resource;

// TODO: generate!
typedef struct Opt_Ark_Callback {
  enum Ark_Tag tag;
  Ark_CustomObject value;
} Opt_Ark_Callback;

enum %CPP_PREFIX%Ark_APIVariantKind {
    %CPP_PREFIX%BASIC = 10,
    %CPP_PREFIX%FULL = 11,
    %CPP_PREFIX%GRAPHICS = 12,
    %CPP_PREFIX%EXTENDED = 13,
    %CPP_PREFIX%COUNT = %CPP_PREFIX%EXTENDED + 1
};