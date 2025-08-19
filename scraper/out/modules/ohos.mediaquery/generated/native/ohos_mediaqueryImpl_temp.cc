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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "ohos_mediaquery.h"

OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerHandle mediaquery_MediaQueryListener_constructImpl() {
    return {};
}
void mediaquery_MediaQueryListener_destructImpl(OH_OHOS_MEDIAQUERY_mediaquery_MediaQueryListenerHandle thisPtr) {
}
OH_Boolean mediaquery_MediaQueryListener_getMatchesImpl(OH_NativePointer thisPtr) {
    return {};
}
OH_String mediaquery_MediaQueryListener_getMediaImpl(OH_NativePointer thisPtr) {
    return {};
}
void mediaquery_MediaQueryListener_offChangeImpl(OH_NativePointer thisPtr, const Opt_OHOS_MEDIAQUERY_mediaquery_Callback_MediaQueryResult_Void* callback_) {
}
void mediaquery_MediaQueryListener_onChangeImpl(OH_NativePointer thisPtr, const OHOS_MEDIAQUERY_mediaquery_Callback_MediaQueryResult_Void* callback_) {
}