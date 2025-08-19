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

#ifndef OH_OHOS_WEB_WEBVIEW_H
#define OH_OHOS_WEB_WEBVIEW_H

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


#define OHOS_WEB_WEBVIEW_API_VERSION 1

#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

typedef InteropTag OH_Tag;
typedef InteropRuntimeType OH_OHOS_WEB_WEBVIEW_RuntimeType;

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
typedef InteropCallbackResource OH_OHOS_WEB_WEBVIEW_CallbackResource;
typedef InteropNumber OH_Number;
typedef InteropMaterialized OH_Materialized;
typedef InteropCustomObject OH_CustomObject;
typedef InteropUndefined OH_Undefined;
// typedef InteropAPIKind OH_APIKind;
typedef InteropVMContext OH_OHOS_WEB_WEBVIEW_VMContext;
typedef InteropAsyncWorker OH_OHOS_WEB_WEBVIEW_AsyncWorker;
typedef InteropAsyncWorkerPtr OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr;
typedef InteropBuffer OH_Buffer;
typedef InteropFunction OH_Function;
typedef InteropObject OH_Object;

typedef enum OH_OHOS_WEB_WEBVIEW_APIKind {
    OH_OHOS_WEB_WEBVIEW_API_KIND = 10
} OH_OHOS_WEB_WEBVIEW_APIKind;

typedef struct Opt_NativePointer {
    OH_Tag tag;
    OH_NativePointer value;
} Opt_NativePointer;

