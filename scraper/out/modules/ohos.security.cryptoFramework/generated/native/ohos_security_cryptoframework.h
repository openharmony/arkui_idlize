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

#ifndef OH_OHOS_SECURITY_CRYPTOFRAMEWORK_H
#define OH_OHOS_SECURITY_CRYPTOFRAMEWORK_H

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

#ifndef _INTEROP_TYPES_H_
#define _INTEROP_TYPES_H_

#ifdef __cplusplus
  #include <cstdint>
#else
  #include <stdint.h>
#endif

#ifdef __cplusplus
extern "C" [[noreturn]]
#endif
void InteropLogFatal(const char* format, ...);
#define INTEROP_FATAL(msg, ...) do { InteropLogFatal(msg, ##__VA_ARGS__); } while (0)

typedef enum InteropTag
{
  INTEROP_TAG_UNDEFINED = 101,
  INTEROP_TAG_INT32 = 102,
  INTEROP_TAG_FLOAT32 = 103,
  INTEROP_TAG_STRING = 104,
  INTEROP_TAG_LENGTH = 105,
  INTEROP_TAG_RESOURCE = 106,
  INTEROP_TAG_OBJECT = 107,
} InteropTag;

typedef enum InteropRuntimeType
{
  INTEROP_RUNTIME_UNEXPECTED = -1,
  INTEROP_RUNTIME_NUMBER = 1,
  INTEROP_RUNTIME_STRING = 2,
  INTEROP_RUNTIME_OBJECT = 3,
  INTEROP_RUNTIME_BOOLEAN = 4,
  INTEROP_RUNTIME_UNDEFINED = 5,
  INTEROP_RUNTIME_BIGINT = 6,
  INTEROP_RUNTIME_FUNCTION = 7,
  INTEROP_RUNTIME_SYMBOL = 8,
  INTEROP_RUNTIME_MATERIALIZED = 9,
} InteropRuntimeType;

typedef float InteropFloat32;
typedef double InteropFloat64;
typedef int32_t InteropInt32;
typedef unsigned int InteropUInt32; // Improve: update unsigned int
typedef int64_t InteropInt64;
typedef uint64_t InteropUInt64;
typedef int8_t InteropInt8;
typedef uint8_t InteropUInt8;
typedef int64_t InteropDate;
typedef int8_t InteropBoolean;
typedef const char* InteropCharPtr;
typedef void* InteropNativePointer;

struct _InteropVMContext;
typedef struct _InteropVMContext* InteropVMContext;
struct _InteropPipelineContext;
typedef struct _InteropPipelineContext* InteropPipelineContext;
struct _InteropVMObject;
typedef struct _InteropVMObject* InteropVMObject;
struct _InteropNode;
typedef struct _InteropNode* InteropNodeHandle;
typedef struct InteropDeferred {
    void* handler;
    void* context;
    void (*resolve)(struct InteropDeferred* thiz, uint8_t* data, int32_t length);
    void (*reject)(struct InteropDeferred* thiz, const char* message);
} InteropDeferred;

// Binary layout of InteropString must match that of KStringPtrImpl.
typedef struct InteropString {
  const char* chars;
  InteropInt32 length;
} InteropString;

typedef struct InteropEmpty {
  InteropInt32 dummy; // Empty structs are forbidden in C.
} InteropEmpty;

typedef struct InteropNumber {
  InteropInt8 tag;
  union {
    InteropFloat32 f32;
    InteropInt32 i32;
  };
} InteropNumber;

typedef struct InteropCustomObject {
  char kind[20];
  InteropInt32 id;
  // Data of custom object.
  union {
    InteropInt32 ints[4];
    InteropFloat32 floats[4];
    void* pointers[4];
    InteropString string;
  };
} InteropCustomObject;

typedef struct InteropUndefined {
  InteropInt32 dummy; // Empty structs are forbidden in C.
} InteropUndefined;

typedef struct InteropVoid {
  InteropInt32 dummy; // Empty structs are forbidden in C.
} InteropVoid;

