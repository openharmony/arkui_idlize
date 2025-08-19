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

#ifndef CINTEROP_OHOS_ARKUI_OBSERVER_H
#define CINTEROP_OHOS_ARKUI_OBSERVER_H

#include "kotlin-cinterop.h"

KOALA_INTEROP_DIRECT_2(CommonShapeMethod_construct, KNativePointer, KInt, KInt)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setOffset, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setFill, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_V3(CommonShapeMethod_setPosition, KNativePointer, KSerializerBuffer, int32_t)

// Accessors

KOALA_INTEROP_DIRECT_0(uiObserver_DensityInfo_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(uiObserver_DensityInfo_getFinalizer, KNativePointer)
KOALA_INTEROP_DIRECT_1(uiObserver_DensityInfo_getContext, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_V2(uiObserver_DensityInfo_setContext, KNativePointer, KNativePointer)
KOALA_INTEROP_DIRECT_1(uiObserver_DensityInfo_getDensity, KInteropNumber, KNativePointer)
KOALA_INTEROP_DIRECT_V2(uiObserver_DensityInfo_setDensity, KNativePointer, KInteropNumber)
KOALA_INTEROP_DIRECT_0(uiObserver_RouterPageInfo_construct, KNativePointer)
KOALA_INTEROP_DIRECT_0(uiObserver_RouterPageInfo_getFinalizer, KNativePointer)
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getContext, KInteropReturnBuffer, KNativePointer)
KOALA_INTEROP_DIRECT_V3(uiObserver_RouterPageInfo_setContext, KNativePointer, KSerializerBuffer, int32_t)
KOALA_INTEROP_DIRECT_1(uiObserver_RouterPageInfo_getIndex, KInteropNumber, KNativePointer)
KOALA_INTEROP_DIRECT_V2(uiObserver_RouterPageInfo_setIndex, KNativePointer, KInteropNumber)
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getName, KStringPtr, KNativePointer)
KOALA_INTEROP_V2(uiObserver_RouterPageInfo_setName, KNativePointer, KStringPtr)
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getPath, KStringPtr, KNativePointer)
KOALA_INTEROP_V2(uiObserver_RouterPageInfo_setPath, KNativePointer, KStringPtr)
KOALA_INTEROP_DIRECT_1(uiObserver_RouterPageInfo_getState, KInt, KNativePointer)
KOALA_INTEROP_DIRECT_V2(uiObserver_RouterPageInfo_setState, KNativePointer, KInt)
KOALA_INTEROP_1(uiObserver_RouterPageInfo_getPageId, KStringPtr, KNativePointer)
KOALA_INTEROP_V2(uiObserver_RouterPageInfo_setPageId, KNativePointer, KStringPtr)
#endif // CINTEROP_OHOS_ARKUI_OBSERVER_H