typedef struct Opt_Int32 Opt_Int32;
typedef struct Array_cert_X509Cert Array_cert_X509Cert;
typedef struct Opt_Array_cert_X509Cert Opt_Array_cert_X509Cert;
typedef struct Array_String Array_String;
typedef struct Opt_Array_String Opt_Array_String;
typedef struct Array_Union_String_Number_Boolean Array_Union_String_Number_Boolean;
typedef struct Opt_Array_Union_String_Number_Boolean Opt_Array_Union_String_Number_Boolean;
typedef struct Array_webview_MediaSourceInfo Array_webview_MediaSourceInfo;
typedef struct Opt_Array_webview_MediaSourceInfo Opt_Array_webview_MediaSourceInfo;
typedef struct Array_webview_OfflineResourceMap Array_webview_OfflineResourceMap;
typedef struct Opt_Array_webview_OfflineResourceMap Opt_Array_webview_OfflineResourceMap;
typedef struct Array_webview_WebCustomScheme Array_webview_WebCustomScheme;
typedef struct Opt_Array_webview_WebCustomScheme Opt_Array_webview_WebCustomScheme;
typedef struct Array_webview_WebHeader Array_webview_WebHeader;
typedef struct Opt_Array_webview_WebHeader Opt_Array_webview_WebHeader;
typedef struct Array_webview_WebMessagePort Array_webview_WebMessagePort;
typedef struct Opt_Array_webview_WebMessagePort Opt_Array_webview_WebMessagePort;
typedef struct Map_String_String Map_String_String;
typedef struct Opt_Map_String_String Opt_Map_String_String;
typedef struct Opt_Boolean Opt_Boolean;
typedef struct Opt_Buffer Opt_Buffer;
typedef struct Opt_CustomObject Opt_CustomObject;
typedef struct Opt_Float64 Opt_Float64;
typedef struct Opt_Number Opt_Number;
typedef struct Opt_Object Opt_Object;
typedef struct OHOS_WEB_WEBVIEW_cert_X509CertPeer OHOS_WEB_WEBVIEW_cert_X509CertPeer;
typedef struct OHOS_WEB_WEBVIEW_cert_X509CertPeer* OH_OHOS_WEB_WEBVIEW_cert_X509Cert;
typedef struct Opt_cert_X509Cert Opt_cert_X509Cert;
typedef struct OHOS_WEB_WEBVIEW_image_PixelMapPeer OHOS_WEB_WEBVIEW_image_PixelMapPeer;
typedef struct OHOS_WEB_WEBVIEW_image_PixelMapPeer* OH_OHOS_WEB_WEBVIEW_image_PixelMap;
typedef struct Opt_image_PixelMap Opt_image_PixelMap;
typedef struct OHOS_WEB_WEBVIEW_print_PrintDocumentAdapterPeer OHOS_WEB_WEBVIEW_print_PrintDocumentAdapterPeer;
typedef struct OHOS_WEB_WEBVIEW_print_PrintDocumentAdapterPeer* OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter;
typedef struct Opt_print_PrintDocumentAdapter Opt_print_PrintDocumentAdapter;
typedef struct OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsPeer OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsPeer* OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions;
typedef struct Opt_webview_BackForwardCacheOptions Opt_webview_BackForwardCacheOptions;
typedef struct OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesPeer OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesPeer* OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures;
typedef struct Opt_webview_BackForwardCacheSupportedFeatures Opt_webview_BackForwardCacheSupportedFeatures;
typedef struct OHOS_WEB_WEBVIEW_webview_BackForwardListPeer OHOS_WEB_WEBVIEW_webview_BackForwardListPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_BackForwardListPeer* OH_OHOS_WEB_WEBVIEW_webview_BackForwardList;
typedef struct Opt_webview_BackForwardList Opt_webview_BackForwardList;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_CacheOptions OH_OHOS_WEB_WEBVIEW_webview_CacheOptions;
typedef struct Opt_webview_CacheOptions Opt_webview_CacheOptions;
typedef struct OHOS_WEB_WEBVIEW_webview_JsMessageExtPeer OHOS_WEB_WEBVIEW_webview_JsMessageExtPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_JsMessageExtPeer* OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt;
typedef struct Opt_webview_JsMessageExt Opt_webview_JsMessageExt;
typedef struct OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerPeer OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerPeer* OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler;
typedef struct Opt_webview_NativeMediaPlayerHandler Opt_webview_NativeMediaPlayerHandler;
typedef struct OHOS_WEB_WEBVIEW_webview_PdfDataPeer OHOS_WEB_WEBVIEW_webview_PdfDataPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_PdfDataPeer* OH_OHOS_WEB_WEBVIEW_webview_PdfData;
typedef struct Opt_webview_PdfData Opt_webview_PdfData;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_RectEvent OH_OHOS_WEB_WEBVIEW_webview_RectEvent;
typedef struct Opt_webview_RectEvent Opt_webview_RectEvent;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset;
typedef struct Opt_webview_ScrollOffset Opt_webview_ScrollOffset;
typedef struct OHOS_WEB_WEBVIEW_webview_WebDownloadDelegatePeer OHOS_WEB_WEBVIEW_webview_WebDownloadDelegatePeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebDownloadDelegatePeer* OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate;
typedef struct Opt_webview_WebDownloadDelegate Opt_webview_WebDownloadDelegate;
typedef struct OHOS_WEB_WEBVIEW_webview_WebDownloadItemPeer OHOS_WEB_WEBVIEW_webview_WebDownloadItemPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebDownloadItemPeer* OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem;
typedef struct Opt_webview_WebDownloadItem Opt_webview_WebDownloadItem;
typedef struct OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamPeer OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamPeer* OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream;
typedef struct Opt_webview_WebHttpBodyStream Opt_webview_WebHttpBodyStream;
typedef struct OHOS_WEB_WEBVIEW_webview_WebMessageExtPeer OHOS_WEB_WEBVIEW_webview_WebMessageExtPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebMessageExtPeer* OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt;
typedef struct Opt_webview_WebMessageExt Opt_webview_WebMessageExt;
typedef struct OHOS_WEB_WEBVIEW_webview_WebResourceHandlerPeer OHOS_WEB_WEBVIEW_webview_WebResourceHandlerPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebResourceHandlerPeer* OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler;
typedef struct Opt_webview_WebResourceHandler Opt_webview_WebResourceHandler;
typedef struct OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerPeer OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerPeer* OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler;
typedef struct Opt_webview_WebSchemeHandler Opt_webview_WebSchemeHandler;
typedef struct OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestPeer OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestPeer* OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest;
typedef struct Opt_webview_WebSchemeHandlerRequest Opt_webview_WebSchemeHandlerRequest;
typedef struct OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponsePeer OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponsePeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponsePeer* OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse;
typedef struct Opt_webview_WebSchemeHandlerResponse Opt_webview_WebSchemeHandlerResponse;
typedef struct OHOS_WEB_WEBVIEW_webview_WebviewControllerPeer OHOS_WEB_WEBVIEW_webview_WebviewControllerPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebviewControllerPeer* OH_OHOS_WEB_WEBVIEW_webview_WebviewController;
typedef struct Opt_webview_WebviewController Opt_webview_WebviewController;
typedef struct Opt_String Opt_String;
typedef struct OHOS_WEB_WEBVIEW_AsyncCallback OHOS_WEB_WEBVIEW_AsyncCallback;
typedef struct Opt_OHOS_WEB_WEBVIEW_AsyncCallback Opt_OHOS_WEB_WEBVIEW_AsyncCallback;
typedef struct OHOS_WEB_WEBVIEW_Callback_Boolean_Void OHOS_WEB_WEBVIEW_Callback_Boolean_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Boolean_Void Opt_OHOS_WEB_WEBVIEW_Callback_Boolean_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void Opt_OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void Opt_OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Void OHOS_WEB_WEBVIEW_Callback_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Void Opt_OHOS_WEB_WEBVIEW_Callback_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean;
typedef struct OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback Opt_OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback;
typedef struct OHOS_WEB_WEBVIEW_webview_ResumePlayerFn OHOS_WEB_WEBVIEW_webview_ResumePlayerFn;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn;
typedef struct OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn;
typedef struct OHOS_WEB_WEBVIEW_BusinessErrorPeer OHOS_WEB_WEBVIEW_BusinessErrorPeer;
typedef struct OHOS_WEB_WEBVIEW_BusinessErrorPeer* OH_OHOS_WEB_WEBVIEW_BusinessError;
typedef struct Opt_BusinessError Opt_BusinessError;
typedef struct OH_OHOS_WEB_WEBVIEW_Union_String_Buffer OH_OHOS_WEB_WEBVIEW_Union_String_Buffer;
typedef struct Opt_Union_String_Buffer Opt_Union_String_Buffer;
typedef struct OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean;
typedef struct Opt_Union_String_Number_Boolean Opt_Union_String_Number_Boolean;
typedef struct OH_OHOS_WEB_WEBVIEW_Union_String_Resource OH_OHOS_WEB_WEBVIEW_Union_String_Resource;
typedef struct Opt_Union_String_Resource Opt_Union_String_Resource;
typedef struct OH_OHOS_WEB_WEBVIEW_WebMessage OH_OHOS_WEB_WEBVIEW_WebMessage;
typedef struct Opt_WebMessage Opt_WebMessage;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_HistoryItem OH_OHOS_WEB_WEBVIEW_webview_HistoryItem;
typedef struct Opt_webview_HistoryItem Opt_webview_HistoryItem;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_HitTestValue OH_OHOS_WEB_WEBVIEW_webview_HitTestValue;
typedef struct Opt_webview_HitTestValue Opt_webview_HitTestValue;
typedef struct OHOS_WEB_WEBVIEW_webview_MediaSourceInfoPeer OHOS_WEB_WEBVIEW_webview_MediaSourceInfoPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_MediaSourceInfoPeer* OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo;
typedef struct Opt_webview_MediaSourceInfo Opt_webview_MediaSourceInfo;
typedef struct OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgePeer OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgePeer;
typedef struct OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgePeer* OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge;
typedef struct Opt_webview_NativeMediaPlayerBridge Opt_webview_NativeMediaPlayerBridge;
typedef struct OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoPeer OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoPeer* OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo;
typedef struct Opt_webview_NativeMediaPlayerSurfaceInfo Opt_webview_NativeMediaPlayerSurfaceInfo;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap;
typedef struct Opt_webview_OfflineResourceMap Opt_webview_OfflineResourceMap;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration;
typedef struct Opt_webview_PdfConfiguration Opt_webview_PdfConfiguration;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_RequestInfo OH_OHOS_WEB_WEBVIEW_webview_RequestInfo;
typedef struct Opt_webview_RequestInfo Opt_webview_RequestInfo;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo;
typedef struct Opt_webview_SnapshotInfo Opt_webview_SnapshotInfo;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult;
typedef struct Opt_webview_SnapshotResult Opt_webview_SnapshotResult;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme;
typedef struct Opt_webview_WebCustomScheme Opt_webview_WebCustomScheme;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebHeader OH_OHOS_WEB_WEBVIEW_webview_WebHeader;
typedef struct Opt_webview_WebHeader Opt_webview_WebHeader;
typedef struct OHOS_WEB_WEBVIEW_webview_WebMessagePortPeer OHOS_WEB_WEBVIEW_webview_WebMessagePortPeer;
typedef struct OHOS_WEB_WEBVIEW_webview_WebMessagePortPeer* OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort;
typedef struct Opt_webview_WebMessagePort Opt_webview_WebMessagePort;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_MediaInfo OH_OHOS_WEB_WEBVIEW_webview_MediaInfo;
typedef struct Opt_webview_MediaInfo Opt_webview_MediaInfo;
typedef enum OH_OHOS_WEB_WEBVIEW_WebNetErrorList {
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_NET_OK = 0,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_IO_PENDING = -1,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FAILED = -2,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ABORTED = -3,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_ARGUMENT = -4,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_HANDLE = -5,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FILE_NOT_FOUND = -6,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TIMED_OUT = -7,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FILE_TOO_LARGE = -8,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNEXPECTED = -9,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ACCESS_DENIED = -10,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NOT_IMPLEMENTED = -11,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INSUFFICIENT_RESOURCES = -12,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_OUT_OF_MEMORY = -13,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UPLOAD_FILE_CHANGED = -14,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKET_NOT_CONNECTED = -15,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FILE_EXISTS = -16,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FILE_PATH_TOO_LONG = -17,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FILE_NO_SPACE = -18,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FILE_VIRUS_INFECTED = -19,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_BLOCKED_BY_CLIENT = -20,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NETWORK_CHANGED = -21,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_BLOCKED_BY_ADMINISTRATOR = -22,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKET_CONNECTED = -23,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UPLOAD_STREAM_REWIND_NOT_SUPPORTED = -25,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONTEXT_SHUT_DOWN = -26,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_BLOCKED_BY_RESPONSE = -27,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CLEARTEXT_NOT_PERMITTED = -29,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_BLOCKED_BY_CSP = -30,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_H2_OR_QUIC_REQUIRED = -31,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_BLOCKED_BY_ORB = -32,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONNECTION_CLOSED = -100,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONNECTION_RESET = -101,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONNECTION_REFUSED = -102,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONNECTION_ABORTED = -103,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONNECTION_FAILED = -104,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NAME_NOT_RESOLVED = -105,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INTERNET_DISCONNECTED = -106,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_PROTOCOL_ERROR = -107,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ADDRESS_INVALID = -108,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ADDRESS_UNREACHABLE = -109,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_CLIENT_AUTH_CERT_NEEDED = -110,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TUNNEL_CONNECTION_FAILED = -111,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NO_SSL_VERSIONS_ENABLED = -112,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_VERSION_OR_CIPHER_MISMATCH = -113,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_RENEGOTIATION_REQUESTED = -114,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PROXY_AUTH_UNSUPPORTED = -115,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_BAD_SSL_CLIENT_AUTH_CERT = -117,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONNECTION_TIMED_OUT = -118,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HOST_RESOLVER_QUEUE_TOO_LARGE = -119,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKS_CONNECTION_FAILED = -120,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKS_CONNECTION_HOST_UNREACHABLE = -121,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ALPN_NEGOTIATION_FAILED = -122,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_NO_RENEGOTIATION = -123,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_WINSOCK_UNEXPECTED_WRITTEN_BYTES = -124,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_DECOMPRESSION_FAILURE_ALERT = -125,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_BAD_RECORD_MAC_ALERT = -126,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PROXY_AUTH_REQUESTED = -127,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PROXY_CONNECTION_FAILED = -130,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_MANDATORY_PROXY_CONFIGURATION_FAILED = -131,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PRECONNECT_MAX_SOCKET_LIMIT = -133,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_CLIENT_AUTH_PRIVATE_KEY_ACCESS_DENIED = -134,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_CLIENT_AUTH_CERT_NO_PRIVATE_KEY = -135,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PROXY_CERTIFICATE_INVALID = -136,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NAME_RESOLUTION_FAILED = -137,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NETWORK_ACCESS_DENIED = -138,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TEMPORARILY_THROTTLED = -139,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTPS_PROXY_TUNNEL_RESPONSE_REDIRECT = -140,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_CLIENT_AUTH_SIGNATURE_FAILED = -141,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_MSG_TOO_BIG = -142,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_WS_PROTOCOL_ERROR = -145,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ADDRESS_IN_USE = -147,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_HANDSHAKE_NOT_COMPLETED = -148,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_BAD_PEER_PUBLIC_KEY = -149,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_PINNED_KEY_NOT_IN_CERT_CHAIN = -150,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CLIENT_AUTH_CERT_TYPE_UNSUPPORTED = -151,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_DECRYPT_ERROR_ALERT = -153,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_WS_THROTTLE_QUEUE_TOO_LARGE = -154,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_SERVER_CERT_CHANGED = -156,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_UNRECOGNIZED_NAME_ALERT = -159,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKET_SET_RECEIVE_BUFFER_SIZE_ERROR = -160,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKET_SET_SEND_BUFFER_SIZE_ERROR = -161,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKET_RECEIVE_BUFFER_SIZE_UNCHANGEABLE = -162,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SOCKET_SEND_BUFFER_SIZE_UNCHANGEABLE = -163,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_CLIENT_AUTH_CERT_BAD_FORMAT = -164,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ICANN_NAME_COLLISION = -166,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_SERVER_CERT_BAD_FORMAT = -167,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CT_STH_PARSING_FAILED = -168,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CT_STH_INCOMPLETE = -169,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNABLE_TO_REUSE_CONNECTION_FOR_PROXY_AUTH = -170,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CT_CONSISTENCY_PROOF_PARSING_FAILED = -171,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_OBSOLETE_CIPHER = -172,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_WS_UPGRADE = -173,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_READ_IF_READY_NOT_IMPLEMENTED = -174,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NO_BUFFER_SPACE = -176,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_CLIENT_AUTH_NO_COMMON_ALGORITHMS = -177,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_EARLY_DATA_REJECTED = -178,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_WRONG_VERSION_ON_EARLY_DATA = -179,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TLS13_DOWNGRADE_DETECTED = -180,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_KEY_USAGE_INCOMPATIBLE = -181,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_ECH_CONFIG_LIST = -182,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ECH_NOT_NEGOTIATED = -183,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ECH_FALLBACK_CERTIFICATE_INVALID = -184,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_COMMON_NAME_INVALID = -200,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_DATE_INVALID = -201,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_AUTHORITY_INVALID = -202,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_CONTAINS_ERRORS = -203,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_NO_REVOCATION_MECHANISM = -204,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_UNABLE_TO_CHECK_REVOCATION = -205,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_REVOKED = -206,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_INVALID = -207,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_WEAK_SIGNATURE_ALGORITHM = -208,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_NON_UNIQUE_NAME = -210,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_WEAK_KEY = -211,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_NAME_CONSTRAINT_VIOLATION = -212,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_VALIDITY_TOO_LONG = -213,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERTIFICATE_TRANSPARENCY_REQUIRED = -214,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_SYMANTEC_LEGACY = -215,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_KNOWN_INTERCEPTION_BLOCKED = -217,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SSL_OBSOLETE_VERSION_OR_CIPHER = -218,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_END = -219,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_URL = -300,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DISALLOWED_URL_SCHEME = -301,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNKNOWN_URL_SCHEME = -302,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_REDIRECT = -303,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TOO_MANY_REDIRECTS = -310,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNSAFE_REDIRECT = -311,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNSAFE_PORT = -312,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_RESPONSE = -320,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_CHUNKED_ENCODING = -321,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_METHOD_UNSUPPORTED = -322,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNEXPECTED_PROXY_AUTH = -323,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_EMPTY_RESPONSE = -324,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_RESPONSE_HEADERS_TOO_BIG = -325,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PAC_SCRIPT_FAILED = -327,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_REQUEST_RANGE_NOT_SATISFIABLE = -328,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_MALFORMED_IDENTITY = -329,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONTENT_DECODING_FAILED = -330,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NETWORK_IO_SUSPENDED = -331,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SYN_REPLY_NOT_RECEIVED = -332,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ENCODING_CONVERSION_FAILED = -333,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNRECOGNIZED_FTP_DIRECTORY_LISTING_FORMAT = -334,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NO_SUPPORTED_PROXIES = -336,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_PROTOCOL_ERROR = -337,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_AUTH_CREDENTIALS = -338,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNSUPPORTED_AUTH_SCHEME = -339,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ENCODING_DETECTION_FAILED = -340,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_MISSING_AUTH_CREDENTIALS = -341,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNEXPECTED_SECURITY_LIBRARY_STATUS = -342,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_MISCONFIGURED_AUTH_ENVIRONMENT = -343,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_UNDOCUMENTED_SECURITY_LIBRARY_STATUS = -344,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_RESPONSE_BODY_TOO_BIG_TO_DRAIN = -345,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_LENGTH = -346,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INCOMPLETE_HTTP2_HEADERS = -347,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PAC_NOT_IN_DHCP = -348,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION = -349,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_RESPONSE_HEADERS_MULTIPLE_LOCATION = -350,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_SERVER_REFUSED_STREAM = -351,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_PING_FAILED = -352,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONTENT_LENGTH_MISMATCH = -354,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INCOMPLETE_CHUNKED_ENCODING = -355,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_QUIC_PROTOCOL_ERROR = -356,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_RESPONSE_HEADERS_TRUNCATED = -357,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_QUIC_HANDSHAKE_FAILED = -358,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_INADEQUATE_TRANSPORT_SECURITY = -360,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_FLOW_CONTROL_ERROR = -361,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_FRAME_SIZE_ERROR = -362,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_COMPRESSION_ERROR = -363,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PROXY_AUTH_REQUESTED_WITH_NO_CONNECTION = -364,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP_1_1_REQUIRED = -365,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PROXY_HTTP_1_1_REQUIRED = -366,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PAC_SCRIPT_TERMINATED = -367,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_HTTP_RESPONSE = -370,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CONTENT_DECODING_INIT_FAILED = -371,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_RST_STREAM_NO_ERROR_RECEIVED = -372,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_PUSHED_STREAM_NOT_AVAILABLE = -373,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_CLAIMED_PUSHED_STREAM_RESET_BY_SERVER = -374,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TOO_MANY_RETRIES = -375,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_STREAM_CLOSED = -376,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_CLIENT_REFUSED_STREAM = -377,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP2_PUSHED_RESPONSE_DOES_NOT_MATCH = -378,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_HTTP_RESPONSE_CODE_FAILURE = -379,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_QUIC_UNKNOWN_CERT_ROOT = -380,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_QUIC_GOAWAY_REQUEST_CAN_BE_RETRIED = -381,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TOO_MANY_ACCEPT_CH_RESTARTS = -382,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INCONSISTENT_IP_ADDRESS_SPACE = -383,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHED_IP_ADDRESS_SPACE_BLOCKED_BY_LOCAL_NETWORK_ACCESS_POLICY = -384,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_MISS = -400,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_READ_FAILURE = -401,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_WRITE_FAILURE = -402,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_OPERATION_UNSUPPORTED = -403,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_OPEN_FAILURE = -404,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_CREATE_FAILURE = -405,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_RACE = -406,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_CHECKSUM_READ_FAILURE = -407,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_CHECKSUM_MISMATCH = -408,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_LOCK_TIMEOUT = -409,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_AUTH_FAILURE_AFTER_READ = -410,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_ENTRY_NOT_SUITABLE = -411,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_DOOM_FAILURE = -412,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CACHE_OPEN_OR_CREATE_FAILURE = -413,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INSECURE_RESPONSE = -501,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_NO_PRIVATE_KEY_FOR_CERT = -502,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_ADD_USER_CERT_FAILED = -503,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_SIGNED_EXCHANGE = -504,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_INVALID_WEB_BUNDLE = -505,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TRUST_TOKEN_OPERATION_FAILED = -506,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_TRUST_TOKEN_OPERATION_SUCCESS_WITHOUT_SENDING_REQUEST = -507,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FTP_FAILED = -601,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FTP_SERVICE_UNAVAILABLE = -602,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FTP_TRANSFER_ABORTED = -603,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FTP_FILE_BUSY = -604,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FTP_SYNTAX_ERROR = -605,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FTP_COMMAND_UNSUPPORTED = -606,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_FTP_BAD_COMMAND_SEQUENCE = -607,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PKCS12_IMPORT_BAD_PASSWORD = -701,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PKCS12_IMPORT_FAILED = -702,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_IMPORT_CA_CERT_NOT_CA = -703,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_IMPORT_CERT_ALREADY_EXISTS = -704,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_IMPORT_CA_CERT_FAILED = -705,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_IMPORT_SERVER_CERT_FAILED = -706,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PKCS12_IMPORT_INVALID_MAC = -707,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PKCS12_IMPORT_INVALID_FILE = -708,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PKCS12_IMPORT_UNSUPPORTED = -709,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_KEY_GENERATION_FAILED = -710,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_PRIVATE_KEY_EXPORT_FAILED = -712,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_SELF_SIGNED_CERT_GENERATION_FAILED = -713,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_DATABASE_CHANGED = -714,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_CERT_VERIFIER_CHANGED = -716,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_MALFORMED_RESPONSE = -800,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_SERVER_REQUIRES_TCP = -801,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_SERVER_FAILED = -802,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_TIMED_OUT = -803,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_CACHE_MISS = -804,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_SEARCH_EMPTY = -805,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_SORT_ERROR = -806,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_SECURE_RESOLVER_HOSTNAME_RESOLUTION_FAILED = -808,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_NAME_HTTPS_ONLY = -809,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_REQUEST_CANCELED = -810,
    OH_OHOS_WEB_WEBVIEW_WEB_NET_ERROR_LIST_ERR_DNS_NO_MATCHING_SUPPORTED_ALPN = -811,
} OH_OHOS_WEB_WEBVIEW_WebNetErrorList;
typedef struct Opt_WebNetErrorList {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_WebNetErrorList value;
} Opt_WebNetErrorList;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_JsMessageType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_JS_MESSAGE_TYPE_NOT_SUPPORT = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_JS_MESSAGE_TYPE_STRING = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_JS_MESSAGE_TYPE_NUMBER = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_JS_MESSAGE_TYPE_BOOLEAN = 3,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_JS_MESSAGE_TYPE_ARRAY_BUFFER = 4,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_JS_MESSAGE_TYPE_ARRAY = 5,
} OH_OHOS_WEB_WEBVIEW_webview_JsMessageType;
typedef struct Opt_webview_JsMessageType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_JsMessageType value;
} Opt_webview_JsMessageType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_MediaError {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_ERROR_NETWORK_ERROR = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_ERROR_FORMAT_ERROR = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_ERROR_DECODE_ERROR = 3,
} OH_OHOS_WEB_WEBVIEW_webview_MediaError;
typedef struct Opt_webview_MediaError {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_MediaError value;
} Opt_webview_MediaError;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_PLAYBACK_STATE_NONE = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_PLAYBACK_STATE_PLAYING = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_PLAYBACK_STATE_PAUSED = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_PLAYBACK_STATE_STOPPED = 3,
} OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState;
typedef struct Opt_webview_MediaPlaybackState {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState value;
} Opt_webview_MediaPlaybackState;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_MediaType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_TYPE_VIDEO = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_MEDIA_TYPE_AUDIO = 1,
} OH_OHOS_WEB_WEBVIEW_webview_MediaType;
typedef struct Opt_webview_MediaType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_MediaType value;
} Opt_webview_MediaType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_NetworkState {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_NETWORK_STATE_EMPTY = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_NETWORK_STATE_IDLE = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_NETWORK_STATE_LOADING = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_NETWORK_STATE_NETWORK_ERROR = 3,
} OH_OHOS_WEB_WEBVIEW_webview_NetworkState;
typedef struct Opt_webview_NetworkState {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_NetworkState value;
} Opt_webview_NetworkState;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_OFFLINE_RESOURCE_TYPE_IMAGE = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_OFFLINE_RESOURCE_TYPE_CSS = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_OFFLINE_RESOURCE_TYPE_CLASSIC_JS = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_OFFLINE_RESOURCE_TYPE_MODULE_JS = 3,
} OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType;
typedef struct Opt_webview_OfflineResourceType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType value;
} Opt_webview_OfflineResourceType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_PLAYBACK_STATUS_PAUSED = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_PLAYBACK_STATUS_PLAYING = 1,
} OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus;
typedef struct Opt_webview_PlaybackStatus {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus value;
} Opt_webview_PlaybackStatus;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_Preload {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_PRELOAD_NONE = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_PRELOAD_METADATA = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_PRELOAD_AUTO = 2,
} OH_OHOS_WEB_WEBVIEW_webview_Preload;
typedef struct Opt_webview_Preload {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_Preload value;
} Opt_webview_Preload;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_PressureLevel {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_PRESSURE_LEVEL_MEMORY_PRESSURE_LEVEL_MODERATE = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_PRESSURE_LEVEL_MEMORY_PRESSURE_LEVEL_CRITICAL = 2,
} OH_OHOS_WEB_WEBVIEW_webview_PressureLevel;
typedef struct Opt_webview_PressureLevel {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_PressureLevel value;
} Opt_webview_PressureLevel;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_ReadyState {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_READY_STATE_HAVE_NOTHING = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_READY_STATE_HAVE_METADATA = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_READY_STATE_HAVE_CURRENT_DATA = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_READY_STATE_HAVE_FUTURE_DATA = 3,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_READY_STATE_HAVE_ENOUGH_DATA = 4,
} OH_OHOS_WEB_WEBVIEW_webview_ReadyState;
typedef struct Opt_webview_ReadyState {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_ReadyState value;
} Opt_webview_ReadyState;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_RENDER_PROCESS_MODE_SINGLE = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_RENDER_PROCESS_MODE_MULTIPLE = 1,
} OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode;
typedef struct Opt_webview_RenderProcessMode {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode value;
} Opt_webview_RenderProcessMode;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_ScrollType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SCROLL_TYPE_EVENT = 0,
} OH_OHOS_WEB_WEBVIEW_webview_ScrollType;
typedef struct Opt_webview_ScrollType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_ScrollType value;
} Opt_webview_ScrollType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SECURE_DNS_MODE_OFF = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SECURE_DNS_MODE_AUTO = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SECURE_DNS_MODE_SECURE_ONLY = 2,
} OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode;
typedef struct Opt_webview_SecureDnsMode {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode value;
} Opt_webview_SecureDnsMode;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SECURITY_LEVEL_NONE = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SECURITY_LEVEL_SECURE = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SECURITY_LEVEL_WARNING = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SECURITY_LEVEL_DANGEROUS = 3,
} OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel;
typedef struct Opt_webview_SecurityLevel {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel value;
} Opt_webview_SecurityLevel;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_SourceType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SOURCE_TYPE_URL = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SOURCE_TYPE_MSE = 1,
} OH_OHOS_WEB_WEBVIEW_webview_SourceType;
typedef struct Opt_webview_SourceType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_SourceType value;
} Opt_webview_SourceType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_SuspendType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SUSPEND_TYPE_ENTER_BACK_FORWARD_CACHE = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SUSPEND_TYPE_ENTER_BACKGROUND = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_SUSPEND_TYPE_AUTO_CLEANUP = 2,
} OH_OHOS_WEB_WEBVIEW_webview_SuspendType;
typedef struct Opt_webview_SuspendType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_SuspendType value;
} Opt_webview_SuspendType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_ERROR_UNKNOWN = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_FAILED = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_ACCESS_DENIED = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_NO_SPACE = 3,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_NAME_TOO_LONG = 5,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_TOO_LARGE = 6,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_TRANSIENT_ERROR = 10,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_BLOCKED = 11,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_TOO_SHORT = 13,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_HASH_MISMATCH = 14,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_FILE_SAME_AS_SOURCE = 15,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_NETWORK_FAILED = 20,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_NETWORK_TIMEOUT = 21,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_NETWORK_DISCONNECTED = 22,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_NETWORK_SERVER_DOWN = 23,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_NETWORK_INVALID_REQUEST = 24,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_FAILED = 30,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_NO_RANGE = 31,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_BAD_CONTENT = 33,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_UNAUTHORIZED = 34,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_CERT_PROBLEM = 35,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_FORBIDDEN = 36,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_UNREACHABLE = 37,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_CONTENT_LENGTH_MISMATCH = 38,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_SERVER_CROSS_ORIGIN_REDIRECT = 39,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_USER_CANCELED = 40,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_USER_SHUTDOWN = 41,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_ERROR_CODE_CRASH = 50,
} OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode;
typedef struct Opt_webview_WebDownloadErrorCode {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode value;
} Opt_webview_WebDownloadErrorCode;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_STATE_IN_PROGRESS = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_STATE_COMPLETED = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_STATE_CANCELED = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_STATE_INTERRUPTED = 3,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_STATE_PENDING = 4,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_STATE_PAUSED = 5,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_DOWNLOAD_STATE_UNKNOWN = 6,
} OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState;
typedef struct Opt_webview_WebDownloadState {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState value;
} Opt_webview_WebDownloadState;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_EDIT_TEXT = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_EMAIL = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_HTTP_ANCHOR = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_HTTP_ANCHOR_IMG = 3,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_IMG = 4,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_MAP = 5,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_PHONE = 6,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_HIT_TEST_TYPE_UNKNOWN = 7,
} OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType;
typedef struct Opt_webview_WebHitTestType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType value;
} Opt_webview_WebHitTestType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_WebMessageType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_MESSAGE_TYPE_NOT_SUPPORT = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_MESSAGE_TYPE_STRING = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_MESSAGE_TYPE_NUMBER = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_MESSAGE_TYPE_BOOLEAN = 3,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_MESSAGE_TYPE_ARRAY_BUFFER = 4,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_MESSAGE_TYPE_ARRAY = 5,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_MESSAGE_TYPE_ERROR = 6,
} OH_OHOS_WEB_WEBVIEW_webview_WebMessageType;
typedef struct Opt_webview_WebMessageType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebMessageType value;
} Opt_webview_WebMessageType;
typedef enum OH_OHOS_WEB_WEBVIEW_webview_WebResourceType {
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_MAIN_FRAME = 0,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_SUB_FRAME = 1,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_STYLE_SHEET = 2,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_SCRIPT = 3,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_IMAGE = 4,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_FONT_RESOURCE = 5,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_SUB_RESOURCE = 6,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_OBJECT = 7,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_MEDIA = 8,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_WORKER = 9,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_SHARED_WORKER = 10,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_PREFETCH = 11,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_FAVICON = 12,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_XHR = 13,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_PING = 14,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_SERVICE_WORKER = 15,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_CSP_REPORT = 16,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_PLUGIN_RESOURCE = 17,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_NAVIGATION_PRELOAD_MAIN_FRAME = 19,
    OH_OHOS_WEB_WEBVIEW_WEBVIEW_WEB_RESOURCE_TYPE_NAVIGATION_PRELOAD_SUB_FRAME = 20,
} OH_OHOS_WEB_WEBVIEW_webview_WebResourceType;
typedef struct Opt_webview_WebResourceType {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebResourceType value;
} Opt_webview_WebResourceType;
typedef struct Opt_Int32 {
    OH_Tag tag;
    OH_Int32 value;
} Opt_Int32;
typedef struct Array_cert_X509Cert {
    /* kind: ContainerType */
    OH_OHOS_WEB_WEBVIEW_cert_X509Cert* array;
    OH_Int32 length;
} Array_cert_X509Cert;
typedef struct Opt_Array_cert_X509Cert {
    OH_Tag tag;
    Array_cert_X509Cert value;
} Opt_Array_cert_X509Cert;
typedef struct Array_String {
    /* kind: ContainerType */
    OH_String* array;
    OH_Int32 length;
} Array_String;
typedef struct Opt_Array_String {
    OH_Tag tag;
    Array_String value;
} Opt_Array_String;
typedef struct Array_Union_String_Number_Boolean {
    /* kind: ContainerType */
    OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean* array;
    OH_Int32 length;
} Array_Union_String_Number_Boolean;
typedef struct Opt_Array_Union_String_Number_Boolean {
    OH_Tag tag;
    Array_Union_String_Number_Boolean value;
} Opt_Array_Union_String_Number_Boolean;
typedef struct Array_webview_MediaSourceInfo {
    /* kind: ContainerType */
    OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo* array;
    OH_Int32 length;
} Array_webview_MediaSourceInfo;
typedef struct Opt_Array_webview_MediaSourceInfo {
    OH_Tag tag;
    Array_webview_MediaSourceInfo value;
} Opt_Array_webview_MediaSourceInfo;
typedef struct Array_webview_OfflineResourceMap {
    /* kind: ContainerType */
    OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap* array;
    OH_Int32 length;
} Array_webview_OfflineResourceMap;
typedef struct Opt_Array_webview_OfflineResourceMap {
    OH_Tag tag;
    Array_webview_OfflineResourceMap value;
} Opt_Array_webview_OfflineResourceMap;
typedef struct Array_webview_WebCustomScheme {
    /* kind: ContainerType */
    OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme* array;
    OH_Int32 length;
} Array_webview_WebCustomScheme;
typedef struct Opt_Array_webview_WebCustomScheme {
    OH_Tag tag;
    Array_webview_WebCustomScheme value;
} Opt_Array_webview_WebCustomScheme;
typedef struct Array_webview_WebHeader {
    /* kind: ContainerType */
    OH_OHOS_WEB_WEBVIEW_webview_WebHeader* array;
    OH_Int32 length;
} Array_webview_WebHeader;
typedef struct Opt_Array_webview_WebHeader {
    OH_Tag tag;
    Array_webview_WebHeader value;
} Opt_Array_webview_WebHeader;
typedef struct Array_webview_WebMessagePort {
    /* kind: ContainerType */
    OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort* array;
    OH_Int32 length;
} Array_webview_WebMessagePort;
typedef struct Opt_Array_webview_WebMessagePort {
    OH_Tag tag;
    Array_webview_WebMessagePort value;
} Opt_Array_webview_WebMessagePort;
typedef struct Map_String_String {
    /* kind: ContainerType */
    OH_Int32 size;
    OH_String* keys;
    OH_String* values;
} Map_String_String;
typedef struct Opt_Map_String_String {
    OH_Tag tag;
    Map_String_String value;
} Opt_Map_String_String;
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
typedef struct Opt_Float64 {
    OH_Tag tag;
    OH_Float64 value;
} Opt_Float64;
typedef struct Opt_Number {
    OH_Tag tag;
    OH_Number value;
} Opt_Number;
typedef struct Opt_Object {
    OH_Tag tag;
    OH_Object value;
} Opt_Object;
typedef struct Opt_cert_X509Cert {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_cert_X509Cert value;
} Opt_cert_X509Cert;
typedef struct Opt_image_PixelMap {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_image_PixelMap value;
} Opt_image_PixelMap;
typedef struct Opt_print_PrintDocumentAdapter {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter value;
} Opt_print_PrintDocumentAdapter;
typedef struct Opt_webview_BackForwardCacheOptions {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptions value;
} Opt_webview_BackForwardCacheOptions;
typedef struct Opt_webview_BackForwardCacheSupportedFeatures {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeatures value;
} Opt_webview_BackForwardCacheSupportedFeatures;
typedef struct Opt_webview_BackForwardList {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_BackForwardList value;
} Opt_webview_BackForwardList;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_CacheOptions {
    /* kind: Interface */
    Array_webview_WebHeader responseHeaders;
} OH_OHOS_WEB_WEBVIEW_webview_CacheOptions;
typedef struct Opt_webview_CacheOptions {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_CacheOptions value;
} Opt_webview_CacheOptions;
typedef struct Opt_webview_JsMessageExt {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_JsMessageExt value;
} Opt_webview_JsMessageExt;
typedef struct Opt_webview_NativeMediaPlayerHandler {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler value;
} Opt_webview_NativeMediaPlayerHandler;
typedef struct Opt_webview_PdfData {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_PdfData value;
} Opt_webview_PdfData;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_RectEvent {
    /* kind: Interface */
    OH_Float64 x;
    OH_Float64 y;
    OH_Float64 width;
    OH_Float64 height;
} OH_OHOS_WEB_WEBVIEW_webview_RectEvent;
typedef struct Opt_webview_RectEvent {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_RectEvent value;
} Opt_webview_RectEvent;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset {
    /* kind: Interface */
    OH_Float64 x;
    OH_Float64 y;
} OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset;
typedef struct Opt_webview_ScrollOffset {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset value;
} Opt_webview_ScrollOffset;
typedef struct Opt_webview_WebDownloadDelegate {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate value;
} Opt_webview_WebDownloadDelegate;
typedef struct Opt_webview_WebDownloadItem {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value;
} Opt_webview_WebDownloadItem;
typedef struct Opt_webview_WebHttpBodyStream {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStream value;
} Opt_webview_WebHttpBodyStream;
typedef struct Opt_webview_WebMessageExt {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt value;
} Opt_webview_WebMessageExt;
typedef struct Opt_webview_WebResourceHandler {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler value;
} Opt_webview_WebResourceHandler;
typedef struct Opt_webview_WebSchemeHandler {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler value;
} Opt_webview_WebSchemeHandler;
typedef struct Opt_webview_WebSchemeHandlerRequest {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value;
} Opt_webview_WebSchemeHandlerRequest;
typedef struct Opt_webview_WebSchemeHandlerResponse {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse value;
} Opt_webview_WebSchemeHandlerResponse;
typedef struct Opt_webview_WebviewController {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebviewController value;
} Opt_webview_WebviewController;
typedef struct Opt_String {
    OH_Tag tag;
    OH_String value;
} Opt_String;
typedef struct OHOS_WEB_WEBVIEW_AsyncCallback {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_BusinessError err, const Opt_CustomObject data);
} OHOS_WEB_WEBVIEW_AsyncCallback;
typedef struct Opt_OHOS_WEB_WEBVIEW_AsyncCallback {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_AsyncCallback value;
} Opt_OHOS_WEB_WEBVIEW_AsyncCallback;
typedef struct OHOS_WEB_WEBVIEW_Callback_Boolean_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_Boolean value);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_Boolean value);
} OHOS_WEB_WEBVIEW_Callback_Boolean_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Boolean_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Boolean_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Boolean_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_CustomObject value);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_CustomObject value);
} OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_cert_X509Cert value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_cert_X509Cert value, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Boolean value, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Buffer value, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_Int32 value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_Int32 value, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_CustomObject value, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const Opt_String value, const Opt_Array_String error);
} OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void;
typedef struct OHOS_WEB_WEBVIEW_Callback_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_WEB_WEBVIEW_Callback_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_Callback_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_Callback_Void value;
} Opt_OHOS_WEB_WEBVIEW_Callback_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem value0);
} OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void value;
} Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_WebMessage result);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_WebMessage result);
} OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void value;
} Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt result);
} OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void value;
} Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest value0);
} OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void value;
} Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void;
typedef struct OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, const OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequest request, const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandler handler, const OHOS_WEB_WEBVIEW_Callback_Boolean_Void continuation);
} OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean value;
} Opt_OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean;
typedef struct OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandler handler, const OH_OHOS_WEB_WEBVIEW_webview_MediaInfo mediaInfo, const OHOS_WEB_WEBVIEW_Callback_NativeMediaPlayerBridge_Void continuation);
} OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback value;
} Opt_OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback;
typedef struct OHOS_WEB_WEBVIEW_webview_ResumePlayerFn {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId);
} OHOS_WEB_WEBVIEW_webview_ResumePlayerFn;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_ResumePlayerFn value;
} Opt_OHOS_WEB_WEBVIEW_webview_ResumePlayerFn;
typedef struct OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn {
    /* kind: Callback */
    OH_OHOS_WEB_WEBVIEW_CallbackResource resource;
    void (*call)(const OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type);
    void (*callSync)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, const OH_Int32 resourceId, OH_OHOS_WEB_WEBVIEW_webview_SuspendType type);
} OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn;
typedef struct Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn {
    OH_Tag tag;
    OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn value;
} Opt_OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn;
typedef struct Opt_BusinessError {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_BusinessError value;
} Opt_BusinessError;
typedef struct OH_OHOS_WEB_WEBVIEW_Union_String_Buffer {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_String value0;
        OH_Buffer value1;
    };
} OH_OHOS_WEB_WEBVIEW_Union_String_Buffer;
typedef struct Opt_Union_String_Buffer {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_Union_String_Buffer value;
} Opt_Union_String_Buffer;
typedef struct OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_String value0;
        OH_Number value1;
        OH_Boolean value2;
    };
} OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean;
typedef struct Opt_Union_String_Number_Boolean {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_Union_String_Number_Boolean value;
} Opt_Union_String_Number_Boolean;
typedef struct OH_OHOS_WEB_WEBVIEW_Union_String_Resource {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_String value0;
        OH_CustomObject value1;
    };
} OH_OHOS_WEB_WEBVIEW_Union_String_Resource;
typedef struct Opt_Union_String_Resource {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_Union_String_Resource value;
} Opt_Union_String_Resource;
typedef struct OH_OHOS_WEB_WEBVIEW_WebMessage {
    /* kind: UnionType */
    OH_Int32 selector;
    union {
        OH_Buffer value0;
        OH_String value1;
    };
} OH_OHOS_WEB_WEBVIEW_WebMessage;
typedef struct Opt_WebMessage {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_WebMessage value;
} Opt_WebMessage;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_HistoryItem {
    /* kind: Interface */
    OH_OHOS_WEB_WEBVIEW_image_PixelMap icon;
    OH_String historyUrl;
    OH_String historyRawUrl;
    OH_String title;
} OH_OHOS_WEB_WEBVIEW_webview_HistoryItem;
typedef struct Opt_webview_HistoryItem {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_HistoryItem value;
} Opt_webview_HistoryItem;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_HitTestValue {
    /* kind: Interface */
    OH_OHOS_WEB_WEBVIEW_webview_WebHitTestType type;
    OH_String extra;
} OH_OHOS_WEB_WEBVIEW_webview_HitTestValue;
typedef struct Opt_webview_HitTestValue {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_HitTestValue value;
} Opt_webview_HitTestValue;
typedef struct Opt_webview_MediaSourceInfo {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfo value;
} Opt_webview_MediaSourceInfo;
typedef struct Opt_webview_NativeMediaPlayerBridge {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridge value;
} Opt_webview_NativeMediaPlayerBridge;
typedef struct Opt_webview_NativeMediaPlayerSurfaceInfo {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo value;
} Opt_webview_NativeMediaPlayerSurfaceInfo;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap {
    /* kind: Interface */
    Array_String urlList;
    OH_Buffer resource;
    Array_webview_WebHeader responseHeaders;
    OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceType type;
} OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap;
typedef struct Opt_webview_OfflineResourceMap {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_OfflineResourceMap value;
} Opt_webview_OfflineResourceMap;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration {
    /* kind: Interface */
    OH_Float64 width;
    OH_Float64 height;
    OH_Float64 marginTop;
    OH_Float64 marginBottom;
    OH_Float64 marginRight;
    OH_Float64 marginLeft;
    Opt_Float64 scale;
    Opt_Boolean shouldPrintBackground;
} OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration;
typedef struct Opt_webview_PdfConfiguration {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration value;
} Opt_webview_PdfConfiguration;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_RequestInfo {
    /* kind: Interface */
    OH_String url;
    OH_String method;
    OH_String formData;
} OH_OHOS_WEB_WEBVIEW_webview_RequestInfo;
typedef struct Opt_webview_RequestInfo {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_RequestInfo value;
} Opt_webview_RequestInfo;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo {
    /* kind: Interface */
    Opt_String id;
} OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo;
typedef struct Opt_webview_SnapshotInfo {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo value;
} Opt_webview_SnapshotInfo;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult {
    /* kind: Interface */
    Opt_String id;
    Opt_Boolean status;
    Opt_image_PixelMap imagePixelMap;
} OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult;
typedef struct Opt_webview_SnapshotResult {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_SnapshotResult value;
} Opt_webview_SnapshotResult;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme {
    /* kind: Interface */
    OH_String schemeName;
    OH_Boolean isSupportCORS;
    OH_Boolean isSupportFetch;
    Opt_Boolean isStandard;
    Opt_Boolean isLocal;
    Opt_Boolean isDisplayIsolated;
    Opt_Boolean isSecure;
    Opt_Boolean isCspBypassing;
    Opt_Boolean isCodeCacheSupported;
} OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme;
typedef struct Opt_webview_WebCustomScheme {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebCustomScheme value;
} Opt_webview_WebCustomScheme;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebHeader {
    /* kind: Interface */
    OH_String headerKey;
    OH_String headerValue;
} OH_OHOS_WEB_WEBVIEW_webview_WebHeader;
typedef struct Opt_webview_WebHeader {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebHeader value;
} Opt_webview_WebHeader;
typedef struct Opt_webview_WebMessagePort {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_WebMessagePort value;
} Opt_webview_WebMessagePort;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_MediaInfo {
    /* kind: Interface */
    OH_String embedID;
    OH_OHOS_WEB_WEBVIEW_webview_MediaType mediaType;
    Array_webview_MediaSourceInfo mediaSrcList;
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfo surfaceInfo;
    OH_Boolean controlsShown;
    Array_String controlList;
    OH_Boolean muted;
    OH_String posterUrl;
    OH_OHOS_WEB_WEBVIEW_webview_Preload preload;
    Map_String_String headers;
    Map_String_String attributes;
} OH_OHOS_WEB_WEBVIEW_webview_MediaInfo;
typedef struct Opt_webview_MediaInfo {
    OH_Tag tag;
    OH_OHOS_WEB_WEBVIEW_webview_MediaInfo value;
} Opt_webview_MediaInfo;
struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsModifier {
    OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsHandle thisPtr);
    OH_Number (*getSize)(OH_NativePointer thisPtr);
    void (*setSize)(OH_NativePointer thisPtr, const OH_Number* value);
    OH_Number (*getTimeToLive)(OH_NativePointer thisPtr);
    void (*setTimeToLive)(OH_NativePointer thisPtr, const OH_Number* value);
} OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesModifier {
    OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesHandle thisPtr);
    OH_Boolean (*getNativeEmbed)(OH_NativePointer thisPtr);
    void (*setNativeEmbed)(OH_NativePointer thisPtr, OH_Boolean value);
    OH_Boolean (*getMediaTakeOver)(OH_NativePointer thisPtr);
    void (*setMediaTakeOver)(OH_NativePointer thisPtr, OH_Boolean value);
} OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardListHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardListHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_BackForwardListHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_BackForwardListModifier {
    OH_OHOS_WEB_WEBVIEW_webview_BackForwardListHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_BackForwardListHandle thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_HistoryItem (*getItemAtIndex)(OH_NativePointer thisPtr, OH_Int32 index);
    OH_Int32 (*getCurrentIndex)(OH_NativePointer thisPtr);
    void (*setCurrentIndex)(OH_NativePointer thisPtr, OH_Int32 value);
    OH_Int32 (*getSize)(OH_NativePointer thisPtr);
    void (*setSize)(OH_NativePointer thisPtr, OH_Int32 value);
} OH_OHOS_WEB_WEBVIEW_webview_BackForwardListModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtModifier {
    OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtHandle thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_JsMessageType (*getType)(OH_NativePointer thisPtr);
    OH_String (*getString)(OH_NativePointer thisPtr);
    OH_Number (*getNumber)(OH_NativePointer thisPtr);
    OH_Boolean (*getBoolean)(OH_NativePointer thisPtr);
    OH_Buffer (*getArrayBuffer)(OH_NativePointer thisPtr);
    Array_Union_String_Number_Boolean (*getArray)(OH_NativePointer thisPtr);
} OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoModifier {
    OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoHandle thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_SourceType (*getType)(OH_NativePointer thisPtr);
    void (*setType)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_SourceType value);
    OH_String (*getSource)(OH_NativePointer thisPtr);
    void (*setSource)(OH_NativePointer thisPtr, const OH_String* value);
    OH_String (*getFormat)(OH_NativePointer thisPtr);
    void (*setFormat)(OH_NativePointer thisPtr, const OH_String* value);
} OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeModifier {
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeHandle thisPtr);
    void (*updateRect)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, OH_Float64 width, OH_Float64 height);
    void (*play)(OH_NativePointer thisPtr);
    void (*pause)(OH_NativePointer thisPtr);
    void (*seek)(OH_NativePointer thisPtr, OH_Float64 targetTime);
    void (*setVolume)(OH_NativePointer thisPtr, OH_Float64 volume);
    void (*setMuted)(OH_NativePointer thisPtr, OH_Boolean muted);
    void (*setPlaybackRate)(OH_NativePointer thisPtr, OH_Float64 playbackRate);
    void (*release)(OH_NativePointer thisPtr);
    void (*enterFullscreen)(OH_NativePointer thisPtr);
    void (*exitFullscreen)(OH_NativePointer thisPtr);
    OHOS_WEB_WEBVIEW_webview_ResumePlayerFn (*getResumePlayer)(OH_NativePointer thisPtr);
    void (*setResumePlayer)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_ResumePlayerFn* value);
    OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn (*getSuspendPlayer)(OH_NativePointer thisPtr);
    void (*setSuspendPlayer)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_SuspendPlayerFn* value);
} OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerModifier {
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerHandle thisPtr);
    void (*handleStatusChanged)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_PlaybackStatus status);
    void (*handleVolumeChanged)(OH_NativePointer thisPtr, OH_Float64 volume);
    void (*handleMutedChanged)(OH_NativePointer thisPtr, OH_Boolean muted);
    void (*handlePlaybackRateChanged)(OH_NativePointer thisPtr, OH_Float64 playbackRate);
    void (*handleDurationChanged)(OH_NativePointer thisPtr, OH_Float64 duration);
    void (*handleTimeUpdate)(OH_NativePointer thisPtr, OH_Float64 currentPlayTime);
    void (*handleBufferedEndTimeChanged)(OH_NativePointer thisPtr, OH_Float64 bufferedEndTime);
    void (*handleEnded)(OH_NativePointer thisPtr);
    void (*handleNetworkStateChanged)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_NetworkState state);
    void (*handleReadyStateChanged)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_ReadyState state);
    void (*handleFullscreenChanged)(OH_NativePointer thisPtr, OH_Boolean fullscreen);
    void (*handleSeeking)(OH_NativePointer thisPtr);
    void (*handleSeekFinished)(OH_NativePointer thisPtr);
    void (*handleError)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_MediaError error, const OH_String* errorMessage);
    void (*handleVideoSizeChanged)(OH_NativePointer thisPtr, OH_Float64 width, OH_Float64 height);
} OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoModifier {
    OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoHandle thisPtr);
    OH_String (*getId)(OH_NativePointer thisPtr);
    void (*setId)(OH_NativePointer thisPtr, const OH_String* value);
    OH_OHOS_WEB_WEBVIEW_webview_RectEvent (*getRect)(OH_NativePointer thisPtr);
    void (*setRect)(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_RectEvent* value);
} OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_PdfDataHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_PdfDataHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_PdfDataHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_PdfDataModifier {
    OH_OHOS_WEB_WEBVIEW_webview_PdfDataHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_PdfDataHandle thisPtr);
    OH_Buffer (*pdfArrayBuffer)(OH_NativePointer thisPtr);
} OH_OHOS_WEB_WEBVIEW_webview_PdfDataModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateHandle thisPtr);
    void (*onBeforeDownload)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_);
    void (*onDownloadUpdated)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_);
    void (*onDownloadFinish)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_);
    void (*onDownloadFailed)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebDownloadItem_Void* callback_);
} OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemHandle thisPtr);
    OH_String (*getGuid)(OH_NativePointer thisPtr);
    OH_Number (*getCurrentSpeed)(OH_NativePointer thisPtr);
    OH_Number (*getPercentComplete)(OH_NativePointer thisPtr);
    OH_Number (*getTotalBytes)(OH_NativePointer thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadState (*getState)(OH_NativePointer thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadErrorCode (*getLastErrorCode)(OH_NativePointer thisPtr);
    OH_String (*getMethod)(OH_NativePointer thisPtr);
    OH_String (*getMimeType)(OH_NativePointer thisPtr);
    OH_String (*getUrl)(OH_NativePointer thisPtr);
    OH_String (*getSuggestedFileName)(OH_NativePointer thisPtr);
    void (*start)(OH_NativePointer thisPtr, const OH_String* downloadPath);
    void (*cancel)(OH_NativePointer thisPtr);
    void (*pause)(OH_NativePointer thisPtr);
    void (*resume)(OH_NativePointer thisPtr);
    OH_Number (*getReceivedBytes)(OH_NativePointer thisPtr);
    OH_String (*getFullPath)(OH_NativePointer thisPtr);
    OH_Buffer (*serialize)(OH_NativePointer thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItem (*deserialize)(const OH_Buffer* serializedData);
} OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamHandle thisPtr);
    void (*initialize)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_Callback_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*read)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_Number* size, const OHOS_WEB_WEBVIEW_Callback_Opt_Buffer_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_Number (*getSize)(OH_NativePointer thisPtr);
    OH_Number (*getPosition)(OH_NativePointer thisPtr);
    OH_Boolean (*isChunked)(OH_NativePointer thisPtr);
    OH_Boolean (*isEof)(OH_NativePointer thisPtr);
    OH_Boolean (*isInMemory)(OH_NativePointer thisPtr);
} OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtHandle thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_WebMessageType (*getType)(OH_NativePointer thisPtr);
    OH_String (*getString)(OH_NativePointer thisPtr);
    OH_Number (*getNumber)(OH_NativePointer thisPtr);
    OH_Boolean (*getBoolean)(OH_NativePointer thisPtr);
    OH_Buffer (*getArrayBuffer)(OH_NativePointer thisPtr);
    Array_Union_String_Number_Boolean (*getArray)(OH_NativePointer thisPtr);
    OH_CustomObject (*getError)(OH_NativePointer thisPtr);
    void (*setType)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebMessageType type);
    void (*setString)(OH_NativePointer thisPtr, const OH_String* message);
    void (*setNumber)(OH_NativePointer thisPtr, const OH_Number* message);
    void (*setBoolean)(OH_NativePointer thisPtr, OH_Boolean message);
    void (*setArrayBuffer)(OH_NativePointer thisPtr, const OH_Buffer* message);
    void (*setArray)(OH_NativePointer thisPtr, const Array_Union_String_Number_Boolean* message);
    void (*setError)(OH_NativePointer thisPtr, const OH_CustomObject* message);
} OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortHandle thisPtr);
    void (*close)(OH_NativePointer thisPtr);
    void (*postMessageEvent)(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_WebMessage* message);
    void (*onMessageEvent)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebMessage_Void* callback_);
    void (*postMessageEventExt)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebMessageExt message);
    void (*onMessageEventExt)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebMessageExt_Void* callback_);
    OH_Boolean (*getIsExtentionType)(OH_NativePointer thisPtr);
    void (*setIsExtentionType)(OH_NativePointer thisPtr, OH_Boolean value);
} OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerHandle thisPtr);
    void (*didReceiveResponse)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponse response);
    void (*didReceiveResponseBody)(OH_NativePointer thisPtr, const OH_Buffer* data);
    void (*didFinish)(OH_NativePointer thisPtr);
    void (*didFail)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_WebNetErrorList code);
} OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerHandle thisPtr);
    void (*onRequestStart)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_WebResourceHandler_Boolean* callback_);
    void (*onRequestStop)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_Callback_WebSchemeHandlerRequest_Void* callback_);
} OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestHandle thisPtr);
    Array_webview_WebHeader (*getHeader)(OH_NativePointer thisPtr);
    OH_String (*getRequestUrl)(OH_NativePointer thisPtr);
    OH_String (*getRequestMethod)(OH_NativePointer thisPtr);
    OH_String (*getReferrer)(OH_NativePointer thisPtr);
    OH_Boolean (*isMainFrame)(OH_NativePointer thisPtr);
    OH_Boolean (*hasGesture)(OH_NativePointer thisPtr);
    Opt_webview_WebHttpBodyStream (*getHttpBodyStream)(OH_NativePointer thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_WebResourceType (*getRequestResourceType)(OH_NativePointer thisPtr);
    OH_String (*getFrameUrl)(OH_NativePointer thisPtr);
} OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseHandle (*construct)();
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseHandle thisPtr);
    void (*setUrl)(OH_NativePointer thisPtr, const OH_String* url);
    OH_String (*getUrl)(OH_NativePointer thisPtr);
    void (*setNetErrorCode)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_WebNetErrorList code);
    OH_OHOS_WEB_WEBVIEW_WebNetErrorList (*getNetErrorCode)(OH_NativePointer thisPtr);
    void (*setStatus)(OH_NativePointer thisPtr, const OH_Number* code);
    OH_Number (*getStatus)(OH_NativePointer thisPtr);
    void (*setStatusText)(OH_NativePointer thisPtr, const OH_String* text);
    OH_String (*getStatusText)(OH_NativePointer thisPtr);
    void (*setMimeType)(OH_NativePointer thisPtr, const OH_String* type);
    OH_String (*getMimeType)(OH_NativePointer thisPtr);
    void (*setEncoding)(OH_NativePointer thisPtr, const OH_String* encoding);
    OH_String (*getEncoding)(OH_NativePointer thisPtr);
    void (*setHeaderByName)(OH_NativePointer thisPtr, const OH_String* name, const OH_String* value, OH_Boolean overwrite);
    OH_String (*getHeaderByName)(OH_NativePointer thisPtr, const OH_String* name);
} OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseModifier;
struct OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerHandleOpaque;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerHandleOpaque* OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerHandle;
typedef struct OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerModifier {
    OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerHandle (*construct)(const Opt_String* webTag);
    void (*destruct)(OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerHandle thisPtr);
    void (*initializeWebEngine)();
    void (*setHttpDns)(OH_OHOS_WEB_WEBVIEW_webview_SecureDnsMode secureDnsMode, const OH_String* secureDnsConfig);
    void (*setWebDebuggingAccess0)(OH_Boolean webDebuggingAccess);
    void (*enableSafeBrowsing)(OH_NativePointer thisPtr, OH_Boolean enable);
    OH_Boolean (*isSafeBrowsingEnabled)(OH_NativePointer thisPtr);
    OH_Boolean (*accessForward)(OH_NativePointer thisPtr);
    OH_Boolean (*accessBackward)(OH_NativePointer thisPtr);
    OH_Boolean (*accessStep)(OH_NativePointer thisPtr, const OH_Number* step);
    void (*forward)(OH_NativePointer thisPtr);
    void (*backward)(OH_NativePointer thisPtr);
    void (*clearHistory)(OH_NativePointer thisPtr);
    void (*onActive)(OH_NativePointer thisPtr);
    void (*onInactive)(OH_NativePointer thisPtr);
    void (*refresh)(OH_NativePointer thisPtr);
    void (*loadData)(OH_NativePointer thisPtr, const OH_String* data, const OH_String* mimeType, const OH_String* encoding, const Opt_String* baseUrl, const Opt_String* historyUrl);
    void (*loadUrl)(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_Union_String_Resource* url, const Opt_Array_webview_WebHeader* headers);
    void (*storeWebArchive0)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* baseName, OH_Boolean autoName, const OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*storeWebArchive1)(OH_NativePointer thisPtr, const OH_String* baseName, OH_Boolean autoName, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_);
    void (*zoom)(OH_NativePointer thisPtr, OH_Float64 factor);
    void (*zoomIn)(OH_NativePointer thisPtr);
    void (*zoomOut)(OH_NativePointer thisPtr);
    OH_Int32 (*getWebId)(OH_NativePointer thisPtr);
    OH_String (*getUserAgent)(OH_NativePointer thisPtr);
    OH_String (*getTitle)(OH_NativePointer thisPtr);
    OH_Int32 (*getPageHeight)(OH_NativePointer thisPtr);
    void (*backOrForward)(OH_NativePointer thisPtr, const OH_Number* step);
    void (*requestFocus)(OH_NativePointer thisPtr);
    Array_webview_WebMessagePort (*createWebMessagePorts)(OH_NativePointer thisPtr, const Opt_Boolean* isExtentionType);
    void (*postMessage)(OH_NativePointer thisPtr, const OH_String* name, const Array_webview_WebMessagePort* ports, const OH_String* uri);
    void (*stop)(OH_NativePointer thisPtr);
    void (*registerJavaScriptProxy)(OH_NativePointer thisPtr, const OH_Object* jsObject, const OH_String* name, const Array_String* methodList, const Opt_Array_String* asyncMethodList, const Opt_String* permission);
    void (*deleteJavaScriptRegister)(OH_NativePointer thisPtr, const OH_String* name);
    void (*searchAllAsync)(OH_NativePointer thisPtr, const OH_String* searchString);
    void (*clearMatches)(OH_NativePointer thisPtr);
    void (*searchNext)(OH_NativePointer thisPtr, OH_Boolean forward);
    void (*clearSslCache)(OH_NativePointer thisPtr);
    void (*clearClientAuthenticationCache)(OH_NativePointer thisPtr);
    void (*runJavaScript0)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* script, const OHOS_WEB_WEBVIEW_Callback_Opt_String_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*runJavaScript1)(OH_NativePointer thisPtr, const OH_String* script, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_);
    void (*runJavaScriptExt0)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer* script, const OHOS_WEB_WEBVIEW_Callback_Opt_JsMessageExt_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*runJavaScriptExt1)(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer* script, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_);
    void (*createPdf0)(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration* configuration, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_);
    void (*createPdf1)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_PdfConfiguration* configuration, const OHOS_WEB_WEBVIEW_Callback_Opt_PdfData_Opt_Array_String_Void* outputArgumentForReturningPromise);
    OH_String (*getUrl)(OH_NativePointer thisPtr);
    void (*pageUp)(OH_NativePointer thisPtr, OH_Boolean top);
    void (*pageDown)(OH_NativePointer thisPtr, OH_Boolean bottom);
    OH_String (*getOriginalUrl)(OH_NativePointer thisPtr);
    OH_OHOS_WEB_WEBVIEW_image_PixelMap (*getFavicon)(OH_NativePointer thisPtr);
    void (*setNetworkAvailable)(OH_NativePointer thisPtr, OH_Boolean enable);
    void (*hasImage0)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_Callback_Opt_Boolean_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*hasImage1)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_);
    OH_OHOS_WEB_WEBVIEW_webview_BackForwardList (*getBackForwardEntries)(OH_NativePointer thisPtr);
    void (*removeCache)(OH_NativePointer thisPtr, OH_Boolean clearRom);
    void (*removeAllCache)(OH_Boolean clearRom);
    void (*scrollTo)(OH_NativePointer thisPtr, OH_Float64 x, OH_Float64 y, const Opt_Int32* duration);
    void (*scrollBy)(OH_NativePointer thisPtr, OH_Float64 deltaX, OH_Float64 deltaY, const Opt_Int32* duration);
    void (*slideScroll)(OH_NativePointer thisPtr, OH_Float64 vx, OH_Float64 vy);
    OH_Buffer (*serializeWebState)(OH_NativePointer thisPtr);
    void (*restoreWebState)(OH_NativePointer thisPtr, const OH_Buffer* state);
    void (*customizeSchemes)(const Array_webview_WebCustomScheme* schemes);
    void (*getCertificate0)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_Callback_Opt_Array_Cert_X509Cert_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*getCertificate1)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_);
    void (*setAudioMuted)(OH_NativePointer thisPtr, OH_Boolean mute);
    void (*prefetchPage)(OH_NativePointer thisPtr, const OH_String* url, const Opt_Array_webview_WebHeader* additionalHeaders);
    void (*prepareForPageLoad)(const OH_String* url, OH_Boolean preconnectable, const OH_Number* numSockets);
    void (*setCustomUserAgent)(OH_NativePointer thisPtr, const OH_String* userAgent);
    OH_String (*getCustomUserAgent)(OH_NativePointer thisPtr);
    void (*setConnectionTimeout)(const OH_Number* timeout);
    void (*setDownloadDelegate)(OH_NativePointer thisPtr, OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegate delegate);
    void (*startDownload)(OH_NativePointer thisPtr, const OH_String* url);
    void (*postUrl)(OH_NativePointer thisPtr, const OH_String* url, const OH_Buffer* postData);
    OH_OHOS_WEB_WEBVIEW_print_PrintDocumentAdapter (*createWebPrintDocumentAdapter)(OH_NativePointer thisPtr, const OH_String* jobName);
    OH_OHOS_WEB_WEBVIEW_webview_SecurityLevel (*getSecurityLevel)(OH_NativePointer thisPtr);
    OH_Boolean (*isIncognitoMode)(OH_NativePointer thisPtr);
    void (*setScrollable)(OH_NativePointer thisPtr, OH_Boolean enable, const Opt_webview_ScrollType* type);
    OH_Boolean (*getScrollable)(OH_NativePointer thisPtr);
    void (*setPrintBackground)(OH_NativePointer thisPtr, OH_Boolean enable);
    OH_Boolean (*getPrintBackground)(OH_NativePointer thisPtr);
    OH_String (*getLastJavascriptProxyCallingFrameUrl)(OH_NativePointer thisPtr);
    void (*startCamera)(OH_NativePointer thisPtr);
    void (*stopCamera)(OH_NativePointer thisPtr);
    void (*closeCamera)(OH_NativePointer thisPtr);
    void (*pauseAllTimers)();
    void (*resumeAllTimers)();
    void (*stopAllMedia)(OH_NativePointer thisPtr);
    void (*resumeAllMedia)(OH_NativePointer thisPtr);
    void (*pauseAllMedia)(OH_NativePointer thisPtr);
    void (*closeAllMediaPresentations)(OH_NativePointer thisPtr);
    OH_OHOS_WEB_WEBVIEW_webview_MediaPlaybackState (*getMediaPlaybackState)(OH_NativePointer thisPtr);
    void (*setWebSchemeHandler)(OH_NativePointer thisPtr, const OH_String* scheme, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler handler);
    void (*clearWebSchemeHandler)(OH_NativePointer thisPtr);
    void (*setServiceWorkerWebSchemeHandler)(const OH_String* scheme, OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandler handler);
    void (*clearServiceWorkerWebSchemeHandler)();
    void (*enableIntelligentTrackingPrevention)(OH_NativePointer thisPtr, OH_Boolean enable);
    OH_Boolean (*isIntelligentTrackingPreventionEnabled)(OH_NativePointer thisPtr);
    void (*addIntelligentTrackingPreventionBypassingList)(const Array_String* hostList);
    void (*removeIntelligentTrackingPreventionBypassingList)(const Array_String* hostList);
    void (*clearIntelligentTrackingPreventionBypassingList)();
    OH_String (*getDefaultUserAgent)();
    void (*onCreateNativeMediaPlayer)(OH_NativePointer thisPtr, const OHOS_WEB_WEBVIEW_webview_CreateNativeMediaPlayerCallback* callback_);
    void (*enableWholeWebPageDrawing)();
    void (*webPageSnapshot)(OH_NativePointer thisPtr, const OH_OHOS_WEB_WEBVIEW_webview_SnapshotInfo* info, const OHOS_WEB_WEBVIEW_AsyncCallback* callback_);
    void (*prefetchResource)(const OH_OHOS_WEB_WEBVIEW_webview_RequestInfo* request, const Opt_Array_webview_WebHeader* additionalHeaders, const Opt_String* cacheKey, const Opt_Int32* cacheValidTime);
    void (*clearPrefetchedResource)(const Array_String* cacheKeyList);
    void (*setRenderProcessMode)(OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode mode);
    OH_OHOS_WEB_WEBVIEW_webview_RenderProcessMode (*getRenderProcessMode)();
    OH_Boolean (*terminateRenderProcess)(OH_NativePointer thisPtr);
    void (*precompileJavaScript)(OH_OHOS_WEB_WEBVIEW_VMContext vmContext, OH_OHOS_WEB_WEBVIEW_AsyncWorkerPtr asyncWorker, OH_NativePointer thisPtr, const OH_String* url, const OH_OHOS_WEB_WEBVIEW_Union_String_Buffer* script, const OH_OHOS_WEB_WEBVIEW_webview_CacheOptions* cacheOptions, const OHOS_WEB_WEBVIEW_Callback_Opt_I32_Opt_Array_String_Void* outputArgumentForReturningPromise);
    void (*setHostIP)(const OH_String* hostName, const OH_String* address, const OH_Number* aliveTime);
    void (*clearHostIP)(const OH_String* hostName);
    void (*warmupServiceWorker)(const OH_String* url);
    void (*injectOfflineResources)(OH_NativePointer thisPtr, const Array_webview_OfflineResourceMap* resourceMaps);
    void (*enableAdsBlock)(OH_NativePointer thisPtr, OH_Boolean enable);
    OH_Boolean (*isAdsBlockEnabled)(OH_NativePointer thisPtr);
    OH_Boolean (*isAdsBlockEnabledForCurPage)(OH_NativePointer thisPtr);
    OH_String (*getSurfaceId)(OH_NativePointer thisPtr);
    void (*setUrlTrustList)(OH_NativePointer thisPtr, const OH_String* urlTrustList);
    void (*setPathAllowingUniversalAccess)(OH_NativePointer thisPtr, const Array_String* pathList);
    void (*trimMemoryByPressureLevel)(OH_OHOS_WEB_WEBVIEW_webview_PressureLevel level);
    void (*enableBackForwardCache)(const Opt_webview_BackForwardCacheSupportedFeatures* features);
    void (*setBackForwardCacheOptions)(OH_NativePointer thisPtr, const Opt_webview_BackForwardCacheOptions* options);
    OH_OHOS_WEB_WEBVIEW_webview_ScrollOffset (*getScrollOffset)(OH_NativePointer thisPtr);
    OH_Boolean (*scrollByWithResult)(OH_NativePointer thisPtr, OH_Float64 deltaX, OH_Float64 deltaY);
    OH_OHOS_WEB_WEBVIEW_webview_HitTestValue (*getLastHitTest)(OH_NativePointer thisPtr);
    void (*setWebDebuggingAccess1)(OH_Boolean webDebuggingAccess, const OH_Number* port);
} OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerModifier;
typedef struct OH_OHOS_WEB_WEBVIEW_API {
    OH_Int32 version;
    const OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheOptionsModifier* (*Webview_BackForwardCacheOptions)();
    const OH_OHOS_WEB_WEBVIEW_webview_BackForwardCacheSupportedFeaturesModifier* (*Webview_BackForwardCacheSupportedFeatures)();
    const OH_OHOS_WEB_WEBVIEW_webview_BackForwardListModifier* (*Webview_BackForwardList)();
    const OH_OHOS_WEB_WEBVIEW_webview_JsMessageExtModifier* (*Webview_JsMessageExt)();
    const OH_OHOS_WEB_WEBVIEW_webview_MediaSourceInfoModifier* (*Webview_MediaSourceInfo)();
    const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerBridgeModifier* (*Webview_NativeMediaPlayerBridge)();
    const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerHandlerModifier* (*Webview_NativeMediaPlayerHandler)();
    const OH_OHOS_WEB_WEBVIEW_webview_NativeMediaPlayerSurfaceInfoModifier* (*Webview_NativeMediaPlayerSurfaceInfo)();
    const OH_OHOS_WEB_WEBVIEW_webview_PdfDataModifier* (*Webview_PdfData)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadDelegateModifier* (*Webview_WebDownloadDelegate)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebDownloadItemModifier* (*Webview_WebDownloadItem)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebHttpBodyStreamModifier* (*Webview_WebHttpBodyStream)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebMessageExtModifier* (*Webview_WebMessageExt)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebMessagePortModifier* (*Webview_WebMessagePort)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebResourceHandlerModifier* (*Webview_WebResourceHandler)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerModifier* (*Webview_WebSchemeHandler)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerRequestModifier* (*Webview_WebSchemeHandlerRequest)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebSchemeHandlerResponseModifier* (*Webview_WebSchemeHandlerResponse)();
    const OH_OHOS_WEB_WEBVIEW_webview_WebviewControllerModifier* (*Webview_WebviewController)();
} OH_OHOS_WEB_WEBVIEW_API;
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

#endif // OH_OHOS_WEB_WEBVIEW_H
/* clang-format on */