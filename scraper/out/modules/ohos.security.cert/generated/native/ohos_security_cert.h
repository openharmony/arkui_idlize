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

#ifndef OH_OHOS_SECURITY_CERT_H
#define OH_OHOS_SECURITY_CERT_H

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


#define OHOS_SECURITY_CERT_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_SECURITY_CERT_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_SECURITY_CERT_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_SECURITY_CERT_VMContext;
typedef InteropAsyncWorker OH_OHOS_SECURITY_CERT_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_SECURITY_CERT_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_SECURITY_CERT_APIKind {
    OH_OHOS_SECURITY_CERT_API_KIND = 10
} OH_OHOS_SECURITY_CERT_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_Boolean Array_Boolean;
typedef struct Opt_Array_Boolean Opt_Array_Boolean;
typedef struct Array_Buffer Array_Buffer;
typedef struct Opt_Array_Buffer Opt_Array_Buffer;
typedef struct Array_cert_GeneralName Array_cert_GeneralName;
typedef struct Opt_Array_cert_GeneralName Opt_Array_cert_GeneralName;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Int64 Opt_Int64;
typedef struct OHOS_SECURITY_CERT_cert_CertExtensionPeer OHOS_SECURITY_CERT_cert_CertExtensionPeer;
typedef struct OHOS_SECURITY_CERT_cert_CertExtensionPeer* OH_OHOS_SECURITY_CERT_cert_CertExtension;
typedef struct Opt_cert_CertExtension Opt_cert_CertExtension;
typedef struct OH_OHOS_SECURITY_CERT_cert_DataArray OH_OHOS_SECURITY_CERT_cert_DataArray;
typedef struct Opt_cert_DataArray Opt_cert_DataArray;
typedef struct OH_OHOS_SECURITY_CERT_cert_DataBlob OH_OHOS_SECURITY_CERT_cert_DataBlob;
typedef struct Opt_cert_DataBlob Opt_cert_DataBlob;
typedef struct OHOS_SECURITY_CERT_cert_X500DistinguishedNamePeer OHOS_SECURITY_CERT_cert_X500DistinguishedNamePeer;
typedef struct OHOS_SECURITY_CERT_cert_X500DistinguishedNamePeer* OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName;
typedef struct Opt_cert_X500DistinguishedName Opt_cert_X500DistinguishedName;
typedef struct OHOS_SECURITY_CERT_cert_X509CertPeer OHOS_SECURITY_CERT_cert_X509CertPeer;
typedef struct OHOS_SECURITY_CERT_cert_X509CertPeer* OH_OHOS_SECURITY_CERT_cert_X509Cert;
typedef struct Opt_cert_X509Cert Opt_cert_X509Cert;
typedef struct Opt_String Opt_String;
typedef struct OHOS_SECURITY_CERT_AsyncCallback OHOS_SECURITY_CERT_AsyncCallback;
typedef struct Opt_OHOS_SECURITY_CERT_AsyncCallback Opt_OHOS_SECURITY_CERT_AsyncCallback;
typedef struct OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void Opt_OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void;
typedef struct OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void;
typedef struct Opt_OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void Opt_OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void;
typedef struct OHOS_SECURITY_CERT_Callback_Void OHOS_SECURITY_CERT_Callback_Void;
typedef struct Opt_OHOS_SECURITY_CERT_Callback_Void Opt_OHOS_SECURITY_CERT_Callback_Void;
typedef struct OHOS_SECURITY_CERT_BusinessErrorPeer OHOS_SECURITY_CERT_BusinessErrorPeer;
typedef struct OHOS_SECURITY_CERT_BusinessErrorPeer* OH_OHOS_SECURITY_CERT_BusinessError;
typedef struct Opt_BusinessError Opt_BusinessError;
typedef struct OH_OHOS_SECURITY_CERT_cert_EncodingBlob OH_OHOS_SECURITY_CERT_cert_EncodingBlob;
typedef struct Opt_cert_EncodingBlob Opt_cert_EncodingBlob;
typedef struct OH_OHOS_SECURITY_CERT_cert_GeneralName OH_OHOS_SECURITY_CERT_cert_GeneralName;
typedef struct Opt_cert_GeneralName Opt_cert_GeneralName;
typedef struct OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters;
typedef struct Opt_cert_X509CertMatchParameters Opt_cert_X509CertMatchParameters;
typedef struct OHOS_SECURITY_CERT_cryptoFramework_PubKeyPeer OHOS_SECURITY_CERT_cryptoFramework_PubKeyPeer;
typedef struct OHOS_SECURITY_CERT_cryptoFramework_PubKeyPeer* OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey;
typedef struct Opt_cryptoFramework_PubKey Opt_cryptoFramework_PubKey;
typedef struct Opt_Object Opt_Object;
typedef OH_Object OH_OHOS_SECURITY_CERT_Object;
typedef enum OH_OHOS_SECURITY_CERT_cert_CertItemType {
    OH_OHOS_SECURITY_CERT_CERT_CERT_ITEM_TYPE_CERT_ITEM_TYPE_TBS = 0,
    OH_OHOS_SECURITY_CERT_CERT_CERT_ITEM_TYPE_CERT_ITEM_TYPE_PUBLIC_KEY = 1,
    OH_OHOS_SECURITY_CERT_CERT_CERT_ITEM_TYPE_CERT_ITEM_TYPE_ISSUER_UNIQUE_ID = 2,
    OH_OHOS_SECURITY_CERT_CERT_CERT_ITEM_TYPE_CERT_ITEM_TYPE_SUBJECT_UNIQUE_ID = 3,
    OH_OHOS_SECURITY_CERT_CERT_CERT_ITEM_TYPE_CERT_ITEM_TYPE_EXTENSIONS = 4,
} OH_OHOS_SECURITY_CERT_cert_CertItemType;
typedef struct Opt_cert_CertItemType {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_CertItemType value;
} Opt_cert_CertItemType;
typedef enum OH_OHOS_SECURITY_CERT_cert_EncodingFormat {
    OH_OHOS_SECURITY_CERT_CERT_ENCODING_FORMAT_FORMAT_DER = 0,
    OH_OHOS_SECURITY_CERT_CERT_ENCODING_FORMAT_FORMAT_PEM = 1,
    OH_OHOS_SECURITY_CERT_CERT_ENCODING_FORMAT_FORMAT_PKCS7 = 2,
} OH_OHOS_SECURITY_CERT_cert_EncodingFormat;
typedef struct Opt_cert_EncodingFormat {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_EncodingFormat value;
} Opt_cert_EncodingFormat;
typedef enum OH_OHOS_SECURITY_CERT_cert_EncodingType {
    OH_OHOS_SECURITY_CERT_CERT_ENCODING_TYPE_ENCODING_UTF8 = 0,
} OH_OHOS_SECURITY_CERT_cert_EncodingType;
typedef struct Opt_cert_EncodingType {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_EncodingType value;
} Opt_cert_EncodingType;
typedef enum OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType {
    OH_OHOS_SECURITY_CERT_CERT_EXTENSION_ENTRY_TYPE_EXTENSION_ENTRY_TYPE_ENTRY = 0,
    OH_OHOS_SECURITY_CERT_CERT_EXTENSION_ENTRY_TYPE_EXTENSION_ENTRY_TYPE_ENTRY_CRITICAL = 1,
    OH_OHOS_SECURITY_CERT_CERT_EXTENSION_ENTRY_TYPE_EXTENSION_ENTRY_TYPE_ENTRY_VALUE = 2,
} OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType;
typedef struct Opt_cert_ExtensionEntryType {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType value;
} Opt_cert_ExtensionEntryType;
typedef enum OH_OHOS_SECURITY_CERT_cert_ExtensionOidType {
    OH_OHOS_SECURITY_CERT_CERT_EXTENSION_OID_TYPE_EXTENSION_OID_TYPE_ALL = 0,
    OH_OHOS_SECURITY_CERT_CERT_EXTENSION_OID_TYPE_EXTENSION_OID_TYPE_CRITICAL = 1,
    OH_OHOS_SECURITY_CERT_CERT_EXTENSION_OID_TYPE_EXTENSION_OID_TYPE_UNCRITICAL = 2,
} OH_OHOS_SECURITY_CERT_cert_ExtensionOidType;
typedef struct Opt_cert_ExtensionOidType {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_ExtensionOidType value;
} Opt_cert_ExtensionOidType;
typedef enum OH_OHOS_SECURITY_CERT_cert_GeneralNameType {
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_OTHER_NAME = 0,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_RFC822_NAME = 1,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_DNS_NAME = 2,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_X400_ADDRESS = 3,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_DIRECTORY_NAME = 4,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_EDI_PARTY_NAME = 5,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_UNIFORM_RESOURCE_ID = 6,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_IP_ADDRESS = 7,
    OH_OHOS_SECURITY_CERT_CERT_GENERAL_NAME_TYPE_GENERAL_NAME_TYPE_REGISTERED_ID = 8,
} OH_OHOS_SECURITY_CERT_cert_GeneralNameType;
typedef struct Opt_cert_GeneralNameType {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_GeneralNameType value;
} Opt_cert_GeneralNameType;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_Boolean {
    /* kind: ContainerType */
    OH_Boolean* array;
    OH_Int32 length;
} Array_Boolean;
typedef struct Opt_Array_Boolean {
    OH_Tag tag;
    Array_Boolean value;
} Opt_Array_Boolean;
typedef struct Array_Buffer {
    /* kind: ContainerType */
    OH_Buffer* array;
    OH_Int32 length;
} Array_Buffer;
typedef struct Opt_Array_Buffer {
    OH_Tag tag;
    Array_Buffer value;
} Opt_Array_Buffer;
typedef struct Array_cert_GeneralName {
    /* kind: ContainerType */
    OH_OHOS_SECURITY_CERT_cert_GeneralName* array;
    OH_Int32 length;
} Array_cert_GeneralName;
typedef struct Opt_Array_cert_GeneralName {
    OH_Tag tag;
    Array_cert_GeneralName value;
} Opt_Array_cert_GeneralName;
typedef struct Array_String {
    /* kind: ContainerType */
    OH_String* array;
    OH_Int32 length;
} Array_String;
typedef struct Opt_Array_String {
    OH_Tag tag;
    Array_String value;
} Opt_Array_String;
typedef struct Opt_Boolean {
    OH_Tag tag;
    OH_Boolean value;
} Opt_Boolean;
typedef struct Opt_Buffer {
    OH_Tag tag;
    OH_Buffer value;
} Opt_Buffer;
typedef struct Opt_CustomObject {
    OH_Tag tag;
    OH_CustomObject value;
} Opt_CustomObject;
typedef struct Opt_Int64 {
    OH_Tag tag;
    OH_Int64 value;
} Opt_Int64;
typedef struct Opt_cert_CertExtension {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_CertExtension value;
} Opt_cert_CertExtension;
typedef struct OH_OHOS_SECURITY_CERT_cert_DataArray {
    /* kind: Interface */
    Array_Buffer data;
} OH_OHOS_SECURITY_CERT_cert_DataArray;
typedef struct Opt_cert_DataArray {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_DataArray value;
} Opt_cert_DataArray;
typedef struct OH_OHOS_SECURITY_CERT_cert_DataBlob {
    /* kind: Interface */
    OH_Buffer data;
} OH_OHOS_SECURITY_CERT_cert_DataBlob;
typedef struct Opt_cert_DataBlob {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_DataBlob value;
} Opt_cert_DataBlob;
typedef struct Opt_cert_X500DistinguishedName {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName value;
} Opt_cert_X500DistinguishedName;
typedef struct Opt_cert_X509Cert {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_X509Cert value;
} Opt_cert_X509Cert;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_SECURITY_CERT_AsyncCallback {
    /* kind: Callback */
    OH_OHOS_SECURITY_CERT_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
    void (*callSync)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
} OHOS_SECURITY_CERT_AsyncCallback;
typedef struct Opt_OHOS_SECURITY_CERT_AsyncCallback {
    OH_Tag tag;
    OHOS_SECURITY_CERT_AsyncCallback value;
} Opt_OHOS_SECURITY_CERT_AsyncCallback;
typedef struct OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_SECURITY_CERT_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error);
} OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void value;
} Opt_OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void;
typedef struct OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_SECURITY_CERT_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void;
typedef struct Opt_OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void value;
} Opt_OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void;
typedef struct OHOS_SECURITY_CERT_Callback_Void {
    /* kind: Callback */
    OH_OHOS_SECURITY_CERT_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_SECURITY_CERT_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_SECURITY_CERT_Callback_Void;
typedef struct Opt_OHOS_SECURITY_CERT_Callback_Void {
    OH_Tag tag;
    OHOS_SECURITY_CERT_Callback_Void value;
} Opt_OHOS_SECURITY_CERT_Callback_Void;
typedef struct Opt_BusinessError {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_BusinessError value;
} Opt_BusinessError;
typedef struct OH_OHOS_SECURITY_CERT_cert_EncodingBlob {
    /* kind: Interface */
    OH_Buffer data;
    OH_OHOS_SECURITY_CERT_cert_EncodingFormat encodingFormat;
} OH_OHOS_SECURITY_CERT_cert_EncodingBlob;
typedef struct Opt_cert_EncodingBlob {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_EncodingBlob value;
} Opt_cert_EncodingBlob;
typedef struct OH_OHOS_SECURITY_CERT_cert_GeneralName {
    /* kind: Interface */
    OH_OHOS_SECURITY_CERT_cert_GeneralNameType type;
    Opt_Buffer name;
} OH_OHOS_SECURITY_CERT_cert_GeneralName;
typedef struct Opt_cert_GeneralName {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_GeneralName value;
} Opt_cert_GeneralName;
typedef struct OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters {
    /* kind: Interface */
    Opt_Array_cert_GeneralName subjectAlternativeNames;
    Opt_Boolean matchAllSubjectAltNames;
    Opt_Buffer authorityKeyIdentifier;
    Opt_Int32 minPathLenConstraint;
    Opt_cert_X509Cert x509Cert;
    Opt_String validDate;
    Opt_Buffer issuer;
    Opt_Array_String extendedKeyUsage;
    Opt_Buffer nameConstraints;
    Opt_Array_String certPolicy;
    Opt_String privateKeyValid;
    Opt_Array_Boolean keyUsage;
    Opt_Int64 serialNumber;
    Opt_Buffer subject;
    Opt_Buffer subjectKeyIdentifier;
    Opt_cert_DataBlob publicKey;
    Opt_String publicKeyAlgID;
} OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters;
typedef struct Opt_cert_X509CertMatchParameters {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters value;
} Opt_cert_X509CertMatchParameters;
typedef struct Opt_cryptoFramework_PubKey {
    OH_Tag tag;
    OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey value;
} Opt_cryptoFramework_PubKey;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
struct OH_OHOS_SECURITY_CERT_cert_CertExtensionHandleOpaque;
typedef struct OH_OHOS_SECURITY_CERT_cert_CertExtensionHandleOpaque* OH_OHOS_SECURITY_CERT_cert_CertExtensionHandle;
typedef struct OH_OHOS_SECURITY_CERT_cert_CertExtensionModifier {
    OH_OHOS_SECURITY_CERT_cert_CertExtensionHandle (*construct)();
    void (*destruct)(OH_OHOS_SECURITY_CERT_cert_CertExtensionHandle thisPtr);
    OH_OHOS_SECURITY_CERT_cert_EncodingBlob (*getEncoded)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataArray (*getOidList)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_ExtensionOidType valueType);
    OH_OHOS_SECURITY_CERT_cert_DataBlob (*getEntry)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_ExtensionEntryType valueType, const OH_OHOS_SECURITY_CERT_cert_DataBlob* oid);
    OH_Int32 (*checkCA)(OH_NativePointer thisPtr);
    OH_Boolean (*hasUnsupportedCriticalExtension)(OH_NativePointer thisPtr);
} OH_OHOS_SECURITY_CERT_cert_CertExtensionModifier;
struct OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameHandleOpaque;
typedef struct OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameHandleOpaque* OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameHandle;
typedef struct OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameModifier {
    OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameHandle (*construct)();
    void (*destruct)(OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameHandle thisPtr);
    OH_String (*getName0)(OH_NativePointer thisPtr);
    OH_String (*getName1)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_EncodingType encodingType);
    Array_String (*getName2)(OH_NativePointer thisPtr, const OH_String* type);
    OH_OHOS_SECURITY_CERT_cert_EncodingBlob (*getEncoded)(OH_NativePointer thisPtr);
} OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameModifier;
struct OH_OHOS_SECURITY_CERT_cert_X509CertHandleOpaque;
typedef struct OH_OHOS_SECURITY_CERT_cert_X509CertHandleOpaque* OH_OHOS_SECURITY_CERT_cert_X509CertHandle;
typedef struct OH_OHOS_SECURITY_CERT_cert_X509CertModifier {
    OH_OHOS_SECURITY_CERT_cert_X509CertHandle (*construct)();
    void (*destruct)(OH_OHOS_SECURITY_CERT_cert_X509CertHandle thisPtr);
    void (*verify0)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey key, const OHOS_SECURITY_CERT_AsyncCallback* callback_);
    void (*verify1)(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_OHOS_SECURITY_CERT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey key, const OHOS_SECURITY_CERT_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getEncoded0)(OH_NativePointer thisPtr, const OHOS_SECURITY_CERT_AsyncCallback* callback_);
    void (*getEncoded1)(OH_OHOS_SECURITY_CERT_VMContext vmContext, OH_OHOS_SECURITY_CERT_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_SECURITY_CERT_Callback_Opt_EncodingBlob_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_OHOS_SECURITY_CERT_cryptoFramework_PubKey (*getPublicKey)(OH_NativePointer thisPtr);
    void (*checkValidityWithDate)(OH_NativePointer thisPtr, const OH_String* date);
    OH_Int32 (*getVersion)(OH_NativePointer thisPtr);
    OH_Int64 (*getCertSerialNumber)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataBlob (*getIssuerName0)(OH_NativePointer thisPtr);
    OH_String (*getIssuerName1)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_EncodingType encodingType);
    OH_OHOS_SECURITY_CERT_cert_DataBlob (*getSubjectName)(OH_NativePointer thisPtr, const Opt_cert_EncodingType* encodingType);
    OH_String (*getNotBeforeTime)(OH_NativePointer thisPtr);
    OH_String (*getNotAfterTime)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataBlob (*getSignature)(OH_NativePointer thisPtr);
    OH_String (*getSignatureAlgName)(OH_NativePointer thisPtr);
    OH_String (*getSignatureAlgOid)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataBlob (*getSignatureAlgParams)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataBlob (*getKeyUsage)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataArray (*getExtKeyUsage)(OH_NativePointer thisPtr);
    OH_Int32 (*getBasicConstraints)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataArray (*getSubjectAltNames)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataArray (*getIssuerAltNames)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_DataBlob (*getItem)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_CertItemType itemType);
    OH_Boolean (*match)(OH_NativePointer thisPtr, const OH_OHOS_SECURITY_CERT_cert_X509CertMatchParameters* param);
    OH_OHOS_SECURITY_CERT_cert_DataArray (*getCRLDistributionPoint)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName (*getIssuerX500DistinguishedName)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_X500DistinguishedName (*getSubjectX500DistinguishedName)(OH_NativePointer thisPtr);
    OH_String (*toString0)(OH_NativePointer thisPtr);
    OH_String (*toString1)(OH_NativePointer thisPtr, OH_OHOS_SECURITY_CERT_cert_EncodingType encodingType);
    OH_Buffer (*hashCode)(OH_NativePointer thisPtr);
    OH_OHOS_SECURITY_CERT_cert_CertExtension (*getExtensionsObject)(OH_NativePointer thisPtr);
} OH_OHOS_SECURITY_CERT_cert_X509CertModifier;
typedef struct OH_OHOS_SECURITY_CERT_API {
    OH_Int32 version;
    const OH_OHOS_SECURITY_CERT_cert_CertExtensionModifier* (*Cert_CertExtension)();
    const OH_OHOS_SECURITY_CERT_cert_X500DistinguishedNameModifier* (*Cert_X500DistinguishedName)();
    const OH_OHOS_SECURITY_CERT_cert_X509CertModifier* (*Cert_X509Cert)();
} OH_OHOS_SECURITY_CERT_API;
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

#endif // OH_OHOS_SECURITY_CERT_H
/* clang-format on */