typedef struct InteropFunction {
  InteropInt32 id;
} InteropFunction;
typedef InteropFunction InteropCallback;
typedef InteropFunction InteropErrorCallback;

typedef struct InteropMaterialized {
  InteropNativePointer ptr;
} InteropMaterialized;

typedef struct InteropCallbackResource {
  InteropInt32 resourceId;
  void (*hold)(InteropInt32 resourceId);
  void (*release)(InteropInt32 resourceId);
} InteropCallbackResource;

typedef struct InteropBuffer {
  InteropCallbackResource resource;
  InteropNativePointer data;
  InteropInt64 length;
} InteropBuffer;

typedef struct InteropAsyncWork {
  InteropNativePointer workId;
  void (*queue)(InteropNativePointer workId);
  void (*cancel)(InteropNativePointer workId);
} InteropAsyncWork;

typedef struct InteropAsyncWorker {
  InteropAsyncWork (*createWork)(
    InteropVMContext context,
    InteropNativePointer handle,
    void (*execute)(InteropNativePointer handle),
    void (*complete)(InteropNativePointer handle)
  );
} InteropAsyncWorker;
typedef const InteropAsyncWorker* InteropAsyncWorkerPtr;

typedef struct InteropObject {
  InteropCallbackResource resource;
} InteropObject;

#endif // _INTEROP_TYPES_H_


#define OHOS_SECURITY_CRYPTOFRAMEWORK_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_SECURITY_CRYPTOFRAMEWORK_RuntimeType;

typedef InteropFloat32 OH_Float32;
typedef InteropFloat64 OH_Float64;
typedef InteropInt32 OH_Int32;
typedef InteropUInt32 OH_UInt32;
typedef InteropInt64 OH_Int64;
typedef InteropUInt64 OH_UInt64;
typedef InteropInt8 OH_Int8;
typedef InteropUInt8 OH_UInt8;
typedef InteropBoolean OH_Boolean;
typedef InteropCharPtr OH_CharPtr;
typedef InteropNativePointer OH_NativePointer;
typedef InteropString OH_String;
typedef InteropCallbackResource OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_SECURITY_CRYPTOFRAMEWORK_VMContext;
typedef InteropAsyncWorker OH_OHOS_SECURITY_CRYPTOFRAMEWORK_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_SECURITY_CRYPTOFRAMEWORK_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_SECURITY_CRYPTOFRAMEWORK_APIKind {
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API_KIND = 10
} OH_OHOS_SECURITY_CRYPTOFRAMEWORK_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Opt_Int64 Opt_Int64;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob;
typedef struct Opt_cryptoFramework_DataBlob Opt_cryptoFramework_DataBlob;
typedef struct Opt_String Opt_String;
typedef struct OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyPeer OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyPeer;
typedef struct OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyPeer* OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key;
typedef struct Opt_cryptoFramework_Key Opt_cryptoFramework_Key;
typedef struct OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyPeer OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyPeer;
typedef struct OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyPeer* OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey;
typedef struct Opt_cryptoFramework_PubKey Opt_cryptoFramework_PubKey;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32 OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32;
typedef struct Opt_Union_Bigint_String_I32 Opt_Union_Bigint_String_I32;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Object;
typedef enum OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem {
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DSA_P_BN = 101,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DSA_Q_BN = 102,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DSA_G_BN = 103,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DSA_SK_BN = 104,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DSA_PK_BN = 105,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_FP_P_BN = 201,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_A_BN = 202,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_B_BN = 203,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_G_X_BN = 204,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_G_Y_BN = 205,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_N_BN = 206,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_H_NUM = 207,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_SK_BN = 208,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_PK_X_BN = 209,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_PK_Y_BN = 210,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_FIELD_TYPE_STR = 211,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_FIELD_SIZE_NUM = 212,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ECC_CURVE_NAME_STR = 213,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_RSA_N_BN = 301,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_RSA_SK_BN = 302,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_RSA_PK_BN = 303,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DH_P_BN = 401,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DH_G_BN = 402,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DH_L_NUM = 403,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DH_SK_BN = 404,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_DH_PK_BN = 405,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ED25519_SK_BN = 501,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_ED25519_PK_BN = 502,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_X25519_SK_BN = 601,
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_CRYPTO_FRAMEWORK_ASY_KEY_SPEC_ITEM_X25519_PK_BN = 602,
} OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem;
typedef struct Opt_cryptoFramework_AsyKeySpecItem {
    OH_Tag tag;
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem value;
} Opt_cryptoFramework_AsyKeySpecItem;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Opt_Buffer {
    OH_Tag tag;
    OH_Buffer value;
} Opt_Buffer;
typedef struct Opt_Int64 {
    OH_Tag tag;
    OH_Int64 value;
} Opt_Int64;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob {
    /* kind: Interface */
    OH_Buffer data;
} OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob;
typedef struct Opt_cryptoFramework_DataBlob {
    OH_Tag tag;
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob value;
} Opt_cryptoFramework_DataBlob;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct Opt_cryptoFramework_Key {
    OH_Tag tag;
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_Key value;
} Opt_cryptoFramework_Key;
typedef struct Opt_cryptoFramework_PubKey {
    OH_Tag tag;
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKey value;
} Opt_cryptoFramework_PubKey;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32 {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_Int64 value0;
        OH_String value1;
        OH_Int32 value2;
    };
} OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32;
typedef struct Opt_Union_Bigint_String_I32 {
    OH_Tag tag;
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32 value;
} Opt_Union_Bigint_String_I32;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandleOpaque;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandleOpaque* OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandle;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyModifier {
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandle (*construct)();
    void (*destruct)(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyHandle thisPtr);
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob (*getEncoded)(OH_NativePointer thisPtr);
    OH_String (*getFormat)(OH_NativePointer thisPtr);
    OH_String (*getAlgName)(OH_NativePointer thisPtr);
} OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyModifier;
struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandleOpaque;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandleOpaque* OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandle;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyModifier {
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandle (*construct)();
    void (*destruct)(OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyHandle thisPtr);
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_Union_Bigint_String_I32 (*getAsyKeySpec)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_AsyKeySpecItem itemType);
    OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_DataBlob (*getEncodedDer)(OH_NativePointer thisPtr, const OH_String* format);
    OH_String (*getEncodedPem)(OH_NativePointer thisPtr, const OH_String* format);
} OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyModifier;
typedef struct OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API {
    OH_Int32 version;
    const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_KeyModifier* (*CryptoFramework_Key)();
    const OH_OHOS_SECURITY_CRYPTOFRAMEWORK_cryptoFramework_PubKeyModifier* (*CryptoFramework_PubKey)();
} OH_OHOS_SECURITY_CRYPTOFRAMEWORK_API;
#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_ANY_API_H
#include <stdint.h>
// Improve: remove after migration to OH_AnyAPI to be consistant between arkoala and ohos apis
struct Ark_AnyAPI {
    int32_t version;
};
struct OH_AnyAPI {
    int32_t version;
};
#endif
#ifndef GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#define GENERATED_FOUNDATION_ACE_FRAMEWORKS_CORE_INTERFACES_GENERIC_SERVICE_API_H
#include <stdint.h>
#define GENERIC_SERVICE_API_VERSION 1
enum GENERIC_SERVICE_APIKind {
    GENERIC_SERVICE_API_KIND = 14,
};

typedef struct ServiceLogger {
    void (*startGroupedLog)(int kind);
    void (*stopGroupedLog)(int kind);
    void (*appendGroupedLog)(int kind, const char* str);
    const char* (*getGroupedLog)(int kind);
    int (*needGroupedLog)(int kind);
} ServiceLogger;

typedef struct GenericServiceAPI {
    int32_t version;
    void (*setLogger)(const ServiceLogger* logger);
} GenericServiceAPI;
#endif

#ifdef __cplusplus
}  // extern "C"
#endif

#endif // OH_OHOS_SECURITY_CRYPTOFRAMEWORK_H
/* clang-format on */